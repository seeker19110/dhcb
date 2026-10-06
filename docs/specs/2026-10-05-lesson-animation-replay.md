# Phát lại hoạt họa đã kết thúc

> Trạng thái: **Approved for implementation** trong phạm vi điều khiển hoạt họa đã được chủ dự án duyệt ở [spec hoạt họa](2026-10-05-ai-engineering-lesson-animation.md). Đây là sửa hành vi phát/dừng của renderer hiện có; quyền PR/merge mã có điều kiện đã được cấp ngày 2026-10-05. Source chỉ triển khai sau khi tài liệu này merge.

## Vấn đề và kết quả

`LessonAnimation` có nút phát/dừng nhưng với `loop=false`, CSS giữ cảnh cuối sau một lượt. Đổi `animation-play-state` không khởi động lại lượt đã kết thúc; nhãn nút vẫn nói tạm dừng. Pilot gradient dài 12 giây cần người học xem lại hai chuỗi trạng thái để đối chiếu với phép tính.

Sau thay đổi, hoạt họa hữu hạn tự dừng tại cảnh cuối và nút chuyển thành **Chạy lại hoạt ảnh**. Nhấn nút bắt đầu một lượt mới từ cảnh đầu. Tạm dừng giữa lượt và tiếp tục giữ đúng vị trí hiện tại. Hoạt họa lặp tiếp tục dùng hành vi phát/dừng hiện có.

## Phạm vi và hợp đồng

- File source: `packages/core-ui/LessonAnimation.tsx`, test renderer và browser regression hoạt họa. Không đổi schema, thời lượng, dữ liệu bài, ID hoặc tiến độ học.
- Một trạng thái phát/dừng dùng chung cho SVG trong bài và hộp **Xem lớn**. SVG trong bài là timeline có thẩm quyền cho sự kiện kết thúc.
- Mở hộp lớn khi đang chạy, tạm dừng hoặc đã kết thúc phải hiển thị cùng thời điểm của lượt hiện tại; đóng hộp không khởi động lại lượt.
- Khi phát lại, số thứ tự lượt tăng đơn điệu và các nhóm có animation nhận tên CSS animation mới để khởi động lại timeline; SVG và nút giữ DOM/focus ổn định. Chỉ nhận sự kiện kết thúc từ chính nhóm `<g data-animated>` của SVG trong bài, có tên animation thuộc map của lượt hiện tại và không thuộc pseudo-element.
- Không đồng bộ thời gian bằng vòng cập nhật React liên tục. Sau khi SVG lớn thực sự mount (bố cục có thể chờ ResizeObserver), đọc thời gian animation từ SVG trong bài và gán cho animation tương ứng trong SVG lớn theo ID shape ổn định, không theo thứ tự `getAnimations()`; áp thời gian trước lần hiển thị để tránh lóe cảnh đầu. Phần phát/dừng tiếp tục theo trạng thái chung, hai nút trong bài/hộp có cùng nhãn và hành vi.
- `prefers-reduced-motion` vẫn giữ cảnh đầu và lời mô tả/captions. Phát lại không vượt qua lựa chọn giảm chuyển động của hệ điều hành.
- Không thêm điều khiển từng bước, tua hoặc tốc độ phát trong lát này.

## Tiêu chí nghiệm thu

| ID   | Bằng chứng cần đạt                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RP-1 | Hoạt họa hữu hạn kết thúc thật trong browser; cảnh cuối được giữ, nút có tên Chạy lại hoạt ảnh.                                                           |
| RP-2 | Nhấn Chạy lại tạo animation đang chạy từ gần thời điểm 0; vị trí cảnh đầu và cảnh trung gian khác nhau, có thể phát lại ít nhất hai lượt.                 |
| RP-3 | Tạm dừng giữa lượt giữ thời gian/vị trí; nhấn Chạy tiếp tục từ vị trí đó, không về đầu.                                                                   |
| RP-4 | Mở Xem lớn giữa lượt hoặc ở cảnh cuối giữ cùng trạng thái và thời gian với hình trong bài; chênh thời gian không quá 150 ms khi đo trên browser kiểm thử. |
| RP-5 | Sự kiện kết thúc cũ hoặc sự kiện từ shape không thuộc lượt hiện tại không dừng lượt mới; hoạt họa lặp không chuyển thành trạng thái kết thúc.             |
| RP-6 | Keyboard, Esc và focus trở về nút mở hoạt động; nút phát lại đạt vùng chạm/tương phản hiện hành. Reduced motion vẫn không tạo chuyển động.                |

Unit test kiểm chuyển trạng thái và lọc sự kiện; browser test kiểm timeline CSS thật, replay, pause/resume và hộp lớn. Snapshot HTML đơn thuần không chứng minh chuyển động. Pilot gradient được chụp năm mốc ở 390/1440 px, hai theme và được xem ảnh để kiểm chữ/hướng/số học.

## Kiểm tra, rollout và rollback

Chạy impact map renderer, test renderer/keyframe/trang bài, browser regression hoạt họa, rồi full quality/E2E theo `AGENTS.md`. Renderer dùng chung cho STEM và chặng Lập trình nên phải giữ hồi quy các hình cũ. Không thêm thư viện hay network/provider.

Phát hành cùng lát pilot sau khi các cổng đạt. Rollback là revert source renderer/pilot của lát tương ứng; schema hoạt họa tùy chọn C1 và dữ liệu tiến độ không cần migration. Giới hạn runtime/worker của bài Python vẫn là dependency riêng, không được xem hoạt họa đạt như bằng chứng chấm bài đã mở.
