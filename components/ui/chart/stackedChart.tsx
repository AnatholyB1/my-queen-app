"use client";

import { LoaderCircle } from "lucide-react";
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
  const { allNotifications } = useFcmToken();

  if (typeof allNotifications == "undefined") {
    return (
      <LoaderCircle className="w-full h-screen p-16 flex items-center justify-center animate-spin" />
    );
  }

  const titleToShortMap = buttonChoiceData.reduce((acc, item) => {
    acc[item.title] = item.short;
    return acc;
  }, {} as Record<string, string>);

  const transformedData = allNotifications.reduce((acc, item) => {
    const type = titleToShortMap[item.title];
    if (!type) return acc; // Skip if the title does not match

    if (!acc[type]) {
      acc[type] = { type, Anatholy: 0, Axelle: 0 };
    }

    if (item.user === "anatholyb@gmail.com") {
      acc[type].Anatholy += 1;
    } else if (item.user === "axelle.charrier.14@gmail.com") {
      acc[type].Axelle += 1;
    }

    return acc;
  }, {} as Record<string, { type: string; Anatholy: number; Axelle: number }>);

  const transformedDataArray = Object.values(transformedData);

  return (
    <Card className="mx-6">
      <CardHeader>
        <CardTitle>Bar Chart</CardTitle>
        <CardDescription>
          Showing all types of notification between the Queen and the King
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={transformedDataArray}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="type"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="Anatholy"
              stackId="a"
              fill="var(--color-Anatholy)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="Axelle"
              stackId="a"
              fill="var(--color-Axelle)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
