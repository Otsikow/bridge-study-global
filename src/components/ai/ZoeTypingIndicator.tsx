import { cn } from "@/lib/utils";

interface ZoeTypingIndicatorProps {
  className?: string;
}

export function ZoeTypingIndicator({ className }: ZoeTypingIndicatorProps) {
  return (
    <span className={cn("zoe-typing-indicator", className)} aria-hidden="true">
      <span className="zoe-typing-indicator__dot" />
      <span className="zoe-typing-indicator__dot" />
      <span className="zoe-typing-indicator__dot" />
    </span>
  );
}

export default ZoeTypingIndicator;
