# Agent Dashboard - Complete Guide

## Overview

The Agent Dashboard has been completely redesigned and optimized for speed, clarity, and ease of management. It provides comprehensive tools for agents to track their students, manage applications, monitor commissions, and grow their business.

## Key Features

### 1. **Overview Cards** (At-a-Glance Metrics)

Four key performance indicators displayed prominently at the top:

- **Total Students**: Number of unique students recruited by the agent
- **Active Applications**: Applications currently in progress (not withdrawn, rejected, or enrolled)
- **Commissions Earned**: Total amount of commissions that have been paid out
- **Pending Payouts**: Approved commissions ready for withdrawal

### 2. **Quick Actions Section**

Convenient buttons for common tasks:

- **Invite Student**: Quickly invite a new student to the platform
- **Add Application**: Start a new application for a student
- **View Commission Report**: Access detailed commission analytics

### 3. **Referral Link Generator**

- **Unique Tracking ID**: Each agent receives a unique referral code (format: `AG-XXXXXXXX`)
- **Copy Functionality**: One-click copy of the full referral URL
- **Visual Feedback**: Check icon confirms successful copy
- **Automatic Generation**: Referral codes are automatically created if they don't exist
- **Example**: `https://your-domain.com/signup?ref=AG-ABC123XY`

### 4. **Monthly Earnings Trend Graph**

- **Interactive Chart**: Built with Recharts for smooth, responsive visualization
- **6-Month History**: Shows earnings trend over the last 6 months
- **Tooltip Information**: Hover to see detailed earnings for each month
- **Visual Design**: Clean line chart with grid for easy reading

### 5. **Commission Summary Card**

- **Total Unpaid Earnings**: Prominently displayed amount ready for payout
- **Request Payout Button**: One-click payout request submission
- **Processing Information**: Clear notice about 5-7 business day processing time
- **Disabled State**: Button disabled when no funds available

### 6. **Referred Students Table**

Comprehensive table showing all referred students with:

#### Columns:
- **Name**: Student full name
- **Email**: Student contact email
- **Program**: Program name and university
- **Status**: Visual status badge (Draft, Submitted, Screening, Offers, Enrolled, etc.)
- **Commission**: Commission amount earned from each student

#### Filtering & Search Features:
- **Search Bar**: Search by name, email, program, or university
- **Status Filter**: Filter by application status
- **Real-time Updates**: Results update instantly as you type
- **Empty States**: Helpful messages when no results are found

## Technical Architecture

### Component Structure

```
AgentDashboardOverview.tsx
├── Overview Cards (4 cards)
├── Quick Actions Section
├── Referral Link Generator
├── Monthly Earnings Graph (Recharts)
├── Commission Summary Card
└── Referred Students Table
    ├── Search Input
    ├── Status Filter
    └── Data Table
```

### Database Integration

The dashboard integrates with the following Supabase tables:

- **agents**: Agent profile and commission rates
- **applications**: Student applications with status
- **students**: Student information
- **programs**: Program details
- **universities**: University information
- **commissions**: Commission records and status
- **referrals**: Agent referral codes and tracking

### Data Flow

1. **On Load**: Fetches agent ID using current profile
2. **Referral Code**: Retrieves or creates unique referral code
3. **Applications Data**: Fetches all applications with related student, program, and university data
4. **Commissions Data**: Fetches commission records for calculations
5. **Stats Calculation**: Computes real-time statistics
6. **Monthly Trends**: Aggregates commission data by month
7. **Student List**: Combines application and commission data for table display

## Performance Optimizations

### Speed Features:

1. **Parallel Queries**: All data fetched simultaneously when possible
2. **Single Database Round-trip**: Nested queries reduce database calls
3. **Efficient Filtering**: Client-side filtering for instant results
4. **Memoized Callbacks**: useCallback prevents unnecessary re-renders
5. **Skeleton Loading**: Smooth loading states for better UX

### Clarity Features:

1. **Visual Hierarchy**: Clear separation of sections
2. **Color Coding**: Status badges with intuitive colors
3. **Icons**: Lucide icons for quick visual recognition
4. **Responsive Design**: Works on mobile, tablet, and desktop
5. **Hover Effects**: Interactive feedback on clickable elements

## Usage Examples

### Accessing the Dashboard

```typescript
// Navigate to agent dashboard
navigate('/dashboard')

// Dashboard loads on the "overview" tab by default
// URL: /dashboard or /dashboard/overview
```

