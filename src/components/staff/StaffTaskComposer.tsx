import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTask, useStaffTaskAssignees } from "@/hooks/useStaffData";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

type PriorityOption = "high" | "medium" | "low";

interface FormState {
  title: string;
  description: string;
  priority: PriorityOption;
  dueDate: string;
  assigneeId: string;
  applicationId: string;
}

const initialState: FormState = {
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assigneeId: "",
  applicationId: "",
};

export interface StaffTaskComposerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  triggerLabel?: string;
  triggerChildren?: ReactNode;
  triggerProps?: ButtonProps;
}

export function StaffTaskComposer({
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  triggerLabel = "Add task",
  triggerChildren,
  triggerProps,
}: StaffTaskComposerProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const { toast } = useToast();
  const { data: assignees, isLoading: loadingAssignees, isError: assigneeError } = useStaffTaskAssignees();
  const createTask = useCreateTask();

  const isControlled = typeof controlledOpen === "boolean" && typeof onOpenChange === "function";
  const dialogOpen = isControlled ? (controlledOpen as boolean) : internalOpen;

  const setDialogOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        onOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onOpenChange],
  );

  const selectableAssignees = useMemo(() => {
    if (!assignees) return [];
    return assignees.filter((assignee) => assignee.id !== "unassigned" || assignees.length === 1);
  }, [assignees]);

  useEffect(() => {
    if (!assignees?.length) return;
    if (form.assigneeId) return;

    const preferred = assignees.find((assignee) => assignee.isSelf) ?? assignees[0];
    setForm((prev) => ({ ...prev, assigneeId: preferred.id }));
  }, [assignees, form.assigneeId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setDialogOpen(nextOpen);
    if (!nextOpen) {
      setForm(initialState);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast({
        title: "Add a task title",
        description: "Zoe needs a clear title to route the task to the right teammate.",
        variant: "destructive",
      });
      return;
    }

    const dueAt = form.dueDate ? new Date(form.dueDate).toISOString() : undefined;
    const assigneeValue = form.assigneeId === "unassigned" ? undefined : form.assigneeId || undefined;

    createTask.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim() ? form.description.trim() : undefined,
        priority: form.priority,
        dueAt,
        assigneeId: assigneeValue,
        applicationId: form.applicationId.trim() ? form.applicationId.trim() : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Task logged",
            description: "Zoe will keep this workflow in sync with your admissions pipeline.",
          });
          setForm(initialState);
          handleOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: "Unable to create task",
            description:
              error instanceof Error
                ? error.message
                : "Zoe couldn’t save that task. Please try again in a moment.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button className="w-full justify-center gap-2 sm:w-auto" size="sm" {...triggerProps}>
            {triggerChildren ?? (
              <>
                <Plus className="h-4 w-4" /> {triggerLabel}
              </>
            )}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a manual task</DialogTitle>
          <DialogDescription>
            Zoe automatically creates tasks from application events. Use this form when you need to log an ad-hoc follow-up.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Task title</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Collect financial documents from student"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Details</Label>
            <Textarea
              id="task-description"
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Add context for Zoe and your teammates"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value: PriorityOption) => setForm((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, assigneeId: value }))}
                disabled={loadingAssignees || assigneeError}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingAssignees ? "Loading teammates…" : "Select teammate"} />
                </SelectTrigger>
                <SelectContent>
                  {selectableAssignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.name}
                      {assignee.isSelf ? " (You)" : ""}
                    </SelectItem>
                  ))}
                  {assignees?.some((assignee) => assignee.id === "unassigned") ? (
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-application">Application ID (optional)</Label>
              <Input
                id="task-application"
                value={form.applicationId}
                onChange={(event) => setForm((prev) => ({ ...prev, applicationId: event.target.value }))}
                placeholder="Link to an application"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending} className="gap-2">
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StaffTaskComposer;
