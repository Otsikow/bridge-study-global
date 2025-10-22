import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Lightbulb, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  FileText,
  GraduationCap,
  DollarSign,
  Globe,
  Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  id: string;
  type: 'reminder' | 'tip' | 'action' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  action_url?: string;
  action_text?: string;
  created_at: string;
  expires_at?: string;
}

interface ProactiveAssistantProps {
  studentId?: string;
}

export default function ProactiveAssistant({ studentId }: ProactiveAssistantProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user, studentId]);

  const fetchSuggestions = async () => {
    // Mock data - in real implementation, this would use AI to generate personalized suggestions
    const mockSuggestions: Suggestion[] = [
      {
        id: '1',
        type: 'reminder',
        title: 'Application Deadline Approaching',
        description: 'Your application to University of Toronto is due in 5 days. Make sure all documents are uploaded.',
        priority: 'high',
        category: 'Application',
        action_url: '/student/applications',
        action_text: 'Review Application',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'tip',
        title: 'Improve Your Profile Completeness',
        description: 'Adding your IELTS scores and work experience could increase your chances of acceptance by 25%.',
        priority: 'medium',
        category: 'Profile',
        action_url: '/student/profile',
        action_text: 'Update Profile',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'New Scholarship Available',
        description: 'The International Excellence Scholarship is now open for applications. You meet 8/10 criteria.',
        priority: 'high',
        category: 'Scholarship',
        action_url: '/scholarships',
        action_text: 'Apply Now',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'action',
        title: 'Practice for Upcoming Interview',
        description: 'You have an interview with McGill University in 3 days. Practice with our AI interview tool.',
        priority: 'high',
        category: 'Interview',
        action_url: '/interview-practice',
        action_text: 'Start Practice',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        type: 'tip',
        title: 'Consider Additional Programs',
        description: 'Based on your profile, you might also be interested in these similar programs in Canada.',
        priority: 'low',
        category: 'Recommendation',
        action_url: '/search',
        action_text: 'Explore Programs',
        created_at: new Date().toISOString()
      },
      {
        id: '6',
        type: 'reminder',
        title: 'Visa Application Timeline',
        description: 'Start preparing your visa documents 3 months before your program starts. You have 2 months left.',
        priority: 'medium',
        category: 'Visa',
        action_url: '/visa-guide',
        action_text: 'View Guide',
        created_at: new Date().toISOString()
      }
    ];

    // Simulate AI processing delay
    setTimeout(() => {
      setSuggestions(mockSuggestions);
      setLoading(false);
    }, 1000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return Clock;
      case 'tip': return Lightbulb;
      case 'action': return CheckCircle;
      case 'opportunity': return TrendingUp;
      default: return Bot;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder': return 'bg-warning-light text-warning dark:bg-warning/20';
      case 'tip': return 'bg-info-light text-info dark:bg-info/20';
      case 'action': return 'bg-success-light text-success dark:bg-success/20';
      case 'opportunity': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Application': return FileText;
      case 'Profile': return GraduationCap;
      case 'Scholarship': return DollarSign;
      case 'Interview': return Bot;
      case 'Recommendation': return Globe;
      case 'Visa': return Globe;
      default: return Bell;
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast({
      title: 'Suggestion dismissed',
      description: 'This suggestion has been removed from your feed'
    });
  };

  const handleAction = (suggestion: Suggestion) => {
    if (suggestion.action_url) {
      // In a real app, this would navigate to the URL
      toast({
        title: 'Action taken',
        description: `Redirecting to ${suggestion.action_text}`
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <CardDescription>Analyzing your profile for personalized suggestions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
  const otherSuggestions = suggestions.filter(s => s.priority !== 'high');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
        <CardDescription>
          Personalized suggestions and reminders to help you succeed in your study abroad journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No new suggestions at the moment. Check back later for personalized tips.</p>
          </div>
        ) : (
          <>
            {/* High Priority Suggestions */}
            {highPrioritySuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  High Priority ({highPrioritySuggestions.length})
                </h4>
                {highPrioritySuggestions.map((suggestion) => {
                  const TypeIcon = getTypeIcon(suggestion.type);
                  const CategoryIcon = getCategoryIcon(suggestion.category);
                  return (
                    <Card key={suggestion.id} className="border-destructive/40 bg-destructive/10">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-destructive" />
                              <Badge className={getTypeColor(suggestion.type)}>
                                {suggestion.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {suggestion.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            {suggestion.action_url && (
                              <Button size="sm" onClick={() => handleAction(suggestion)}>
                                {suggestion.action_text}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissSuggestion(suggestion.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Other Suggestions */}
            {otherSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Other Suggestions ({otherSuggestions.length})
                </h4>
                {otherSuggestions.map((suggestion) => {
                  const TypeIcon = getTypeIcon(suggestion.type);
                  const CategoryIcon = getCategoryIcon(suggestion.category);
                  return (
                    <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <TypeIcon className={`h-4 w-4 ${getPriorityColor(suggestion.priority)}`} />
                              <Badge className={getTypeColor(suggestion.type)}>
                                {suggestion.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {suggestion.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            {suggestion.action_url && (
                              <Button size="sm" variant="outline" onClick={() => handleAction(suggestion)}>
                                {suggestion.action_text}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissSuggestion(suggestion.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}