-- Blog schema and policies
create extension if not exists "pgcrypto";

-- Enum for post status
DO $$ BEGIN
  CREATE TYPE public.blog_status AS ENUM ('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  content_md text,
  content_html text,
  cover_image_url text,
  tags text[] NOT NULL DEFAULT '{}',
  status public.blog_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  views_count integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0
);

-- Constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_tenant_slug_idx ON public.blog_posts(tenant_id, slug);
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_tags_idx ON public.blog_posts USING GIN (tags);

-- RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published posts
CREATE POLICY IF NOT EXISTS "Public can read published posts"
  ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

-- Allow staff/admin to read all posts in their tenant
CREATE POLICY IF NOT EXISTS "Admin can read all posts in tenant"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
    AND tenant_id = public.get_user_tenant(auth.uid())
  );

-- Allow staff/admin to insert/update/delete within tenant
CREATE POLICY IF NOT EXISTS "Admin can write posts in tenant"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (
    public.is_admin_or_staff(auth.uid())
    AND tenant_id = public.get_user_tenant(auth.uid())
  )
  WITH CHECK (
    public.is_admin_or_staff(auth.uid())
    AND tenant_id = public.get_user_tenant(auth.uid())
  );
