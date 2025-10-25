import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, DollarSign, Clock, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Course {
  id: string;
  name: string;
  level: string;
  discipline: string;
  duration_months: number;
  tuition_currency: string;
  tuition_amount: number;
  intake_months?: number[];
  university_name: string;
  university_country: string;
  university_city: string;
  university_logo_url?: string;
  next_intake_month?: number;
  next_intake_year?: number;
}

interface CourseCardProps {
  course: Course;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();

  const handleApplyNow = () => {
    navigate(`/student/applications/new?program=${course.id}`);
  };

  const getNextIntakeDisplay = () => {
    if (course.next_intake_month && course.next_intake_year) {
      return `${MONTH_NAMES[course.next_intake_month - 1]} ${course.next_intake_year}`;
    }
    return 'Contact for dates';
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <CardContent className="pt-6 pb-4 flex-1">
        {/* University Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border">
            {course.university_logo_url ? (
              <img 
                src={course.university_logo_url} 
                alt={course.university_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-muted-foreground truncate">
              {course.university_name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {course.university_city}, {course.university_country}
              </span>
            </div>
          </div>
        </div>

        {/* Course Title */}
        <h2 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {course.name}
        </h2>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-xs">
            {course.level}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {course.discipline}
          </Badge>
        </div>

        {/* Course Details */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold text-foreground">
              {course.tuition_currency} {course.tuition_amount.toLocaleString()}
            </span>
            <span className="text-xs">/ year</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {course.duration_months} months
              {course.duration_months >= 12 && (
                <span className="text-xs ml-1">
                  ({Math.floor(course.duration_months / 12)}
                  {course.duration_months % 12 > 0 && `.${Math.round((course.duration_months % 12) / 12 * 10)}`} years)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <div className="flex items-center gap-2">
              <span>Next intake:</span>
              <span className="font-medium text-foreground">
                {getNextIntakeDisplay()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-6">
        <Button 
          onClick={handleApplyNow}
          className="w-full group-hover:shadow-md transition-shadow"
          size="lg"
        >
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
}
