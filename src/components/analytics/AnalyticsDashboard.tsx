import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const USER_ACTIVITY_DATA = [
  { week: "Apr 1", active: 1240, returning: 740, newUsers: 320, conversion: 24 },
  { week: "Apr 8", active: 1375, returning: 810, newUsers: 360, conversion: 26 },
  { week: "Apr 15", active: 1460, returning: 860, newUsers: 410, conversion: 28 },
  { week: "Apr 22", active: 1525, returning: 890, newUsers: 430, conversion: 31 },
  { week: "Apr 29", active: 1640, returning: 950, newUsers: 480, conversion: 33 },
  { week: "May 6", active: 1720, returning: 1010, newUsers: 520, conversion: 34 },
  { week: "May 13", active: 1815, returning: 1055, newUsers: 560, conversion: 36 },
];

const APPLICATION_TRENDS_DATA = [
  { month: "Nov", submitted: 620, reviewed: 480, approved: 320, enrolled: 210 },
  { month: "Dec", submitted: 680, reviewed: 515, approved: 345, enrolled: 240 },
  { month: "Jan", submitted: 735, reviewed: 560, approved: 380, enrolled: 265 },
  { month: "Feb", submitted: 810, reviewed: 605, approved: 410, enrolled: 290 },
  { month: "Mar", submitted: 890, reviewed: 650, approved: 445, enrolled: 315 },
  { month: "Apr", submitted: 940, reviewed: 690, approved: 470, enrolled: 330 },
];

const TOP_SEGMENTS = [
  { label: "STEM Programmes", growth: "+18.5%", volume: "342 applications" },
  { label: "Postgraduate", growth: "+14.3%", volume: "287 applications" },
  { label: "Canada", growth: "+11.2%", volume: "198 enrollments" },
  { label: "Scholarship Track", growth: "+9.8%", volume: "156 applications" },
];

const CONVERSION_FUNNEL_DATA = [
  { name: "Visitors", count: 3250 },
  { name: "Sign-ups", count: 2015 },
  { name: "Applications", count: 1480 },
  { name: "Offers", count: 1045 },
  { name: "Enrollments", count: 620 },
];

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#f97316", "#10b981", "#0ea5e9"];

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active users</CardDescription>
            <CardTitle className="text-3xl font-bold">1,815</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>vs last month</span>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30">
                +12.6%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average session time</CardDescription>
            <CardTitle className="text-3xl font-bold">8m 42s</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>week over week</span>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30">
                +6.4%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Applications approved</CardDescription>
            <CardTitle className="text-3xl font-bold">470</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>conversion to enrollment</span>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-950/30">
                38%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue per enrollment</CardDescription>
            <CardTitle className="text-3xl font-bold">$1,820</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>rolling 90 days</span>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30">
                +9.1%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User activity overview</CardTitle>
            <CardDescription>Active, returning, and new users over the past 7 weeks</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={USER_ACTIVITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ strokeDasharray: "4 4" }} />
                <Legend />
                <Area type="monotone" dataKey="active" stroke="#2563eb" fill="#2563eb33" strokeWidth={2} />
                <Area type="monotone" dataKey="returning" stroke="#7c3aed" fill="#7c3aed33" strokeWidth={2} />
                <Area type="monotone" dataKey="newUsers" stroke="#f97316" fill="#f9731633" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement highlights</CardTitle>
            <CardDescription>Key behavioral signals from the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Peak activity",
                detail: "Wednesdays between 2-5 PM",
                change: "+21%",
                tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30",
              },
              {
                title: "Most engaged segment",
                detail: "Postgraduate applicants",
                change: "+16% time on platform",
                tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/30",
              },
              {
                title: "Churn risk",
                detail: "Users inactive for 14+ days",
                change: "324 accounts",
                tone: "bg-rose-50 text-rose-700 dark:bg-rose-950/30",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.tone}`}>
                    {item.change}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application pipeline trends</CardTitle>
            <CardDescription>Monthly volume across key review stages</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={APPLICATION_TRENDS_DATA}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reviewed" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enrolled" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion rate trend</CardTitle>
            <CardDescription>Week-over-week enrollment conversion</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={USER_ACTIVITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 70]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Line type="monotone" dataKey="conversion" stroke="#db2777" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle conversion funnel</CardTitle>
            <CardDescription>Volume retained at every stage this quarter</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONVERSION_FUNNEL_DATA} layout="vertical" margin={{ left: 32 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={110} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {CONVERSION_FUNNEL_DATA.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top growth segments</CardTitle>
            <CardDescription>Where user and application growth is accelerating</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {TOP_SEGMENTS.map((segment, index) => (
              <div key={segment.label} className="rounded-lg border p-4 space-y-2">
                <Badge
                  variant="secondary"
                  className="w-fit border-transparent bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                >
                  #{index + 1}
                </Badge>
                <p className="text-base font-semibold">{segment.label}</p>
                <p className="text-sm text-muted-foreground">{segment.volume}</p>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30">
                  {segment.growth}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
