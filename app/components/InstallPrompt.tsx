"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 앱으로 실행 중이면 숨김
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // iOS 감지
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Android/Chrome 설치 이벤트 수신
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 이전에 닫았으면 숨김
    const wasDismissed = sessionStorage.getItem("pwa-dismissed");
    if (wasDismissed) setDismissed(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  };

  if (isInstalled || dismissed) return null;
  if (!installEvent && !isIOS) return null;

  return (
    <>
      {/* Android/Chrome 설치 배너 */}
      {installEvent && (
        <div className="fixed bottom-4 left-4 right-4 z-50 fade-in">
          <div className="bg-[#1e2535] border border-blue-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <img
              src="/icons/icon-72x72.png"
              alt="앱 아이콘"
              className="w-12 h-12 rounded-xl shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100">사설 분석기 설치</p>
              <p className="text-xs text-slate-400 mt-0.5">홈 화면에 추가하여 앱처럼 사용</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                설치
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS 안내 배너 */}
      {isIOS && !installEvent && (
        <div className="fixed bottom-4 left-4 right-4 z-50 fade-in">
          <div className="bg-[#1e2535] border border-blue-500/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/icon-72x72.png"
                  alt="앱 아이콘"
                  className="w-10 h-10 rounded-xl"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-100">홈 화면에 추가</p>
                  <p className="text-xs text-slate-400">앱처럼 사용하기</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 text-lg px-1">
                ✕
              </button>
            </div>

            <button
              onClick={() => setShowIOSGuide(!showIOSGuide)}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              설치 방법 보기
            </button>

            {showIOSGuide && (
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs">1</span>
                  <span>하단 Safari 공유 버튼 <strong className="text-slate-300">⬆</strong> 탭</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs">2</span>
                  <span><strong className="text-slate-300">&quot;홈 화면에 추가&quot;</strong> 선택</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs">3</span>
                  <span>오른쪽 상단 <strong className="text-slate-300">&quot;추가&quot;</strong> 탭</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
