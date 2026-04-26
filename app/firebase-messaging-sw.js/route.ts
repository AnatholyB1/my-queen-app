import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Serve the Firebase messaging service worker with the env-driven Firebase
 * config injected. This avoids hardcoding API keys / project IDs in a public
 * static asset.
 */
export async function GET() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
  };

  const body = `/* eslint-disable */
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(cfg)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const link = payload.fcmOptions?.link || payload.data?.link || "/";
  const title = (payload.notification && payload.notification.title) || "Notification";
  const body = (payload.notification && payload.notification.body) || "";
  // Same-origin only — protect against open redirects in the SW.
  const safeUrl = link && link.startsWith("/") && !link.startsWith("//") ? link : "/";
  return self.registration.showNotification(title, {
    body,
    icon: "/icon-144x144.ico",
    data: { url: safeUrl },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const url = event.notification.data && event.notification.data.url;
      if (!url) return;
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "service-worker-allowed": "/",
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });
}
