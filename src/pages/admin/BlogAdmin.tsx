import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  FileText, 
  TrendingUp, 
  Users,
  Calendar,
  Search,
  Filter,
  LayoutDashboard,
  Settings,
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Link2
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DOMPurify from "dompurify";

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
  created_at: string;
  updated_at: string;
  views_count: number;
  likes_count: number;
}

export default function BlogAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<Partial<BlogPost>>({ status: "draft", tags: [], featured: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "posts" | "editor">("dashboard");

  const { data: posts, isLoading } = useQuery({
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

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!posts) return { total: 0, published: 0, drafts: 0, totalViews: 0, totalLikes: 0 };
    return {
      total: posts.length,
      published: posts.filter(p => p.status === "published").length,
      drafts: posts.filter(p => p.status === "draft").length,
      totalViews: posts.reduce((sum, p) => sum + (p.views_count || 0), 0),
      totalLikes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
    };
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let filtered = posts;
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [posts, statusFilter, searchQuery]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<BlogPost>) => {
      if (!profile) throw new Error("Not authenticated");
      
      // Auto-generate slug from title if not provided
      const slug = payload.slug || payload.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const base = {
        tenant_id: profile.tenant_id,
        author_id: profile.id,
        slug: slug!,
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
        published_at: payload.status === "published" && !payload.published_at ? new Date().toISOString() : payload.published_at,
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
      toast.success(editing ? "Post updated successfully" : "Post created successfully");
      setEditing(null);
      setForm({ status: "draft", tags: [], featured: false });
      setActiveTab("posts");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: unknown) => {
      const error = e as Error;
      toast.error(error.message || "Failed to save post");
    },
  });

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
    onError: (e: unknown) => {
      const error = e as Error;
      toast.error(error.message || "Failed to delete post");
    },
  });

  const startCreate = () => {
    setEditing(null);
    setForm({ status: "draft", tags: [], featured: false });
    setActiveTab("editor");
  };

  const startEdit = (p: BlogPost) => {
    setEditing(p);
    setForm(p);
    setActiveTab("editor");
  };

  const save = () => {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    upsertMutation.mutate(form);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  const updateTagInput = (value: string) => {
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setForm((f) => ({ ...f, tags }));
  };

  const autoGenerateSlug = () => {
    if (form.title) {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setForm((f) => ({ ...f, slug }));
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ status: "draft", tags: [], featured: false });
    setActiveTab("posts");
  };

  if (!profile || !["admin", "staff"].includes(profile.role)) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page. Admin or staff role is required.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Blog Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create, manage, and publish blog posts
              </p>
            </div>
            <Button onClick={startCreate} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="h-4 w-4" />
              All Posts
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <Pencil className="h-4 w-4" />
              Editor
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.published}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{analytics.drafts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalViews}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalLikes}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>Your latest blog posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts?.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4 flex-1">
                        {post.cover_image_url ? (
                          <img 
                            src={post.cover_image_url} 
                            alt="" 
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{post.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">{post.excerpt}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {post.likes_count}
                            </span>
                            <Badge variant={post.status === "published" ? "default" : "secondary"}>
                              {post.status}
                            </Badge>
                            {post.featured && <Badge variant="outline">Featured</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(post)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPreviewPost(post)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              {posts && posts.length > 5 && (
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("posts")}>
                    View All Posts
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* All Posts */}
          <TabsContent value="posts" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts by title, excerpt, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-full md:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(searchQuery || statusFilter !== "all") && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredPosts.length} of {posts?.length || 0} posts
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Posts Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your filters" 
                      : "Get started by creating your first blog post"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={startCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        {post.cover_image_url ? (
                          <img 
                            src={post.cover_image_url} 
                            alt="" 
                            className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-1">{post.title}</h3>
                              <p className="text-sm text-muted-foreground">/{post.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={post.status === "published" ? "default" : "secondary"}>
                                {post.status}
                              </Badge>
                              {post.featured && (
                                <Badge variant="outline" className="gap-1">
                                  <Star className="h-3 w-3" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.excerpt}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 flex-wrap mb-3">
                            {post.tags.slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 5 && (
                              <span className="text-xs text-muted-foreground">
                                +{post.tags.length - 5} more
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.views_count} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                {post.likes_count} likes
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setPreviewPost(post)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => startEdit(post)}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => confirmDelete(post.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Editor */}
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {editing ? "Edit Post" : "Create New Post"}
                    </CardTitle>
                    <CardDescription>
                      {editing ? `Editing: ${editing.title}` : "Write and publish a new blog post"}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-base font-semibold">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Enter post title"
                      value={form.title ?? ""}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="text-lg mt-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="slug" className="text-base font-semibold">
                        URL Slug <span className="text-destructive">*</span>
                      </Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={autoGenerateSlug}
                        disabled={!form.title}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Auto-generate
                      </Button>
                    </div>
                    <Input
                      id="slug"
                      placeholder="post-url-slug"
                      value={form.slug ?? ""}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    />
                    {form.slug && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {window.location.origin}/blog/{form.slug}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="excerpt" className="text-base font-semibold">
                      Excerpt
                    </Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Brief summary of the post (shown in listings)"
                      rows={3}
                      value={form.excerpt ?? ""}
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.excerpt?.length || 0} characters
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Media */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Cover Image</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="cover"
                        placeholder="Image URL"
                        value={form.cover_image_url ?? ""}
                        onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                      />
                    </div>
                    <div>
                      {form.cover_image_url ? (
                        <div className="relative group">
                          <img
                            src={form.cover_image_url}
                            alt="Cover preview"
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setForm({ ...form, cover_image_url: null })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full h-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Content */}
                <div className="space-y-4">
                  <Label htmlFor="content_md" className="text-base font-semibold">
                    Content (Markdown)
                  </Label>
                  <Textarea
                    id="content_md"
                    placeholder="Write your post content in Markdown format..."
                    rows={16}
                    value={form.content_md ?? ""}
                    onChange={(e) => setForm({ ...form, content_md: e.target.value })}
                    className="font-mono text-sm"
                  />
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Markdown formatting help
                    </summary>
                    <div className="mt-2 space-y-1 pl-4">
                      <p># Heading 1, ## Heading 2, ### Heading 3</p>
                      <p>**bold**, *italic*, `code`</p>
                      <p>[link](url), ![image](url)</p>
                      <p>- bullet list, 1. numbered list</p>
                      <p>&gt; blockquote</p>
                    </div>
                  </details>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="content_html" className="text-base font-semibold">
                    Content (HTML) - Optional
                  </Label>
                  <Textarea
                    id="content_html"
                    placeholder="Raw HTML content (overrides Markdown if provided)"
                    rows={8}
                    value={form.content_html ?? ""}
                    onChange={(e) => setForm({ ...form, content_html: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Post Settings</Label>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={form.status ?? "draft"} 
                        onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}
                      >
                        <SelectTrigger id="status" className="mt-2">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Draft
                            </span>
                          </SelectItem>
                          <SelectItem value="published">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Published
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <div className="flex items-center space-x-2 h-10">
                        <Switch
                          id="featured"
                          checked={form.featured ?? false}
                          onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
                        />
                        <Label htmlFor="featured" className="cursor-pointer flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Featured Post
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      placeholder="education, study-abroad, visa, guides"
                      value={(form.tags ?? []).join(", ")}
                      onChange={(e) => updateTagInput(e.target.value)}
                      className="mt-2"
                    />
                    {form.tags && form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* SEO */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    SEO Settings
                  </Label>
                  
                  <div>
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      placeholder="Optimized title for search engines"
                      value={form.seo_title ?? ""}
                      onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.seo_title?.length || 0}/60 characters (recommended)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea
                      id="seo_description"
                      placeholder="Meta description for search results"
                      rows={3}
                      value={form.seo_description ?? ""}
                      onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {form.seo_description?.length || 0}/160 characters (recommended)
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between gap-4 border-t pt-6">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (form.title && form.content_md) {
                        setPreviewPost({
                          ...form,
                          id: editing?.id || "preview",
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          views_count: 0,
                          likes_count: 0,
                        } as BlogPost);
                      } else {
                        toast.error("Add title and content to preview");
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={save} 
                    disabled={upsertMutation.isPending || !form.title?.trim()}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {upsertMutation.isPending ? "Saving..." : editing ? "Update Post" : "Create Post"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              This is how your post will appear to readers
            </DialogDescription>
          </DialogHeader>
          
          {previewPost && (
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              <h1>{previewPost.title}</h1>
              
              {previewPost.excerpt && (
                <p className="lead text-muted-foreground">{previewPost.excerpt}</p>
              )}
              
              {previewPost.tags && previewPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 not-prose my-4">
                  {previewPost.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {previewPost.cover_image_url && (
                <img 
                  src={previewPost.cover_image_url} 
                  alt="" 
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              )}
              
              {previewPost.content_html ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(previewPost.content_html) 
                  }} 
                />
              ) : (
                <pre className="whitespace-pre-wrap bg-muted p-4 rounded">
                  {previewPost.content_md || "No content"}
                </pre>
              )}
            </article>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
