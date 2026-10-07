import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Cấu hình test (Vitest). Dùng happy-dom để có localStorage/window cho các hàm
// đụng tới bộ nhớ trình duyệt. Chỉ chạy file *.test.ts(x) trong src/.
// resolve.alias tách riêng khỏi vite.config.ts (2 config không merge) — @core/* phải trỏ
// đúng packages/core-ui/ như production để test không lệch alias với build thật.
export default defineConfig({
  resolve: {
    alias: [
      // @dhcb/<gói>/<file> -> packages/<gói>/<file> (source, không qua dist) — khớp tsconfig paths
      {
        find: /^@dhcb\/(.*)$/,
        replacement: fileURLToPath(new URL('./packages', import.meta.url)) + '/$1',
      },
      { find: '@core', replacement: fileURLToPath(new URL('./packages/core-ui', import.meta.url)) },
    ],
  },
  test: {
    environment: 'happy-dom',
    // scripts/**/*.test.ts = test cho tiện ích script THUẦN (vd scripts/lib/evalScoring.test.ts) —
    // không tốn API, chỉ logic. KHÔNG gồm chính script chạy AI (scripts/eval-tutor.ts) vì nó tốn phí.
    include: [
      'apps/dhcb/src/**/*.test.{ts,tsx}',
      // Cả `api/**` lẫn test nằm thẳng trong `apps/server/src/` (vd staticApps.test.ts).
      'apps/server/src/**/*.test.ts',
      // apps/hub trước đây KHÔNG được quét — 0 test nào của hub chạy trong CI dù có (AC-17,
      // S05-2). Thêm vào đây để test hub được chạy thật, không phải "viết ra rồi mồ côi".
      'apps/hub/src/**/*.test.{ts,tsx}',
      'packages/**/*.test.{ts,tsx}',
      'scripts/**/*.test.ts',
    ],
    // Mock fetch('/data/...') → đọc thẳng public/ để test chạy offline (không cần server).
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      // v8 = đo coverage bằng bộ máy V8 (nhanh, không cần biến đổi mã).
      provider: 'v8',
      // Chỉ đo phần LOGIC THUẦN (lib + api). Bỏ UI (.tsx/pages/components),
      // điểm khởi tạo (server.ts) và dữ liệu tĩnh — nơi unit test ít giá trị.
      include: [
        'apps/dhcb/src/lib/**/*.ts',
        'apps/server/src/api/**/*.ts',
        // Logic chọn app tĩnh theo Host — hàm thuần, tách khỏi server.ts để đo và test được
        // (server.ts vẫn nằm ngoài phép đo vì là điểm khởi tạo).
        'apps/server/src/staticApps.ts',
        'packages/**/*.ts',
      ],
      // Loại khỏi phép đo những file mà unit test KHÔNG mang lại giá trị thật — chúng chỉ là
      // lớp vỏ mỏng bọc API trình duyệt/nền tảng, hoặc hook React, hoặc mã khởi tạo. Test cho
      // chúng chủ yếu kiểm chứng chính cái mock ta vừa dựng, gãy mỗi lần refactor, và rủi ro
      // thật đã được E2E che. Giữ chúng trong phép đo chỉ làm loãng con số coverage.
      // (Quyết định 2026-08-03 — xem PROGRESS.md.)
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        // Chỉ khai báo kiểu, không có mã chạy.
        '**/types.ts',
        'apps/dhcb/src/lib/srsTypes.ts',
        // Vỏ bọc thiết bị ghi âm/ghi hình (MediaRecorder, getUserMedia).
        'apps/dhcb/src/lib/audioRecorder.ts',
        'apps/dhcb/src/lib/sttServer.ts',
        'apps/dhcb/src/lib/challengeRecorder.ts',
        // Vỏ bọc Web Speech API.
        'apps/dhcb/src/lib/stt.ts',
        // Vỏ bọc IndexedDB.
        'apps/dhcb/src/lib/audioCache.ts',
        'apps/dhcb/src/lib/challengeVideo.ts',
        // Vỏ bọc API trình duyệt lặt vặt (vibrate, canvas fingerprint, AudioContext, DOM effect).
        'apps/dhcb/src/lib/haptics.ts',
        'apps/dhcb/src/lib/deviceId.ts',
        'apps/dhcb/src/lib/confetti.ts',
        'apps/dhcb/src/lib/sound.ts',
        // Service worker / Web Push.
        'apps/dhcb/src/lib/pushNotif.ts',
        // Nạp trước dữ liệu & chunk — chỉ là điều phối fetch, không có logic nghiệp vụ.
        'apps/dhcb/src/lib/preloadBrowse.ts',
        'apps/dhcb/src/lib/preloadState.ts',
        'apps/dhcb/src/lib/preloader.ts',
        'apps/dhcb/src/lib/dataPrecache.ts',
        'apps/dhcb/src/lib/lazyWithRetry.ts',
        // Vỏ bọc fetch REST phía client — không có logic nghiệp vụ, đã được test E2E che.
        'apps/dhcb/src/lib/*Api.ts',
        // Hook React — thuộc phạm vi test UI, không phải unit test logic thuần.
        'apps/dhcb/src/lib/useCloudSync.ts',
        'apps/dhcb/src/lib/useOneHandedDrag.ts',
        'apps/dhcb/src/lib/useApiThrottle.ts',
        'apps/dhcb/src/lib/useChat.ts',
        'apps/dhcb/src/lib/useMountedRef.ts',
        // Hook gom tiến độ + bản đồ khoá cho mục lục (S07-2): chỉ là vỏ `useEffect` quanh
        // `fetchProgressWithState` (đã có test) — logic THẬT của cây nằm ở
        // lib/outline/*.ts và đã được test riêng.
        'apps/dhcb/src/lib/useProgrammingOutlineCtx.ts',
        'apps/dhcb/src/lib/useRealtimeVoice.ts',
        'apps/dhcb/src/lib/edgeAi/useEdgeAi.ts',
        // Worker & lưu trữ nhị phân trình duyệt (OPFS/IndexedDB).
        'apps/dhcb/src/lib/edgeAi/edgeModelStorage.ts',
        'apps/dhcb/src/lib/edgeAi/edgeAiService.ts',
        // Nạp SDK ngoài (script tag Google Maps) + vỏ bọc WebSocket/geolocation của tính năng
        // "Đi chung": logic THẬT (khoảng cách, làm mờ toạ độ, nhịp gửi tiết kiệm pin) nằm ở
        // packages/core-location/geo.ts và ĐÃ có test riêng.
        'apps/dhcb/src/lib/googleMapsLoader.ts',
        'apps/dhcb/src/lib/locationShare.ts',
        // Gửi-rồi-quên / khởi tạo SDK ngoài.
        'apps/dhcb/src/lib/analytics.ts',
        'apps/dhcb/src/lib/errorTracking.ts',
        'apps/server/src/api/_lib/sentry.ts',
        // Tạo connection pool — chạy thật cần Postgres, đã có test tích hợp che.
        'packages/core-db/pgPool.ts',
      ],
      // json-summary thêm vào bộ mặc định để `npm run budget` đọc được BIÊN ĐỘ còn lại của
      // ngưỡng coverage (scripts/check-budget-margin.ts) — audit 2026-08-25, F3.
      // MỘT khai báo duy nhất: trước đây khoá này bị viết hai lần trong cùng object, bản trên
      // bị bản dưới ghi đè im lặng (esbuild cảnh báo "Duplicate key" mỗi lượt chạy test).
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      // Sàn 90% ban đầu (quyết định người dùng 2026-08-13) NÂNG DẦN lên gần 100% (quyết định
      // người dùng 2026-09-04) — mỗi lần đo cao hơn sàn nhiều thì siết sàn theo, chừa biên độ
      // để không đỏ vì dao động nhỏ giữa các lần chạy (mock ngẫu nhiên, thứ tự file…).
      //
      // Đợt 1 (2026-09-04, PR #852): vá 3 lỗi Windows chặn coverage rồi siết theo số đo thật
      // stmts 96,36 · branches 90,71 · funcs 95,19 · lines 96,36 → sàn 95 / 90 / 94 / 95.
      //
      // Đợt 2 (2026-09-05, PR #855): 542 test nhắm nhánh chưa đi của 18 file phủ thấp nhất
      // (Kotlin/Swift, gitSim, 3 bộ mô phỏng tác tử, authService, push, clientAuth, geminiLive,
      // chemistry, cefrExam, mistakes, bashSim, locationService, tts) → 97,00 / 94,06 / 95,95 / 97,00.
      //
      // Đợt 3 (2026-09-05, PR #856 — đợt này): 33 file logic thuần (5 bộ chạy mã, 7 lib tiến độ
      // lập trình, 6 handler API trụ Learning, 4 file điều hướng/UI thuần, 2 file dữ liệu hoá học,
      // 5 trình mô phỏng). Hai đợt 2 và 3 làm SONG SONG trên hai nhánh, phủ những file khác nhau,
      // nên số dưới đây là ĐO LẠI SAU KHI GỘP — không phải số của riêng đợt nào:
      // stmts 98,32 · branches 94,53 · funcs 97,69 · lines 98,32 (573/573 file test xanh).
      // Sàn chừa 1,3–1,7 điểm biên độ để không đỏ vì dao động nhỏ giữa các lần chạy.
      //
      // Vitest 5 (2026-09-08): bộ đo V8 chuyển hẳn sang AST-aware remapping chính xác hơn;
      // cùng 12.172 test xanh, baseline theo cách đo mới là 94,51 / 90,68 / 94,61 / 94,91.
      // Hiệu chuẩn lại sàn với cùng nguyên tắc chừa khoảng 1,5 điểm — không loại thêm file và
      // không hạ coverage bằng cách bỏ test. Các lần nâng sàn tiếp theo phải dựa trên số đo v5.
      // Đây vẫn là sàn tối thiểu, KHÔNG phải mục tiêu: đừng viết ít test đi cho "vừa đủ".
      //
      // Vì sao KHÔNG đặt sàn 100: phần chưa phủ còn lại KHÔNG phải "thiếu test" mà là hai
      // loại mã mà test đơn vị không chạm tới được một cách trung thực — (a) nhánh phòng thủ
      // chết do `noUncheckedIndexedAccess` bắt viết (`?? ''`, `?? 0`) mà bất biến của chính
      // module bảo đảm không bao giờ kích hoạt, (b) vỏ bọc WebSocket/mạng sống
      // (wsGeminiLiveHandler, clientAuth…) thuộc phạm vi E2E. Ép 100
      // chỉ đẻ ra test giả kiểm chính cái mock vừa dựng.
      thresholds: {
        statements: 93,
        branches: 89,
        functions: 93,
        lines: 93,
      },
    },
  },
})
