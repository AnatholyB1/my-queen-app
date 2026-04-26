"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let _app: FirebaseApp | null = null;
function getOrInitApp(): FirebaseApp {
  if (_app) return _app;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      "Firebase client config missing — set NEXT_PUBLIC_FIREBASE_* env vars",
    );
  }
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return _app;
}

export const messaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(getOrInitApp());
};

export const fetchToken = async (): Promise<string | null> => {
  const fcm = await messaging();
  if (!fcm) return null;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY not set; skipping token fetch");
    return null;
  }
  try {
    return await getToken(fcm, { vapidKey });
  } catch (err) {
    console.warn("Failed to fetch FCM token", (err as Error).message);
    return null;
  }
};

export const app = typeof window !== "undefined" ? getOrInitApp() : null;
