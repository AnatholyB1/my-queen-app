import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notification, movie, last } from "@/drizzle/schema";

// Define the types for the Notification table
export type NotificationType = InferSelectModel<typeof notification>;
export type NewNotificationType = InferInsertModel<typeof notification>;

// Define the types for the Movie table
export type MovieType = InferSelectModel<typeof movie>;
export type NewMovieType = InferInsertModel<typeof movie>;

// Define the types for the Last table
export type LastType = InferSelectModel<typeof last>;
export type NewLastType = InferInsertModel<typeof last>;
