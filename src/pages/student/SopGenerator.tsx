import { useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import SoPGenerator from '@/components/ai/SoPGenerator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function SopGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Get program and university from URL params if available
  const programName = searchParams.get('program') || '';
  const universityName = searchParams.get('university') || '';

  const handleSave = async (sopContent: string) => {
    try {
      // Get student ID
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) {
        toast({
          title: 'Error',
          description: 'Student profile not found',
          variant: 'destructive'
        });
        return;
      }

      // Save SOP to documents
      const fileName = `sop_${new Date().getTime()}.txt`;
      const filePath = `${studentData.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(filePath, new Blob([sopContent], { type: 'text/plain' }), {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentData.id,
          document_type: 'personal_statement',
          file_name: 'statement-of-purpose.txt',
          file_size: sopContent.length,
          mime_type: 'text/plain',
          storage_path: filePath,
          verified_status: 'pending'
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Statement of Purpose saved to your documents'
      });

      // Navigate to documents page
      navigate('/student/documents');
    } catch (error) {
      console.error('Error saving SOP:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Statement of Purpose',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton variant="ghost" size="sm" className="mb-2" fallback="/dashboard" />
      <SoPGenerator 
        programName={programName}
        universityName={universityName}
        onSave={handleSave}
      />
    </div>
  );
}
