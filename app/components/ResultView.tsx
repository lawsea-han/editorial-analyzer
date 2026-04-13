"use client";

import { useState } from "react";
import { StepCard, PHASE_INFO, COLOR_MAP } from "./StepCard";

interface StepResult {
  step: number;
  title: string;
  content: string;
  isStreaming?: boolean;
}

interface ResultViewProps {
  results: StepResult[];
  isStreaming: boolean;
  totalSteps: number;
  onReset: () => void;
}

export function ResultView({ results, isStreaming, totalSteps, onReset }: ResultViewProps) {
  const [activePhase, setActivePhase] = useState(1);
  const [copied, setCopied] = useState(false);

  const currentPhaseInfo = PHASE_INFO.find((p) => p.phase === activePhase)!;
  const phaseResults = results.filter((r) => currentPhaseInfo.steps.includes(r.step));
  const completedCount = results.filter((r) => !r.isStreaming).length;

  // 현재 탭 결과에 데이터가 없으면 첫 번째 결과 있는 탭으로 이동
  const firstPhaseWithData = PHASE_INFO.find((p) =>
    results.some((r) => p.steps.includes(r.step))
  );

  const handleSave = () => {
    const content = results
      .map((r) => `[단계${r.step}] ${r.title}\n${r.content}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `사설분석_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const content = results
      .map((r) => `[단계${r.step}] ${r.title}\n${r.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKakaoShare = () => {
    const preview = results[0]
      ? `[단계${results[0].step}] ${results[0].title}\n${results[0].content.slice(0, 80)}...`
      : "사설 분석 결과";
    const text = `📰 사설 분석 결과 (${completedCount}단계)\n\n${preview}\n\n─ 사설 분석기로 분석`;

    // 카카오톡 공유 — SDK 없이 카카오 링크 웹 URL 사용
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=KAKAO_APP_KEY&validation_action=default&validation_params={}`;
    // 카카오 SDK가 없으므로 navigator.share 또는 클립보드 복사로 폴백
    if (navigator.share) {
      navigator.share({
        title: "사설 분석 결과",
        text,
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("공유 내용이 클립보드에 복사되었습니다.\n카카오톡에 붙여넣기 하세요.");
      });
    }
  };

  const handleLinkShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("링크가 클립보드에 복사되었습니다.");
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 진행률 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>분석 진행</span>
          <span>{completedCount} / {totalSteps}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {PHASE_INFO.map((p) => {
          const c = COLOR_MAP[p.color];
          const phaseCompleted = results.filter(
            (r) => p.steps.includes(r.step) && !r.isStreaming
          ).length;
          const hasAny = results.some((r) => p.steps.includes(r.step));
          const isActive = activePhase === p.phase;

          return (
            <button
              key={p.phase}
              onClick={() => setActivePhase(p.phase)}
              disabled={!hasAny && !isStreaming}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? `${c.badge} ring-1 ring-current`
                  : hasAny
                  ? "bg-white/5 text-slate-400 hover:bg-white/10"
                  : "bg-white/3 text-slate-700 cursor-not-allowed"
              }`}
            >
              {p.label}
              {hasAny && (
                <span className="ml-1 opacity-60">
                  {phaseCompleted}/{p.steps.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 현재 페이즈 헤더 */}
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-200">
          {currentPhaseInfo.label} — {currentPhaseInfo.title}
        </h2>
      </div>

      {/* 결과 목록 */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {phaseResults.length === 0 ? (
          <div className="text-center text-slate-600 py-12 text-sm">
            {isStreaming
              ? firstPhaseWithData && firstPhaseWithData.phase !== activePhase
                ? `PHASE ${firstPhaseWithData.phase}부터 분석 중...`
                : "분석 중..."
              : "이 PHASE는 선택되지 않았습니다."}
          </div>
        ) : (
          phaseResults.map((r) => <StepCard key={r.step} result={r} />)
        )}
      </div>

      {/* 하단 버튼 */}
      {!isStreaming && results.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          {/* 공유 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-slate-300"
              }`}
            >
              {copied ? "✓ 복사됨" : "텍스트 복사"}
            </button>
            <button
              onClick={handleKakaoShare}
              className="flex-1 py-2 rounded-lg bg-[#FEE500] hover:bg-[#f0d800] text-[#3A1D1D] text-sm font-medium transition-colors"
            >
              카카오 공유
            </button>
            <button
              onClick={handleLinkShare}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 text-sm transition-colors"
              title="링크 복사"
            >
              🔗
            </button>
          </div>
          {/* 저장 / 다시 분석 */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              텍스트 저장
            </button>
            <button
              onClick={onReset}
              className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-sm font-medium transition-colors"
            >
              다시 분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
