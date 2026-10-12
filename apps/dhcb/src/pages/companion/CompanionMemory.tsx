// CompanionMemory.tsx — Trang "Bạn Đồng Hành nhớ gì về tôi" (`/ban-dong-hanh/ky-uc`, GĐ2a).
//
// Người dùng thấy đúng những gì Companion đang nhớ, sửa hoặc "quên" từng mục, và hai công tắc
// (ký ức · lịch sử) phản ánh đúng hai consent ở server. Bốn trạng thái tách bạch: tải / rỗng /
// lỗi / danh sách; ký ức mức nhạy cảm cần 2FA → hiện lối đi, không quay vòng. KHÔNG hiện
// `importance` — đó là tham số xếp hạng, không phải "điểm" của người (Luật số 1 sản phẩm).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import type { CompanionMemorySettings } from '@dhcb/core-contracts/consentGrant'
import type { MemoryNamespace, MemoryRecord } from '@dhcb/core-contracts/personalMemory'
import Layout from '../../components/Layout'
import LoadError from '../../components/LoadError'
import { MemorySwitch } from '../../components/CompanionStudios/MemoryConsentCard'
import { PageShell } from '@core/PageShell'
import { buttonClass } from '@core/buttonStyles'
import { useToast } from '@core/ToastProvider'
import { usePageTitle } from '../../lib/usePageTitle'
import {
  CompanionMemoryApiError,
  fetchCompanionMemorySettings,
  fetchMemories,
  forgetMemory,
  updateCompanionMemorySettings,
  updateMemory,
} from '../../lib/companionMemoryApi'

const NAMESPACE_LABEL: Record<MemoryNamespace, string> = {
  semantic: 'Về bạn',
  episodic: 'Chuyện đã kể',
  preference: 'Sở thích',
  commitment: 'Cam kết',
  domain: 'Môn học',
}

const MAX_CONTENT = 2000

