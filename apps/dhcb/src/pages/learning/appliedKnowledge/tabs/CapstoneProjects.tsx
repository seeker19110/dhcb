// Tab 4 — Dự án mini tự làm tại nhà (lấy từ kho tri thức, không có state). Tách từ AppliedKnowledge.tsx (2026-09-06).
import { CheckCircle2, Lightbulb } from 'lucide-react'
import { APPLIED_KNOWLEDGE_DATABASE } from '../../../../data/appliedKnowledgeData'

export function CapstoneProjects() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <h2 className="text-base font-bold text-amber-400 theme-light:text-amber-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Thư Viện Thử Thách & Dự Án Tự Làm Tại Nhà (Hands-on Mini Projects)
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Các dự án thực chiến 15–30 phút giúp học sinh và gia đình ứng dụng lý thuyết vào thực tế
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {APPLIED_KNOWLEDGE_DATABASE.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 theme-light:text-amber-800 font-mono">
                  ⏱️ {item.miniProject.duration}
                </span>
                <span className="text-xs text-zinc-500">{item.gradeLabel}</span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100">{item.miniProject.title}</h3>
              <div className="space-y-1.5 pt-1">
                {item.miniProject.steps.map((step, idx) => (
                  <div key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-800 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-amber-300/90 theme-light:text-amber-800/90 font-medium">
              🎯 <strong>Sản phẩm bàn giao:</strong> {item.miniProject.deliverable}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
