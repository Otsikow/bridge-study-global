# Multi-Step Application Form - Quick Start Guide

## 🚀 For Students

### How to Submit an Application

1. **Navigate to Applications**
   - Go to Dashboard
   - Click on "Applications" in the sidebar
   - Click "New Application" button

2. **Complete the Form**
   - **Step 1**: Review your personal information (auto-filled)
   - **Step 2**: Add your education history
   - **Step 3**: Search and select your desired program
   - **Step 4**: Upload required documents:
     - Academic Transcript (Required)
     - Passport Copy (Required)
     - Statement of Purpose (Required)
     - IELTS/TOEFL Score (Optional)
   - **Step 5**: Review everything and submit

3. **Save Your Progress**
   - Click "Save & Continue Later" at any step
   - Your progress is automatically saved
   - Return anytime to complete

4. **Track Your Application**
   - After submission, you'll receive a Tracking ID
   - View status in "My Applications"
   - Receive notifications for updates

### Tips for Success

✅ **Do's:**
- Ensure all information is accurate
- Use clear, high-quality scans for documents
- Keep files under 10MB
- Upload PDF format when possible
- Save your draft frequently
- Review everything before submitting

❌ **Don'ts:**
- Don't upload corrupted or unclear files
- Don't leave required fields empty
- Don't rush through the review step
- Don't forget to accept terms and conditions

## 🛠️ For Developers

### Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Apply database migrations
supabase migration up
```

### Key Files

```
src/pages/student/NewApplication.tsx              # Main container
src/components/application/PersonalInfoStep.tsx   # Step 1
src/components/application/EducationHistoryStep.tsx   # Step 2
src/components/application/ProgramSelectionStep.tsx   # Step 3
src/components/application/DocumentsUploadStep.tsx    # Step 4
src/components/application/ReviewSubmitStep.tsx       # Step 5
```

### Environment Setup

Required environment variables (in `.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. **Apply the storage migration:**
   ```bash
   supabase migration up
   ```

2. **Verify storage bucket:**
   - Check Supabase dashboard
   - Bucket name: `application-documents`
   - Should be private with RLS enabled

3. **Verify tables exist:**
   - `applications`
   - `application_documents`
   - `students`
   - `education_records`
   - `programs`
   - `intakes`
   - `notifications`

### Testing the Form

```bash
# 1. Start the dev server
npm run dev

# 2. Navigate to:
http://localhost:5173/student/applications/new

# 3. Complete the form
# 4. Check the database for new records
# 5. Verify files uploaded to storage
# 6. Check notifications table
```

## 🔧 Configuration

### Adjusting File Limits

In `DocumentsUploadStep.tsx`:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // Change this
```

In migration file:
```sql
file_size_limit: 10485760, -- Change this
```

### Adding Document Types

In `DocumentsUploadStep.tsx`, update `DOCUMENT_TYPES` array:
```typescript
{
  key: 'new_doc',
  label: 'New Document',
  description: 'Description here',
  required: true,
}
```

Update type in `NewApplication.tsx`:
```typescript
interface Documents {
  transcript: File | null;
  passport: File | null;
  ielts: File | null;
  sop: File | null;
  new_doc: File | null;  // Add this
}
```

### Customizing Validation

Each step component has an `isValid()` function:
```typescript
const isValid = () => {
  // Add your validation logic
  return validationResult;
};
```

## 🐛 Troubleshooting

### Issue: Build fails with module errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Storage bucket doesn't exist
**Solution:**
```bash
supabase migration up
# Or manually create bucket in Supabase dashboard
```

### Issue: RLS policies preventing access
**Solution:**
- Check user is authenticated
- Verify user has student profile
- Check RLS policies in Supabase dashboard
- Verify tenant_id matches

### Issue: Draft not saving
**Solution:**
- Check browser localStorage is enabled
- Check browser console for errors
- Verify DRAFT_STORAGE_KEY is unique

### Issue: Files not uploading
**Solution:**
- Verify storage bucket exists
- Check file size (<10MB)
- Verify file type is allowed
- Check RLS policies on storage.objects
- Ensure application_id is valid

## 📱 Mobile Considerations

The form is fully responsive, but consider:
- Document scanning apps for better quality
- WiFi connection for large uploads
- Save draft frequently on mobile
- Portrait orientation recommended

## 🔐 Security Checklist

Before deploying:
- [ ] RLS enabled on all tables
- [ ] Storage bucket is private
- [ ] Storage policies are in place
- [ ] File size limits enforced
- [ ] File type validation working
- [ ] User authentication required
- [ ] HTTPS enabled in production
- [ ] Environment variables secured

## 📞 Support

### For Students
- Check FAQ section
- Contact your assigned counselor
- Email support team
- Check application status regularly

### For Developers
- Review `APPLICATION_FORM_GUIDE.md`
- Check browser console for errors
- Review Supabase logs
- Test in incognito mode
- Check network tab for failed requests

## 🎯 Success Metrics

The form is working correctly when:
- ✅ All steps load without errors
- ✅ Progress bar updates correctly
- ✅ Validation prevents invalid submissions
- ✅ Documents upload successfully
- ✅ Applications appear in database
- ✅ Notifications are sent
- ✅ Success modal displays
- ✅ Draft saves and restores

## 📊 Monitoring

Check these metrics:
- Application submission rate
- Draft save frequency
- Document upload success rate
- Form abandonment rate per step
- Average completion time
- Error rates per step

## 🎓 Best Practices

### For Students
1. Complete your profile first
2. Gather documents before starting
3. Read all instructions carefully
4. Double-check before submitting
5. Save your tracking ID

### For Developers
1. Test all steps thoroughly
2. Handle all error cases
3. Provide clear error messages
4. Log important events
5. Monitor production usage
6. Keep documentation updated

## ✅ Deployment Checklist

Before going live:
- [ ] Run migrations on production database
- [ ] Test with real student account
- [ ] Verify storage bucket configuration
- [ ] Test document upload with various files
- [ ] Confirm notifications are sent
- [ ] Test on multiple devices
- [ ] Verify analytics tracking
- [ ] Update user documentation
- [ ] Train support team
- [ ] Monitor error logs

## 🚦 Ready to Go!

The multi-step application form is production-ready with:
- ✅ Complete implementation
- ✅ All features working
- ✅ Comprehensive validation
- ✅ Security measures in place
- ✅ Full documentation
- ✅ Successful build
- ✅ Error handling
- ✅ Responsive design

**Start URL**: `/student/applications/new`

For detailed information, see `APPLICATION_FORM_GUIDE.md`
