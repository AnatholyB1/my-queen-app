"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

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
import { LoaderCircle } from "lucide-react";

const generateChartConfig = (data: ButtonData[]) => {
  const chartConfig: Record<string, { label: string; color: string }> = {};

  data.forEach((item, index) => {
    chartConfig[item.short] = {
      label: item.short,
      color: `hsl(var(--chart-${index + 1}))`,
    };
  });

  return chartConfig;
};

const chartConfig = generateChartConfig(buttonChoiceData) satisfies ChartConfig;

interface Props {
  user: string;
}

export default function Component(props: Props) {
  const { user } = props;
  const { allNotifications } = useFcmToken();

  const userEmail =
    user === "Axelle" ? "axelle.charrier.14@gmail.com" : "anatholyb@gmail.com";

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
      acc[type] = {
        label: type,
        count: 0,
        fill: `var(--color-${type})`,
      };
    }

    if (item.user === userEmail) {
      acc[type].count += 1;
    }

    return acc;
  }, {} as Record<string, { label: string; count: number; fill: string }>);

  const transformedDataArray = Object.values(transformedData);

  const notificationCounts = transformedDataArray.reduce(
    (acc, item) => acc + item.count,
    0
  );

  return (
    <Card className="flex flex-col w-full ">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Donut</CardTitle>
        <CardDescription>{user} Data</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square ">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={transformedDataArray}
              dataKey="count"
              nameKey="label"
              innerRadius={60}
              strokeWidth={5}
            >
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
                          {notificationCounts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Notifications
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
