import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface BlogPost {
  id: string;
  tenant_id: string;
  author_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  cover_image_url: string | null;
  tags: string[];
  status: "draft" | "published";
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
}

export default function BlogAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<Partial<BlogPost>>({ status: "draft", tags: [] });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<BlogPost>) => {
      if (!profile) throw new Error("Not authenticated");
      const base = {
        tenant_id: profile.tenant_id,
        author_id: profile.id,
        slug: payload.slug!,
        title: payload.title!,
        excerpt: payload.excerpt ?? null,
        content_md: payload.content_md ?? null,
        content_html: payload.content_html ?? null,
        cover_image_url: payload.cover_image_url ?? null,
        tags: payload.tags ?? [],
        status: payload.status ?? "draft",
        featured: payload.featured ?? false,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        published_at: payload.status === "published" ? new Date().toISOString() : null,
      };
      if (payload.id) {
        const { error } = await supabase.from("blog_posts").update(base).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(base);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      setForm({ status: "draft", tags: [] });
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: unknown) => toast.error(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: unknown) => toast.error(String(e)),
  });

  const startCreate = () => {
    setEditing(null);
    setForm({ status: "draft", tags: [] });
  };

  const startEdit = (p: BlogPost) => {
    setEditing(p);
    setForm(p);
  };

  const save = () => {
    if (!form.slug || !form.title) {
      toast.error("Slug and title are required");
      return;
    }
    upsertMutation.mutate(form);
  };

  const remove = (id: string) => deleteMutation.mutate(id);

  const updateTagInput = (value: string) => {
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setForm((f) => ({ ...f, tags }));
  };

  if (!profile || !["admin", "staff"].includes(profile.role)) {
    return <div className="container mx-auto px-4 py-10">Access denied.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Blog Management</h1>
        <Button onClick={startCreate} variant="default">
          <Plus className="h-4 w-4 mr-1" /> New post
        </Button>
      </div>

      <Tabs defaultValue={editing ? "edit" : "list"} value={editing ? "edit" : "list"}>
        <TabsList>
          <TabsTrigger value="list">All posts</TabsTrigger>
          <TabsTrigger value="edit">Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <div className="grid gap-4">
            {isLoading && <div>Loading…</div>}
            {data?.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{p.title} <span className="text-xs text-muted-foreground">/ {p.slug}</span></CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                    {p.featured && <Badge>Featured</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {(p.tags || []).map((t) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="edit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Edit post" : "Create post"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" rows={3} value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="cover">Cover image URL</Label>
                  <Input id="cover" value={form.cover_image_url ?? ""} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" value={(form.tags ?? []).join(", ")} onChange={(e) => updateTagInput(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status ?? "draft"} onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="featured">Featured</Label>
                  <input id="featured" type="checkbox" checked={form.featured ?? false} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                </div>
              </div>
              <div>
                <Label htmlFor="content_md">Content (Markdown)</Label>
                <Textarea id="content_md" rows={12} value={form.content_md ?? ""} onChange={(e) => setForm({ ...form, content_md: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="content_html">Content (HTML - optional)</Label>
                <Textarea id="content_html" rows={12} value={form.content_html ?? ""} onChange={(e) => setForm({ ...form, content_html: e.target.value })} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="seo_title">SEO title</Label>
                  <Input id="seo_title" value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO description</Label>
                  <Input id="seo_description" value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={upsertMutation.isPending}>Save</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
