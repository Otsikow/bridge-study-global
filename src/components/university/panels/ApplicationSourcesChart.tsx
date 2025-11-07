import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatePlaceholder } from "../common/StatePlaceholder";
import { Globe2 } from "lucide-react";
import type { ChartDatum } from "../layout/UniversityDashboardLayout";

const COLORS = [
  "#3b82f6",
  "#60a5fa",
  "#22d3ee",
  "#38bdf8",
  "#818cf8",
  "#a855f7",
  "#f97316",
];

interface ApplicationSourcesChartProps {
  data: ChartDatum[];
}

export const ApplicationSourcesChart = ({
  data,
}: ApplicationSourcesChartProps) => {
  return (
    <Card className="h-full rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-300">
          Applications by Country
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <StatePlaceholder
            icon={<Globe2 className="h-8 w-8 text-slate-500" />}
            title="No application data yet"
            description="As soon as applications are submitted, we will visualise source markets here."
            className="h-full bg-transparent"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color ?? COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
