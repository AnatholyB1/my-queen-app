import { pgTable, integer, varchar, timestamp, unique, boolean, text, char, date, serial } from "drizzle-orm/pg-core"
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
	backdropPath: text("backdrop_path").notNull(),
	overview: char({ length: 500 }).notNull(),
	genreIds: text("genre_ids").notNull(),
	releaseDate: date("release_date").notNull(),
	voteAverage: serial("vote_average").notNull(),
}, (table) => [
	unique("movie_movie_id_key").on(table.movieId),
]);
