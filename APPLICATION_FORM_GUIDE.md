# Multi-Step Application Form Guide

## Overview

The multi-step application form provides a guided, ApplyBoard-like experience for students to submit university applications. The form includes progress tracking, auto-save functionality, document uploads, and real-time notifications.

## Features

### 1. **5-Step Guided Process**

#### Step 1: Personal Information
- Auto-filled from student profile
- Fields: Name, Email, Phone, Date of Birth, Nationality, Passport, Address
- Real-time validation
- All required fields marked with asterisks

#### Step 2: Education History
- Add multiple education records
- Fields: Education Level, Institution, Country, Dates, GPA
- Supports current enrollment (no end date)
- Delete and edit existing records
- Pre-filled from existing education records

#### Step 3: Program Selection
- Search and select from active programs
- Program details display:
  - University information
  - Tuition fees
  - Duration
  - Location
- Intake selection (if available)
- Fallback to manual month/year selection

#### Step 4: Document Upload
- Required documents:
  - Academic Transcript
  - Passport Copy
  - Statement of Purpose
- Optional documents:
  - English Test Score (IELTS/TOEFL)
- Features:
  - Drag-and-drop support
  - File size validation (10MB max)
  - File type validation (PDF, DOC, DOCX, JPG, PNG)
  - Preview uploaded files
  - Delete uploaded files
  - Clear upload guidelines

#### Step 5: Review & Submit
- Comprehensive review of all entered information
- Sections:
  - Personal Information summary
  - Education History list
  - Selected Program details
  - Uploaded Documents checklist
- Optional additional notes field
- Terms and conditions agreement
- Submit button disabled until terms accepted

### 2. **Progress Tracking**

- Visual progress bar showing completion percentage
- Step indicators with checkmarks for completed steps
- Current step highlighting
- Step titles and descriptions

### 3. **Save & Continue Later**

- Auto-save to localStorage
- Draft restoration on return
- "Save & Continue Later" button on every page
- Toast notification on save
- Draft cleared after successful submission

### 4. **Document Management**

- Storage bucket: `application-documents`
- Organized by application ID: `{application_id}/{document_type}_{timestamp}.{ext}`
- Secure storage with RLS policies:
  - Students can only access their own documents
  - Staff/Admins can view all documents
  - Documents deletable only in draft status

### 5. **Submission & Notifications**

On successful submission:
- Application created with status "submitted"
- Documents uploaded to storage
- Document records created in `application_documents` table
- Notification sent to assigned counselor
- Success modal with:
  - Tracking ID (first 8 characters of application ID)
  - Link to application details
  - Link to applications list

### 6. **Validation**

Each step includes validation:
- **Step 1**: All required personal fields
- **Step 2**: At least one education record with required fields
- **Step 3**: Program selected and intake period specified
- **Step 4**: All required documents uploaded
- **Step 5**: Terms and conditions accepted

"Continue" buttons disabled until validation passes.

## Technical Implementation

### File Structure

```
src/
├── pages/
│   └── student/
│       └── NewApplication.tsx          # Main form container
└── components/
    └── application/
        ├── PersonalInfoStep.tsx        # Step 1
        ├── EducationHistoryStep.tsx    # Step 2
        ├── ProgramSelectionStep.tsx    # Step 3
        ├── DocumentsUploadStep.tsx     # Step 4
        └── ReviewSubmitStep.tsx        # Step 5
```

### Database Schema

#### Applications Table
```sql
- id (uuid)
- student_id (uuid) → students.id
- program_id (uuid) → programs.id
- intake_year (integer)
- intake_month (integer)
- intake_id (uuid) → intakes.id (optional)
- status (enum: draft, submitted, ...)
- notes (text)
- submitted_at (timestamp)
- tenant_id (uuid)
```

#### Application Documents Table
```sql
- id (uuid)
- application_id (uuid) → applications.id
- document_type (enum: transcript, passport, ielts, sop, ...)
- storage_path (text)
- file_size (bigint)
- mime_type (text)
- verified (boolean)
- verification_notes (text)
```

### Storage Buckets

#### application-documents
- **Access**: Private (RLS enabled)
- **Size Limit**: 10MB per file
- **Allowed Types**: PDF, DOC, DOCX, JPG, PNG
- **Structure**: `{application_id}/{document_type}_{timestamp}.{ext}`

### Navigation Flow

```
/student/applications → Click "New Application" → /student/applications/new
                                                      ↓
                                          Multi-step form (Steps 1-5)
                                                      ↓
                                          Success Modal
                                                      ↓
                            View Application → /student/applications/{id}
                                    OR
                            My Applications → /student/applications
```

### State Management

Form state is managed using React `useState`:
```typescript
interface ApplicationFormData {
  personalInfo: { ... }
  educationHistory: EducationRecord[]
  programSelection: { ... }
  documents: { transcript, passport, ielts, sop }
  notes: string
}
```

Draft storage uses `localStorage`:
- Key: `application_draft`
- Stored as JSON (excluding File objects)
- Restored on mount

