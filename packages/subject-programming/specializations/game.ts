// Hướng GAME — vòng lặp 60 khung hình/giây, nơi trải nghiệm quan trọng ngang kiến trúc.
import type { ProgrammingSpecialization } from './types.js'

export const GAME_SPECIALIZATION: ProgrammingSpecialization = {
  id: 'game',
  name: 'Lập trình Game',
  tagline:
    'Làm trò chơi người ta chơi tới cùng: vòng lặp mượt, cảm giác đã tay, chạy được mọi máy.',
  forWho:
    'Hợp với người thích toán hình học, tối ưu và làm sản phẩm mang lại cảm xúc. Cần chấp nhận sửa đi sửa lại phần "cảm giác" hàng chục lần.',
  prerequisite: 'p4',
  duration: '10–16 tháng',
  languages: ['C#', 'C++', 'TypeScript', 'GLSL/HLSL'],
  coreTools: ['Godot hoặc Unity', 'Blender', 'Aseprite', 'RenderDoc', 'Git LFS'],
  architecture: {
    modules: [
      { name: 'Vòng lặp game', role: 'Điều phối cập nhật và vẽ. KHÔNG chứa luật chơi cụ thể.' },
      {
        name: 'Mô phỏng (luật chơi)',
        role: 'Trạng thái thế giới và luật. Bước cố định, tất định, tách khỏi tốc độ vẽ.',
      },
      {
        name: 'Trình bày (render + âm thanh)',
        role: 'Đọc trạng thái để vẽ. KHÔNG được sửa trạng thái mô phỏng.',
      },
      {
        name: 'Nhập liệu',
        role: 'Biến thao tác thiết bị thành ý định trừu tượng ("nhảy"), không phải phím cụ thể.',
      },
      {
        name: 'Dữ liệu nội dung',
        role: 'Màn chơi, chỉ số cân bằng nằm NGOÀI mã, sửa không cần biên dịch lại.',
      },
      { name: 'Lưu game', role: 'Có phiên bản; bản lưu cũ phải đọc được sau khi cập nhật.' },
    ],
    contracts: [
      'Mô phỏng không bao giờ đọc thời gian thực trực tiếp — chỉ nhận bước thời gian cố định.',
      'Cùng hạt giống + cùng chuỗi input phải cho cùng kết quả (điều kiện để test và để chơi mạng).',
      'Định dạng dữ liệu nội dung và bản lưu có phiên bản, có đường nâng cấp.',
      'Trong chế độ mạng, server là bên quyết định; client chỉ dự đoán.',
    ],
    keyDecisions: [
      'ECS hay cây đối tượng — đổi về sau là viết lại phần lớn gameplay.',
      'Bước cố định cho mô phỏng: bỏ qua từ đầu thì vật lý và chơi mạng đều hỏng.',
      'Nội dung sinh theo thủ tục hay dựng tay; kéo theo toàn bộ công cụ soạn nội dung.',
      'Chơi mạng có quyền quyết định ở server hay ngang hàng — quyết định luôn chuyện chống gian lận.',
    ],
    nfrs: [
      'Giữ ngân sách khung hình (ví dụ 16,6ms) trên máy cấu hình mục tiêu.',
      'Thời gian tải màn ≤ ngưỡng đặt trước; không giật khi tải nội dung giữa chừng.',
      'Chơi được mượt ở độ trễ mạng mô phỏng đã cam kết.',
    ],
    specChecklist: [
      'Cảm giác mong muốn mô tả bằng SỐ (gia tốc, thời gian hồi, cửa sổ tha thứ), không bằng tính từ.',
      'Trạng thái nào thuộc mô phỏng, trạng thái nào chỉ để trình bày.',
      'Ảnh hưởng tới bản lưu cũ và tới cân bằng hiện có.',
      'Ngân sách khung hình và máy mục tiêu.',
    ],
  },
  stages: [
    {
      id: 'game-s1',
      tier: 's1',
      name: 'Trò chơi hoàn chỉnh đầu tiên',
      canDo: 'Làm xong và phát hành một game nhỏ có mở đầu, chơi, kết thúc.',
      duration: '6–8 tuần',
      modules: [
        {
          id: 'game-s1-m1',
          title: 'Vòng lặp game',
          topics: [
            'Cập nhật, vẽ, delta time — không phụ thuộc tốc độ máy',
            'Máy trạng thái cho màn hình và cho nhân vật',
            'Nhập liệu: bàn phím, chuột, tay cầm, cảm ứng',
          ],
        },
        {
          id: 'game-s1-m2',
          title: 'Toán cho game',
          topics: ['Vector, góc, nội suy', 'Va chạm AABB và hình tròn', 'Hệ toạ độ và camera 2D'],
        },
        {
          id: 'game-s1-m3',
          title: 'Cảm giác chơi',
          topics: [
            'Gia tốc, hệ số ma sát, khoảng ân hạn vẫn nhảy được sau khi rời mép (coyote time)',
            'Phản hồi: rung màn, hạt, âm thanh',
            'Vòng phản hồi chơi thử → chỉnh số → chơi lại',
          ],
        },
        {
          id: 'game-s1-m4',
          title: 'Tài nguyên và phát hành',
          topics: [
            'Sprite, hoạt ảnh, atlas',
            'Âm thanh, nhạc nền, lồng ghép sự kiện',
            'Đóng gói cho web/desktop, đưa lên itch.io',
          ],
        },
      ],
      project: {
        name: 'Game nhỏ hoàn chỉnh và đã phát hành',
        brief: 'Một trò chơi 2D chơi được 10 phút, có menu, lưu điểm, kết thúc.',
        requirements: [
          'Chơi được từ đầu tới cuối không lỗi chặn đường',
          'Chạy ổn định 60 FPS trên máy cấu hình trung bình',
          'Đã đưa lên nền tảng công khai và có ≥ 5 người ngoài chơi thử',
        ],
      },
    },
    {
      id: 'game-s2',
      tier: 's2',
      name: 'Hệ thống game và kiến trúc',
      canDo: 'Xây game có nhiều hệ thống đan nhau mà vẫn sửa được, mở rộng được.',
      duration: '8–10 tuần',
      modules: [
        {
          id: 'game-s2-m1',
          title: 'Kiến trúc',
          topics: [
            'Thành phần vs kế thừa, ECS mức dùng được',
            'Hệ thống sự kiện, tách logic khỏi biểu diễn',
            'Dữ liệu game để ngoài mã (data-driven)',
          ],
        },
        {
          id: 'game-s2-m2',
          title: 'Vật lí',
          topics: [
            'Bước cố định cho vật lý, tách khỏi tốc độ vẽ',
            'Xung lượng, ràng buộc, khớp nối',
            'Truy vấn tia (raycast) và phát hiện va chạm nâng cao',
          ],
        },
        {
          id: 'game-s2-m3',
          title: 'Trí tuệ nhân tạo trong game',
          topics: [
            'Máy trạng thái, cây hành vi',
            'Tìm đường A*, lưới điều hướng',
            'Cân bằng: AI phải vui, không cần phải giỏi',
          ],
        },
        {
          id: 'game-s2-m4',
          title: 'Nội dung và công cụ',
          topics: [
            'Trình soạn màn chơi cho chính mình',
            'Sinh nội dung theo thủ tục có hạt giống tái lập',
            'Lưu game, phiên bản dữ liệu lưu',
          ],
        },
      ],
      project: {
        name: 'Game có chiều sâu hệ thống',
        brief: 'Trò chơi với vật lý, AI đối thủ và trình soạn màn chơi riêng.',
        requirements: [
          'Vật lí tất định với bước cố định, tái lập được bằng hạt giống',
          'Ít nhất 10 màn tạo bằng công cụ tự viết',
          'Lưu/tải game tương thích với bản lưu của phiên bản trước',
        ],
      },
    },
    {
      id: 'game-s3',
      tier: 's3',
      name: 'Đồ hoạ và hiệu năng',
      canDo: 'Hiểu đường ống dựng hình, viết shader, tối ưu để game chạy mượt trên máy yếu.',
      duration: '10–14 tuần',
      modules: [
        {
          id: 'game-s3-m1',
          title: 'Đường ống dựng hình',
          topics: [
            'Từ đỉnh tới điểm ảnh: vertex, rasterize, fragment',
            'Bộ đệm chiều sâu, trộn màu, thứ tự vẽ',
            'Lệnh vẽ (draw call) và gộp lô',
          ],
        },
        {
          id: 'game-s3-m2',
          title: 'Shader',
          topics: [
            'GLSL/HLSL cơ bản, biến đồng nhất (uniform), ảnh kết cấu (texture)',
            'Chiếu sáng, bóng đổ, hậu xử lý',
            'Hiệu ứng: nước, lửa, hoà tan',
          ],
        },
        {
          id: 'game-s3-m3',
          title: 'Hiệu năng',
          topics: [
            'Ngân sách khung hình, profiler CPU và GPU',
            'Bố cục dữ liệu thân thiện với cache, gộp bộ nhớ',
            'Cắt tỉa (culling), mức chi tiết (LOD), tải nội dung theo luồng',
          ],
        },
        {
          id: 'game-s3-m4',
          title: '3D nền tảng',
          topics: [
            'Ma trận biến đổi, quaternion',
            'Hoạt ảnh xương, hoà trộn hoạt ảnh',
            'Camera 3D và điều khiển',
          ],
        },
      ],
      project: {
        name: 'Game 3D nhỏ tối ưu có số đo',
        brief: 'Trò chơi 3D với shader tự viết, chạy được trên máy cấu hình thấp.',
        requirements: [
          'Giữ ≥ 60 FPS trên máy mục tiêu, có biểu đồ thời gian khung hình',
          'Ít nhất 2 shader tự viết có mục đích chơi rõ ràng',
          'Báo cáo tối ưu trước–sau kèm ảnh chụp profiler',
        ],
      },
    },
    {
      id: 'game-s4',
      tier: 's4',
      name: 'Chuyên gia — nhiều người chơi và quy mô phát hành',
      canDo: 'Làm game nhiều người chơi qua mạng và đưa sản phẩm ra thị trường thật.',
      duration: '12–18 tuần',
      modules: [
        {
          id: 'game-s4-m1',
          title: 'Mạng trong game',
          topics: [
            'Mô hình client-server có quyền quyết định ở server',
            'Dự đoán phía client, hoà giải, bù trễ',
            'Chống gian lận và xác thực đầu vào',
          ],
        },
        {
          id: 'game-s4-m2',
          title: 'Công cụ và quy trình đội',
          topics: [
            'Xây engine/tooling nội bộ, hot reload',
            'Quy trình tài nguyên với người làm mỹ thuật, Git LFS',
            'Build tự động đa nền tảng',
          ],
        },
        {
          id: 'game-s4-m3',
          title: 'Thiết kế trò chơi có số liệu',
          topics: [
            'Đo đường cong khó, tỷ lệ bỏ cuộc theo màn',
            'Cân bằng kinh tế trong game',
            'Kiếm tiền có đạo đức, tránh mô hình bóc lột',
          ],
        },
        {
          id: 'game-s4-m4',
          title: 'Phát hành thương mại',
          topics: [
            'Cổng phát hành, yêu cầu kỹ thuật từng nền tảng',
            'Bản địa hoá, trợ năng trong game',
            'Vá lỗi sau phát hành, cập nhật nội dung',
          ],
        },
      ],
      project: {
        name: 'Game nhiều người chơi phát hành thật',
        brief: 'Trò chơi có chế độ mạng, phát hành trên nền tảng thương mại.',
        requirements: [
          'Server có quyền quyết định, chống được gian lận cơ bản',
          'Chơi được mượt ở độ trễ 150ms mô phỏng',
          'Có mặt trên nền tảng phát hành, có số liệu người chơi',
        ],
      },
    },
  ],
  capstone: {
    name: 'Trò chơi có người chơi thật và được duy trì',
    brief: 'Sản phẩm game bạn phát hành, vá lỗi và cập nhật theo phản hồi.',
    requirements: [
      '≥ 100 lượt chơi từ người ngoài, có phản hồi thu thập được',
      '≥ 3 bản cập nhật dựa trên số liệu hoặc phản hồi',
      'Giữ ngân sách khung hình trên máy mục tiêu, có số đo công bố',
    ],
  },
  expertSignals: [
    'Chỉnh "cảm giác" bằng chơi thử có ghi số, không bằng tranh cãi',
    'Biết đâu là nút thắt CPU và đâu là nút thắt GPU trước khi tối ưu',
    'Cắt tính năng đúng lúc để game kịp hoàn thành',
    'Thiết kế mạng với giả định client luôn nói dối',
  ],
  careers: [
    'Gameplay Programmer',
    'Engine / Tools Programmer',
    'Graphics Programmer',
    'Technical Artist',
  ],
  pitfalls: [
    'Bắt đầu bằng game mơ ước quá lớn rồi bỏ dở',
    'Tự viết engine khi mục tiêu là làm game',
    'Buộc vật lý vào tốc độ khung hình',
    'Bỏ tối ưu tới phút chót, khi kiến trúc đã khoá cứng',
  ],
  resources: [
    'Game Programming Patterns — Robert Nystrom',
    'Real-Time Rendering (đồ hoạ)',
    'Tài liệu chính thức Godot / Unity',
    'The Art of Game Design — Jesse Schell',
  ],
}
