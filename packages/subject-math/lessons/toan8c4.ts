// lessons/toan8c4.ts — Toán 8, Chương 4: Định lí Thalès.
import type { MathLesson } from '../lessonTypes.js'

export const TOAN8_C4_LESSONS: MathLesson[] = [
  {
    id: 'toan8-c4-b1',
    grade: '8',
    chapterNumber: 4,
    chapterTitle: 'Định lí Thalès',
    lessonNumber: 1,
    title: 'Định lí Thalès trong tam giác',
    hook:
      'Chiếc thang gấp hình chữ A có thanh giằng ngang nối hai chân thang. Thanh giằng luôn song song với mặt đất, nên nó cắt hai chân thang ở những điểm “tương ứng”: ' +
      'nếu thanh giằng chia chân thang bên trái theo tỉ lệ 2 : 3 thì chân thang bên phải cũng bị chia đúng tỉ lệ 2 : 3. ' +
      'Đó là nội dung định lí Thalès. Bài này học cách dùng nó để tính độ dài và chứng minh hai đường thẳng song song.',
    theory:
      'TỈ SỐ HAI ĐOẠN THẲNG\n' +
      'Tỉ số của hai đoạn thẳng AB và CD (cùng đơn vị đo) là AB/CD. Hai cặp đoạn thẳng AB, CD và MN, PQ gọi là tỉ lệ nếu AB/CD = MN/PQ. Tỉ số không có đơn vị và không đổi khi đổi cả hai đoạn sang cùng một đơn vị khác.\n\n' +
      'ĐỊNH LÍ THALÈS\n' +
      'Nếu một đường thẳng song song với một cạnh của tam giác và cắt hai cạnh còn lại thì nó định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ.\n' +
      'Cụ thể: tam giác ABC, M thuộc AB, N thuộc AC và MN // BC. Khi đó\n' +
      '  AM/AB = AN/AC;  AM/MB = AN/NC;  MB/AB = NC/AC.\n' +
      'Vì sao đúng? Giả sử AM/MB = 2/3: chia AB thành 5 phần bằng nhau, M là điểm chia 2 phần. Qua các điểm chia kẻ các đường song song với BC. Các đường song song cách đều cắt hai cạnh của một góc thì chắn trên cạnh kia những đoạn bằng nhau, nên AC cũng bị chia thành 5 phần bằng nhau và N là điểm chia 2 phần: AN/NC = 2/3.\n\n' +
      'HỆ QUẢ\n' +
      'Nếu MN // BC (M thuộc AB, N thuộc AC) thì AM/AB = AN/AC = MN/BC. Tức là tam giác AMN có ba cạnh tỉ lệ với ba cạnh của tam giác ABC. Đây là bước đầu của tam giác đồng dạng ở chương sau.\n\n' +
      'ĐỊNH LÍ THALÈS ĐẢO\n' +
      'Nếu một đường thẳng cắt hai cạnh của tam giác và định ra trên hai cạnh đó những đoạn thẳng tương ứng tỉ lệ thì nó song song với cạnh còn lại. Ví dụ: M thuộc AB, N thuộc AC mà AM/AB = AN/AC thì MN // BC.\n\n' +
      'CÁCH DÙNG\n' +
      '— Tính độ dài: lập đúng tỉ lệ thức rồi nhân chéo.\n' +
      '— Chứng minh song song: tính hai tỉ số tương ứng, thấy bằng nhau thì kết luận song song (định lí đảo).\n\n' +
      'LỖI HAY GẶP\n' +
      '— Lập tỉ số không tương ứng, ví dụ AM/MB = AN/AB. Tử và mẫu phải cùng loại: đoạn gần đỉnh A trên đoạn còn lại của cạnh, hoặc đoạn gần đỉnh A trên cả cạnh, ở cả hai vế.\n' +
      '— Dùng định lí đảo mà so hai tỉ số không tương ứng (như AM/MB với NC/AN).\n' +
      '— Dùng định lí Thalès khi chưa biết MN // BC.',
    workedExample: {
      problem:
        'Tam giác ABC có M thuộc AB, N thuộc AC, MN // BC. Biết AM = 4 cm, MB = 6 cm, AN = 6 cm, BC = 15 cm. Tính NC, AC và MN.',
      steps: [
        'MN // BC nên theo định lí Thalès AM/MB = AN/NC, tức 4/6 = 6/NC.',
        'Suy ra NC = 6 × 6 : 4 = 9 cm.',
        'AC = AN + NC = 6 + 9 = 15 cm (N nằm giữa A và C).',
        'Theo hệ quả, MN/BC = AM/AB. Ta có AB = AM + MB = 10 cm nên MN/15 = 4/10, suy ra MN = 15 × 4 : 10 = 6 cm.',
      ],
      answer: 'NC = 9 cm, AC = 15 cm, MN = 6 cm.',
    },
    checkQuestions: [
      {
        prompt:
          'Tam giác ABC có D thuộc AB, E thuộc AC, DE // BC. Biết AD = 3 cm, DB = 5 cm, AE = 4,5 cm. Tính EC (đơn vị cm).',
        answer: { kind: 'numeric', value: 7.5 },
        explain:
          'DE // BC nên AD/DB = AE/EC, tức 3/5 = 4,5/EC, suy ra EC = 5 × 4,5 : 3 = 7,5 cm. Lỗi hay gặp là lập AD/DB = EC/AE (ngược tử mẫu) rồi ra EC = 2,7.',
      },
      {
        prompt:
          'Chiếc thang chữ A có đỉnh S, hai chân thang là SA và SB. Thanh giằng MN song song với AB, M thuộc SA, N thuộc SB. Biết SA = 2,4 m, SM = 1 m và thanh giằng MN dài 0,6 m. Tính khoảng cách AB giữa hai chân thang (đơn vị mét).',
        answer: { kind: 'numeric', value: 1.44 },
        explain:
          'MN // AB nên theo hệ quả MN/AB = SM/SA, suy ra AB = 0,6 × 2,4 : 1 = 1,44 m. Lỗi hay gặp là lập SM/MA thay vì SM/SA (không tương ứng) hoặc nhân nhầm thành AB = 0,6 × 1 : 2,4 = 0,25.',
      },
      {
        prompt:
          'Trong tam giác ABC, M thuộc AB, N thuộc AC. Bộ số đo nào (đơn vị cm) cho biết chắc chắn MN // BC?',
        choices: [
          { id: 'a', label: 'AM = 2, MB = 3, AN = 4, NC = 6' },
          { id: 'b', label: 'AM = 2, MB = 3, AN = 3, NC = 4' },
          { id: 'c', label: 'AM = 3, MB = 5, AN = 5, NC = 3' },
          { id: 'd', label: 'AM = 2, MB = 3, AN = 6, NC = 4' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Định lí đảo: ở phương án a có AM/MB = 2/3 = 4/6 = AN/NC nên MN // BC. Các phương án khác cho hai tỉ số khác nhau (hoặc bị đảo tử mẫu như phương án d); lỗi hay gặp là so tỉ số không tương ứng.',
      },
      {
        prompt:
          'Tam giác ABC có MN // BC (M thuộc AB, N thuộc AC), AM = 3 cm, MB = 5 cm. Tính tỉ số MN/BC (viết phân số).',
        answer: { kind: 'fraction', num: 3, den: 8 },
        explain:
          'Theo hệ quả MN/BC = AM/AB, mà AB = 3 + 5 = 8 cm nên MN/BC = 3/8. Lỗi hay gặp là lấy AM/MB = 3/5 vì quên rằng mẫu phải là cả cạnh AB.',
      },
    ],
    srsCards: [
      {
        hoi: 'Phát biểu định lí Thalès trong tam giác.',
        dap: 'Đường thẳng song song với một cạnh và cắt hai cạnh còn lại thì định ra trên hai cạnh đó các đoạn thẳng tương ứng tỉ lệ: AM/AB = AN/AC.',
      },
      {
        hoi: 'Hệ quả của định lí Thalès cho tỉ số ba cạnh?',
        dap: 'Nếu MN // BC thì AM/AB = AN/AC = MN/BC.',
      },
      {
        hoi: 'Định lí Thalès đảo dùng để làm gì?',
        dap: 'Chứng minh song song: nếu AM/AB = AN/AC (hoặc AM/MB = AN/NC) thì MN // BC.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c4-b2',
    grade: '8',
    chapterNumber: 4,
    chapterTitle: 'Định lí Thalès',
    lessonNumber: 2,
    title: 'Đường trung bình của tam giác',
    hook:
      'Làm sao đo bề ngang một cái ao mà không bơi qua được? Chọn một điểm C ngoài ao, căng dây tới hai điểm A, B ở hai mép ao rồi lấy trung điểm M của CA và N của CB. ' +
      'Chỉ cần đo đoạn MN trên bờ, nhân đôi là ra bề ngang AB. ' +
      'Mẹo này dựa trên tính chất đường trung bình của tam giác, một hệ quả đẹp của định lí Thalès.',
    theory:
      'ĐƯỜNG TRUNG BÌNH CỦA TAM GIÁC\n' +
      'Đường trung bình của tam giác là đoạn thẳng nối trung điểm hai cạnh của tam giác. Mỗi tam giác có ba đường trung bình.\n\n' +
      'ĐỊNH LÍ\n' +
      'Đường trung bình của tam giác thì song song với cạnh thứ ba và bằng nửa cạnh ấy. Với tam giác ABC, M là trung điểm AB, N là trung điểm AC thì MN // BC và MN = BC/2.\n' +
      'Vì sao? Vì M, N là trung điểm nên AM/AB = AN/AC = 1/2. Theo định lí Thalès đảo, MN // BC. Theo hệ quả của định lí Thalès, MN/BC = AM/AB = 1/2 nên MN = BC/2.\n\n' +
      'ĐỊNH LÍ BỔ SUNG\n' +
      'Đường thẳng đi qua trung điểm một cạnh và song song với cạnh thứ hai thì đi qua trung điểm cạnh thứ ba. Vì sao? Qua trung điểm M của AB kẻ đường thẳng song song BC cắt AC tại N. Theo Thalès AN/AC = AM/AB = 1/2 nên N là trung điểm AC.\n\n' +
      'ỨNG DỤNG\n' +
      '— Đo khoảng cách khi không đo trực tiếp được (như bề ngang ao): AB = 2 × MN.\n' +
      '— Ba đường trung bình của tam giác tạo thành một tam giác nhỏ có chu vi bằng nửa chu vi tam giác ban đầu, vì mỗi cạnh của nó bằng nửa cạnh tương ứng.\n' +
      '— Dùng để chứng minh song song và tính độ dài đoạn thẳng gấp đôi hoặc nửa.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Nhầm đường trung bình với đường trung tuyến. Trung tuyến nối MỘT đỉnh với trung điểm cạnh đối diện, không song song với cạnh nào và không bằng nửa cạnh nào.\n' +
      '— Cho rằng đoạn thẳng bất kỳ song song với một cạnh thì bằng nửa cạnh đó. Chỉ khi hai đầu đoạn là trung điểm của hai cạnh.\n' +
      '— Quên mất cạnh nào là cạnh thứ ba: đường trung bình nối trung điểm của AB và AC thì song song và bằng nửa BC (cạnh không đi qua hai đầu của nó).',
    workedExample: {
      problem:
        'Tam giác ABC có AB = 10 cm, BC = 14 cm, CA = 12 cm. Gọi D, E, F lần lượt là trung điểm của BC, CA, AB. Tính EF, FD, DE và so sánh chu vi tam giác DEF với chu vi tam giác ABC.',
      steps: [
        'EF nối trung điểm của CA và AB nên là đường trung bình ứng với cạnh BC: EF = BC : 2 = 7 cm.',
        'FD nối trung điểm của AB và BC nên ứng với cạnh CA: FD = CA : 2 = 6 cm.',
        'DE nối trung điểm của BC và CA nên ứng với cạnh AB: DE = AB : 2 = 5 cm.',
        'Chu vi tam giác DEF là 7 + 6 + 5 = 18 cm. Chu vi tam giác ABC là 10 + 14 + 12 = 36 cm. Vậy chu vi DEF bằng một nửa chu vi ABC.',
      ],
      answer: 'EF = 7 cm, FD = 6 cm, DE = 5 cm; chu vi DEF = 18 cm, bằng nửa chu vi ABC.',
    },
    checkQuestions: [
      {
        prompt:
          'Để đo bề ngang AB của một cái ao, bác Nam chọn điểm C ngoài ao, lấy M, N là trung điểm của CA, CB rồi đo được MN = 17,5 m. Tính AB (đơn vị mét).',
        answer: { kind: 'numeric', value: 35 },
        explain:
          'MN là đường trung bình của tam giác CAB nên MN = AB/2, suy ra AB = 2 × 17,5 = 35 m. Lỗi hay gặp là lấy AB = MN : 2 = 8,75 m vì nhớ ngược quan hệ nửa và gấp đôi.',
      },
      {
        prompt:
          'Tam giác ABC có chu vi 48 cm. Ba đường trung bình của nó tạo thành một tam giác. Tính chu vi tam giác đó (đơn vị cm).',
        answer: { kind: 'numeric', value: 24 },
        explain:
          'Mỗi cạnh của tam giác tạo bởi ba đường trung bình bằng nửa cạnh tương ứng của tam giác ABC nên chu vi bằng 48 : 2 = 24 cm. Lỗi hay gặp là tính chu vi gấp đôi hoặc cho rằng chu vi không đổi.',
      },
      {
        prompt: 'Phát biểu nào sau đây đúng?',
        choices: [
          {
            id: 'a',
            label: 'Đường trung bình của tam giác song song với cạnh thứ ba và bằng nửa cạnh ấy',
          },
          { id: 'b', label: 'Đường trung tuyến của tam giác bằng nửa cạnh đối diện' },
          { id: 'c', label: 'Đoạn nối một đỉnh với trung điểm cạnh đối diện là đường trung bình' },
          { id: 'd', label: 'Đường trung bình của tam giác bằng cạnh thứ ba' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Chỉ phát biểu a đúng với định lí đường trung bình. Đường trung tuyến nối một đỉnh với trung điểm cạnh đối diện, nói chung không bằng nửa cạnh đó; lỗi hay gặp là lẫn lộn hai loại đoạn thẳng này.',
      },
      {
        prompt:
          'Tam giác ABC có M là trung điểm của AB. Qua M kẻ đường thẳng song song với BC cắt AC tại N. Biết NC = 6,5 cm. Tính AC (đơn vị cm).',
        answer: { kind: 'numeric', value: 13 },
        explain:
          'Đường thẳng qua trung điểm M của AB và song song BC đi qua trung điểm N của AC, nên AN = NC = 6,5 cm và AC = 2 × 6,5 = 13 cm. Lỗi hay gặp là kết luận AC = NC = 6,5 cm vì quên rằng NC mới là một nửa của AC.',
      },
    ],
    srsCards: [
      {
        hoi: 'Đường trung bình của tam giác là gì?',
        dap: 'Đoạn thẳng nối trung điểm hai cạnh của tam giác.',
      },
      {
        hoi: 'Tính chất của đường trung bình tam giác?',
        dap: 'Song song với cạnh thứ ba và bằng nửa cạnh ấy.',
      },
      {
        hoi: 'Đường thẳng qua trung điểm một cạnh và song song cạnh thứ hai thì sao?',
        dap: 'Nó đi qua trung điểm cạnh thứ ba.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
  {
    id: 'toan8-c4-b3',
    grade: '8',
    chapterNumber: 4,
    chapterTitle: 'Định lí Thalès',
    lessonNumber: 3,
    title: 'Tính chất đường phân giác của tam giác',
    hook:
      'Một mảnh đất hình tam giác ABC giáp đường ở cạnh BC. Chủ đất muốn làm lối đi từ góc A ra đường sao cho lối đi chia đôi góc A, để hai bên vườn nhìn cân đối. ' +
      'Lối đi chạm đường tại điểm D. Nó có chia BC thành hai đoạn bằng nhau không? Không hẳn: D nằm gần về phía cạnh ngắn hơn. ' +
      'Bài này cho công thức chính xác: D chia BC theo tỉ lệ hai cạnh kề của góc A.',
    theory:
      'ĐƯỜNG PHÂN GIÁC CỦA TAM GIÁC\n' +
      'Tia phân giác của một góc chia góc đó thành hai góc bằng nhau. Trong tam giác ABC, đoạn thẳng AD (D thuộc BC) là phân giác của góc A khi ∠BAD = ∠CAD.\n\n' +
      'ĐỊNH LÍ\n' +
      'Đường phân giác của một góc trong tam giác chia cạnh đối diện thành hai đoạn thẳng tỉ lệ với hai cạnh kề của hai đoạn ấy. Tam giác ABC có AD là phân giác góc A thì\n' +
      '  DB/DC = AB/AC.\n' +
      'Vì sao? Qua C kẻ đường thẳng song song với AD, cắt tia BA tại E. Khi đó ∠E = ∠BAD (đồng vị) và ∠ACE = ∠CAD (so le trong). Vì ∠BAD = ∠CAD nên ∠E = ∠ACE, suy ra tam giác ACE cân tại A và AE = AC. Trong tam giác BCE có AD // CE nên theo định lí Thalès DB/DC = BA/AE = AB/AC.\n\n' +
      'CÁCH TÍNH ĐỘ DÀI\n' +
      'Từ DB/DC = AB/AC suy ra DB/AB = DC/AC = (DB + DC)/(AB + AC) = BC/(AB + AC). Do đó DB = BC × AB/(AB + AC) và DC = BC × AC/(AB + AC). Cạnh càng dài thì phần cạnh đối diện bị cắt về phía nó càng dài.\n\n' +
      'KIỂM TRA NHANH\n' +
      'Nếu tam giác cân tại A (AB = AC) thì DB/DC = 1, tức D là trung điểm BC: đường phân giác trùng đường trung tuyến, đúng với điều đã biết về tam giác cân.\n\n' +
      'LỖI HAY GẶP\n' +
      '— Viết ngược tỉ lệ thức thành DB/DC = AC/AB. Hãy nhớ: DB đi với AB (cạnh chứa B), DC đi với AC (cạnh chứa C).\n' +
      '— Nhầm phân giác với trung tuyến và cho rằng D luôn là trung điểm của BC.\n' +
      '— Lấy tỉ số DB/BC = AB/AC. Tỉ số này sai: tử và mẫu phải là hai đoạn trên BC (DB và DC) và hai cạnh kề (AB và AC).',
    workedExample: {
      problem:
        'Tam giác ABC có AB = 6 cm, AC = 9 cm, BC = 10 cm. Đường phân giác AD của góc A cắt BC tại D. Tính DB và DC.',
      steps: [
        'AD là phân giác góc A nên DB/DC = AB/AC = 6/9 = 2/3.',
        'Vậy BC chia theo tỉ lệ 2 : 3, tức BC gồm 2 + 3 = 5 phần bằng nhau, mỗi phần 10 : 5 = 2 cm.',
        'DB = 2 × 2 = 4 cm và DC = 3 × 2 = 6 cm.',
        'Kiểm tra: DB + DC = 10 cm = BC và DB/DC = 4/6 = 2/3 = AB/AC.',
      ],
      answer: 'DB = 4 cm, DC = 6 cm.',
    },
    checkQuestions: [
      {
        prompt:
          'Tam giác ABC có AB = 12 cm, AC = 18 cm, BC = 15 cm. Phân giác AD của góc A cắt BC tại D. Tính DB (đơn vị cm).',
        answer: { kind: 'numeric', value: 6 },
        explain:
          'DB/DC = AB/AC = 12/18 = 2/3, nên BC = 15 chia thành 5 phần, DB = 2 phần = 6 cm (và DC = 9 cm). Lỗi hay gặp là viết ngược DB/DC = 3/2 rồi ra DB = 9 cm.',
      },
      {
        prompt:
          'Tam giác ABC có AB = 8 cm và AC = 12 cm, AD là phân giác của góc A (D thuộc BC). Tính tỉ số DB/DC (viết phân số tối giản).',
        answer: { kind: 'fraction', num: 2, den: 3 },
        explain:
          'Theo tính chất đường phân giác DB/DC = AB/AC = 8/12 = 2/3. Lỗi hay gặp là đáp 1 vì tưởng phân giác chia đôi cạnh đối diện như đường trung tuyến.',
      },
      {
        prompt:
          'Mảnh đất tam giác ABC có AB = 30 m, AC = 50 m, cạnh BC = 64 m giáp đường. Lối đi AD chia đôi góc A và chạm đường tại D. Tính DC (đơn vị mét).',
        answer: { kind: 'numeric', value: 40 },
        explain:
          'DB/DC = AB/AC = 30/50 = 3/5 nên BC = 64 m gồm 3 + 5 = 8 phần, mỗi phần 8 m và DC = 5 × 8 = 40 m (DB = 24 m). Lỗi hay gặp là tính nhầm DC = 3 phần = 24 m, tức đảo hai đoạn.',
      },
      {
        prompt:
          'Tam giác ABC có AB = 5, AC = 7 và AD là phân giác của góc A (D thuộc BC). Hệ thức nào đúng?',
        choices: [
          { id: 'a', label: 'DB/DC = 5/7' },
          { id: 'b', label: 'DB/DC = 7/5' },
          { id: 'c', label: 'DB/DC = 1' },
          { id: 'd', label: 'DB/BC = 5/7' },
        ],
        answer: { kind: 'choice', correctIds: ['a'] },
        explain:
          'Tính chất đường phân giác cho DB/DC = AB/AC = 5/7. Phương án b viết ngược, c chỉ đúng khi AB = AC, d trộn lẫn BC (cả cạnh) với DC nên sai; lỗi hay gặp là ghép sai cặp đoạn.',
      },
    ],
    srsCards: [
      {
        hoi: 'Tính chất đường phân giác trong tam giác?',
        dap: 'AD là phân giác góc A thì DB/DC = AB/AC.',
      },
      {
        hoi: 'Cách nhớ tỉ lệ thức của tính chất đường phân giác?',
        dap: 'DB đi với AB, DC đi với AC: hai đoạn trên cạnh đối diện tỉ lệ với hai cạnh kề tương ứng.',
      },
      {
        hoi: 'Khi nào đường phân giác trùng đường trung tuyến?',
        dap: 'Khi AB = AC (tam giác cân tại A), vì DB/DC = 1.',
      },
    ],
    track: 'core',
    reviewStatus: 'draft',
  },
]
