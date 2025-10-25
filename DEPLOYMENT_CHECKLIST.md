# Messaging System Deployment Checklist

## Pre-Deployment

- [ ] Review migration file: `supabase/migrations/20251025000000_create_chat_system.sql`
- [ ] Backup your database
- [ ] Test migration in development environment first

## Deployment Steps

### 1. Database Migration

```bash
# Test locally first (if using local Supabase)
supabase migration up

# Then push to production
supabase db push --linked
```

### 2. Verify Tables Created

```sql
-- Run this query in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'conversation%' OR table_name LIKE '%presence%' OR table_name LIKE 'typing%';
```

Expected results:
- conversations
- conversation_participants  
- conversation_messages
- typing_indicators
- user_presence

### 3. Verify Realtime Enabled

In Supabase Dashboard → Database → Replication:
- [x] conversation_messages
- [x] typing_indicators
- [x] user_presence
- [x] conversation_participants

### 4. Test RLS Policies

```sql
-- Test as a regular user (not admin)
SELECT * FROM conversations; -- Should only return their conversations
SELECT * FROM conversation_messages; -- Should only return their messages
```

### 5. Deploy Frontend

```bash
# Build the application
npm run build
# or
bun run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

### 6. Post-Deployment Verification

- [ ] Log in as test user 1
- [ ] Start a conversation with test user 2
- [ ] Send a message
- [ ] Verify message appears for user 2
- [ ] Test typing indicator
- [ ] Test online/offline status
- [ ] Test emoji picker
- [ ] Test on mobile device
- [ ] Check browser console for errors

## Performance Monitoring

Monitor these metrics:
- Message delivery time
- Realtime subscription stability
- Database query performance
- Unread count calculation speed

## Rollback Plan

If issues occur:

```bash
# Rollback the migration
supabase db reset

# Or manually drop tables
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
```

## Support

- Full documentation: `MESSAGING_SYSTEM_GUIDE.md`
- Quick start: `MESSAGING_QUICK_START.md`
- Supabase docs: https://supabase.com/docs/guides/realtime

## Success Criteria

✅ Migration completes without errors
✅ All tables created with proper RLS
✅ Realtime subscriptions work
✅ Users can send/receive messages
✅ Typing indicators appear
✅ Presence status updates
✅ No console errors
✅ Mobile responsive
✅ Performance acceptable (< 1s message delivery)

## Notes

- First deployment may take 2-3 minutes
- Users may need to refresh after deployment
- Existing sessions remain valid
- No data migration needed (new feature)

## Emergency Contacts

- Supabase Support: support@supabase.com
- Database Admin: [Your DBA contact]
- DevOps Team: [Your DevOps contact]
