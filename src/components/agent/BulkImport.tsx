import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  X,
  Users,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: number;
  errors: number;
  total: number;
  errorDetails: string[];
}

interface StudentRecord {
  name: string;
  email: string;
  phone?: string;
  nationality: string;
  academic_history: string;
  desired_country: string;
  program_interests: string;
  gpa?: number;
  ielts_score?: number;
  toefl_score?: number;
  budget?: number;
  notes?: string;
}

export default function BulkImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<StudentRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        parseCSV(selectedFile);
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV file',
          variant: 'destructive'
        });
      }
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['name', 'email', 'nationality', 'academic_history', 'desired_country', 'program_interests'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast({
          title: 'Invalid CSV format',
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      const records: StudentRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const record: StudentRecord = {
            name: values[headers.indexOf('name')] || '',
            email: values[headers.indexOf('email')] || '',
            phone: values[headers.indexOf('phone')] || undefined,
            nationality: values[headers.indexOf('nationality')] || '',
            academic_history: values[headers.indexOf('academic_history')] || '',
            desired_country: values[headers.indexOf('desired_country')] || '',
            program_interests: values[headers.indexOf('program_interests')] || '',
            gpa: values[headers.indexOf('gpa')] ? parseFloat(values[headers.indexOf('gpa')]) : undefined,
            ielts_score: values[headers.indexOf('ielts_score')] ? parseFloat(values[headers.indexOf('ielts_score')]) : undefined,
            toefl_score: values[headers.indexOf('toefl_score')] ? parseInt(values[headers.indexOf('toefl_score')]) : undefined,
            budget: values[headers.indexOf('budget')] ? parseFloat(values[headers.indexOf('budget')]) : undefined,
            notes: values[headers.indexOf('notes')] || undefined
          };
          records.push(record);
        }
      }
      
      setPreviewData(records);
      setShowPreview(true);
    };
    reader.readAsText(file);
  };

  const validateRecords = (records: StudentRecord[]): { valid: StudentRecord[], errors: string[] } => {
    const validRecords: StudentRecord[] = [];
    const errors: string[] = [];
    
    records.forEach((record, index) => {
      const rowNumber = index + 2; // +2 because CSV starts from row 1 and we skip header
      const recordErrors: string[] = [];
      
      if (!record.name.trim()) recordErrors.push('Name is required');
      if (!record.email.trim()) recordErrors.push('Email is required');
      if (!record.nationality.trim()) recordErrors.push('Nationality is required');
      if (!record.academic_history.trim()) recordErrors.push('Academic history is required');
      if (!record.desired_country.trim()) recordErrors.push('Desired country is required');
      if (!record.program_interests.trim()) recordErrors.push('Program interests are required');
      
      if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
        recordErrors.push('Invalid email format');
      }
      
      if (record.gpa && (record.gpa < 0 || record.gpa > 4)) {
        recordErrors.push('GPA must be between 0 and 4');
      }
      
      if (record.ielts_score && (record.ielts_score < 0 || record.ielts_score > 9)) {
        recordErrors.push('IELTS score must be between 0 and 9');
      }
      
      if (record.toefl_score && (record.toefl_score < 0 || record.toefl_score > 120)) {
        recordErrors.push('TOEFL score must be between 0 and 120');
      }
      
      if (recordErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${recordErrors.join(', ')}`);
      } else {
        validRecords.push(record);
      }
    });
    
    return { valid: validRecords, errors };
  };

  const processImport = async () => {
    if (!file || previewData.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const { valid, errors } = validateRecords(previewData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result: ImportResult = {
        success: valid.length,
        errors: errors.length,
        total: previewData.length,
        errorDetails: errors
      };
      
      setImportResult(result);
      
      if (valid.length > 0) {
        toast({
          title: 'Import completed',
          description: `Successfully imported ${valid.length} students`
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: 'Import completed with errors',
          description: `${errors.length} records had validation errors`,
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: 'An error occurred during import. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      'name,email,phone,nationality,academic_history,desired_country,program_interests,gpa,ielts_score,toefl_score,budget,notes',
      'John Doe,john@example.com,+1234567890,USA,Bachelor in Computer Science,Canada,Computer Science,3.5,7.5,100,50000,Interested in AI programs',
      'Jane Smith,jane@example.com,+1234567891,UK,Master in Business,USA,Business Administration,3.8,8.0,110,60000,Looking for MBA programs'
    ].join('\n');
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    setPreviewData([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Bulk Import Students
          </h2>
          <p className="text-muted-foreground">Import multiple students at once using a CSV file</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file with student information. Make sure it follows the required format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Choose CSV file or drag and drop</p>
                <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={resetImport}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Required Format</CardTitle>
            <CardDescription>
              Your CSV file must include these columns:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Required Fields:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• name</li>
                    <li>• email</li>
                    <li>• nationality</li>
                    <li>• academic_history</li>
                    <li>• desired_country</li>
                    <li>• program_interests</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Optional Fields:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• phone</li>
                    <li>• gpa (0-4)</li>
                    <li>• ielts_score (0-9)</li>
                    <li>• toefl_score (0-120)</li>
                    <li>• budget</li>
                    <li>• notes</li>
                  </ul>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure your CSV file uses commas as separators and has a header row.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Data ({previewData.length} records)</CardTitle>
                <CardDescription>Review the data before importing</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Hide Preview
                </Button>
                <Button onClick={processImport} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Import Students'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Nationality</th>
                    <th className="text-left p-2">Desired Country</th>
                    <th className="text-left p-2">Program Interests</th>
                    <th className="text-left p-2">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((record, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{record.name}</td>
                      <td className="p-2">{record.email}</td>
                      <td className="p-2">{record.nationality}</td>
                      <td className="p-2">{record.desired_country}</td>
                      <td className="p-2">{record.program_interests}</td>
                      <td className="p-2">{record.gpa || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing first 10 records of {previewData.length} total
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm font-medium">Processing import...</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-muted-foreground">Successfully Imported</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
            </div>

            {importResult.errorDetails.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Error Details:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importResult.errorDetails.map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={resetImport}>
                Import More Students
              </Button>
              <Button variant="outline" onClick={() => setImportResult(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}