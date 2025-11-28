# Implementation Guide - UniDoxia Enhancements

This guide provides step-by-step instructions for implementing and using the new features added to the UniDoxia application.

---

## Table of Contents

1. [Overview of New Features](#overview-of-new-features)
2. [Analytics Dashboard](#analytics-dashboard)
3. [Notification Center](#notification-center)
4. [Form Validation](#form-validation)
5. [Performance Optimizations](#performance-optimizations)
6. [SOP Generator Enhancement](#sop-generator-enhancement)
7. [Usage Examples](#usage-examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview of New Features

### What's New?

✨ **Analytics Dashboard** - Comprehensive data visualization and insights  
🔔 **Notification Center** - Real-time notifications with customizable settings  
✅ **Form Validation** - Robust validation using Zod schemas  
⚡ **Performance Utilities** - Optimization hooks and utilities  
🤖 **Enhanced SOP Generator** - AI-powered statement of purpose creation  
🎯 **Admin Analytics Page** - Dedicated analytics page for administrators

---

## Analytics Dashboard

### Location
`/workspace/src/components/analytics/AnalyticsDashboard.tsx`

### Features
- Real-time metrics and KPIs
- Interactive charts (area, bar, pie)
- Time range filtering (7d, 30d, 90d, 1y)
- Role-based data filtering
- Export capabilities
- Responsive design

### Usage

```tsx
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

function MyPage() {
  return (
    <div>
      <AnalyticsDashboard />
    </div>
  );
}
```

### Routes
- Admin: `/admin/analytics`
- Student Dashboard: Can be integrated into overview tab

### Data Sources
- Applications table
- Students table
- Agents table
- Universities table
- Programs table

---

## Notification Center

### Location
`/workspace/src/components/notifications/NotificationCenter.tsx`

### Features
- Real-time updates via Supabase subscriptions
- Notification types: info, success, warning, error
- Mark as read/unread
- Bulk actions (mark all read, clear all)
- Customizable settings
- Filter by status
- Action URLs for navigation

### Usage

```tsx
import NotificationCenter from '@/components/notifications/NotificationCenter';

function NotificationsPage() {
  return (
    <div className="container mx-auto py-8">
      <NotificationCenter />
    </div>
  );
}
```

### Database Requirements

Ensure you have a `notifications` table:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
```

### Creating Notifications

Server-side (Supabase Edge Function or trigger):

```typescript
await supabase.from('notifications').insert({
  user_id: userId,
  title: 'Application Status Update',
  message: 'Your application has been reviewed',
  type: 'success',
  action_url: '/student/applications/123',
  metadata: { application_id: '123' }
});
```

---

## Form Validation

### Location
`/workspace/src/lib/validation.ts`

### Available Schemas

#### Authentication
- `signupSchema` - User registration
- `loginSchema` - User login
- `forgotPasswordSchema` - Password reset request
- `resetPasswordSchema` - Password reset confirmation

#### Profiles
- `studentProfileSchema` - Student profile data
- `agentProfileSchema` - Agent profile data
- `educationSchema` - Education history
- `workExperienceSchema` - Work experience

#### Applications
- `applicationSchema` - University application
- `documentUploadSchema` - Document upload
- `messageSchema` - Messaging
- `paymentSchema` - Payment processing

#### Other
- `universitySearchSchema` - Search filters
- `feedbackSchema` - User feedback

### Usage with React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupFormData } from '@/lib/validation';

function SignupForm() {
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    // Data is validated and type-safe
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Manual Validation

```typescript
import { validateField, getValidationErrors } from '@/lib/validation';
import { emailSchema } from '@/lib/validation';

// Validate single field
const result = validateField(emailSchema, 'user@example.com');
if (result.success) {
  console.log('Valid email:', result.data);
} else {
  console.error('Error:', result.error);
}

// Get all validation errors
const errors = getValidationErrors(signupSchema, formData);
// Returns: { email: 'Invalid email format', password: 'Password too short' }
```

### Input Sanitization

```typescript
import { sanitizeInput, sanitizeUrl, sanitizeFileName } from '@/lib/validation';

// Sanitize user input
const cleanInput = sanitizeInput(userInput);

// Sanitize URLs
const cleanUrl = sanitizeUrl(url);

// Sanitize file names
const cleanFileName = sanitizeFileName(fileName);
```

---

## Performance Optimizations

### Location
`/workspace/src/lib/performance.ts`

### Available Utilities

#### 1. Debouncing

```tsx
import { useDebounce } from '@/lib/performance';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // This only runs 500ms after user stops typing
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
}
```

#### 2. Local Storage Cache

```tsx
import { useLocalStorageCache } from '@/lib/performance';

function DataComponent() {
  const { data, loading, error, refresh } = useLocalStorageCache(
    'universities',
    () => fetchUniversities(),
    5 * 60 * 1000 // 5 minutes TTL
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render data */}</div>;
}
```

#### 3. Virtual Scrolling

```tsx
import { useVirtualScroll } from '@/lib/performance';

function LargeList({ items }) {
  const { visibleItems, totalHeight, offsetY } = useVirtualScroll(
    items,
    50, // item height
    600 // container height
  );

  return (
    <div style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item) => (
            <div key={item.id} style={{ height: 50 }}>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 4. Image Optimization

```tsx
import { optimizeImageUrl } from '@/lib/performance';

function ImageComponent({ url }) {
  const optimizedUrl = optimizeImageUrl(url, 800, 600, 85);
  
  return <img src={optimizedUrl} alt="Optimized" loading="lazy" />;
}
```

#### 5. Intersection Observer

```tsx
import { useIntersectionObserver } from '@/lib/performance';
import { useRef } from 'react';

function LazyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  return (
    <div ref={ref}>
      {isVisible ? <ExpensiveComponent /> : <div>Loading...</div>}
    </div>
  );
}
```

---

## SOP Generator Enhancement

### Location
`/workspace/src/pages/student/SopGenerator.tsx`

### Features
- AI-powered generation via Supabase Edge Function
- Multiple input fields (background, experience, goals, etc.)
- Writing tone selection
- Word count targeting
- Real-time metrics analysis
- Edit and refine interface
- Download and copy functionality
- Save to documents

### Usage

Navigate to `/student/sop` or use with parameters:
```
/student/sop?program=MSc%20Computer%20Science&university=MIT
```

### Edge Function Setup

Create a Supabase Edge Function at `supabase/functions/sop-generator/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { 
    background, 
    motivation, 
    program, 
    university, 
    goals,
    workExperience,
    relevantSkills,
    achievements,
    tone,
    targetWordCount 
  } = await req.json();

  // TODO: Integrate with OpenAI, Anthropic, or other AI service
  const sop = `Generated SOP content...`;

  return new Response(JSON.stringify({ sop }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Usage Examples

### 1. Adding Analytics to Dashboard

```tsx
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function Dashboard() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analytics">
        <AnalyticsDashboard />
      </TabsContent>
    </Tabs>
  );
}
```

### 2. Using Form Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationSchema, type ApplicationFormData } from '@/lib/validation';

function ApplicationForm() {
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('programId')} />
      {form.formState.errors.programId && (
        <span>{form.formState.errors.programId.message}</span>
      )}
    </form>
  );
}
```

### 3. Performance Optimization

```tsx
import { useDebounce, useLocalStorageCache } from '@/lib/performance';

function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data, loading } = useLocalStorageCache(
    `search-${debouncedQuery}`,
    () => searchAPI(debouncedQuery),
    5 * 60 * 1000
  );

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {loading ? <div>Searching...</div> : <Results data={data} />}
    </div>
  );
}
```

---

## Troubleshooting

### Analytics Dashboard Not Loading

**Issue**: Dashboard shows "No analytics data available"

**Solutions**:
1. Verify user has applications in database
2. Check date range filter
3. Ensure proper role-based filtering
4. Check Supabase RLS policies

### Notifications Not Appearing

**Issue**: New notifications don't show up in real-time

**Solutions**:
1. Verify `notifications` table exists
2. Check RLS policies are correct
3. Ensure Supabase real-time is enabled
4. Check browser console for subscription errors

### Form Validation Not Working

**Issue**: Forms submit with invalid data

**Solutions**:
1. Ensure Zod is installed: `npm install zod`
2. Check schema imports are correct
3. Verify `@hookform/resolvers` is installed
4. Check form setup with `zodResolver`

### Performance Issues

**Issue**: App feels slow or unresponsive

**Solutions**:
1. Implement debouncing for search inputs
2. Use virtual scrolling for long lists
3. Enable local storage caching
4. Optimize images with `optimizeImageUrl`
5. Use lazy loading for components

### SOP Generator Errors

**Issue**: SOP generation fails

**Solutions**:
1. Verify Supabase Edge Function is deployed
2. Check environment variables are set
3. Ensure API keys are valid (if using external AI)
4. Check network requests in browser DevTools
5. Verify user has required permissions

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Zod Documentation**: https://zod.dev
- **React Hook Form**: https://react-hook-form.com
- **Recharts Documentation**: https://recharts.org

---

## Support

For issues or questions:
1. Check the `COMPREHENSIVE_AUDIT_SUMMARY.md`
2. Review relevant documentation files
3. Check browser console for errors
4. Verify database migrations are applied
5. Test in a clean browser session

---

**Last Updated**: October 24, 2025
