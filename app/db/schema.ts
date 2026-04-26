// Re-export typed shapes from the canonical Drizzle schema so that
// existing imports keep working.
export type {
  User,
  NewUser,
  Movie as MovieRow,
  NewMovie,
  MovieSwipe,
  NewMovieSwipe,
  Last as LastRow,
  NewLast,
  Notification as NotificationType,
  NewNotification as NewNotificationType,
} from "@/drizzle/schema";

import type { NewMovie, NewMovieSwipe } from "@/drizzle/schema";

// Legacy aliases used across the app
export type NewMovieType = NewMovie & { choice?: boolean };
export type NewSwipe = NewMovieSwipe;
