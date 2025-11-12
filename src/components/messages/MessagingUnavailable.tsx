import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MessagingUnavailableProps {
  reason: string;
  title?: string;
  redirectHref?: string;
  redirectLabel?: string;
  onRetry?: () => void;
}

export function MessagingUnavailable({
  reason,
  title = "Messaging is temporarily unavailable",
  redirectHref = "/",
  redirectLabel = "Go home",
  onRetry,
}: MessagingUnavailableProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-xl text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{reason}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {onRetry && (
              <Button variant="outline" onClick={onRetry} data-testid="messaging-retry">
                Try again
              </Button>
            )}
            <Button onClick={() => navigate(redirectHref)} data-testid="messaging-redirect">
              {redirectLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MessagingUnavailable;
