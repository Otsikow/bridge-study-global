# 🧪 Authentication Testing Guide

This guide provides step-by-step instructions to test the authentication system after applying the fixes.

## Prerequisites

Before testing, ensure you have:
1. ✅ Run the SQL initialization script (`/workspace/scripts/init-tenant.sql`) in Supabase SQL Editor
2. ✅ Verified that the default tenant was created successfully
3. ✅ Cleared browser cache and cookies (optional but recommended)

## Test Scenarios

### 1. Student Registration & Login

#### Registration
1. Navigate to the signup page: `http://localhost:5173/auth/signup`
2. Fill in the form:
   - **Full Name**: Test Student
   - **Email**: student@test.com
   - **Password**: testpass123
   - **I am a**: Student
3. Click "Create Account"
4. **Expected Result**:
   - ✅ Success toast: "Account created! Please check your email to verify your account."
   - ✅ Redirect to login page
   - ✅ Check browser console - no errors

#### Email Verification (if enabled)
1. Check the email inbox for `student@test.com`
2. Click the verification link
3. **Expected Result**:
   - ✅ Email verified successfully

#### Login
1. Navigate to login page: `http://localhost:5173/auth/login`
2. Enter credentials:
   - **Email**: student@test.com
   - **Password**: testpass123
3. Click "Sign In"
4. **Expected Result**:
   - ✅ Success toast: "Welcome back! Successfully logged in."
   - ✅ Redirect to `/dashboard`
   - ✅ User profile loaded correctly
   - ✅ Student dashboard displays

#### Verify Profile Creation
1. Open Supabase Dashboard → Table Editor
2. Check `profiles` table:
   - ✅ Profile exists for the user
   - ✅ `role` = 'student'
   - ✅ `tenant_id` = '00000000-0000-0000-0000-000000000001'
   - ✅ `full_name` = 'Test Student'
3. Check `user_roles` table:
   - ✅ Entry exists with `role` = 'student'
4. Check `students` table:
   - ✅ Student record created with correct `profile_id`

---

### 2. Agent Registration & Login

#### Registration
1. Navigate to signup page: `http://localhost:5173/auth/signup`
2. Fill in the form:
   - **Full Name**: Test Agent
   - **Email**: agent@test.com
   - **Password**: testpass123
   - **I am a**: Agent/Counselor
3. Click "Create Account"
4. **Expected Result**:
   - ✅ Success toast: "Account created!"
   - ✅ Redirect to login page

#### Login
1. Navigate to login page
2. Enter credentials:
   - **Email**: agent@test.com
   - **Password**: testpass123
3. Click "Sign In"
4. **Expected Result**:
   - ✅ Successful login
   - ✅ Redirect to dashboard
   - ✅ Agent dashboard displays

#### Verify Profile Creation
1. Check `profiles` table:
   - ✅ Profile exists
   - ✅ `role` = 'agent'
2. Check `user_roles` table:
   - ✅ Entry with `role` = 'agent'
3. Check `agents` table:
   - ✅ Agent record created
   - ✅ Correct `profile_id` and `tenant_id`

---

### 3. Staff/Admin Access

**Note**: Staff and admin accounts cannot be created through the signup form. They must be created manually.

#### Create Staff Account (via SQL)
1. First, create a regular student account through signup
2. In Supabase SQL Editor, run:
   ```sql
   -- Get the user ID (replace email)
   SELECT id, email FROM auth.users WHERE email = 'staff@test.com';
   
   -- Add staff role
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_ID_HERE', 'staff')
   ON CONFLICT DO NOTHING;
   
   -- Update primary role in profiles
   UPDATE public.profiles
   SET role = 'staff'
   WHERE id = 'USER_ID_HERE';
   ```

#### Test Staff Login
1. Login with staff credentials
2. Navigate to: `http://localhost:5173/admin/blog`
3. **Expected Result**:
   - ✅ Access granted to admin routes
   - ✅ Staff dashboard displays

---

### 4. Google OAuth Sign-In

#### Test Google Login
1. On login or signup page, click "Google" button
2. Follow Google authentication flow
3. **Expected Result**:
   - ✅ Successful authentication
   - ✅ Profile created automatically
   - ✅ Redirect to dashboard
   - ✅ Default role assigned (student)

