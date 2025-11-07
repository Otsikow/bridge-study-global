import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatePlaceholder } from "../common/StatePlaceholder";
import { CheckCircle } from "lucide-react";
import type { ChartDatum } from "../layout/UniversityDashboardLayout";

interface ApplicationStatusChartProps {
  data: ChartDatum[];
}

export const ApplicationStatusChart = ({
  data,
}: ApplicationStatusChartProps) => {
  return (
    <Card className="h-full rounded-2xl border border-slate-800/60 bg-slate-900/40 text-slate-100">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-slate-300">
          Application Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.every((item) => item.value === 0) ? (
          <StatePlaceholder
            icon={<CheckCircle className="h-8 w-8 text-slate-500" />}
            title="No outcome data yet"
            description="Outcome data will populate once applications progress through offers and enrolment."
            className="h-full bg-transparent"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color ?? "#3b82f6"}
                    className="rounded-lg"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
