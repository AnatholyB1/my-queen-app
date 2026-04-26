import {
  pgTable,
  integer,
  varchar,
  timestamp,
  boolean,
  text,
  uniqueIndex,
  index,
  serial,
} from "drizzle-orm/pg-core";

/**
 * Users — populated from the OIDC provider on first login.
 * `external_id` is the provider subject (Auth0 `sub`).
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_external_id_idx").on(t.externalId),
    uniqueIndex("users_email_idx").on(t.email),
  ],
);

/**
 * Catalog of movies seen by the app (one row per TMDB movie).
 */
export const movie = pgTable(
  "movie",
  {
    id: serial("id").primaryKey(),
    movieId: integer("movie_id").notNull(),
    page: integer("page").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("movie_movie_id_idx").on(t.movieId)],
);

/**
 * Per-user swipe choice. Replaces the old hardcoded `anatholy`/`axelle`
 * boolean columns. Unique on (user_id, movie_id).
 */
export const movieSwipe = pgTable(
  "movie_swipe",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movie.id, { onDelete: "cascade" }),
    choice: boolean("choice").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("movie_swipe_user_movie_idx").on(t.userId, t.movieId),
    index("movie_swipe_movie_idx").on(t.movieId),
  ],
);

/**
 * Last position for resuming the swipe deck.
 */
export const last = pgTable(
  "last",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movie.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("last_user_idx").on(t.userId)],
);

/**
 * Notifications — sent FROM a user (recipient is everyone else subscribed).
 */
export const notification = pgTable(
  "notification",
  {
    id: serial("id").primaryKey(),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: varchar("message", { length: 1024 }).notNull(),
    link: varchar("link", { length: 1024 }).notNull(),
    read: boolean("read").default(false).notNull(),
    timestamp: timestamp("timestamp", { mode: "string" }).defaultNow().notNull(),
  },
  (t) => [index("notification_sender_idx").on(t.senderId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Movie = typeof movie.$inferSelect;
export type NewMovie = typeof movie.$inferInsert;
export type MovieSwipe = typeof movieSwipe.$inferSelect;
export type NewMovieSwipe = typeof movieSwipe.$inferInsert;
export type Last = typeof last.$inferSelect;
export type NewLast = typeof last.$inferInsert;
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;

// Backwards-compat aliases for legacy file paths
export { notification as notifications };

// Legacy `text` column type unused; keep the import alive when needed.
export const _unusedText = text;
