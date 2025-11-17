# Messaging Feature Fix - Documentation

## Overview

This document describes the fixes applied to the messaging feature to enable proper user visibility and messaging between different user roles (agents, staff, universities, students).

## Problem Identified

The messaging system was using hardcoded mock data with mock user IDs (e.g., "agent-riley", "student-zoe") instead of fetching real user relationships from the database. This caused:

1. **No User Visibility**: Real users couldn't see any contacts in the messaging directory
2. **Failed Message Creation**: Users couldn't start conversations because relationship checks failed
3. **Disconnected Mock Data**: The frontend and database were not integrated

## Solution Implemented

### 1. Database Migration

**File**: `supabase/migrations/20251117000000_add_get_messaging_contacts_function.sql`

Created a comprehensive PostgreSQL function `get_messaging_contacts()` that:
- Returns messaging contacts based on the current user's role
- Enforces role-based permissions:
  - **Agents/Partners**: Can message assigned students, staff, and universities
  - **Staff**: Can message other staff, agents, universities, and all students
  - **Universities**: Can message staff, agents, and students who applied
  - **Students**: Can message staff and their assigned agent
  - **Counselors/Admins**: Can message everyone
- Supports search filtering and limits
- Uses existing `agent_student_links` table for relationship enforcement

### 2. Frontend Service Layer

**File**: `src/lib/messaging/contactsService.ts` (new)

Created a TypeScript service that:
- Calls the `get_messaging_contacts()` database function
- Transforms database results to `DirectoryProfile` format
- Handles tenant_id resolution
- Provides error handling and fallback

### 3. Updated Relationship Logic

**File**: `src/lib/messaging/relationships.ts`

- Added async `getMessagingContactIdsAsync()` function for fetching real contact IDs
- Maintained backward compatibility with mock data for development
- Imported and integrated the new contact service

### 4. Updated Directory Search

**File**: `src/lib/messaging/directory.ts`

Modified `searchDirectoryProfiles()` to:
- First attempt to fetch from database when no `allowedProfileIds` is provided
- Fall back to mock data if database fetch fails
- Filter results by role and excluded IDs
- Maintain existing search functionality

### 5. Updated Messaging Pages

Updated the following pages to use real database contacts:

- **`src/pages/student/Messages.tsx`**
  - Removed `allowedProfileIds` from search calls
  - Updated default profiles to use database fetch
  - Auto-fetch contacts when new chat dialog opens

- **`src/pages/dashboard/StaffMessages.tsx`**
  - Removed `allowedProfileIds` from contact fetch
  - Let database function handle permissions

- **`src/pages/university/Messages.tsx`**
  - Removed `allowedProfileIds` from contact search
  - Let database function handle permissions

## How to Apply the Fix

### Step 1: Apply the Database Migration

The migration file has been created at:
```
supabase/migrations/20251117000000_add_get_messaging_contacts_function.sql
```

**Option A: Using Supabase CLI** (if available)
```bash
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL

**Option C: Auto-deployment**
- If your project auto-deploys migrations, simply push the code and the migration will be applied

### Step 2: Test the Fix

After applying the migration, test the following scenarios:

1. **Agent → Student Messaging**
   - Log in as an agent
   - Open Messages → New Chat
   - Verify you can see students assigned to you via `agent_student_links`
   - Send a message to a student
   - Verify the student can see and respond to the message

2. **Staff → Student Messaging**
   - Log in as a staff member
   - Open Messages → New Chat
   - Verify you can see all students in your tenant
   - Send a message to a student
   - Verify message is delivered

3. **Student → Staff/Agent Messaging**
   - Log in as a student
   - Open Messages → New Chat
   - Verify you can see staff members and your assigned agent (if any)
   - Send a message
   - Verify response works

4. **University → Student Messaging**
   - Log in as a university representative (school_rep)
   - Open Messages → New Chat
   - Verify you can see students, staff, and agents
   - Test messaging functionality

## Database Schema Dependencies

This fix relies on the following existing database tables:

- `profiles` - User profile information with role and tenant_id
- `students` - Student records
- `agent_student_links` - Junction table linking agents to students
- `conversations` - Conversation metadata
- `conversation_participants` - User participation in conversations

## Backward Compatibility

The fix maintains backward compatibility:
- Mock data still works for development/testing
- If database fetch fails, the system falls back to mock data
- Existing conversations are not affected

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Agent can see assigned students
- [ ] Agent can message assigned students
- [ ] Student can see and message staff
- [ ] Student can see and message assigned agent
- [ ] Staff can see and message all users
- [ ] University can see and message relevant users
- [ ] Search functionality works
- [ ] New conversation creation works
- [ ] Message sending and receiving works
- [ ] No console errors

## Rollback Plan

If issues occur, rollback steps:

1. Revert the migration:
   ```sql
   DROP FUNCTION IF EXISTS public.get_messaging_contacts(text, integer);
   ```

2. Revert frontend changes:
   ```bash
   git revert <commit-hash>
   ```

## Additional Notes

- The `get_or_create_conversation()` function in migration `20251106150000_agent_messaging_restrictions.sql` already enforces agent-student relationship checks at the database level
- Row Level Security (RLS) policies on messaging tables provide additional security
- The fix does not modify any existing data, only adds new functionality
