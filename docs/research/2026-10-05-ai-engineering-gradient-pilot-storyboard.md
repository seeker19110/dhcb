# Storyboard thí điểm: Gradient descent và learning rate

> Trạng thái: **thiết kế chờ triển khai và kiểm ảnh**, ngày 2026-10-05. Bài đích: `mathai-u3-l3`. Lát C1 đang nối hợp đồng/công cụ; tài liệu này chuẩn bị lát nội dung tiếp theo. Chưa thêm hoạt họa vào bài, chưa chạy kiểm giao diện, chưa xác nhận chất lượng thị giác.

## 1. Mục tiêu và bằng chứng đã đọc

Người học tính được một bước `x_mới = x − lr·2(x−3)`, giải thích vì sao `lr=0,1` tiến về đáy còn `lr=1` dao động với **riêng** hàm `f(x)=(x−3)²` và điểm xuất phát `x₀=0`. Hoạt họa thể hiện hướng và độ dài bước cập nhật, sự cần thiết của việc tính lại gradient, rồi so sánh hai chuỗi trạng thái.

Nguồn đã kiểm trực tiếp:

- Bài thật: [mathaiu3.ts](../../packages/subject-programming/lessons/mathaiu3.ts), bài `mathai-u3-l3`: theory, workedExample, predict, make và SRS.
- [Đặc tả hoạt họa](../specs/2026-10-05-ai-engineering-lesson-animation.md) và [lựa chọn thí điểm](2026-10-05-ai-engineering-pilot-selection.md).
- [Schema hoạt họa](../../packages/core-contracts/lessonAnimation.ts), [renderer](../../packages/core-ui/LessonAnimation.tsx) và [giải keyframe](../../packages/core-ui/animationKeyframes.ts).

Các số dưới đây được kiểm bằng `decimal.Decimal` của Python, không suy từ vị trí vẽ hoặc ảnh. Bảng dùng dấu phẩy thập phân theo văn bản tiếng Việt; dữ liệu TypeScript dùng dấu chấm.

## 2. Đáp án số độc lập với hình vẽ

Đặt sai lệch có dấu `eₙ=xₙ−3`. Quy tắc cập nhật cho `eₙ₊₁=(1−2lr)eₙ`; với `x₀=0`, nghiệm là `xₙ=3−3(1−2lr)ⁿ`. Do đó:

- `lr=0,1`: sai lệch nhân `0,8` và loss nhân `0,64` mỗi bước; `xₙ` tiến về 3 khi số bước tăng. Bốn bước trong hình **chưa** đưa x tới đáy.
- `lr=1`: sai lệch đổi dấu, giữ độ lớn 3; x luân phiên 0 và 6, loss luôn 9. Dao động này không phải phân kỳ tăng biên độ.

| Trạng thái | x, lr=0,1 | f(x), lr=0,1 | Gradient tại x, lr=0,1 | x, lr=1 | Gradient tại x, lr=1 | f(x), lr=1 |
| ---------- | --------- | ------------ | ---------------------- | ------- | -------------------- | ---------- |
| n=0        | 0         | 9            | −6                     | 0       | −6                   | 9          |
| n=1        | 0,6       | 5,76         | −4,8                   | 6       | 6                    | 9          |
| n=2        | 1,08      | 3,6864       | −3,84                  | 0       | −6                   | 9          |
| n=3        | 1,464     | 2,359296     | −3,072                 | 6       | 6                    | 9          |
| n=4        | 1,7712    | 1,50994944   | −2,4576                | 0       | −6                   | 9          |

Cổng đối chiếu: giá trị x và loss lưu trong storyboard phải khớp công thức cập nhật độc lập; số hiển thị có thể làm tròn bốn chữ số và phải ghi dấu xấp xỉ khi có làm tròn. Không sử dụng số đã làm tròn làm đầu vào cho bước sau.

Bài Make hiện có ba đáp án sau 20 bước: `(x₀=0, lr=0,1) → x≈2,9654, f≈0,0012`; `(10; 0,5) → x=3, f=0`; `(0; 1) → x=0, f=9`. Hoạt họa không thay số bước của bài Make.

