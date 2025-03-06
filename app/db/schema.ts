import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notification, movie } from "@/drizzle/schema";

// Define the types for the Notification table
export type NotificationType = InferSelectModel<typeof notification>;
export type NewNotificationType = InferInsertModel<typeof notification>;

// Define the types for the Movie table
export type MovieType = InferSelectModel<typeof movie>;
export type NewMovieType = InferInsertModel<typeof movie>;
