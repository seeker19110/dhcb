// StemTheory — hiển thị phần LÝ THUYẾT của bài STEM có cấu trúc (tiêu đề mục + đoạn + chỉ số
// dưới). Logic tách nằm ở `lib/stemTheory.ts` (hàm thuần, có test trên toàn bộ dữ liệu thật).
//
// Nhịp khoảng cách theo skill `ui-ux` §9.A.2: khoảng TRÊN tiêu đề (mt-6) lớn hơn khoảng DƯỚI
// (mt-1 của đoạn ngay sau) — tiêu đề thuộc về mục nó mở ra, không trôi về mục trước.
// Màu `text-content` giữ đúng như bản `whitespace-pre-line` cũ: đây là chữ NỘI DUNG, token này đã
// qua cổng AAA ≥ 7:1 (`e2e/a11y-aaa.spec.ts` quét sẵn một bài Lý) ở cả 3 theme.
import { phanTichLyThuyet, tachChiSoDuoi } from '../lib/stemTheory'

function ChuCoChiSo({ text }: { text: string }) {
  return (
    <>
      {tachChiSoDuoi(text).map((p, i) =>
        p.kind === 'text' ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span key={i}>
            {p.base}
            <sub>{p.sub}</sub>
          </span>
        ),
      )}
    </>
  )
}

export default function StemTheory({ text }: { text: string }) {
  return (
    <div className="text-content">
      {phanTichLyThuyet(text).map((khoi, i) =>
        khoi.kind === 'heading' ? (
          // h3: nằm dưới h2 "Lý thuyết" của trang bài — đúng cấp, không nhảy cấp.
          <h3 key={i} className="mt-6 first:mt-2 font-bold leading-snug">
            <ChuCoChiSo text={khoi.text} />
          </h3>
        ) : (
          <p key={i} className="mt-2 whitespace-pre-line">
            <ChuCoChiSo text={khoi.text} />
          </p>
        ),
      )}
    </div>
  )
}
