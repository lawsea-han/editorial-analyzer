"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ background: "#0f1117", color: "#e2e8f0", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: "500px", padding: "32px" }}>
          <h1 style={{ fontSize: "20px", marginBottom: "12px" }}>오류가 발생했습니다</h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px" }}>
            {error?.message || "알 수 없는 오류"}
          </p>
          {error?.digest && (
            <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "24px" }}>
              오류 코드: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
