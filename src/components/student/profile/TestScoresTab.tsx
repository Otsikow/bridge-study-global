import { useEffect, useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Award, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { validateFileUpload } from '@/lib/fileUpload';

interface TestScoresTabProps {
  studentId: string;
  onUpdate?: () => void;
}

const CERTIFICATE_BUCKET = 'student-documents';
const CERTIFICATE_PREFIX = 'test-score-certificates';
const MAX_CERTIFICATE_SIZE = 5 * 1024 * 1024; // 5MB

export function TestScoresTab({ studentId, onUpdate }: TestScoresTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testScores, setTestScores] = useState<Tables<'test_scores'>[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Tables<'test_scores'> | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [existingCertificatePath, setExistingCertificatePath] = useState<string | null>(null);
  const [viewingCertificatePath, setViewingCertificatePath] = useState<string | null>(null);
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

    let uploadedCertificatePath: string | null = null;
    const previousCertificatePath = editingRecord?.report_url ?? null;

    try {
      const subscores: Record<string, number> = {};
      if (formData.listening) subscores.listening = parseFloat(formData.listening);
      if (formData.reading) subscores.reading = parseFloat(formData.reading);
      if (formData.writing) subscores.writing = parseFloat(formData.writing);
      if (formData.speaking) subscores.speaking = parseFloat(formData.speaking);

      let certificatePath = existingCertificatePath ?? null;

      if (certificateFile) {
        const { preparedFile, sanitizedFileName, detectedMimeType } = await validateFileUpload(certificateFile, {
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
          allowedExtensions: ['png', 'jpg', 'jpeg'],
          maxSizeBytes: 10 * 1024 * 1024,
        });

        const extension = sanitizedFileName.split('.').pop()?.toLowerCase() || 'jpg';
        const safeTestType = formData.test_type ? formData.test_type.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'test';
        const fileName = `${studentId}/${safeTestType}-${Date.now()}.${extension}`;
        const filePath = `${CERTIFICATE_PREFIX}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(CERTIFICATE_BUCKET)
          .upload(filePath, preparedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: detectedMimeType
          });

        if (uploadError) throw uploadError;

        uploadedCertificatePath = filePath;
        certificatePath = filePath;
      }

      const payload = {
        test_type: formData.test_type,
        total_score: parseFloat(formData.total_score),
        test_date: formData.test_date,
        subscores_json: Object.keys(subscores).length > 0 ? subscores : null,
        report_url: certificatePath
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('test_scores')
          .update(payload)
          .eq('id', editingRecord.id);

        if (error) throw error;

        if (uploadedCertificatePath && previousCertificatePath && previousCertificatePath !== uploadedCertificatePath) {
          const { error: removeError } = await supabase.storage
            .from(CERTIFICATE_BUCKET)
            .remove([previousCertificatePath]);
          if (removeError) {
            console.error('Error removing previous certificate:', removeError);
          }
        }

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
      setCertificateFile(null);
      setExistingCertificatePath(null);
      resetForm();
      fetchTestScores();
      onUpdate?.();
    } catch (error: unknown) {
      if (uploadedCertificatePath) {
        const { error: cleanupError } = await supabase.storage
          .from(CERTIFICATE_BUCKET)
          .remove([uploadedCertificatePath]);
        if (cleanupError) {
          console.error('Failed to clean up uploaded certificate after error:', cleanupError);
        }
      }

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

  const handleDelete = async (score: Tables<'test_scores'>) => {
    if (!confirm('Are you sure you want to delete this test score?')) return;

    try {
      const { error } = await supabase
        .from('test_scores')
        .delete()
        .eq('id', score.id);

      if (error) throw error;
      if (score.report_url) {
        const { error: removeError } = await supabase.storage
          .from(CERTIFICATE_BUCKET)
          .remove([score.report_url]);
        if (removeError) {
          console.error('Error removing certificate from storage:', removeError);
        }
      }
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
    setCertificateFile(null);
    setExistingCertificatePath(null);
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
    setCertificateFile(null);
    setExistingCertificatePath(record.report_url || null);
    setIsDialogOpen(true);
  };

  const showSubscores = ['IELTS', 'TOEFL'].includes(formData.test_type);

  const handleCertificateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCertificateFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, JPEG).',
        variant: 'destructive'
      });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_CERTIFICATE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Certificate image must be smaller than 5MB.',
        variant: 'destructive'
      });
      event.target.value = '';
      return;
    }

    setCertificateFile(file);
  };

  const viewCertificate = async (path: string) => {
    if (viewingCertificatePath) return;

    setViewingCertificatePath(path);
    try {
      const { data, error } = await supabase.storage
        .from(CERTIFICATE_BUCKET)
        .download(path);

      if (error || !data) {
        throw new Error(error?.message || 'Unable to retrieve certificate');
      }

      const url = URL.createObjectURL(data);
      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        const link = document.createElement('a');
        link.href = url;
        link.download = path.split('/').pop() || 'certificate';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch (error) {
      console.error('Error viewing certificate:', error);
      toast({
        title: 'Unable to view certificate',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setViewingCertificatePath(null);
    }
  };

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

                <div className="space-y-2">
                  <Label htmlFor="certificate">Certificate Image (Optional)</Label>
                  <Input
                    id="certificate"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleCertificateChange}
                  />
                  {certificateFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {certificateFile.name} ({(certificateFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  {!certificateFile && existingCertificatePath && (
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Existing certificate uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => viewCertificate(existingCertificatePath)}
                        disabled={viewingCertificatePath !== null}
                      >
                        {viewingCertificatePath === existingCertificatePath && (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        View
                      </Button>
                    </div>
                  )}
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
                      <Button size="sm" variant="outline" onClick={() => handleDelete(score)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
                {(score.report_url || score.subscores_json) && (
                  <CardContent className="space-y-4">
                    {score.report_url && (
                      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">Certificate</p>
                          <p className="text-xs text-muted-foreground">View uploaded test certificate image</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewCertificate(score.report_url!)}
                          disabled={viewingCertificatePath !== null}
                        >
                          {viewingCertificatePath === score.report_url && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    )}
                    {score.subscores_json && (() => {
                      const subscores = score.subscores_json as { listening?: number; reading?: number; writing?: number; speaking?: number };
                      return (
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
                      );
                    })()}
                  </CardContent>
                )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
