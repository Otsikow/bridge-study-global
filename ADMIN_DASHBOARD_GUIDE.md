# Admin Dashboard - ApplyBoard Style Back-Office

## Overview

A comprehensive admin dashboard has been built for the UniDoxia platform, modeled after ApplyBoard's back-office system. The dashboard provides full administrative control with role-based access control (RBAC) and real-time data from Supabase.

## Features Implemented

### 1. **Metrics Cards (Overview)**
Located at the top of the dashboard, displaying real-time metrics:
- **Total Students**: Count of all registered students
- **Total Applications**: Count of all applications
- **Partner Universities**: Count of active partner universities
- **Agents**: Count of active agents
- **Revenue**: Total revenue from successful payments

### 2. **Tabs System**

#### **Overview Tab**
- Platform statistics and key metrics
- Analytics widgets showing:
  - **Top Countries**: Top 5 countries by student count with bar chart
  - **Top Agents**: Top 5 agents by application count with pie chart
  - **Top Programs**: Top 5 programs by application count
- Application status distribution
- Visual charts using Recharts library

#### **Users Tab**
- Searchable list of all users
- Filter by role (student, agent, partner, staff, admin)
- Real-time search by name or email
- Display user information:
  - Name
  - Email
  - Role (with color-coded badges)
  - Active/Inactive status
  - Join date (relative time)

#### **Applications Tab**
- Sortable table of all applications
- Search functionality (student, program, or university)
- Filter by status
- **Update Status Dropdown**: Inline status updates for each application
- Status options:
  - Draft
  - Submitted
  - Screening
  - Conditional Offer
  - Unconditional Offer
  - CAS/LOA
  - Visa
  - Enrolled
  - Withdrawn
  - Deferred
- **Document Review Link**: Button to open application details in new tab
- Sortable columns (Date, Status)

#### **Payments Tab**
- Two sub-tabs: Payments and Commissions
- **Summary Cards**:
  - Total Revenue
  - Commissions Paid
  - Commissions Pending

**Payments Sub-tab:**
- List of all payment transactions
- Filter by status (pending, succeeded, failed, refunded)
- Search functionality
- Display: Student name, Purpose, Amount, Status, Date

**Commissions Sub-tab:**
- Commission management interface
- Filter by status (pending, approved, paid, clawback)
- Actions:
  - **Approve**: Mark pending commissions as approved
  - **Mark Paid**: Mark approved commissions as paid
- Display: Agent, Student, Level, Rate, Amount, Status

#### **Reports Tab**
- **CSV Export Functionality** for all data tables:
  1. Users Report
  2. Applications Report
  3. Payments Report
  4. Commissions Report
  5. Universities Report
  6. Programs Report

- Export features:
  - Real-time data export
  - Automatic filename with current date
  - Properly formatted CSV with headers
  - Handles special characters and commas
  - Compatible with Excel, Google Sheets, etc.

### 3. **Analytics Widgets**

Implemented in the Overview tab with visual representations:

1. **Top Performing Countries**
   - Lists top 5 countries by student count
   - Bar chart visualization
   - Ranked display with counts

2. **Top Performing Agents**
   - Lists top 5 agents by application count
   - Pie chart visualization
   - Color-coded segments

3. **Top Performing Programs**
   - Lists top 5 programs by application count
   - Ranked display with application counts

### 4. **Role-Based Access Control (RBAC)**

**Implementation Details:**
- Uses Supabase `user_roles` table
- Checks for admin or staff roles
- Automatic redirect for unauthorized users
- Protected route that verifies access on component mount

**Access Requirements:**
- User must have role: `admin` OR `staff`
- Non-admin/staff users are redirected to main dashboard

**Database Functions Used:**
- `has_role(user_id, role)`: Check if user has specific role
- `is_admin_or_staff(user_id)`: Verify admin/staff access
- Row Level Security (RLS) policies enforce access control

## Technical Stack

### Frontend
- **React 18**: Component framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI component library
- **Recharts**: Data visualization
- **date-fns**: Date formatting
- **React Router**: Navigation

### Backend
- **Supabase**: Database and authentication
- **PostgreSQL**: Database with RLS
- **Real-time subscriptions**: Live data updates

## File Structure

```
/workspace/src/
├── pages/dashboards/
│   └── AdminDashboard.tsx          # Main dashboard component
├── components/dashboard/
│   ├── OverviewTab.tsx             # Overview with analytics
│   ├── UsersTab.tsx                # User management
│   ├── ApplicationsTab.tsx         # Application management
│   ├── PaymentsTab.tsx             # Payments & commissions
│   └── ReportsTab.tsx              # CSV export functionality
```

## Database Schema

### Key Tables Used:
- `profiles`: User information and roles
- `user_roles`: Role assignments (supports multiple roles)
- `students`: Student records
- `agents`: Agent records
- `applications`: Application records
- `payments`: Payment transactions
- `commissions`: Commission records
- `universities`: University partners
- `programs`: Academic programs

### Access Control:
All tables have RLS policies that check:
1. User authentication
2. Role permissions
3. Data ownership/association

## Usage

### Accessing the Dashboard

1. Navigate to `/admin-dashboard`
2. Must be logged in with admin or staff role
3. Automatic access verification on page load
4. Unauthorized users are redirected

### Key Operations

**Managing Users:**
1. Go to Users tab
2. Search by name/email
3. Filter by role
4. View user details and status

**Managing Applications:**
1. Go to Applications tab
2. Search/filter applications
3. Click status dropdown to update
4. Click "Review" button to view details

**Managing Payments:**
1. Go to Payments tab
2. Switch between Payments/Commissions
3. Search and filter transactions
4. Approve or mark commissions as paid

**Generating Reports:**
1. Go to Reports tab
2. Select report type
3. Click export button
4. CSV file downloads automatically

## Security Features

1. **Authentication Required**: All routes protected
2. **Role Verification**: Admin/staff access only
3. **RLS Policies**: Database-level security
4. **Prepared Statements**: SQL injection prevention
5. **Input Validation**: Client-side validation
6. **Secure API Calls**: Supabase client with auth

## Performance Optimizations

1. **Lazy Loading**: Components load on demand
2. **Memoization**: Prevent unnecessary re-renders
3. **Efficient Queries**: Optimized database queries
4. **Index Usage**: Database indexes on key columns
5. **Pagination Ready**: Structure supports pagination

## Future Enhancements

Potential additions:
1. Advanced filtering (date ranges, multi-select)
2. Bulk operations
3. Data visualization dashboard
4. Real-time notifications
5. Audit log viewer
6. User activity tracking
7. Advanced analytics
8. Export to Excel/PDF
9. Scheduled reports
10. Email notifications

## Troubleshooting

### Common Issues:

**Issue**: Can't access dashboard
- **Solution**: Verify user has admin or staff role in `user_roles` table

**Issue**: Data not loading
- **Solution**: Check Supabase connection and RLS policies

**Issue**: CSV export not working
- **Solution**: Check browser popup blocker settings

**Issue**: Charts not displaying
- **Solution**: Ensure recharts is installed: `npm install recharts`

## API Endpoints

The dashboard uses Supabase client for all data operations:

```typescript
// Example queries
supabase.from('profiles').select('*')
supabase.from('applications').update({ status: 'submitted' })
supabase.from('payments').select('*').eq('status', 'succeeded')
```

## Support

For issues or questions:
1. Check database RLS policies
2. Verify user roles in Supabase
3. Check browser console for errors
4. Review Supabase logs

---

**Built with** ❤️ **for UniDoxia**
