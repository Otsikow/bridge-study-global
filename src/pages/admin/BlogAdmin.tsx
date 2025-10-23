"use client";

import { useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Input, Textarea, Button, Label, Badge, Switch, Separator,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogAction, AlertDialogCancel, Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui";
import {
  Eye, Star, FileText, Pencil, Trash2, CheckCircle, Filter,
  Clock, TrendingUp, ImageIcon, Plus, X, Save, Settings, Link2,
  Copy, ExternalLink, MoreHorizontal, Calendar, Globe, CheckCircle2, Edit3, Download
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import BlogAnalytics from "@/components/blog/BlogAnalytics";
import BlogPreview from "@/components/blog/BlogPreview";
import { generateSlug } from "@/lib/utils";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [preview, setPreview] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const qc = useQueryClient();

  // --- Delete post mutation
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
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  const executeDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId);
  };

  // --- Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("blog_posts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedPosts.length} posts deleted successfully`);
      setSelectedPosts([]);
      setShowBulkActions(false);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  const handleBulkDelete = () => {
    if (selectedPosts.length > 0) bulkDeleteMutation.mutate(selectedPosts);
  };

  // --- Bulk status update
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: "draft" | "published" }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          status,
          published_at: status === "published" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedPosts.length} posts updated successfully`);
      setSelectedPosts([]);
      setShowBulkActions(false);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });

  const handleBulkStatusChange = (status: "draft" | "published") => {
    if (selectedPosts.length > 0) bulkStatusMutation.mutate({ ids: selectedPosts, status });
  };

  const clearSelection = () => setSelectedPosts([]);

  // --- Render
  return (
    <div className="space-y-6 p-6">
      {/* Header + Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Blog Posts</CardTitle>
          <CardDescription>View, edit, and manage all posts</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedPosts.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedPosts.length} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => toast.info("Export coming soon!")}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="list" value="list">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">All Posts ({filteredPosts.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="edit">{editing ? "Edit Post" : "Create Post"}</TabsTrigger>
        </TabsList>

        {/* Posts Table */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <p className="text-center text-muted-foreground p-8">
                Posts list placeholder (table grid here)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <BlogAnalytics />
        </TabsContent>

        {/* Editor */}
        <TabsContent value="edit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Edit Post" : "Create New Post"}</CardTitle>
              <CardDescription>
                {editing ? "Modify your existing post" : "Compose a new blog post"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter post title"
              />
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={form.excerpt ?? ""}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
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
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                {editing ? "Update" : "Create"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions */}
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
              <CheckCircle className="h-4 w-4 mr-2" /> Publish Selected
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusChange("draft")}
              disabled={bulkStatusMutation.isPending}
              className="w-full"
            >
              <Edit3 className="h-4 w-4 mr-2" /> Move to Draft
            </Button>
            <Separator />
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
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
