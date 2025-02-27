"use client";
import InteractiveChart from "@/components/ui/chart/interactiveChart";
import StackedChart from "@/components/ui/chart/stackedChart";
import PieChart from "@/components/ui/chart/pieChart";

export default function Stats() {
  return (
    <section className="flex flex-col gap-4 pt-20 pb-20 overflow-y-auto items-center h-screen">
      <InteractiveChart />
      <StackedChart />
      <PieChart user={"Axelle"} />
      <PieChart user={"Anatholy"} />
    </section>
  );
}
