import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FilterOptions {
  countries: string[];
  levels: string[];
  disciplines: string[];
  tuition_range: {
    min: number;
    max: number;
    currency: string;
  };
  duration_range: {
    min: number;
    max: number;
  };
}

export interface ActiveFilters {
  countries: string[];
  levels: string[];
  tuitionRange: [number, number];
  durationRange: [number, number];
  intakeMonths: number[];
}

interface FiltersBarProps {
  filterOptions: FilterOptions | null;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  onReset: () => void;
}

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function FiltersBar({ 
  filterOptions, 
  activeFilters, 
  onFiltersChange,
  onReset 
}: FiltersBarProps) {
  const hasActiveFilters = 
    activeFilters.countries.length > 0 ||
    activeFilters.levels.length > 0 ||
    activeFilters.intakeMonths.length > 0 ||
    (filterOptions?.tuition_range && 
      (activeFilters.tuitionRange[0] !== filterOptions.tuition_range.min ||
       activeFilters.tuitionRange[1] !== filterOptions.tuition_range.max)) ||
    (filterOptions?.duration_range &&
      (activeFilters.durationRange[0] !== filterOptions.duration_range.min ||
       activeFilters.durationRange[1] !== filterOptions.duration_range.max));

  const toggleCountry = (country: string) => {
    const newCountries = activeFilters.countries.includes(country)
      ? activeFilters.countries.filter(c => c !== country)
      : [...activeFilters.countries, country];
    onFiltersChange({ ...activeFilters, countries: newCountries });
  };

  const toggleLevel = (level: string) => {
    const newLevels = activeFilters.levels.includes(level)
      ? activeFilters.levels.filter(l => l !== level)
      : [...activeFilters.levels, level];
    onFiltersChange({ ...activeFilters, levels: newLevels });
  };

  const toggleIntakeMonth = (month: number) => {
    const newMonths = activeFilters.intakeMonths.includes(month)
      ? activeFilters.intakeMonths.filter(m => m !== month)
      : [...activeFilters.intakeMonths, month];
    onFiltersChange({ ...activeFilters, intakeMonths: newMonths });
  };

  if (!filterOptions) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Loading filters...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator />

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <CardContent className="pt-4 space-y-6">
          {/* Country Filter */}
          {filterOptions.countries && filterOptions.countries.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Country</Label>
              <div className="space-y-2">
                {filterOptions.countries.map((country) => (
                  <div key={country} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${country}`}
                      checked={activeFilters.countries.includes(country)}
                      onCheckedChange={() => toggleCountry(country)}
                    />
                    <label
                      htmlFor={`country-${country}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {country}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Degree Level Filter */}
          {filterOptions.levels && filterOptions.levels.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Degree Level</Label>
              <div className="space-y-2">
                {filterOptions.levels.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={activeFilters.levels.includes(level)}
                      onCheckedChange={() => toggleLevel(level)}
                    />
                    <label
                      htmlFor={`level-${level}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Tuition Range Filter */}
          {filterOptions.tuition_range && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tuition Range</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {filterOptions.tuition_range.currency}{' '}
                    {activeFilters.tuitionRange[0].toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {filterOptions.tuition_range.currency}{' '}
                    {activeFilters.tuitionRange[1].toLocaleString()}
                  </span>
                </div>
                <Slider
                  min={filterOptions.tuition_range.min}
                  max={filterOptions.tuition_range.max}
                  step={1000}
                  value={activeFilters.tuitionRange}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...activeFilters,
                      tuitionRange: value as [number, number],
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Duration Filter */}
          {filterOptions.duration_range && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Duration (Months)</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {activeFilters.durationRange[0]} months
                  </span>
                  <span className="text-muted-foreground">
                    {activeFilters.durationRange[1]} months
                  </span>
                </div>
                <Slider
                  min={filterOptions.duration_range.min}
                  max={filterOptions.duration_range.max}
                  step={1}
                  value={activeFilters.durationRange}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...activeFilters,
                      durationRange: value as [number, number],
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Intake Date Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Intake Months</Label>
            <div className="flex flex-wrap gap-2">
              {MONTH_OPTIONS.map((month) => (
                <Badge
                  key={month.value}
                  variant={
                    activeFilters.intakeMonths.includes(month.value)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer hover:bg-primary/90 transition-colors"
                  onClick={() => toggleIntakeMonth(month.value)}
                >
                  {month.label.substring(0, 3)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
