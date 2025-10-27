# Profile & Settings Feature Guide

## Overview

A comprehensive universal Profile & Settings page has been implemented with support for all user roles (students, agents, staff, admin, etc.). This feature provides users with complete control over their account settings, profile information, documents, notifications, and security.

## Features

### 1. **Profile Completion Tracking**
- Dynamic completion percentage displayed at the top of the settings page
- Calculates completion based on:
  - Basic profile fields (name, email, phone, country, avatar)
  - Role-specific fields (student education data, agent company info)
- Visual progress bar to encourage profile completion

### 2. **Role-Specific Information**
- **For Agents:**
  - Displays unique referral code
  - Shows total number of referrals
  - Company verification status
  
- **For Students:**
  - Shows number of active applications
  - Displays nationality and other student-specific data

### 3. **Five Main Tabs**

#### Profile Info Tab
- Editable fields: Full name, Phone number, Country
- Profile photo upload via Supabase storage
- Email display (read-only, requires support to change)
- Role-specific information display
- Real-time avatar preview

#### Documents Tab
- Upload documents to Supabase storage
- Document type categorization (Passport, Visa, Transcript, Certificate, Resume, etc.)
- File type validation (PDF, DOC, DOCX, JPG, PNG)
- File size limit: 10MB per document
- Download and delete functionality
- Document list with metadata (type, size, upload date)

#### Notifications Tab
- Email notification toggles:
  - General email notifications
  - Application updates
  - Document reminders
  - Marketing emails
- SMS notification toggle (with phone validation check)
- Hierarchical settings (main toggle enables/disables sub-options)

#### Password & Security Tab
- Secure password update form
- Password strength indicator with real-time feedback
- Show/hide password toggle for all fields
- Password requirements enforcement:
  - Minimum 8 characters
  - Mix of uppercase, lowercase, numbers, and special characters
- Security recommendations and best practices

#### Account Tab
- Account status display
- Account metadata (User ID, member since, account type)
- **Deactivate Account:**
  - Temporarily disables account
  - Preserves all data
  - Requires support contact to reactivate
- **Delete Account:**
  - Permanent account deletion
  - Requires typing "DELETE" to confirm
  - Warning about data loss
  - Cannot be undone

## Database Schema

### New Tables Created

#### `notification_preferences`
```sql
- id: UUID (Primary Key)
- profile_id: UUID (Foreign Key → profiles.id)
- email_notifications: BOOLEAN
- sms_notifications: BOOLEAN
- marketing_emails: BOOLEAN
- application_updates: BOOLEAN
- document_reminders: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `user_documents`
```sql
- id: UUID (Primary Key)
- tenant_id: UUID (Foreign Key → tenants.id)
- profile_id: UUID (Foreign Key → profiles.id)
- document_type: TEXT
- document_name: TEXT
- file_url: TEXT
- file_size: BIGINT
- mime_type: TEXT
- uploaded_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Modified Tables

#### `profiles`
- Added `country: TEXT` field

#### `agents`
- Added `referral_code: TEXT UNIQUE` field
- Auto-generated for existing agents

### Storage Buckets

#### `profile-photos`
- Public bucket
- File size limit: 5MB
- Allowed types: image/jpeg, image/png, image/jpg, image/webp
- RLS policies for authenticated users

#### `user-documents`
- Private bucket
- File size limit: 10MB
- Allowed types: PDF, DOC, DOCX, JPG, PNG
- Users can only access their own documents

## File Structure

```
src/
├── pages/
│   └── ProfileSettings.tsx              # Main settings page
├── components/
│   ├── settings/
│   │   ├── ProfileInfoTab.tsx           # Profile information & photo upload
│   │   ├── DocumentsTab.tsx             # Document management
│   │   ├── NotificationsTab.tsx         # Notification preferences
│   │   ├── PasswordSecurityTab.tsx      # Password & security
│   │   └── AccountTab.tsx               # Account management
│   └── layout/
│       ├── AppNavbar.tsx                # Main navigation bar (NEW)
│       └── AppSidebar.tsx               # Sidebar with Settings link (UPDATED)
├── lib/
│   └── profileCompletion.ts             # Profile completion calculator
└── supabase/
    └── migrations/
        └── 20251025000000_add_profile_settings_features.sql
```

