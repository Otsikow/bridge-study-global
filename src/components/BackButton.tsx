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
    navigate(fallback);
  };

  return (
    <Button 
      {...buttonProps} 
      className={cn(className)} 
      onClick={(e) => {
        buttonProps.onClick?.(e);
        if (!e.defaultPrevented) {
          handleClick();
        }
      }}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
