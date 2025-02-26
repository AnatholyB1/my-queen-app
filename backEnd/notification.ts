"use server";
import { db } from "@/app/db";
import { NewNotificationType } from "@/app/db/schema";
import { notification } from "@/drizzle/schema";
import { and, eq, inArray, not } from "drizzle-orm";

export const CreateNotification = async (data: NewNotificationType) => {
  try {
    await db.insert(notification).values(data);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const GetUnreadNotification = async (email: string) => {
  try {
    const notifications = await db
      .select()
      .from(notification)
      .where(and(not(eq(notification.user, email)), eq(notification.read, 0)));
    return { success: true, notifications };
  } catch (error) {
    return { success: false, error };
  }
};

export const ChangeReadState = async (id: number | number[]) => {
  try {
    if (id instanceof Array) {
      await db
        .update(notification)
        .set({ read: 1 })
        .where(inArray(notification.id, id));
    } else {
      await db
        .update(notification)
        .set({ read: 1 })
        .where(eq(notification.id, id));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
