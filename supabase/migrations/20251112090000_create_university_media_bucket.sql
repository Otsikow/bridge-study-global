-- Storage bucket for university profile media (logos, hero banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'university-media',
  'university-media',
  true,
  10485760, -- 10MB limit to support hero images
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access so assets render on marketing pages
CREATE POLICY "Public read access for university media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'university-media');

-- Partner university users can manage assets inside their tenant folder
CREATE POLICY "University tenants can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'university-media'
    AND (
      (storage.foldername(name))[1] = get_user_tenant(auth.uid())::text
      OR is_admin_or_staff(auth.uid())
    )
  );

CREATE POLICY "University tenants can update media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'university-media'
    AND (
      (storage.foldername(name))[1] = get_user_tenant(auth.uid())::text
      OR is_admin_or_staff(auth.uid())
    )
  );

CREATE POLICY "University tenants can delete media"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'university-media'
    AND (
      (storage.foldername(name))[1] = get_user_tenant(auth.uid())::text
      OR is_admin_or_staff(auth.uid())
    )
  );
