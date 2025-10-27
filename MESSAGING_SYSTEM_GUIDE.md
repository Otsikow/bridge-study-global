# Real-Time Messaging System Guide

## Overview

This guide documents the new real-time messaging system implemented for the GEG Platform. The system provides WhatsApp Web-like functionality for communication between students, agents, and admins.

## Features

✅ **Real-time messaging** - Instant message delivery using Supabase Realtime
✅ **Typing indicators** - See when others are typing
✅ **Online/offline status** - Track user presence
✅ **Emoji picker** - Express yourself with emojis
✅ **1-on-1 and group chats** - Support for both conversation types
✅ **Message history** - Persistent chat history
✅ **Unread count badges** - Never miss a message
✅ **Responsive design** - Works on desktop and mobile
✅ **Search functionality** - Find conversations and users easily

## Architecture

### Database Tables

#### 1. `conversations`
Stores chat threads (1-on-1 or group conversations)

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT,                    -- Optional group name
  is_group BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### 2. `conversation_participants`
Many-to-many relationship between users and conversations

```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,  -- For group chats
  UNIQUE(conversation_id, user_id)
);
```

#### 3. `conversation_messages`
The actual messages

```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  reply_to_id UUID,                -- For threaded replies
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,          -- Soft delete
  created_at TIMESTAMPTZ
);
```

#### 4. `typing_indicators`
Tracks who is currently typing

```sql
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);
```

#### 5. `user_presence`
Tracks online/offline status

```sql
CREATE TABLE user_presence (
  id UUID PRIMARY KEY,
  status TEXT DEFAULT 'offline',   -- online, offline, away
  last_seen TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Helper Functions

#### `get_or_create_conversation()`
Creates a new 1-on-1 conversation or returns existing one

```sql
SELECT get_or_create_conversation(user1_id, user2_id, tenant_id);
```

#### `get_unread_count()`
Returns the number of unread messages for a user in a conversation

```sql
SELECT get_unread_count(user_id, conversation_id);
```

## Components

### 1. `ChatList` Component
**Location:** `src/components/messages/ChatList.tsx`

Left panel displaying recent conversations with:
- Avatar and name
- Last message preview
- Unread count badge
- Timestamp
- Search functionality

**Props:**
```typescript
interface ChatListProps {
  conversations: Conversation[];
  currentConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat?: () => void;
}
```

### 2. `ChatArea` Component
**Location:** `src/components/messages/ChatArea.tsx`

Right panel showing the active conversation with:
- Message bubbles with timestamps
- Date dividers
- Typing indicators
- User avatars
- Message grouping (same sender within 5 minutes)

**Props:**
```typescript
interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  loading: boolean;
  onSendMessage: (content: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
}
```

### 3. `MessageInput` Component
**Location:** `src/components/messages/MessageInput.tsx`

Bottom input area with:
- Text input with auto-resize
- Emoji picker popover
- Send button
- Attachment button (placeholder)
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

**Props:**
```typescript
interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}
```

## Hooks

### 1. `useMessages()`
**Location:** `src/hooks/useMessages.tsx`

Main hook for message management:

```typescript
const {
  conversations,           // All user conversations
  currentConversation,     // Selected conversation ID
  setCurrentConversation,  // Select a conversation
  messages,                // Messages in current conversation
  typingUsers,            // Who's typing
  loading,                // Loading state
  sendMessage,            // Send a message
  startTyping,            // Trigger typing indicator
  stopTyping,             // Clear typing indicator
  getOrCreateConversation, // Create/get 1-on-1 chat
  fetchConversations      // Refresh conversations
} = useMessages();
```

**Features:**
- Automatic real-time subscriptions
- Auto-fetches on mount
- Handles message sending
- Manages typing indicators
- Updates read status

### 2. `usePresence()`
**Location:** `src/hooks/usePresence.tsx`

Manages user online/offline status:

```typescript
const {
  presence,              // All user presence data
  updatePresence,        // Update own status
  getUserPresence,       // Get specific user's status
  isUserOnline          // Check if user is online
} = usePresence();
```

**Features:**
- Automatic status updates (heartbeat every 30s)
- Handles page visibility changes
- Sets offline on page unload
- Real-time presence updates

## Installation & Setup

### 1. Run the Migration

```bash
# Apply the migration to your Supabase database
supabase migration up
# or push to remote
supabase db push
```

### 2. Enable Realtime

The migration automatically enables realtime for required tables:
- `conversation_messages`
- `typing_indicators`
- `user_presence`
- `conversation_participants`

### 3. Verify Tables

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'conversations',
  'conversation_participants',
  'conversation_messages',
  'typing_indicators',
  'user_presence'
);
```

### 4. Test the System

