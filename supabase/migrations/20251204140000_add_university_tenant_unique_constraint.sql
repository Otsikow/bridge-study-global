-- Add unique constraint on universities.tenant_id if it doesn't exist
-- This is needed for upsert operations using ON CONFLICT (tenant_id)

DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'universities_tenant_id_unique'
  ) THEN
    -- Add the unique constraint
    ALTER TABLE public.universities
    ADD CONSTRAINT universities_tenant_id_unique UNIQUE (tenant_id);

    RAISE NOTICE 'Added unique constraint universities_tenant_id_unique';
  ELSE
    RAISE NOTICE 'Constraint universities_tenant_id_unique already exists';
  END IF;
END$$;

COMMENT ON CONSTRAINT universities_tenant_id_unique ON public.universities IS
  'Ensures each tenant can only have one university profile, preventing cross-contamination';
