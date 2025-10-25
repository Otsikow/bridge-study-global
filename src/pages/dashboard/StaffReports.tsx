import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BackButton from '@/components/BackButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function StaffReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [selectedMetric, setSelectedMetric] = useState('applications');

  // Mock data - replace with actual data from your backend
  const overviewStats = [
    {
      title: 'Total Applications',
      value: '156',
      change: '+12%',
      isPositive: true,
      icon: FileText,
    },
    {
      title: 'Active Students',
      value: '124',
      change: '+8%',
      isPositive: true,
      icon: Users,
    },
    {
      title: 'Completed Tasks',
      value: '89',
      change: '+15%',
      isPositive: true,
      icon: CheckCircle,
    },
    {
      title: 'Avg. Processing Time',
      value: '3.2 days',
      change: '-10%',
      isPositive: true,
      icon: Clock,
    },
  ];

  const applicationsByStatus = [
    { status: 'Submitted', count: 28, percentage: 18 },
    { status: 'Screening', count: 42, percentage: 27 },
    { status: 'Conditional Offer', count: 25, percentage: 16 },
    { status: 'Unconditional Offer', count: 18, percentage: 12 },
    { status: 'Visa Stage', count: 22, percentage: 14 },
    { status: 'Enrolled', count: 21, percentage: 13 },
  ];

  const topPrograms = [
    { program: 'MSc Computer Science', applications: 32, acceptanceRate: '78%' },
    { program: 'MBA', applications: 28, acceptanceRate: '65%' },
    { program: 'MSc Data Science', applications: 24, acceptanceRate: '72%' },
    { program: 'MA International Business', applications: 19, acceptanceRate: '80%' },
    { program: 'LLM International Law', applications: 15, acceptanceRate: '68%' },
  ];

  const topUniversities = [
    { university: 'University of Oxford', applications: 35, offers: 28 },
    { university: 'Cambridge University', applications: 32, offers: 25 },
    { university: 'Imperial College London', applications: 28, offers: 22 },
    { university: 'University College London', applications: 24, offers: 19 },
    { university: 'London School of Economics', applications: 21, offers: 17 },
  ];

  const studentsByNationality = [
    { nationality: 'United Kingdom', count: 42, percentage: 27 },
    { nationality: 'China', count: 38, percentage: 24 },
    { nationality: 'India', count: 32, percentage: 21 },
    { nationality: 'United States', count: 18, percentage: 12 },
    { nationality: 'Others', count: 26, percentage: 16 },
  ];

  const monthlyTrends = [
    { month: 'Aug', applications: 45, offers: 32, enrollments: 28 },
    { month: 'Sep', applications: 52, offers: 38, enrollments: 30 },
    { month: 'Oct', applications: 68, offers: 48, enrollments: 35 },
    { month: 'Nov', applications: 72, offers: 52, enrollments: 42 },
    { month: 'Dec', applications: 65, offers: 45, enrollments: 38 },
    { month: 'Jan', applications: 78, offers: 56, enrollments: 45 },
  ];

  const staffPerformance = [
    { name: 'You', processed: 42, avgTime: '2.8 days', satisfaction: '96%' },
    { name: 'Jane Doe', processed: 38, avgTime: '3.1 days', satisfaction: '94%' },
    { name: 'John Smith', processed: 35, avgTime: '3.5 days', satisfaction: '92%' },
    { name: 'Emily Brown', processed: 32, avgTime: '3.2 days', satisfaction: '95%' },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <BackButton variant="ghost" size="sm" fallback="/dashboard" />

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track performance and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overviewStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.isPositive ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-success" />
                      <span className="text-success font-medium">{stat.change}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                      <span className="text-destructive font-medium">{stat.change}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Applications by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Applications by Status</CardTitle>
              <CardDescription>Distribution of application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applicationsByStatus.map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.status}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Students by Nationality */}
          <Card>
            <CardHeader>
              <CardTitle>Students by Nationality</CardTitle>
              <CardDescription>Top countries of origin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentsByNationality.map((item) => (
                  <div key={item.nationality} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.nationality}</span>
                      <span className="text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Applications, offers, and enrollments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Offers</TableHead>
                    <TableHead className="text-right">Enrollments</TableHead>
                    <TableHead className="text-right">Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTrends.map((trend) => (
                    <TableRow key={trend.month}>
                      <TableCell className="font-medium">{trend.month}</TableCell>
                      <TableCell className="text-right">{trend.applications}</TableCell>
                      <TableCell className="text-right">{trend.offers}</TableCell>
                      <TableCell className="text-right">{trend.enrollments}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-success/10 text-success">
                          {Math.round((trend.enrollments / trend.applications) * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Programs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Programs</CardTitle>
                  <CardDescription>Most popular programs by applications</CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPrograms.map((program, index) => (
                  <div
                    key={program.program}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{program.program}</p>
                        <p className="text-xs text-muted-foreground">
                          {program.applications} applications
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      {program.acceptanceRate}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Universities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Universities</CardTitle>
                  <CardDescription>Partner universities by applications</CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUniversities.map((uni, index) => (
                  <div
                    key={uni.university}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{uni.university}</p>
                        <p className="text-xs text-muted-foreground">
                          {uni.applications} applications
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      {uni.offers} offers
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Team productivity and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="text-right">Applications Processed</TableHead>
                    <TableHead className="text-right">Avg. Processing Time</TableHead>
                    <TableHead className="text-right">Satisfaction Rate</TableHead>
                    <TableHead className="text-right">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffPerformance.map((staff) => (
                    <TableRow key={staff.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {staff.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{staff.processed}</TableCell>
                      <TableCell className="text-right">{staff.avgTime}</TableCell>
                      <TableCell className="text-right">{staff.satisfaction}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            parseInt(staff.satisfaction) >= 95
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          }
                        >
                          {parseInt(staff.satisfaction) >= 95 ? 'Excellent' : 'Good'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