## 3. Năm trạng thái và ánh xạ thời gian

Đề xuất `durationMs=12000`, `loop=false`. Tại mỗi cảnh giữ đủ lâu để đọc; chuyển động giữa các cảnh chỉ diễn tả thay đổi tham số, không khẳng định đã chạy thêm lần đánh giá mô hình.

| Cảnh | Khoảng đứng để đọc                | Biến đổi đi vào cảnh | Nội dung phải nhận ra                                                                 |
| ---- | --------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| n=0  | 0–1600 ms                         | Không có             | Cùng hàm, cùng x ban đầu; gradient −6; đáy x=3.                                       |
| n=1  | 2400–4000 ms                      | 1600–2400 ms         | lr=0,1 đi từ 0 tới 0,6; lr=1 đi từ 0 tới 6.                                           |
| n=2  | 4800–6400 ms                      | 4000–4800 ms         | lr=0,1 tới 1,08 sau khi tính lại gradient; lr=1 trở về 0.                             |
| n=3  | 7200–8800 ms                      | 6400–7200 ms         | lr=0,1 tới 1,464; lr=1 lại tới 6, loss vẫn 9.                                         |
| n=4  | 9600–12000 ms và sau khi kết thúc | 8800–9600 ms         | lr=0,1 tới 1,7712 và còn cách đáy; lr=1 trở về 0, sẽ tiếp tục dao động nếu chạy thêm. |

Các ảnh nghiệm thu 2/25/50/75/98% tương ứng 240/3000/6000/9000/11760 ms. Ảnh thứ tư nằm trong chuyển động n3→n4; phải nhìn thấy hướng cập nhật ở hai làn, không chỉ so năm ảnh tĩnh giống nhau. Ảnh cuối đọc được kết luận sau khi dừng.

## 4. Hình học và hợp đồng shape

Dùng **một** parabol, hai làn tham số bên dưới. Tên làn và ký hiệu hình tròn/hình vuông phân biệt hai learning rate, kèm màu theo role. Không dùng màu làm kênh phân biệt duy nhất.

Đề xuất khung `480×460`; tọa độ đồ thị `X=60+60x`, `Y=240−20f(x)`. Đường cong có thể là polyline lấy mẫu x từ 0 tới 6; điểm đáy có nhãn `x=3; f=0`. Đây là tọa độ thiết kế, phải kiểm nhãn thực tế ở mobile trước khi chốt.

| Giá trị x của lr=0,1 | X của điểm đồ thị | Y của điểm đồ thị |
| -------------------- | ----------------- | ----------------- |
| 0                    | 60                | 60                |
| 0,6                  | 96                | 124,8             |
| 1,08                 | 124,8             | 166,272           |
| 1,464                | 147,84            | 192,81408         |
| 1,7712               | 166,272           | 209,8010112       |

Với lr=1, hai điểm là `(60;60)` và `(420;60)`. Đáy là `(240;240)`.

Ánh xạ shape đề xuất:

