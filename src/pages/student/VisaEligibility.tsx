import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

function scoreBand(p: number) {
  if (p >= 0.7) return { label: 'High', color: 'text-success' };
  if (p >= 0.4) return { label: 'Medium', color: 'text-warning' };
  return { label: 'Low', color: 'text-destructive' };
}

export default function VisaEligibility() {
  const [country, setCountry] = useState('Canada');
  const [gpa, setGpa] = useState('3.2');
  const [ielts, setIelts] = useState('6.5');
  const [financial, setFinancial] = useState('adequate');
  const [hasOffer, setHasOffer] = useState('yes');
  const [calc, setCalc] = useState<number | null>(null);
  const navigate = useNavigate();

  const compute = () => {
    const gpaNum = Math.max(0, Math.min(4, parseFloat(gpa || '0')));
    const ieltsNum = Math.max(0, Math.min(9, parseFloat(ielts || '0')));

    // Simple rule-based score approximating a logistic-like combination
    let s = 0;
    s += (gpaNum / 4) * 0.35; // academics
    s += (ieltsNum / 9) * 0.25; // language
    s += (financial === 'adequate' ? 0.25 : financial === 'strong' ? 0.35 : 0.1); // funds
    s += hasOffer === 'yes' ? 0.15 : 0.05; // offer letter

    // Destination modifier
    const destBoost = country === 'Canada' ? 0.0 : country === 'UK' ? -0.02 : 0.0;
    s = Math.max(0, Math.min(1, s + destBoost));

    setCalc(s);
  };

  const band = calc !== null ? scoreBand(calc) : null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Visa Eligibility Estimator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>GPA (out of 4.0)</Label>
              <Input type="number" step="0.01" value={gpa} onChange={(e) => setGpa(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>IELTS Overall (0-9)</Label>
              <Input type="number" step="0.5" value={ielts} onChange={(e) => setIelts(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Financial Proof</Label>
              <Select value={financial} onValueChange={setFinancial}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="adequate">Adequate</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Offer Letter</Label>
              <Select value={hasOffer} onValueChange={setHasOffer}>
                <SelectTrigger>
                  <SelectValue placeholder="Have offer?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={compute} className="w-full">Estimate</Button>
          {calc !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Estimated Probability</span>
                <span className={band?.color}>{band?.label}</span>
              </div>
              <Progress value={Math.round(calc * 100)} />
              <p className="text-xs text-muted-foreground">
                This is a heuristic estimate and does not guarantee outcomes. Consult official guidance.
              </p>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
