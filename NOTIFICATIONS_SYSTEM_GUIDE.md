# Global Notifications System Guide

## Overview

The global notifications system provides real-time alerts to users when important events occur in the application. Notifications are stored in the database and displayed in the UI with unread count badges.

## Features

- ✅ Real-time notification delivery via Supabase subscriptions
- ✅ Unread count badge in sidebar navigation
- ✅ Automatic notifications for key events
- ✅ Filterable notification center
- ✅ Mark as read/delete functionality
- ✅ Click to navigate to related content

## Database Schema

The `notifications` table includes:

```sql
- id: UUID (primary key)
- tenant_id: UUID (references tenants)
- user_id: UUID (references profiles)
- type: TEXT ('application_status', 'message', 'commission', 'course_recommendation')
- title: TEXT
- content: TEXT
- read: BOOLEAN (default: false)
- metadata: JSONB (additional data)
- action_url: TEXT (navigation link)
- created_at: TIMESTAMPTZ
```

## Automatic Notifications

The system automatically creates notifications for the following events:

### 1. Application Status Changes

**Trigger:** When an application's status is updated

**Recipients:** 
- Student (application owner)
- Assigned agent (if any)

**Example:**
```
Title: "Application Status Updated"
Content: "Your application to Computer Science at MIT is now conditional_offer."
Type: "application_status"
Action URL: "/student/applications"
```

### 2. New Messages

**Trigger:** When a message is sent in an application thread

**Recipients:**
- Student (if sender is not student)
- Agent (if sender is not agent)

**Example:**
```
Title: "New Message"
Content: "John Smith sent you a message."
Type: "message"
Action URL: "/student/messages"
```

### 3. Commission Status Changes

**Trigger:** When a commission status changes to 'approved' or 'paid'

**Recipients:**
- Agent (commission owner)

**Example:**
```
Title: "Commission Paid"
Content: "Your commission of 500.00 USD has been paid."
Type: "commission"
Action URL: "/dashboard/commissions"
```

### 4. Course Recommendations

**Trigger:** Manual call to `notify_course_recommendation()` function

**Recipients:**
- Student being recommended

**Example:**
```
Title: "New Course Recommendation"
Content: "We recommend MBA at Harvard University. Great match for your profile!"
Type: "course_recommendation"
Action URL: "/search?program=<program_id>"
```

## Usage in Frontend

### Using the Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,      // Array of notification objects
    unreadCount,       // Number of unread notifications
    loading,           // Loading state
    error,            // Error message if any
    markAsRead,       // Function to mark notification as read
    markAllAsRead,    // Function to mark all as read
    deleteNotification, // Function to delete notification
    refetch           // Function to manually refetch
  } = useNotifications();

  return (
    <div>
      <h2>You have {unreadCount} unread notifications</h2>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.content}</p>
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Notification Object Structure

```typescript
interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: 'application_status' | 'message' | 'commission' | 'course_recommendation';
  title: string;
  content: string;
  read: boolean;
  metadata: Record<string, any>;
  action_url: string | null;
  created_at: string;
}
```

## Creating Custom Notifications

### From Backend (SQL)

Use the `create_notification()` function:

```sql
SELECT create_notification(
  p_tenant_id := '<tenant-uuid>',
  p_user_id := '<user-uuid>',
  p_type := 'course_recommendation',
  p_title := 'Custom Notification',
  p_content := 'This is a custom notification message.',
  p_metadata := '{"key": "value"}'::jsonb,
  p_action_url := '/some/path'
);
```

### Course Recommendation Function

```sql
SELECT notify_course_recommendation(
  p_student_id := '<student-uuid>',
  p_program_id := '<program-uuid>',
  p_reason := 'This program matches your academic background and interests.'
);
```

### From Frontend (via Supabase)

```typescript
import { supabase } from '@/integrations/supabase/client';

async function sendCustomNotification(userId: string, tenantId: string) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      type: 'course_recommendation',
      title: 'Check Out This Program!',
      content: 'We think this program would be perfect for you.',
      metadata: { program_id: 'some-uuid' },
      action_url: '/search',
    });

  if (error) {
    console.error('Error creating notification:', error);
  }
}
```

## Components

### NotificationCenter

Full-featured notification center with filtering and management:

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

<NotificationCenter />
```

Features:
- Filter by type (all, unread, applications, messages, commissions, courses)
- Mark individual or all as read
- Delete notifications
- Click to navigate to related content
- Real-time updates

### Sidebar Badge

The sidebar automatically shows an unread count badge on the Notifications menu item when there are unread notifications.

## Real-time Updates

The system uses Supabase real-time subscriptions to automatically:
- Add new notifications to the list
- Update notification status (read/unread)
- Remove deleted notifications
- Show toast notifications for new items

No manual refresh needed!

## Testing the System

### 1. Test Application Status Change

```sql
-- Update an application status
UPDATE applications 
SET status = 'conditional_offer' 
WHERE id = '<application-id>';

-- This will automatically create notifications for the student and agent
```

### 2. Test Message Notification

```sql
-- Insert a new message
INSERT INTO messages (application_id, sender_id, body)
VALUES ('<application-id>', '<sender-id>', 'Test message');

-- This will notify the recipient(s)
```

### 3. Test Commission Notification

```sql
-- Update commission status
UPDATE commissions 
SET status = 'paid' 
WHERE id = '<commission-id>';

-- This will notify the agent
```

### 4. Test Course Recommendation

```sql
-- Send a course recommendation
SELECT notify_course_recommendation(
  '<student-id>',
  '<program-id>',
  'Based on your profile, we recommend this program.'
);
```

## Customization

### Add New Notification Types

1. Update the `type` column to include new values (or keep as TEXT for flexibility)
2. Create new trigger functions or manual notification calls
3. Update the frontend hook to handle new types
4. Add icons and colors in `NotificationCenter.tsx`

### Modify Notification Content

Edit the trigger functions in the migration file to customize:
- Notification titles
- Content messages
- Metadata structure
- Action URLs

### Styling

The notification UI uses Tailwind CSS and shadcn/ui components. Customize in:
- `/workspace/src/components/notifications/NotificationCenter.tsx`
- `/workspace/src/components/layout/AppSidebar.tsx`

## Performance Considerations

- Notifications are indexed on `user_id` and `read` status for fast queries
- Only the most recent 50 notifications are fetched by default
- Real-time subscriptions are scoped to the current user
- Unread count queries are optimized with partial indexes

## Security

- Row Level Security (RLS) ensures users only see their own notifications
- Users can only mark their own notifications as read
- System functions use `SECURITY DEFINER` for safe automatic notifications
- All notification creation from frontend requires authenticated user

## Future Enhancements

Potential improvements:
- Email/SMS notification delivery
- Notification preferences/settings
- Notification grouping (e.g., "3 new messages")
- Push notifications (via service worker)
- Notification archiving
- Notification templates
