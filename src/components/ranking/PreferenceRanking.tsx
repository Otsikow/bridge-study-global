import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowUp, 
  ArrowDown, 
  Star, 
  Flag, 
  TrendingUp, 
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  MapPin,
  DollarSign,
  Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Application {
  id: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  ranking_score: number | null;
  acceptance_likelihood: number | null;
  student_notes: string | null;
  agent_notes: string | null;
  program: {
    name: string;
    level: string;
    discipline: string;
    tuition_amount: number;
    tuition_currency: string;
    university: {
      name: string;
      city: string;
      country: string;
      ranking: any;
    };
  };
  student: {
    profiles: {
      full_name: string;
    };
  };
}

interface RankingCriteria {
  acceptance_likelihood: number;
  program_fit: number;
  cost_affordability: number;
  location_preference: number;
  career_goals: number;
}

const RANKING_FACTORS = {
  acceptance_likelihood: {
    label: 'Acceptance Likelihood',
    description: 'Based on student profile vs program requirements',
    weight: 0.3
  },
  program_fit: {
    label: 'Program Fit',
    description: 'Alignment with student goals and background',
    weight: 0.25
  },
  cost_affordability: {
    label: 'Cost Affordability',
    description: 'Tuition and living costs vs student budget',
    weight: 0.2
  },
  location_preference: {
    label: 'Location Preference',
    description: 'Student preference for country/city',
    weight: 0.15
  },
  career_goals: {
    label: 'Career Goals',
    description: 'Program alignment with career aspirations',
    weight: 0.1
  }
};