## Navigation

The Profile & Settings page is accessible from:
1. **Dashboard Sidebar:** Settings button in footer (for all authenticated users)
2. **AppNavbar Dropdown:** Settings menu item in user dropdown
3. **Direct URL:** `/settings` (protected route)

## Security Features

- Row Level Security (RLS) policies on all new tables
- Users can only access their own data
- Profile photos stored in public bucket (shareable avatars)
- User documents stored in private bucket (secure access)
- Password strength validation
- Confirmation required for dangerous actions (delete account)
- XSS protection via React's built-in escaping

## Usage Examples

### Accessing Settings
```typescript
// Navigate to settings
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/settings');
```

### Profile Completion Calculation
```typescript
import { calculateProfileCompletion } from '@/lib/profileCompletion';

const percentage = calculateProfileCompletion(profile, roleData);
// Returns: 0-100 representing completion percentage
```

### Upload Profile Photo
The ProfileInfoTab component handles photo upload automatically. Photos are:
1. Validated for type and size
2. Uploaded to Supabase storage under `profile-photos/{user_id}/`
3. Old photos are automatically deleted
4. Profile updated with new avatar URL
5. Auth context refreshed to show new photo

### Upload Document
Documents are uploaded via the DocumentsTab component:
1. Select document type from dropdown
2. Choose file (max 10MB)
3. File is validated and uploaded to `user-documents/{user_id}/`
4. Metadata saved to database
5. Document appears in list immediately

## Testing Checklist

- [ ] Upload profile photo (various formats)
- [ ] Update profile information (name, phone, country)
- [ ] Upload documents (various types)
- [ ] Download uploaded documents
- [ ] Delete documents
- [ ] Toggle notification preferences
- [ ] Update password (test weak vs strong passwords)
- [ ] Deactivate account (verify can't login)
- [ ] Delete account (verify confirmation required)
- [ ] Check profile completion percentage updates
- [ ] Verify agent sees referral code
- [ ] Verify student sees application count
- [ ] Test on mobile (responsive design)
- [ ] Test dark mode compatibility

## Future Enhancements

Potential improvements for future iterations:
1. Two-factor authentication (2FA)
2. Login history and active sessions
3. Social media account linking
4. Export user data (GDPR compliance)
5. Bulk document upload
6. Document expiry reminders
7. Password history (prevent reuse)
8. Account recovery options
9. Privacy settings (profile visibility)
10. Language and timezone preferences

## API Endpoints Used

- `supabase.from('profiles').update()` - Update profile
- `supabase.from('profiles').select()` - Fetch profile
- `supabase.from('notification_preferences').*` - Notification CRUD
- `supabase.from('user_documents').*` - Document CRUD
- `supabase.storage.from('profile-photos').*` - Photo storage
- `supabase.storage.from('user-documents').*` - Document storage
- `supabase.auth.updateUser()` - Password update
- `supabase.auth.admin.deleteUser()` - Account deletion

## Support

For issues or questions about the Profile & Settings feature:
1. Check this documentation first
2. Review the migration file for database schema
3. Check component props and TypeScript types
4. Contact the development team

## Migration Instructions

To apply the database changes:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration file manually
psql -h <host> -U <user> -d <database> -f supabase/migrations/20251025000000_add_profile_settings_features.sql
```

## Notes

- All forms include loading states and error handling
- Toast notifications provide user feedback for all actions
- All components are fully typed with TypeScript
- Responsive design works on mobile, tablet, and desktop
- Dark mode support throughout
- Accessible with keyboard navigation and screen readers
