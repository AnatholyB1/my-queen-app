"use client";

import * as React from "react";
import { Label, Pie, PieChart as RePieChart } from "recharts";

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ButtonData } from "@/types";
import { buttonChoiceData } from "@/data/buttonChoiceData";
import { useFcmToken } from "@/hooks/useFcmToken";
import { senderLabel } from "./chartUtils";

const generateChartConfig = (data: ButtonData[]): ChartConfig => {
  const cfg: ChartConfig = {};
  data.forEach((item, index) => {
    cfg[item.short] = {
      label: item.short,
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
  });
  return cfg;
};

const chartConfig = generateChartConfig(buttonChoiceData);

interface Props {
  /** Sender label to filter on (e.g. user display name). */
  user: string;
}

export default function PieChart({ user }: Props) {
  const { allNotifications } = useFcmToken();

  const titleToShort = React.useMemo(
    () =>
      buttonChoiceData.reduce<Record<string, string>>((acc, item) => {
        acc[item.title] = item.short;
        return acc;
      }, {}),
    [],
  );

  const data = React.useMemo(() => {
    const buckets: Record<string, { label: string; count: number; fill: string }> = {};
    for (const n of allNotifications) {
      if (senderLabel(n).toLowerCase() !== user.toLowerCase()) continue;
      const type = titleToShort[n.title];
      if (!type) continue;
      if (!buckets[type]) {
        buckets[type] = { label: type, count: 0, fill: `var(--color-${type})` };
      }
      buckets[type].count += 1;
    }
    return Object.values(buckets);
  }, [allNotifications, titleToShort, user]);

  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>{user}</CardTitle>
        <CardDescription>Répartition de {total} notifications</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square">
          <RePieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Notifications
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </RePieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
