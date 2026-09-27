// packages/core-ai/wsCoLearningHandler.ts — WebSocket Server cho Phòng Học Nhóm Âm Thanh Thời Gian Thực
// Gắn vào http.Server tại route /ws/co-learning-room, xác thực bằng session cookie.
import type { Server as HttpServer, IncomingMessage } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { isAllowedWebSocketOrigin, validateAuth } from '@dhcb/core-auth/security'
import {
  processAudioChunk,
  joinAudioRoom,
  leaveAudioRoom,
  setMemberMuted,
  requestAiSocraticHint,
  subscribeToRoomEvents,
  getAudioRoom,
  type AudioRoomEventHandler,
} from './audioCoLearningService.js'
import {
  WsCoLearningClientMessageSchema,
  MAX_AUDIO_CHUNK_BYTES,
  MAX_CO_LEARNING_MESSAGE_BYTES,
  type WsCoLearningClientMessage,
} from '@dhcb/core-contracts/audioCoLearningRoom'

export const WS_CO_LEARNING_PATH = '/ws/co-learning-room'

interface SocketSession {
  ws: WebSocket
  userId: string
  displayName: string
  currentRoomId: string | null
  unsubscribeFromRoom?: () => void
}

// Theo dõi socket theo kết nối và theo userId
const activeSocketSessions = new Map<WebSocket, SocketSession>()
const userSockets = new Map<string, Set<WebSocket>>()

async function authenticateUpgrade(req: IncomingMessage): Promise<{ userId: string } | null> {
  const cookie = req.headers.cookie ?? ''
  const fakeRequest = new Request('http://localhost' + WS_CO_LEARNING_PATH, { headers: { cookie } })
  return validateAuth(fakeRequest)
}

export function _resetWsCoLearningHandlerStateForTests(): void {
  for (const session of activeSocketSessions.values()) {
    if (session.unsubscribeFromRoom) {
      session.unsubscribeFromRoom()
    }
  }
  activeSocketSessions.clear()
  userSockets.clear()
}

