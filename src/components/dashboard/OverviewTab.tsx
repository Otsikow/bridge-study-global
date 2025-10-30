import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface OverviewTabProps {
  metrics: {
    totalStudents: number;
    totalApplications: number;
    partnerUniversities: number;
    agents: number;
    revenue: number;
  };
  loading: boolean;
}

interface CountryData {
  name: string;
  count: number;
}

interface AgentData {
  name: string;
  applications: number;
}

interface ProgramData {
  name: string;
  applications: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function OverviewTab({ metrics, loading }: OverviewTabProps) {
  const [topCountries, setTopCountries] = useState<CountryData[]>([]);
  const [topAgents, setTopAgents] = useState<AgentData[]>([]);
  const [topPrograms, setTopPrograms] = useState<ProgramData[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [showcaseStats, setShowcaseStats] = useState<{ count: number; lastUpdated: string | null }>({
    count: 0,
    lastUpdated: null,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);

        // Fetch top countries
        const { data: studentsData } = await supabase
          .from('students')
          .select('nationality');
        
        const countryCounts = studentsData?.reduce((acc: { [key: string]: number }, student) => {
          if (student.nationality) {
            acc[student.nationality] = (acc[student.nationality] || 0) + 1;
          }
          return acc;
        }, {}) || {};

        const topCountriesData = Object.entries(countryCounts)
          .map(([name, count]) => ({ name, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopCountries(topCountriesData);

        // Fetch top agents by applications
        const { data: applicationsData } = await supabase
          .from('applications')
          .select(`
            agent_id,
            agents (
              profile_id,
              profiles (
                full_name
              )
            )
          `)
          .not('agent_id', 'is', null);

        const agentCounts = applicationsData?.reduce((acc: { [key: string]: { name: string, count: number } }, app: any) => {
          if (app.agent_id && app.agents?.profiles?.full_name) {
            const agentName = app.agents.profiles.full_name;
            if (!acc[app.agent_id]) {
              acc[app.agent_id] = { name: agentName, count: 0 };
            }
            acc[app.agent_id].count++;
          }
          return acc;
        }, {}) || {};

        const topAgentsData = Object.values(agentCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(agent => ({ name: agent.name, applications: agent.count }));

        setTopAgents(topAgentsData);

        // Fetch top programs
        const { data: programsData } = await supabase
          .from('applications')
          .select(`
            program_id,
            programs (
              name
            )
          `);

        const programCounts = programsData?.reduce((acc: { [key: string]: { name: string, count: number } }, app: any) => {
          if (app.program_id && app.programs?.name) {
            const programName = app.programs.name;
            if (!acc[app.program_id]) {
              acc[app.program_id] = { name: programName, count: 0 };
            }
            acc[app.program_id].count++;
          }
          return acc;
        }, {}) || {};

        const topProgramsData = Object.values(programCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(program => ({ name: program.name, applications: program.count }));

        setTopPrograms(topProgramsData);

        const { count: featuredCount } = await supabase
          .from('universities')
          .select('*', { count: 'exact', head: true })
          .eq('featured', true);

        const { data: featuredUpdated } = await supabase
          .from('universities')
          .select('updated_at')
          .eq('featured', true)
          .order('updated_at', { ascending: false })
          .limit(1);

        setShowcaseStats({
          count: featuredCount || 0,
          lastUpdated: featuredUpdated?.[0]?.updated_at ?? null,
        });

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Students</span>
                <span className="font-medium">{loading ? '...' : metrics.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Applications</span>
                <span className="font-medium">{loading ? '...' : metrics.totalApplications}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Partner Universities</span>
                <span className="font-medium">{loading ? '...' : metrics.partnerUniversities}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Agents</span>
                <span className="font-medium">{loading ? '...' : metrics.agents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="font-medium text-success">${loading ? '...' : metrics.revenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Draft</span>
                </div>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Submitted</span>
                </div>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Approved</span>
                </div>
                <span className="font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Enrolled</span>
                </div>
                <span className="font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-dashed">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Featured university showcase
              </CardTitle>
              <CardDescription>
                Control the carousel content that appears on the marketing site.
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link to="/admin/featured-universities">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Active spotlights</p>
              <Badge className="text-lg px-3 py-1">
                {analyticsLoading ? '...' : showcaseStats.count}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Last curated</p>
              <p className="text-sm font-medium">
                {analyticsLoading
                  ? 'Loading...'
                  : showcaseStats.lastUpdated
                  ? new Date(showcaseStats.lastUpdated).toLocaleString()
                  : 'Not available'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Widgets */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Top Performing Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : topCountries.length > 0 ? (
              <div className="space-y-3">
                {topCountries.map((country, index) => (
                  <div key={country.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{country.name}</span>
                    </div>
                    <span className="font-medium">{country.count} students</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : topAgents.length > 0 ? (
              <div className="space-y-3">
                {topAgents.map((agent, index) => (
                  <div key={agent.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{agent.name}</span>
                    </div>
                    <span className="font-medium">{agent.applications} apps</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Programs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : topPrograms.length > 0 ? (
              <div className="space-y-3">
                {topPrograms.map((program, index) => (
                  <div key={program.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm truncate max-w-[150px]" title={program.name}>
                        {program.name}
                      </span>
                    </div>
                    <span className="font-medium">{program.applications} apps</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Countries Chart</CardTitle>
          </CardHeader>
          <CardContent>
            {topCountries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCountries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-16">No data to display</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Agents Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {topAgents.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topAgents}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.applications}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="applications"
                  >
                    {topAgents.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-16">No data to display</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
