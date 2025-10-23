import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Calendar,
  Users,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Download,
  Upload,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Tag,
  Globe,
  Edit3,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ImageUpload } from "@/components/editor/ImageUpload";
import { BlogPreview } from "@/components/blog/BlogPreview";
import { BlogAnalytics } from "@/components/blog/BlogAnalytics";

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
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

interface BlogStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_likes: number;
  recent_posts: number;
}

export default function BlogAdmin() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [preview, setPreview] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<Partial<BlogPost>>({ 
    status: "draft", 
    tags: [], 
    featured: false,
    views_count: 0,
    likes_count: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at" | "published_at" | "title" | "views_count">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            startCreate();
            break;
          case 'k':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch blog posts with author information
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, full_name, avatar_url)
        `)
        .order(sortBy, { ascending: sortOrder === "asc" });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Fetch blog statistics
  const { data: stats } = useQuery({
    queryKey: ["blog-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("status, views_count, likes_count, created_at");
      if (error) throw error;
      
      const total_posts = data.length;
      const published_posts = data.filter(p => p.status === "published").length;
      const draft_posts = data.filter(p => p.status === "draft").length;
      const total_views = data.reduce((sum, p) => sum + (p.views_count || 0), 0);
      const total_likes = data.reduce((sum, p) => sum + (p.likes_count || 0), 0);
      const recent_posts = data.filter(p => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(p.created_at) > weekAgo;
      }).length;

      return {
        total_posts,
        published_posts,
        draft_posts,
        total_views,
        total_likes,
        recent_posts
      } as BlogStats;
    },
  });

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    
    let filtered = posts;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(term) ||
        post.excerpt?.toLowerCase().includes(term) ||
        post.tags.some(tag => tag.toLowerCase().includes(term)) ||
        post.slug.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(post => post.status === statusFilter);
    }
    
    return filtered;
  }, [posts, searchTerm, statusFilter]);

  // Upsert mutation
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
        const { error } = await supabase
          .from("blog_posts")
          .update({ ...base, updated_at: new Date().toISOString() })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert(base);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Post updated successfully" : "Post created successfully");
      setEditing(null);
      setForm({ status: "draft", tags: [], featured: false, views_count: 0, likes_count: 0 });
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-stats"] });
    },
    onError: (e: unknown) => toast.error(String(e)),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-stats"] });
    },
    onError: (e: unknown) => toast.error(String(e)),
  });

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedPosts.length} posts deleted successfully`);
      setSelectedPosts([]);
      setShowBulkActions(false);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-stats"] });
    },
    onError: (e: unknown) => toast.error(String(e)),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[], status: "draft" | "published" }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ 
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedPosts.length} posts updated successfully`);
      setSelectedPosts([]);
      setShowBulkActions(false);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-stats"] });
    },
    onError: (e: unknown) => toast.error(String(e)),
  });

  // Handlers
  const startCreate = () => {
    setEditing(null);
    setForm({ status: "draft", tags: [], featured: false, views_count: 0, likes_count: 0 });
  };

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setForm(post);
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

  const toggleSelection = (id: string) => {
    setSelectedPosts(prev => 
      prev.includes(id) 
        ? prev.filter(postId => postId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedPosts(filteredPosts.map(post => post.id));
  };

  const clearSelection = () => {
    setSelectedPosts([]);
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedPosts);
  };

  const handleBulkStatusChange = (status: "draft" | "published") => {
    bulkStatusMutation.mutate({ ids: selectedPosts, status });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportPosts = () => {
    if (!posts) return;
    
    const csvContent = [
      ['Title', 'Slug', 'Status', 'Views', 'Likes', 'Created', 'Published'].join(','),
      ...posts.map(post => [
        `"${post.title}"`,
        `"${post.slug}"`,
        post.status,
        post.views_count || 0,
        post.likes_count || 0,
        format(new Date(post.created_at), 'yyyy-MM-dd'),
        post.published_at ? format(new Date(post.published_at), 'yyyy-MM-dd') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-posts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Posts exported successfully");
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (!profile || !["admin", "staff"].includes(profile.role)) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
            <p className="text-muted-foreground">Create, edit, and manage your blog posts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.open('/blog', '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Blog
            </Button>
            <Button onClick={startCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        {stats && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{stats.total_posts} total posts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{stats.published_posts} published</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span>{stats.draft_posts} drafts</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{stats.total_views.toLocaleString()} views</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_posts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent_posts} created this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.published_posts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.draft_posts} drafts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time views
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_likes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time likes
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search-input"
                  placeholder="Search posts... (Ctrl+K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                  <SelectItem value="published_at">Published Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="views_count">Views</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedPosts.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedPosts.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkActions(true)}
                  >
                    Bulk Actions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportPosts}
                disabled={!posts || posts.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue={editing ? "edit" : "list"} value={editing ? "edit" : "list"}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">All Posts ({filteredPosts.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="edit">{editing ? "Edit Post" : "Create Post"}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                        onChange={selectedPosts.length === filteredPosts.length ? clearSelection : selectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 w-3/4 bg-muted rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                        <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                          <div>
                            <h3 className="text-lg font-semibold">No posts found</h3>
                            <p className="text-muted-foreground">
                              {searchTerm || statusFilter !== "all" 
                                ? "Try adjusting your search or filters"
                                : "Get started by creating your first blog post"
                              }
                            </p>
                          </div>
                          {!searchTerm && statusFilter === "all" && (
                            <Button onClick={startCreate}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Post
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedPosts.includes(post.id)}
                            onChange={() => toggleSelection(post.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium line-clamp-1">{post.title}</div>
                            <div className="text-sm text-muted-foreground">
                              /{post.slug}
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {post.featured && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {post.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {post.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{post.tags.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.status === "published" ? "default" : "secondary"}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                              {post.author?.full_name?.charAt(0) || "?"}
                            </div>
                            <span className="text-sm">{post.author?.full_name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{post.views_count || 0}</div>
                            <div className="text-muted-foreground">{post.likes_count || 0} likes</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(post.created_at), "MMM d, yyyy")}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(post.created_at), "h:mm a")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => startEdit(post)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPreview(post)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                disabled={post.status !== "published"}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Live
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => copyToClipboard(`/blog/${post.slug}`)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{post.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => remove(post.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <BlogAnalytics />
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editing ? "Edit Post" : "Create New Post"}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreview(form as BlogPost)}
                    disabled={!form.title || !form.content_html}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setForm({ status: "draft", tags: [], featured: false, views_count: 0, likes_count: 0 });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title ?? ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm({ ...form, title });
                      if (!editing || !form.slug) {
                        setForm(prev => ({ ...prev, slug: generateSlug(title) }));
                      }
                    }}
                    placeholder="Enter post title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={form.slug ?? ""}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="post-url-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  rows={3}
                  value={form.excerpt ?? ""}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <ImageUpload
                  value={form.cover_image_url ?? ""}
                  onChange={(url) => setForm({ ...form, cover_image_url: url })}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={(form.tags ?? []).join(", ")}
                  onChange={(e) => updateTagInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-sm text-muted-foreground">
                  Separate tags with commas
                </p>
              </div>

              {/* Status and Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={form.status ?? "draft"} 
                    onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}
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
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={form.featured ?? false}
                    onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
                  />
                  <Label htmlFor="featured">Featured Post</Label>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <Label className="text-base font-medium">SEO Settings</Label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={form.seo_title ?? ""}
                      onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                      placeholder="SEO optimized title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Input
                      id="seo_description"
                      value={form.seo_description ?? ""}
                      onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                      placeholder="Meta description"
                    />
                  </div>
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  value={form.content_html ?? ""}
                  onChange={(html, markdown) => setForm({ ...form, content_html: html, content_md: markdown })}
                  placeholder="Start writing your post..."
                />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setForm({ status: "draft", tags: [], featured: false, views_count: 0, likes_count: 0 });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={upsertMutation.isPending || !form.slug || !form.title}
              >
                {upsertMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editing ? "Update Post" : "Create Post"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Actions Dialog */}
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
              variant="outline"
              onClick={() => handleBulkStatusChange("published")}
              disabled={bulkStatusMutation.isPending}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish Selected
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("draft")}
              disabled={bulkStatusMutation.isPending}
              className="w-full"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Move to Draft
            </Button>
            <Separator />
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActions(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
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