import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useAgentInviteCode } from "@/hooks/useAgentInviteCode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AgentInviteCodeManagerProps {
  agentProfileId: string;
}

export default function AgentInviteCodeManager({
  agentProfileId,
}: AgentInviteCodeManagerProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const {
    data: inviteCode,
    isLoading,
    isError,
    regenerate,
    isRegenerating,
  } = useAgentInviteCode(agentProfileId);

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invite Code</CardTitle>
        <CardDescription>
          Share this code with students to allow them to join your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            Could not load invite code.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <Label htmlFor="invite-code" className="sr-only">
              Invite Code
            </Label>
            <Input id="invite-code" value={inviteCode} readOnly />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => regenerate()}
              disabled={isRegenerating}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
