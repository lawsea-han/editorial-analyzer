"use client";

import { PHASE_INFO, COLOR_MAP } from "./StepCard";

interface PhaseSelectorProps {
  selected: number[];
  onChange: (phases: number[]) => void;
}

export function PhaseSelector({ selected, onChange }: PhaseSelectorProps) {
  const toggle = (phase: number) => {
    if (selected.includes(phase)) {
      if (selected.length === 1) return; // 최소 1개
      onChange(selected.filter((p) => p !== phase));
    } else {
      onChange([...selected, phase].sort());
    }
  };

  const allSelected = selected.length === PHASE_INFO.length;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">분석할 PHASE 선택</span>
        <button
          onClick={() =>
            allSelected
              ? onChange([1])
              : onChange(PHASE_INFO.map((p) => p.phase))
          }
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {allSelected ? "전체 해제" : "전체 선택"}
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {PHASE_INFO.map((p) => {
          const c = COLOR_MAP[p.color];
          const isOn = selected.includes(p.phase);
          return (
            <button
              key={p.phase}
              onClick={() => toggle(p.phase)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                isOn
                  ? `${c.badge} border-current`
                  : "bg-white/5 text-slate-500 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="mr-1">{isOn ? "✓" : ""}</span>
              {p.label}
              <span className="ml-1 opacity-60">— {p.title}</span>
            </button>
          );
        })}
      </div>
      {selected.length < PHASE_INFO.length && (
        <p className="text-xs text-slate-600 mt-2">
          선택: {selected.map((p) => `PHASE ${p}`).join(", ")} ({selected.reduce((acc, ph) => {
            const info = PHASE_INFO.find((p) => p.phase === ph);
            return acc + (info?.steps.length ?? 0);
          }, 0)}단계)
        </p>
      )}
    </div>
  );
}
