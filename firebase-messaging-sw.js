importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ===============================
// 환경 감지
// ===============================

const hostname = self.location.hostname;

const isDev =
  hostname.includes("dev") ||
  hostname.includes("localhost") ||
  hostname.startsWith("192.") ||
  hostname.startsWith("127.");


// ===============================
// Firebase 설정
// ===============================

const firebaseConfig = isDev
  ? {
      apiKey: "AIzaSyCC4ZilL1Gv_zy0_iw36b0CO4Uq7vYX6rE",
      authDomain: "sola-home-dev.firebaseapp.com",
      projectId: "sola-home-dev",
      storageBucket: "sola-home-dev.firebasestorage.app",
      messagingSenderId: "292137041544",
      appId: "1:292137041544:web:c648f4380b1562a31e693d",
      measurementId: "G-R7TZ1PG6QP"
    }
  : {
      apiKey: "AIzaSyDhKr7oMSrLowJ47cqB4pvNXuIIdtW0HPI",
      authDomain: "sola-home-4979a.firebaseapp.com",
      projectId: "sola-home-4979a",
      storageBucket: "sola-home-4979a.firebasestorage.app",
      messagingSenderId: "337132471819",
      appId: "1:337132471819:web:848cd357fecda459a2e90e"
    };


// ===============================
// 워커 최신화
// ===============================

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});


// ===============================
// Firebase 초기화
// ===============================

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();


// ===============================
// 백그라운드 푸시 수신
// ===============================

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] background message:', payload);

  const data = payload?.data || {};
  const title = data.title || payload?.notification?.title || '새 알림';
  const body = data.body || payload?.notification?.body || '';
  const url = data.url || payload?.fcmOptions?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url }
  });
});


// ===============================
// 알림 클릭 처리
// ===============================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});