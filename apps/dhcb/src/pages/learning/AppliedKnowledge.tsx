// apps/dhcb/src/pages/learning/AppliedKnowledge.tsx — Ứng dụng thực tế & phòng mô phỏng đời sống
// [2026-09-06] Tách 1.942 dòng thành thư mục appliedKnowledge/ (10 simulator + 4 tab). Trang
// này chỉ còn: tiêu đề, thanh tab, và simulator đang chọn (giữ ở đây để đổi tab rồi quay lại
// vẫn đúng simulator; riêng GIÁ TRỊ đã nhập thì về mặc định — phương án A của đặc tả
// docs/specs/2026-09-06-tach-applied-knowledge-theo-simulator.md).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../../lib/usePageTitle'
import { Sparkles, Activity, BookOpen, Lightbulb } from 'lucide-react'
import Layout from '../../components/Layout'
import { PageShell } from '@core/PageShell'
import { SimulatorsLab, type SimulatorId } from './appliedKnowledge/tabs/SimulatorsLab'
import { KnowledgeLibrary } from './appliedKnowledge/tabs/KnowledgeLibrary'
import { AiExplainer } from './appliedKnowledge/tabs/AiExplainer'
import { CapstoneProjects } from './appliedKnowledge/tabs/CapstoneProjects'

// Mọi thanh trượt mô phỏng đều lấy chữ mô tả từ <span> bên trên, KHÔNG gắn với ô nhập
// → trình đọc màn hình chỉ đọc "slider" (axe: label). Gắn aria-label cho từng thanh.
export default function AppliedKnowledge() {
  usePageTitle('Ứng dụng thực tế | Đồng Hành Cùng Bạn')
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState<'simulators' | 'library' | 'explainer' | 'projects'>(
    'simulators',
  )

  // SIMULATOR SELECTION
  const [activeSimulator, setActiveSimulator] = useState<SimulatorId>('profit')

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <Layout onBack={() => nav('/')} title="Ứng dụng thực tế & mô phỏng đời sống" />

      {/* [2026-09-02, đợt 4 thiết kế lại desktop] Lưới ứng dụng thực tế → width standard. */}
      <PageShell
        width="standard"
        baseWidth="max-w-5xl"
        className="!pb-[calc(2.5rem+var(--bnav-h))] space-y-6"
      >
        <h1 tabIndex={-1} className="sr-only focus:outline-none">
          Ứng dụng thực tế & mô phỏng đời sống
        </h1>

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('simulators')}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'simulators'
                ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Phòng thí nghiệm mô phỏng (10 mô phỏng)
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kho Tri Thức Ứng Dụng (K12)
          </button>
          <button
            onClick={() => setActiveTab('explainer')}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'explainer'
                ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI giải đáp bản chất đời sống
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`tap-44 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-accent-500 text-black shadow-md shadow-accent-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Dự án mini tự làm tại nhà
          </button>
        </div>

        {/* TAB 1: INTERACTIVE SIMULATORS LAB */}
        {activeTab === 'simulators' && (
          <SimulatorsLab
            activeSimulator={activeSimulator}
            setActiveSimulator={setActiveSimulator}
          />
        )}

        {/* TAB 2: APPLIED KNOWLEDGE LIBRARY */}
        {activeTab === 'library' && <KnowledgeLibrary />}

        {/* TAB 3: AI EXPLAINER */}
        {activeTab === 'explainer' && <AiExplainer />}

        {/* TAB 4: CAPSTONE MINI PROJECTS */}
        {activeTab === 'projects' && <CapstoneProjects />}
      </PageShell>
    </div>
  )
}
