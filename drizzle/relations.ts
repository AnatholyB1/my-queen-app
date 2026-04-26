import { relations } from "drizzle-orm";
import { users, movie, movieSwipe, last, notification } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  swipes: many(movieSwipe),
  notifications: many(notification),
  last: many(last),
}));

export const movieRelations = relations(movie, ({ many }) => ({
  swipes: many(movieSwipe),
  lasts: many(last),
}));

export const movieSwipeRelations = relations(movieSwipe, ({ one }) => ({
  user: one(users, { fields: [movieSwipe.userId], references: [users.id] }),
  movie: one(movie, { fields: [movieSwipe.movieId], references: [movie.id] }),
}));

export const lastRelations = relations(last, ({ one }) => ({
  user: one(users, { fields: [last.userId], references: [users.id] }),
  movie: one(movie, { fields: [last.movieId], references: [movie.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  sender: one(users, { fields: [notification.senderId], references: [users.id] }),
}));
