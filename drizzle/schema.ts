import { pgTable, integer, varchar, timestamp, unique, boolean, foreignKey, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const notification = pgTable("notification", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "notification_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	user: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: varchar({ length: 255 }).notNull(),
	link: varchar({ length: 255 }).notNull(),
	read: integer().default(0).notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const movie = pgTable("movie", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "movie_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	anatholy: boolean().default(false).notNull(),
	axelle: boolean().default(false).notNull(),
	movieId: integer("movie_id").notNull(),
	page: integer().notNull(),
}, (table) => [
	unique("movie_movie_id_key").on(table.movieId),
]);

export const last = pgTable("last", {
	user: text().notNull(),
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "last_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	movie: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.movie],
			foreignColumns: [movie.id],
			name: "constraint_1"
		}),
	unique("last_user_key").on(table.user),
]);
