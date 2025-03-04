import { StaticImageData } from "next/image";
import { SetStateAction } from "react";

type TracksData = {
  name: string;
  artist: string;
  img: string;
};

export type CardData = {
  id: number;
  name: string;
  src: StaticImageData;
  age: number;
  bio: string;
  genre: string[];
  tracks: TracksData[];
};

export type CardProps = {
  data: CardData;
  active: boolean;
  removeCard: (id: number, action: "right" | "left") => void;
};

export type SwipeButtonProps = {
  exit: (value: SetStateAction<number>) => void;
  removeCard: (id: number, action: "right" | "left") => void;
  id: number;
};

export type ButtonData = {
  text: string;
  title: string;
  short: string;
  message: string;
  link: string;
};

export type Movie = {
  backdrop_path: string;
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  media_type: string;
  adult: boolean;
  original_language: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};
