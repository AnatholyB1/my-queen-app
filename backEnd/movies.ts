"use server";

const apikey = process.env.MOVIES_API_KEY;
if (!apikey) {
  throw new Error("Missing MOVIES_API_KEY environment variable");
}

export const getMovies = async () => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apikey}&language=fr-FR&page=1`
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
    return { success: false, error: (error as Error).message };
  }
};
