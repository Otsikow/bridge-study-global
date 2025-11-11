import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingState } from "@/components/LoadingState";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";
import {
  withUniversityCardStyles,
  withUniversitySurfaceSubtle,
  withUniversitySurfaceTint,
} from "@/components/university/common/cardStyles";
import {
  useUniversityDashboard,
  UniversityProgram,
} from "@/components/university/layout/UniversityDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getSuggestedCurrencyForCountry } from "@/lib/universityProfile";

const PROGRAM_LEVEL_OPTIONS = [
  "Foundation",
  "Diploma",
  "Bachelor",
  "Master",
  "Doctorate",
  "Certificate",
  "Executive",
  "Short Course",
];

const CURRENCY_OPTIONS = ["USD", "CAD", "GBP", "EUR", "AUD", "NZD", "SGD"];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

const INTAKE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1;
  return {
    value,
    label: monthFormatter.format(new Date(2000, index, 1)),
  };
});

const programSchema = z.object({
  name: z.string().min(2, "Programme name is required"),
  level: z.string().min(2, "Level is required"),
  discipline: z.string().min(2, "Discipline is required"),
  durationMonths: z
    .number({ required_error: "Duration is required" })
    .min(1, "Duration must be at least one month"),
  tuitionCurrency: z.string().min(1, "Currency is required"),
  tuitionAmount: z
    .number({ required_error: "Tuition amount is required" })
    .min(0, "Tuition must be zero or greater"),
  applicationFee: z.number().min(0).nullable().optional(),
  seatsAvailable: z.number().min(0).nullable().optional(),
  ieltsOverall: z.number().min(0).max(9).nullable().optional(),
  toeflOverall: z.number().min(0).nullable().optional(),
  intakeMonths: z
    .array(z.number().int().min(1).max(12))
    .min(1, "Select at least one intake month"),
  entryRequirements: z.string().max(2000).optional(),
  description: z.string().max(4000).optional(),
  active: z.boolean(),
});

type ProgramFormValues = z.infer<typeof programSchema>;

interface ProgramFormProps {
  initialValues: ProgramFormValues;
  onSubmit: (values: ProgramFormValues) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  levelOptions: string[];
}

const defaultFormValues: ProgramFormValues = {
  name: "",
  level: "Master",
  discipline: "",
  durationMonths: 12,
  tuitionCurrency: "USD",
  tuitionAmount: 10000,
  applicationFee: null,
  seatsAvailable: null,
  ieltsOverall: null,
  toeflOverall: null,
  intakeMonths: [9],
  entryRequirements: "",
  description: "",
  active: true,
};

const ProgramForm = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  levelOptions,
}: ProgramFormProps) => {
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  const handleSubmit = (values: ProgramFormValues) => {
    void onSubmit(values);
  };

  const toggleIntakeMonth = (months: number[], month: number, checked: boolean) => {
    if (checked) {
      return Array.from(new Set([...months, month])).sort((a, b) => a - b);
    }
    return months.filter((value) => value !== month);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programme name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Master of Science in Data Analytics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background text-card-foreground">
                    {levelOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discipline</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="durationMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (months)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tuitionCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tuition currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background text-card-foreground">
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tuitionAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual tuition</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="100"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : 0);
                    }}
                  />
                </FormControl>
                <FormDescription>Enter the tuition for one academic year.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applicationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application fee</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="10"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seatsAvailable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seats available</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ieltsOverall"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IELTS overall</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={9}
                    step="0.5"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toeflOverall"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TOEFL overall</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={field.value ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value ? Number(value) : null);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="intakeMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intake months</FormLabel>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INTAKE_MONTH_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={withUniversitySurfaceTint("flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground")}
                  >
                    <Checkbox
                      checked={field.value.includes(option.value)}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          toggleIntakeMonth(
                            field.value,
                            option.value,
                            Boolean(checked),
                          ),
                        )
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <FormDescription>Select all intakes that students can apply for.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="entryRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entry requirements</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder={"Outline academic prerequisites, English requirements, etc. One requirement per line."}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>We surface these details to agents and students when they explore the programme.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Programme description</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Describe what makes this programme unique, the curriculum focus, and career outcomes."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className={withUniversitySurfaceTint("flex items-center justify-between rounded-xl px-4 py-3")}>
              <div>
                <FormLabel>Visibility</FormLabel>
                <FormDescription>
                  Active programmes are visible in agent workspaces and student search results.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const formatCurrency = (
  currency: string | null,
  amount: number | string | null,
) => {
  if (amount === null || amount === undefined) return "—";
  const numericAmount =
    typeof amount === "string" ? Number(amount) : Number(amount);
  if (!Number.isFinite(numericAmount)) return "—";
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  });
  try {
    return formatter.format(numericAmount);
  } catch (error) {
    console.warn("Unable to format currency", { currency, amount, error });
    return `${currency ?? "USD"} ${numericAmount.toLocaleString()}`;
  }
};

