# Bằng chứng tái hiện bốn phát hiện Cao — 2026-10-26

Mã được audit: `c561b67b72a697f41035f489bb7bf5967e5c6b40`. Các file `*.txt` lưu bản tái hiện
đã loại bỏ phụ thuộc đường dẫn instance; chúng là tài liệu, không được bộ test mặc định thu thập.
Chúng không chứa credential thật, token phiên thật, dữ liệu người dùng hay kết quả provider thật.

| ID             | File nguồn bằng chứng                             | Kết quả tại SHA được audit                                        |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `AUD-DATA-001` | `progress.test.ts.txt`, `progress.config.mjs.txt` | Gate đỏ: hai sync đầu ghi đè; hai đối chứng đạt                   |
| `AUD-SEC-001`  | `policy.mts.txt`                                  | Gate đỏ: context loại ghi chú DENY nhưng tool vẫn trả lại         |
| `AUD-CFG-001`  | `breaker.mts.txt`                                 | Gate đỏ: khách gọi chat/STT khi breaker bật; các đối chứng đạt    |
| `AUD-DATA-002` | `restore-safe-repro.sh.txt`                       | Gate đỏ: SQL lỗi/gzip hỏng vẫn exit 0; hai đối chứng trả lỗi đúng |

`OBSERVED.md` giữ kết quả tối thiểu từ lần chạy bundle ở một thư mục tạm mới. Chi tiết kiểm tra
mức Trung và các ảnh/log bổ trợ còn ở instance onboarding, không được đóng gói trong phụ lục này.
Không sử dụng phụ lục để khẳng định đã sửa lỗi hoặc đã kiểm production.

<a id="prerequisites"></a>

## Chuẩn bị

Dùng Node.js 22 (đã kiểm với 22.23.4), npm theo lockfile, Python 3, Bash, gzip và Docker daemon
cục bộ có image PostgreSQL 16. Cài dependency theo lockfile khi không có build/test khác đang chạy:

```bash
export AUDIT_REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$AUDIT_REPO_ROOT"
HUSKY=0 npm ci --no-audit --no-fund
```

Tạo PostgreSQL **disposable riêng**, chỉ mở cổng loopback. Không dùng production hoặc database
có dữ liệu cần giữ. Các fixture có chặn URL không phải loopback và tên DB không thuộc nhóm audit.
Ví dụ sau dùng container mới; nếu tên đã tồn tại, chọn tên/cổng khác thay vì xóa container cũ:

```bash
export AUDIT_PSQL_CONTAINER=dhcb-audit-20261026
export AUDIT_DATABASE_NAME=dhcb_audit_proofs
export AUDIT_PSQL_USER=postgres
export AUDIT_PG_PORT=55436

docker_local() {
  env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH \
    docker --host=unix:///var/run/docker.sock "$@"
}
docker_local run -d --name "$AUDIT_PSQL_CONTAINER" \
  --label dev.dhcb.audit=2026-10-26 \
  --publish "127.0.0.1:${AUDIT_PG_PORT}:5432" \
  -e POSTGRES_HOST_AUTH_METHOD=trust -e "POSTGRES_DB=$AUDIT_DATABASE_NAME" \
  postgres@sha256:9e2cf6287f25c3151f4c9421ccce2b17f3e60061c111a29165e0d2cdd9ff0a97

ready=0
for attempt in {1..30}; do
  if docker_local exec "$AUDIT_PSQL_CONTAINER" \
    pg_isready -h 127.0.0.1 -U "$AUDIT_PSQL_USER" -d "$AUDIT_DATABASE_NAME" >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
test "$ready" = 1
export DATABASE_URL="postgresql://postgres@127.0.0.1:${AUDIT_PG_PORT}/${AUDIT_DATABASE_NAME}"
export MIGRATE_DATABASE_URL="$DATABASE_URL"
export NODE_ENV=test
unset SKIP_AUTH
npm run migrate:pg
```

Giữ proxy/CA của nền tảng khi tải dependency/image. Nếu sandbox chặn socket Docker hoặc PostgreSQL
loopback, dùng cơ chế cấp quyền cho đúng thao tác local; không chuyển sang database/daemon từ xa.

<a id="reproduce"></a>

## Tái hiện từ một thư mục tạm mới

Đứng tại checkout và giữ các biến ở bước chuẩn bị. Các placeholder được thay khi trích xuất;
không cần `/workspace/dhcb`, helper `.dhcb-cloud/env.sh` hoặc bất kỳ script gốc của instance.
`AUDIT_SCRATCH` phải mới, rỗng và nằm ngoài checkout; script tạo symlink tới dependency đã cài.

