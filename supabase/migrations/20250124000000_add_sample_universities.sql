-- Add sample universities with real data
-- This migration adds some well-known universities to demonstrate the university search functionality

-- Insert sample universities
INSERT INTO public.universities (
  id,
  tenant_id,
  name,
  country,
  city,
  logo_url,
  website,
  description,
  active
) VALUES 
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Massachusetts Institute of Technology',
    'United States',
    'Cambridge',
    '/src/assets/mit-logo.png',
    'https://web.mit.edu',
    'MIT is a world-renowned private research university known for its programs in science, technology, engineering, and mathematics.',
    true
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Harvard University',
    'United States',
    'Cambridge',
    '/src/assets/harvard-logo.png',
    'https://www.harvard.edu',
    'Harvard is the oldest institution of higher education in the United States and among the most prestigious in the world.',
    true
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Stanford University',
    'United States',
    'Stanford',
    '/src/assets/stanford-logo.png',
    'https://www.stanford.edu',
    'Stanford University is a private research university known for its academic strength, wealth, proximity to Silicon Valley, and ranking as one of the world''s top universities.',
    true
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'University of Oxford',
    'United Kingdom',
    'Oxford',
    '/src/assets/oxford-logo.png',
    'https://www.ox.ac.uk',
    'The University of Oxford is a collegiate research university in Oxford, England. It is the oldest university in the English-speaking world.',
    true
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'University of Cambridge',
    'United Kingdom',
    'Cambridge',
    '/src/assets/cambridge-logo.png',
    'https://www.cam.ac.uk',
    'The University of Cambridge is a collegiate research university in Cambridge, United Kingdom. Founded in 1209, it is the second-oldest university in the English-speaking world.',
    true
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'University of California, Berkeley',
    'United States',
    'Berkeley',
    '/src/assets/berkeley-logo.png',
    'https://www.berkeley.edu',
    'UC Berkeley is a public land-grant research university in Berkeley, California. It is the flagship institution of the University of California system.',
    true
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Yale University',
    'United States',
    'New Haven',
    '/src/assets/yale-logo.png',
    'https://www.yale.edu',
    'Yale University is a private Ivy League research university in New Haven, Connecticut. Founded in 1701, it is the third-oldest institution of higher education in the United States.',
    true
  )
ON CONFLICT DO NOTHING;

-- Add some sample programs for these universities
WITH university_ids AS (
  SELECT id, name FROM public.universities 
  WHERE name IN (
    'Massachusetts Institute of Technology',
    'Harvard University', 
    'Stanford University',
    'University of Oxford',
    'University of Cambridge',
    'University of California, Berkeley',
    'Yale University'
  )
)
INSERT INTO public.programs (
  id,
  tenant_id,
  university_id,
  name,
  level,
  discipline,
  duration_months,
  tuition_currency,
  tuition_amount,
  intake_months,
  description,
  active
)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  CASE 
    WHEN u.name = 'Massachusetts Institute of Technology' THEN 'Master of Science in Computer Science'
    WHEN u.name = 'Harvard University' THEN 'Master of Business Administration'
    WHEN u.name = 'Stanford University' THEN 'Master of Science in Engineering'
    WHEN u.name = 'University of Oxford' THEN 'Master of Philosophy in Economics'
    WHEN u.name = 'University of Cambridge' THEN 'Master of Science in Natural Sciences'
    WHEN u.name = 'University of California, Berkeley' THEN 'Master of Science in Data Science'
    WHEN u.name = 'Yale University' THEN 'Master of Arts in International Relations'
  END,
  'Master',
  CASE 
    WHEN u.name = 'Massachusetts Institute of Technology' THEN 'Computer Science'
    WHEN u.name = 'Harvard University' THEN 'Business Administration'
    WHEN u.name = 'Stanford University' THEN 'Engineering'
    WHEN u.name = 'University of Oxford' THEN 'Economics'
    WHEN u.name = 'University of Cambridge' THEN 'Natural Sciences'
    WHEN u.name = 'University of California, Berkeley' THEN 'Data Science'
    WHEN u.name = 'Yale University' THEN 'International Relations'
  END,
  24,
  'USD',
  CASE 
    WHEN u.name = 'Massachusetts Institute of Technology' THEN 80000
    WHEN u.name = 'Harvard University' THEN 75000
    WHEN u.name = 'Stanford University' THEN 85000
    WHEN u.name = 'University of Oxford' THEN 45000
    WHEN u.name = 'University of Cambridge' THEN 40000
    WHEN u.name = 'University of California, Berkeley' THEN 60000
    WHEN u.name = 'Yale University' THEN 70000
  END,
  ARRAY[9],
  'A prestigious graduate program offering world-class education and research opportunities.',
  true
FROM university_ids u
ON CONFLICT DO NOTHING;

-- Add some sample scholarships
WITH university_ids AS (
  SELECT id, name FROM public.universities 
  WHERE name IN (
    'Massachusetts Institute of Technology',
    'Harvard University', 
    'Stanford University',
    'University of Oxford',
    'University of Cambridge',
    'University of California, Berkeley',
    'Yale University'
  )
)
INSERT INTO public.scholarships (
  id,
  tenant_id,
  university_id,
  name,
  amount_cents,
  currency,
  coverage_type,
  active
)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  CASE 
    WHEN u.name = 'Massachusetts Institute of Technology' THEN 'MIT Merit Scholarship'
    WHEN u.name = 'Harvard University' THEN 'Harvard Financial Aid'
    WHEN u.name = 'Stanford University' THEN 'Stanford Graduate Fellowship'
    WHEN u.name = 'University of Oxford' THEN 'Oxford Clarendon Scholarship'
    WHEN u.name = 'University of Cambridge' THEN 'Cambridge Gates Scholarship'
    WHEN u.name = 'University of California, Berkeley' THEN 'Berkeley Graduate Fellowship'
    WHEN u.name = 'Yale University' THEN 'Yale Graduate Fellowship'
  END,
  CASE 
    WHEN u.name = 'Massachusetts Institute of Technology' THEN 2000000
    WHEN u.name = 'Harvard University' THEN 1500000
    WHEN u.name = 'Stanford University' THEN 2500000
    WHEN u.name = 'University of Oxford' THEN 1000000
    WHEN u.name = 'University of Cambridge' THEN 1200000
    WHEN u.name = 'University of California, Berkeley' THEN 1800000
    WHEN u.name = 'Yale University' THEN 2000000
  END,
  'USD',
  'tuition_and_fees',
  true
FROM university_ids u
ON CONFLICT DO NOTHING;