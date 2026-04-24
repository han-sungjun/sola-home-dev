importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ENV 분기
const hostname = self.location.hostname;
const isDev = hostname.includes("dev");

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
      appId: "1:337132471819:web:848cd357fecda459a2e90e",
      measurementId: "G-E7R9JJGGJE"
    };

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 백그라운드 수신
messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || "알림";
  const body = payload.data?.body || "";
  const url = payload.data?.url || "/";
  const noticeId = payload.data?.noticeId || "";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200], // 중요 알림 느낌
    data: {
      url,
      noticeId
    }
  });
});

// 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification?.data || {};
  const targetUrl = data.url || "/";
  const noticeId = data.noticeId || "";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({
            type: "OPEN_NOTICE",
            noticeId,
            url: targetUrl
          });

          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});

// SW 최신화
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});