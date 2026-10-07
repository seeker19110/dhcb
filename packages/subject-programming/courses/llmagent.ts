// courses/llmagent.ts — Khoá 6/6 (khoá CUỐI) cụm "Kỹ sư AI thực chiến".
// Đặc tả: docs/specs/2026-09-01-cum-6-khoa-ai-engineer.md §03f +
// docs/specs/2026-09-01-llmagent-bai-hoc-chi-tiet.md.
import type { ShortCourse } from './types.js'

export const LLMAGENT_COURSE: ShortCourse = {
  id: 'llmagent',
  title: 'LLMs & AI Agents',
  canDo:
    'Tự cài tokenizer + sinh next-token + RAG mini + vòng lặp agent ReAct chạy thật bằng Python thuần; thiết kế được hệ RAG/agent thực tế và nói được chi phí, giới hạn, cách triển khai.',
  duration: '14 bài · 3 chương · nên học sau khoá Deep Learning for CV cơ bản',
  prerequisites: ['Khoá Deep Learning for CV cơ bản (cv1) hoặc nắm vững MLP/attention'],
  chapters: [
    {
      id: 'llmagent-c1',
      title: 'NLP → LLM',
      summary:
        'Tokenizer subword theo luật cố định (và BPE học gộp cặp ra sao), embedding & cosine similarity, mô hình ngôn ngữ next-token, bản đồ Transformer, prompt & giới hạn.',
      lessonIds: [
        'llmagent-u1-l1',
        'llmagent-u1-l2',
        'llmagent-u1-l3',
        'llmagent-u1-l4',
        'llmagent-u1-l5',
      ],
    },
    {
      id: 'llmagent-c2',
      title: 'RAG',
      summary:
        'Vì sao cần RAG, RAG mini tự cài trọn pipeline, chunking & precision@k, kiến trúc RAG sản xuất.',
      lessonIds: ['llmagent-u2-l1', 'llmagent-u2-l2', 'llmagent-u2-l3', 'llmagent-u2-l4'],
    },
    {
      id: 'llmagent-c3',
      title: 'AI Agents & triển khai',
      summary:
        'Vòng lặp nghĩ→hành động→quan sát, agent ReAct tự cài, tool/MCP/multi-agent, đánh giá & an toàn, triển khai + tổng kết chuỗi 6 khoá.',
      lessonIds: [
        'llmagent-u3-l1',
        'llmagent-u3-l2',
        'llmagent-u3-l3',
        'llmagent-u3-l4',
        'llmagent-u3-l5',
      ],
    },
  ],
}