```bash
export AUDIT_SCRATCH="$(mktemp -d)"
python3 "$AUDIT_REPO_ROOT/docs/ops/audit-evidence/2026-10-26/extract.py.txt"
export TSX_TSCONFIG_PATH="$AUDIT_REPO_ROOT/tsconfig.json"
cd "$AUDIT_REPO_ROOT"

# Chủ ý cho phép gate đỏ để vẫn chạy đủ bốn proof và giữ exit status thật.
set +e
"$AUDIT_REPO_ROOT/node_modules/.bin/vitest" run \
  --config "$AUDIT_SCRATCH/verify/progress.config.mjs" --maxWorkers=1 \
  >"$AUDIT_SCRATCH/progress.log" 2>&1
progress_exit=$?
node --import "$AUDIT_REPO_ROOT/node_modules/tsx/dist/loader.mjs" \
  "$AUDIT_SCRATCH/verify/policy.mts" >"$AUDIT_SCRATCH/policy.log" 2>&1
policy_exit=$?
node --import "$AUDIT_REPO_ROOT/node_modules/tsx/dist/loader.mjs" \
  "$AUDIT_SCRATCH/verify-ops/breaker.mts" >"$AUDIT_SCRATCH/breaker.log" 2>&1
breaker_exit=$?
bash "$AUDIT_SCRATCH/verify/restore-safe-repro.sh" >"$AUDIT_SCRATCH/restore.log" 2>&1
restore_exit=$?
set -e
printf 'progress=%s policy=%s breaker=%s restore=%s\n' \
  "$progress_exit" "$policy_exit" "$breaker_exit" "$restore_exit"
```

Tại SHA được audit, cả bốn exit dự kiến là **1** do assertion phát hiện hành vi sai. Không coi mọi
exit 1 là bằng chứng: phải đọc log và thấy các đối chứng đã đạt trước đúng assertion regression.
Lỗi dependency, kết nối, timeout hoặc không tạo được fixture không phải là tái hiện thành công.

- **Progress:** 2 đối chứng đạt: sync tuần tự và sync đồng thời khi đã có hàng. Regression đỏ:
  hai request đầu đều 200, `conflict=false`, nhưng DB chỉ giữ một từ thay vì hợp `cat` + `dog`.
  Barrier chỉ trì hoãn đọc rỗng tối đa 250 ms; không bắt implementation sau sửa phải đọc rỗng hai lần,
  nên cách sửa tạo/khóa hàng ổn định hoặc advisory lock không bị fixture giữ chờ vô hạn.
- **Privacy:** trước DENY context và tool đều có marker; user khác không đọc marker. Sau policy
  `DENY(authoritative_domain_state, inject_context, work)`, context không có marker nhưng tool còn trả
  lại; assertion cuối đỏ. Không gọi model/provider; không suy diễn lỗi IDOR.
- **Breaker:** identity thiếu trả 401; tài khoản có breaker trả 429, không tới provider; khách với
  breaker tắt tới provider giả và trả 200. Regression đỏ khi khách với breaker bật vẫn tới provider
  giả qua chat/STT. Mọi SQL/provider I/O của proof này được fake và chặn request ngoài.
- **Restore:** đọc source như văn bản để trích đúng pipeline `gunzip | psql` và flags Bash; chỉ chạy
  pipeline với SQL `SELECT` tổng hợp trong DB disposable, không import/chạy script restore, không
  DROP/CREATE. Hai đối chứng `ON_ERROR_STOP` và `pipefail` lần lượt trả 3 và 1. Source hiện tại trả
  0 cho SQL lỗi và gzip thiếu footer, nên assertion đỏ. Nếu cấu trúc command đổi ngoài hình dạng đã
  review, fixture từ chối chạy và yêu cầu review lại; không tự thực thi shell tùy ý từ source.

Sau sửa nguồn, các gate phải xanh với cùng bất biến. Gate restore đọc flags/command hiện tại,
không chỉ chạy lại một pipeline lỗi đã hardcode; nó chấp nhận sửa bằng Bash `-o pipefail` và
`psql -v ON_ERROR_STOP=1` (hoặc `--set`). Những thay đổi thiết kế khác cần cập nhật proof sau review.

<a id="safety"></a>

## Dọn và giới hạn

Progress/privacy xóa fixture theo ID tạo riêng trong `afterAll`/`finally`. Đừng force-kill giữa lúc
chạy nếu muốn bảo đảm cleanup. Log chỉ giữ dữ liệu giả; không in token hoặc env. Container ở ví dụ
là disposable được tạo riêng bởi người chạy. Chỉ dọn **đúng container mình đã tạo** sau kiểm tra nhãn:

```bash
test "$(docker_local inspect --format '{{index .Config.Labels "dev.dhcb.audit"}}' \
  "$AUDIT_PSQL_CONTAINER")" = 2026-10-26
docker_local rm -f -v "$AUDIT_PSQL_CONTAINER"
```

Không dùng lệnh này với container có sẵn của người dùng. Không chạy `restore:r2 --restore-into`
để kiểm phụ lục. Thư mục scratch chứa proof đã trích xuất và log có thể lưu lại làm artifact review;
không commit output hay database. Không sửa source/manifest/lockfile trong quá trình tái hiện.
