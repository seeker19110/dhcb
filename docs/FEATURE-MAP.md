<!-- FILE NÀY ĐƯỢC SINH TỰ ĐỘNG — đừng sửa tay. Chạy: npm run gen:feature-map -->

# FEATURE-MAP — bản đồ tính năng nền tảng DHCB

Nguồn: `apps/dhcb/src/App.tsx` (route giao diện) + `apps/server/src/routes.ts` (endpoint API).
Dùng để **đối chiếu chéo tính năng** trong audit toàn diện (Nhóm 12): một tính năng có màn hình
mà không có API, hoặc có API mà không màn hình nào gọi, là dấu hiệu việc làm dở dang.

Tổng: **104 route giao diện** · **111 endpoint API**.

## Route giao diện theo trụ

### `/:subjectId` — 1 route

- `/:subjectId`

### `/(gốc)` — 1 route

- `/`

### `/*` — 1 route

- `*`

### `/action-canvas` — 1 route

- `/action-canvas`

### `/admin-s` — 1 route

- `/admin-s`

### `/agent-ban-dong-hanh` — 1 route

- `/agent-ban-dong-hanh`

### `/applied-knowledge` — 1 route

- `/applied-knowledge`

### `/avatar-demo` — 1 route

- `/avatar-demo`

### `/bai-hoc` — 1 route

- `/bai-hoc`

### `/ban-be` — 1 route

- `/ban-be`

### `/ban-dong-hanh` — 1 route

- `/ban-dong-hanh`

### `/bat-dau` — 1 route

- `/bat-dau`

### `/cai-dat` — 1 route

- `/cai-dat`

### `/career` — 2 route

- `/career`
- `/career/interview`

### `/cau-thong-dung` — 1 route

- `/cau-thong-dung`

### `/companion` — 1 route

- `/companion`

### `/cong-viec` — 1 route

- `/cong-viec`

### `/cong-viec-cua-toi` — 1 route

- `/cong-viec-cua-toi`

### `/cong-viec-cuoc-song` — 1 route

- `/cong-viec-cuoc-song`

### `/cuoc-song` — 1 route

- `/cuoc-song`

### `/cuoc-song-cua-toi` — 1 route

- `/cuoc-song-cua-toi`

### `/dong-hanh` — 1 route

- `/dong-hanh`

### `/english` — 1 route

- `/english`

### `/gioi-thieu` — 1 route

- `/gioi-thieu`

### `/hoc-cong-viec` — 1 route

- `/hoc-cong-viec`

### `/hoc-cuoc-song` — 1 route

- `/hoc-cuoc-song`

### `/hoc-khoi-nghiep` — 1 route

- `/hoc-khoi-nghiep`

### `/hoc-mon-hoc` — 2 route

- `/hoc-mon-hoc`
- `/hoc-mon-hoc/:subjectId`

### `/hoc-su-nghiep` — 1 route

- `/hoc-su-nghiep`

### `/hoc-tieng-anh` — 1 route

- `/hoc-tieng-anh`

### `/ket-ban` — 1 route

- `/ket-ban/:code`

### `/khoi-nghiep` — 1 route

- `/khoi-nghiep`

### `/lap-trinh` — 15 route

- `/lap-trinh`
- `/lap-trinh/:levelId`
- `/lap-trinh/bai-hoc/:lessonId`
- `/lap-trinh/chay-thu`
- `/lap-trinh/du-an`
- `/lap-trinh/gioi-thieu`
- `/lap-trinh/huong`
- `/lap-trinh/huong/:specId`
- `/lap-trinh/huong/:specId/:stageId`
- `/lap-trinh/khoa-hoc/:courseId`
- `/lap-trinh/khoa/:courseId`
- `/lap-trinh/lo-trinh/:pathId`
- `/lap-trinh/lo-trinh/:pathId/chan-doan`
- `/lap-trinh/lo-trinh/:pathId/chang/:stageId`
- `/lap-trinh/on-tap`

### `/learn-vietnamese` — 1 route

