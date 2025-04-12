"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

interface FinancialChartProps {
  totalAmount: number; // السعر الأساسي
  remainingAmount: number; // السعر المتبقي
}

// ✅ دالة لتحديد اللون بناءً على النسبة
const getColor = (percentage: number): string => {
  if (percentage > 80) return "hsl(220, 90%, 50%)"; // أزرق
  if (percentage > 60) return "hsl(140, 70%, 40%)"; // أخضر
  if (percentage > 30) return "hsl(50, 90%, 50%)"; // أصفر
  return "hsl(0, 80%, 50%)"; // أحمر
};

export function FinancialChart({
  totalAmount,
  remainingAmount,
}: FinancialChartProps) {
  const percentage = (remainingAmount / totalAmount) * 100;
  const barColor = getColor(percentage);

  const chartData = [
    // { name: "Total", value: totalAmount, fill: "hsl(220, 20%, 80%)" }, // خلفية باهتة
    { name: "Remaining", value: remainingAmount, fill: barColor }, // الشريط الفعلي
  ];

  const chartConfig: ChartConfig = {
    remaining: {
      label: "المتبقي",
      color: barColor,
    },
  };

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="mx-auto aspect-square max-h-[200px]"
          config={chartConfig}
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 - percentage * 3.6} // تحكم في القوس بناءً على النسبة
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="none" />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan className="fill-foreground text-lg font-bold">
                          {remainingAmount.toLocaleString()} جنيه
                        </tspan>

                        <tspan
                          x={cx}
                          dy="40" // ⬅️ زيادة المسافة بين السطرين
                          className="fill-muted-foreground text-sm"
                        >
                          من {totalAmount.toLocaleString()}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
