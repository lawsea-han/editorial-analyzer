"use client";

import { useState, useRef } from "react";
import { ResultView } from "./components/ResultView";
import { Sidebar } from "./components/Sidebar";
import { PhaseSelector } from "./components/PhaseSelector";
import { InstallPrompt } from "./components/InstallPrompt";
import { useHistory, HistoryItem } from "./hooks/useHistory";
import { PHASE_INFO } from "./components/StepCard";

interface StepResult {
  step: number;
  title: string;
  content: string;
  isStreaming?: boolean;
}

function parseBuffer(buffer: string): StepResult[] {
  const results: StepResult[] = [];
  const pattern = /\[단계(\d+)\]\s*([^\n]*)\n([\s\S]*?)(?=\[단계\d+\]|$)/g;
  let match;
  while ((match = pattern.exec(buffer)) !== null) {
    const step = parseInt(match[1]);
    const title = match[2].trim();
    const content = match[3].trim();
    if (step >= 1 && step <= 30 && content.length > 0) {
      results.push({ step, title, content, isStreaming: false });
    }
  }
  return results;
}

function getTotalSteps(phases: number[]): number {
  return PHASE_INFO.filter((p) => phases.includes(p.phase)).reduce(
    (acc, p) => acc + p.steps.length,
    0
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<StepResult[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [selectedPhases, setSelectedPhases] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bufferRef = useRef("");
  const currentPhasesRef = useRef<number[]>([1, 2, 3, 4, 5]);

  const { history, save, remove, clear } = useHistory();

  const analyze = async () => {
    if (!text.trim() || isStreaming) return;

    currentPhasesRef.current = selectedPhases;
    setError("");
    setResults([]);
    setShowResult(true);
    setIsStreaming(true);
    bufferRef.current = "";

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, selectedPhases }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        const parsed = parseBuffer(bufferRef.current);
        if (parsed.length > 0) setResults(parsed);
      }

      const finalParsed = parseBuffer(bufferRef.current);
      if (finalParsed.length > 0) {
        setResults(finalParsed);
        // 히스토리 저장
        save({
          preview: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
          selectedPhases: currentPhasesRef.current,
          results: finalParsed.map(({ step, title, content }) => ({ step, title, content })),
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      setShowResult(false);
    } finally {
      setIsStreaming(false);
    }
  };

  const reset = () => {
    setShowResult(false);
    setResults([]);
    setError("");
    setText("");
    currentPhasesRef.current = selectedPhases;
  };

  const loadHistory = (item: HistoryItem) => {
    setResults(item.results);
    setSelectedPhases(item.selectedPhases);
    currentPhasesRef.current = item.selectedPhases;
    setShowResult(true);
    setIsStreaming(false);
  };

  if (showResult) {
    return (
      <div className="h-dvh bg-[#0f1117] flex flex-col overflow-y-scroll">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          history={history}
          onLoad={loadHistory}
          onDelete={remove}
          onClear={clear}
        />

        <InstallPrompt />
      <div className="min-h-0 flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
          <header className="mb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors relative"
                title="분석 히스토리"
              >
                ☰
                {history.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                    {history.length}
                  </span>
                )}
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-100">사설 분석기</h1>
                <p className="text-xs text-slate-500">
                  PHASE {currentPhasesRef.current.join(", ")} — {getTotalSteps(currentPhasesRef.current)}단계
                </p>
              </div>
            </div>
            {isStreaming ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                분석 중
              </div>
            ) : (
              <button
                onClick={reset}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                새 분석
              </button>
            )}
          </header>

          <div className="flex-1 overflow-hidden">
            <ResultView
              results={results}
              isStreaming={isStreaming}
              totalSteps={getTotalSteps(currentPhasesRef.current)}
              onReset={reset}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-[#0f1117] flex flex-col items-center justify-start overflow-y-scroll px-4 py-4 md:py-6">
      <InstallPrompt />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        history={history}
        onLoad={loadHistory}
        onDelete={remove}
        onClear={clear}
      />

      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Claude AI 기반 분석
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              사설 분석기
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              AI가 사설을 최대 30단계로 깊이 분석합니다
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors relative shrink-0"
            title="분석 히스토리"
          >
            <span className="text-lg">☰</span>
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </div>

        {/* PHASE 선택 */}
        <PhaseSelector selected={selectedPhases} onChange={setSelectedPhases} />

        {/* 입력 영역 */}
        <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="분석할 사설 텍스트를 붙여넣어 주세요..."
            className="w-full h-40 md:h-48 lg:h-56 p-4 bg-transparent text-slate-300 placeholder-slate-600 text-sm resize-none outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <span className="text-xs text-slate-600">
              {text.length > 0
                ? `${text.length}자 · PHASE ${selectedPhases.join("+")} · ${getTotalSteps(selectedPhases)}단계`
                : "텍스트를 입력하세요"}
            </span>
            <button
              onClick={analyze}
              disabled={!text.trim() || isStreaming}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-slate-600 text-white text-sm font-medium transition-all"
            >
              분석 시작
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
