import React from 'react';
import { Progress } from '@/components/ui/progress';

const SuccessRate = ({ rate }) => {
  const getProgressColor = () => {
    if (rate >= 85) return 'bg-success';
    if (rate >= 70) return 'bg-warning';
    return 'bg-destructive';
  };

  const getTextColor = () => {
    if (rate >= 85) return 'text-success';
    if (rate >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="flex items-center gap-x-2">
      <div className="w-2/3">
        <Progress value={rate} className={getProgressColor()} />
      </div>
      <div className="w-1/3 text-right">
        <span className={`text-sm font-medium ${getTextColor()}`}>{rate}%</span>
      </div>
    </div>
  );
};

export default SuccessRate;
