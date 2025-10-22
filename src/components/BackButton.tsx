import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import React from 'react';

export interface BackButtonProps extends React.ComponentProps<typeof Button> {
  fallback?: string;
  label?: string;
}

export default function BackButton({ fallback = '/', label = 'Back', className, ...buttonProps }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    try {
      // Prefer history back when possible
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch (_) {
      // no-op, fallback below
    }
    // Safe fallback
    navigate(fallback);
  };

  return (
    <Button {...buttonProps} onClick={handleClick} className={cn(className)}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
