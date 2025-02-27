"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";

const apikey = process.env.NEXT_PUBLIC_MOVIES_API_KEY;

export default function MoviePage() {
  const { data, isError, isPending, isSuccess } = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data } = await axios.get(
        "https://api.themoviedb.org/3/trending/movie/day?language=en-US",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apikey}`,
          },
        }
      );
      console.log(data);
      return data.results;
    },
  });

  if (isPending) {
    return (
      <LoaderCircle className="w-full h-screen p-16 flex items-center justify-center animate-spin" />
    );
  }

  if (isError) {
    return <div>error...</div>;
  }

  return (
    <section className="flex justify-center items-center h-[calc(100vh-4rem)] overflow-y-scroll flex-col">
      {isSuccess &&
        data.map(
          (movie: { id: number; backdrop_path: string; title: string }) => (
            <div key={movie.id}>
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`}
                alt={movie.title}
                width={500}
                height={750}
              />
            </div>
          )
        )}
    </section>
  );
}
