import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/StatusBadge';
import { Calendar, DollarSign, Download, FileText, GraduationCap, MapPin, Timer } from 'lucide-react';
import BackButton from '@/components/BackButton';

interface University {
  name: string;
  city: string | null;
  country: string;
}

interface Program {
  id: string;
  name: string;
  level: string;
  discipline: string;
  app_fee: number | null;
  university: University;
}

interface TimelineItem {
  title?: string;
  description?: string;
  date?: string;
  [key: string]: unknown;
}

interface Application {
  id: string;
  status: string;
  intake_year: number;
  intake_month: number;
  created_at: string;
  submitted_at: string | null;
  program: Program;
  timeline_json?: TimelineItem[];
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'done' | 'blocked';
  priority: string | null;
  due_at: string | null;
}

interface Offer {
  id: string;
  offer_type: 'conditional' | 'unconditional';
  letter_url: string;
  expiry_date: string | null;
  accepted: boolean | null;
}

interface AppDocument {
  id: string;
  document_type: string;
  storage_path: string;
  mime_type: string;
  verified: boolean;
  verification_notes: string | null;
  uploaded_at: string;
}

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [docs, setDocs] = useState<AppDocument[]>([]);

  const getIntakeLabel = (month: number, year: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const processingEta = useMemo(() => {
    if (!app) return null;
    const map: Record<string, string> = {
      draft: '1–2 weeks to prepare',
      submitted: '2–6 weeks for decision',
      screening: '1–2 weeks screening',
      conditional_offer: '1–3 weeks to clear conditions',
      unconditional_offer: '2–4 weeks to CAS/LOA',
      cas_loa: '2–6 weeks for visa decision',
      visa: '2–6 weeks to enrollment',
      enrolled: 'Completed',
    };
    return map[app.status] || 'Varies by university';
  }, [app]);

  useEffect(() => {
    if (!id || !user) return;
    void loadAll();
  }, [id, user]);

  const loadAll = async () => {
    try {
      setLoading(true);
      // Application with program + university
      const { data: appData, error: appErr } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          intake_year,
          intake_month,
          created_at,
          submitted_at,
          timeline_json,
          program:programs (
            id,
            name,
            level,
            discipline,
            app_fee,
            university:universities (
              name,
              city,
              country
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();
      if (appErr) throw appErr;
      if (!appData) {
        toast({ title: 'Not found', description: 'Application not found', variant: 'destructive' });
        navigate(-1);
        return;
      }
      setApp(appData as unknown as Application);

      // Tasks assigned to the current user for this application
      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .select('id,title,description,status,priority,due_at')
        .eq('application_id', id)
        .order('due_at', { ascending: true });
      if (taskErr) throw taskErr;
      setTasks(taskData as unknown as TaskItem[]);

      // Offers for this application
      const { data: offerData, error: offerErr } = await supabase
        .from('offers')
        .select('id,offer_type,letter_url,expiry_date,accepted')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      if (offerErr) throw offerErr;
      setOffers(offerData as unknown as Offer[]);

      // Documents linked to this application
      const { data: docData, error: docErr } = await supabase
        .from('application_documents')
        .select('id,document_type,storage_path,mime_type,verified,verification_notes,uploaded_at')
        .eq('application_id', id)
        .order('uploaded_at', { ascending: false });
      if (docErr) throw docErr;
      setDocs(docData as unknown as AppDocument[]);
    } catch (error) {
      console.error('Load details error', error);
      toast({ title: 'Error', description: 'Failed to load application details', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskDone = async (task: TaskItem, checked: boolean) => {
    try {
      const newStatus = checked ? 'done' : 'open';
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
      if (error) throw error;
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status: newStatus as TaskItem['status'] } : t)));
    } catch (error) {
      console.error('Update task error', error);
      toast({ title: 'Error', description: 'Could not update task', variant: 'destructive' });
    }
  };

  const cancelDraft = async () => {
    if (!app || app.status !== 'draft') return;
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'withdrawn' })
        .eq('id', app.id);
      if (error) throw error;
      toast({ title: 'Application cancelled', description: 'Your draft application was cancelled.' });
      void loadAll();
    } catch (error) {
      console.error('Cancel application error', error);
      toast({ title: 'Error', description: 'Failed to cancel application', variant: 'destructive' });
    }
  };

  if (loading || !app) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading application...</div>
      </div>
    );
  }

  const taskProgress = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton variant="ghost" size="sm" className="mb-2" fallback="/dashboard" />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-6 w-6 text-primary mt-1" />
              <div>
                <div className="text-xl font-semibold">{app.program.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {app.program.university.name} • {app.program.university.city && `${app.program.university.city}, `}
                  {app.program.university.country}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={app.status} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Intake</div>
            <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4" /> {getIntakeLabel(app.intake_month, app.intake_year)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Processing time</div>
            <div className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4" /> {processingEta}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Application fee</div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              {app.program.app_fee ? `${app.program.app_fee.toLocaleString()} USD` : 'N/A'}
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tasks completion</span>
                  <span>{taskProgress}%</span>
                </div>
                <Progress value={taskProgress} />
              </div>
              <div className="flex gap-2">
                {app.status === 'draft' && (
                  <Button variant="outline" onClick={cancelDraft}>Cancel Application</Button>
                )}
                <Button variant="outline" onClick={() => navigate('/search')}>Find More Programs</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {app.timeline_json && Array.isArray(app.timeline_json) && app.timeline_json.length > 0 ? (
                <div className="space-y-3">
                  {app.timeline_json.map((item: TimelineItem, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="text-sm">
                        <div className="font-medium">{item.title || 'Update'}</div>
                        {item.description && <div className="text-muted-foreground">{item.description}</div>}
                        {item.date && (
                          <div className="text-xs text-muted-foreground mt-1">{new Date(item.date).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No timeline entries yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks yet. Tasks are generated automatically based on your application stage.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Done</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Checkbox
                            checked={t.status === 'done'}
                            onCheckedChange={(checked) => toggleTaskDone(t, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{t.title}</div>
                          {t.description && (
                            <div className="text-xs text-muted-foreground">{t.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.due_at ? new Date(t.due_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline">{(t.priority || 'medium').toUpperCase()}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm capitalize">{d.document_type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-1 text-sm">
                            <FileText className="h-4 w-4" />
                            <span className="truncate max-w-[220px]" title={d.storage_path}>{d.storage_path.split('/').pop()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={d.verified ? 'secondary' : 'outline'}>
                            {d.verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(d.uploaded_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No offers yet.</div>
              ) : (
                <div className="space-y-3">
                  {offers.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40">
                      <div className="space-y-1">
                        <div className="text-sm font-medium capitalize">{o.offer_type.replace('_', ' ')} offer</div>
                        {o.expiry_date && (
                          <div className="text-xs text-muted-foreground">Expires {new Date(o.expiry_date).toLocaleDateString()}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={o.accepted ? 'secondary' : 'outline'}>{o.accepted ? 'Accepted' : 'Pending'}</Badge>
                        {o.letter_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={o.letter_url} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Offer Letter
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
