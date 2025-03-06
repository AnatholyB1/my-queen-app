"use server";
import { db } from "@/app/db";
import { NewMovieType } from "@/app/db/schema";
import { movie, last } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function getMatchedMovies() {
  try {
    const movies = await db
      .select()
      .from(movie)
      .where(and(eq(movie.anatholy, true), eq(movie.axelle, true)));
    return { success: true, movies };
  } catch (error) {
    return { success: false, error };
  }
}

export async function checkMatch(id: number) {
  try {
    const matched = await db
      .select()
      .from(movie)
      .where(
        and(
          eq(movie.movieId, id),
          eq(movie.anatholy, true),
          eq(movie.axelle, true)
        )
      );
    if (matched.length === 0) {
      return { success: true, matched: false };
    }
    return { success: true, matched: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function matchMovie({
  data,
  user,
}: {
  data: NewMovieType;
  user: string;
}) {
  try {
    //check if movie is already created
    const matched = await db
      .select()
      .from(movie)
      .where(eq(movie.movieId, data.movieId));

    if (matched.length === 0) {
      await db.insert(movie).values({ ...data, [user]: true });
      return { success: true, matched: false };
    }

    const checkMatchedOtherUser = user === "anatholy" ? "axelle" : "anatholy";

    await db
      .update(movie)
      .set({ [user]: true })
      .where(eq(movie.movieId, data.movieId));

    if (matched[0][checkMatchedOtherUser]) {
      return { success: true, matched: true };
    } else {
      return { success: true, matched: false };
    }
  } catch (error) {
    return { success: false, error };
  }
}

export async function getLastMoviePage(user: string) {
  try {
    const lastData = await db
      .select()
      .from(last)
      .rightJoin(movie, eq(last.movie, movie.id))
      .where(eq(last.user, user));
    return { success: true, movie: lastData[0].movie };
  } catch (error) {
    return { success: false, error };
  }
}

export async function updateLastMovie({
  movieData,
  user,
  choice,
}: {
  movieData: NewMovieType;
  user: string;
  choice: boolean;
}) {
  try {
    const lastData = await db
      .select()
      .from(last)
      .rightJoin(movie, eq(last.id, movie.id))
      .where(eq(last.user, user));

    const currentMovie = await db
      .select()
      .from(movie)
      .where(eq(movie.movieId, movieData.movieId));

    if (lastData.length === 0) {
      if (currentMovie.length === 0) {
        {
          await db.insert(movie).values({ ...movieData, [user]: choice });
          const idResult = await db
            .select({ id: movie.id })
            .from(movie)
            .where(eq(movie.movieId, movieData.movieId));
          const id = idResult[0].id;
          await db.insert(last).values({ user, movie: id });
        }
      } else {
        await db
          .update(last)
          .set({ movie: currentMovie[0].id })
          .where(eq(last.user, user));
      }
    } else {
      if (currentMovie.length === 0) {
        await db.insert(movie).values({ ...movieData, [user]: choice });
      } else {
        await db
          .update(last)
          .set({ movie: currentMovie[0].id })
          .where(eq(last.user, user));
      }
    }

    if (choice) {
      const result = await matchMovie({ data: movieData, user });
      return { success: true, matched: result.matched };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
