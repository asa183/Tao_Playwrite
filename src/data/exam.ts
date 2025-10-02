export type ExamInput = {
  name: string;
  department: string;        // 既存の学科名（例: 物理学科）
  language?: string;         // 例: 日本語, 英語
  feeExemptionCode?: string; // 例: menjo
  examDate?: string;         // 例: 2026-03-10（画面に存在する場合のみ使用）
  venue?: string;            // 例: 西千葉キャンパス
  contactName?: string;      // 問い合わせ名称（必須の場合に使用）
  contactEmail?: string;     // 問い合わせメールアドレス（必須の場合に使用）
};

export function computeFutureRange(now = new Date()) {
  const start = new Date(now.getTime());
  start.setDate(start.getDate() + 180); // +180日
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 30);      // +30日
  return { start, end };
}

export function toInputValue(dt: Date, mode: 'datetime' | 'date') {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return mode === 'datetime'
    ? `${yyyy}-${MM}-${dd}T${hh}:${mm}`
    : `${yyyy}-${MM}-${dd}`;
}

// サンプル（総合選抜）
export const exams: ExamInput[] = [
  {
    name: '2026年度 理学部 総合選抜（物理学科）',
    department: '物理学科',
    language: '日本語',
    feeExemptionCode: 'menjo',
    examDate: '2026-02-20',
    venue: '西千葉キャンパス',
    contactName: '入試担当（理学部）',
    contactEmail: 'admissions@example.com'
  },
  {
    name: '2026年度 理学部 総合選抜（地球科学科）',
    department: '地球科学科',
    language: '日本語',
    feeExemptionCode: 'menjo',
    examDate: '2026-02-21',
    venue: '西千葉キャンパス',
    contactName: '入試担当（理学部）',
    contactEmail: 'admissions@example.com'
  }
];
