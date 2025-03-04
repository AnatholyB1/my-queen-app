"use client";
import { Movie } from "@/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import SwipeCard from "@/components/ui/frame";
import { useEffect, useState } from "react";

const apikey = process.env.NEXT_PUBLIC_MOVIES_API_KEY;

export default function MoviePage() {
  const [showOverview, setShowOverview] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const { data, isError, isSuccess, fetchNextPage } = useInfiniteQuery({
    queryKey: ["movies"],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/trending/movie/day?language=en-US&page=${pageParam}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apikey}`,
          },
        }
      );
      const { page, total_pages, total_results, results } = data as {
        page: number;
        total_pages: number;
        total_results: number;
        results: Movie[];
      };

      return {
        page,
        total_pages,
        total_results,
        results,
      };
    },
    getNextPageParam: (lastPage: {
      page: number;
      total_pages: number;
      total_results: number;
      results: Movie[];
    }) => {
      return lastPage.page < lastPage.total_pages
        ? lastPage.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if (isSuccess) {
      {
        //delete movies with same ID:
        const uniqueMovies = data.pages
          .flatMap((page) => page.results)
          .filter((movie) => !movies.some((m) => m.id === movie.id));
        setMovies([...movies, ...uniqueMovies]);
        if (currentCard === 0) {
          setCurrentCard(data.pages[0].results[0].id);
        }
      }
      return () => {};
    }
  }, [data, isSuccess, setMovies]);

  if (isError) {
    return <div>error...</div>;
  }

  if (movies.length === 0) {
    return (
      <LoaderCircle className="w-full h-screen p-16 flex items-center justify-center animate-spin" />
    );
  }

  let timer: NodeJS.Timeout;

  const handleTouchStart = () => {
    timer = setTimeout(() => {
      setShowOverview(true);
    }, 1000);
  };

  const handleTouchEnd = () => {
    clearTimeout(timer);
    setShowOverview(false);
  };

  const handleTouchCancel = () => {
    clearTimeout(timer);
    setShowOverview(false);
  };

  interface ContextMenuEvent extends React.MouseEvent<HTMLDivElement> {
    preventDefault: () => void;
  }

  const handleContextMenu = (event: ContextMenuEvent) => {
    event.preventDefault();
  };

  return (
    <section className="flex justify-center items-center h-[calc(100vh-4rem)] overflow-y-scroll flex-col w-screen">
      {isSuccess &&
        movies.map((movie, index) => (
          <SwipeCard
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onContextMenu={handleContextMenu}
            isDragging={(isDragging) => {
              if (isDragging) {
                clearTimeout(timer);
                setShowOverview(false);
              }
            }}
            className={`${currentCard == movie.id ? "block" : "hidden"} `}
            onSwipe={(isSwiped, choice) => {
              if (isSwiped) {
                setCurrentCard(movies[index + 1].id);
                // get the index of the current card in movies array
                const currentIndex = movies.findIndex(
                  (movie) => movie.id === currentCard
                );
                // if current index is greater then 3/4 of the movies array length, fetch next page
                if (currentIndex > movies.length * 0.75) {
                  fetchNextPage();
                }
                console.log(choice);
              }
            }}
            key={movie.id}
          >
            <div className="relative text-accent text-inter text-normal font-bold flex flex-col rounded-lg gap-2 px-4 py-6 bg-foreground ">
              {showOverview ? (
                <p className="word-break">{movie.overview}</p>
              ) : (
                <>
                  <Image
                    className="object-cover  w-[300px] h-[300px] rounded-lg border border-zinc-50"
                    src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`}
                    alt={movie.title}
                    width={300}
                    height={300}
                  />
                  <h1 className="text-xl font-bold break-words line-clamp-2 max-w-[300px]">
                    {movie.title}
                  </h1>
                  <p>Rating: {movie.vote_average}</p>
                  <p>Release Date: {movie.release_date}</p>
                </>
              )}
            </div>
          </SwipeCard>
        ))}
    </section>
  );
}
