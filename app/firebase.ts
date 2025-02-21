// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBndqCOaUxmLkz2PsBk0OBs4SMYpqwG4lM",
  authDomain: "queen-app-417ef.firebaseapp.com",
  projectId: "queen-app-417ef",
  storageBucket: "queen-app-417ef.firebasestorage.app",
  messagingSenderId: "766219822611",
  appId: "1:766219822611:web:07dec786e903241fd541e6",
  measurementId: "G-XS6WZ4RCV0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: process.env.FIREBASE_PUBLIC_KEY,
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export { app, messaging };
