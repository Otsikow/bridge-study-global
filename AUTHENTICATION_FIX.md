# 🔧 Authentication System Fix for Global Education Gateway

## Problem Identified

The authentication system was failing for all user types (students, agents, staff) because:

1. **Missing Default Tenant**: The database had no tenant record, which is required for user profile creation
2. **Broken User Registration Flow**: When users signed up, the `handle_new_user()` trigger would fail to create profiles because it couldn't find a tenant
3. **Authentication Failures**: Users could create accounts but couldn't log in because they had no associated profiles

## Root Cause

The `handle_new_user()` database trigger (in `/supabase/migrations/20251022090000_user_roles_and_role_guard.sql`) requires a tenant to exist:

```sql
SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

IF default_tenant_id IS NULL THEN
  RAISE WARNING 'No tenant found, profile creation skipped';
  RETURN NEW;  -- Profile is NOT created!
END IF;
```

Without a tenant, the trigger exits early and no profile is created, breaking the entire authentication flow.

## Solution Implemented

### 1. Migration File Created
- **File**: `/workspace/supabase/migrations/20251022130000_create_default_tenant.sql`
- **Purpose**: Creates the default "Global Education Gateway" tenant

### 2. SQL Initialization Script
- **File**: `/workspace/scripts/init-tenant.sql`
- **Purpose**: Standalone SQL script that can be run in Supabase SQL Editor
- **Features**:
  - Creates default tenant
  - Backfills existing users without profiles
  - Creates missing student/agent records
  - Idempotent (safe to run multiple times)

### 3. App Initialization Hook
- **File**: `/workspace/src/lib/initializeApp.ts`
- **Purpose**: Attempts to create tenant on app startup
- **Note**: May not work due to RLS policies, but provides a fallback

## 🚀 How to Fix Authentication (Manual Steps Required)

Since the migrations need to be applied to your remote Supabase instance, follow these steps:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project: `gbustuntgvmwkcttjojo`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Initialization Script**
   - Copy the contents of `/workspace/scripts/init-tenant.sql`
   - Paste into a new query in the SQL Editor
   - Click "Run" or press Ctrl/Cmd + Enter

4. **Verify Success**
   - You should see a success message: "Tenant created successfully!"
   - The tenant details will be displayed

### Option 2: Using Supabase CLI (If Available)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref gbustuntgvmwkcttjojo

# Apply all pending migrations
supabase db push
```

## What This Fix Does

1. ✅ Creates a default tenant "Global Education Gateway"
2. ✅ Fixes user registration for new users
3. ✅ Backfills profiles for existing auth users
4. ✅ Creates missing user_roles entries
5. ✅ Creates missing student/agent records
6. ✅ Enables login for all user types

## Testing Authentication After Fix

### Test Student Registration & Login
```
1. Go to /auth/signup
2. Enter: Name, Email, Password
3. Submit form
4. Check email for verification (if required)
5. Go to /auth/login
6. Enter credentials
7. Should redirect to /dashboard
```

### Test Agent Registration & Login
```
Same flow as students - role will be 'student' by default
Admins can change role to 'agent' via user_roles table
```

### Test Staff/Admin Access
```
Staff/Admin accounts must be created manually by updating:
1. user_roles table - add 'staff' or 'admin' role
2. This gives access to admin routes like /admin/blog
```

## Role Management

After the fix, all new users default to 'student' role. To assign other roles:

1. **Via Supabase Dashboard**:
   ```sql
   -- Change user role to agent
   INSERT INTO user_roles (user_id, role)
   VALUES ('user-uuid-here', 'agent')
   ON CONFLICT DO NOTHING;
   
   -- Or update existing role
   UPDATE user_roles
   SET role = 'agent'
   WHERE user_id = 'user-uuid-here';
   ```

2. **Future Enhancement**: Add role selection during signup or admin panel for role management

## Files Changed

1. `/workspace/supabase/migrations/20251022130000_create_default_tenant.sql` - New migration
2. `/workspace/scripts/init-tenant.sql` - SQL initialization script
3. `/workspace/src/lib/initializeApp.ts` - App initialization utility
4. `/workspace/src/App.tsx` - Added initialization call on app startup
5. `/workspace/AUTHENTICATION_FIX.md` - This documentation

## Verification Checklist

- [ ] Default tenant exists in `tenants` table
- [ ] New users can register successfully
- [ ] New users can log in after registration
- [ ] User profiles are created automatically on signup
- [ ] Student records are created for student users
- [ ] Agent records are created for agent users (when role is set)
- [ ] Dashboard is accessible after login
- [ ] No errors in browser console during auth flow

## Additional Notes

- The tenant ID is fixed: `00000000-0000-0000-0000-000000000001`
- All users will be associated with this default tenant
- Multi-tenancy is supported but requires additional configuration
- Role assignment is now managed through the `user_roles` table (not `profiles.role` directly)

## Support

If you continue experiencing authentication issues after applying this fix:

1. Check browser console for errors
2. Verify the tenant was created in Supabase Dashboard
3. Check that RLS policies are enabled on all tables
4. Ensure Supabase credentials in `.env` are correct
