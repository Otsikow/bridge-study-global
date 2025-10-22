import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SoPGenerator from '@/components/ai/SoPGenerator';

export default function SopGenerator() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <SoPGenerator />
    </div>
  );
}