const parseEntryRequirements = (value?: string) => {
  if (!value) return null;
  const items = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return items.length > 0 ? items : null;
};

const ProgramsPage = () => {
  const { data, refetch, isLoading, isRefetching } = useUniversityDashboard();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER_OPTIONS)[number]["value"]>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<UniversityProgram | null>(
    null,
  );
  const [viewingProgram, setViewingProgram] = useState<UniversityProgram | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const programs = useMemo(
    () => data?.programs ?? [],
    [data?.programs],
  );
  const universityId = data?.university?.id ?? null;
  const tenantId = profile?.tenant_id ?? null;

  const levelFilterOptions = useMemo(() => {
    const unique = new Set<string>();
    programs.forEach((program) => {
      if (program.level) {
        unique.add(program.level);
      }
    });
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [programs]);

  const availableLevelOptions = useMemo(() => {
    const combined = new Set(PROGRAM_LEVEL_OPTIONS);
    programs.forEach((program) => {
      if (program.level) {
        combined.add(program.level);
      }
    });
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        program.name.toLowerCase().includes(normalizedSearch) ||
        (program.discipline ?? "").toLowerCase().includes(normalizedSearch);

      const matchesLevel =
        levelFilter === "all" ||
        program.level.toLowerCase() === levelFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && Boolean(program.active)) ||
        (statusFilter === "inactive" && !program.active);

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [programs, searchTerm, levelFilter, statusFilter]);

  useEffect(() => {
    if (levelFilter !== "all" && !levelFilterOptions.includes(levelFilter)) {
      setLevelFilter("all");
    }
  }, [levelFilter, levelFilterOptions]);

  const handleToggleActive = async (programId: string, nextActive: boolean) => {
    try {
      setUpdatingId(programId);
      const { error } = await supabase
        .from("programs")
        .update({ active: nextActive })
        .eq("id", programId);

      if (error) {
        throw error;
      }

      toast({
        title: "Programme updated",
        description: `Programme is now ${nextActive ? "active" : "inactive"}.`,
      });

      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to update programme",
        description:
          (error as Error)?.message ??
          "Please try again or contact your GEG partnership manager.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const buildPayloadFromForm = (values: ProgramFormValues) => ({
    name: values.name.trim(),
    level: values.level.trim(),
    discipline: values.discipline.trim(),
    duration_months: values.durationMonths,
    tuition_currency: values.tuitionCurrency,
    tuition_amount: values.tuitionAmount,
    app_fee: values.applicationFee ?? null,
    seats_available: values.seatsAvailable ?? null,
    ielts_overall: values.ieltsOverall ?? null,
    toefl_overall: values.toeflOverall ?? null,
    intake_months: values.intakeMonths
      .slice()
      .sort((a, b) => a - b),
    entry_requirements: parseEntryRequirements(values.entryRequirements),
    description:
      values.description && values.description.trim().length > 0
        ? values.description.trim()
        : null,
    active: values.active,
  });

  const handleCreateProgram = async (values: ProgramFormValues) => {
    if (!tenantId || !universityId) {
      toast({
        title: "Missing account information",
        description:
          "We could not determine your university profile. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildPayloadFromForm(values);
      const { error } = await supabase
        .from("programs")
        .insert({
          ...payload,
          tenant_id: tenantId,
          university_id: universityId,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Programme published",
        description: "Your new programme is now visible to agents and students.",
      });

      setIsCreateOpen(false);
      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to create programme",
        description:
          (error as Error)?.message ??
          "Please review your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgram = async (values: ProgramFormValues) => {
    if (!editingProgram) return;

    try {
      setIsSubmitting(true);
      const payload = buildPayloadFromForm(values);
      const { error } = await supabase
        .from("programs")
        .update(payload)
        .eq("id", editingProgram.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Programme updated",
        description: "Changes saved successfully.",
      });

      setEditingProgram(null);
      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to update programme",
        description:
          (error as Error)?.message ??
          "Please review your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!deletingId) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.from("programs").delete().eq("id", deletingId);

      if (error) {
        throw error;
      }

      toast({
        title: "Programme removed",
        description: "The programme will no longer appear in student searches.",
      });

      setDeletingId(null);
      await refetch();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to delete programme",
        description:
          (error as Error)?.message ?? "Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedCurrency = useMemo(
    () => getSuggestedCurrencyForCountry(data?.university?.country ?? null),
    [data?.university?.country],
  );

  if (isLoading && !data) {
    return <LoadingState message="Loading programmes" />;
  }

  const emptyFilters =
    searchTerm.trim().length === 0 &&
    levelFilter === "all" &&
    statusFilter === "all";

  const createInitialValues: ProgramFormValues = {
    ...defaultFormValues,
    tuitionCurrency: suggestedCurrency ?? defaultFormValues.tuitionCurrency,
  };

  const editInitialValues: ProgramFormValues | null = editingProgram
    ? {
        name: editingProgram.name,
        level: editingProgram.level,
        discipline: editingProgram.discipline ?? "",
        durationMonths:
          editingProgram.duration_months ?? defaultFormValues.durationMonths,
        tuitionCurrency:
          editingProgram.tuition_currency ??
          suggestedCurrency ??
          defaultFormValues.tuitionCurrency,
        tuitionAmount: (() => {
          const amount = editingProgram.tuition_amount;
          if (amount === null || amount === undefined) {
            return defaultFormValues.tuitionAmount;
          }
          const numeric =
            typeof amount === "string" ? Number(amount) : Number(amount);
          return Number.isFinite(numeric)
            ? numeric
            : defaultFormValues.tuitionAmount;
        })(),
        applicationFee: editingProgram.app_fee ?? null,
        seatsAvailable: editingProgram.seats_available ?? null,
        ieltsOverall: editingProgram.ielts_overall ?? null,
        toeflOverall: editingProgram.toefl_overall ?? null,
        intakeMonths:
          editingProgram.intake_months && editingProgram.intake_months.length > 0
            ? editingProgram.intake_months
            : defaultFormValues.intakeMonths,
        entryRequirements: (editingProgram.entry_requirements ?? []).join("\n"),
        description: editingProgram.description ?? "",
        active: Boolean(editingProgram.active),
      }
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Programmes</h1>
        <p className="text-sm text-muted-foreground">
          Manage your published courses and control which ones are visible to GEG agents and students.
        </p>
      </div>

      <Card className={withUniversityCardStyles("rounded-2xl text-card-foreground")}>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-card-foreground">
              Programme catalogue
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {programs.length} programme{programs.length === 1 ? "" : "s"} connected to your university profile.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-blue-500 text-foreground hover:bg-primary">
            <Plus className="h-4 w-4" /> Add programme
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by programme name or discipline"
                  className="pl-9"
                />
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="sm:w-[180px]">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent className="bg-background text-card-foreground">
                  {levelFilterOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "all" ? "All levels" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background text-card-foreground">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isRefetching ? (
              <Badge variant="outline" className="self-start border-primary/30 bg-primary/10 text-primary">
                Updating data…
              </Badge>
            ) : null}
          </div>

          {filteredPrograms.length === 0 ? (
            emptyFilters ? (
              <StatePlaceholder
                title="No programmes found"
                description="Add programmes to populate your catalogue and make them available to students."
                className="bg-transparent"
                action={
                  <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add your first programme
                  </Button>
                }
              />
            ) : (
              <StatePlaceholder
                title="No programmes match your filters"
                description="Try adjusting your search term, level, or status filters."
                className="bg-transparent"
              />
            )
          ) : (
            <div className={withUniversitySurfaceTint("overflow-hidden rounded-xl bg-muted/30")}>
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Programme</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Discipline</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Tuition</th>
                    <th className="px-4 py-3 font-medium">Intakes</th>
                    <th className="px-4 py-3 font-medium">Seats</th>
                    <th className="px-4 py-3 text-right font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} className="text-foreground">
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground">{program.name}</span>
                          {program.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {program.description}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge variant="outline" className="border-border bg-muted/60 text-foreground">
                          {program.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">{program.discipline ?? "—"}</td>
                      <td className="px-4 py-4 align-top">
                        {program.duration_months ? `${program.duration_months} months` : "—"}
                      </td>
                      <td className="px-4 py-4 align-top">{formatCurrency(program.tuition_currency, program.tuition_amount)}</td>
                      <td className="px-4 py-4 align-top">
                        {program.intake_months && program.intake_months.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {program.intake_months
                              .slice()
                              .sort((a, b) => a - b)
                              .map((month) => (
                                <Badge
                                  key={`${program.id}-${month}`}
                                  variant="secondary"
                                  className="border-border bg-muted/50 text-foreground"
                                >
                                  {monthFormatter.format(new Date(2000, month - 1, 1))}
                                </Badge>
                              ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {typeof program.seats_available === "number"
                          ? program.seats_available
                          : "—"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col items-end gap-3">
                          <Badge
                            variant="outline"
                            className={
                              program.active
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-border bg-muted/50 text-muted-foreground"
                            }
                          >
                            {program.active ? "Active" : "Inactive"}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Visible</span>
                            <Switch
                              checked={Boolean(program.active)}
                              onCheckedChange={(checked) =>
                                void handleToggleActive(program.id, checked)
                              }
                              disabled={updatingId === program.id}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 border border-border bg-background text-card-foreground"
                            >
                              <DropdownMenuItem onClick={() => setViewingProgram(program)}>
                                <Eye className="mr-2 h-4 w-4" /> View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingProgram(program)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit programme
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingId(program.id)}
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-200"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete programme
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-border bg-background text-card-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add a new programme</DialogTitle>
            <DialogDescription>
              Publish a new course to make it available to agents and students across the GEG ecosystem.
            </DialogDescription>
          </DialogHeader>
          <ProgramForm
            initialValues={createInitialValues}
            onSubmit={handleCreateProgram}
            onCancel={() => setIsCreateOpen(false)}
            isSubmitting={isSubmitting}
            submitLabel="Create programme"
            levelOptions={availableLevelOptions}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingProgram)} onOpenChange={(open) => !open && setEditingProgram(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-border bg-background text-card-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit programme</DialogTitle>
            <DialogDescription>
              Update programme details to ensure students have the most accurate information.
            </DialogDescription>
          </DialogHeader>
          {editInitialValues ? (
            <ProgramForm
              initialValues={editInitialValues}
              onSubmit={handleUpdateProgram}
              onCancel={() => setEditingProgram(null)}
              isSubmitting={isSubmitting}
              submitLabel="Save changes"
              levelOptions={availableLevelOptions}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingProgram)} onOpenChange={(open) => !open && setViewingProgram(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden border border-border bg-background text-card-foreground sm:max-w-2xl">
          {viewingProgram ? (
            <>
              <DialogHeader className="pb-2">
                <DialogTitle className="text-xl text-foreground">{viewingProgram.name}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {viewingProgram.discipline ?? "Discipline not specified"}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-5 pb-2 text-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Level</span>
                      <p className="mt-1 text-base text-foreground">{viewingProgram.level}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Duration</span>
                      <p className="mt-1 text-base text-foreground">
                        {viewingProgram.duration_months
                          ? `${viewingProgram.duration_months} months`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Annual tuition</span>
                      <p className="mt-1 text-base text-foreground">
                        {formatCurrency(
                          viewingProgram.tuition_currency,
                          viewingProgram.tuition_amount,
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Application fee</span>
                      <p className="mt-1 text-base text-foreground">
                        {viewingProgram.app_fee ?
                          formatCurrency(viewingProgram.tuition_currency, viewingProgram.app_fee) :
                          "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Seats available</span>
                      <p className="mt-1 text-base text-foreground">
                        {typeof viewingProgram.seats_available === "number"
                          ? viewingProgram.seats_available
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">English requirements</span>
                      <p className="mt-1 text-base text-foreground">
                        {viewingProgram.ielts_overall || viewingProgram.toefl_overall ? (
                          <span>
                            {viewingProgram.ielts_overall
                              ? `IELTS ${viewingProgram.ielts_overall}`
                              : ""}
                            {viewingProgram.ielts_overall && viewingProgram.toefl_overall ? " • " : ""}
                            {viewingProgram.toefl_overall
                              ? `TOEFL ${viewingProgram.toefl_overall}`
                              : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Intake months</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {viewingProgram.intake_months && viewingProgram.intake_months.length > 0 ? (
                        viewingProgram.intake_months
                          .slice()
                          .sort((a, b) => a - b)
                          .map((month) => (
                            <Badge
                              key={`${viewingProgram.id}-detail-${month}`}
                              variant="secondary"
                              className="border-border bg-muted/50 text-foreground"
                            >
                              {monthFormatter.format(new Date(2000, month - 1, 1))}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-muted-foreground">No intake months specified.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Entry requirements</span>
                    {viewingProgram.entry_requirements && viewingProgram.entry_requirements.length > 0 ? (
                      <ul className="mt-2 space-y-2 text-foreground">
                        {viewingProgram.entry_requirements.map((requirement, index) => (
                          <li key={`${viewingProgram.id}-requirement-${index}`} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-muted-foreground">No entry requirements provided.</p>
                    )}
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Programme overview</span>
                    <p className="mt-2 whitespace-pre-line text-foreground">
                      {viewingProgram.description?.length
                        ? viewingProgram.description
                        : "No programme overview has been provided yet."}
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="pt-4">
                <Button variant="ghost" onClick={() => setViewingProgram(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="border border-border bg-background text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete programme</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the programme from student search results and agent dashboards. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-400"
              onClick={() => void handleDeleteProgram()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProgramsPage;
