"use client";

import { HistoryItem } from "../hooks/useHistory";
import { PHASE_INFO } from "./StepCard";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function Sidebar({ open, onClose, history, onLoad, onDelete, onClear }: SidebarProps) {
  return (
    <>
      {/* 오버레이 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#161b27] border-r border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-sm font-semibold text-slate-200">분석 히스토리</h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-slate-600 hover:text-red-400 transition-colors"
              >
                전체 삭제
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">
              아직 분석 기록이 없습니다
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-white/8 bg-white/3 hover:bg-white/6 transition-colors group"
              >
                <button
                  onClick={() => { onLoad(item); onClose(); }}
                  className="w-full text-left p-3"
                >
                  <p className="text-xs text-slate-400 mb-1 line-clamp-2 leading-relaxed">
                    {item.preview}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{item.date}</span>
                    <div className="flex gap-0.5">
                      {item.selectedPhases.map((ph) => {
                        const info = PHASE_INFO.find((p) => p.phase === ph);
                        return (
                          <span
                            key={ph}
                            className="text-xs px-1 rounded bg-white/10 text-slate-500"
                          >
                            P{ph}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {item.results.length}단계 완료
                  </p>
                </button>
                <div className="flex border-t border-white/5">
                  <button
                    onClick={() => { onLoad(item); onClose(); }}
                    className="flex-1 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors rounded-bl-lg"
                  >
                    불러오기
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="flex-1 py-1.5 text-xs text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-br-lg"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-slate-700 text-center py-3 shrink-0">
          최근 {Math.min(history.length, 5)}개 / 최대 5개 저장
        </p>
      </aside>
    </>
  );
}
