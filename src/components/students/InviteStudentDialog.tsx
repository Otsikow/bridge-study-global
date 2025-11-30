import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2 } from "lucide-react";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { tenantStudentsQueryKey } from "@/hooks/useTenantStudents";

const inviteStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please provide at least 2 characters.")
    .max(200, "Name cannot exceed 200 characters."),
  email: z.string().email("Enter a valid email address."),
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || value.trim().length >= 6,
      "If provided, phone number should contain at least 6 characters.",
    ),
});

type InviteStudentFormValues = z.infer<typeof inviteStudentSchema>;

const extractInviteErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof FunctionsHttpError || error instanceof FunctionsRelayError) {
    const response = error.context;

    if (response instanceof Response) {
      try {
        const parsedBody = await response.clone().json();

        if (parsedBody?.error && typeof parsedBody.error === "string") {
          return parsedBody.error;
        }

        if (typeof parsedBody === "string") {
          return parsedBody;
        }
      } catch {
        // Ignore JSON parse errors and fall back to the plain text body.
      }

      try {
        const text = await response.clone().text();
        if (text) return text;
      } catch {
        // Ignore body parsing failures and fall through to the default message.
      }
    }

    return error.message;
  }

  if (error instanceof FunctionsFetchError) {
    return "Unable to reach the invite service. Please check your connection and try again.";
  }

  if (error instanceof Error) return error.message;

  return "Unexpected error while inviting the student.";
};

export interface InviteStudentDialogProps {
  tenantId?: string | null;
  agentProfileId?: string | null;
  counselorProfileId?: string | null;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  triggerLabel?: string;
  onSuccess?: () => void;
}

export function InviteStudentDialog({
  tenantId,
  agentProfileId,
  counselorProfileId,
  disabled,
  open,
  onOpenChange,
  title = "Invite a student",
  description = "Send an invite to connect a student to your dashboard. They\u2019ll receive an email with instructions to activate their account.",
  triggerLabel = "Invite Student",
  onSuccess,
}: InviteStudentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteStudentFormValues>({
    resolver: zodResolver(inviteStudentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  const canInvite = useMemo(() => {
    if (!tenantId) return false;
    return Boolean(agentProfileId || counselorProfileId);
  }, [agentProfileId, counselorProfileId, tenantId]);

  const closeDialog = () => {
    onOpenChange(false);
    reset();
  };

  const invalidateQueries = (currentTenantId: string) => {
    queryClient.invalidateQueries({
      queryKey: tenantStudentsQueryKey(currentTenantId),
    });

    const staffBaseKey = ["staff", "students", currentTenantId] as const;

    queryClient.invalidateQueries({
      queryKey: staffBaseKey,
      exact: false,
    });
  };

  const onSubmit = async (values: InviteStudentFormValues) => {
    if (!tenantId || !canInvite) {
      toast({
        title: "Invite unavailable",
        description: "We couldn\u2019t verify the required staff or agent details. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: {
        fullName: string;
        email: string;
        phone?: string;
        tenantId: string;
        agentProfileId?: string;
        counselorProfileId?: string;
      } = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        tenantId,
      };

      if (values.phone?.trim()) {
        payload.phone = values.phone.trim();
      }

      if (agentProfileId) {
        payload.agentProfileId = agentProfileId;
      }

      if (counselorProfileId) {
        payload.counselorProfileId = counselorProfileId;
      }

      const { data, error } = await supabase.functions.invoke<{
        success?: boolean;
        studentId?: string;
        inviteType?: string;
        error?: string;
      }>("invite-student", {
        body: payload,
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const inviteSuccessful = data?.success ?? Boolean(data?.studentId);

      if (!inviteSuccessful) {
        throw new Error("The student invite could not be completed.");
      }

      toast({
        title: "Student invited",
        description: `${values.fullName} will receive an email with next steps.`,
      });

      closeDialog();

      invalidateQueries(tenantId);

      onSuccess?.();
    } catch (error) {
      const message = await extractInviteErrorMessage(error);

      toast({
        title: "Unable to invite student",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogTrigger asChild>
        <Button disabled={disabled || !canInvite} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number (optional)</Label>
            <Input id="phone" autoComplete="tel" {...register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <DialogFooter className="gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={closeDialog}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default InviteStudentDialog;
