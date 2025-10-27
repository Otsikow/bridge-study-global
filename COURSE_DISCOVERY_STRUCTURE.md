# Course Discovery - Component Structure

## File Structure

```
/workspace/
├── supabase/
│   └── migrations/
│       └── 20251025000000_course_discovery_rpc.sql    # Database RPC functions
│
├── src/
│   ├── components/
│   │   ├── student/
│   │   │   ├── CourseCard.tsx          # Individual course card
│   │   │   └── FiltersBar.tsx          # Sidebar filters component
│   │   └── layout/
│   │       └── AppSidebar.tsx          # Updated with "Discover Courses" link
│   │
│   ├── hooks/
│   │   └── useDebounce.ts              # Debounce utility hook
│   │
│   ├── pages/
│   │   ├── CourseDiscovery.tsx         # Main course discovery page
│   │   ├── Index.tsx                   # Updated homepage with CTA
│   │   └── student/
│   │       └── NewApplication.tsx      # Pre-filled application form
│   │
│   └── App.tsx                         # Updated routing
│
└── COURSE_DISCOVERY_IMPLEMENTATION.md  # This documentation
```

## Component Hierarchy

```
CourseDiscovery (Page)
├── Header Section
│   ├── Title & Description
│   ├── Search Bar (with debounce)
│   ├── Sort Dropdown
│   └── Mobile Filter Button
│
├── Main Content (Flexbox)
│   ├── FiltersBar (Sidebar - Desktop)
│   │   ├── Country Filter (Checkboxes)
│   │   ├── Degree Level Filter (Checkboxes)
│   │   ├── Tuition Range (Dual Slider)
│   │   ├── Duration Range (Slider)
│   │   └── Intake Months (Badge Toggles)
│   │
│   └── Results Section
│       ├── Results Count
│       ├── Course Grid (Responsive)
│       │   └── CourseCard (Multiple)
│       │       ├── University Logo & Info
│       │       ├── Course Title
│       │       ├── Badges (Level, Discipline)
│       │       ├── Details (Tuition, Duration, Intake)
│       │       └── "Apply Now" Button
│       │
│       ├── Empty State (if no results)
│       └── Load More Button (if has more)
│
└── Mobile Filter Sheet (Mobile Only)
    └── FiltersBar (Drawer)
```

## Data Flow Diagram

```
┌─────────────────┐
│  User Actions   │
│  - Search       │
│  - Filter       │
│  - Sort         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   useDebounce   │ (500ms delay for search)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Supabase RPC Function           │
│   search_programs(filters, sort, page)  │
│   - Full-text search                    │
│   - Multi-criteria filtering            │
│   - Sorting & pagination                │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Course Data    │
│  - Programs     │
│  - Universities │
│  - Total count  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CourseCard[]   │ (Rendered in grid)
└────────┬────────┘
         │
         ▼ (User clicks "Apply Now")
┌─────────────────────────────────┐
│     NewApplication Page         │
│  /student/applications/new      │
│  ?program={id}                  │
│  - Auto-loads program details   │
│  - Pre-fills form               │
└─────────────────────────────────┘
```

## State Management

```typescript
// CourseDiscovery.tsx State
{
  // Search & Filters
  searchQuery: string,
  sortBy: string,
  activeFilters: {
    countries: string[],
    levels: string[],
    tuitionRange: [number, number],
    durationRange: [number, number],
    intakeMonths: number[]
  },
  
  // Data
  courses: Course[],
  totalCount: number,
  currentPage: number,
  filterOptions: FilterOptions | null,
  
  // UI State
  loading: boolean,
  loadingMore: boolean,
  mobileFiltersOpen: boolean
}
```

## Key Interactions

### 1. Search Flow
```
User types → useDebounce (500ms) → fetchCourses() → RPC call → Update results
```

### 2. Filter Flow
```
User toggles filter → setActiveFilters() → fetchCourses() → Update results
```

### 3. Pagination Flow
```
User clicks "Load More" → fetchCourses(append=true) → Append to existing results
```

### 4. Apply Flow
```
User clicks "Apply Now" → navigate(/student/applications/new?program=ID) → 
NewApplication loads → Fetches program data → Pre-fills form
```

## Responsive Breakpoints

| Screen Size | Grid Columns | Sidebar | Filters |
|-------------|-------------|---------|---------|
| < 768px     | 1           | Hidden  | Drawer  |
| 768-1023px  | 2           | Hidden  | Drawer  |
| ≥ 1024px    | 3           | Visible | Sidebar |

## API Endpoints (Supabase RPC)

### `search_programs`
**Parameters:**
```typescript
{
  p_tenant_id: UUID,
  p_search_query?: string,
  p_countries?: string[],
  p_levels?: string[],
  p_min_tuition?: number,
  p_max_tuition?: number,
  p_min_duration?: number,
  p_max_duration?: number,
  p_intake_months?: number[],
  p_sort_by?: string,
  p_sort_order?: string,
  p_limit?: number,
  p_offset?: number
}
```

**Returns:**
```typescript
{
  id: UUID,
  name: string,
  level: string,
  discipline: string,
  duration_months: number,
  tuition_currency: string,
  tuition_amount: number,
  intake_months: number[],
  university_name: string,
  university_country: string,
  university_city: string,
  university_logo_url: string,
  next_intake_month: number,
  next_intake_year: number,
  total_count: number
}[]
```

### `get_program_filter_options`
**Parameters:**
```typescript
{
  p_tenant_id: UUID
}
```

**Returns:**
```typescript
{
  countries: string[],
  levels: string[],
  disciplines: string[],
  tuition_range: {
    min: number,
    max: number,
    currency: string
  },
  duration_range: {
    min: number,
    max: number
  }
}
```

## Performance Considerations

1. **Debouncing**: Search input is debounced to prevent excessive API calls
2. **Lazy Loading**: Results are paginated (12 per page)
3. **Memoization Ready**: Components are structured for React.memo optimization
4. **Indexed Queries**: Database queries use indexes for fast filtering
5. **Single RPC Call**: All filters are applied in one database query

## Accessibility Features

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management in mobile drawer
- Screen reader friendly labels
- Semantic HTML structure

---

**Quick Start Testing:**

1. Navigate to `/courses`
2. Try searching for "computer science"
3. Apply country filter
4. Adjust tuition range
5. Click "Apply Now" on a course
6. Verify application form is pre-filled
