import { relations } from "drizzle-orm/relations";
import { movie, last } from "./schema";

export const lastRelations = relations(last, ({one}) => ({
	movie: one(movie, {
		fields: [last.movie],
		references: [movie.id]
	}),
}));

export const movieRelations = relations(movie, ({many}) => ({
	lasts: many(last),
}));