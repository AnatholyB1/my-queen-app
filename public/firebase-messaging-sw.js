importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// Replace these with your own Firebase config keys...
const firebaseConfig = {
  apiKey: "AIzaSyBndqCOaUxmLkz2PsBk0OBs4SMYpqwG4lM",
  authDomain: "queen-app-417ef.firebaseapp.com",
  projectId: "queen-app-417ef",
  storageBucket: "queen-app-417ef.firebasestorage.app",
  messagingSenderId: "766219822611",
  appId: "1:766219822611:web:07dec786e903241fd541e6",
  measurementId: "G-XS6WZ4RCV0",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

  // payload.fcmOptions?.link comes from our backend API route handle
  // payload.data.link comes from the Firebase Console where link is the 'key'
  const link = payload.fcmOptions?.link || payload.data?.link;

  const notificationTitle = payload.notification.title + 'sw';    
  const notificationOptions = {
    body: payload.notification.body + "sw",
    icon: "./icon-144x144.ico",
    data: { url: link },
  };
  console.log(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {

  event.notification.close();

  // This checks if the client is already open and if it is, it focuses on the tab. If it is not open, it opens a new tab with the URL passed in the notification payload
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        const url = event.notification.data.url;

        if (!url) return;

        // If relative URL is passed in firebase console or API route handler, it may open a new window as the client.url is the full URL i.e. https://example.com/ and the url is /about whereas if we passed in the full URL, it will focus on the existing tab i.e. https://example.com/about
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          console.log("OPENWINDOW ON CLIENT");
          return clients.openWindow(url);
        }
      })
  );
});