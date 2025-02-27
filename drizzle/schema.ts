import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core"
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
