# Notifications System - Quick Start

## 🚀 Getting Started

### 1. Apply the Migration
Run the migration to set up the notifications table:
```bash
cd /workspace
supabase db push
# Or apply via Supabase dashboard: copy content from 
# supabase/migrations/20251025000000_update_notifications_system.sql
```

### 2. Access Notifications in UI
The notifications system is already integrated:
- **Students**: Navigate to "Notifications" in the sidebar
- **Unread Badge**: Shows automatically in sidebar when there are unread notifications
- **Real-time**: Updates happen automatically, no refresh needed

### 3. Test the System

#### Create a Test Notification via SQL
```sql
-- Replace with actual UUIDs from your database
SELECT create_notification(
  p_tenant_id := '00000000-0000-0000-0000-000000000000',
  p_user_id := '00000000-0000-0000-0000-000000000000',
  p_type := 'general',
  p_title := 'Test Notification',
  p_content := 'This is a test notification to verify the system works!',
  p_metadata := '{}'::jsonb,
  p_action_url := '/dashboard'
);
```

#### Trigger an Automatic Notification
```sql
-- Update any application status to trigger a notification
UPDATE applications 
SET status = 'screening' 
WHERE id = '<any-application-id>';

-- This will automatically notify the student and agent!
```

### 4. Use in Your Code

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
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

## 📋 What's Included

✅ **Database Table** - `notifications` table with all required fields
✅ **Automatic Triggers** - Fire on application status, messages, commissions
✅ **Real-time Updates** - Via Supabase subscriptions
✅ **Unread Badge** - Shows count in sidebar navigation
✅ **Notification Center** - Full UI for managing notifications
✅ **React Hook** - `useNotifications()` for easy integration
✅ **Utility Functions** - Helper functions in `/src/lib/notifications.ts`
✅ **Documentation** - See `NOTIFICATIONS_SYSTEM_GUIDE.md` for details

## 🎯 Automatic Notifications

The system **automatically** creates notifications for:

1. **Application Status Changes** → Notifies student + agent
2. **New Messages** → Notifies recipients
3. **Commission Paid/Approved** → Notifies agent
4. **Course Recommendations** → Manual via function call

No code changes needed - these work out of the box!

## 📚 Full Documentation

- **Implementation Details**: `NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md`
- **Usage Guide**: `NOTIFICATIONS_SYSTEM_GUIDE.md`
- **Code**: Check `/src/hooks/useNotifications.tsx` and `/src/lib/notifications.ts`

## 🎉 You're Ready!

The notification system is complete and production-ready. Just apply the migration and start using it!
