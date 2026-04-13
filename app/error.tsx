"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-red-400 mb-3">오류가 발생했습니다</h2>
        <p className="text-slate-400 text-sm mb-2">
          {error.message || "페이지를 불러오는 중 오류가 발생했습니다."}
        </p>
        {error.digest && (
          <p className="text-slate-600 text-xs mb-6">오류 코드: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
