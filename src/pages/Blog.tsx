import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";

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
      [p.title, p.excerpt, ...(p.tags || [])].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [data, q]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Insights & Guides</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Advice for international students, agents, and partners.</p>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[280px] sm:max-w-xs">
          <Input placeholder="Search articles…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
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
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Card key={post.id} className="overflow-hidden">
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
                {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>}
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
      )}
    </div>
  );
}
