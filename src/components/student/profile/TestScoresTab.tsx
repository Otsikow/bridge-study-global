import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Award, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface TestScoresTabProps {
  studentId: string;
  onUpdate?: () => void;
}

export function TestScoresTab({ studentId, onUpdate }: TestScoresTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testScores, setTestScores] = useState<Tables<'test_scores'>[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Tables<'test_scores'> | null>(null);
  const [formData, setFormData] = useState({
    test_type: '',
    total_score: '',
    test_date: '',
    listening: '',
    reading: '',
    writing: '',
    speaking: ''
  });

  const fetchTestScores = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('test_scores')
        .select('*')
        .eq('student_id', studentId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setTestScores(data || []);
    } catch (error) {
      console.error('Error fetching test scores:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchTestScores();
  }, [fetchTestScores]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subscores: Record<string, number> = {};
      if (formData.listening) subscores.listening = parseFloat(formData.listening);
      if (formData.reading) subscores.reading = parseFloat(formData.reading);
      if (formData.writing) subscores.writing = parseFloat(formData.writing);
      if (formData.speaking) subscores.speaking = parseFloat(formData.speaking);

      const payload = {
        test_type: formData.test_type,
        total_score: parseFloat(formData.total_score),
        test_date: formData.test_date,
        subscores_json: Object.keys(subscores).length > 0 ? subscores : null
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('test_scores')
          .update(payload)
          .eq('id', editingRecord.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Test score updated' });
      } else {
        const { error } = await supabase
          .from('test_scores')
          .insert({
            student_id: studentId,
            ...payload
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Test score added' });
      }

      setIsDialogOpen(false);
      setEditingRecord(null);
      resetForm();
      fetchTestScores();
      onUpdate?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test score?')) return;

    try {
      const { error } = await supabase
        .from('test_scores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Test score deleted' });
      fetchTestScores();
      onUpdate?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      test_type: '',
      total_score: '',
      test_date: '',
      listening: '',
      reading: '',
      writing: '',
      speaking: ''
    });
  };

  const openEditDialog = (record: Tables<'test_scores'>) => {
    setEditingRecord(record);
    const subscores = record.subscores_json as { listening?: number; reading?: number; writing?: number; speaking?: number } | null;
    setFormData({
      test_type: record.test_type,
      total_score: record.total_score?.toString() || '',
      test_date: record.test_date,
      listening: subscores?.listening?.toString() || '',
      reading: subscores?.reading?.toString() || '',
      writing: subscores?.writing?.toString() || '',
      speaking: subscores?.speaking?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const showSubscores = ['IELTS', 'TOEFL'].includes(formData.test_type);

  if (loading && testScores.length === 0) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Scores</h2>
          <p className="text-muted-foreground">English proficiency and standardized tests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRecord(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Test Score
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingRecord ? 'Edit' : 'Add'} Test Score</DialogTitle>
                <DialogDescription>
                  Add your English proficiency or standardized test scores
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="test_type">Test Type *</Label>
                  <Select value={formData.test_type} onValueChange={(value) => setFormData({...formData, test_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IELTS">IELTS</SelectItem>
                      <SelectItem value="TOEFL">TOEFL</SelectItem>
                      <SelectItem value="Duolingo">Duolingo English Test</SelectItem>
                      <SelectItem value="SAT">SAT</SelectItem>
                      <SelectItem value="GRE">GRE</SelectItem>
                      <SelectItem value="GMAT">GMAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_score">Overall Score *</Label>
                    <Input
                      id="total_score"
                      type="number"
                      step="0.5"
                      value={formData.total_score}
                      onChange={(e) => setFormData({...formData, total_score: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test_date">Test Date *</Label>
                    <Input
                      id="test_date"
                      type="date"
                      value={formData.test_date}
                      onChange={(e) => setFormData({...formData, test_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {showSubscores && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Band Scores (Optional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="listening" className="text-sm font-normal">Listening</Label>
                        <Input
                          id="listening"
                          type="number"
                          step="0.5"
                          value={formData.listening}
                          onChange={(e) => setFormData({...formData, listening: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reading" className="text-sm font-normal">Reading</Label>
                        <Input
                          id="reading"
                          type="number"
                          step="0.5"
                          value={formData.reading}
                          onChange={(e) => setFormData({...formData, reading: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="writing" className="text-sm font-normal">Writing</Label>
                        <Input
                          id="writing"
                          type="number"
                          step="0.5"
                          value={formData.writing}
                          onChange={(e) => setFormData({...formData, writing: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="speaking" className="text-sm font-normal">Speaking</Label>
                        <Input
                          id="speaking"
                          type="number"
                          step="0.5"
                          value={formData.speaking}
                          onChange={(e) => setFormData({...formData, speaking: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRecord ? 'Update' : 'Add'} Score
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {testScores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Test Scores</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your English proficiency test scores to complete your profile
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {testScores.map((score) => (
            <Card key={score.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      {score.test_type}
                    </CardTitle>
                    <CardDescription>
                      Overall: {score.total_score} • Taken on {new Date(score.test_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(score)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(score.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {score.subscores_json && (() => {
                const subscores = score.subscores_json as { listening?: number; reading?: number; writing?: number; speaking?: number };
                return (
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {subscores.listening && (
                        <div>
                          <span className="text-muted-foreground">Listening:</span>
                          <p className="font-medium">{subscores.listening}</p>
                        </div>
                      )}
                      {subscores.reading && (
                        <div>
                          <span className="text-muted-foreground">Reading:</span>
                          <p className="font-medium">{subscores.reading}</p>
                        </div>
                      )}
                      {subscores.writing && (
                        <div>
                          <span className="text-muted-foreground">Writing:</span>
                          <p className="font-medium">{subscores.writing}</p>
                        </div>
                      )}
                      {subscores.speaking && (
                        <div>
                          <span className="text-muted-foreground">Speaking:</span>
                          <p className="font-medium">{subscores.speaking}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                );
              })()}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
