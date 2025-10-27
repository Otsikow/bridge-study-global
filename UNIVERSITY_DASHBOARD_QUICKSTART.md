# University Dashboard - Quick Start Guide

## 🚀 Access the Dashboard

**URL**: `/university/dashboard`

**Allowed Roles**: 
- `partner` (university partners)
- `admin` (platform administrators)
- `staff` (staff members)

## 📊 Dashboard Overview

### At a Glance
When you open the dashboard, you'll see:
1. **Header**: University logo, name, location, and website
2. **Quick Stats**: Total programs, applications, and agents
3. **Two Charts**: Application sources by country & Acceptance rate
4. **Three Tabs**: Applications, Courses, and Agents

## 🎯 Main Features

### 1️⃣ Applications Tab
**View and filter all applications to your university**

**Filters Available:**
- 🔍 Search by student name or app number
- 📚 Filter by program
- 📋 Filter by status (draft, submitted, screening, offers, etc.)

**Information Shown:**
- Application number
- Student name and nationality
- Program and level
- Current status (color-coded)
- Submission date

### 2️⃣ Courses Tab
**Manage your university's course offerings**

**Features:**
- ➕ **Add New Course** button (opens detailed form)
- 📋 View all active and inactive programs
- ✏️ Activate/Deactivate courses
- 🗑️ Delete courses (with confirmation)

**Add Course Form Includes:**
- Course name ⭐ (required)
- Level: Bachelor, Master, PhD, Diploma, Certificate ⭐
- Discipline ⭐ (e.g., Computer Science)
- Duration in months ⭐
- Tuition amount and currency ⭐ (USD, GBP, EUR, CAD, AUD)
- IELTS requirement (optional)
- TOEFL requirement (optional)
- Course description (optional)

### 3️⃣ Agents Tab
**Track agents referring students to your university**

**Information Shown:**
- Company name
- Contact person
- Email (click to send email)
- Total referrals count

## 📈 Analytics Charts

### Application Sources Chart (Pie)
- Shows top 8 countries sending applications
- Based on student nationality
- Interactive with percentages

### Acceptance Rate Chart (Bar)
- Overall acceptance rate percentage
- Breakdown by status:
  - ✅ Accepted (green)
  - ⏳ Pending (orange)
  - 📝 Other (gray)

## 💡 Tips

### Adding Your First Course
1. Click "Courses" tab
2. Click "Post New Course" button
3. Fill in required fields (marked with ⭐)
4. Click "Add Course"
5. ✅ Success! Course appears in the list

### Filtering Applications
1. Click "Applications" tab
2. Use search box for quick student lookup
3. Select program from dropdown to see program-specific applications
4. Select status to filter by application stage
5. Filters work together (AND logic)

### Managing Course Status
1. Find the course in the Courses tab
2. Click "Activate" or "Deactivate" button
3. ✅ Status updates immediately
4. Inactive courses won't show in student search

### Viewing Agent Performance
1. Click "Agents" tab
2. See referral counts for each agent
3. Click email to contact them directly
4. Sort by clicking column headers

## 🎨 Understanding Status Colors

**Application Statuses:**
- 🔵 Draft - Not yet submitted
- 🟡 Submitted - Awaiting review
- 🟠 Screening - Under review
- 🟢 Conditional Offer - Offer with conditions
- 🟢 Unconditional Offer - Full acceptance
- 🔵 CAS/LOA - Documentation stage
- 🟣 Visa - Visa processing
- ✅ Enrolled - Student enrolled
- ⚪ Withdrawn - Application withdrawn

**Course Status:**
- 🟢 Active - Currently available
- ⚪ Inactive - Not accepting applications

## 🔄 Real-time Updates

The dashboard automatically:
- Refreshes data after any operation
- Shows loading states during data fetch
- Displays success/error messages
- Maintains your filter selections

## 📱 Responsive Design

Works on:
- 💻 Desktop computers
- 📱 Tablets
- 📱 Mobile phones

## ⚡ Quick Actions

| What | How |
|------|-----|
| Add course | Courses tab → "Post New Course" button |
| Search student | Applications tab → Search box |
| Filter by program | Applications tab → Program dropdown |
| Deactivate course | Courses tab → "Deactivate" button |
| Delete course | Courses tab → Trash icon (confirms first) |
| Email agent | Agents tab → Click email address |
| View acceptance rate | Check Acceptance Rate chart |
| See top countries | Check Application Sources chart |

## 🆘 Troubleshooting

**Problem**: No data showing
- ✅ Ensure your university has programs added
- ✅ Check applications are linked to your programs
- ✅ Verify you're logged in with correct role

**Problem**: Can't add course
- ✅ Fill all required fields (marked with ⭐)
- ✅ Enter valid numbers for tuition/duration
- ✅ Try refreshing the page

**Problem**: Charts are empty
- ✅ Need at least one application to show data
- ✅ Students need nationality filled in
- ✅ Check if applications exist in database

**Problem**: "No University Found" message
- ✅ Contact admin to set up university profile
- ✅ Verify you have partner role
- ✅ Check tenant_id configuration

## 📞 Support

For technical issues or questions:
- 📧 Contact platform administrator
- 📖 See full documentation: `UNIVERSITY_DASHBOARD.md`
- 🐛 Report bugs to development team

## 🎓 Best Practices

1. **Keep courses updated**
   - Deactivate courses that are full or no longer offered
   - Update tuition fees regularly
   - Add detailed descriptions

2. **Monitor applications**
   - Check dashboard daily
   - Use filters to prioritize urgent applications
   - Track acceptance rate trends

3. **Engage with agents**
   - Contact high-performing agents
   - Share updates about new programs
   - Build relationships for better referrals

4. **Use analytics**
   - Note which countries send most applications
   - Adjust marketing based on source countries
   - Track conversion rates over time

## ✅ Checklist for New Users

- [ ] Log in with partner account
- [ ] View your university information
- [ ] Browse the Applications tab
- [ ] Add your first course
- [ ] Activate the course
- [ ] Check the analytics charts
- [ ] Review connected agents
- [ ] Bookmark the dashboard URL

---

**Questions?** See the full documentation in `UNIVERSITY_DASHBOARD.md`

**Ready to get started?** Visit `/university/dashboard` now! 🚀
