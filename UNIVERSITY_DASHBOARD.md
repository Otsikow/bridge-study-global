# University Dashboard Documentation

## Overview

A comprehensive dashboard for partner universities to manage their applications, courses, and agent relationships. This dashboard provides real-time analytics and full CRUD operations for course management.

## Features

### 1. **University Header**
- Displays university logo (or placeholder if no logo)
- University name, location (city, country)
- Website link
- Quick stats: Total Programs, Applications, and Connected Agents

### 2. **Analytics Charts**

#### Application Sources Chart
- **Type**: Pie Chart
- **Data**: Student applications grouped by nationality
- **Purpose**: Visualize geographic distribution of applicants
- **Top 8 countries shown**

#### Acceptance Rate Chart
- **Type**: Bar Chart
- **Data**: Application status breakdown (Accepted, Pending, Other)
- **Metrics**: 
  - Overall acceptance rate percentage
  - Count of accepted vs total applications
  - Visual breakdown by status

### 3. **Tabs**

#### Applications Tab
**Features:**
- Complete list of all applications for the university's programs
- Real-time filtering by:
  - Program (dropdown showing all available programs)
  - Status (draft, submitted, screening, offers, etc.)
  - Search by student name or application number
- **Displayed Data:**
  - Application number
  - Student name and nationality
  - Program name and level
  - Current status (with color-coded badge)
  - Submission date

#### Courses Tab
**Features:**
- List all active and inactive programs
- **Add New Course**: Modal dialog with comprehensive form
  - Course name, level (Bachelor, Master, PhD, etc.)
  - Discipline and duration
  - Tuition amount and currency (USD, GBP, EUR, CAD, AUD)
  - Language requirements (IELTS, TOEFL)
  - Course description
- **Actions:**
  - Activate/Deactivate courses
  - Delete courses (with confirmation)
- **Displayed Data:**
  - Program name, level, discipline
  - Duration in months
  - Tuition with currency
  - Active/Inactive status

#### Agents Tab
**Features:**
- List all connected agents and their referral statistics
- **Displayed Data:**
  - Company name
  - Contact person name
  - Email (clickable mailto link)
  - Total number of referrals/applications

## Technical Implementation

### Routes
- **Main Route**: `/university/dashboard`
- **Allowed Roles**: `partner`, `admin`, `staff`
- **Legacy Route**: `/dashboard` for users with `partner` role redirects here

### Database Tables Used
- `universities` - University information
- `programs` - Course/program listings
- `applications` - Student applications
- `students` - Student information
- `agents` - Agent information
- `profiles` - User profiles

### Key Technologies
- **React** with TypeScript
- **Supabase** for database queries
- **Recharts** for data visualization
- **Shadcn/ui** components for UI
- **React Query** for data fetching (via Supabase client)

### Components Structure

```
UniversityDashboard
├── DashboardLayout (wrapper)
├── University Header Card
│   ├── Logo/Icon
│   ├── Name & Location
│   └── Quick Stats
├── Charts Row
│   ├── Application Sources (PieChart)
│   └── Acceptance Rate (BarChart + Stats)
└── Tabs
    ├── Applications Tab
    │   ├── Filters (Search, Program, Status)
    │   └── Table
    ├── Courses Tab
    │   ├── Add Course Button → Modal
    │   └── Table with Actions
    └── Agents Tab
        └── Table
```

### Data Flow

1. **Initial Load**:
   - Fetch university data based on user's tenant_id
   - Fetch all programs for the university
   - Fetch applications for all programs
   - Fetch agents and calculate referral counts

2. **Filtering**:
   - Client-side filtering for better performance
   - Filters are reactive (immediate update)

3. **CRUD Operations**:
   - **Create**: Add new course via modal form
   - **Read**: All data fetched on component mount
   - **Update**: Toggle active/inactive status
   - **Delete**: Remove course (with confirmation)

## Usage

### For Partner Universities

1. **View Dashboard**: Navigate to `/university/dashboard` or `/dashboard` (if role is partner)

2. **Monitor Applications**:
   - See all incoming applications
   - Filter by specific program or status
   - Search for specific students
   - Track acceptance rates

3. **Manage Courses**:
   - Add new programs/courses
   - Update course status
   - Remove outdated courses

4. **Track Agent Performance**:
   - See which agents are referring students
   - Monitor referral counts
   - Contact agents directly via email

### For Administrators

Admins and staff can access this dashboard to:
- Monitor university partners
- Assist with course management
- Review application flows

## Customization

### Adding New Filters
Edit the filter section in the Applications tab:
```typescript
// Add new filter state
const [newFilter, setNewFilter] = useState<string>('all');

// Add filter logic
const filteredApplications = applications.filter(app => {
  // ... existing filters
  const matchesNewFilter = newFilter === 'all' || app.someField === newFilter;
  return matchesProgram && matchesStatus && matchesNewFilter;
});
```

### Adding New Charts
Import from recharts and add to the Charts Row:
```typescript
import { LineChart, Line } from 'recharts';

// Add new chart card in the Charts Row
<Card>
  <CardHeader>
    <CardTitle>Your New Chart</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={yourData}>
        {/* Chart components */}
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

### Customizing Course Form
Edit the modal in the Courses tab to add/remove fields:
```typescript
// Add new field to state
const [newProgram, setNewProgram] = useState({
  // ... existing fields
  newField: '',
});

// Add input in the modal
<div className="grid gap-2">
  <Label htmlFor="newField">New Field</Label>
  <Input
    id="newField"
    value={newProgram.newField}
    onChange={(e) => setNewProgram({ ...newProgram, newField: e.target.value })}
  />
</div>
```

## Error Handling

- Toast notifications for all operations
- Loading states during data fetching
- Empty states when no data is available
- Confirmation dialogs for destructive actions
- Error boundaries at the app level

## Performance Considerations

- Client-side filtering for instant results
- Lazy loading of page via React lazy()
- Optimized Supabase queries (fetch only needed fields)
- Recharts responsive containers for proper rendering

## Security

- Protected routes with role-based access
- Tenant-based data isolation
- All queries filtered by tenant_id
- No direct database access from client

## Future Enhancements

Potential additions:
- Export functionality (CSV, PDF)
- Bulk operations for courses
- Advanced analytics (trends over time)
- Email notifications for new applications
- Document management integration
- Real-time updates using Supabase subscriptions
- Batch application status updates

## Troubleshooting

### No University Found
- Ensure the university exists in the `universities` table
- Verify the university is linked to the correct tenant_id
- Check user has `partner` role

### Empty Applications
- Verify programs exist for the university
- Check applications are linked to correct program_id
- Ensure students have required fields (legal_name, nationality)

### Charts Not Displaying
- Check if application data exists
- Verify student nationality field is populated
- Ensure recharts library is installed

### Course Creation Fails
- Verify all required fields are filled
- Check tenant_id is set correctly
- Ensure university_id exists

## Support

For issues or questions, contact the development team or refer to the main project README.