- `/learn-vietnamese`

### `/lich-su-hoc` — 1 route

- `/lich-su-hoc`

### `/life` — 3 route

- `/life`
- `/life/wheel`
- `/life/wheel-of-life`

### `/life-graph` — 1 route

- `/life-graph`

### `/lo-trinh-hoc` — 2 route

- `/lo-trinh-hoc`
- `/lo-trinh-hoc/:levelId`

### `/login` — 1 route

- `/login`

### `/luyen-nghe` — 1 route

- `/luyen-nghe`

### `/luyen-noi` — 1 route

- `/luyen-noi`

### `/luyen-tap` — 1 route

- `/luyen-tap`

### `/luyen-viet` — 1 route

- `/luyen-viet`

### `/mo-phong` — 1 route

- `/mo-phong`

### `/mon-hoc` — 3 route

- `/mon-hoc`
- `/mon-hoc/:subjectId`
- `/mon-hoc/programming`

### `/nang-cap` — 1 route

- `/nang-cap`

### `/nhiem-vu` — 1 route

- `/nhiem-vu`

### `/nhom-di-chung` — 2 route

- `/nhom-di-chung`
- `/nhom-di-chung/:code`

### `/on-thi` — 1 route

- `/on-thi`

### `/onboarding` — 1 route

- `/onboarding`

### `/phong-hoc` — 2 route

- `/phong-hoc`
- `/phong-hoc/:subjectId`

### `/phong-luyen-tap` — 1 route

- `/phong-luyen-tap`

### `/placement` — 1 route

- `/placement`

### `/profile` — 1 route

- `/profile`

### `/programming` — 1 route

- `/programming`

### `/reset-password` — 1 route

- `/reset-password`

### `/simulators` — 1 route

- `/simulators`

### `/so-tay-loi-sai` — 1 route

- `/so-tay-loi-sai`

### `/startup` — 2 route

- `/startup`
- `/startup/canvas`

### `/su-nghiep` — 1 route

- `/su-nghiep`

### `/su-nghiep-cua-toi` — 1 route

- `/su-nghiep-cua-toi`

### `/su-nghiep-khoi-nghiep` — 1 route

- `/su-nghiep-khoi-nghiep`

### `/subjects` — 2 route

- `/subjects`
- `/subjects/:subjectId`

### `/thu-thach` — 1 route

- `/thu-thach`

### `/tien-do` — 1 route

- `/tien-do`

### `/tieng-anh` — 1 route

- `/tieng-anh`

### `/tin-nhan` — 1 route

- `/tin-nhan`

### `/toi-khoi-nghiep` — 1 route

- `/toi-khoi-nghiep`

### `/trang-ca-nhan` — 1 route

- `/trang-ca-nhan`

### `/tro-truyen` — 1 route

- `/tro-truyen`

### `/truyen-song-ngu` — 2 route

- `/truyen-song-ngu`
- `/truyen-song-ngu/:id`

### `/tu-dien` — 1 route

- `/tu-dien`

### `/tu-vung` — 1 route

- `/tu-vung/:word`

### `/ung-dung-thuc-te` — 1 route

- `/ung-dung-thuc-te`

### `/welcome` — 1 route

- `/welcome`

### `/work` — 2 route

- `/work`
- `/work/kanban`

### `/workspace` — 1 route

- `/workspace`

## Endpoint API theo trụ

### `/api/a2a` — 1 endpoint

- `/api/a2a`

### `/api/achievements` — 1 endpoint

- `/api/achievements`

### `/api/acoustic-phonetics` — 1 endpoint

- `/api/acoustic-phonetics`

### `/api/action-canvas` — 1 endpoint

- `/api/action-canvas`

### `/api/admin-achievement-rewards` — 1 endpoint

- `/api/admin-achievement-rewards`

### `/api/admin-feature-status` — 1 endpoint

- `/api/admin-feature-status`

### `/api/admin-feedback` — 1 endpoint

- `/api/admin-feedback`