/** Gắn WebSocket server phòng học nhóm âm thanh vào httpServer */
export function attachCoLearningWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_CO_LEARNING_MESSAGE_BYTES })

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    if (url.pathname !== WS_CO_LEARNING_PATH) return // Nhường các WebSocket route khác
    // Chống Cross-Site WebSocket Hijacking: chỉ nhận upgrade từ origin tin cậy (vá 2026-09-27).
    if (!isAllowedWebSocketOrigin(req.headers.origin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    authenticateUpgrade(req)
      .then((auth) => {
        if (!auth) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
          socket.destroy()
          return
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req, auth)
        })
      })
      .catch((err) => {
        console.error('[wsCoLearningHandler] Upgrade error:', err)
        socket.destroy()
      })
  })

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, auth: { userId: string }) => {
    const session: SocketSession = {
      ws,
      userId: auth.userId,
      displayName: `Learner_${auth.userId.slice(0, 5)}`,
      currentRoomId: null,
    }

    activeSocketSessions.set(ws, session)
    if (!userSockets.has(auth.userId)) {
      userSockets.set(auth.userId, new Set())
    }
    userSockets.get(auth.userId)!.add(ws)

    ws.on('message', (rawData, isBinary) => {
      try {
        if (isBinary) {
          // Xử lý audio binary trực tiếp
          if (session.currentRoomId) {
            const buf = Buffer.from(rawData as Buffer)
            if (buf.length > MAX_AUDIO_CHUNK_BYTES) return
            const b64 = buf.toString('base64')
            const { relayTo, shouldTriggerAiModerator } = processAudioChunk({
              roomId: session.currentRoomId,
              senderPersonId: session.userId,
              audioBase64: b64,
            })

            // Relay audio chunk đến các peers
            for (const peerId of relayTo) {
              const peers = userSockets.get(peerId)
              if (peers) {
                const packet = JSON.stringify({
                  type: 'peer_audio_chunk',
                  senderId: session.userId,
                  senderName: session.displayName,
                  audioBase64: b64,
                  timestamp: Date.now(),
                })
                for (const peerWs of peers) {
                  if (peerWs.readyState === WebSocket.OPEN) {
                    peerWs.send(packet)
                  }
                }
              }
            }

            if (shouldTriggerAiModerator) {
              // Không chặn luồng relay; service giữ khóa và kiểm hạn mức trước gọi provider.
              void requestAiSocraticHint(session.currentRoomId, session.userId, 'probing_reasons')
            }
          }
          return
        }

        const parsed = JSON.parse(rawData.toString())
        const validation = WsCoLearningClientMessageSchema.safeParse(parsed)
        if (!validation.success) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
          return
        }

        const msg: WsCoLearningClientMessage = validation.data

        switch (msg.type) {
          case 'join_room': {
            // Rời room cũ nếu có
            if (session.currentRoomId) {
              if (session.unsubscribeFromRoom) session.unsubscribeFromRoom()
              leaveAudioRoom(session.currentRoomId, session.userId)
            }

            session.displayName = msg.displayName
            session.currentRoomId = msg.roomId

            const joinResult = joinAudioRoom({
              roomId: msg.roomId,
              personId: session.userId,
              displayName: msg.displayName,
            })

            if (!joinResult.success) {
              ws.send(
                JSON.stringify({ type: 'error', message: joinResult.error ?? 'Cannot join room' }),
              )
              session.currentRoomId = null
              return
            }

            // Đăng ký nhận events từ room
            const eventHandler: AudioRoomEventHandler = (event) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'room_event', event }))
              }
            }
            session.unsubscribeFromRoom = subscribeToRoomEvents(msg.roomId, eventHandler)

            ws.send(
              JSON.stringify({
                type: 'joined_room_success',
                roomId: msg.roomId,
                roomState: joinResult.room,
              }),
            )
            break
          }

          case 'leave_room': {
            if (session.currentRoomId === msg.roomId) {
              if (session.unsubscribeFromRoom) session.unsubscribeFromRoom()
              leaveAudioRoom(msg.roomId, session.userId)
              session.currentRoomId = null
              ws.send(JSON.stringify({ type: 'left_room_success', roomId: msg.roomId }))
            }
            break
          }

          case 'audio_chunk': {
            if (session.currentRoomId === msg.roomId) {
              const { relayTo, shouldTriggerAiModerator } = processAudioChunk({
                roomId: msg.roomId,
                senderPersonId: session.userId,
                audioBase64: msg.audioBase64,
                audioLevel: msg.audioLevel,
              })

              for (const peerId of relayTo) {
                const peers = userSockets.get(peerId)
                if (peers) {
                  const packet = JSON.stringify({
                    type: 'peer_audio_chunk',
                    senderId: session.userId,
                    senderName: session.displayName,
                    audioBase64: msg.audioBase64,
                    audioLevel: msg.audioLevel,
                    timestamp: Date.now(),
                  })
                  for (const peerWs of peers) {
                    if (peerWs.readyState === WebSocket.OPEN) {
                      peerWs.send(packet)
                    }
                  }
                }
              }

              if (shouldTriggerAiModerator) {
                void requestAiSocraticHint(msg.roomId, session.userId, 'probing_assumptions')
              }
            }
            break
          }

          case 'toggle_mute': {
            if (session.currentRoomId === msg.roomId) {
              setMemberMuted(msg.roomId, session.userId, msg.isMuted)
            }
            break
          }

          case 'chat_message': {
            if (session.currentRoomId === msg.roomId) {
              const room = getAudioRoom(msg.roomId)
              if (room) {
                const packet = JSON.stringify({
                  type: 'room_chat_message',
                  roomId: msg.roomId,
                  senderId: session.userId,
                  senderName: session.displayName,
                  content: msg.content,
                  timestamp: Date.now(),
                })
                // Broadcast cho all members trong room
                for (const member of room.members) {
                  const peers = userSockets.get(member.personId)
                  if (peers) {
                    for (const peerWs of peers) {
                      if (peerWs.readyState === WebSocket.OPEN) {
                        peerWs.send(packet)
                      }
                    }
                  }
                }
              }
            }
            break
          }

          case 'request_ai_hint': {
            if (session.currentRoomId === msg.roomId) {
              void requestAiSocraticHint(msg.roomId, session.userId, 'clarification', 'manual')
            }
            break
          }
        }
      } catch (err) {
        console.error('[wsCoLearningHandler] Error handling message:', err)
      }
    })

    const handleClose = () => {
      if (session.currentRoomId) {
        if (session.unsubscribeFromRoom) session.unsubscribeFromRoom()
        leaveAudioRoom(session.currentRoomId, session.userId)
      }
      activeSocketSessions.delete(ws)
      const userSet = userSockets.get(session.userId)
      if (userSet) {
        userSet.delete(ws)
        if (userSet.size === 0) userSockets.delete(session.userId)
      }
    }

    ws.on('close', handleClose)
    ws.on('error', handleClose)
  })
}
