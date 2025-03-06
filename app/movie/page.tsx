"use client";
import { Movie } from "@/types";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import SwipeCard from "@/components/ui/frame";
import { useEffect, useState } from "react";
import { AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLastMoviePage, updateLastMovie } from "@/backEnd/movies";
import { useSession } from "next-auth/react";
import { NewMovieType } from "../db/schema";
import { useSwipeContext } from "@/app/providers/SwipeProvider";

const apikey = process.env.NEXT_PUBLIC_MOVIES_API_KEY;

export default function MoviePage() {
  const [showOverview, setShowOverview] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const { data: session } = useSession();
  const { setIsMatched } = useSwipeContext();

  const waitSession = async () => {
    if (!session) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      waitSession();
    }
  };

  const { data, isError, isSuccess, fetchNextPage } = useInfiniteQuery({
    queryKey: ["movies"],
    queryFn: async ({ pageParam = 1 }) => {
      //wait for session to be defined
      waitSession();

      const user =
        session?.user?.email === "anatholyb@gmail.com" ? "anatholy" : "axelle";
      //if pageParam is 1, get the last page from the database
      const lastpageData = await getLastMoviePage(user);
      if (pageParam === 1) {
        if (lastpageData.movie) {
          pageParam = lastpageData.movie.page;
        }
      }

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

      const movieToReturn = {
        page,
        total_pages,
        total_results,
        results,
      };

      //cut the results to the begin the list on the next movie from the last page
      if (page === lastpageData.movie?.page) {
        //start the list from the next movie of lastpageData.movie.movieId
        const index = results.findIndex(
          (movie) => movie.id === lastpageData.movie?.movieId
        );
        movieToReturn.results = results.slice(index + 1);
      }

      return movieToReturn;
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

  const { mutate: server_updateLastMovie } = useMutation({
    mutationFn: updateLastMovie,
    onSuccess: (data) => {
      if (data.matched) {
        console.log("matched");
        setIsMatched(true);
      }
    },
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
            onContextMenu={handleContextMenu}
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

                // get the movie to update and map it to the movie object
                const mapMovieToNewType = (movie: Movie): NewMovieType => {
                  return {
                    movieId: movie.id,
                    page: data.pages[data.pages.length - 1].page,
                  };
                };
                const movieToUpdate = movies.find(
                  (movie) => movie.id === currentCard
                );

                if (!movieToUpdate) return;

                const movieDataMap = mapMovieToNewType(movieToUpdate);

                server_updateLastMovie({
                  movieData: movieDataMap,
                  choice,
                  user:
                    session?.user?.email === "anatholyb@gmail.com"
                      ? "anatholy"
                      : "axelle",
                });
              }
            }}
            key={movie.id}
          >
            <div className="relative text-accent text-inter text-normal font-bold flex flex-col rounded-lg gap-2 px-4 py-6 bg-foreground ">
              <Image
                //prevent dragging of the image
                draggable="false"
                className="object-cover max-w-[300px] w-full h-auto rounded-lg border border-zinc-50"
                src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`}
                alt={movie.title}
                width={300}
                height={300}
              />
              <Button
                onClick={() => setShowOverview((prev) => !prev)}
                size={"icon"}
                className="absolute top-1/2 right-2"
              >
                <AlignRight />
              </Button>
              {!showOverview ? (
                <>
                  <h1 className="text-xl font-bold break-words line-clamp-2 max-w-[300px]">
                    {movie.title}
                  </h1>
                  <p>Rating: {movie.vote_average}</p>
                  <p>Release Date: {movie.release_date}</p>
                </>
              ) : (
                <p className="word-break  max-w-[300px] ">{movie.overview}</p>
              )}
            </div>
          </SwipeCard>
        ))}
    </section>
  );
}
