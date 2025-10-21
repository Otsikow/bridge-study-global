import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Calendar, FileText, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";

interface Student {
  id: string;
  profile_id: string;
  nationality: string | null;
  date_of_birth: string | null;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  programs: {
    name: string;
    universities: {
      name: string;
    };
  };
}

export default function LeadsList() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<(Student & { applications: Application[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (profile?.id) {
      fetchLeads();
    }
  }, [profile?.id]);

  const fetchLeads = async () => {
    try {
      // First get the agent ID
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError) throw agentError;

      // Get all applications for this agent
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          student_id,
          programs!inner (
            name,
            universities!inner (
              name
            )
          )
        `)
        .eq('agent_id', agentData.id);

      if (appsError) throw appsError;

      // Get unique student IDs
      const studentIds = [...new Set(applicationsData?.map(app => app.student_id))];

      // Fetch students with their profiles
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          profile_id,
          nationality,
          date_of_birth,
          profiles!inner (
            full_name,
            email,
            phone
          )
        `)
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Combine students with their applications
      const studentsWithApps = studentsData?.map(student => ({
        ...student,
        applications: applicationsData?.filter(app => app.student_id === student.id) || []
      })) || [];

      setStudents(studentsWithApps);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load student leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Student Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          My Student Leads ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No student leads yet</p>
            <p className="text-sm">Start recruiting to see your leads here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <Card key={student.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-lg font-semibold">{student.profiles.full_name}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {student.profiles.email}
                        </span>
                        {student.profiles.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {student.profiles.phone}
                          </span>
                        )}
                        {student.nationality && (
                          <Badge variant="outline">{student.nationality}</Badge>
                        )}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Note for {student.profiles.full_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Textarea
                            placeholder="Enter your note..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="min-h-[120px]"
                          />
                          <Button 
                            className="w-full"
                            onClick={() => {
                              toast({
                                title: "Note saved",
                                description: "Your note has been saved successfully",
                              });
                              setNote("");
                            }}
                          >
                            Save Note
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Applications ({student.applications.length})
                    </div>
                    {student.applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{app.programs.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {app.programs.universities.name}
                          </p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
