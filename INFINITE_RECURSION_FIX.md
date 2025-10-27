# Infinite Recursion Fix Summary

## Problem Identified

The application was experiencing an "infinite recursion detected in policy for relation 'students'" error when accessing certain pages. This was caused by circular dependencies in the Row Level Security (RLS) policies.

## Root Cause

### Circular Dependency Chain

1. **Applications Table Policies** (lines 498-513 in `20251021070005_cc0cd449-3b57-443d-af12-328862c12d2a.sql`):
   ```sql
   CREATE POLICY "Students can view their own applications"
   ON applications FOR SELECT
   USING (
     student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
   );
   ```
   This policy queries the `students` table.

2. **Students Table Policy** (lines 479-487 in the same file):
   ```sql
   CREATE POLICY "Agents can view their students"
   ON students FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM applications a
       JOIN agents ag ON a.agent_id = ag.id
       WHERE a.student_id = students.id AND ag.profile_id = auth.uid()
     )
   );
   ```
   This policy queries the `applications` table.

### The Recursion Loop

When a user tries to access data:
- Query `applications` → RLS checks `students` table
- Query `students` → RLS checks `applications` table  
- Query `applications` → RLS checks `students` table
- ... **INFINITE RECURSION**

## Solution Implemented

### Migration: `20251027000000_fix_infinite_recursion.sql`

The fix eliminates circular dependencies by:

1. **Using Direct Joins Instead of Subqueries**: Changed policies to use `EXISTS` with direct joins that don't trigger recursive RLS checks.

2. **Avoiding Helper Functions in Cross-Table Policies**: Replaced `is_admin_or_staff(auth.uid())` calls with direct profile queries to avoid potential recursion.

3. **Restructured Policy Logic**:
   - Students policies now check agents/applications tables WITHOUT triggering their RLS
   - Applications policies check students table WITHOUT triggering student RLS recursively
   - A dedicated `agent_can_view_student()` helper runs as a security definer so agent lookups avoid RLS recursion entirely

### Key Changes

#### Students Table Policies
```sql
-- OLD (Causes Recursion)
CREATE POLICY "Agents can view their students"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN agents ag ON a.agent_id = ag.id
    WHERE a.student_id = students.id AND ag.profile_id = auth.uid()
  )
);

CREATE POLICY "Agents can view their students"
ON students FOR SELECT
USING (
  -- NEW (Security definer helper avoids recursion)
  public.agent_can_view_student(auth.uid(), students.id)
);
```

#### Applications Table Policies
```sql
-- OLD (Causes Recursion with Students)
CREATE POLICY "Students can view their own applications"
ON applications FOR SELECT
USING (
  student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
);

-- NEW (Direct Join, No Recursion)
CREATE POLICY "Students can view their own applications"
ON applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = applications.student_id
    AND s.profile_id = auth.uid()
  )
);
```

## Policies Fixed

The migration drops and recreates ALL policies for these tables to eliminate ANY circular references:

- ✅ `students` (5 policies)
- ✅ `applications` (6 policies)
- ✅ `application_documents` (3 policies)
- ✅ `messages` (2 policies)
- ✅ `payments` (2 policies)
- ✅ `offers` (3 policies)
- ✅ `cas_loa` (2 policies)

## Testing Checklist

After applying this migration, verify:

- [ ] Students can view their own profile
- [ ] Students can view their applications
- [ ] Agents can view their assigned students
- [ ] Agents can view their students' applications
- [ ] Staff/Admin can view all students and applications
- [ ] Help Center page loads without errors
- [ ] Dashboard pages load correctly
- [ ] No RLS policy errors in Supabase logs

## How to Apply

```bash
# The migration file has been created at:
# /workspace/supabase/migrations/20251027000000_fix_infinite_recursion.sql

# To apply via Supabase CLI:
supabase db push

# Or apply directly via SQL:
psql -U postgres -d your_database -f supabase/migrations/20251027000000_fix_infinite_recursion.sql
```

## Additional Notes

- The fix uses explicit schema names (`public.students`, `public.applications`) to ensure clarity
- All policies now use `EXISTS` with direct joins instead of `IN` with subqueries for better performance
- Helper functions like `is_admin_or_staff()` are still used but expanded inline in cross-table policies to prevent issues

## Files Changed

- ✅ Created: `/workspace/supabase/migrations/20251027000000_fix_infinite_recursion.sql`

## Related Issues Checked

- ✅ No linter errors found in TypeScript/React code
- ✅ Authentication flow doesn't have circular dependencies
- ✅ All security definer functions are properly configured
- ✅ No other circular policy references found

---

**Fix Date**: 2025-10-27  
**Status**: Ready to Apply
