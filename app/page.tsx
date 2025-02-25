"use client";
import { ButtonChoice } from "@/components/ButtonChoice";
import { buttonChoiceData } from "@/data/buttonChoiceData";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen">
      <ButtonChoice buttonData={buttonChoiceData} />
    </div>
  );
}
