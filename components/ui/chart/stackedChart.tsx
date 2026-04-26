"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { buttonChoiceData } from "@/data/buttonChoiceData";
import { useFcmToken } from "@/hooks/useFcmToken";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { distinctSenders, senderLabel } from "./chartUtils";

export default function StackedChart() {
  const { allNotifications } = useFcmToken();

  const senders = React.useMemo(
    () => distinctSenders(allNotifications),
    [allNotifications],
  );

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {};
    senders.forEach((s, i) => {
      cfg[s.name] = { label: s.name, color: `hsl(var(--chart-${(i % 5) + 1}))` };
    });
    return cfg;
  }, [senders]);

  const titleToShort = React.useMemo(
    () =>
      buttonChoiceData.reduce<Record<string, string>>((acc, item) => {
        acc[item.title] = item.short;
        return acc;
      }, {}),
    [],
  );

  const data = React.useMemo(() => {
    const buckets: Record<string, Record<string, string | number>> = {};
    for (const n of allNotifications) {
      const type = titleToShort[n.title];
      if (!type) continue;
      const label = senderLabel(n);
      if (!buckets[type]) {
        buckets[type] = { type };
        for (const s of senders) buckets[type][s.name] = 0;
      }
      buckets[type][label] = ((buckets[type][label] as number) ?? 0) + 1;
    }
    return Object.values(buckets);
  }, [allNotifications, senders, titleToShort]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Répartition par type</CardTitle>
        <CardDescription>
          Tous les types de notifications, par expéditeur
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="overflow-x-auto" config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="type"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {senders.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                stackId="a"
                fill={`var(--color-${s.name})`}
                radius={
                  i === senders.length - 1
                    ? [4, 4, 0, 0]
                    : i === 0
                    ? [0, 0, 4, 4]
                    : [0, 0, 0, 0]
                }
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
