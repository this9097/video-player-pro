// Video Player Pro — 설치형 PWA용 최소 서비스워커
// (오프라인 캐시는 핵심 목적이 아니라, 설치 가능 조건 충족 + 파일 핸들러 동작을 위한 용도)
// ── 자동 업데이트: 이 파일(sw.js) 내용이 바뀌면 브라우저가 새 버전을 감지 →
//    설치 후 즉시 활성화(skipWaiting) → 페이지 쪽에 "업데이트됨" 메시지 전달
//    (실제 새로고침 타이밍은 index.html에서 재생 중이 아닐 때로 제어)
const CACHE = 'video-player-pro-v8';
const CORE = ['./index.html', './manifest.json', './icon-192.png', './icon-256.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll({ type: 'window' }))
     .then((clients) => clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED', version: CACHE })))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 다른 도메인(CDN 등)으로 나가는 요청은 서비스워커가 가로채지 않고 그대로 통과시킴
  // (변환 엔진 등 외부 리소스 로딩이 캐시 레이어 때문에 지연/실패하는 것을 방지)
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
