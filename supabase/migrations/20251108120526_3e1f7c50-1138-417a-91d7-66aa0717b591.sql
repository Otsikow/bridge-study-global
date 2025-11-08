-- Add missing columns to universities table
ALTER TABLE universities ADD COLUMN IF NOT EXISTS featured_image_url text;

-- Create is_username_available function
CREATE OR REPLACE FUNCTION is_username_available(candidate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = candidate
  );
END;
$$;

-- Create search_agent_contacts function
CREATE OR REPLACE FUNCTION search_agent_contacts(search_query text)
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url
  FROM profiles p
  WHERE 
    p.role = 'agent' AND
    (
      p.full_name ILIKE '%' || search_query || '%' OR
      p.email ILIKE '%' || search_query || '%'
    )
  ORDER BY p.full_name
  LIMIT 20;
END;
$$;