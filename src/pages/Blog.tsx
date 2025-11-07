import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import {
  Search,
  ArrowUpRight,
  GraduationCap,
  Users,
  Globe2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
}

export default function Blog() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["blog", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, cover_image_url, tags, published_at")
        .eq("status", "published")
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((p) =>
      [p.title, p.excerpt, ...(p.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [data, q]);

  const featuredCollections = [
    {
      title: "International Student Playbook",
      description:
        "Step-by-step guidance to research universities, prepare documents, and submit confident applications.",
      icon: GraduationCap,
      cta: { label: "Explore checklist", href: "/student/onboarding" },
      tags: ["Admissions", "Visas", "Scholarships"],
    },
    {
      title: "Agent Success Hub",
      description:
        "Tools, templates, and best practices to manage student pipelines and collaborate with universities.",
      icon: Users,
      cta: { label: "Visit agent dashboard", href: "/dashboard" },
      tags: ["CRM", "Reporting", "Compliance"],
    },
    {
      title: "Partner Resource Centre",
      description:
        "Data-driven insights on student demand, programme positioning, and market expansion strategies.",
      icon: Globe2,
      cta: { label: "See partner guides", href: "/universities" },
      tags: ["Market trends", "Programmes", "Recruitment"],
    },
  ] as const;

  const quickLinks = [
    {
      title: "GEG — Global Education Gateway",
      description:
        "Connecting international students with world-class universities through verified agents and transparent application management.",
      links: [
        { label: "info@globaltalentgateway.net", href: "mailto:info@globaltalentgateway.net", external: true },
        { label: "+1 (202) 555-0148", href: "tel:+12025550148", external: true },
        { label: "Book a discovery call", href: "/contact", external: false },
      ],
    },
    {
      title: "Platform",
      description: "Navigate essential tools for every stage of the recruitment journey.",
      links: [
        { label: "Search Universities", href: "/search", external: false },
        { label: "Help Centre", href: "/help", external: false },
        { label: "Visa Calculator", href: "/visa-calculator", external: false },
      ],
    },
  ] as const;

  return (
    <div className="relative">
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Fresh research, interviews, and platform tips every week
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Insights & Guides</h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Advice for international students, certified agents, and university partners navigating global recruitment.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <div className="relative w-full sm:min-w-[320px] sm:max-w-lg">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  placeholder="Search articles…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/contact">
                  Talk with an expert
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {quickLinks.map((section) => (
            <Card key={section.title} className="h-full border-border/70 bg-card/60 backdrop-blur-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.links.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant="ghost"
                    className="w-full justify-between px-4 py-2 text-left text-sm font-medium"
                  >
                    {link.external ? (
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link to={link.href}>
                        <span>{link.label}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-12" />

        <div className="space-y-6">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-semibold">Featured playbooks</h2>
            <p className="text-sm text-muted-foreground">
              Curated guides that walk you through the most requested workflows on Global Education Gateway.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredCollections.map((collection) => (
              <Card key={collection.title} className="relative overflow-hidden border-border/70">
                <CardHeader className="space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <collection.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{collection.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{collection.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {collection.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full justify-center gap-2" variant="secondary">
                    <Link to={collection.cta.href}>
                      {collection.cta.label}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Latest insights</h2>
              <p className="text-sm text-muted-foreground">
                Fresh perspectives from our research team, admissions experts, and partner network.
              </p>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2 sm:w-auto" asChild>
              <Link to="/blog">
                Browse all articles
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-5 w-24" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <Card key={post.id} className="overflow-hidden border-border/70">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="h-40 w-full bg-muted" />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      <Link to={`/blog/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center gap-2 flex-wrap">
                    {(post.tags || []).slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/70">
              <CardHeader className="items-center space-y-2 text-center">
                <CardTitle className="text-xl">No results yet</CardTitle>
                <CardDescription>
                  We couldn’t find an article that matches “{q}”. Try another keyword or explore our featured playbooks above.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
