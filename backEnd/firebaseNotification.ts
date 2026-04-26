"use server";

import admin from "firebase-admin";
import type { Message } from "firebase-admin/messaging";
import { createNotification } from "./notification";
import { getOrCreateCurrentUser } from "./users";
import { action } from "@/lib/result";
import { logger } from "@/lib/logger";
import {
  fcmTokenSchema,
  notificationSchema,
  parseInput,
  type NotificationInput,
} from "@/lib/validation";

const FCM_TOPIC = process.env.FIREBASE_TOPIC ?? "app";

function loadServiceAccount(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed as unknown as admin.ServiceAccount;
    } catch (err) {
      logger.error(
        { err: (err as Error).message },
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON",
      );
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT (must be JSON)", {
        cause: err,
      });
    }
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase admin credentials. Provide FIREBASE_SERVICE_ACCOUNT or FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY",
    );
  }
  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function getFirebaseApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  return admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

const APP_BASE_URL = process.env.APP_BASE_URL ?? "";

export const sendNotification = async (input: NotificationInput) =>
  action("sendNotification", async () => {
    const data = parseInput(notificationSchema, input);
    const me = await getOrCreateCurrentUser();

    // Persist first so we have an id even if FCM is down.
    const created = await createNotification(data);
    if (!created.success) throw new Error("Failed to persist notification");

    const link = APP_BASE_URL ? `${APP_BASE_URL}${data.link}` : data.link;
    const payload: Message = {
      data: { senderId: String(me.id) },
      notification: { title: data.title, body: data.message },
      webpush: {
        fcmOptions: { link },
        notification: {
          body: data.message,
          requireInteraction: true,
        },
      },
      topic: FCM_TOPIC,
    };

    try {
      const app = getFirebaseApp();
      await admin.messaging(app).send(payload);
    } catch (err) {
      logger.error(
        { err: (err as Error).message, action: "sendNotification" },
        "Firebase send failed",
      );
      // Notification is persisted; the in-app UI still surfaces it.
    }
    return { id: created.data.id };
  });

export const subscribeToTopic = async (token: string) =>
  action("subscribeToTopic", async () => {
    const t = parseInput(fcmTokenSchema, token);
    await getOrCreateCurrentUser();
    const app = getFirebaseApp();
    await admin.messaging(app).subscribeToTopic(t, FCM_TOPIC);
    return { topic: FCM_TOPIC };
  });

export const unsubscribeFromTopic = async (token: string) =>
  action("unsubscribeFromTopic", async () => {
    const t = parseInput(fcmTokenSchema, token);
    await getOrCreateCurrentUser();
    const app = getFirebaseApp();
    await admin.messaging(app).unsubscribeFromTopic(t, FCM_TOPIC);
    return { topic: FCM_TOPIC };
  });

// Legacy aliases
export const SendNotification = sendNotification;
