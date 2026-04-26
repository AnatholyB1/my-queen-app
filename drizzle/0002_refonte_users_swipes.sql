-- Refonte: introduce a real users table, replace hardcoded
-- anatholy/axelle boolean columns by a movie_swipe table, and add
-- proper foreign keys.

CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY,
    "external_id" varchar(255) NOT NULL,
    "email" varchar(320) NOT NULL,
    "name" varchar(255),
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_external_id_idx" ON "users" ("external_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
--> statement-breakpoint

-- Backfill the two known historical accounts so existing rows map cleanly.
INSERT INTO "users" ("external_id", "email", "name")
VALUES
    ('legacy:anatholy', 'anatholyb@gmail.com', 'Anatholy'),
    ('legacy:axelle',   'axelle@example.com', 'Axelle')
ON CONFLICT ("external_id") DO NOTHING;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "movie_swipe" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL,
    "movie_id" integer NOT NULL,
    "choice" boolean NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "movie_swipe_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "movie_swipe_movie_fk" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "movie_swipe_user_movie_idx" ON "movie_swipe" ("user_id", "movie_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "movie_swipe_movie_idx" ON "movie_swipe" ("movie_id");
--> statement-breakpoint

-- Migrate existing anatholy/axelle boolean columns into movie_swipe rows.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'movie' AND column_name = 'anatholy'
    ) THEN
        INSERT INTO "movie_swipe" ("user_id", "movie_id", "choice")
        SELECT u.id, m.id, m.anatholy
        FROM "movie" m, "users" u
        WHERE u.external_id = 'legacy:anatholy'
        ON CONFLICT DO NOTHING;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'movie' AND column_name = 'axelle'
    ) THEN
        INSERT INTO "movie_swipe" ("user_id", "movie_id", "choice")
        SELECT u.id, m.id, m.axelle
        FROM "movie" m, "users" u
        WHERE u.external_id = 'legacy:axelle'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
--> statement-breakpoint

-- Drop the legacy boolean columns now that data is migrated.
ALTER TABLE "movie" DROP COLUMN IF EXISTS "anatholy";
--> statement-breakpoint
ALTER TABLE "movie" DROP COLUMN IF EXISTS "axelle";
--> statement-breakpoint
ALTER TABLE "movie" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- Migrate `last` to user_id (was free-text user) and rename column "movie" -> "movie_id".
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'last' AND column_name = 'user' AND data_type = 'text'
    ) THEN
        ALTER TABLE "last" ADD COLUMN IF NOT EXISTS "user_id" integer;
        UPDATE "last" l
           SET "user_id" = u.id
          FROM "users" u
         WHERE u.external_id = 'legacy:' || l."user"::text;
        ALTER TABLE "last" DROP COLUMN "user";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'last' AND column_name = 'movie'
    ) THEN
        ALTER TABLE "last" RENAME COLUMN "movie" TO "movie_id";
    END IF;

    ALTER TABLE "last" ALTER COLUMN "user_id" SET NOT NULL;
    ALTER TABLE "last" ALTER COLUMN "movie_id" SET NOT NULL;
    ALTER TABLE "last" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
END $$;
--> statement-breakpoint

ALTER TABLE "last" DROP CONSTRAINT IF EXISTS "constraint_1";
--> statement-breakpoint
ALTER TABLE "last" DROP CONSTRAINT IF EXISTS "last_user_key";
--> statement-breakpoint
ALTER TABLE "last" ADD CONSTRAINT "last_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "last" ADD CONSTRAINT "last_movie_fk" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "last_user_idx" ON "last" ("user_id");
--> statement-breakpoint

-- Migrate `notification.user` (free-text email) to `sender_id` (FK).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification' AND column_name = 'user'
    ) THEN
        ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "sender_id" integer;
        UPDATE "notification" n
           SET "sender_id" = u.id
          FROM "users" u
         WHERE u.email = n."user";
        DELETE FROM "notification" WHERE "sender_id" IS NULL;
        ALTER TABLE "notification" ALTER COLUMN "sender_id" SET NOT NULL;
        ALTER TABLE "notification" DROP COLUMN "user";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification' AND column_name = 'read' AND data_type = 'integer'
    ) THEN
        ALTER TABLE "notification" ALTER COLUMN "read" DROP DEFAULT;
        ALTER TABLE "notification" ALTER COLUMN "read" TYPE boolean USING ("read" <> 0);
        ALTER TABLE "notification" ALTER COLUMN "read" SET DEFAULT false;
    END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "notification" ADD CONSTRAINT "notification_sender_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_sender_idx" ON "notification" ("sender_id");
--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "message" TYPE varchar(1024);
--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "link" TYPE varchar(1024);
