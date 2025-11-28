# Professional Auth Flow with Supabase - Complete Guide

## Overview

This guide documents the newly implemented professional authentication flow with role-based access control and multi-step onboarding experience.

## Features Implemented

### 1. Multi-Step Signup Process ✅

The signup flow now includes a modern 3-step process with smooth animations:

#### **Step 1: Role Selection**
- Choose from 4 role types:
  - **Student** 🎓 - Apply to universities and track applications
  - **Agent** 💼 - Help students with applications and earn commissions
  - **Partner** 🏛️ - Manage university partnerships and applications
  - **Admin** ⚙️ - Full system access and management capabilities

#### **Step 2: Personal Information**
- Full Name
- Phone Number
- Country (from dropdown of 30+ countries)

#### **Step 3: Account Credentials**
- Email Address
- Password (minimum 6 characters)
- Password Confirmation

### 2. Visual Features 🎨

- **Progress Bar** - Shows completion percentage across steps
- **Smooth Animations** - CSS transitions for step changes
- **Form Validation** - Real-time validation with helpful error messages
- **Modern UI** - Gradient backgrounds, card shadows, and responsive design
- **Role Cards** - Interactive role selection with icons and descriptions
- **Password Visibility Toggle** - Eye icon to show/hide password

### 3. Role-Based Redirect After Login 🔄

After successful login, users are automatically redirected to their role-specific dashboard:

| Role | Redirect Destination |
|------|---------------------|
| Student | Student Dashboard |
| Agent | Agent Dashboard |
| Partner | Partner Dashboard |
| Admin | Admin/Staff Dashboard |

### 4. Database Schema Updates 💾

A new migration has been created to add the `country` field to the `profiles` table:

```sql
-- Migration: 20251025000000_add_country_to_profiles.sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
```

### 5. Enhanced useAuth Hook 🔧

The authentication hook now supports additional user metadata:

```typescript
signUp(
  email: string,
  password: string,
  fullName: string,
  role?: 'student' | 'agent' | 'partner' | 'admin',
  phone?: string,
  country?: string
)
```

## File Structure

### Modified Files

1. **`/src/pages/auth/Signup.tsx`** - Complete rewrite with multi-step flow
2. **`/src/pages/auth/Login.tsx`** - Updated redirect logic
3. **`/src/hooks/useAuth.tsx`** - Enhanced with phone and country support
4. **`/src/pages/Dashboard.tsx`** - Added loading states and role-based routing
5. **`/supabase/migrations/20251025000000_add_country_to_profiles.sql`** - New migration

## How to Use

### For Users

1. **Navigate to Signup Page**: `/auth/signup`
2. **Select Your Role**: Choose the account type that matches your needs
3. **Fill Personal Info**: Enter name, phone, and country
4. **Create Credentials**: Set up email and password
5. **Verify Email**: Check your email for verification link
6. **Login**: Use credentials to login at `/auth/login`
7. **Auto-Redirect**: Automatically redirected to role-specific dashboard

### For Developers

#### Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### Applying Database Migrations

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration SQL in Supabase Dashboard
```

#### Testing the Auth Flow

1. **Test Signup:**
   ```
   - Visit http://localhost:5173/auth/signup
   - Complete all 3 steps
   - Check for email verification
   ```

2. **Test Login:**
   ```
   - Visit http://localhost:5173/auth/login
   - Enter credentials
   - Verify redirect to correct dashboard
   ```

3. **Test Role-Based Access:**
   ```
   - Create accounts with different roles
   - Verify each redirects to correct dashboard
   - Test protected routes with different roles
   ```

## Dashboard Routes

| Role | Primary Dashboard | Additional Features |
|------|------------------|-------------------|
| **Student** | `/dashboard` → StudentDashboard | Applications, Documents, Visa, SOP Generator |
| **Agent** | `/dashboard` → AgentDashboard | Leads, Performance Metrics, Commission Tracker |
| **Partner** | `/dashboard` → PartnerDashboard | University Management, Analytics |
| **Admin** | `/dashboard` → StaffDashboard | System Management, Blog Admin, User Management |

## API Reference

### useAuth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

const {
  user,           // Current Supabase user
  session,        // Current session
  profile,        // User profile with role and metadata
  loading,        // Loading state
  signIn,         // Function to sign in
  signUp,         // Function to sign up
  signOut,        // Function to sign out
  refreshProfile  // Function to refresh profile
} = useAuth();
```

### Profile Interface

```typescript
interface Profile {
  id: string;
  tenant_id: string;
  role: 'student' | 'agent' | 'partner' | 'staff' | 'admin' | ...;
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
  onboarded: boolean;
}
```

## Security Features

✅ **Password Requirements**: Minimum 6 characters  
✅ **Email Verification**: Required before full access  
✅ **Role-Based Access Control**: Protected routes based on user role  
✅ **Secure Password Storage**: Handled by Supabase Auth  
✅ **Session Management**: JWT tokens with automatic refresh  
✅ **CSRF Protection**: Built into Supabase  

## User Experience Enhancements

- **Progressive Disclosure**: Information collected in logical steps
- **Visual Feedback**: Loading states, success messages, error handling
- **Mobile Responsive**: Works seamlessly on all device sizes
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Dark Mode Support**: Fully themed for light and dark modes

## Troubleshooting

### Issue: User not redirecting after login
**Solution**: Check that the profile is being created correctly and has the correct role assigned.

### Issue: Country field not saving
**Solution**: Ensure the migration has been applied to add the country column.

### Issue: Email verification not working
**Solution**: Check Supabase email templates and SMTP configuration.

### Issue: Dashboard showing loading state forever
**Solution**: Check console for profile fetch errors. Verify tenant_id exists.

## Future Enhancements

- [ ] Social OAuth (Google) role selection
- [ ] Email verification reminder
- [ ] Profile completion percentage
- [ ] Onboarding tutorials per role
- [ ] 2FA/MFA support
- [ ] Password strength indicator
- [ ] Account recovery flow
- [ ] Session timeout warnings

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in browser console
3. Check Supabase logs in dashboard
4. Verify database migrations are applied

## License

This implementation is part of the UniDoxia (UniDoxia) platform.

---

**Last Updated**: October 25, 2025  
**Version**: 1.0.0  
**Author**: UniDoxia Development Team
