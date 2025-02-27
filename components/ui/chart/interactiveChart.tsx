"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFcmToken } from "@/hooks/useFcmToken";
import { LoaderCircle } from "lucide-react";

const chartConfig = {
  Anatholy: {
    label: "Anatholy",
    color: "hsl(var(--chart-1))",
  },
  Axelle: {
    label: "Axelle",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function Component() {
  const [timeRange, setTimeRange] = React.useState("90d");
  const { allNotifications } = useFcmToken();

  if (typeof allNotifications == "undefined") {
    return (
      <LoaderCircle className="w-full h-screen p-16 flex items-center justify-center animate-spin" />
    );
  }

  const filteredData = allNotifications
    .filter((item) => {
      const date = new Date(item.timestamp);
      const referenceDate = new Date("2025-02-14");
      let daysToSubtract = 90;
      if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    })
    .reduce((acc, item) => {
      const date = new Date(item.timestamp).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, Axelle: 0, Anatholy: 0 };
      }
      if (item.user === "axelle.charrier.14@gmail.com") {
        acc[date].Axelle += 1;
      } else if (item.user === "anatholyb@gmail.com") {
        acc[date].Anatholy += 1;
      }
      return acc;
    }, {} as Record<string, { date: string; Axelle: number; Anatholy: number }>);

  const filteredDataArray = Object.values(filteredData);

  return (
    <Card className="mx-6">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Area Chart - Interactive</CardTitle>
          <CardDescription>
            Showing total notifications from the start of the app between the
            Queen and the King
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredDataArray}>
            <defs>
              <linearGradient id="fillAnatholy" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Anatholy)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Anatholy)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillAxelle" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Axelle)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Axelle)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="Axelle"
              type="natural"
              fill="url(#fillAxelle)"
              stroke="var(--color-Axelle)"
              stackId="a"
            />
            <Area
              dataKey="Anatholy"
              type="natural"
              fill="url(#fillAnatholy)"
              stroke="var(--color-Anatholy)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
