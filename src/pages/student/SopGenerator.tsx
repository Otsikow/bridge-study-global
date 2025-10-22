import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import SoPGenerator from '@/components/ai/SoPGenerator';

export default function SopGenerator() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [background, setBackground] = useState('');
  const [motivation, setMotivation] = useState('');
  const [program, setProgram] = useState('');
  const [university, setUniversity] = useState('');
  const [goals, setGoals] = useState('');
  const [sop, setSop] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!background || !motivation || !program || !university || !goals) {
      toast({
        title: 'Incomplete Information',
        description: 'Please fill in all fields before generating your SoP.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call to generate SoP
      const generatedSop = `Dear Admissions Committee,

I am writing to express my strong interest in the ${program} program at ${university}.

${background}

${motivation}

${goals}

Thank you for considering my application.

Sincerely,
[Your Name]`;

      setSop(generatedSop);
      toast({
        title: 'Statement of Purpose Generated',
        description: 'You can edit your draft below.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Something went wrong while generating your SoP.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton variant="ghost" size="sm" className="mb-2" fallback="/dashboard" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Statement of Purpose Generator
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Background</label>
              <Textarea
                placeholder="Summarize your academics and key experiences"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivation</label>
              <Textarea
                placeholder="Why this field and program?"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Program</label>
              <Input
                placeholder="e.g., MSc Data Science"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">University</label>
              <Input
                placeholder="e.g., University of Manchester"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Career Goals</label>
              <Textarea
                placeholder="What do you want to do after graduation?"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={generate} disabled={loading} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? 'Generating...' : 'Generate SoP'}
          </Button>

          {sop && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Draft</div>
              <Textarea
                value={sop}
                onChange={(e) => setSop(e.target.value)}
                className="min-h-[300px]"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
