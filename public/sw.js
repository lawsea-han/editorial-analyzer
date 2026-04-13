const CACHE = "editorial-v1";
const STATIC = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// 설치: 정적 자원 캐싱
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // API 요청은 캐시 건너뜀 (스트리밍)
  if (url.pathname.startsWith("/api/")) return;

  // 네비게이션 요청: 네트워크 우선, 실패 시 캐시
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match("/").then((r) => r ?? Response.error())
      )
    );
    return;
  }

  // 정적 자원: 캐시 우선
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
