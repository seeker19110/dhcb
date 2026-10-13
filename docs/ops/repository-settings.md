# Thiết lập repo GitHub — giá trị thật + cách kiểm lại

> Thêm 2026-10-12 (changelog `0622`, khung `seeker19110/project-template` `docs/ops/repository-settings.md`).
> Phần lớn thiết lập repo **không nằm trong git**: đổi trên giao diện GitHub thì không PR nào thấy, không
> cổng nào đỏ. File này ghi **giá trị đang áp + ngày kiểm + lệnh kiểm lại**, để lần rà sau so được.
> Rà lại: mỗi quý, sau mọi sự cố SEV1/SEV2, và khi đổi required check / workflow.

## Lệnh kiểm lại (repo public — đọc được KHÔNG cần token)

```bash
# Thiết lập chung + bảo mật
curl -sS https://api.github.com/repos/seeker19110/dhcb | jq '{visibility, allow_squash_merge,
  allow_merge_commit, allow_rebase_merge, allow_auto_merge, delete_branch_on_merge,
  squash_merge_commit_title, has_discussions, has_wiki, security_and_analysis}'
# Luật đang áp lên nhánh main (ruleset + branch protection gộp lại)
curl -sS https://api.github.com/repos/seeker19110/dhcb/rules/branches/main | jq -c '.[] | {type, parameters}'
# Kênh báo lỗ hổng riêng tư
curl -sS https://api.github.com/repos/seeker19110/dhcb/private-vulnerability-reporting
```

## Giá trị đang áp (kiểm 2026-10-12 bằng đúng các lệnh trên)

| Thiết lập                                       | Giá trị                              | Vì sao / ràng buộc với DHCB                                                                                                                                              |
| ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Required check trên `main`                      | `quality` · `e2e` · `metadata`       | Tên BẤT BIẾN (CLAUDE.md §11.1) — `scripts/ci-workflow-policy.test.ts` canh phía workflow; phía GitHub chỉ có lệnh kiểm ở trên.                                           |
| `strict_required_status_checks_policy`          | `false`                              | Cố ý TẮT "require branches up to date" từ 2026-08-27 (CLAUDE.md §11 bước 4).                                                                                             |
| Cấm xoá / cấm force-push `main`                 | bật (`deletion`, `non_fast_forward`) | Mọi thay đổi qua PR.                                                                                                                                                     |
| Số người duyệt bắt buộc                         | `0`                                  | Repo một người: GitHub không cho tự duyệt PR của mình, đặt 1 là khoá mọi PR. Nâng lên ≥ 1 khi có người cộng tác.                                                         |
| Cách merge cho phép                             | squash · merge · rebase              | Thực tế chỉ dùng squash (auto-merge). **Chờ chủ repo quyết** có khoá về chỉ squash không.                                                                                |
| `squash_merge_commit_title`                     | `COMMIT_OR_PR_TITLE`                 | PR MỘT commit lấy tiêu đề COMMIT lên `main` — lý do cổng `metadata` soi từng commit (changelog `0621`).                                                                  |
| `allow_auto_merge` · `delete_branch_on_merge`   | bật · bật                            | Luồng "CI xanh là vào `main`" (CLAUDE.md §11) dựa vào cả hai.                                                                                                            |
| Secret scanning · push protection               | bật · bật                            | Cùng `gitleaks` (CI) + rào bí mật trước commit ở máy (changelog `0619`).                                                                                                 |
| **Dependabot security updates**                 | **TẮT**                              | `.github/dependabot.yml` chỉ lo cập nhật phiên bản theo lịch; PR vá lỗ hổng tự động hiện KHÔNG có. **Chờ chủ repo quyết** (Settings → Code security).                    |
| **Private vulnerability reporting**             | **TẮT**                              | Nút "Report a vulnerability" mà `SECURITY.md` hướng dẫn không hiện với người ngoài → link Issue template đã trỏ về `SECURITY.md` (còn kênh email). **Chờ chủ repo bật.** |
| Discussions                                     | tắt                                  | Link Discussions chết đã gỡ ở changelog `0621`.                                                                                                                          |
| Giải quyết hết hội thoại review trước khi merge | tắt                                  | Phù hợp luồng một người + auto-merge; xem lại khi có người review thật.                                                                                                  |

## Thiết lập nằm trong git (đọc thẳng file, không chép giá trị ở đây)

- Mọi action (kể cả `actions/*`, siết ở changelog 0632) ghim SHA — **có test canh**
  (`scripts/ci-workflow-policy.test.ts`).
- `timeout-minutes` mọi job của `ci.yml` + job tổng hợp gom `toJSON(needs)` — **có test canh** (cùng file).
- Khối `permissions:` tối thiểu ở từng workflow (`contents: read`; CodeQL thêm `security-events: write`)
  — chưa có test, rà bằng `grep -n -A3 'permissions:' .github/workflows/*.yml` (changelog `0621`).

## Chưa làm (kèm điều kiện xem lại)

- **Job CI tự đối chiếu ruleset sống với một file trong repo** (khung có `protection-guard` +
  `.github/rulesets/main.json`): bắt được việc ai đó gỡ nhầm required check trên giao diện mà CI vẫn
  xanh. Chưa làm vì repo một người quản trị, lệnh kiểm ở trên chạy tay được trong 2 giây. _Xem lại
  khi:_ có người thứ hai có quyền admin, hoặc lần rà quý phát hiện luật bị đổi mà không ai biết.
