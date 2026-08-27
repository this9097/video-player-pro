// Video Player Pro — 설치형 PWA용 최소 서비스워커
// (오프라인 캐시는 핵심 목적이 아니라, 설치 가능 조건 충족 + 파일 핸들러 동작을 위한 용도)
// ── 자동 업데이트: 이 파일(sw.js) 내용이 바뀌면 브라우저가 새 버전을 감지 →
//    설치 후 즉시 활성화(skipWaiting) → 페이지 쪽에 "업데이트됨" 메시지 전달
//    (실제 새로고침 타이밍은 index.html에서 재생 중이 아닐 때로 제어)
const CACHE = 'video-player-pro-v6';
const CORE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

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
