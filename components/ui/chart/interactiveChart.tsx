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
import { distinctSenders, senderLabel } from "./chartUtils";

const RANGE_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export default function InteractiveChart() {
  const [timeRange, setTimeRange] = React.useState("90d");
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

  if (allNotifications.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Activité dans le temps</CardTitle>
          <CardDescription>Pas encore de données</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <LoaderCircle className="animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const days = RANGE_DAYS[timeRange] ?? 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const buckets: Record<string, Record<string, string | number>> = {};
  for (const n of allNotifications) {
    const t = new Date(n.timestamp).getTime();
    if (Number.isNaN(t) || t < cutoff) continue;
    const date = new Date(t).toISOString().slice(0, 10);
    const label = senderLabel(n);
    if (!buckets[date]) {
      buckets[date] = { date };
      for (const s of senders) buckets[date][s.name] = 0;
    }
    buckets[date][label] = ((buckets[date][label] as number) ?? 0) + 1;
  }
  const data = Object.values(buckets).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Activité dans le temps</CardTitle>
          <CardDescription>
            Notifications envoyées par membre du couple
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
            <SelectValue placeholder="3 derniers mois" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d">3 derniers mois</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="7d">7 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
                  }
                  indicator="dot"
                />
              }
            />
            {senders.map((s) => (
              <Area
                key={s.name}
                dataKey={s.name}
                type="natural"
                fill={`var(--color-${s.name})`}
                fillOpacity={0.4}
                stroke={`var(--color-${s.name})`}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
