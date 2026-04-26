"use server";

import { db } from "@/app/db";
import { notification, users } from "@/drizzle/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getOrCreateCurrentUser } from "./users";
import { action } from "@/lib/result";
import {
  idListSchema,
  notificationSchema,
  parseInput,
  type NotificationInput,
} from "@/lib/validation";

export type NotificationDto = {
  id: number;
  senderId: number;
  senderEmail: string;
  senderName: string | null;
  title: string;
  message: string;
  link: string;
  read: boolean;
  timestamp: string;
};

type JoinedRow = {
  id: number;
  senderId: number;
  title: string;
  message: string;
  link: string;
  read: boolean;
  timestamp: string;
  senderEmail: string | null;
  senderName: string | null;
};

function toDto(row: JoinedRow): NotificationDto {
  return {
    id: row.id,
    senderId: row.senderId,
    senderEmail: row.senderEmail ?? "",
    senderName: row.senderName,
    title: row.title,
    message: row.message,
    link: row.link,
    read: row.read,
    timestamp: row.timestamp,
  };
}

const baseSelect = {
  id: notification.id,
  senderId: notification.senderId,
  title: notification.title,
  message: notification.message,
  link: notification.link,
  read: notification.read,
  timestamp: notification.timestamp,
  senderEmail: users.email,
  senderName: users.name,
};

export const createNotification = async (input: NotificationInput) =>
  action("createNotification", async () => {
    const data = parseInput(notificationSchema, input);
    const me = await getOrCreateCurrentUser();
    const inserted = await db
      .insert(notification)
      .values({
        senderId: me.id,
        title: data.title,
        message: data.message,
        link: data.link,
      })
      .returning();
    const row = inserted[0]!;
    return toDto({
      ...row,
      senderEmail: me.email,
      senderName: me.name,
    });
  });

/**
 * Notifications addressed to the current user — i.e. sent by SOMEONE ELSE
 * and not yet marked read.
 */
export const getUnreadNotifications = async () =>
  action("getUnreadNotifications", async () => {
    const me = await getOrCreateCurrentUser();
    const rows = await db
      .select(baseSelect)
      .from(notification)
      .innerJoin(users, eq(users.id, notification.senderId))
      .where(and(ne(notification.senderId, me.id), eq(notification.read, false)))
      .orderBy(desc(notification.timestamp));
    return rows.map(toDto);
  });

export const markNotificationRead = async (id: number | number[]) =>
  action("markNotificationRead", async () => {
    const ids = parseInput(idListSchema, id);
    const me = await getOrCreateCurrentUser();
    const idArray = Array.isArray(ids) ? ids : [ids];
    // Only mark as read those that were addressed to me (not authored by me).
    await db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          inArray(notification.id, idArray),
          ne(notification.senderId, me.id),
        ),
      );
    return { count: idArray.length };
  });

export const getAllNotifications = async () =>
  action("getAllNotifications", async () => {
    await getOrCreateCurrentUser();
    const rows = await db
      .select(baseSelect)
      .from(notification)
      .innerJoin(users, eq(users.id, notification.senderId))
      .orderBy(desc(notification.timestamp))
      .limit(500);
    return rows.map(toDto);
  });

// Backwards-compat aliases (legacy import names)
export const CreateNotification = createNotification;
export const GetUnreadNotification = getUnreadNotifications;
export const ChangeReadState = markNotificationRead;
export const GetAllNotification = getAllNotifications;
