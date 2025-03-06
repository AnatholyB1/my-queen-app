"use server";
import { db } from "@/app/db";
import { NewMovieType, MovieType } from "@/app/db/schema";
import { movie } from "@/drizzle/schema";
import { and, eq, inArray, not } from "drizzle-orm";

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
        and(eq(movie.id, id), eq(movie.anatholy, true), eq(movie.axelle, true))
      );
    if (matched.length === 0) {
      return { success: true, matched: false };
    }
    return { success: true, matched: true };
  } catch (error) {
    return { success: false, error };
  }
}


export async function createMovie(data: NewMovieType) {
  try {
    await db.insert(movie).values(data);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}