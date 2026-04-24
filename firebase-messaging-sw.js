importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ENV 분기
const hostname = self.location.hostname;
const isDev = hostname.includes("dev");

const firebaseConfig = isDev
  ? {
      // dev config
    }
  : {
      // prod config
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

  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }
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