---

### 5. Protected Routes

#### Test Unauthorized Access
1. Open browser in incognito/private mode
2. Try to access: `http://localhost:5173/dashboard`
3. **Expected Result**:
   - ✅ Redirect to `/auth/login`

#### Test Role-Based Access
1. Login as a student
2. Try to access: `http://localhost:5173/admin/blog`
3. **Expected Result**:
   - ✅ Access denied
   - ✅ Redirect to home page

---

### 6. Logout & Session Management

#### Test Logout
1. Login with any account
2. Click logout button (in user menu)
3. **Expected Result**:
   - ✅ Session cleared
   - ✅ Redirect to `/auth/login`
   - ✅ Cannot access protected routes

#### Test Session Persistence
1. Login with any account
2. Refresh the page
3. **Expected Result**:
   - ✅ User remains logged in
   - ✅ Profile data persists

#### Test Cross-Tab Sessions
1. Login in one tab
2. Logout in another tab
3. **Expected Result**:
   - ✅ Both tabs reflect logout state

---

## Common Issues & Solutions

### Issue: "No tenant found" warning
**Solution**: Run the SQL initialization script in Supabase SQL Editor

### Issue: "Profile not found" after signup
**Solution**: 
1. Check if tenant exists in database
2. Verify `handle_new_user()` trigger is active
3. Check Supabase logs for errors

### Issue: Email verification not working
**Solution**: 
1. Check Supabase email settings
2. Verify email templates are configured
3. Check spam folder

### Issue: Redirect loops after login
**Solution**:
1. Clear browser cache and cookies
2. Check that profile has valid `tenant_id`
3. Verify RLS policies are not blocking profile reads

### Issue: "Invalid login credentials"
**Solution**:
1. Ensure password is at least 6 characters
2. Check if email is verified (if required)
3. Verify user exists in `auth.users` table

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify data integrity:

```sql
-- Check tenant exists
SELECT * FROM public.tenants;

-- Check all users and their profiles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.full_name,
  p.role,
  p.tenant_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;

-- Check user roles
SELECT 
  ur.user_id,
  p.email,
  p.full_name,
  ur.role
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id;

-- Check students
SELECT 
  s.id,
  p.full_name,
  p.email
FROM public.students s
JOIN public.profiles p ON s.profile_id = p.id;

-- Check agents
SELECT 
  a.id,
  p.full_name,
  p.email,
  a.company_name
FROM public.agents a
JOIN public.profiles p ON a.profile_id = p.id;

-- Check for orphaned auth users (no profile)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

---

## Automated Testing Checklist

After manual testing, verify:

- [ ] Students can register
- [ ] Students can login
- [ ] Agents can register  
- [ ] Agents can login
- [ ] Staff accounts work (manual creation)
- [ ] Google OAuth works
- [ ] Protected routes redirect to login
- [ ] Role-based access works
- [ ] Logout clears session
- [ ] Session persists on refresh
- [ ] No console errors during auth flows
- [ ] All profiles have tenant_id
- [ ] All profiles have corresponding user_roles entries
- [ ] Student records created for student users
- [ ] Agent records created for agent users

---

## Performance Testing

Test with multiple accounts to ensure scalability:

```bash
# Create 10 test students
for i in {1..10}; do
  echo "Creating student$i@test.com"
  # Use signup form or API
done
```

Verify:
- ✅ All profiles created successfully
- ✅ No database performance issues
- ✅ Login remains fast with multiple users

---

## Security Testing

1. **SQL Injection**: Try malicious inputs in forms
2. **XSS**: Try script tags in name fields
3. **CSRF**: Verify Supabase handles CSRF protection
4. **Session Hijacking**: Check JWT expiration and refresh
5. **RLS**: Ensure users can only see their own data

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark authentication as fixed
2. ✅ Update project documentation
3. ✅ Deploy changes to production
4. ✅ Monitor error logs for issues

If tests fail:
1. Check browser console for errors
2. Check Supabase logs
3. Verify SQL script was executed
4. Review RLS policies
5. Check trigger functions
