"use server";
import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";

const serviceAccountBase = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountBase) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
}

const fireBaseId = process.env.FIREBASE_ID;
if (!fireBaseId) {
  throw new Error("Missing FIREBASE_ID environment variable");
}

// Ensure the private key is correctly formatted
const formattedPrivateKey = serviceAccountBase.replace(/\\n/g, "\n");

const serviceAccount = {
  type: "service_account",
  project_id: "queen-app-417ef",
  private_key_id: fireBaseId,
  private_key: formattedPrivateKey,
  client_email:
    "firebase-adminsdk-fbsvc@queen-app-417ef.iam.gserviceaccount.com",
  client_id: "118160915009649317984",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40queen-app-417ef.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
} catch (error) {
  console.log("Firebase admin initialization error", (error as Error).message);
}

export const SendNotification = async ({
  user,
  title,
  message,
  link,
}: {
  user: string;
  title: string;
  message: string;
  link: string;
}) => {
  const payload: Message = {
    data: {
      user,
    },
    notification: {
      title,
      body: message,
    },
    webpush: {
      fcmOptions: {
        link,
      },
      notification: {
        body: message,
        requireInteraction: true,
        badge: "/public/icon-96x96.ico",
      },
    },
    topic: "app",
  };
  try {
    await admin.messaging().send(payload);

    return { success: true, message: "Notification sent!" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const subscribeToTopic = async (token: string) => {
  try {
    await admin.messaging().subscribeToTopic(token, "app");

    return { success: true, message: "Subscribed to topic!" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const unsubscribeFromTopic = async (token: string) => {
  try {
    await admin.messaging().unsubscribeFromTopic(token, "app");

    return { success: true, message: "Unsubscribed from topic!" };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