export default function PreferenceRanking() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRankingDialogOpen, setIsRankingDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rankingCriteria, setRankingCriteria] = useState<RankingCriteria>({
    acceptance_likelihood: 50,
    program_fit: 50,
    cost_affordability: 50,
    location_preference: 50,
    career_goals: 50
  });
  const [studentNotes, setStudentNotes] = useState('');
  const [agentNotes, setAgentNotes] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchApplications();
    }
  }, [profile?.id]);

  const fetchApplications = async () => {
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          priority,
          ranking_score,
          acceptance_likelihood,
          student_notes,
          agent_notes,
          program:programs (
            name,
            level,
            discipline,
            tuition_amount,
            tuition_currency,
            university:universities (
              name,
              city,
              country,
              ranking
            )
          ),
          student:students (
            profiles!inner (
              full_name
            )
          )
        `)
        .order('ranking_score', { ascending: false, nullsLast: true });

      // Apply role-based filtering
      if (profile?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        if (studentData) {
          query = query.eq('student_id', studentData.id);
        }
      } else if (profile?.role === 'agent') {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        if (agentData) {
          query = query.eq('agent_id', agentData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRankingScore = (criteria: RankingCriteria): number => {
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(criteria).forEach(([key, value]) => {
      const factor = RANKING_FACTORS[key as keyof RankingCriteria];
      totalScore += value * factor.weight;
      totalWeight += factor.weight;
    });

    return Math.round((totalScore / totalWeight) * 100) / 100;
  };

  const updateApplicationRanking = async (applicationId: string, criteria: RankingCriteria, notes: { student?: string; agent?: string }) => {
    try {
      const rankingScore = calculateRankingScore(criteria);
      
      const updateData: any = {
        ranking_score: rankingScore,
        acceptance_likelihood: criteria.acceptance_likelihood
      };

      if (profile?.role === 'student' && notes.student) {
        updateData.student_notes = notes.student;
      }

      if (profile?.role === 'agent' && notes.agent) {
        updateData.agent_notes = notes.agent;
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application ranking updated successfully'
      });

      setIsRankingDialogOpen(false);
      fetchApplications();
    } catch (error) {
      console.error('Error updating ranking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ranking',
        variant: 'destructive'
      });
    }
  };

  const moveApplication = async (applicationId: string, direction: 'up' | 'down') => {
    try {
      const currentIndex = applications.findIndex(app => app.id === applicationId);
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= applications.length) return;

      // Calculate new ranking scores based on position
      const newRankingScore = applications.length - newIndex;
      
      const { error } = await supabase
        .from('applications')
        .update({ ranking_score: newRankingScore })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Application ranking updated'
      });

      fetchApplications();
    } catch (error) {
      console.error('Error moving application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ranking',
        variant: 'destructive'
      });
    }
  };

  const getAcceptanceLikelihoodColor = (likelihood: number | null) => {
    if (!likelihood) return 'text-gray-500';
    if (likelihood >= 80) return 'text-green-600';
    if (likelihood >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openRankingDialog = (application: Application) => {
    setSelectedApplication(application);
    setStudentNotes(application.student_notes || '');
    setAgentNotes(application.agent_notes || '');
    setIsRankingDialogOpen(true);
  };

  const handleRankingSubmit = () => {
    if (!selectedApplication) return;

    const notes = {
      student: profile?.role === 'student' ? studentNotes : undefined,
      agent: profile?.role === 'agent' ? agentNotes : undefined
    };

    updateApplicationRanking(selectedApplication.id, rankingCriteria, notes);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application Preference Ranking</h2>
          <p className="text-muted-foreground">Rank and prioritize student applications with AI-powered recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Recommendations
          </Button>
          <Button size="sm">
            <Target className="h-4 w-4 mr-2" />
            Auto-Rank
          </Button>
        </div>
      </div>

      {/* Ranking Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ranking Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{applications.length}</div>
              <div className="text-sm text-muted-foreground">Total Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.priority === 'high').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.acceptance_likelihood && app.acceptance_likelihood >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">High Acceptance Likelihood</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {applications.filter(app => app.ranking_score).length}
              </div>
              <div className="text-sm text-muted-foreground">Ranked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Ranking List */}
      <Card>
        <CardHeader>
          <CardTitle>Ranked Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications to rank</h3>
              <p className="text-muted-foreground">Applications will appear here once students start applying</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app, index) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveApplication(app.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveApplication(app.id, 'down')}
                                disabled={index === applications.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{app.student.profiles.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{app.program.name}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(app.priority)}>
                              <Flag className="h-3 w-3 mr-1" />
                              {app.priority} priority
                            </Badge>
                            {app.ranking_score && (
                              <Badge variant="outline">
                                <Star className="h-3 w-3 mr-1" />
                                Score: {app.ranking_score}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Program Details
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {app.program.level} • {app.program.discipline}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.program.university.name}, {app.program.university.country}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Cost & Likelihood
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {app.program.tuition_currency} {app.program.tuition_amount.toLocaleString()}
                            </p>
                            <p className={`text-sm font-medium flex items-center gap-1 ${
                              getAcceptanceLikelihoodColor(app.acceptance_likelihood)
                            }`}>
                              <Target className="h-3 w-3" />
                              {app.acceptance_likelihood ? `${app.acceptance_likelihood}% acceptance likelihood` : 'Not calculated'}
                            </p>
                          </div>
                        </div>

                        {(app.student_notes || app.agent_notes) && (
                          <div className="space-y-2">
                            {app.student_notes && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">Student Notes:</h5>
                                <p className="text-sm">{app.student_notes}</p>
                              </div>
                            )}
                            {app.agent_notes && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">Agent Notes:</h5>
                                <p className="text-sm">{app.agent_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRankingDialog(app)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Rank
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Dialog */}
      <Dialog open={isRankingDialogOpen} onOpenChange={setIsRankingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rank Application</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6 pt-4">
              <div>
                <h3 className="font-semibold">{selectedApplication.student.profiles.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedApplication.program.name}</p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Ranking Criteria</h4>
                {Object.entries(RANKING_FACTORS).map(([key, factor]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">{factor.label}</label>
                      <span className="text-sm text-muted-foreground">
                        {rankingCriteria[key as keyof RankingCriteria]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={rankingCriteria[key as keyof RankingCriteria]}
                      onChange={(e) => setRankingCriteria({
                        ...rankingCriteria,
                        [key]: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">{factor.description}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Student Notes</label>
                  <Textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Agent Notes</label>
                  <Textarea
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Add agent notes..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-medium">Calculated Score: </span>
                  <span className="text-primary font-bold">
                    {calculateRankingScore(rankingCriteria)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsRankingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRankingSubmit}>
                    Save Ranking
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}