| Nhóm id                                                | Loại và vai trò                                    | Quy tắc keyframe                                                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loss-curve`, `axis-x`, `axis-f`, `minimum`            | polyline/line/circle; nền kiến thức đứng yên       | Không keyframe; ghi rõ f(x)=(x−3)².                                                                                                               |
| `slow-lane`, `fast-lane` và nhãn làn                   | line + label; hai trục x cùng thang, ở dưới đồ thị | Đứng yên, ghi `lr=0,1` và `lr=1`.                                                                                                                 |
| `slow-x`, `fast-x`                                     | circle/rect; tham số hiện tại trên làn             | Chỉ tịnh tiến x; vị trí đứng tương ứng bảng n0..n4, lặp giá trị ở đầu/cuối mỗi khoảng giữ.                                                        |
| `slow-marker-label`, `fast-marker-label`               | label ngắn gắn với dấu làn nếu dùng                | Dùng cùng keyframe dx với dấu. Giá trị số cụ thể có thể ở bảng đứng yên để tránh nhãn biến nội dung.                                              |
| `slow-loss-n0`..`slow-loss-n4`, `fast-loss-left/right` | Các điểm đánh giá rời rạc trên parabol             | Hiện theo trạng thái bằng opacity, không nội suy tọa độ giữa hai điểm loss. Phải xử lý fallback reduced motion trước khi dùng opacity nhiều cảnh. |
| `update-slow-n*`, `update-fast-n*`                     | arrow trên làn x, tùy khả năng đọc                 | Mũi tên hướng theo dấu của −gradient. Không vẽ mũi tên cập nhật nằm trên parabol như hướng gradient trong mặt phẳng (x,f).                        |
| `state-label-n*` hoặc bảng trạng thái đứng yên         | label số/lời giải ngắn                             | Không để các nhãn của năm cảnh chồng lên nhau khi tắt chuyển động; ưu tiên bảng đứng yên được tô nhấn theo cảnh nếu dễ đọc hơn.                   |

Renderer chỉ nội suy tuyến tính transform/opacity. **Không** animate điểm trên đồ thị từ `(0;9)` sang `(6;9)` bằng hai keyframe dx/dy: ở giữa chuyển động, điểm sẽ nằm ngoài parabol. Hai làn x thể hiện thay đổi tham số; điểm loss thể hiện các lần đánh giá rời rạc, nên không có lỗi này. Nếu dùng opacity chuyển cảnh, không cộng opacity tĩnh với keyframe làm điểm bị vô hình.

Giữ tổng số shape ≤60, mỗi shape ≤20 keyframe, caption ≤12. Chưa chốt dữ liệu cụ thể nên phải đếm lại khi cài đặt. Chỉ cần schema hiện có; không cần SVG/HTML tùy ý hoặc thư viện mới.

## 5. Văn bản tương đương và câu hỏi kiểm tra

**Title:** “Cùng điểm xuất phát, hai learning rate: tiến về đáy hoặc dao động”.

**Description đề xuất:**

> Hai lần chạy bắt đầu tại x=0, f(x)=9 trên cùng hàm f(x)=(x−3)². Với lr=0,1, x lần lượt là 0; 0,6; 1,08; 1,464; 1,7712, tiến về đáy x=3. Với lr=1, x luân phiên 0 và 6, còn f(x) luôn bằng 9. Các làn bên dưới thể hiện thay đổi của tham số x; dấu trên đồ thị biểu thị các lần đánh giá rời rạc.

**Captions:**

1. `0 ms`: “Bước 0: cả hai bắt đầu tại x=0, f(x)=9; gradient bằng −6.”
2. `2400 ms`: “Bước 1: x mới = x − lr·gradient. lr=0,1 cho x=0,6, f=5,76; lr=1 cho x=6, f=9.”
3. `4800 ms`: “Bước 2: tính lại gradient tại vị trí mới. lr=0,1 cho x=1,08, f=3,6864; lr=1 trở về x=0, f=9.”
4. `7200 ms`: “Bước 3: lr=0,1 cho x=1,464, f≈2,3593; lr=1 lại sang x=6. Chỉ đường đi thứ nhất giảm mất mát.”
5. `9600 ms`: “Bước 4: lr=0,1 cho x=1,7712, f≈1,5099; khoảng cách tới 3 nhân 0,8 mỗi bước. lr=1 tiếp tục dao động 0↔6, mất mát luôn 9.”

Renderer hiện hiển thị toàn bộ captions dưới dạng danh sách có thứ tự, không chỉ hiện caption đang đến giờ. Vì vậy cả năm câu phải đọc độc lập được và không phụ thuộc vào việc nhận ra màu hoặc hình đang chuyển động.

**Predict hiện có:** sau đúng một bước từ x=0 với lr=0,1, đáp án `0.6` (`answerIndex=0`). Phép tính `0−0,1×(−6)=0,6` phải khớp cảnh n1.

**Câu kiểm bổ sung cho reviewer:** “Với lr=1, sau hai bước loss có giảm không?” Đáp án: không; x quay về 0, loss vẫn 9. Đây là câu rà hiệu quả giải thích, chưa phải đề xuất thêm bước chấm hay sửa tiến độ học.

## 6. Accessibility, reduced motion và xem lại

- Chữ dùng role `neutral`/role chữ hợp lệ, kiểm AAA theo theme; không dùng `correct`, `warn`, `danger` làm màu label. Circle/rect và nhãn làn là tín hiệu bổ sung ngoài màu.
- Cảnh đầu và bản chữ phải đủ nghĩa; cảnh cuối giữ kết luận. Mọi con số làm tròn phải nhất quán giữa hình, caption và bảng.
- Kiểm năm mốc trên trang bài thật ở 1440/390 px, theme blue-sky/dark-blue, mở và đọc ảnh. Cỡ chữ và va chạm nhãn cần xem thật; “Xem lớn” không thay việc kiểm mobile.
- Kiểm bàn phím, mở/đóng hộp lớn, Esc và focus quay lại. Mô tả và toàn bộ captions phải còn đọc được khi reduced motion.

**Lỗi reduced motion đã thấy ở source trước lát C1:** `Shape` bỏ opacity tĩnh của phần tử nếu có keyframe opacity; nhóm `<g>` chỉ nhận `animationName`, không nhận trạng thái opacity ban đầu. Media query `prefers-reduced-motion: reduce` đặt `animation: none !important`. Khi đó các hình chỉ được ẩn bằng keyframe có thể đồng thời hiện ra, thay vì giữ cảnh đầu như chú thích hiện tại. Không khẳng định reduced motion đã đúng chỉ từ mô tả trong file. Cần test browser chứng minh fallback cảnh đầu cho opacity và transform; bản chữ vẫn luôn bắt buộc.

**Bản sửa C1 hiện tại:** nhóm hình có animation nhận transform/origin từ trạng thái đầu của `giaiMoc`; opacity chỉ đặt ở nhóm nếu keyframe điều khiển opacity, tránh nhân đôi opacity tĩnh của hình con. CSS animation ghi đè trạng thái nền khi chạy và media query tắt animation để trở về trạng thái đầu. Ba unit regression thất bại trên source cũ; sau sửa, hai suite renderer/keyframe đạt **31/31 tests**. Đã thêm hai browser regression ở `e2e/lesson-animation-reduced-motion.spec.ts` cho giảm chuyển động từ đầu và bật giữa lượt; hai ca browser đã đạt; cùng ba ca zoom/rotation/Esc/focus, nhóm hoạt họa đạt 5/5. Gate tích hợp rộng hơn được ghi tại goal GOAL-2026-010. Đây là sửa hạ tầng, chưa phải triển khai pilot gradient.

**Khả năng xem lại hiện tại:** `loop=false` sinh `animation-iteration-count: 1` và `animation-fill-mode: both`. Nút “Tạm dừng hoạt ảnh”/“Chạy hoạt ảnh” chỉ đổi `animation-play-state`; không reset thời gian hoặc đổi tên animation. Vì vậy sau khi một lượt kết thúc, bấm chạy **không bảo đảm phát lại từ đầu**. State `playing` cũng không được đồng bộ bởi `animationend`, nên nhãn nút có thể vẫn nói tạm dừng ở cảnh cuối. Hiện chưa có nút replay. Mở “Xem lớn” tạo SVG mới nên có thể sinh một timeline khác, nhưng đây không phải hợp đồng replay đã được thiết kế/kiểm thử; không hướng dẫn người học dựa vào hành vi này.

Trước phát hành pilot, coordinator cần chốt một trong hai: chấp nhận bản chữ + cảnh cuối với điều khiển pause hiện tại và ghi rõ giới hạn; hoặc đặc tả riêng khả năng phát lại rồi triển khai/test renderer dùng chung. Không đổi `loop=true` chỉ để né thiếu replay vì sẽ mất cảnh kết đứng yên.

## 7. Nội dung cần sửa và giới hạn phạm vi

Trong chính bài l3, sửa trước khi gắn pilot:

- “Thuật toán chỉ hứa đi xuống tới MỘT đáy” và SRS “chỉ hứa ... tới MỘT đáy gần nơi xuất phát” là bảo đảm quá mức. Hàm và learning rate quyết định hội tụ; gradient descent tổng quát có thể không hội tụ hoặc gặp điểm dừng khác cực tiểu. Không hứa cực tiểu địa phương khi chưa có giả thiết.
- “Phân kỳ ... hiện ra thành loss=nan” cần đổi thành có thể tạo giá trị rất lớn, overflow hoặc NaN; NaN còn có thể do dữ liệu hay phép toán không hợp lệ. Đừng dùng NaN như bằng chứng duy nhất rằng learning rate quá lớn.
- Giới hạn lời dẫn “mọi mô hình học sâu/toàn bộ nghề huấn luyện AI” về đúng phạm vi bài: một thuật toán nền tảng cho tối ưu mô hình khả vi; tránh đồng nhất toàn bộ huấn luyện với ví dụ một biến.
- Cảnh lr=1 phải ghi dao động với biên độ không đổi; chỉ lr>1 trong ví dụ này mới làm sai lệch tăng biên độ (trừ trường hợp khởi tạo ngay đáy).

Lỗi lân cận cùng file cần ghi vào backlog nội dung; không tự sửa trong C1:

- l4 gọi MSE “chính là phương sai của sai số”: với phân phối thực nghiệm trên cùng tập, `MSE = Var(error) + mean(error)²`.
- l4 nói hàm lồi “chỉ có đúng một đáy” và GD “luôn tìm ra”: hàm lồi có thể có nhiều nghiệm tối ưu hoặc không đạt cực tiểu; hội tụ của phương pháp còn có điều kiện.
- Hook l2/l4 nói “mọi mô hình AI” là quá rộng so với nội dung tối ưu mô hình khả vi.

Những lỗi này được rút ra từ phương trình/định nghĩa và source hiện có; không có kiểm chứng bằng mô hình bên ngoài hoặc gọi API.

## 8. File của lát triển khai và nghiệm thu

File nội dung dự kiến: `packages/subject-programming/lessons/mathaiu3.ts`. Test nội dung dự kiến có thể là `packages/subject-programming/lessons/mathaiGradientAnimation.test.ts`; tên cuối do coordinator chốt. Chỉ thêm test hữu ích: đối chiếu số với công thức độc lập, kiểm ánh xạ tọa độ loss, hướng cập nhật và trạng thái đầu/cuối; không dùng snapshot dữ liệu làm bằng chứng đủ.

Các điểm dùng chung do coordinator sở hữu: hợp đồng optional animation ở `lessonTypes.ts`, màn concept trong `ProgrammingLessonPage.tsx`, test render/reduced motion, công cụ ảnh programming và mọi sửa renderer. Không cho agent pilot sửa chồng các file này. Trước sửa source phải hoàn tất điều kiện spec đã merge và chạy codemap theo quy định repo.

Nghiệm thu gồm parse dữ liệu, test số, ảnh thật có ít nhất ba trạng thái khác nhau, `getAnimations()` chứng minh chuyển động chạy, đọc đủ bản chữ khi giảm chuyển động, kiểm cảnh cuối và hành vi pause/resume thực tế. Các gate sản phẩm đầy đủ chạy trên commit tích hợp cuối, không được thay bằng kết quả tính Decimal trong tài liệu này.

**Bằng chứng hiện tại:** đã đọc source, tính đáp án bằng Python Decimal, lập storyboard và sửa fallback reduced motion ở renderer trong C1; unit regression trước/sau có bằng chứng nêu trên. Chưa cài dữ liệu hoạt họa gradient, chưa sửa lỗi bài, chưa có ảnh UI của pilot. Gate tích hợp và browser do coordinator chạy trên thay đổi cuối. Tài liệu không phải xác nhận pilot đã hoàn thành.
