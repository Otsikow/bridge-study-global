-- Course Discovery RPC Function for Optimized Filtering
-- This function provides efficient searching and filtering of courses/programs

CREATE OR REPLACE FUNCTION search_programs(
  p_tenant_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_countries TEXT[] DEFAULT NULL,
  p_levels TEXT[] DEFAULT NULL,
  p_min_tuition NUMERIC DEFAULT NULL,
  p_max_tuition NUMERIC DEFAULT NULL,
  p_min_duration INTEGER DEFAULT NULL,
  p_max_duration INTEGER DEFAULT NULL,
  p_intake_months INTEGER[] DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'name',
  p_sort_order TEXT DEFAULT 'asc',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  level TEXT,
  discipline TEXT,
  duration_months INTEGER,
  tuition_currency TEXT,
  tuition_amount NUMERIC,
  intake_months INTEGER[],
  ielts_overall NUMERIC,
  toefl_overall INTEGER,
  description TEXT,
  university_id UUID,
  university_name TEXT,
  university_country TEXT,
  university_city TEXT,
  university_logo_url TEXT,
  next_intake_month INTEGER,
  next_intake_year INTEGER,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_programs AS (
    SELECT 
      p.id,
      p.name,
      p.level,
      p.discipline,
      p.duration_months,
      p.tuition_currency,
      p.tuition_amount,
      p.intake_months,
      p.ielts_overall,
      p.toefl_overall,
      p.description,
      u.id as university_id,
      u.name as university_name,
      u.country as university_country,
      u.city as university_city,
      u.logo_url as university_logo_url,
      -- Calculate next available intake
      CASE 
        WHEN p.intake_months IS NOT NULL AND array_length(p.intake_months, 1) > 0 THEN
          (SELECT intake_month FROM unnest(p.intake_months) intake_month 
           WHERE intake_month >= EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER 
           ORDER BY intake_month LIMIT 1)
        ELSE NULL
      END as next_intake_month,
      CASE 
        WHEN p.intake_months IS NOT NULL AND array_length(p.intake_months, 1) > 0 THEN
          CASE 
            WHEN (SELECT intake_month FROM unnest(p.intake_months) intake_month 
                  WHERE intake_month >= EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER 
                  ORDER BY intake_month LIMIT 1) IS NOT NULL 
            THEN EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
            ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1
          END
        ELSE NULL
      END as next_intake_year
    FROM programs p
    INNER JOIN universities u ON p.university_id = u.id
    WHERE p.tenant_id = p_tenant_id
      AND p.active = TRUE
      AND u.active = TRUE
      -- Search filter
      AND (
        p_search_query IS NULL 
        OR p.name ILIKE '%' || p_search_query || '%'
        OR u.name ILIKE '%' || p_search_query || '%'
        OR p.discipline ILIKE '%' || p_search_query || '%'
      )
      -- Country filter
      AND (p_countries IS NULL OR u.country = ANY(p_countries))
      -- Level filter
      AND (p_levels IS NULL OR p.level = ANY(p_levels))
      -- Tuition range filter
      AND (p_min_tuition IS NULL OR p.tuition_amount >= p_min_tuition)
      AND (p_max_tuition IS NULL OR p.tuition_amount <= p_max_tuition)
      -- Duration filter
      AND (p_min_duration IS NULL OR p.duration_months >= p_min_duration)
      AND (p_max_duration IS NULL OR p.duration_months <= p_max_duration)
      -- Intake filter
      AND (p_intake_months IS NULL OR p.intake_months && p_intake_months)
  ),
  counted_programs AS (
    SELECT *, COUNT(*) OVER() as total_count
    FROM filtered_programs
  )
  SELECT 
    cp.*
  FROM counted_programs cp
  ORDER BY
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'asc' THEN cp.name END ASC,
    CASE WHEN p_sort_by = 'name' AND p_sort_order = 'desc' THEN cp.name END DESC,
    CASE WHEN p_sort_by = 'tuition' AND p_sort_order = 'asc' THEN cp.tuition_amount END ASC,
    CASE WHEN p_sort_by = 'tuition' AND p_sort_order = 'desc' THEN cp.tuition_amount END DESC,
    CASE WHEN p_sort_by = 'duration' AND p_sort_order = 'asc' THEN cp.duration_months END ASC,
    CASE WHEN p_sort_by = 'duration' AND p_sort_order = 'desc' THEN cp.duration_months END DESC,
    CASE WHEN p_sort_by = 'intake' AND p_sort_order = 'asc' THEN cp.next_intake_month END ASC,
    CASE WHEN p_sort_by = 'intake' AND p_sort_order = 'desc' THEN cp.next_intake_month END DESC,
    cp.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_programs TO authenticated;

-- Create function to get filter options (for populating filter dropdowns)
CREATE OR REPLACE FUNCTION get_program_filter_options(p_tenant_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'countries', (
      SELECT json_agg(DISTINCT u.country ORDER BY u.country)
      FROM universities u
      WHERE u.tenant_id = p_tenant_id AND u.active = TRUE
    ),
    'levels', (
      SELECT json_agg(DISTINCT p.level ORDER BY p.level)
      FROM programs p
      WHERE p.tenant_id = p_tenant_id AND p.active = TRUE
    ),
    'disciplines', (
      SELECT json_agg(DISTINCT p.discipline ORDER BY p.discipline)
      FROM programs p
      WHERE p.tenant_id = p_tenant_id AND p.active = TRUE
    ),
    'tuition_range', (
      SELECT json_build_object(
        'min', MIN(p.tuition_amount),
        'max', MAX(p.tuition_amount),
        'currency', (SELECT tuition_currency FROM programs WHERE tenant_id = p_tenant_id LIMIT 1)
      )
      FROM programs p
      WHERE p.tenant_id = p_tenant_id AND p.active = TRUE
    ),
    'duration_range', (
      SELECT json_build_object(
        'min', MIN(p.duration_months),
        'max', MAX(p.duration_months)
      )
      FROM programs p
      WHERE p.tenant_id = p_tenant_id AND p.active = TRUE
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_program_filter_options TO authenticated;
