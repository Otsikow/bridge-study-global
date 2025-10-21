import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Users,
  FileText,
  BarChart3,
  Eye,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: number;
  errors: number;
  total: number;
  details: Array<{
    row: number;
    status: 'success' | 'error';
    message: string;
    data?: any;
  }>;
}

interface StudentData {
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  date_of_birth?: string;
  passport_number?: string;
  current_country?: string;
  study_level?: string;
  budget_range?: string;
  preferred_countries?: string;
  intake_preference?: string;
  ielts_score?: string;
  toefl_score?: string;
  gpa?: string;
  motivation?: string;
  referral_code?: string;
}

const SAMPLE_CSV = `full_name,email,phone,nationality,date_of_birth,passport_number,current_country,study_level,budget_range,preferred_countries,intake_preference,ielts_score,toefl_score,gpa,motivation,referral_code
John Doe,john.doe@email.com,+1234567890,Nigeria,1995-05-15,AB1234567,Nigeria,Bachelor's,$25000-50000,Canada;UK,September 2025,7.5,100,3.5,Want to study computer science abroad,REF001
Jane Smith,jane.smith@email.com,+1234567891,Ghana,1998-03-22,CD9876543,Ghana,Master's,$50000-100000,USA;Canada,January 2026,8.0,110,3.8,Looking for MBA program,REF002`;

export default function BulkImport() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<StudentData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [assignToAgent, setAssignToAgent] = useState('');
  const [agents, setAgents] = useState<Array<{ id: string; full_name: string }>>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = { row: index + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      setImportData(data);
      toast({
        title: 'File Processed',
        description: `Found ${data.length} records to import`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to process file. Please check the format.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateData = (data: StudentData[]): ImportResult => {
    const result: ImportResult = {
      success: 0,
      errors: 0,
      total: data.length,
      details: []
    };

    data.forEach((row, index) => {
      const errors: string[] = [];
      
      if (!row.full_name?.trim()) {
        errors.push('Full name is required');
      }
      
      if (!row.email?.trim()) {
        errors.push('Email is required');
      } else if (!/\S+@\S+\.\S+/.test(row.email)) {
        errors.push('Invalid email format');
      }

      if (row.date_of_birth && isNaN(Date.parse(row.date_of_birth))) {
        errors.push('Invalid date format (use YYYY-MM-DD)');
      }

      if (row.ielts_score && (isNaN(Number(row.ielts_score)) || Number(row.ielts_score) < 0 || Number(row.ielts_score) > 9)) {
        errors.push('IELTS score must be between 0 and 9');
      }

      if (row.toefl_score && (isNaN(Number(row.toefl_score)) || Number(row.toefl_score) < 0 || Number(row.toefl_score) > 120)) {
        errors.push('TOEFL score must be between 0 and 120');
      }

      if (row.gpa && (isNaN(Number(row.gpa)) || Number(row.gpa) < 0 || Number(row.gpa) > 4)) {
        errors.push('GPA must be between 0 and 4');
      }

      if (errors.length > 0) {
        result.errors++;
        result.details.push({
          row: index + 2,
          status: 'error',
          message: errors.join(', ')
        });
      } else {
        result.success++;
        result.details.push({
          row: index + 2,
          status: 'success',
          message: 'Valid',
          data: row
        });
      }
    });

    return result;
  };

  const importStudents = async () => {
    if (!importData.length) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Validate data first
      const validation = validateData(importData);
      setImportResult(validation);

      if (validation.errors > 0) {
        toast({
          title: 'Validation Errors',
          description: `Found ${validation.errors} errors. Please fix them before importing.`,
          variant: 'destructive'
        });
        return;
      }

      // Get agent ID if assigned
      let agentId = null;
      if (assignToAgent) {
        agentId = assignToAgent;
      } else if (profile?.role === 'agent') {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        agentId = agentData?.id;
      }

      // Import students
      const validData = validation.details
        .filter(d => d.status === 'success')
        .map(d => d.data);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validData.length; i++) {
        try {
          const student = validData[i];
          
          // Create profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert({
              full_name: student.full_name,
              email: student.email,
              phone: student.phone,
              role: 'student'
            })
            .select()
            .single();

          if (profileError) throw profileError;

          // Create student record
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              profile_id: profileData.id,
              nationality: student.nationality,
              date_of_birth: student.date_of_birth,
              passport_number: student.passport_number,
              address: {
                country: student.current_country
              },
              education_history: [{
                gpa: student.gpa
              }],
              test_scores: {
                ielts: student.ielts_score ? { overall: student.ielts_score } : {},
                toefl: student.toefl_score ? { overall: student.toefl_score } : {}
              },
              guardian: {
                motivation: student.motivation
              }
            });

          if (studentError) throw studentError;

          // Create lead if agent assigned
          if (agentId) {
            await supabase
              .from('leads')
              .insert({
                student_id: profileData.id,
                agent_id: agentId,
                source: 'bulk_import',
                referral_code: student.referral_code,
                study_preferences: {
                  study_level: student.study_level,
                  budget_range: student.budget_range,
                  preferred_countries: student.preferred_countries?.split(';') || [],
                  intake_preference: student.intake_preference
                },
                status: 'new'
              });
          }

          successCount++;
        } catch (error) {
          console.error(`Error importing student ${i + 1}:`, error);
          errorCount++;
        }

        setImportProgress(((i + 1) / validData.length) * 100);
      }

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} students. ${errorCount} failed.`
      });

      // Reset form
      setSelectedFile(null);
      setImportData([]);
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error importing students:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to import students. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Student Import</h2>
          <p className="text-muted-foreground">Import multiple students from CSV/Excel files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="preview">Preview Data</TabsTrigger>
          <TabsTrigger value="results">Import Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select CSV or Excel file</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: CSV, Excel (.xlsx, .xls). Maximum file size: 10MB
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="flex-1">{selectedFile.name}</span>
                  <Badge variant="outline">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Processing file...</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="assign-agent">Assign to Agent (Optional)</Label>
                <Select value={assignToAgent} onValueChange={setAssignToAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent or leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No assignment</SelectItem>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {importData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Data Preview ({importData.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Row</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Nationality</th>
                        <th className="text-left p-2">Study Level</th>
                        <th className="text-left p-2">IELTS</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{index + 2}</td>
                          <td className="p-2">{row.full_name}</td>
                          <td className="p-2">{row.email}</td>
                          <td className="p-2">{row.nationality || '-'}</td>
                          <td className="p-2">{row.study_level || '-'}</td>
                          <td className="p-2">{row.ielts_score || '-'}</td>
                          <td className="p-2">
                            <Badge variant="outline">Pending</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 records of {importData.length} total
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={importStudents} 
                    disabled={isImporting}
                    className="flex-1"
                  >
                    {isImporting ? 'Importing...' : `Import ${importData.length} Students`}
                  </Button>
                </div>

                {isImporting && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Importing students...</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data to preview</h3>
                <p className="text-muted-foreground">Upload a file to see the data preview</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {importResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{importResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Detailed Results</h4>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {importResult.details.map((detail, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        {getStatusIcon(detail.status)}
                        <span className="text-sm">Row {detail.row}:</span>
                        <span className="text-sm flex-1">{detail.message}</span>
                        <Badge className={getStatusColor(detail.status)}>
                          {detail.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No import results</h3>
                <p className="text-muted-foreground">Import some students to see results here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}