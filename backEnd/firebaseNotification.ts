"use server";
import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import serviceAccount from "@/adminSdk.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const SendNotification = async ({
  token,
  title,
  message,
  link,
}: {
  token: string;
  title: string;
  message: string;
  link: string;
}) => {
  const payload: Message = {
    token,
    notification: {
      title,
      body: message,
    },
    webpush: {
      fcmOptions: {
        link,
      },
    },
  };
  try {
    await admin.messaging().send(payload);

    return { success: true, message: "Notification sent!" };
  } catch (error) {
    return { success: false, error };
  }
};