### `/api/admin-grant-plan` — 1 endpoint

- `/api/admin-grant-plan`

### `/api/admin-intake-stats` — 1 endpoint

- `/api/admin-intake-stats`

### `/api/admin-payments` — 1 endpoint

- `/api/admin-payments`

### `/api/admin-plan-features` — 1 endpoint

- `/api/admin-plan-features`

### `/api/admin-plan-marketing` — 1 endpoint

- `/api/admin-plan-marketing`

### `/api/admin-price-promo` — 1 endpoint

- `/api/admin-price-promo`

### `/api/admin-reserved-names` — 1 endpoint

- `/api/admin-reserved-names`

### `/api/admin-settings` — 1 endpoint

- `/api/admin-settings`

### `/api/admin-system-control` — 1 endpoint

- `/api/admin-system-control`

### `/api/admin-tts-cache` — 1 endpoint

- `/api/admin-tts-cache`

### `/api/admin-usage-stats` — 1 endpoint

- `/api/admin-usage-stats`

### `/api/admin-users` — 1 endpoint

- `/api/admin-users`

### `/api/admin-vip-whitelist` — 1 endpoint

- `/api/admin-vip-whitelist`

### `/api/agent` — 1 endpoint

- `/api/agent`

### `/api/agent-orchestrator` — 1 endpoint

- `/api/agent-orchestrator`

### `/api/ambient-vision` — 1 endpoint

- `/api/ambient-vision`

### `/api/analytics` — 1 endpoint

- `/api/analytics`

### `/api/analytics-summary` — 1 endpoint

- `/api/analytics-summary`

### `/api/app-settings` — 1 endpoint

- `/api/app-settings`

### `/api/articulatory-phonetics` — 1 endpoint

- `/api/articulatory-phonetics`

### `/api/auth` — 1 endpoint

- `/api/auth`

### `/api/automation` — 1 endpoint

- `/api/automation`

### `/api/avatar-embodiment` — 1 endpoint

- `/api/avatar-embodiment`

### `/api/avatar-visemes` — 1 endpoint

- `/api/avatar-visemes`

### `/api/career` — 1 endpoint

- `/api/career`

### `/api/career-interview` — 1 endpoint

- `/api/career-interview`

### `/api/challenge` — 1 endpoint

- `/api/challenge`

### `/api/chat` — 1 endpoint

- `/api/chat`

### `/api/checkout` — 1 endpoint

- `/api/checkout`

### `/api/co-learning-audio` — 1 endpoint

- `/api/co-learning-audio`

### `/api/companion` — 1 endpoint

- `/api/companion`

### `/api/companion-link` — 1 endpoint

- `/api/companion-link`

### `/api/consents` — 1 endpoint

- `/api/consents`

### `/api/context-package` — 1 endpoint

- `/api/context-package`

### `/api/debate-arena` — 1 endpoint

- `/api/debate-arena`

### `/api/decision-ledger` — 1 endpoint

- `/api/decision-ledger`

### `/api/dictionary` — 1 endpoint

- `/api/dictionary`

### `/api/echo-shadowing` — 1 endpoint

- `/api/echo-shadowing`

### `/api/exam-plan` — 1 endpoint

- `/api/exam-plan`

### `/api/feedback` — 1 endpoint

- `/api/feedback`

### `/api/friends` — 1 endpoint

- `/api/friends`

### `/api/gemini-live` — 1 endpoint

- `/api/gemini-live`

### `/api/health` — 1 endpoint

- `/api/health/deep`

### `/api/history` — 1 endpoint

- `/api/history`

### `/api/hub-stats` — 1 endpoint

- `/api/hub-stats`

### `/api/intake` — 1 endpoint

- `/api/intake`

### `/api/integrations` — 1 endpoint

- `/api/integrations`

### `/api/leaderboard` — 1 endpoint

- `/api/leaderboard`

### `/api/learning-read-model` — 1 endpoint

- `/api/learning-read-model`

### `/api/life` — 1 endpoint

