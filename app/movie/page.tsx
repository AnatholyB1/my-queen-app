"use client";
import { Movie } from "@/types";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { LoaderCircle, AlignRight } from "lucide-react";
import Image from "next/image";
import SwipeCard from "@/components/ui/frame";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getLastMoviePage, updateLastMovie } from "@/backEnd/movies";
import { useSession } from "next-auth/react";
import { useSwipeContext } from "@/app/providers/SwipeProvider";

type TmdbPage = {
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];
};

const MAX_PAGES = 50;
const PREFETCH_THRESHOLD = 0.75;

async function fetchTrending(page: number): Promise<TmdbPage> {
  const { data } = await axios.get<TmdbPage>(`/api/movies/trending`, {
    params: { page },
  });
  return data;
}

export default function MoviePage() {
  const [showOverview, setShowOverview] = useState(false);
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const { status } = useSession();
  const { setIsMatched } = useSwipeContext();
  const isAuthed = status === "authenticated";

  const { data, isError, isSuccess, fetchNextPage, isFetching } = useInfiniteQuery({
    queryKey: ["movies"],
    enabled: isAuthed,
    queryFn: async ({ pageParam }) => {
      const resume = await getLastMoviePage();
      const resumeMovie = resume.success ? resume.data.movie : null;

      const requestedPage = pageParam === 1 && resumeMovie ? resumeMovie.page : pageParam;
      const pageData = await fetchTrending(requestedPage);

      // Trim already-seen entries up to the resume movie when applicable.
      if (resumeMovie && pageData.page === resumeMovie.page) {
        const idx = pageData.results.findIndex((m) => m.id === resumeMovie.movieId);
        if (idx >= 0) {
          pageData.results = pageData.results.slice(idx + 1);
        }
      }
      return pageData;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const next = lastPage.page + 1;
      if (next > Math.min(lastPage.total_pages, MAX_PAGES)) return undefined;
      return next;
    },
    initialPageParam: 1,
    staleTime: 60_000,
  });

  const { mutate: persistChoice } = useMutation({
    mutationFn: updateLastMovie,
    onSuccess: (res) => {
      if (res.success && res.data.matched) {
        setIsMatched(true);
      }
    },
  });

  // Flatten + de-duplicate movies coming back from infinite query
  useEffect(() => {
    if (!isSuccess || !data) return;
    const seen = new Set<number>();
    const flattened: Movie[] = [];
    for (const page of data.pages) {
      for (const m of page.results) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          flattened.push(m);
        }
      }
    }
    setMovies(flattened);
    setCurrentCard((prev) => prev ?? flattened[0]?.id ?? null);
  }, [data, isSuccess]);

  const currentPageNumber = useMemo(
    () => data?.pages[data.pages.length - 1]?.page ?? 1,
    [data],
  );

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-destructive">
        Impossible de charger les films. Réessaie plus tard.
      </div>
    );
  }

  if (!isAuthed || movies.length === 0 || isFetching) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoaderCircle className="animate-spin" aria-label="Chargement" />
      </div>
    );
  }

  return (
    <section className="flex justify-center items-center h-[calc(100vh-4rem)] overflow-y-scroll flex-col w-screen">
      {movies.map((movie, index) => (
        <SwipeCard
          onContextMenu={(e) => e.preventDefault()}
          className={currentCard === movie.id ? "block" : "hidden"}
          onSwipe={(isSwiped, choice) => {
            if (!isSwiped) return;

            const next = movies[index + 1];
            if (next) setCurrentCard(next.id);

            const currentIndex = movies.findIndex((m) => m.id === currentCard);
            if (currentIndex > movies.length * PREFETCH_THRESHOLD) {
              fetchNextPage();
            }

            persistChoice({
              movieData: { movieId: movie.id, page: currentPageNumber },
              choice,
            });
          }}
          key={movie.id}
        >
          <div className="relative text-accent text-inter font-bold flex flex-col rounded-lg gap-2 px-4 py-6 bg-foreground">
            <Image
              draggable="false"
              className="object-cover max-w-[300px] w-full h-auto rounded-lg border border-zinc-50"
              src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`}
              alt={movie.title}
              width={300}
              height={300}
            />
            <Button
              type="button"
              aria-label={showOverview ? "Masquer le résumé" : "Afficher le résumé"}
              onClick={() => setShowOverview((p) => !p)}
              size="icon"
              className="absolute top-1/2 right-2"
            >
              <AlignRight />
            </Button>
            {!showOverview ? (
              <>
                <h1 className="text-xl font-bold break-words line-clamp-2 max-w-[300px]">
                  {movie.title}
                </h1>
                <p>Note : {movie.vote_average}</p>
                <p>Sortie : {movie.release_date}</p>
              </>
            ) : (
              <p className="word-break max-w-[300px]">{movie.overview}</p>
            )}
          </div>
        </SwipeCard>
      ))}
    </section>
  );
}
