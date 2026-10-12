#!/usr/bin/env bash
# _commit-guard.sh — hằng DÙNG CHUNG cho các hàng rào bí mật/file lớn: .claude/hooks/pre-commit-gate.sh (hook Claude
# Code), scripts/check-staged-secrets.sh (husky pre-commit — commit gõ tay/Codex) và scripts/maintenance-sweep.sh
# (quét định kỳ). Lấy từ seeker19110/project-template `scripts/_commit-guard.sh` @ 59bd1d1 (changelog 0619).
# VÌ SAO một nguồn: regex chép nguyên văn nhiều nơi thì lệch nhau — bản cũ của maintenance-sweep chỉ có
# `sk-[A-Za-z0-9]{32,}`, KHÔNG khớp khoá Anthropic `sk-ant-…` (AI chính của DHCB) vì có dấu `-`.
# CHỈ dùng để `source`; không set shell option ở đây. Test: scripts/claude-hooks.test.ts ("_commit-guard.sh").
# shellcheck disable=SC2034  # hằng dùng ở file source nó

# Chuỗi giống khoá/token thật: AWS / PEM private key / GitHub (ghp_, gho_/ghu_/ghs_/ghr_, github_pat_) / GitLab /
# Google (AIza — TTS/Gemini) / OpenAI / Anthropic / Slack (token + webhook) / Stripe / JWT / npm / SendGrid /
# Hugging Face / DigitalOcean / Azure Storage AccountKey.
# CỐ Ý KHÔNG có mẫu chung kiểu `password=`: khớp hàng loạt fixture/test/tài liệu cấu hình mẫu → dương tính giả
# chặn commit hợp lệ, người dùng quen tay --no-verify và hàng rào mất tác dụng với cả khoá thật.
# Tiền tố NGẮN (sk-ant-, sk-proj-/svcacct-/admin-, gh[ousr]_, sk_/rk_live_, npm_, SG., hf_) neo trái
# `(^|[^A-Za-z0-9])`: từ thường chứa tiền tố ở giữa (vd "task-ant-…") không bị chặn oan.
COMMIT_GUARD_SECRET_RE='(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|glpat-[A-Za-z0-9_-]{20}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{32,}|xox[baprs]-[A-Za-z0-9-]{10,}|hooks\.slack\.com/services/T[A-Za-z0-9]+/B[A-Za-z0-9]+/|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}|dop_v1_[a-f0-9]{64}|AccountKey=[A-Za-z0-9+/=]{40,}|(^|[^A-Za-z0-9])(sk-ant-[A-Za-z0-9_-]{20,}|sk-(proj|svcacct|admin)-[A-Za-z0-9_-]{20,}|gh[ousr]_[A-Za-z0-9]{36,}|(sk|rk)_live_[A-Za-z0-9]{20,}|npm_[A-Za-z0-9]{36}|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}|hf_[A-Za-z0-9]{34}))'

# Dòng THÊM của `git diff -U0` (stdin → stdout), kể cả dòng nội dung bắt đầu bằng '+' (thành '++…' trong diff).
# Header '+++ b/…' loại theo VỊ TRÍ (trước '@@' đầu tiên của mỗi file), không theo nội dung.
commit_guard_added_lines() { awk '/^diff --git /{h=0} /^@@/{h=1; next} h && /^\+/'; }

# File MỚI lớn hơn ngưỡng này (byte, 1 MB) không nên vào git. CHỈ áp cho file THÊM MỚI: DHCB có sẵn 5 file dữ
# liệu > 1 MB được sửa thường xuyên (curriculum.json, cefr*Vocab.json, sitemap-words.xml, lessons.json) — chặn
# cả file SỬA là chặn oan mọi đợt cập nhật nội dung học.
COMMIT_GUARD_MAX_FILE_BYTES=1048576
