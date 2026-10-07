// lessons/llmagentu1.ts — Chương "NLP → LLM" của khoá ngắn "LLMs & AI Agents"
// (docs/specs/2026-09-01-llmagent-bai-hoc-chi-tiet.md).
//
// unitId 'llmagent-u1' KHÔNG nằm trong curriculum.ts — là "unit ảo" của tầng khoá ngắn,
// được lessons.test.ts công nhận qua SHORT_COURSES (courses/registry.ts), đúng cơ chế 'git-u*'.
//
// Luật soạn riêng của khoá: mọi bài language 'python', code được chấm là Python THUẦN (chỉ
// thư viện chuẩn `math`) để Pyodide trình duyệt và python3 CI chấm y hệt nhau; mọi output
// in ra bằng tiếng Việt KHÔNG DẤU, số thực luôn round() cho test-case ổn định.
import type { ProgrammingLesson } from '../lessonTypes.js'

export const LLMAGENT_U1_LESSONS: ProgrammingLesson[] = [
  {
    id: 'llmagent-u1-l1',
    unitId: 'llmagent-u1',
    language: 'python',
    title: 'Văn bản thành số — tokenizer subword theo luật cố định',
    hook: 'Máy không đọc chữ, nó chỉ đọc số. Trước khi một câu tới được mô hình, nó bị băm thành các MẢNH gọi là token. Thử gõ "internationalization" vào ô đếm token của OpenAI: một từ mà bị băm thành mấy token, trong khi "cat" chỉ tốn đúng 1 token. Vì sao lại thế — và vì sao điều đó quyết định hoá đơn của bạn?',
    theory:
      'TOKEN là đơn vị nhỏ nhất mà mô hình ngôn ngữ nhìn thấy. Có ba cách băm văn bản:\n\n1. THEO KÝ TỰ — bảng từ vựng bé xíu (vài trăm), nhưng câu trở nên rất dài, mô hình phải học lại từ đầu rằng "m","e","o" ghép lại mới là một con mèo.\n2. THEO TỪ — câu ngắn gọn, nhưng bảng từ vựng phình vô hạn và mọi từ chưa gặp đều thành <unknown>: tên riêng, từ mới, lỗi chính tả đều mù.\n3. THEO SUBWORD (mảnh dưới-từ) — đường giữa, và là thứ mọi LLM ngày nay dùng. Từ thông dụng giữ nguyên một mảnh; từ hiếm bị CẮT thành các mảnh quen thuộc.\n\nBPE (Byte Pair Encoding) là thuật toán tìm ra bộ mảnh đó: bắt đầu từ ký tự đơn, lặp đi lặp lại việc GỘP cặp ký tự hay đi liền nhau nhất thành một mảnh mới, cho tới khi đủ số mảnh mong muốn. Kết quả: "hoc" giữ nguyên vì hay gặp, còn "internationalization" bị xẻ ra vì hiếm.\n\nBài này KHÔNG cài BPE: code của bài không đếm cặp, không gộp gì và không học từ kho văn bản nào. Ta cài một tokenizer subword TỐI GIẢN nhưng TẤT ĐỊNH, giữ đúng cái ý cốt lõi: TỪ NGẮN GIỮ NGUYÊN, TỪ DÀI BỊ CẮT. Khác biệt lớn nhất: BPE cắt theo các mảnh ĐÃ HỌC được là hay gặp, còn luật dưới đây cắt theo ĐỘ DÀI, bất kể mảnh nào quen. Luật cố định: từ dài hơn 5 ký tự thì cắt làm đôi tại vị trí len(tu) // 2, mảnh sau gắn tiền tố "##" để đánh dấu "đây là phần nối tiếp, không phải từ mới". Tiền tố "##" chính là quy ước thật của WordPiece trong BERT.\n\nHệ quả tiền bạc: nhà cung cấp tính tiền theo TOKEN chứ không theo từ. Tiếng Việt không dấu thường tốn ít token hơn tiếng Việt có dấu, và tiếng Anh tốn ít nhất — vì bộ mảnh của mô hình được học chủ yếu từ tiếng Anh.',
    workedExample: {
      code: `# Tokenizer subword toi gian: tu dai hon 5 ky tu thi cat lam doi
def tach_token(tu):
    if len(tu) > 5:                 # tu hiem/dai -> cat thanh 2 manh
        giua = len(tu) // 2         # vi tri cat CO DINH, khong ngau nhien
        return [tu[:giua], "##" + tu[giua:]]
    return [tu]                     # tu ngan -> giu nguyen mot manh

cau = "meo an chuong trinh"
tokens = []
for tu in cau.split():              # tach tho theo khoang trang truoc
    tokens += tach_token(tu)        # roi tach tiep tung tu thanh subword

print("Tokens:", tokens)
print("So token:", len(tokens))
print("So tu:", len(cau.split()))   # so token >= so tu, luon luon`,
      stdinLines: [],
    },
    predict: {
      code: `def tach_token(tu):\n    if len(tu) > 5:\n        giua = len(tu) // 2\n        return [tu[:giua], "##" + tu[giua:]]\n    return [tu]\n\nprint(tach_token("trinh"))\nprint(tach_token("chuong"))`,
      question: 'Hai dòng print in ra gì?',
      choices: [
        "['trinh']\n['chu', '##ong']",
        "['tri', '##nh']\n['chu', '##ong']",
        "['trinh']\n['chuong']",
        "['t', '##rinh']\n['c', '##huong']",
      ],
      answerIndex: 0,
      explain:
        '"trinh" dài đúng 5 ký tự — luật là "dài HƠN 5" nên 5 không thoả, từ giữ nguyên một mảnh. "chuong" dài 6, thoả điều kiện: giua = 6 // 2 = 3, cắt thành "chu" và "##ong". Đây chính là ca biên hay sai nhất: > 5 khác >= 5.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự một tokenizer subword: định nghĩa luật cắt → duyệt từng từ của câu → gom mảnh → in kết quả.',
      lines: [
        'def tach_token(tu):',
        '    if len(tu) > 5:',
        '        giua = len(tu) // 2',
        '        return [tu[:giua], "##" + tu[giua:]]',
        '    return [tu]',
        'tokens = []',
        'for tu in "meo an chuong".split():',
        '    tokens += tach_token(tu)',
        'print(tokens)',
      ],
    },
    make: {
      prompt:
        'Viết tokenizer subword mini của riêng bạn.\n\nĐọc MỘT dòng input() là câu cần tách (tiếng Việt không dấu, các từ cách nhau bởi khoảng trắng).\n\nLuật tách CỐ ĐỊNH:\n- Tách câu theo khoảng trắng để được các từ.\n- Với mỗi từ: nếu độ dài LỚN HƠN 5 thì cắt làm đôi tại vị trí len(tu) // 2 — mảnh đầu giữ nguyên, mảnh sau thêm tiền tố "##". Ngược lại giữ nguyên cả từ làm một token.\n\nIn đúng 2 dòng:\nTokens: <các token nối nhau bằng dấu |>\nSo token: <số token>\n\nVí dụ với "chuong trinh may tinh":\nTokens: chu|##ong|trinh|may|tinh\nSo token: 5',
      starterCode: `cau = input("Cau: ")\ntokens = []\nfor tu in cau.split():\n    # Neu len(tu) > 5: cat lam doi tai len(tu) // 2, manh sau them "##"\n    # Nguoc lai: them nguyen tu vao tokens\n    pass\nprint("Tokens: " + "|".join(tokens))\nprint(f"So token: {len(tokens)}")\n`,
      testCases: [
        {
          stdinLines: ['toi hoc lap trinh'],
          expected: 'Tokens: toi|hoc|lap|trinh\nSo token: 4',
          match: 'contains',
          hidden: false,
          label: 'Mọi từ đều ≤ 5 ký tự → không từ nào bị cắt, 4 token',
        },
        {
          stdinLines: ['chuong trinh may tinh'],
          expected: 'Tokens: chu|##ong|trinh|may|tinh\nSo token: 5',
          match: 'contains',
          hidden: false,
          label: '"chuong" (6 ký tự) bị cắt thành chu + ##ong → 5 token',
        },
        {
          stdinLines: ['internationalization'],
          expected: 'Tokens: internatio|##nalization\nSo token: 2',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: từ 20 ký tự → cắt tại vị trí 10',
        },
      ],
      hints: [
        'Tách câu thành từ: cau.split() trả về list các từ, đã tự bỏ khoảng trắng thừa.',
        'Cắt chuỗi bằng lát cắt: tu[:giua] là phần đầu, tu[giua:] là phần sau. Nhớ giua = len(tu) // 2 (chia lấy nguyên, không phải chia /).',
        'Thêm nhiều phần tử một lúc: tokens.append(x) thêm 1 phần tử, còn tokens += [a, b] thêm 2. Điều kiện là > 5, KHÔNG phải >= 5.',
      ],
      sampleSolution: `cau = input("Cau: ")\ntokens = []\nfor tu in cau.split():\n    if len(tu) > 5:\n        giua = len(tu) // 2\n        tokens.append(tu[:giua])\n        tokens.append("##" + tu[giua:])\n    else:\n        tokens.append(tu)\nprint("Tokens: " + "|".join(tokens))\nprint(f"So token: {len(tokens)}")`,
    },
    homework:
      'Mở một ô đếm token trực tuyến (OpenAI tokenizer hoặc tương đương) và dán vào 3 đoạn: một đoạn tiếng Anh, cùng đoạn đó dịch sang tiếng Việt CÓ dấu, và bản KHÔNG dấu. Ghi lại số token của từng bản. Đoạn nào tốn nhiều token nhất? Nếu bạn trả tiền theo token, viết ra một câu kết luận về việc nên viết prompt bằng ngôn ngữ nào.',
    srsCards: [
      {
        hoi: 'Vì sao LLM tách theo SUBWORD chứ không theo ký tự hay theo từ?',
        dap: 'Theo ký tự: bảng từ vựng nhỏ nhưng câu quá dài, mô hình phải học lại cách ghép chữ. Theo từ: câu ngắn nhưng bảng từ vựng phình vô hạn, mọi từ lạ thành <unknown>. Subword là đường giữa: từ thông dụng giữ nguyên một mảnh, từ hiếm bị cắt thành mảnh quen — không bao giờ mù trước từ mới.',
      },
      {
        hoi: 'BPE (Byte Pair Encoding) học bộ mảnh bằng cách nào?',
        dap: 'Bắt đầu từ các ký tự đơn, rồi lặp đi lặp lại: tìm CẶP ký tự/mảnh hay đi liền nhau nhất trong kho văn bản và GỘP chúng thành một mảnh mới, cho tới khi đủ số mảnh mong muốn. Kết quả là từ càng hay gặp càng được giữ nguyên thành một token.',
      },
      {
        hoi: 'Tiền tố "##" trước một token có nghĩa gì?',
        dap: 'Đánh dấu mảnh đó là PHẦN NỐI TIẾP của từ đứng trước, không phải một từ mới bắt đầu — quy ước của WordPiece (BERT). Nhờ nó, khi ghép token ngược lại thành văn bản, máy biết chỗ nào không được chèn khoảng trắng.',
      },
    ],
  },
  {
    id: 'llmagent-u1-l2',
    unitId: 'llmagent-u1',
    language: 'python',
    title: 'Embedding — nghĩa là một vector, gần nhau là gần nghĩa',
    hook: 'Máy tìm kiếm cũ khớp CHỮ: gõ "xe hai banh" không ra bài viết về "xe may". Máy tìm kiếm mới khớp NGHĨA, vì mỗi câu được biến thành một mũi tên trong không gian nhiều chiều, và hai mũi tên gần nhau thì gần nghĩa — kể cả khi không chung một chữ nào.',
    theory:
      'EMBEDDING = biến một mẩu văn bản thành một VECTOR số thực. Mô hình thật cho ra vector 768 hoặc 1536 chiều, học được từ hàng tỉ câu, và có tính chất nổi tiếng: vector("vua") − vector("dan ong") + vector("dan ba") ≈ vector("hoang hau"). Nghĩa được mã hoá thành HƯỚNG trong không gian.\n\nĐo "gần nghĩa" bằng gì? Không dùng khoảng cách thẳng, mà dùng COSINE SIMILARITY — cosin của góc giữa hai vector:\n\ncos(a, b) = (a · b) / (|a| × |b|)\n\ntrong đó a · b = tổng a[i] × b[i] (tích vô hướng), còn |a| = căn bậc hai của tổng a[i]². Kết quả nằm trong khoảng −1 tới 1 với vector bất kỳ, và 0 tới 1 với vector toàn số không âm (như bài này): 1 = cùng hướng hoàn toàn, 0 = vuông góc, không liên quan.\n\nVì sao là cosine chứ không phải khoảng cách? Vì cosine chỉ quan tâm HƯỚNG, bỏ qua ĐỘ DÀI. Một đoạn văn dài và một câu ngắn cùng nói về mèo sẽ có vector cùng hướng nhưng độ dài rất khác — cosine vẫn chấm chúng là giống nhau, còn khoảng cách thẳng thì không.\n\nBài này KHÔNG dùng embedding thật (cần mô hình đã huấn luyện). Ta dùng "embedding giả lập": vector đếm 5 nguyên âm a, e, i, o, u trong từ. Nó vô nghĩa về mặt ngữ nghĩa, nhưng ĐỦ để bạn tự tay cài công thức cosine — và chính công thức đó, không đổi một dấu, sẽ chạy trên embedding thật ở bài RAG (chương 2).',
    workedExample: {
      code: `import math

NGUYEN_AM = ["a", "e", "i", "o", "u"]

def nhung(tu):                       # "embedding" gia lap: dem nguyen am
    return [tu.count(k) for k in NGUYEN_AM]

def cosine(a, b):
    tich = sum(a[i] * b[i] for i in range(len(a)))   # tich vo huong a.b
    do_dai_a = math.sqrt(sum(x * x for x in a))      # |a|
    do_dai_b = math.sqrt(sum(x * x for x in b))      # |b|
    if do_dai_a == 0 or do_dai_b == 0:               # ca bien: vector khong
        return 0.0                                   # tranh chia cho 0
    return tich / (do_dai_a * do_dai_b)

print(nhung("meo"))                  # [0, 1, 0, 1, 0]: mot chu e, mot chu o
print(nhung("keo"))                  # [0, 1, 0, 1, 0]: y het -> cung huong
print(round(cosine(nhung("meo"), nhung("keo")), 4))
print(round(cosine(nhung("meo"), nhung("chim")), 4))`,
      stdinLines: [],
    },
    predict: {
      code: `import math\n\ndef cosine(a, b):\n    tich = sum(a[i] * b[i] for i in range(len(a)))\n    na = math.sqrt(sum(x * x for x in a))\n    nb = math.sqrt(sum(x * x for x in b))\n    return tich / (na * nb)\n\nprint(round(cosine([1, 0], [2, 0]), 4))`,
      question: 'Hai vector [1, 0] và [2, 0] cho cosine bằng bao nhiêu?',
      choices: ['1.0', '0.5', '2.0', '0.0'],
      answerIndex: 0,
      explain:
        'Tích vô hướng = 1×2 + 0×0 = 2; |a| = 1; |b| = 2; cosine = 2 / (1 × 2) = 1.0. Hai vector này khác ĐỘ DÀI (một dài gấp đôi) nhưng cùng HƯỚNG, và cosine chỉ đo hướng — đó chính là lý do dùng cosine thay vì khoảng cách khi so nghĩa của văn bản dài ngắn khác nhau.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự hàm cosine similarity: tích vô hướng → hai độ dài → chặn chia cho 0 → chia.',
      lines: [
        'def cosine(a, b):',
        '    tich = sum(a[i] * b[i] for i in range(len(a)))',
        '    na = math.sqrt(sum(x * x for x in a))',
        '    nb = math.sqrt(sum(x * x for x in b))',
        '    if na == 0 or nb == 0:',
        '        return 0.0',
        '    return tich / (na * nb)',
      ],
    },
    make: {
      prompt:
        'Tự cài embedding giả lập + cosine similarity.\n\nĐọc 2 dòng input(): dòng 1 là từ thứ nhất, dòng 2 là từ thứ hai (tiếng Việt không dấu, viết thường).\n\nBước 1 — "nhúng" mỗi từ thành vector 5 chiều: đếm số lần xuất hiện của a, e, i, o, u (đúng thứ tự đó).\nBước 2 — tính cosine similarity giữa 2 vector. Nếu một trong hai vector có độ dài 0 thì kết quả là 0.0 (không được chia cho 0).\n\nIn đúng 3 dòng:\nVector 1: <vector từ 1>\nVector 2: <vector từ 2>\nCosine: <cosine làm tròn 4 chữ số>\n\nVí dụ "meo" và "keo" → cả hai đều là [0, 1, 0, 1, 0] → Cosine: 1.0',
      starterCode: `import math\n\nNGUYEN_AM = ["a", "e", "i", "o", "u"]\n\ndef nhung(tu):\n    # Tra ve list 5 so: so lan xuat hien cua tung nguyen am trong tu\n    pass\n\ndef cosine(a, b):\n    # tich vo huong / (do dai a * do dai b), chan truong hop do dai = 0\n    pass\n\nt1 = input("Tu 1: ")\nt2 = input("Tu 2: ")\n`,
      testCases: [
        {
          stdinLines: ['meo', 'keo'],
          expected: 'Vector 1: [0, 1, 0, 1, 0]\nVector 2: [0, 1, 0, 1, 0]\nCosine: 1.0',
          match: 'contains',
          hidden: false,
          label: 'Hai từ cùng bộ nguyên âm → cosine 1.0',
        },
        {
          stdinLines: ['meo', 'chim'],
          expected: 'Cosine: 0.0',
          match: 'contains',
          hidden: false,
          label: 'Không chung nguyên âm nào → vuông góc, cosine 0.0',
        },
        {
          stdinLines: ['mua', 'muoi'],
          expected: 'Cosine: 0.4082',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: chung một chữ u → 1 / (căn 2 × căn 3) ≈ 0.4082',
        },
        {
          stdinLines: ['ttt', 'meo'],
          expected: 'Cosine: 0.0',
          match: 'contains',
          hidden: true,
          label:
            'Ca ẩn biên: từ không có nguyên âm → vector toàn 0, phải trả 0.0 chứ không lỗi chia cho 0',
        },
      ],
      hints: [
        'Đếm ký tự trong chuỗi: "meo".count("e") trả về 1. Ghép thành list bằng [tu.count(k) for k in NGUYEN_AM].',
        'In list trực tiếp: print(f"Vector 1: {nhung(t1)}") cho ra dạng [0, 1, 0, 1, 0] — đúng định dạng đề yêu cầu, không cần tự ghép chuỗi.',
        'Ca biên quan trọng: từ "ttt" cho vector toàn số 0 nên |a| = 0. Phải kiểm tra TRƯỚC khi chia, nếu không chương trình sẽ dừng vì ZeroDivisionError.',
      ],
      sampleSolution: `import math\n\nNGUYEN_AM = ["a", "e", "i", "o", "u"]\n\ndef nhung(tu):\n    return [tu.count(k) for k in NGUYEN_AM]\n\ndef cosine(a, b):\n    tich = sum(a[i] * b[i] for i in range(len(a)))\n    na = math.sqrt(sum(x * x for x in a))\n    nb = math.sqrt(sum(x * x for x in b))\n    if na == 0 or nb == 0:\n        return 0.0\n    return tich / (na * nb)\n\nt1 = input("Tu 1: ")\nt2 = input("Tu 2: ")\nprint(f"Vector 1: {nhung(t1)}")\nprint(f"Vector 2: {nhung(t2)}")\nprint(f"Cosine: {round(cosine(nhung(t1), nhung(t2)), 4)}")`,
    },
    homework:
      'Embedding giả lập của bài này đếm nguyên âm — nó bảo "meo" và "keo" giống hệt nhau, dù một con là mèo còn một cái là kẹo. Hãy viết ra 3 cặp từ mà embedding này chấm SAI so với cảm nhận của bạn về nghĩa, và với mỗi cặp nói rõ: embedding thật cần biết thêm THÔNG TIN gì để chấm đúng? Gợi ý: nó cần được học từ hàng tỉ câu người thật viết, chứ không phải từ mặt chữ.',
    srsCards: [
      {
        hoi: 'Embedding là gì và vì sao hai vector gần nhau lại nghĩa là gần nghĩa?',
        dap: 'Embedding biến một mẩu văn bản thành vector số thực nhiều chiều, học từ hàng tỉ câu. Mô hình được huấn luyện sao cho những mẩu văn bản xuất hiện trong ngữ cảnh giống nhau thì có vector chỉ về cùng một HƯỚNG — nên khoảng cách góc giữa hai vector phản ánh mức gần nghĩa.',
      },
      {
        hoi: 'Công thức cosine similarity, viết đủ?',
        dap: 'cos(a, b) = (a · b) / (|a| × |b|), với a · b = tổng a[i] × b[i] và |a| = căn bậc hai của tổng a[i]². Kết quả 1 = cùng hướng, 0 = vuông góc (không liên quan), −1 = ngược hướng.',
      },
      {
        hoi: 'Vì sao so nghĩa văn bản dùng cosine chứ không dùng khoảng cách thẳng?',
        dap: 'Cosine chỉ đo HƯỚNG và bỏ qua ĐỘ DÀI vector. Một đoạn văn dài và một câu ngắn cùng chủ đề có vector cùng hướng nhưng độ dài rất khác nhau: cosine vẫn chấm là giống, còn khoảng cách thẳng sẽ chấm là xa nhau.',
      },
    ],
  },
  {
    id: 'llmagent-u1-l3',
    unitId: 'llmagent-u1',
    language: 'python',
    title: 'Mô hình ngôn ngữ — sinh chữ bằng bigram tự cài',
    hook: 'Bàn phím điện thoại gợi ý từ tiếp theo, và bạn bấm liên tiếp: "toi hoc lap trinh moi ngay..." — nó không hiểu gì cả, nó chỉ ĐẾM xem sau từ này người ta hay viết từ nào nhất. Toàn bộ ChatGPT, ở lõi, cũng chỉ làm đúng một việc đó — chỉ là đếm bằng 175 tỉ tham số thay vì một cái bảng.',
    theory:
      'MÔ HÌNH NGÔN NGỮ = cỗ máy trả lời một câu hỏi duy nhất: "cho dãy từ đã có, từ TIẾP THEO nhiều khả năng là gì?". Sinh một đoạn văn = hỏi câu đó lặp đi lặp lại, mỗi lần nối từ vừa sinh vào cuối rồi hỏi tiếp.\n\nMô hình n-gram là bản đơn giản nhất:\n- BIGRAM (n = 2): xác suất từ tiếp theo chỉ phụ thuộc MỘT từ ngay trước. Học = đếm mọi cặp từ liền nhau trong kho văn bản. Sau "hoc" thấy "lap" 2 lần, "tieng" 1 lần → đoán "lap".\n- TRIGRAM (n = 3): phụ thuộc HAI từ trước. Chính xác hơn nhiều ("ha noi" → "la" khác hẳn "noi" một mình), nhưng số tổ hợp cần đếm tăng vọt và phần lớn tổ hợp không bao giờ xuất hiện trong kho — gọi là vấn đề THƯA (sparsity).\n\nĐó chính là bức tường của n-gram: muốn nhìn xa hơn phải tăng n, mà tăng n thì dữ liệu không bao giờ đủ. Transformer (bài sau) đập vỡ bức tường này bằng cách KHÔNG đếm tổ hợp, mà học vector cho từng từ và để attention tự quyết định từ nào ở xa vẫn đáng chú ý.\n\nChọn từ tiếp theo thế nào? Bài này chọn TẤT ĐỊNH: lấy từ có tần suất CAO NHẤT (greedy). Ưu điểm: chạy 10 lần ra 10 kết quả y hệt, test được. Nhược điểm: văn bản nhàm và dễ lặp vòng. LLM thật thêm nhiệt độ (temperature) và top-p để BỐC NGẪU NHIÊN theo xác suất — đó là lý do hỏi ChatGPT hai lần được hai câu trả lời khác nhau.\n\nLưu ý cài đặt: khi hai từ đồng tần suất, hàm max() của Python trả về từ GẶP TRƯỚC (dict giữ thứ tự chèn từ Python 3.7) — nên kết quả vẫn tất định.',
    workedExample: {
      code: `VAN_BAN = "toi hoc lap trinh toi hoc tieng anh toi thich hoc"
tu = VAN_BAN.split()

bang = {}                            # bang[tu_truoc][tu_sau] = so lan
for i in range(len(tu) - 1):         # dung o len-1: cap cuoi la (n-2, n-1)
    truoc = tu[i]
    sau = tu[i + 1]
    if truoc not in bang:
        bang[truoc] = {}
    bang[truoc][sau] = bang[truoc].get(sau, 0) + 1

print("Sau 'toi' co the la:", bang["toi"])
print("Sau 'hoc' co the la:", bang["hoc"])

# Sinh greedy: luon chon tu co tan suat cao nhat
hien_tai = "toi"
for _ in range(3):
    ke_tiep = max(bang[hien_tai], key=lambda k: bang[hien_tai][k])
    print(hien_tai, "->", ke_tiep)
    hien_tai = ke_tiep`,
      stdinLines: [],
    },
    predict: {
      code: `tu = "a b a c a b".split()\nbang = {}\nfor i in range(len(tu) - 1):\n    bang.setdefault(tu[i], {})\n    bang[tu[i]][tu[i + 1]] = bang[tu[i]].get(tu[i + 1], 0) + 1\nprint(bang["a"])`,
      question: 'Bảng bigram của từ "a" in ra gì?',
      choices: [
        "{'b': 2, 'c': 1}",
        "{'b': 1, 'c': 1}",
        "{'b': 2, 'c': 2}",
        "{'a': 3, 'b': 2, 'c': 1}",
      ],
      answerIndex: 0,
      explain:
        'Dãy là a b a c a b. Các cặp liền nhau bắt đầu bằng "a": (a,b) ở vị trí 0, (a,c) ở vị trí 2, (a,b) ở vị trí 4. Vậy "b" đếm 2 lần, "c" đếm 1 lần. Chữ "a" cuối cùng ở vị trí 4 vẫn tính vì còn từ đứng sau; nếu "a" là từ cuối dãy thì nó không sinh ra cặp nào.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự huấn luyện bigram rồi sinh một từ: tách từ → khởi tạo bảng → đếm cặp liền nhau → chọn từ tần suất cao nhất.',
      lines: [
        'tu = VAN_BAN.split()',
        'bang = {}',
        'for i in range(len(tu) - 1):',
        '    if tu[i] not in bang:',
        '        bang[tu[i]] = {}',
        '    bang[tu[i]][tu[i + 1]] = bang[tu[i]].get(tu[i + 1], 0) + 1',
        'ke_tiep = max(bang["toi"], key=lambda k: bang["toi"][k])',
        'print(ke_tiep)',
      ],
    },
    make: {
      prompt:
        'Tự cài mô hình ngôn ngữ bigram và dùng nó SINH văn bản.\n\nKho huấn luyện đã nhúng sẵn trong starter code (biến VAN_BAN) — không được đổi.\n\nĐọc 2 dòng input():\n- Dòng 1: từ bắt đầu.\n- Dòng 2: số từ muốn sinh THÊM (một số nguyên).\n\nCách làm: đếm mọi cặp từ liền nhau trong VAN_BAN thành bảng bigram. Bắt đầu từ "từ bắt đầu", lặp đúng số lần yêu cầu: mỗi lần chọn từ tiếp theo có TẦN SUẤT CAO NHẤT (nếu bằng nhau, lấy từ gặp trước trong kho — dùng max() là đúng luôn), nối vào chuỗi. Nếu từ hiện tại KHÔNG có trong bảng (chưa từng có từ nào đứng sau nó) thì DỪNG sớm.\n\nIn đúng 1 dòng:\nChuoi sinh: <các từ nối nhau bằng khoảng trắng, gồm cả từ bắt đầu>',
      starterCode: `VAN_BAN = "toi hoc lap trinh moi ngay toi hoc tieng anh moi ngay toi thich hoc lap trinh"\n\ntu = VAN_BAN.split()\nbang = {}\n# Dem moi cap tu lien nhau vao bang[truoc][sau]\n\nbat_dau = input("Tu bat dau: ")\nso_tu = int(input("So tu sinh them: "))\n# Lap so_tu lan: chon tu co tan suat cao nhat, noi vao chuoi, dung som neu bi tac\nprint("Chuoi sinh: " + " ".join(chuoi))\n`,
      testCases: [
        {
          stdinLines: ['toi', '5'],
          expected: 'Chuoi sinh: toi hoc lap trinh moi ngay',
          match: 'contains',
          hidden: false,
          label: 'Từ "toi": sau nó "hoc" xuất hiện 2 lần, "thich" 1 lần → chọn "hoc"',
        },
        {
          stdinLines: ['ngay', '3'],
          expected: 'Chuoi sinh: ngay toi hoc lap',
          match: 'contains',
          hidden: false,
          label: 'Bắt đầu giữa kho, sinh 3 từ',
        },
        {
          stdinLines: ['anh', '4'],
          expected: 'Chuoi sinh: anh moi ngay toi hoc',
          match: 'contains',
          hidden: false,
          label: 'Từ chỉ có đúng một lựa chọn kế tiếp',
        },
        {
          stdinLines: ['xyz', '3'],
          expected: 'Chuoi sinh: xyz',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: từ không có trong kho → dừng ngay, chỉ in chính nó',
        },
      ],
      hints: [
        'Đếm cặp: duyệt i từ 0 tới len(tu) - 2 (viết range(len(tu) - 1)), lấy tu[i] làm khoá ngoài, tu[i + 1] làm khoá trong.',
        'Chọn từ tần suất cao nhất trong một dict: max(bang[hien_tai], key=lambda k: bang[hien_tai][k]) — max trên dict duyệt qua các KHOÁ, key= nói cho nó so bằng giá trị đếm.',
        'Dừng sớm: đầu mỗi vòng lặp kiểm tra if hien_tai not in bang: break. Đừng quên cập nhật hien_tai = ke_tiep cuối mỗi vòng, nếu không nó sẽ lặp mãi một từ.',
      ],
      sampleSolution: `VAN_BAN = "toi hoc lap trinh moi ngay toi hoc tieng anh moi ngay toi thich hoc lap trinh"\n\ntu = VAN_BAN.split()\nbang = {}\nfor i in range(len(tu) - 1):\n    truoc = tu[i]\n    sau = tu[i + 1]\n    if truoc not in bang:\n        bang[truoc] = {}\n    bang[truoc][sau] = bang[truoc].get(sau, 0) + 1\n\nbat_dau = input("Tu bat dau: ")\nso_tu = int(input("So tu sinh them: "))\nchuoi = [bat_dau]\nhien_tai = bat_dau\nfor _ in range(so_tu):\n    if hien_tai not in bang:\n        break\n    ke_tiep = max(bang[hien_tai], key=lambda k: bang[hien_tai][k])\n    chuoi.append(ke_tiep)\n    hien_tai = ke_tiep\nprint("Chuoi sinh: " + " ".join(chuoi))`,
    },
    homework:
      'Nâng bigram của bạn thành TRIGRAM: khoá của bảng là một CẶP hai từ trước (dùng tuple (tu[i], tu[i+1]) làm khoá) thay vì một từ. Chạy thử trên cùng kho văn bản và trả lời: chuỗi sinh ra có tự nhiên hơn không, và bao nhiêu cặp hai-từ chỉ xuất hiện đúng MỘT lần? Con số đó chính là "vấn đề thưa" đang hiện ra trước mắt bạn.',
    srsCards: [
      {
        hoi: 'Mô hình ngôn ngữ trả lời câu hỏi gì, và sinh văn bản bằng cách nào?',
        dap: 'Nó trả lời: "cho dãy từ đã có, từ tiếp theo nhiều khả năng là gì?". Sinh văn bản = lặp lại câu hỏi đó: đoán một từ, nối vào cuối dãy, rồi lại hỏi tiếp — cho tới khi đủ độ dài hoặc gặp dấu hiệu kết thúc.',
      },
      {
        hoi: 'Bigram khác trigram ở đâu, và vì sao không cứ thế tăng n mãi?',
        dap: 'Bigram đoán từ tiếp theo dựa vào MỘT từ trước, trigram dựa vào HAI từ trước nên chính xác hơn. Nhưng n càng lớn thì số tổ hợp cần đếm tăng vọt trong khi kho văn bản có hạn — phần lớn tổ hợp không bao giờ xuất hiện (vấn đề THƯA), nên mô hình không học được gì cho chúng.',
      },
      {
        hoi: 'Chọn từ tiếp theo kiểu greedy (lấy tần suất cao nhất) có gì lợi và hại?',
        dap: 'Lợi: TẤT ĐỊNH — chạy bao nhiêu lần cũng ra một kết quả, dễ kiểm thử. Hại: văn bản nhàm và dễ lặp vòng. LLM thật dùng temperature/top-p để bốc ngẫu nhiên theo xác suất, nên hỏi hai lần được hai câu trả lời khác nhau.',
      },
    ],
  },
  {
    id: 'llmagent-u1-l4',
    unitId: 'llmagent-u1',
    language: 'python',
    title: 'Từ n-gram đến Transformer — attention và cách LLM được luyện',
    hook: 'Bigram của bài trước chỉ nhìn được MỘT từ về trước, nên nó không bao giờ hiểu câu "con meo ma toi nuoi tu nam ngoai bi om" — chủ ngữ cách động từ 8 từ. Transformer giải bài này bằng một ý đơn giản đến bất ngờ: cho mỗi từ tự quyết định nó nên CHÚ Ý tới những từ nào, dù xa bao nhiêu.',
    theory:
      'ATTENTION trả lời: khi xử lý một từ, những từ nào khác trong câu đáng chú ý, và chú ý bao nhiêu phần trăm? Ba bước:\n\n1. ĐIỂM (score): từ đang xét (Query) so với từng từ trong câu (Key) bằng tích vô hướng — càng hợp nhau điểm càng cao.\n2. TRỌNG SỐ: đưa các điểm qua SOFTMAX để biến thành các số dương cộng lại bằng đúng 1 — tức là "chia 100% sự chú ý". Công thức: w[i] = exp(diem[i]) / tổng exp(diem[j]).\n3. TRỘN: kết quả = tổng có trọng số của các Value. Từ nào trọng số cao thì góp nhiều.\n\nĐiểm mấu chốt: khoảng cách giữa hai từ KHÔNG hề xuất hiện trong công thức. Từ đầu câu và từ cuối câu chỉ cách nhau đúng một phép tính — đó là thứ n-gram không bao giờ làm được.\n\nVì sao dùng softmax mà không chia đều? Vì exp() phóng đại chênh lệch: điểm 2 so với điểm 1 chỉ hơn 1 đơn vị, nhưng trọng số thành 0.73 so với 0.27. Nó cho phép mô hình "dồn chú ý" thay vì trải mỏng. Khi mọi điểm bằng nhau, softmax trả về chia đều — đó là ca biên đáng nhớ.\n\nTRANSFORMER = chồng nhiều lớp attention (nhiều "đầu" chạy song song, mỗi đầu học một kiểu quan hệ) + mạng nơ-ron thường + kết nối tắt. Vì không có vòng lặp theo thời gian như RNN, nó tính CẢ CÂU song song trên GPU — đó mới là lý do thật khiến LLM khổng lồ trở nên khả thi.\n\nMỘT LLM ĐƯỢC LÀM RA QUA 3 CHẶNG:\n- PRETRAINING: đọc hàng nghìn tỉ token của internet, chỉ luyện một việc "đoán từ tiếp theo". Tốn nhất, hàng chục triệu đô. Ra mô hình biết rất nhiều nhưng không biết nghe lời.\n- FINE-TUNING (SFT): luyện thêm trên vài chục nghìn cặp hỏi-đáp mẫu do người viết, để mô hình học ĐỊNH DẠNG trả lời như một trợ lý.\n- RLHF (học tăng cường từ phản hồi người): người xếp hạng các câu trả lời, một mô hình phần thưởng học theo xếp hạng đó, rồi mô hình chính được tinh chỉnh để tối đa hoá phần thưởng. Đây là chặng làm mô hình lịch sự, biết từ chối, biết nói "tôi không chắc".\n\nBài này bạn tự cài đúng bước 2 và 3 của attention: softmax + trộn có trọng số.',
    workedExample: {
      code: `import math

diem = [2.0, 1.0, 0.0]        # diem chu y tho (Query . Key) da tinh san
gia_tri = [10.0, 20.0, 30.0]  # cac Value tuong ung

mu = [math.exp(d) for d in diem]      # exp() phong dai chenh lech
tong = sum(mu)                        # mau so chung cua softmax
trong_so = [m / tong for m in mu]     # cong lai bang dung 1.0

print("Trong so:", [round(w, 4) for w in trong_so])
print("Tong trong so:", round(sum(trong_so), 4))   # luon 1.0

ket_qua = sum(trong_so[i] * gia_tri[i] for i in range(len(gia_tri)))
print("Ket qua tron:", round(ket_qua, 4))          # gan gia_tri[0] nhat`,
      stdinLines: [],
    },
    predict: {
      code: `import math\ndiem = [0.0, 0.0, 0.0]\nmu = [math.exp(d) for d in diem]\ntong = sum(mu)\nprint([round(m / tong, 4) for m in mu])`,
      question: 'Ba điểm chú ý bằng nhau thì softmax cho trọng số nào?',
      choices: [
        '[0.3333, 0.3333, 0.3333]',
        '[0.0, 0.0, 0.0]',
        '[1.0, 1.0, 1.0]',
        '[1.0, 0.0, 0.0]',
      ],
      answerIndex: 0,
      explain:
        'exp(0) = 1 cho cả ba, tổng = 3, nên mỗi trọng số là 1/3 ≈ 0.3333. Ca biên đáng nhớ: khi mô hình KHÔNG phân biệt được từ nào quan trọng hơn, attention tự động chia đều sự chú ý. Và tổng trọng số luôn bằng 1, dù điểm đầu vào là số gì.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự một đầu attention (phần softmax + trộn): mũ hoá điểm → tổng → chuẩn hoá → trộn Value.',
      lines: [
        'mu = [math.exp(d) for d in diem]',
        'tong = sum(mu)',
        'trong_so = [m / tong for m in mu]',
        'ket_qua = sum(trong_so[i] * gia_tri[i] for i in range(len(gia_tri)))',
        'print(round(ket_qua, 4))',
      ],
    },
    make: {
      prompt:
        'Tự cài softmax và bước trộn của attention.\n\nĐọc 2 dòng input():\n- Dòng 1: các điểm chú ý (số thực), cách nhau bởi dấu phẩy. Ví dụ "2,1".\n- Dòng 2: các Value tương ứng (số thực), cùng số lượng. Ví dụ "0,10".\n\nTính trọng số bằng softmax: w[i] = exp(diem[i]) / tổng exp(diem[j]). Rồi tính kết quả trộn = tổng w[i] × gia_tri[i].\n\nIn đúng 2 dòng:\nTrong so: <các trọng số làm tròn 4 chữ số, cách nhau bởi khoảng trắng>\nKet qua: <kết quả trộn làm tròn 4 chữ số>\n\nVí dụ với "1,1" và "10,20": trọng số 0.5 và 0.5 → Ket qua: 15.0',
      starterCode: `import math\n\ndiem = [float(x) for x in input("Diem: ").split(",")]\ngia_tri = [float(x) for x in input("Gia tri: ").split(",")]\n# mu = exp cua tung diem; tong = sum(mu); trong_so = mu[i] / tong\n# ket_qua = sum(trong_so[i] * gia_tri[i])\n`,
      testCases: [
        {
          stdinLines: ['1,1', '10,20'],
          expected: 'Trong so: 0.5 0.5\nKet qua: 15.0',
          match: 'contains',
          hidden: false,
          label: 'Hai điểm bằng nhau → chia đôi chú ý, kết quả là trung bình',
        },
        {
          stdinLines: ['0,0,0', '3,6,9'],
          expected: 'Trong so: 0.3333 0.3333 0.3333\nKet qua: 6.0',
          match: 'contains',
          hidden: false,
          label: 'Ba điểm bằng nhau → mỗi trọng số 1/3, kết quả 6.0',
        },
        {
          stdinLines: ['2,1', '0,10'],
          expected: 'Trong so: 0.7311 0.2689\nKet qua: 2.6894',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: điểm chênh 1 đơn vị → chú ý dồn về 73% / 27%',
        },
      ],
      hints: [
        'Mũ hoá: math.exp(x) — nhớ import math ở đầu file. Làm cả list bằng [math.exp(d) for d in diem].',
        'Ghép chuỗi số đã làm tròn: " ".join(str(round(w, 4)) for w in trong_so). Phải round TRƯỚC khi đổi sang chuỗi, nếu không sẽ in ra 0.7310585786300049.',
        'Trộn: duyệt chỉ số i bằng range(len(gia_tri)) rồi cộng dồn trong_so[i] * gia_tri[i]. Kiểm nhanh: tổng các trọng số phải luôn ra 1.0.',
      ],
      sampleSolution: `import math\n\ndiem = [float(x) for x in input("Diem: ").split(",")]\ngia_tri = [float(x) for x in input("Gia tri: ").split(",")]\nmu = [math.exp(d) for d in diem]\ntong = sum(mu)\ntrong_so = [m / tong for m in mu]\nket_qua = sum(trong_so[i] * gia_tri[i] for i in range(len(gia_tri)))\nprint("Trong so: " + " ".join(str(round(w, 4)) for w in trong_so))\nprint(f"Ket qua: {round(ket_qua, 4)}")`,
    },
    homework:
      'Chạy lại chương trình của bạn với các điểm "10,1" rồi "100,1". Trọng số thay đổi thế nào? Thử "1000,1" xem có chuyện gì xảy ra. (Gợi ý: math.exp(1000) tràn số.) Đó là lý do attention thật luôn CHIA điểm cho căn bậc hai của số chiều trước khi softmax, và trừ đi điểm lớn nhất trước khi mũ hoá — hãy thử thêm bước "trừ max" vào code của bạn và xác nhận kết quả không đổi.',
    srsCards: [
      {
        hoi: 'Ba bước của một đầu attention là gì?',
        dap: '① Tính ĐIỂM giữa từ đang xét (Query) và từng từ trong câu (Key) bằng tích vô hướng. ② Đưa các điểm qua SOFTMAX thành trọng số dương cộng lại bằng 1. ③ TRỘN: kết quả = tổng có trọng số của các Value.',
      },
      {
        hoi: 'Vì sao Transformer xử lý được quan hệ giữa hai từ ở rất xa nhau, còn n-gram thì không?',
        dap: 'Trong công thức attention không hề có khoảng cách: mọi từ đều được so trực tiếp với mọi từ khác trong đúng một phép tính. n-gram thì chỉ nhìn được n−1 từ liền trước, muốn nhìn xa hơn phải tăng n và lập tức vỡ vì dữ liệu thưa.',
      },
      {
        hoi: 'Ba chặng làm ra một LLM trợ lý, mỗi chặng cho ra cái gì?',
        dap: 'PRETRAINING trên hàng nghìn tỉ token, chỉ luyện đoán từ tiếp theo — ra mô hình biết nhiều nhưng không biết nghe lời. FINE-TUNING (SFT) trên cặp hỏi-đáp mẫu — dạy định dạng trả lời như trợ lý. RLHF theo xếp hạng của người — làm mô hình lịch sự, biết từ chối, biết nói "tôi không chắc".',
      },
    ],
  },
  {
    id: 'llmagent-u1-l5',
    unitId: 'llmagent-u1',
    language: 'python',
    title: 'Prompt & giới hạn — few-shot, ảo giác, cửa sổ ngữ cảnh, chi phí',
    hook: 'Cùng một mô hình, cùng một câu hỏi, hai cách hỏi cho hai chất lượng khác hẳn nhau. Và cùng một câu trả lời đúng, hai cách hỏi cho hai hoá đơn khác nhau gấp mười lần. Prompt không phải phép thuật — nó là kỹ thuật, và nó có đơn vị đo: TOKEN.',
    theory:
      'BỐN THỨ phải nắm trước khi gọi LLM thật:\n\n1. FEW-SHOT PROMPTING. Zero-shot = chỉ ra lệnh. Few-shot = đưa kèm 2–5 VÍ DỤ mẫu vào-ra rồi mới hỏi ca thật. Mô hình bắt chước định dạng của ví dụ, nên few-shot ăn đứt zero-shot ở những việc cần output đúng khuôn. Giá phải trả: ví dụ cũng tốn token, mỗi lần gọi đều trả tiền lại.\n\n2. ẢO GIÁC (hallucination). Mô hình được luyện để sinh chuỗi NGHE HỢP LÝ, không phải chuỗi ĐÚNG SỰ THẬT — nó không có cơ chế nào tự biết mình sai. Nên nó bịa số liệu, bịa trích dẫn, bịa cả tên hàm trong thư viện, với giọng điệu tự tin y hệt lúc nói đúng. Ba cách giảm: đưa NGUỒN vào prompt (chính là RAG, chương 2), yêu cầu nói "không biết" khi thiếu dữ liệu, và kiểm chứng đầu ra bằng công cụ ngoài.\n\n3. CỬA SỔ NGỮ CẢNH (context window). Mỗi mô hình chỉ nhìn được tối đa N token (vài nghìn tới vài triệu tuỳ đời). Vượt quá thì phần đầu bị CẮT — và triệu chứng rất khó chịu: mô hình "quên" luật bạn dặn ở đầu cuộc trò chuyện. Cửa sổ to hơn không miễn phí: chi phí và độ trễ tăng theo độ dài, và chất lượng thường tụt ở khúc giữa ("lost in the middle").\n\n4. CHI PHÍ. Nhà cung cấp tính tiền theo token, và tính RIÊNG token vào (prompt) với token ra (output) — token ra thường đắt hơn nhiều lần. Ước lượng nhanh và đủ dùng cho tiếng Anh/tiếng Việt không dấu: 1 token ≈ 4 ký tự. Ba đòn bẩy giảm tiền: prompt ngắn lại, dùng mô hình rẻ cho việc dễ, và CACHE lại câu trả lời cho những câu hỏi lặp (đo thật ở bài cuối khoá).\n\nBài này bạn tự cài máy ước lượng chi phí — công cụ nhỏ nhưng bạn sẽ dùng nó suốt phần đời làm kỹ sư AI.',
    workedExample: {
      code: `van_ban = "toi hoc lap trinh"       # 17 ky tu ke ca khoang trang
so_ky_tu = len(van_ban)
so_token = (so_ky_tu + 3) // 4         # lam tron LEN: 17 -> 5 token

don_gia = 200.0                        # dong cho moi 1000 token
chi_phi = so_token / 1000 * don_gia    # chia 1000 truoc roi nhan don gia

print("So ky tu:", so_ky_tu)
print("So token uoc luong:", so_token)
print("Chi phi:", round(chi_phi, 2), "dong")

# Vi sao (n + 3) // 4 la lam tron LEN: 17/4 = 4.25, dung 4 la tinh thieu
print("Neu chia thuong:", so_ky_tu // 4)   # 4 -> tinh thieu 1 token`,
      stdinLines: [],
    },
    predict: {
      code: `for n in [4, 5, 8]:\n    print(n, "->", (n + 3) // 4)`,
      question: 'Ba dòng in ra các cặp nào?',
      choices: [
        '4 -> 1\n5 -> 2\n8 -> 2',
        '4 -> 1\n5 -> 1\n8 -> 2',
        '4 -> 2\n5 -> 2\n8 -> 3',
        '4 -> 1\n5 -> 2\n8 -> 3',
      ],
      answerIndex: 0,
      explain:
        '(4+3)//4 = 7//4 = 1 — vừa đủ 1 token. (5+3)//4 = 8//4 = 2 — dư 1 ký tự vẫn phải tính thành cả một token. (8+3)//4 = 11//4 = 2 — vừa đủ 2. Mẹo "+3 rồi chia lấy nguyên cho 4" chính là làm tròn LÊN mà không cần math.ceil: đúng bội số thì không lên, dư một chút là lên hẳn một bậc.',
    },
    parsons: {
      prompt:
        'Xếp đúng thứ tự máy ước lượng chi phí: đo độ dài → quy ra token (làm tròn lên) → nhân đơn giá → in.',
      lines: [
        'so_ky_tu = len(van_ban)',
        'so_token = (so_ky_tu + 3) // 4',
        'chi_phi = so_token / 1000 * don_gia',
        'print(f"So token uoc luong: {so_token}")',
        'print(f"Chi phi: {round(chi_phi, 2)} dong")',
      ],
    },
    make: {
      prompt:
        'Viết máy ước lượng chi phí gọi LLM.\n\nĐọc 2 dòng input():\n- Dòng 1: đoạn văn bản sẽ gửi cho mô hình.\n- Dòng 2: đơn giá tính bằng đồng cho mỗi 1000 token (số thực).\n\nQuy tắc ước lượng: 1 token ≈ 4 ký tự, LÀM TRÒN LÊN — dùng công thức (so_ky_tu + 3) // 4. Chi phí = so_token / 1000 × đơn giá.\n\nIn đúng 3 dòng:\nSo ky tu: <số ký tự>\nSo token uoc luong: <số token>\nChi phi: <chi phí làm tròn 2 chữ số> dong\n\nVí dụ "toi hoc lap trinh" (17 ký tự) với đơn giá 200 → 5 token → Chi phi: 1.0 dong',
      starterCode: `van_ban = input("Van ban: ")\ndon_gia = float(input("Don gia moi 1000 token: "))\n# so_ky_tu = do dai chuoi; so_token = lam tron len so_ky_tu / 4\n# chi_phi = so_token / 1000 * don_gia, in kem chu " dong"\n`,
      testCases: [
        {
          stdinLines: ['toi hoc lap trinh', '200'],
          expected: 'So ky tu: 17\nSo token uoc luong: 5\nChi phi: 1.0 dong',
          match: 'contains',
          hidden: false,
          label: '17 ký tự → 5 token (làm tròn lên) → 1.0 đồng',
        },
        {
          stdinLines: ['abcd', '500'],
          expected: 'So token uoc luong: 1\nChi phi: 0.5 dong',
          match: 'contains',
          hidden: false,
          label: 'Ca biên: đúng 4 ký tự → đúng 1 token, không lên 2',
        },
        {
          stdinLines: ['hom nay troi dep', '333'],
          expected: 'So token uoc luong: 4\nChi phi: 1.33 dong',
          match: 'contains',
          hidden: true,
          label: 'Ca ẩn: 16 ký tự → 4 token, kiểm việc làm tròn tiền 2 chữ số',
        },
      ],
      hints: [
        'Đếm ký tự kể cả khoảng trắng: len(van_ban). Đừng dùng split() ở đây — đề tính theo KÝ TỰ, không theo từ.',
        'Làm tròn lên không cần math: (so_ky_tu + 3) // 4. Dùng // (chia lấy nguyên), không phải / .',
        'Tiền làm tròn 2 chữ số: round(chi_phi, 2). Chuỗi in ra phải có đúng chữ " dong" ở cuối, viết không dấu.',
      ],
      sampleSolution: `van_ban = input("Van ban: ")\ndon_gia = float(input("Don gia moi 1000 token: "))\nso_ky_tu = len(van_ban)\nso_token = (so_ky_tu + 3) // 4\nchi_phi = so_token / 1000 * don_gia\nprint(f"So ky tu: {so_ky_tu}")\nprint(f"So token uoc luong: {so_token}")\nprint(f"Chi phi: {round(chi_phi, 2)} dong")`,
    },
    homework:
      'Lấy một prompt bạn thật sự hay dùng. Viết lại nó theo hai bản: bản few-shot có 3 ví dụ mẫu, và bản zero-shot rút gọn hết mức mà vẫn ra kết quả chấp nhận được. Chạy máy ước lượng của bạn cho cả hai, rồi nhân với 1.000 lượt gọi mỗi ngày. Chênh lệch một tháng là bao nhiêu tiền? Đó là con số quyết định bạn nên chọn bản nào.',
    srsCards: [
      {
        hoi: 'Few-shot prompting là gì, và cái giá của nó?',
        dap: 'Đưa kèm 2–5 ví dụ mẫu vào-ra trong prompt trước khi hỏi ca thật, để mô hình bắt chước đúng định dạng — thường tốt hơn hẳn zero-shot ở việc cần output đúng khuôn. Giá phải trả: các ví dụ cũng tốn token và bị tính tiền lại ở MỖI lần gọi.',
      },
      {
        hoi: 'Vì sao LLM bị "ảo giác", và ba cách giảm?',
        dap: 'Vì nó được luyện để sinh chuỗi NGHE HỢP LÝ chứ không phải chuỗi ĐÚNG SỰ THẬT, và không có cơ chế tự biết mình sai. Ba cách giảm: đưa nguồn/tài liệu vào prompt (RAG), yêu cầu nói "không biết" khi thiếu dữ liệu, và kiểm chứng đầu ra bằng công cụ ngoài.',
      },
      {
        hoi: 'Cửa sổ ngữ cảnh là gì, vượt quá thì hiện tượng gì xảy ra?',
        dap: 'Là số token tối đa mô hình nhìn được trong một lượt. Vượt quá thì phần ĐẦU bị cắt, nên triệu chứng là mô hình "quên" luật bạn dặn ở đầu cuộc trò chuyện. Cửa sổ to hơn cũng làm tăng chi phí, tăng độ trễ, và chất lượng thường tụt ở khúc giữa.',
      },
    ],
  },
]
