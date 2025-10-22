import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Download, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { Badge } from '@/components/ui/badge';

interface Document {
  id: string;
  student_id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  verified_status: string;
  verification_notes: string | null;
  created_at: string;
}

const DOCUMENT_TYPES = [
  'passport',
  'transcript',
  'degree_certificate',
  'english_test',
  'recommendation_letter',
  'personal_statement',
  'cv_resume',
  'financial_document',
  'other'
];

export default function Documents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');

  const fetchStudentAndDocuments = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }

      console.log('Fetching student data for user:', user.id);

      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (studentError) {
        console.error('Student query error:', studentError);
        throw studentError;
      }

      if (!studentData) {
        console.log('No student profile found for user:', user.id);
        toast({
          title: 'Error',
          description: 'Student profile not found. Please complete your profile first.',
          variant: 'destructive'
        });
        return;
      }

      console.log('Student ID found:', studentData.id);
      setStudentId(studentData.id);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentData.id)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Documents query error:', docsError);
        throw docsError;
      }

      console.log('Documents fetched:', docsData?.length || 0);
      setDocuments(docsData || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    if (user) {
      fetchStudentAndDocuments();
    }
  }, [user, fetchStudentAndDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !studentId) {
      toast({
        title: 'Error',
        description: 'Please select a file and document type',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Error',
        description: 'File type not supported. Please upload PDF, DOC, DOCX, JPG, or PNG files.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage with correct path structure
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${studentId}/${fileName}`;

      console.log('Uploading file:', {
        bucket: 'student-documents',
        path: filePath,
        fileName: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage error: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Create document record
      const { data: insertData, error: dbError } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentId,
          document_type: documentType,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          storage_path: filePath,
          verified_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to clean up the uploaded file
        await supabase.storage
          .from('student-documents')
          .remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Document record created:', insertData);

      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      });

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh documents
      fetchStudentAndDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      console.log('Downloading document:', doc.storage_path);
      
      const { data, error } = await supabase.storage
        .from('student-documents')
        .download(doc.storage_path);

      if (error) {
        console.error('Download error:', error);
        throw new Error(`Download failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from storage');
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Document downloaded successfully'
      });
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download document';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      console.log('Deleting document:', doc.storage_path);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('student-documents')
        .remove([doc.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue with database deletion even if storage fails
        console.warn('Storage deletion failed, but continuing with database cleanup');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      toast({
        title: 'Success',
        description: 'Document deleted successfully'
      });

      fetchStudentAndDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton variant="ghost" size="sm" className="mb-4" fallback="/dashboard" />

      <div className="space-y-1.5 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">My Documents</h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Upload and manage your application documents</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Document
          </CardTitle>
          <CardDescription>Upload transcripts, certificates, test scores, and other documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-input">Select File</Label>
              <Input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}

          <Button onClick={handleUpload} disabled={uploading || !selectedFile || !documentType}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents uploaded yet. Upload your first document above.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.document_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} • {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                      {doc.verification_notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Note: {doc.verification_notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={doc.verified_status === 'verified' ? 'default' : doc.verified_status === 'rejected' ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                      {getStatusIcon(doc.verified_status)}
                      {doc.verified_status.charAt(0).toUpperCase() + doc.verified_status.slice(1)}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(doc)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