### Copying Referral Link

```typescript
// Click the copy button next to referral link
// Link is copied to clipboard
// Success toast appears
// Button shows check icon for 2 seconds
```

### Filtering Students

```typescript
// Type in search box: real-time filtering
setSearchTerm('john@example.com')

// Select status filter: instant results
setStatusFilter('submitted')

// Clear filters: show all students
setSearchTerm('')
setStatusFilter('all')
```

### Requesting Payout

```typescript
// Button only enabled when pendingPayouts > 0
// Click "Request Payout" button
// Toast confirmation appears
// Payout request submitted to system
```

## Status Badge Colors

- **Draft**: Gray (neutral)
- **Submitted**: Blue (info)
- **Screening**: Yellow (warning)
- **Conditional Offer**: Orange (attention)
- **Unconditional Offer**: Green (success)
- **Enrolled**: Dark Green (completed)
- **Withdrawn**: Red (destructive)
- **Rejected**: Red (destructive)

## Commission Status Flow

1. **Pending**: Application submitted, commission not yet approved
2. **Approved**: Commission approved, ready for payout
3. **Paid**: Commission paid to agent
4. **Clawback**: Commission reversed (rare cases)

## Future Enhancements

Potential improvements for future versions:

1. **Export Functionality**: CSV/PDF export of student data
2. **Bulk Actions**: Select multiple students for batch operations
3. **Advanced Analytics**: More detailed charts and insights
4. **Email Integration**: Send invitations directly from Quick Actions
5. **Real-time Notifications**: WebSocket updates for new applications
6. **Commission Calculator**: Preview potential earnings
7. **Custom Date Ranges**: Filter monthly earnings by date range
8. **Student Notes**: Add private notes visible only to agent
9. **Application Progress**: Timeline view of each application
10. **Performance Goals**: Set and track monthly targets

## Integration Points

### With Other Agent Dashboard Tabs

The Overview tab works alongside:

- **Applications Tab**: Detailed application management
- **Leads Tab**: Lead management and tracking
- **Tasks Tab**: Task assignment and completion
- **Ranking Tab**: Preference ranking for students
- **Commissions Tab**: Detailed commission tracking
- **Import Tab**: Bulk import of student data
- **Resources Tab**: Training materials and resources

### With Global Navigation

- **Dashboard Layout**: Integrated into main dashboard layout
- **Back Button**: Navigate back to previous page
- **Theme Toggle**: Respects light/dark mode preferences
- **Profile Menu**: Access to account settings

## Troubleshooting

### Common Issues

**Issue**: Referral code not generating
- **Solution**: Check database permissions for referrals table
- **Solution**: Verify agent record exists in agents table

**Issue**: No students showing in table
- **Solution**: Verify agent_id is correctly set on applications
- **Solution**: Check RLS policies for applications table

**Issue**: Commission amounts showing as $0
- **Solution**: Ensure commissions table has records for applications
- **Solution**: Verify commission status is not 'clawback'

**Issue**: Monthly chart is empty
- **Solution**: Check that commissions have status 'paid'
- **Solution**: Verify commission created_at dates are recent

## API Endpoints Used

```typescript
// Get agent by profile ID
supabase.from('agents').select('id').eq('profile_id', profileId)

// Get/create referral code
supabase.from('referrals').select('code').eq('agent_id', agentId)
supabase.from('referrals').insert({ code, agent_id, active: true })

// Get applications with nested data
supabase.from('applications').select(`
  id, status, created_at,
  student:students (id, profiles:profiles (full_name, email)),
  program:programs (name, university:universities (name))
`).eq('agent_id', agentId)

// Get commissions
supabase.from('commissions').select('*').eq('agent_id', agentId)
```

## Styling & Theming

The dashboard uses:

- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Consistent component library
- **Responsive Grid**: Mobile-first responsive design
- **Dark Mode Support**: Automatic theme switching
- **Custom Colors**: Brand colors from theme configuration

## Accessibility

- **Keyboard Navigation**: All interactive elements keyboard accessible
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Indicators**: Clear focus states for navigation
- **Color Contrast**: WCAG AA compliant color contrast
- **Responsive Text**: Readable font sizes across devices

## Conclusion

The Agent Dashboard provides a comprehensive, fast, and intuitive interface for agents to manage their business. With real-time data, powerful filtering, and clear visualizations, agents can quickly understand their performance and take action to grow their student base.

For technical support or feature requests, please contact the development team.
