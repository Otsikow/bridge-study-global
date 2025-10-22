import VisaCalculator from '@/components/visa/VisaCalculator';
import { ThemeToggle } from '@/components/ThemeToggle';
import BackButton from '@/components/BackButton';

export default function VisaCalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Lightweight header with theme toggle */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton variant="ghost" size="sm" fallback="/" />
          <ThemeToggle />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <VisaCalculator />
      </div>
    </div>
  );
}