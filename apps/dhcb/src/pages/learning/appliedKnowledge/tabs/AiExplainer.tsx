// Tab 3 — AI giải đáp bản chất đời sống. Tách từ AppliedKnowledge.tsx (2026-09-06).
// LƯU Ý: vẫn là bản GIẢ LẬP (setTimeout 400 ms + câu trả lời cứng) — thay bằng AI thật là việc khác.
import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export function AiExplainer() {
  const [explainerQuery, setExplainerQuery] = useState('')
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)

  const handleAskExplainer = (queryText: string) => {
    const q = queryText.trim()
    if (!q) return
    setExplainerQuery(q)
    setIsExplaining(true)
    setTimeout(() => {
      if (q.toLowerCase().includes('tiền điện') || q.toLowerCase().includes('điều hòa')) {
        setAiAnswer(
          '**Nguyên lý Vật lí ứng dụng:** Điều hòa hoạt động theo chu trình Carnot ngược và bơm nhiệt. Khi bạn cài đặt 18°C, chênh lệch nhiệt độ giữa trong phòng và ngoài trời (~35°C) quá lớn, máy nén Inverter phải chạy 100% công suất liên tục, tiêu tốn khoảng 1.5 - 1.8 kWh mỗi giờ. Nếu bạn cài đặt 26-27°C kèm theo một quạt gió nhỏ, máy nén chỉ cần duy trì công suất thấp (~0.6 - 0.75 kWh), giúp tiết kiệm hơn 40% điện năng mà cảm giác mát vẫn dịu nhẹ, không bị khô da hay sốc nhiệt.',
        )
      } else if (q.toLowerCase().includes('đạo hàm') || q.toLowerCase().includes('ai')) {
        setAiAnswer(
          '**Toán học trong Trí tuệ Nhân tạo:** Đạo hàm và Gradient chính là linh hồn của mạng nơ-ron sâu (Deep Learning). Trong quá trình huấn luyện AI, một hàm mất mát (Loss function) đo lường mức độ sai số giữa câu trả lời của AI và đáp án đúng. Thuật toán Gradient Descent tính đạo hàm riêng của hàm mất mát theo từng trọng số kết nối để biết cần tăng hay giảm trọng số theo hướng nào. Nhờ đạo hàm, ChatGPT có thể tự điều chỉnh hàng trăm tỷ tham số để ngày càng thông minh hơn.',
        )
      } else if (q.toLowerCase().includes('lãi kép') || q.toLowerCase().includes('tiết kiệm')) {
        setAiAnswer(
          '**Toán học trong Tài chính Cá nhân:** Lãi kép bản chất là dãy số cấp số nhân với công thức $A = P(1+r)^n$. Bí quyết không nằm ở số tiền ban đầu $P$, mà nằm ở số mũ thời gian $n$. Một người bắt đầu đầu tư 2 triệu/tháng từ năm 20 tuổi đến 30 tuổi rồi dừng lại (tổng nộp 240 triệu) sẽ có khối tài sản lúc 60 tuổi lớn hơn một người bắt đầu từ năm 30 tuổi và nộp liên tục đến năm 60 tuổi (tổng nộp 720 triệu). Đó là lý do Albert Einstein gọi lãi kép là kỳ quan thứ 8 của thế giới.',
        )
      } else {
        setAiAnswer(
          `**Phân tích liên môn cho câu hỏi "${q}":** Mọi kiến thức phổ thông đều là viên gạch giải quyết bài toán đời sống. Ví dụ: Toán học cung cấp tư duy tối ưu hóa và định lượng rủi ro; Vật lí giải thích cơ chế vận hành năng lượng và chuyển động xung quanh ta; Hóa học bảo vệ sức khỏe và lựa chọn vật liệu tiêu dùng an toàn; Sinh học tối ưu hóa thể trạng và cơ thể sống. Khi kết hợp các môn này, bạn có bộ công cụ đa chiều để ra quyết định thông minh trong công việc và cuộc sống.`,
        )
      }
      setIsExplaining(false)
    }, 400)
  }

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-accent-500/20 text-accent-400 theme-light:text-accent-800">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold">Trợ lý AI giải đáp bản chất đời sống</h2>
          <p className="text-xs text-zinc-400">
            Đặt bất kỳ câu hỏi nào về tính ứng dụng của kiến thức vào cuộc sống
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ví dụ: 'Tại sao bật điều hòa 27 độ lại tiết kiệm tiền?', 'Đạo hàm dùng ở đâu trong AI?'..."
          value={explainerQuery}
          onChange={(e) => setExplainerQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskExplainer(explainerQuery)}
          className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm focus:outline-none focus:border-accent-500"
        />
        <button
          onClick={() => handleAskExplainer(explainerQuery)}
          disabled={isExplaining || !explainerQuery.trim()}
          className="px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-black font-bold text-sm transition"
        >
          {isExplaining ? 'Đang suy nghĩ...' : 'Hỏi AI'}
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-zinc-500 self-center">Gợi ý câu hỏi:</span>
        {[
          'Bật điều hòa 27 độ tiết kiệm tiền thế nào?',
          'Đạo hàm ứng dụng trong AI ra sao?',
          'Lãi kép 10 năm tạo ra bao nhiêu tiền?',
          'Vì sao cồn 70 độ diệt khuẩn tốt hơn 90 độ?',
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleAskExplainer(prompt)}
            className="px-3 py-1 rounded-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* AI Answer Box */}
      {aiAnswer && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-accent-500/40 text-sm space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-accent-400 theme-light:text-accent-800 font-bold text-xs">
            <Sparkles className="w-4 h-4" /> Phân tích chuyên sâu từ Đồng Hành AI
          </div>
          <div className="text-zinc-200 leading-relaxed whitespace-pre-line">{aiAnswer}</div>
        </div>
      )}
    </div>
  )
}
