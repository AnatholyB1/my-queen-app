import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notification } from "@/drizzle/schema";

// Define the types for the Notification table
export type NotificationType = InferSelectModel<typeof notification>;
export type NewNotificationType = InferInsertModel<typeof notification>;
