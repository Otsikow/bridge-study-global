import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Eye, Save, Globe, Search, ToggleLeft, ToggleRight } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [autoSlug, setAutoSlug] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [search, setSearch] = useState<string>("");

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

  const filtered = useMemo(() => {
    let posts = data ?? [];
    if (statusFilter !== "all") {
      posts = posts.filter((p) => p.status === statusFilter);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      posts = posts.filter((p) =>
        [p.title, p.slug, p.excerpt, ...(p.tags || [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    }
    return posts;
  }, [data, statusFilter, search]);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}+/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const computeHtmlFromMarkdown = (md?: string | null) => {
    if (!md) return null;
    const raw = marked.parse(md);
    // marked.parse can return string | Promise<string> depending on options; enforce string
    const html = typeof raw === "string" ? raw : "";
    return DOMPurify.sanitize(html);
  };

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<BlogPost>) => {
      if (!profile) throw new Error("Not authenticated");
      // Determine published_at transitions
      const oldStatus = editing?.status;
      let publishedAt: string | null = editing?.published_at ?? null;
      const newStatus = payload.status ?? editing?.status ?? "draft";
      if (!editing && newStatus === "published") {
        publishedAt = new Date().toISOString();
      } else if (editing && oldStatus !== newStatus) {
        if (oldStatus === "draft" && newStatus === "published") {
          publishedAt = new Date().toISOString();
        } else if (oldStatus === "published" && newStatus === "draft") {
          publishedAt = null;
        }
      }

      const content_md = payload.content_md ?? editing?.content_md ?? null;
      const content_html = (payload.content_html ?? editing?.content_html ?? null) || computeHtmlFromMarkdown(content_md);

      const base = {
        tenant_id: profile.tenant_id,
        author_id: profile.id,
        slug: payload.slug!,
        title: payload.title!,
        excerpt: payload.excerpt ?? null,
        content_md,
        content_html,
        cover_image_url: payload.cover_image_url ?? null,
        tags: payload.tags ?? [],
        status: newStatus,
        featured: payload.featured ?? false,
        seo_title: payload.seo_title ?? null,
        seo_description: payload.seo_description ?? null,
        published_at: publishedAt,
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
    setAutoSlug(true);
  };

  const startEdit = (p: BlogPost) => {
    setEditing(p);
    setForm(p);
    setAutoSlug(false);
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

  const handleTitleChange = (value: string) => {
    setForm((f) => ({ ...f, title: value, slug: autoSlug || !f.slug ? slugify(value) : f.slug }));
  };

  const quickToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const published_at = newStatus === "published" ? new Date().toISOString() : null;
    const { error } = await supabase
      .from("blog_posts")
      .update({ status: newStatus, published_at })
      .eq("id", post.id);
    if (error) {
      toast.error(String(error.message || error));
    } else {
      toast.success(newStatus === "published" ? "Published" : "Unpublished");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!profile) return;
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/${Date.now()}-cover.${ext}`;
    const { error: uploadError } = await supabase.storage.from("public").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }
    const { data: urlData } = supabase.storage.from("public").getPublicUrl(path);
    if (urlData?.publicUrl) {
      setForm((f) => ({ ...f, cover_image_url: urlData.publicUrl }));
      toast.success("Cover image uploaded");
    }
  };

  if (!profile || !["admin", "staff"].includes(profile.role)) {
    return <div className="container mx-auto px-4 py-10">Access denied.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and publish articles for your tenant.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="w-56"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={startCreate} variant="default">
            <Plus className="h-4 w-4 mr-1" /> New post
          </Button>
        </div>
      </div>

      <Tabs defaultValue={editing ? "edit" : "list"} value={editing ? "edit" : "list"}>
        <TabsList>
          <TabsTrigger value="list">All posts</TabsTrigger>
          <TabsTrigger value="edit">Editor</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <div className="grid gap-4">
            {isLoading && <div>Loading…</div>}
            {filtered.map((p) => (
              <Card key={p.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">
                    {p.title} <span className="text-xs text-muted-foreground">/ {p.slug}</span>
                  </CardTitle>
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
                  <Button size="sm" variant="secondary" onClick={() => quickToggleStatus(p)}>
                    {p.status === "published" ? (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1" /> Unpublish
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1" /> Publish
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the post "{p.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(p.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
                  <Input id="title" value={form.title ?? ""} onChange={(e) => handleTitleChange(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={autoSlug} onCheckedChange={setAutoSlug} />
                    <span>Auto-generate slug from title</span>
                  </div>
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
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleCoverUpload(file);
                      }}
                    />
                  </div>
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
                <div className="flex items-center gap-3 mt-6">
                  <Label htmlFor="featured">Featured</Label>
                  <Switch id="featured" checked={form.featured ?? false} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                </div>
              </div>
              <Tabs defaultValue="write" className="w-full">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="content_md">Content (Markdown)</Label>
                    <Textarea id="content_md" rows={12} value={form.content_md ?? ""} onChange={(e) => setForm({ ...form, content_md: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="content_html">Content (HTML - optional)</Label>
                    <Textarea id="content_html" rows={12} value={form.content_html ?? ""} onChange={(e) => setForm({ ...form, content_html: e.target.value })} />
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <div className="prose prose-neutral dark:prose-invert max-w-none border rounded-md p-4">
                    {(() => {
                      const previewHtml = (form.content_html && DOMPurify.sanitize(form.content_html)) || computeHtmlFromMarkdown(form.content_md);
                      if (!previewHtml) return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
                      return <div dangerouslySetInnerHTML={{ __html: previewHtml }} />;
                    })()}
                  </div>
                </TabsContent>
              </Tabs>
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
              {/* SEO preview */}
              <div className="mt-2 border rounded-md p-4 bg-muted/50">
                <div className="text-xs text-muted-foreground">Preview</div>
                <div className="mt-1 text-sm text-blue-600">yourdomain.com/blog/{form.slug || "slug"}</div>
                <div className="font-medium">{form.seo_title || form.title || "Article title"}</div>
                <div className="text-muted-foreground line-clamp-2">{form.seo_description || form.excerpt || "A short description that appears in search results."}</div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="secondary" onClick={() => { setForm((f) => ({ ...f, status: "draft" })); save(); }} disabled={upsertMutation.isPending}>
                <Save className="h-4 w-4 mr-1" /> Save draft
              </Button>
              <Button onClick={() => { setForm((f) => ({ ...f, status: "published" })); save(); }} disabled={upsertMutation.isPending}>
                <Globe className="h-4 w-4 mr-1" /> Publish
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
