"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  Filter,
  Search,
  Download,
  Plus,
  Save,
  Edit3,
  Globe,
  Heart,
  Sparkles,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogAnalytics } from "@/components/blog/BlogAnalytics";
import { BlogPreview } from "@/components/blog/BlogPreview";
import { useAuth } from "@/hooks/useAuth";

const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createUniqueId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
};

const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

type BlogStatus = "draft" | "published";

interface AuthorInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  status: BlogStatus;
  featured: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  views_count: number | null;
  likes_count: number | null;
  tenant_id?: string;
  author?: AuthorInfo | null;
}

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  content_md: string;
  content_html: string;
  status: BlogStatus;
  featured: boolean;
  tags: string;
  seo_title: string;
  seo_description: string;
}

const createInitialFormState = (): BlogFormState => ({
  title: "",
  slug: "",
  excerpt: "",
  cover_image_url: "",
  content_md: "",
  content_html: "",
  status: "draft",
  featured: false,
  tags: "",
  seo_title: "",
  seo_description: "",
});

export default function BlogAdmin() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  const tenantId = profile?.tenant_id ?? "00000000-0000-0000-0000-000000000001";
  const [activeTab, setActiveTab] = useState<"list" | "analytics" | "edit">(
    "list",
  );
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogFormState>(createInitialFormState);
  const [preview, setPreview] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BlogStatus>("all");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          `id, title, slug, excerpt, content_md, content_html, cover_image_url, tags, status, featured, seo_title, seo_description, published_at, created_at, updated_at, views_count, likes_count, tenant_id, author:profiles(id, full_name, avatar_url)`,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((post) => ({
        ...post,
        status: (post.status as BlogStatus) ?? "draft",
        featured: Boolean(post.featured),
      }));
    },
  });

  useEffect(() => {
    if (!posts.length) {
      setSelectedPosts([]);
      return;
    }

    setSelectedPosts((prev) =>
      prev.filter((id) => posts.some((post) => post.id === id)),
    );
  }, [posts]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Unable to delete post",
      ),
  });

  const executeDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId);
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} posts deleted`);
      setSelectedPosts([]);
      setShowBulkActions(false);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Bulk delete failed",
      ),
  });

  const handleBulkDelete = () => {
    if (selectedPosts.length > 0) bulkDeleteMutation.mutate(selectedPosts);
  };

  const bulkStatusMutation = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: BlogStatus;
    }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status,
          published_at:
            status === "published" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.ids.length} posts updated`);
      setSelectedPosts([]);
      setShowBulkActions(false);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "Bulk update failed",
      ),
  });

  const handleBulkStatusChange = (status: BlogStatus) => {
    if (selectedPosts.length > 0) {
      bulkStatusMutation.mutate({ ids: selectedPosts, status });
    }
  };

  const clearSelection = () => setSelectedPosts([]);

  const filteredPosts = useMemo(() => {
    if (!posts.length) return [];

    const term = searchTerm.trim().toLowerCase();
    const filteredByStatus =
      statusFilter === "all"
        ? posts
        : posts.filter((post) => post.status === statusFilter);

    if (!term) return filteredByStatus;

    return filteredByStatus.filter((post) => {
      const values = [post.title, post.slug, post.excerpt, ...(post.tags ?? [])]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return values.some((value) => value.includes(term));
    });
  }, [posts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!posts.length) return { total: 0, published: 0, drafts: 0 };

    const published = posts.filter(
      (post) => post.status === "published",
    ).length;
    const drafts = posts.filter((post) => post.status === "draft").length;

    return { total: posts.length, published, drafts };
  }, [posts]);

  const isAllFilteredSelected =
    filteredPosts.length > 0 &&
    filteredPosts.every((post) => selectedPosts.includes(post.id));
  const someFilteredSelected =
    filteredPosts.some((post) => selectedPosts.includes(post.id)) &&
    !isAllFilteredSelected;

  const handleToggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const filteredIds = filteredPosts.map((post) => post.id);
      setSelectedPosts((prev) =>
        Array.from(new Set([...prev, ...filteredIds])),
      );
    } else if (checked === false) {
      const filteredIds = new Set(filteredPosts.map((post) => post.id));
      setSelectedPosts((prev) => prev.filter((id) => !filteredIds.has(id)));
    }
  };

  const toggleSelection = (id: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedPosts((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else if (checked === false) {
      setSelectedPosts((prev) => prev.filter((postId) => postId !== id));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleGenerateCoverImage = async () => {
    if (!form.title.trim()) {
      toast.error("Add a compelling title before generating an image.");
      return;
    }

    setIsGeneratingImage(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-blog-image",
        {
          body: {
            title: form.title,
            excerpt: form.excerpt,
            tags: form.tags,
          },
        },
      );

      if (error) {
        throw new Error(
          error.message || "Unable to generate image with Gemini.",
        );
      }

      const imagePayload = data ?? {};
      const imageBase64 =
        imagePayload.imageBase64 ||
        imagePayload.imageData ||
        imagePayload.base64 ||
        imagePayload.image;
      const mimeType =
        imagePayload.mimeType || imagePayload.contentType || "image/png";

      if (!imageBase64) {
        throw new Error(
          "Gemini did not return an image. Try again with a more descriptive title.",
        );
      }

      const blob = base64ToBlob(imageBase64, mimeType);
      const safeSlug = generateSlug(form.title || "blog-post");
      const extension = mimeType.split("/")[1] ?? "png";
      const filePath = `blog/${safeSlug}-${createUniqueId()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("public")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData, error: urlError } = supabase.storage
        .from("public")
        .getPublicUrl(filePath);

      if (urlError || !urlData?.publicUrl) {
        throw new Error(
          urlError?.message ??
            "Unable to resolve public URL for the generated image.",
        );
      }

      setForm((prev) => ({ ...prev, cover_image_url: urlData.publicUrl }));
      toast.success("Gemini image generated and applied.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate image";
      toast.error(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      excerpt: post.excerpt ?? "",
      cover_image_url: post.cover_image_url ?? "",
      content_md: post.content_md ?? "",
      content_html: post.content_html ?? "",
      status: post.status ?? "draft",
      featured: Boolean(post.featured),
      tags: post.tags?.join(", ") ?? "",
      seo_title: post.seo_title ?? "",
      seo_description: post.seo_description ?? "",
    });
    setActiveTab("edit");
  };

  const resetForm = () => {
    setEditing(null);
    setForm(createInitialFormState());
  };

  const handlePreviewDraft = () => {
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    setPreview({
      id: editing?.id ?? "draft-preview",
      title: form.title || "Untitled Post",
      slug: form.slug || generateSlug(form.title || "draft"),
      excerpt: form.excerpt || null,
      content_md: form.content_md || null,
      content_html: form.content_html || null,
      cover_image_url: form.cover_image_url || null,
      tags,
      status: form.status,
      featured: form.featured,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      published_at: editing?.published_at ?? null,
      created_at: editing?.created_at ?? new Date().toISOString(),
      updated_at: editing?.updated_at ?? new Date().toISOString(),
      views_count: editing?.views_count ?? 0,
      likes_count: editing?.likes_count ?? 0,
      author: editing?.author ?? null,
      tenant_id: tenantId,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: BlogFormState) => {
      if (!user?.id) {
        throw new Error("You need to be signed in to manage posts");
      }

      if (!values.title.trim()) {
        throw new Error("Title is required");
      }

      const slugCandidate = values.slug.trim() || values.title;
      const normalizedSlug = generateSlug(slugCandidate);

      if (!normalizedSlug) {
        throw new Error("Slug is required");
      }

      const sanitizedHtml = values.content_html
        ? DOMPurify.sanitize(values.content_html)
        : null;

      const tags = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        title: values.title.trim(),
        slug: normalizedSlug,
        excerpt: values.excerpt.trim() || null,
        cover_image_url: values.cover_image_url.trim() || null,
        content_md: values.content_md.trim() || null,
        content_html: sanitizedHtml,
        status: values.status,
        featured: values.featured,
        tags: tags.length ? tags : null,
        seo_title: values.seo_title.trim() || null,
        seo_description: values.seo_description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const nextPublishedAt =
          values.status === "published"
            ? (editing.published_at ?? new Date().toISOString())
            : null;

        const { error } = await supabase
          .from("blog_posts")
          .update({
            ...payload,
            published_at: nextPublishedAt,
          })
          .eq("id", editing.id);

        if (error) throw error;

        return "updated" as const;
      }

      const { error } = await supabase.from("blog_posts").insert({
        ...payload,
        author_id: user.id,
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        published_at:
          values.status === "published" ? new Date().toISOString() : null,
      });

      if (error) throw error;

      return "created" as const;
    },
    onSuccess: (result) => {
      toast.success(result === "updated" ? "Post updated" : "Post created");
      resetForm();
      setActiveTab("list");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to save post",
      );
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate(form);
  };

  const handleNewPost = () => {
    resetForm();
    setActiveTab("edit");
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:mx-auto lg:max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Manage Blog Posts</CardTitle>
          <CardDescription>View, edit, and manage all posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="Search posts... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | BlogStatus)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(true)}
                disabled={selectedPosts.length === 0}
                className="w-full sm:w-auto"
              >
                <Filter className="mr-2 h-4 w-4" /> Bulk Actions
              </Button>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
              {selectedPosts.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedPosts.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </>
              )}
              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <span>Total: {stats.total}</span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle className="h-3 w-3" /> {stats.published}
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <Edit3 className="h-3 w-3" /> {stats.drafts}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:hidden">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />{" "}
                  {stats.published} published
                </div>
                <div className="flex items-center gap-1">
                  <Edit3 className="h-3 w-3 text-amber-500" /> {stats.drafts}{" "}
                  drafts
                </div>
                <div className="col-span-2 text-muted-foreground">
                  Total posts: {stats.total}
                </div>
              </div>
              <Button
                onClick={handleNewPost}
                size="sm"
                className="w-full gap-2 sm:w-auto"
              >
                <Plus className="h-4 w-4" /> New Post
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => toast.info("Export coming soon!")}
              >
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "list" | "analytics" | "edit")
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">All Posts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="edit">Create/Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No posts found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or create a new post to get
                      started.
                    </p>
                  </div>
                  <Button onClick={handleNewPost} className="gap-2">
                    <Plus className="h-4 w-4" /> Create your first post
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 p-4 md:hidden">
                    {filteredPosts.map((post) => {
                      const createdAt = post.created_at
                        ? new Date(post.created_at)
                        : null;
                      const updatedAt = post.updated_at
                        ? new Date(post.updated_at)
                        : createdAt;

                      return (
                        <div
                          key={post.id}
                          className="space-y-4 rounded-xl border bg-card p-4 shadow-sm transition hover:border-primary/50"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              className="mt-1"
                              checked={selectedPosts.includes(post.id)}
                              onCheckedChange={(checked) =>
                                toggleSelection(post.id, checked)
                              }
                              aria-label={`Select ${post.title}`}
                            />
                            <div className="flex w-full gap-3">
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                {post.cover_image_url ? (
                                  <img
                                    src={post.cover_image_url}
                                    alt={post.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-semibold leading-tight">
                                    {post.title}
                                  </p>
                                  {post.featured && (
                                    <Badge variant="outline">Featured</Badge>
                                  )}
                                </div>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {post.excerpt}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span>/blog/{post.slug}</span>
                                  {post.author && (
                                    <span className="flex items-center gap-1">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={
                                            post.author.avatar_url ?? undefined
                                          }
                                          alt={post.author.full_name ?? ""}
                                        />
                                        <AvatarFallback>
                                          {post.author.full_name
                                            ?.slice(0, 2)
                                            .toUpperCase() ?? "AU"}
                                        </AvatarFallback>
                                      </Avatar>
                                      {post.author.full_name ?? "Unknown"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant={
                                post.status === "published"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {post.status}
                            </Badge>
                            <span>
                              {updatedAt ? format(updatedAt, "PP") : "—"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(post.tags ?? []).slice(0, 4).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {(post.tags?.length ?? 0) > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{(post.tags?.length ?? 0) - 4}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />{" "}
                              {post.views_count ?? 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />{" "}
                              {post.likes_count ?? 0} likes
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setPreview(post)}
                              className="w-full gap-1 sm:w-auto"
                            >
                              <Eye className="h-4 w-4" /> Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPost(post)}
                              className="w-full gap-1 sm:w-auto"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full gap-1 text-destructive sm:w-auto"
                              onClick={() => setDeleteId(post.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[860px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">
                              <Checkbox
                                checked={
                                  isAllFilteredSelected
                                    ? true
                                    : someFilteredSelected
                                      ? "indeterminate"
                                      : false
                                }
                                onCheckedChange={handleToggleSelectAll}
                                aria-label="Select all posts"
                              />
                            </TableHead>
                            <TableHead>Post</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Metrics</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPosts.map((post) => {
                            const createdAt = post.created_at
                              ? new Date(post.created_at)
                              : null;
                            const updatedAt = post.updated_at
                              ? new Date(post.updated_at)
                              : createdAt;

                            return (
                              <TableRow
                                key={post.id}
                                className="hover:bg-muted/40"
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedPosts.includes(post.id)}
                                    onCheckedChange={(checked) =>
                                      toggleSelection(post.id, checked)
                                    }
                                    aria-label={`Select ${post.title}`}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-start gap-3">
                                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border">
                                      {post.cover_image_url ? (
                                        <img
                                          src={post.cover_image_url}
                                          alt={post.title}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-muted">
                                          <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold leading-tight">
                                          {post.title}
                                        </p>
                                        {post.featured && (
                                          <Badge variant="outline">
                                            Featured
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {post.excerpt}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span>/blog/{post.slug}</span>
                                        {post.author && (
                                          <span className="flex items-center gap-1">
                                            <Avatar className="h-5 w-5">
                                              <AvatarImage
                                                src={
                                                  post.author.avatar_url ??
                                                  undefined
                                                }
                                                alt={
                                                  post.author.full_name ?? ""
                                                }
                                              />
                                              <AvatarFallback>
                                                {post.author.full_name
                                                  ?.slice(0, 2)
                                                  .toUpperCase() ?? "AU"}
                                              </AvatarFallback>
                                            </Avatar>
                                            {post.author.full_name ?? "Unknown"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-2">
                                    <Badge
                                      variant={
                                        post.status === "published"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="w-fit capitalize"
                                    >
                                      {post.status}
                                    </Badge>
                                    {post.published_at && (
                                      <span className="text-xs text-muted-foreground">
                                        Published{" "}
                                        {format(
                                          new Date(post.published_at),
                                          "PP",
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {(post.tags ?? [])
                                      .slice(0, 4)
                                      .map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    {(post.tags?.length ?? 0) > 4 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +{(post.tags?.length ?? 0) - 4}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />{" "}
                                      {post.views_count ?? 0} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />{" "}
                                      {post.likes_count ?? 0} likes
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {updatedAt ? format(updatedAt, "PP") : "—"}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setPreview(post)}
                                      className="gap-1"
                                    >
                                      <Eye className="h-4 w-4" /> Preview
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditPost(post)}
                                      className="gap-1"
                                    >
                                      <Pencil className="h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="gap-1 text-destructive"
                                      onClick={() => setDeleteId(post.id)}
                                    >
                                      <Trash2 className="h-4 w-4" /> Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            {filteredPosts.length > 0 && !isLoading && (
              <CardFooter className="flex items-center justify-between border-t bg-muted/30 py-3 text-sm text-muted-foreground">
                <span>
                  Showing {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "post" : "posts"}
                </span>
                <span>{selectedPosts.length} selected</span>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <BlogAnalytics />
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <CardHeader>
                <CardTitle>
                  {editing ? "Edit Post" : "Create New Post"}
                </CardTitle>
                <CardDescription>
                  {editing
                    ? "Update post content, settings, and SEO metadata."
                    : "Compose a new article for the Global Education Gateway blog."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Enter post title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="slug"
                          value={form.slug}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              slug: event.target.value,
                            }))
                          }
                          placeholder="optimized-post-title"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              slug: generateSlug(prev.title || prev.slug || ""),
                            }))
                          }
                        >
                          Auto
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        https://globaltalentgateway.net/blog/
                        {form.slug || "your-slug"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        rows={4}
                        maxLength={320}
                        value={form.excerpt}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            excerpt: event.target.value,
                          }))
                        }
                        placeholder="Short summary used on listings and previews"
                      />
                      <div className="text-xs text-muted-foreground">
                        {form.excerpt.length} / 320 characters
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Label htmlFor="cover-image">Cover image URL</Label>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full gap-2 sm:w-fit"
                          onClick={handleGenerateCoverImage}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" /> Generate with
                              Gemini
                            </>
                          )}
                        </Button>
                      </div>
                      <Input
                        id="cover-image"
                        value={form.cover_image_url}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            cover_image_url: event.target.value,
                          }))
                        }
                        placeholder="https://images.unsplash.com/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste a custom URL or let Gemini craft a relevant,
                        on-brand cover image instantly.
                      </p>
                      {form.cover_image_url && (
                        <div className="overflow-hidden rounded-md border">
                          <img
                            src={form.cover_image_url}
                            alt="Cover preview"
                            className="h-40 w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value: BlogStatus) =>
                          setForm((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Label className="text-sm font-medium">
                          Featured Post
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Highlight this article across the blog and dashboard
                          surfaces.
                        </p>
                      </div>
                      <Switch
                        checked={form.featured}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            featured: Boolean(checked),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={form.tags}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            tags: event.target.value,
                          }))
                        }
                        placeholder="admissions, visas, scholarships"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate with commas. 3-5 focused keywords recommended.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo-title">SEO Title</Label>
                      <Input
                        id="seo-title"
                        value={form.seo_title}
                        maxLength={70}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            seo_title: event.target.value,
                          }))
                        }
                        placeholder="Optimized title for search results"
                      />
                      <div className="text-xs text-muted-foreground">
                        {form.seo_title.length} / 70 characters
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo-description">SEO Description</Label>
                      <Textarea
                        id="seo-description"
                        rows={4}
                        maxLength={170}
                        value={form.seo_description}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            seo_description: event.target.value,
                          }))
                        }
                        placeholder="Meta description shown in search results"
                      />
                      <div className="text-xs text-muted-foreground">
                        {form.seo_description.length} / 170 characters
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-md">Markdown Content</Label>
                    <Textarea
                      id="content-md"
                      rows={12}
                      value={form.content_md}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          content_md: event.target.value,
                        }))
                      }
                      className="font-mono"
                      placeholder="# Heading\n\nStart writing your post in markdown..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content-html">
                      HTML Override (optional)
                    </Label>
                    <Textarea
                      id="content-html"
                      rows={10}
                      value={form.content_html}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          content_html: event.target.value,
                        }))
                      }
                      className="font-mono"
                      placeholder="<section>Custom layout or embeds...</section>"
                    />
                    <p className="text-xs text-muted-foreground">
                      When provided, HTML will override the markdown output. We
                      sanitize content automatically.
                    </p>
                  </div>
                  <div className="rounded-md border p-4 text-sm text-muted-foreground">
                    <p className="font-medium">Markdown formatting tips</p>
                    <p>
                      Use standard markdown for headings, emphasis, lists, and
                      quotes. Embed images with
                      <code className="mx-1">![]()</code> syntax or switch to
                      HTML for advanced layouts.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap justify-between gap-2 border-t bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span>
                    Last step: preview your article before publishing to ensure
                    formatting looks perfect across the site.
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviewDraft}
                  >
                    Preview Draft
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      resetForm();
                      setActiveTab("list");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" /> {editing ? "Update" : "Create"}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedPosts.length} selected posts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => handleBulkStatusChange("published")}
              className="w-full"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Publish Selected
            </Button>
            <Button
              onClick={() => handleBulkStatusChange("draft")}
              className="w-full"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Move to Draft
            </Button>
            <Separator />
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActions(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {preview && (
        <BlogPreview
          post={preview}
          open={!!preview}
          onOpenChange={() => setPreview(null)}
        />
      )}
    </div>
  );
}