- `/api/life`

### `/api/life-goals` — 1 endpoint

- `/api/life-goals`

### `/api/life-graph` — 1 endpoint

- `/api/life-graph`

### `/api/life-synthesis` — 1 endpoint

- `/api/life-synthesis`

### `/api/location` — 1 endpoint

- `/api/location`

### `/api/memories` — 1 endpoint

- `/api/memories`

### `/api/memory-palace` — 1 endpoint

- `/api/memory-palace`

### `/api/mesh-telemetry` — 1 endpoint

- `/api/mesh-telemetry`

### `/api/metacognitive-reflection` — 1 endpoint

- `/api/metacognitive-reflection`

### `/api/mistakes` — 1 endpoint

- `/api/mistakes`

### `/api/neural-curriculum` — 1 endpoint

- `/api/neural-curriculum`

### `/api/neuro-affective` — 1 endpoint

- `/api/neuro-affective`

### `/api/payment-history` — 1 endpoint

- `/api/payment-history`

### `/api/payment-status` — 1 endpoint

- `/api/payment-status`

### `/api/payment-webhook` — 1 endpoint

- `/api/payment-webhook`

### `/api/personal-facts` — 1 endpoint

- `/api/personal-facts`

### `/api/personal-policies` — 1 endpoint

- `/api/personal-policies`

### `/api/persons` — 1 endpoint

- `/api/persons`

### `/api/plan-features` — 1 endpoint

- `/api/plan-features`

### `/api/plan-marketing` — 1 endpoint

- `/api/plan-marketing`

### `/api/plan-prices` — 1 endpoint

- `/api/plan-prices`

### `/api/proactive-agent` — 1 endpoint

- `/api/proactive-agent`

### `/api/proactive-briefing` — 1 endpoint

- `/api/proactive-briefing`

### `/api/profile` — 1 endpoint

- `/api/profile`

### `/api/programming` — 8 endpoint

- `/api/programming/feedback`
- `/api/programming/path-artifact`
- `/api/programming/path-progress`
- `/api/programming/path-quiz`
- `/api/programming/progress`
- `/api/programming/project`
- `/api/programming/specialization`
- `/api/programming/ts-check`

### `/api/progress` — 1 endpoint

- `/api/progress`

### `/api/pronounce-assess` — 1 endpoint

- `/api/pronounce-assess`

### `/api/pronunciation` — 1 endpoint

- `/api/pronunciation`

### `/api/proposed-actions` — 1 endpoint

- `/api/proposed-actions`

### `/api/push` — 1 endpoint

- `/api/push`

### `/api/pvp-arena` — 1 endpoint

- `/api/pvp-arena`

### `/api/quests` — 1 endpoint

- `/api/quests`

### `/api/referral` — 1 endpoint

- `/api/referral`

### `/api/scenario-holodeck` — 1 endpoint

- `/api/scenario-holodeck`

### `/api/socratic-diagnostics` — 1 endpoint

- `/api/socratic-diagnostics`

### `/api/startup` — 1 endpoint

- `/api/startup`

### `/api/stem-scratchpad` — 1 endpoint

- `/api/stem-scratchpad`

### `/api/stt` — 1 endpoint

- `/api/stt`

### `/api/subconscious` — 1 endpoint

- `/api/subconscious`

### `/api/subjects` — 1 endpoint

- `/api/subjects`

### `/api/tts` — 1 endpoint

- `/api/tts`

### `/api/tutor-feedback` — 1 endpoint

- `/api/tutor-feedback`

### `/api/two-factor` — 1 endpoint

- `/api/two-factor`

### `/api/usage-summary` — 1 endpoint

- `/api/usage-summary`

### `/api/vision-solve` — 1 endpoint

- `/api/vision-solve`

### `/api/wearables-sync` — 1 endpoint

- `/api/wearables-sync`

### `/api/work` — 1 endpoint

- `/api/work`

### `/api/workplace-insights` — 1 endpoint

- `/api/workplace-insights`
