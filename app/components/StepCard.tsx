"use client";

const PHASE_INFO = [
  { phase: 1, label: "PHASE 1", title: "기초 독해", color: "blue", steps: [1, 2, 3, 4, 5, 6] },
  { phase: 2, label: "PHASE 2", title: "논리 분석", color: "violet", steps: [7, 8, 9, 10, 11, 12] },
  { phase: 3, label: "PHASE 3", title: "비판적 평가", color: "amber", steps: [13, 14, 15, 16, 17, 18] },
  { phase: 4, label: "PHASE 4", title: "통합 및 재구성", color: "emerald", steps: [19, 20, 21, 22, 23, 24, 25] },
  { phase: 5, label: "PHASE 5", title: "성찰", color: "rose", steps: [26, 27, 28, 29, 30] },
];

const STEP_TITLES: Record<number, string> = {
  1: "핵심 주제 파악", 2: "필자의 주장 요약", 3: "글의 구조 분석",
  4: "핵심 키워드 추출", 5: "독자 대상 파악", 6: "집필 맥락 추론",
  7: "논거 목록화", 8: "논리 흐름 추적", 9: "근거의 타당성 검토",
  10: "전제 가정 파악", 11: "논리적 약점 탐지", 12: "반론 가능성 검토",
  13: "사실 vs 의견 구분", 14: "감정적 호소 분석", 15: "생략된 정보 파악",
  16: "편향성 진단", 17: "대안적 관점 제시", 18: "필자의 의도 평가",
  19: "핵심 가치 추출", 20: "사회적 맥락 연결", 21: "역사적 배경 참조",
  22: "비교 사례 탐색", 23: "논리 재설계", 24: "실제 사례 연결", 25: "최종 요약",
  26: "편향 점검", 27: "자기교정", 28: "메타인지 평가",
  29: "약점 집중 보완", 30: "장기 기억 설계",
};

const COLOR_MAP: Record<string, { border: string; badge: string; num: string; dot: string }> = {
  blue:    { border: "border-blue-500/30",   badge: "bg-blue-500/20 text-blue-300",   num: "text-blue-400",   dot: "bg-blue-400" },
  violet:  { border: "border-violet-500/30", badge: "bg-violet-500/20 text-violet-300", num: "text-violet-400", dot: "bg-violet-400" },
  amber:   { border: "border-amber-500/30",  badge: "bg-amber-500/20 text-amber-300",  num: "text-amber-400",  dot: "bg-amber-400" },
  emerald: { border: "border-emerald-500/30",badge: "bg-emerald-500/20 text-emerald-300",num: "text-emerald-400",dot: "bg-emerald-400" },
  rose:    { border: "border-rose-500/30",   badge: "bg-rose-500/20 text-rose-300",   num: "text-rose-400",   dot: "bg-rose-400" },
};

function getPhaseColor(stepNum: number): string {
  for (const p of PHASE_INFO) {
    if (p.steps.includes(stepNum)) return p.color;
  }
  return "blue";
}

interface StepResult {
  step: number;
  title: string;
  content: string;
  isStreaming?: boolean;
}

interface StepCardProps {
  result: StepResult;
}

export function StepCard({ result }: StepCardProps) {
  const color = getPhaseColor(result.step);
  const c = COLOR_MAP[color];

  return (
    <div className={`rounded-xl border ${c.border} bg-white/3 p-4 fade-in`}>
      <div className="flex items-start gap-3">
        <span className={`text-xl font-bold ${c.num} shrink-0 w-8 text-right`}>
          {result.step}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            {STEP_TITLES[result.step] || result.title}
          </h3>
          <p className={`text-sm text-slate-400 leading-relaxed whitespace-pre-wrap ${result.isStreaming ? "cursor-blink" : ""}`}>
            {result.content}
          </p>
        </div>
      </div>
    </div>
  );
}

export { PHASE_INFO, STEP_TITLES, COLOR_MAP, getPhaseColor };
