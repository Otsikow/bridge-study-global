import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseCard, Course } from '@/components/student/CourseCard';
import { FiltersBar, FilterOptions, ActiveFilters } from '@/components/student/FiltersBar';
import { LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/useDebounce';

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
  { value: 'tuition:asc', label: 'Lowest Tuition' },
  { value: 'tuition:desc', label: 'Highest Tuition' },
  { value: 'intake:asc', label: 'Soonest Intake' },
  { value: 'duration:asc', label: 'Shortest Duration' },
  { value: 'duration:desc', label: 'Longest Duration' },
];

export default function CourseDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name:asc');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    countries: [],
    levels: [],
    tuitionRange: [0, 100000],
    durationRange: [0, 60],
    intakeMonths: [],
  });

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch filter options (STUB - requires get_program_filter_options function)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single();

      if (!profile) return;

      // Set default filter options
      const defaultOptions: FilterOptions = {
        countries: [],
        levels: [],
        disciplines: [],
        tuition_range: { min: 0, max: 100000, currency: 'USD' },
        duration_range: { min: 0, max: 60 },
      };
      
      setFilterOptions(defaultOptions);
      setActiveFilters(prev => ({
        ...prev,
        tuitionRange: [0, 100000],
        durationRange: [0, 60],
      }));
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter options',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Fetch courses (STUB - requires search_programs function)
  const fetchCourses = useCallback(async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setCurrentPage(0);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single();

      if (!profile) return;

      // Use simple query instead of non-existent RPC function
      let query = supabase
        .from('programs')
        .select(`
          id,
          name,
          level,
          discipline,
          duration_months,
          tuition_currency,
          tuition_amount,
          intake_months,
          universities (
            name,
            country,
            city,
            logo_url
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('active', true);

      // Apply search
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,discipline.ilike.%${debouncedSearchQuery}%`);
      }

      // Apply filters
      if (activeFilters.countries.length > 0) {
        // Can't easily filter by universities.country in this query structure
      }
      if (activeFilters.levels.length > 0) {
        query = query.in('level', activeFilters.levels);
      }

      const { data, error } = await query.range(
        append ? (currentPage + 1) * ITEMS_PER_PAGE : 0,
        append ? ((currentPage + 1) + 1) * ITEMS_PER_PAGE - 1 : ITEMS_PER_PAGE - 1
      );

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        const transformedCourses: Course[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          level: item.level,
          discipline: item.discipline,
          duration_months: item.duration_months,
          tuition_currency: item.tuition_currency,
          tuition_amount: item.tuition_amount,
          intake_months: item.intake_months,
          university_name: item.universities?.name || '',
          university_country: item.universities?.country || '',
          university_city: item.universities?.city || '',
          university_logo_url: item.universities?.logo_url || null,
          next_intake_month: item.intake_months?.[0] || 1,
          next_intake_year: new Date().getFullYear(),
        }));

        if (append) {
          setCourses(prev => [...prev, ...transformedCourses]);
          setCurrentPage(prev => prev + 1);
        } else {
          setCourses(transformedCourses);
          setCurrentPage(0);
        }

        setTotalCount(data.length);
      } else {
        if (!append) {
          setCourses([]);
          setTotalCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [
    user?.id,
    debouncedSearchQuery,
    activeFilters,
    filterOptions,
    sortBy,
    currentPage,
    toast,
  ]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchFilterOptions();
    }
  }, [user, fetchFilterOptions]);

  // Fetch courses when dependencies change
  useEffect(() => {
    if (filterOptions && user) {
      fetchCourses(false);
    }
  }, [debouncedSearchQuery, activeFilters, sortBy, filterOptions]);

  const handleLoadMore = () => {
    fetchCourses(true);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      countries: [],
      levels: [],
      tuitionRange: [
        filterOptions?.tuition_range?.min || 0,
        filterOptions?.tuition_range?.max || 100000,
      ],
      durationRange: [
        filterOptions?.duration_range?.min || 0,
        filterOptions?.duration_range?.max || 60,
      ],
      intakeMonths: [],
    });
  };

  const hasMoreResults = courses.length < totalCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Discover Your Perfect Course</h1>
              <p className="text-muted-foreground mt-1">
                Explore programs from top universities worldwide
              </p>
            </div>

            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses or universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mobile Filter Button */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full sm:w-[400px] p-0">
                    <SheetHeader className="p-6 pb-0">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FiltersBar
                        filterOptions={filterOptions}
                        activeFilters={activeFilters}
                        onFiltersChange={setActiveFilters}
                        onReset={handleResetFilters}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Results count */}
            {!loading && (
              <div className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{totalCount}</span> course
                {totalCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <FiltersBar
              filterOptions={filterOptions}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Courses Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingState message="Loading courses..." />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters to find more results
                </p>
                <Button onClick={handleResetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMoreResults && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      size="lg"
                      variant="outline"
                    >
                      {loadingMore ? (
                        <>
                          <LoadingState size="sm" className="mr-2" />
                          Loading...
                        </>
                      ) : (
                        `Load More (${totalCount - courses.length} remaining)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
