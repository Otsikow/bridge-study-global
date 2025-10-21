import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'status-draft' },
  submitted: { label: 'Submitted', className: 'status-submitted' },
  screening: { label: 'Screening', className: 'status-screening' },
  conditional_offer: { label: 'Conditional Offer', className: 'status-conditional' },
  unconditional_offer: { label: 'Unconditional Offer', className: 'status-unconditional' },
  cas_loa: { label: 'CAS/LOA', className: 'status-unconditional' },
  visa: { label: 'Visa Stage', className: 'status-submitted' },
  enrolled: { label: 'Enrolled', className: 'status-enrolled' },
  withdrawn: { label: 'Withdrawn', className: 'status-withdrawn' },
  deferred: { label: 'Deferred', className: 'status-deferred' },
  pending: { label: 'Pending', className: 'status-conditional' },
  succeeded: { label: 'Succeeded', className: 'status-enrolled' },
  failed: { label: 'Failed', className: 'status-withdrawn' },
  approved: { label: 'Approved', className: 'status-enrolled' },
  paid: { label: 'Paid', className: 'status-enrolled' },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: 'status-draft' };
  
  return (
    <Badge className={cn(config.className, 'px-2 py-1', className)}>
      {config.label}
    </Badge>
  );
};