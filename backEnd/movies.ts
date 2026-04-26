"use server";

import { db } from "@/app/db";
import { movie, movieSwipe, last } from "@/drizzle/schema";
import { and, eq, sql } from "drizzle-orm";
import { getOrCreateCurrentUser } from "./users";
import { action } from "@/lib/result";
import {
  newMovieSchema,
  parseInput,
  swipeChoiceSchema,
  type NewMovieInput,
  type SwipeChoiceInput,
} from "@/lib/validation";

export type MatchedMovie = {
  id: number;
  movieId: number;
  page: number;
};

export type LastMovieResume = {
  id: number;
  movieId: number;
  page: number;
};

/**
 * Movies that BOTH the current user AND any other user have liked.
 * Replaces the old anatholy/axelle hardcoded join.
 */
export const getMatchedMovies = async () =>
  action("getMatchedMovies", async () => {
    const me = await getOrCreateCurrentUser();
    const myLikes = db
      .select({ movieId: movieSwipe.movieId })
      .from(movieSwipe)
      .where(and(eq(movieSwipe.userId, me.id), eq(movieSwipe.choice, true)))
      .as("my_likes");

    const matched = await db
      .selectDistinct({
        id: movie.id,
        movieId: movie.movieId,
        page: movie.page,
      })
      .from(movieSwipe)
      .innerJoin(myLikes, eq(myLikes.movieId, movieSwipe.movieId))
      .innerJoin(movie, eq(movie.id, movieSwipe.movieId))
      .where(and(eq(movieSwipe.choice, true), sql`${movieSwipe.userId} <> ${me.id}`));

    return matched satisfies MatchedMovie[];
  });

export const checkMatch = async (tmdbMovieId: number) =>
  action("checkMatch", async () => {
    const id = parseInput(newMovieSchema.shape.movieId, tmdbMovieId);
    const me = await getOrCreateCurrentUser();
    const rows = await db
      .select({
        userId: movieSwipe.userId,
        choice: movieSwipe.choice,
      })
      .from(movieSwipe)
      .innerJoin(movie, eq(movie.id, movieSwipe.movieId))
      .where(eq(movie.movieId, id));

    const meLikes = rows.some((r) => r.userId === me.id && r.choice);
    const otherLikes = rows.some((r) => r.userId !== me.id && r.choice);
    return { matched: meLikes && otherLikes };
  });

async function upsertMovieRow(input: NewMovieInput) {
  const inserted = await db
    .insert(movie)
    .values({ movieId: input.movieId, page: input.page })
    .onConflictDoUpdate({
      target: movie.movieId,
      set: { page: input.page },
    })
    .returning({ id: movie.id });
  return inserted[0]!.id;
}

/**
 * Record a swipe for the authenticated user and report whether the
 * choice produces a match (both users liked the same movie).
 */
export const matchMovie = async (input: SwipeChoiceInput) =>
  action("matchMovie", async () => {
    const { movieData, choice } = parseInput(swipeChoiceSchema, input);
    const me = await getOrCreateCurrentUser();

    const movieRowId = await upsertMovieRow(movieData);

    await db
      .insert(movieSwipe)
      .values({ userId: me.id, movieId: movieRowId, choice })
      .onConflictDoUpdate({
        target: [movieSwipe.userId, movieSwipe.movieId],
        set: { choice },
      });

    if (!choice) return { matched: false };

    const others = await db
      .select({ userId: movieSwipe.userId })
      .from(movieSwipe)
      .where(
        and(
          eq(movieSwipe.movieId, movieRowId),
          eq(movieSwipe.choice, true),
          sql`${movieSwipe.userId} <> ${me.id}`,
        ),
      )
      .limit(1);

    return { matched: others.length > 0 };
  });

export const getLastMoviePage = async () =>
  action("getLastMoviePage", async () => {
    const me = await getOrCreateCurrentUser();
    const rows = await db
      .select({
        id: movie.id,
        movieId: movie.movieId,
        page: movie.page,
      })
      .from(last)
      .innerJoin(movie, eq(movie.id, last.movieId))
      .where(eq(last.userId, me.id))
      .limit(1);
    return { movie: (rows[0] ?? null) as LastMovieResume | null };
  });

/**
 * Update both the swipe choice AND the resume position in one atomic step.
 */
export const updateLastMovie = async (input: SwipeChoiceInput) =>
  action("updateLastMovie", async () => {
    const { movieData, choice } = parseInput(swipeChoiceSchema, input);
    const me = await getOrCreateCurrentUser();

    const movieRowId = await upsertMovieRow(movieData);

    await db
      .insert(movieSwipe)
      .values({ userId: me.id, movieId: movieRowId, choice })
      .onConflictDoUpdate({
        target: [movieSwipe.userId, movieSwipe.movieId],
        set: { choice },
      });

    await db
      .insert(last)
      .values({ userId: me.id, movieId: movieRowId })
      .onConflictDoUpdate({
        target: last.userId,
        set: { movieId: movieRowId, updatedAt: sql`now()` },
      });

    if (!choice) return { matched: false };

    const others = await db
      .select({ userId: movieSwipe.userId })
      .from(movieSwipe)
      .where(
        and(
          eq(movieSwipe.movieId, movieRowId),
          eq(movieSwipe.choice, true),
          sql`${movieSwipe.userId} <> ${me.id}`,
        ),
      )
      .limit(1);

    return { matched: others.length > 0 };
  });
