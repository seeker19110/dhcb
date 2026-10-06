// details/game-s2.ts — Chi tiết chặng S2 hướng GAME ("chiều sâu hệ thống").
import type { SpecStageDetail } from '../stageDetailTypes.js'

export const GAME_S2_DETAIL: SpecStageDetail = {
  stageId: 'game-s2',
  modules: [
    {
      moduleId: 'game-s2-m1',
      objective:
        'Tổ chức được mã game theo hệ thống và dữ liệu, để thêm loại đối tượng mới mà không sửa vòng lặp chính.',
      practice: [
        'Tách vòng lặp game thành các hệ thống chạy theo thứ tự cố định trên dữ liệu thành phần.',
        'Thêm một loại đối tượng mới chỉ bằng dữ liệu, không sửa mã hệ thống.',
        'Đo thời gian mỗi hệ thống trong một khung hình và tìm hệ thống tốn nhất.',
      ],
      selfCheck: [
        {
          q: 'Vì sao tách dữ liệu khỏi hành vi lại hợp với game?',
          a: 'Game có hàng nghìn đối tượng cùng loại; xử lý theo mảng dữ liệu liền nhau nhanh hơn nhiều so với gọi phương thức từng đối tượng.',
        },
        {
          q: 'Thứ tự chạy các hệ thống có quan trọng không?',
          a: 'Rất quan trọng: đổi thứ tự là đổi kết quả một khung hình, và bug loại này rất khó tái hiện.',
        },
      ],
      doneSignals: [
        'Thêm kẻ địch mới chỉ mất sửa dữ liệu, không đụng vòng lặp chính.',
        'Có số đo thời gian từng hệ thống, không đoán chỗ nào chậm.',
      ],
    },
    {
      moduleId: 'game-s2-m2',
      objective:
        'Cài được vật lý bước cố định cho kết quả tất định, tái lập lại được từ cùng một hạt giống.',
      practice: [
        'Tách bước cập nhật vật lý khỏi tốc độ vẽ, dùng bước thời gian cố định.',
        'Ghi lại chuỗi thao tác đầu vào rồi phát lại, xác nhận kết quả trùng khít.',
        'Thử chạy trên máy nhanh và máy chậm, kiểm kết quả vẫn như nhau.',
      ],
      selfCheck: [
        {
          q: 'Vì sao vật lý không nên dùng thời gian trôi qua thật của mỗi khung hình?',
          a: 'Bước thời gian thay đổi làm kết quả khác nhau giữa các máy và không phát lại được.',
        },
        {
          q: 'Tất định giúp gì cho việc gỡ lỗi?',
          a: 'Lỗi tái hiện được bằng cùng hạt giống và cùng đầu vào, thay vì "thỉnh thoảng mới xảy ra".',
        },
      ],
      doneSignals: [
        'Phát lại một ván cũ cho kết quả trùng khít.',
        'Máy mạnh và máy yếu ra cùng kết quả, chỉ khác độ mượt.',
      ],
    },
    {
      moduleId: 'game-s2-m3',
      objective:
        'Viết được đối thủ máy có hành vi đọc được và điều chỉnh được độ khó mà không gian lận.',
      practice: [
        'Cài máy trạng thái hoặc cây hành vi cho một loại kẻ địch, vẽ sơ đồ trạng thái ra giấy.',
        'Thêm tìm đường trên lưới và xử lý ca không có đường đi.',
        'Chỉnh độ khó bằng tham số hành vi thay vì tăng máu hay cho máy nhìn xuyên tường.',
      ],
      selfCheck: [
        {
          q: 'Vì sao cho máy biết thông tin người chơi không thể biết là thiết kế tồi?',
          a: 'Người chơi cảm nhận được sự bất công dù không chỉ ra được, và mất động lực học cách chơi giỏi hơn.',
        },
        {
          q: 'Hành vi máy nên đọc được ở mức nào?',
          a: 'Đủ để người chơi đoán được ý định và lập kế hoạch, nhưng còn chỗ cho bất ngờ.',
        },
      ],
      doneSignals: [
        'Người chơi thử mô tả được kẻ địch đang định làm gì.',
        'Tăng độ khó không phải bằng cách cho máy gian lận.',
      ],
    },
    {
      moduleId: 'game-s2-m4',
      objective:
        'Tự viết được công cụ soạn nội dung để người không lập trình cũng tạo được màn chơi.',
      practice: [
        'Viết trình soạn màn lưu ra định dạng dữ liệu đọc được, nạp thẳng vào game.',
        'Nhờ một người không lập trình tạo một màn và ghi lại chỗ họ vướng.',
        'Thêm kiểm tra hợp lệ để màn thiếu lối đi bị chặn ngay lúc lưu.',
      ],
      selfCheck: [
        {
          q: 'Vì sao công cụ nội bộ đáng đầu tư dù không ai ngoài đội nhìn thấy?',
          a: 'Nó nhân số lượng nội dung làm được lên nhiều lần; nội dung mới là thứ quyết định game hay hay dở.',
        },
        {
          q: 'Định dạng lưu màn nên là nhị phân hay văn bản?',
          a: 'Văn bản khi còn đang phát triển vì so sánh và sửa tay được; nhị phân chỉ khi kích thước hoặc tốc độ nạp thành vấn đề.',
        },
      ],
      doneSignals: [
        'Người không lập trình tạo được màn chơi chạy được.',
        'Màn hỏng bị chặn ngay khi lưu, không phải lúc chơi mới phát hiện.',
      ],
    },
  ],
  rubric: [
    {
      id: 'game-s2-r1',
      text: 'Vật lí tất định: cùng hạt giống và cùng đầu vào cho ra cùng kết quả.',
      howToProve: 'Ghi và phát lại ba ván, so khớp mã băm trạng thái ở khung hình cuối.',
    },
    {
      id: 'game-s2-r2',
      text: 'Giữ tối thiểu 60 khung hình mỗi giây trên máy mục tiêu với cảnh đông nhất.',
      howToProve: 'Đồ thị khung hình trong hai phút chơi cảnh đông nhất, ghi cấu hình máy.',
    },
    {
      id: 'game-s2-r3',
      text: 'Ít nhất mười màn chơi tạo bằng công cụ tự viết.',
      howToProve: 'Danh sách tệp màn và một video nạp thử ba màn bất kỳ.',
    },
    {
      id: 'game-s2-r4',
      text: 'Đối thủ máy không dùng thông tin mà người chơi không thể có.',
      howToProve:
        'Chỉ ra trong mã nơi máy lấy dữ liệu, chứng minh chỉ đọc phần trong tầm quan sát.',
    },
    {
      id: 'game-s2-r5',
      text: 'Có ít nhất năm người ngoài chơi thử và phản hồi được ghi lại.',
      howToProve: 'Bảng phản hồi kèm việc bạn đã sửa gì sau đó.',
    },
  ],
  specBrief: {
    scopeDo: [
      'Một game có vật lý, đối thủ máy và trình soạn màn riêng.',
      'Bộ đo hiệu năng khung hình và cơ chế ghi phát lại ván chơi.',
      'Mười màn chơi làm bằng công cụ tự viết.',
    ],
    scopeDont: [
      'KHÔNG làm chơi mạng nhiều người — đồng bộ trạng thái là một chặng riêng, nhồi vào đây là hỏng cả hai.',
      'KHÔNG tự viết engine đồ hoạ từ đầu ở chặng này.',
      'KHÔNG làm đồ hoạ cầu kỳ; hình khối đơn giản là đủ để kiểm hệ thống.',
    ],
    touchpoints: [
      'Thư mục hệ thống: mỗi hệ thống một file, thứ tự chạy khai báo ở một chỗ.',
      'Thư mục dữ liệu màn chơi, định dạng văn bản đọc được.',
      'Công cụ soạn màn nằm tách khỏi mã game để không đội kích thước bản phát hành.',
    ],
    contracts: [
      'Định dạng tệp màn có số phiên bản; nạp tệp phiên bản lạ thì báo lỗi rõ, không đoán.',
      'Bản ghi phát lại lưu hạt giống và chuỗi đầu vào, đủ để dựng lại toàn bộ ván.',
      'Hệ thống chỉ đọc và ghi thành phần đã khai báo, không chạm dữ liệu của hệ thống khác.',
    ],
    acceptance: [
      'Năm tiêu chí rubric đạt, có video và số đo kèm theo.',
      'Chạy được từ bản phát hành đóng gói, không cần môi trường phát triển.',
    ],
    invariants: [
      'Cùng đầu vào và cùng hạt giống luôn cho cùng kết quả.',
      'Không màn chơi hợp lệ nào khiến game treo hoặc rơi khung hình dưới ngưỡng.',
      'Bước vật lý luôn cố định, độc lập với tốc độ vẽ.',
    ],
    conventions: [
      'Không dùng số ma thuật trong mã cân bằng; đưa hết ra dữ liệu.',
      'Mọi thay đổi cân bằng ghi lại lý do để lần sau không lặp lại thử nghiệm cũ.',
      'Số đo hiệu năng luôn kèm cấu hình máy đo.',
    ],
  },
}
