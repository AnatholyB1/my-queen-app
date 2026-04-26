"use client";
import * as React from "react";
import InteractiveChart from "@/components/ui/chart/interactiveChart";
import StackedChart from "@/components/ui/chart/stackedChart";
import PieChart from "@/components/ui/chart/pieChart";
import { distinctSenders } from "@/components/ui/chart/chartUtils";
import { useFcmToken } from "@/hooks/useFcmToken";

export default function Stats() {
  const { allNotifications } = useFcmToken();
  const senders = React.useMemo(
    () => distinctSenders(allNotifications),
    [allNotifications],
  );

  return (
    <section className="flex flex-col gap-4 px-6 pt-20 pb-20 overflow-y-auto items-center h-screen">
      <InteractiveChart />
      <StackedChart />
      {senders.map((s) => (
        <PieChart key={s.email} user={s.name} />
      ))}
    </section>
  );
}
