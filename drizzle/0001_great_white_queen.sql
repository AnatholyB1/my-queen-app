CREATE TABLE "notification" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" varchar(255) NOT NULL,
	"link" varchar(255) NOT NULL
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;