type ListState =
  | { kind: 'loading' }
  | { kind: 'ready'; records: MemoryRecord[] }
  | { kind: 'error' }
  | { kind: 'two_factor'; code: 'TWO_FACTOR_SETUP_REQUIRED' | 'STEP_UP_REQUIRED' }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function CompanionMemory() {
  usePageTitle('Bạn Đồng Hành nhớ gì về tôi | Đồng Hành Cùng Bạn')
  const toast = useToast()
  const [settings, setSettings] = useState<CompanionMemorySettings | null>(null)
  const [settingsError, setSettingsError] = useState(false)
  const [savingSwitch, setSavingSwitch] = useState(false)
  const [list, setList] = useState<ListState>({ kind: 'loading' })
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Tải lại = tăng `reloadKey`; hàm tải nằm TRONG effect (khuôn ActionCanvas.tsx) và chỉ ghi
  // state sau await — không setState đồng bộ trong effect (`react-hooks/set-state-in-effect`).
  const retryList = () => {
    setList({ kind: 'loading' })
    setReloadKey((k) => k + 1)
  }

  useEffect(() => {
    let mounted = true
    void fetchCompanionMemorySettings()
      .then((s) => mounted && setSettings(s))
      .catch(() => mounted && setSettingsError(true))
    const loadList = async () => {
      try {
        const records = await fetchMemories()
        if (!mounted) return
        setList({ kind: 'ready', records: records.filter((r) => r.status !== 'expired') })
      } catch (err) {
        if (!mounted) return
        if (err instanceof CompanionMemoryApiError && err.code) {
          setList({ kind: 'two_factor', code: err.code })
        } else {
          setList({ kind: 'error' })
        }
      }
    }
    void loadList()
    return () => {
      mounted = false
    }
  }, [reloadKey])

  const changeSwitch = async (patch: Partial<CompanionMemorySettings>) => {
    if (savingSwitch) return
    setSavingSwitch(true)
    try {
      setSettings(await updateCompanionMemorySettings(patch))
    } catch {
      toast.error('Chưa lưu được cài đặt. Thử lại nhé.')
    } finally {
      setSavingSwitch(false)
    }
  }

  const saveEdit = async (record: MemoryRecord) => {
    if (!editing || busyId) return
    const content = editing.content.trim()
    if (!content) {
      toast.error('Nội dung không được để trống.')
      return
    }
    setBusyId(record.id)
    try {
      const updated = await updateMemory(record.id, content, record.version)
      setList((prev) =>
        prev.kind === 'ready'
          ? {
              kind: 'ready',
              records: prev.records.map((r) =>
                r.id === record.id ? { ...r, content, version: updated.version } : r,
              ),
            }
          : prev,
      )
      setEditing(null)
      toast.success('Đã sửa ký ức.')
    } catch (err) {
      toast.error(
        err instanceof CompanionMemoryApiError && err.status === 409
          ? 'Ký ức này vừa được đổi ở nơi khác. Tải lại rồi sửa tiếp nhé.'
          : 'Chưa sửa được. Thử lại nhé.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const forget = async (record: MemoryRecord) => {
    if (busyId) return
    if (!window.confirm('Bạn Đồng Hành sẽ quên ký ức này. Tiếp tục?')) return
    setBusyId(record.id)
    try {
      await forgetMemory(record.id, record.version)
      setList((prev) =>
        prev.kind === 'ready'
          ? { kind: 'ready', records: prev.records.filter((r) => r.id !== record.id) }
          : prev,
      )
      toast.success('Đã quên.')
    } catch {
      toast.error('Chưa quên được. Thử lại nhé.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <Layout back={true} title="Bạn Đồng Hành nhớ gì về tôi" />
      <PageShell>
        <h1 className="sr-only">Bạn Đồng Hành nhớ gì về tôi</h1>

        <section
          aria-labelledby="memory-settings-heading"
          className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4"
        >
          <h2 id="memory-settings-heading" className="text-base font-semibold text-white">
            Hai công tắc
          </h2>
          {settingsError && !settings ? (
            <LoadError
              message="Không tải được cài đặt ký ức."
              onRetry={() => {
                setSettingsError(false)
                setList({ kind: 'loading' })
                setReloadKey((k) => k + 1)
              }}
            />
          ) : (
            <>
              <MemorySwitch
                id="switch-remember"
                label="Nhớ về tôi"
                description="Ký ức đã lưu, hồ sơ và mục tiêu được đưa vào ngữ cảnh mỗi lượt trò chuyện."
                checked={settings?.rememberMemories ?? false}
                disabled={!settings || savingSwitch}
                onChange={(next) => void changeSwitch({ rememberMemories: next })}
              />
              <MemorySwitch
                id="switch-history"
                label="Dùng lịch sử trò chuyện"
                description="Bạn Đồng Hành đọc lại vài lượt gần nhất để nối tiếp câu chuyện."
                checked={settings?.useHistory ?? false}
                disabled={!settings || savingSwitch}
                onChange={(next) => void changeSwitch({ useHistory: next })}
              />
            </>
          )}
          <p className="text-xs text-zinc-400">
            Tắt công tắc là ngừng đọc ngay ở lượt sau; ký ức vẫn còn ở đây để bạn xem, sửa hoặc
            quên. Muốn một lượt không để lại gì, bật "Phiên không lưu" trong{' '}
            <Link
              to="/ban-dong-hanh"
              className="underline underline-offset-2 text-accent-300 theme-light:text-accent-800"
            >
              phòng trò chuyện
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="memory-list-heading" className="mt-6 space-y-3">
          <h2 id="memory-list-heading" className="text-base font-semibold text-white">
            Những điều đang nhớ
          </h2>

          {list.kind === 'loading' && (
            <p role="status" className="text-sm text-zinc-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Đang tải ký ức…
            </p>
          )}

          {list.kind === 'error' && (
            <LoadError message="Không tải được danh sách ký ức." onRetry={retryList} />
          )}

          {list.kind === 'two_factor' && (
            <div
              role="alert"
              className="rounded-2xl border border-amber-500/40 bg-amber-950/30 theme-light:bg-amber-50 p-4 text-sm text-zinc-100 space-y-2"
            >
              <p>
                {list.code === 'TWO_FACTOR_SETUP_REQUIRED'
                  ? 'Có ký ức ở mức riêng tư cao. Bật xác thực hai bước trong trang cá nhân để xem.'
                  : 'Có ký ức ở mức riêng tư cao. Xác minh lại bằng mã hai bước rồi quay lại trang này.'}
              </p>
              <Link to="/trang-ca-nhan" className={buttonClass({ variant: 'outline', size: 'sm' })}>
                Mở trang cá nhân
              </Link>
            </div>
          )}

          {list.kind === 'ready' && list.records.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-6 text-center">
              <p className="text-sm text-zinc-200">Chưa có ký ức nào.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Khi bạn nói "ghi nhớ…" trong phòng trò chuyện và xác nhận, ký ức sẽ xuất hiện ở đây.
              </p>
            </div>
          )}

          {list.kind === 'ready' && list.records.length > 0 && (
            <ul className="space-y-2">
              {list.records.map((record) => {
                const isEditing = editing?.id === record.id
                const busy = busyId === record.id
                return (
                  <li
                    key={record.id}
                    className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-200">
                        {NAMESPACE_LABEL[record.namespace]}
                      </span>
                      <time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <label htmlFor={`edit-${record.id}`} className="sr-only">
                          Sửa ký ức
                        </label>
                        <textarea
                          id={`edit-${record.id}`}
                          value={editing.content}
                          maxLength={MAX_CONTENT}
                          rows={3}
                          onChange={(e) => setEditing({ id: record.id, content: e.target.value })}
                          className="w-full rounded-xl bg-zinc-950 border border-zinc-700 p-2 text-sm text-zinc-100"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void saveEdit(record)}
                            className={buttonClass({ variant: 'primary', size: 'sm' })}
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditing(null)}
                            className={buttonClass({ variant: 'outline', size: 'sm' })}
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-zinc-100 whitespace-pre-wrap">
                          {record.content}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setEditing({ id: record.id, content: record.content })}
                            className={buttonClass({ variant: 'outline', size: 'sm' })}
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void forget(record)}
                            className={buttonClass({ variant: 'outline', size: 'sm' })}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Quên
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </PageShell>
    </>
  )
}
