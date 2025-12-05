import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Building2, Globe2, Layers3, GraduationCap, Clock4, Shield, Sparkles } from "lucide-react";

const programs = [
  {
    name: "Computer Science (MSc)",
    university: "Kingsley University",
    country: "United Kingdom",
    discipline: "STEM",
    level: "Postgraduate",
    seats: 45,
    tuition: "$24,800",
    status: "open",
    applications: 162,
    scholarships: "Merit & diversity",
  },
  {
    name: "Global Business (BBA)",
    university: "Northhaven College",
    country: "Canada",
    discipline: "Business",
    level: "Undergraduate",
    seats: 80,
    tuition: "$18,400",
    status: "open",
    applications: 208,
    scholarships: "Dean's list",
  },
  {
    name: "Healthcare Management (MBA)",
    university: "St. Helens Institute",
    country: "Ireland",
    discipline: "Health & Medicine",
    level: "Postgraduate",
    seats: 38,
    tuition: "$21,900",
    status: "paused",
    applications: 74,
    scholarships: "Employer sponsorship",
  },
  {
    name: "Data Analytics (PGDip)",
    university: "Pacific Tech University",
    country: "Australia",
    discipline: "STEM",
    level: "Postgraduate",
    seats: 52,
    tuition: "$20,600",
    status: "open",
    applications: 119,
    scholarships: "STEM excellence",
  },
  {
    name: "International Relations (MA)",
    university: "Baltic School of Policy",
    country: "Netherlands",
    discipline: "Humanities",
    level: "Postgraduate",
    seats: 30,
    tuition: "$17,800",
    status: "closing",
    applications: 67,
    scholarships: "Women in leadership",
  },
];

const overviewStats = [
  { label: "Active programs", value: "312", description: "Verified and listed across campuses" },
  { label: "New this month", value: "27", description: "Awaiting final content checks" },
  { label: "Avg. tuition", value: "$21.4k", description: "Across published programmes" },
  { label: "Yield", value: "28%", description: "Applicants to enrolled" },
];

const readinessChecks = [
  {
    label: "Content readiness",
    value: 92,
    note: "Programme pages reviewed for accuracy and brand tone.",
  },
  {
    label: "Compliance & visas",
    value: 81,
    note: "Eligibility, CAS/LOA timelines, and deposit rules validated.",
  },
  {
    label: "Marketing assets",
    value: 74,
    note: "Brochures, webinar decks, and FAQs updated for this intake.",
  },
];

const AdminPrograms = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programmes</h1>
          <p className="text-sm text-muted-foreground">
            Curate programme inventory, surface top picks for agents, and keep compliance artefacts in sync.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Layers3 className="h-4 w-4" />
            Bulk actions
          </Button>
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            New programme
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Catalogue</CardTitle>
            <CardDescription>Programme performance, intake pacing, and geographic coverage.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 text-sm md:text-right">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock4 className="h-4 w-4" />
              Synchronised nightly with university portals
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Compliance checks enforced for all edits
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs defaultValue="all" className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All programmes</TabsTrigger>
                <TabsTrigger value="stem">STEM</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="health">Health</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="pt-4 text-sm text-muted-foreground">
                End-to-end listing of all active and upcoming intakes across partner universities.
              </TabsContent>
              <TabsContent value="stem" className="pt-4 text-sm text-muted-foreground">
                Computer science, data, engineering, and emerging technology programmes.
              </TabsContent>
              <TabsContent value="business" className="pt-4 text-sm text-muted-foreground">
                Business, finance, and management pathways with internship options.
              </TabsContent>
              <TabsContent value="health" className="pt-4 text-sm text-muted-foreground">
                Health sciences, public health, and clinical pathways.
              </TabsContent>
            </Tabs>
            <div className="flex w-full flex-col gap-2 md:w-80">
              <Input placeholder="Search programmes, universities, or countries" />
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Highlighting programmes with strong graduate outcomes
              </p>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Programme</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Seats</TableHead>
                  <TableHead className="text-right">Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scholarships</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.name}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell className="text-muted-foreground">{program.university}</TableCell>
                    <TableCell className="text-muted-foreground">{program.country}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{program.discipline}</Badge>
                    </TableCell>
                    <TableCell>{program.level}</TableCell>
                    <TableCell className="text-right">{program.seats}</TableCell>
                    <TableCell className="text-right">{program.applications}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          program.status === "open"
                            ? "default"
                            : program.status === "closing"
                              ? "secondary"
                              : "destructive"
                        }
                        className="capitalize"
                      >
                        {program.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{program.scholarships}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quality gates</CardTitle>
            <CardDescription>Pre-launch checklist for new programmes and intake updates.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {["Admissions", "Marketing", "Finance"].map((category, index) => (
              <div key={category} className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  {index === 0 && <GraduationCap className="h-4 w-4 text-primary" />} 
                  {index === 1 && <BookOpen className="h-4 w-4 text-primary" />} 
                  {index === 2 && <Globe2 className="h-4 w-4 text-primary" />} 
                  <p className="text-sm font-semibold">{category}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {index === 0 && "Eligibility, prerequisites, and intake capacity confirmed with registrars."}
                  {index === 1 && "Copy, visuals, and keyword tags aligned to regional campaigns."}
                  {index === 2 && "Tuition, deposits, and agent incentives reconciled with finance."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Readiness checks</CardTitle>
            <CardDescription>Operational confidence for the next intake window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readinessChecks.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} />
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPrograms;