## Usage

### For Students

1. **Start Application**
   - Navigate to Dashboard → Applications → "New Application"
   - Or use direct link with program: `/student/applications/new?program={id}`

2. **Complete Steps**
   - Fill in each step carefully
   - Use "Save & Continue Later" to preserve progress
   - Use "Back" button to review previous steps

3. **Upload Documents**
   - Ensure files meet requirements
   - All required documents must be uploaded
   - Optional documents can be added later

4. **Review & Submit**
   - Carefully review all information
   - Add any additional notes
   - Accept terms and conditions
   - Click "Submit Application"

5. **After Submission**
   - Note your tracking ID
   - Check email for confirmation
   - Monitor status in "My Applications"

### For Developers

#### Adding a New Step

1. Create new step component in `/components/application/`
2. Add step to `STEPS` array in `NewApplication.tsx`
3. Add state fields to `ApplicationFormData` interface
4. Add step rendering in the main component
5. Update validation logic

#### Customizing Document Types

Edit `DOCUMENT_TYPES` array in `DocumentsUploadStep.tsx`:
```typescript
{
  key: 'custom_doc',
  label: 'Custom Document',
  description: 'Description of document',
  required: true/false,
}
```

Update storage policies if needed.

#### Modifying Notifications

In `NewApplication.tsx`, `handleSubmit` function:
```typescript
await supabase.from('notifications').insert({
  user_id: recipient_id,
  tenant_id: tenantId,
  template_key: 'template_key',
  subject: 'Subject',
  body: 'Body content',
  channel: 'in_app', // or 'email', 'sms'
  status: 'pending',
});
```

## Testing

### Manual Testing Checklist

- [ ] Step 1: Personal info auto-fills correctly
- [ ] Step 2: Can add/edit/delete education records
- [ ] Step 3: Programs load and can be selected
- [ ] Step 3: Intakes display when available
- [ ] Step 4: Document upload validates file size
- [ ] Step 4: Document upload validates file type
- [ ] Step 4: Can remove uploaded documents
- [ ] Step 5: All information displays correctly
- [ ] Step 5: Cannot submit without terms acceptance
- [ ] Navigation: Back button works on all steps
- [ ] Navigation: Continue button disabled when invalid
- [ ] Save draft: Works and restores on return
- [ ] Submission: Application created successfully
- [ ] Submission: Documents uploaded to storage
- [ ] Submission: Notifications sent correctly
- [ ] Success modal: Displays with tracking ID

### Edge Cases

1. **No student profile**: Redirects to onboarding
2. **No programs available**: Shows empty state
3. **File too large**: Shows error message
4. **Invalid file type**: Shows error message
5. **Network error during upload**: Handles gracefully
6. **Browser refresh**: Draft restored from localStorage

## Migration

### Existing Applications

For applications created with the old form:
- They remain accessible and functional
- New submissions use the new form
- Old applications don't have the same document structure

### Database Migration

Run the storage migration:
```bash
supabase migration up
```

This creates:
- `application-documents` storage bucket
- Storage policies for document access

## Security

### Row Level Security (RLS)

All database operations use RLS:
- Students can only create applications for themselves
- Students can only view their own applications
- Staff can view all applications
- Document access restricted by role

### Storage Security

- Files stored in private bucket
- Access controlled by RLS policies
- Students can only access their documents
- Staff have broader access
- Documents in draft applications can be deleted

### Input Validation

- Client-side validation on all steps
- File size and type validation
- Database constraints enforce data integrity
- Supabase handles SQL injection prevention

## Performance

### Optimizations

- Lazy loading of step components
- Program search with debouncing
- File uploads happen on submission (not per-step)
- localStorage for draft persistence (no server calls)
- Optimistic UI updates

### Best Practices

- Keep file sizes under 5MB when possible
- Use PDF format for better compatibility
- Compress images before uploading
- Save drafts frequently for long forms

## Troubleshooting

### Common Issues

**Issue**: "Student profile not found"
- **Solution**: Complete student onboarding first at `/student/onboarding`

**Issue**: "Failed to upload document"
- **Solution**: Check file size (<10MB) and type (PDF, DOC, DOCX, JPG, PNG)

**Issue**: "Draft not restoring"
- **Solution**: Check browser localStorage is enabled

**Issue**: "Programs not loading"
- **Solution**: Verify programs are marked as active in database

**Issue**: "Submission failed"
- **Solution**: Check all required fields are filled, documents uploaded, and terms accepted

## Future Enhancements

Potential improvements:
- [ ] Email confirmation on submission
- [ ] Auto-save to database (not just localStorage)
- [ ] Document preview in-browser
- [ ] Program comparison feature
- [ ] Application templates
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] OCR for document data extraction
- [ ] AI-powered SOP review
- [ ] Video interview scheduling

## Support

For issues or questions:
- Check this guide first
- Review error messages carefully
- Check browser console for technical errors
- Contact system administrator if issue persists