1. Log in as two different users in separate browsers
2. Start a conversation from one user
3. Send messages and observe real-time delivery
4. Test typing indicators
5. Check online/offline status

## Usage

### Accessing Messages

Navigate to `/student/messages` (protected route)

### Starting a New Conversation

1. Click the "New Chat" button (plus icon)
2. Search for users by name
3. Click on a user to start chatting

### Sending Messages

1. Type in the input box
2. Press Enter to send (Shift+Enter for new line)
3. Click emoji icon for emoji picker
4. Messages appear instantly for both parties

### Reading Messages

- Unread messages are counted in badges
- Opening a conversation marks messages as read
- Read status updates automatically

## Real-Time Features

### Message Delivery

Messages use Supabase Realtime `postgres_changes`:

```typescript
supabase
  .channel(`conversation:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'conversation_messages',
    filter: `conversation_id=eq.${conversationId}`
  }, handleNewMessage)
  .subscribe();
```

### Typing Indicators

- Start typing → trigger indicator
- Stop typing after 3 seconds of inactivity
- Indicators expire after 5 seconds in database

### Presence System

- Updates every 30 seconds while active
- Sets "away" when tab is hidden
- Sets "offline" on page unload
- Users shown as online if updated within 2 minutes

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

**Conversations:**
- Users can only view conversations they're part of
- Only conversation creators/admins can update

**Messages:**
- Users can only view messages in their conversations
- Users can only send messages where they're participants
- Users can only edit/delete their own messages

**Typing Indicators:**
- Users can only view indicators in their conversations
- Users can only manage their own indicators

**Presence:**
- Users can view presence of others in their tenant
- Users can only update their own presence

## Performance Optimizations

1. **Message Grouping** - Messages from same sender within 5 minutes are visually grouped
2. **Auto-scroll** - Smooth scroll to bottom on new messages
3. **Lazy Loading** - Components are lazy-loaded
4. **Efficient Queries** - Indexed columns for fast lookups
5. **Debounced Typing** - Typing indicators debounced to reduce updates

## Mobile Responsiveness

- **Desktop:** Side-by-side chat list and chat area
- **Mobile:** Full-screen chat area when conversation selected
- **Responsive search** - Adapts to screen size
- **Touch-friendly** - Large tap targets

## Future Enhancements

Potential features to add:

- [ ] File attachments
- [ ] Image sharing
- [ ] Voice messages
- [ ] Message reactions
- [ ] Message search
- [ ] Message forwarding
- [ ] Conversation archiving
- [ ] Group chat management
- [ ] Push notifications
- [ ] Desktop notifications
- [ ] Read receipts (checkmarks)
- [ ] Last seen timestamp
- [ ] Block/mute users
- [ ] Message encryption

## Troubleshooting

### Messages not appearing in real-time

1. Check Supabase Realtime is enabled for your project
2. Verify the migration ran successfully
3. Check browser console for subscription errors
4. Ensure user has proper permissions (RLS policies)

### Typing indicators not working

1. Verify `typing_indicators` table exists
2. Check that expired indicators are being cleaned up
3. Ensure proper RLS policies are in place

### Presence status incorrect

1. Check `user_presence` table has entries
2. Verify heartbeat interval is running
3. Ensure page visibility handler is working

### Build errors

```bash
# Install dependencies
npm install
# or with bun
bun install

# Run dev server
npm run dev
# or
bun run dev
```

## API Reference

### Main Functions

#### `sendMessage(conversationId, content)`
Sends a message to a conversation

#### `startTyping(conversationId)`
Shows typing indicator for 3 seconds

#### `stopTyping(conversationId)`
Manually stops typing indicator

#### `getOrCreateConversation(otherUserId)`
Gets existing or creates new 1-on-1 conversation

#### `updatePresence(status)`
Updates user's online status

## Code Examples

### Start a conversation and send a message

```typescript
const { getOrCreateConversation, sendMessage } = useMessages();

async function chatWithUser(userId: string) {
  const conversationId = await getOrCreateConversation(userId);
  if (conversationId) {
    await sendMessage(conversationId, "Hello!");
  }
}
```

### Check if user is online

```typescript
const { isUserOnline } = usePresence();

const isAliceOnline = isUserOnline(aliceUserId);
console.log(`Alice is ${isAliceOnline ? 'online' : 'offline'}`);
```

### Subscribe to new messages

The `useMessages` hook automatically subscribes when you set a conversation. Manual subscription:

```typescript
const channel = supabase
  .channel('my-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'conversation_messages'
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

## Support

For issues or questions:
1. Check this guide first
2. Review Supabase Realtime documentation
3. Check browser console for errors
4. Verify database migrations ran successfully

## License

Part of the GEG Platform - see main project LICENSE.
