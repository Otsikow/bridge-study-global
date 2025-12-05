import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { withUniversitySurfaceTint } from "@/components/university/common/cardStyles";

//
// ---------------------
// SCHEMAS & CONSTANTS
// ---------------------
//

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

export const INTAKE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1;
  return { value, label: monthFormatter.format(new Date(2000, index, 1)) };
});

const CURRENCY_OPTIONS = ["USD", "CAD", "GBP", "EUR", "AUD", "NZD", "SGD"];

const PROGRAM_IMAGE_BUCKET = "university-media";
const PROGRAM_IMAGE_FOLDER = "program-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const optionalImageUrlSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => {
      if (!v) return true;
      try {
        const parsed = new URL(v);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid image URL including https://" },
  )
  .transform((value) => (value?.trim() ? value.trim() : null));

export const programSchema = z.object({
  name: z.string().min(2),
  level: z.string().min(2),
  discipline: z.string().min(2),
  durationMonths: z.number().min(1),
  tuitionCurrency: z.string().min(1),
  tuitionAmount: z.number().min(0),
  applicationFee: z.number().min(0).nullable().optional(),
  seatsAvailable: z.number().min(0).nullable().optional(),
  ieltsOverall: z.number().min(0).max(9).nullable().optional(),
  toeflOverall: z.number().min(0).nullable().optional(),
  intakeMonths: z.array(z.number().int().min(1).max(12)).min(1),
  entryRequirements: z.string().max(2000).optional(),
  description: z.string().max(4000).optional(),
  imageUrl: optionalImageUrlSchema,
  active: z.boolean(),
});

export type ProgramFormValues = z.infer<typeof programSchema>;

//
// --------------------------
// HELPERS
// --------------------------
//

const extractStorageObject = (url: string | null | undefined) => {
  if (!url) return null;
  const match = url.match(/storage\/v1\/object\/public\/([^?]+)/);
  if (!match) return null;

  const [bucket, ...pathParts] = match[1].split("/");
  if (!bucket || pathParts.length === 0) return null;

  return { bucket, path: pathParts.join("/") };
};

//
// --------------------------
// COMPONENT
// --------------------------
//

interface ProgramFormProps {
  initialValues: ProgramFormValues;
  onSubmit: (values: ProgramFormValues) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  levelOptions: string[];
  tenantId: string | null;
  userId: string | null;
}

export default function ProgramForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  levelOptions,
  tenantId,
  userId,
}: ProgramFormProps) {
  const { toast } = useToast();
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues]);

  //
  // IMAGE UPLOAD HANDLING
  //
  const removeImage = async (url: string | null) => {
    const obj = extractStorageObject(url);
    if (!obj) return;

    await supabase.storage.from(obj.bucket).remove([obj.path]);
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!tenantId) {
      toast({
        title: "Unable to upload",
        description: "Tenant account missing.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in again.",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file",
        description: "Only JPG, PNG, WebP allowed.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: "Max 5MB allowed.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const prev = form.getValues("imageUrl");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const objectPath = `${tenantId}/${PROGRAM_IMAGE_FOLDER}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(PROGRAM_IMAGE_BUCKET)
        .upload(objectPath, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage
        .from(PROGRAM_IMAGE_BUCKET)
        .getPublicUrl(objectPath);

      const publicUrl = pub.publicUrl;

      form.setValue("imageUrl", publicUrl, {
        shouldDirty: true,
        shouldTouch: true,
      });

      if (prev && prev !== publicUrl) {
        await removeImage(prev);
      }

      toast({ title: "Image uploaded" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: (err as Error)?.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  //
  // MAIN RETURN
  //
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* NAME */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Programme name</FormLabel>
                <FormControl>
                  <Input placeholder="Master of AI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* LEVEL */}
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
                  <SelectContent>
                    {levelOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* DISCIPLINE */}
          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discipline</FormLabel>
                <FormControl>
                  <Input placeholder="Computer Science" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* DURATION */}
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
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* TUITION CURRENCY */}
          <FormField
            control={form.control}
            name="tuitionCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* TUITION AMOUNT */}
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
                    step={100}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Enter fee for one academic year.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* IMAGE */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Programme image</FormLabel>

              {/* DISPLAY PREVIEW */}
              {field.value ? (
                <div className="relative overflow-hidden rounded-xl border">
                  <img
                    src={field.value}
                    alt="Programme"
                    className="h-56 w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="absolute right-3 top-3"
                    onClick={() => {
                      removeImage(field.value);
                      field.onChange(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div
                  className={withUniversitySurfaceTint(
                    "flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-sm"
                  )}
                >
                  <ImageIcon className="h-8 w-8 mb-2" />
                  No image uploaded
                </div>
              )}

              {/* CONTROLS */}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSubmitting}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload image
                    </>
                  )}
                </Button>

                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  disabled={!!field.value}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value.trim().length > 0
                        ? e.target.value.trim()
                        : null
                    )
                  }
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />

              <FormMessage />
            </FormItem>
          )}
        />

        {/* INTAKE MONTHS */}
        <FormField
          control={form.control}
          name="intakeMonths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intake months</FormLabel>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {INTAKE_MONTH_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                  >
                    <Checkbox
                      checked={field.value.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange(
                            [...field.value, opt.value].sort((a, b) => a - b)
                          );
                        } else {
                          field.onChange(
                            field.value.filter((m) => m !== opt.value)
                          );
                        }
                      }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <FormDescription>Students can apply for these intakes.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ENTRY REQUIREMENTS */}
        <FormField
          control={form.control}
          name="entryRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entry requirements</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="One requirement per line..."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DESCRIPTION */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Programme description</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Describe the programme..."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ACTIVE */}
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl px-4 py-3">
              <div>
                <FormLabel>Visibility</FormLabel>
                <FormDescription>Controls if agents/students see this programme.</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* FOOTER */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
import { useMemo } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { withUniversitySurfaceTint } from "@/components/university/common/cardStyles";

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

// UTILITY
const formatCurrency = (currency: string | null, amount: number | null) => {
  if (amount === null || amount === undefined) return "—";

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  });

  try {
    return formatter.format(amount);
  } catch {
    return `${currency ?? "USD"} ${amount}`;
  }
};

//
// ------------------------------
// MAIN COMPONENT
// ------------------------------
//

interface ProgramTableProps {
  programs: any[];
  searchTerm: string;
  onSearchChange: (value: string) => void;

  levelFilter: string;
  levelOptions: string[];
  onLevelFilterChange: (value: string) => void;

  statusFilter: "all" | "active" | "inactive";
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;

  onToggleActive: (programId: string, nextActive: boolean) => void;
  updatingId: string | null;

  onView: (program: any) => void;
  onEdit: (program: any) => void;
  onDelete: (programId: string) => void;
}

export default function ProgramTable({
  programs,
  searchTerm,
  onSearchChange,
  levelFilter,
  levelOptions,
  onLevelFilterChange,
  statusFilter,
  onStatusFilterChange,
  onToggleActive,
  updatingId,
  onView,
  onEdit,
  onDelete,
}: ProgramTableProps) {
  //
  // FILTER PROGRAMS
  //
  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();

    return programs.filter((p) => {
      const matchesSearch =
        s.length === 0 ||
        p.name.toLowerCase().includes(s) ||
        (p.discipline ?? "").toLowerCase().includes(s);

      const matchesLevel =
        levelFilter === "all" ||
        p.level.toLowerCase() === levelFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.active) ||
        (statusFilter === "inactive" && !p.active);

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [programs, searchTerm, levelFilter, statusFilter]);

  //
  // UI
  //
  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 flex-1">
          {/* SEARCH */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or discipline"
              className="pl-9"
            />
          </div>

          {/* LEVEL FILTER */}
          <Select value={levelFilter} onValueChange={onLevelFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt === "all" ? "All levels" : opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* STATUS FILTER */}
          <Select
            value={statusFilter}
            onValueChange={(v) => onStatusFilterChange(v as any)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <div className={withUniversitySurfaceTint("rounded-xl bg-muted/30")}>
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
                <th className="px-4 py-3 font-medium text-right">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id}>
                  {/* NAME + IMAGE */}
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      {p.image_url ? (
                        <div className="hidden sm:block h-12 w-12 rounded-md overflow-hidden border bg-muted/30">
                          <img
                            src={p.image_url}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <div>
                        <span className="font-semibold">{p.name}</span>
                        {p.description ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {p.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* LEVEL */}
                  <td className="px-4 py-4 align-top">
                    <Badge variant="outline">{p.level}</Badge>
                  </td>

                  {/* DISCIPLINE */}
                  <td className="px-4 py-4 align-top">
                    {p.discipline ?? "—"}
                  </td>

                  {/* DURATION */}
                  <td className="px-4 py-4 align-top">
                    {p.duration_months
                      ? `${p.duration_months} months`
                      : "—"}
                  </td>

                  {/* TUITION */}
                  <td className="px-4 py-4 align-top">
                    {formatCurrency(p.tuition_currency, p.tuition_amount)}
                  </td>

                  {/* INTAKES */}
                  <td className="px-4 py-4 align-top">
                    {p.intake_months?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {p.intake_months
                          .slice()
                          .sort((a, b) => a - b)
                          .map((m) => (
                            <Badge
                              key={`${p.id}-${m}`}
                              variant="secondary"
                              className="bg-muted/50"
                            >
                              {monthFormatter.format(new Date(2000, m - 1, 1))}
                            </Badge>
                          ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* SEATS */}
                  <td className="px-4 py-4 align-top">
                    {p.seats_available ?? "—"}
                  </td>

                  {/* STATUS TOGGLE */}
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col items-end">
                      <Badge
                        variant="outline"
                        className={
                          p.active
                            ? "border-success/30 bg-success/10 text-success"
                            : "bg-muted/50"
                        }
                      >
                        {p.active ? "Active" : "Inactive"}
                      </Badge>

                      <Switch
                        className="mt-2"
                        checked={p.active}
                        disabled={updatingId === p.id}
                        onCheckedChange={(checked) =>
                          onToggleActive(p.id, checked)
                        }
                      />
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onView(p)}>
                            <Eye className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => onEdit(p)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onDelete(p.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
      </div>
    </div>
  );
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });

//
// -----------------------------
// UTILITY
// -----------------------------
//

const formatCurrency = (currency: string | null, amount: number | null) => {
  if (amount === null || amount === undefined) return "—";

  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "—";

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  });

  try {
    return formatter.format(numeric);
  } catch {
    return `${currency ?? "USD"} ${numeric}`;
  }
};

//
// -----------------------------
// MAIN COMPONENT
// -----------------------------
//

interface ProgramViewDialogProps {
  program: any | null;
  open: boolean;
  onClose: () => void;
}

export default function ProgramViewDialog({
  program,
  open,
  onClose,
}: ProgramViewDialogProps) {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-hidden border border-border bg-background text-card-foreground sm:max-w-2xl">
        {/* HEADER */}
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl text-foreground">
            {program.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {program.discipline ?? "Discipline not specified"}
          </DialogDescription>
        </DialogHeader>

        {/* IMAGE */}
        {program.image_url ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-border">
            <img
              src={program.image_url}
              alt={`${program.name} cover`}
              className="h-56 w-full object-cover"
            />
          </div>
        ) : null}

        {/* BODY */}
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 pb-4 text-sm">
            {/* GRID DETAILS */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Level
                </span>
                <p className="mt-1 text-base text-foreground">
                  {program.level}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Duration
                </span>
                <p className="mt-1 text-base text-foreground">
                  {program.duration_months
                    ? `${program.duration_months} months`
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Annual tuition
                </span>
                <p className="mt-1 text-base text-foreground">
                  {formatCurrency(
                    program.tuition_currency,
                    program.tuition_amount,
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Application fee
                </span>
                <p className="mt-1 text-base text-foreground">
                  {program.app_fee
                    ? formatCurrency(
                        program.tuition_currency,
                        program.app_fee,
                      )
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Seats available
                </span>
                <p className="mt-1 text-base text-foreground">
                  {typeof program.seats_available === "number"
                    ? program.seats_available
                    : "—"}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  English requirements
                </span>
                <p className="mt-1 text-base text-foreground">
                  {program.ielts_overall || program.toefl_overall ? (
                    <span>
                      {program.ielts_overall
                        ? `IELTS ${program.ielts_overall}`
                        : ""}
                      {program.ielts_overall && program.toefl_overall
                        ? " • "
                        : ""}
                      {program.toefl_overall
                        ? `TOEFL ${program.toefl_overall}`
                        : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            {/* INTAKE MONTHS */}
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Intake months
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {program.intake_months?.length ? (
                  program.intake_months
                    .slice()
                    .sort((a: number, b: number) => a - b)
                    .map((month: number) => (
                      <Badge
                        key={`${program.id}-detail-${month}`}
                        variant="secondary"
                        className="border-border bg-muted/50 text-foreground"
                      >
                        {monthFormatter.format(new Date(2000, month - 1, 1))}
                      </Badge>
                    ))
                ) : (
                  <span className="text-muted-foreground">
                    No intakes specified.
                  </span>
                )}
              </div>
            </div>

            {/* ENTRY REQUIREMENTS */}
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Entry requirements
              </span>

              {program.entry_requirements?.length ? (
                <ul className="mt-2 space-y-2 text-foreground">
                  {program.entry_requirements.map(
                    (req: string, index: number) => (
                      <li key={`${program.id}-req-${index}`} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{req}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No entry requirements provided.
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Programme overview
              </span>
              <p className="mt-2 whitespace-pre-line text-foreground">
                {program.description?.length
                  ? program.description
                  : "No programme overview provided."}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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

import { Button } from "@/components/ui/button";

interface ProgramDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function ProgramDeleteDialog({
  open,
  onClose,
  onConfirm,
  isDeleting,
}: ProgramDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="border border-border bg-background text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete programme</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently remove the programme.  
            It will no longer appear to agents or students in UniDoxia.  
            <br />
            <strong>This cannot be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-400"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUniversityDashboard } from "@/components/university/layout/UniversityDashboardLayout";

// Components
import ProgramTable from "./ProgramTable";
import ProgramForm, { ProgramFormValues, programSchema } from "./ProgramForm";
import ProgramViewDialog from "./ProgramViewDialog";
import ProgramDeleteDialog from "./ProgramDeleteDialog";

// Utilities
import { getSuggestedCurrencyForCountry } from "@/lib/universityProfile";
import { LoadingState } from "@/components/LoadingState";
import { StatePlaceholder } from "@/components/university/common/StatePlaceholder";

//
// -----------------------------------------
// DEFAULT FORM VALUES
// -----------------------------------------
//

const defaultValues: ProgramFormValues = {
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
  imageUrl: null,
  active: true,
};

//
// -----------------------------------------
// PROGRAMS PAGE
// -----------------------------------------
//

export default function ProgramsPage() {
  const { data, refetch, isLoading } = useUniversityDashboard();
  const { profile, user } = useAuth();
  const { toast } = useToast();

  //
  // IDENTIFIERS (multi-tenant safety)
  //
  const tenantId = data?.university?.tenant_id ?? profile?.tenant_id ?? null;
  const universityId = data?.university?.id ?? null;

  //
  // LOCAL STATE
  //
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<any | null>(null);
  const [viewProgram, setViewProgram] = useState<any | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  //
  // PROGRAM LIST
  //
  const programs = data?.programs ?? [];

  //
  // LEVEL OPTIONS
  //
  const levelOptions = useMemo(() => {
    const unique = new Set<string>();
    programs.forEach((p) => p.level && unique.add(p.level));
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [programs]);

  //
  // AVAILABLE PROGRAM LEVELS TO SHOW IN FORM
  //
  const combinedLevelOptions = useMemo(() => {
    const defaults = [
      "Foundation",
      "Diploma",
      "Bachelor",
      "Master",
      "Doctorate",
      "Certificate",
      "Executive",
      "Short Course",
    ];

    const all = new Set(defaults);
    programs.forEach((p) => all.add(p.level));

    return Array.from(all).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  //
  // SUGGESTED CURRENCY (based on university country)
  //
  const suggestedCurrency = useMemo(() => {
    return getSuggestedCurrencyForCountry(data?.university?.country ?? null);
  }, [data?.university?.country]);

  //
  // INITIAL VALUES FOR CREATE FORM
  //
  const createInitialValues = useMemo(
    () => ({
      ...defaultValues,
      tuitionCurrency: suggestedCurrency ?? defaultValues.tuitionCurrency,
    }),
    [suggestedCurrency]
  );

  //
  // INITIAL VALUES FOR EDIT FORM
  //
  const editInitialValues = useMemo(() => {
    if (!editProgram) return null;

    return {
      name: editProgram.name,
      level: editProgram.level,
      discipline: editProgram.discipline ?? "",
      durationMonths: editProgram.duration_months ?? 12,
      tuitionCurrency: editProgram.tuition_currency ?? suggestedCurrency ?? "USD",
      tuitionAmount: Number(editProgram.tuition_amount ?? 10000),
      applicationFee: editProgram.app_fee ?? null,
      seatsAvailable: editProgram.seats_available ?? null,
      ieltsOverall: editProgram.ielts_overall ?? null,
      toeflOverall: editProgram.toefl_overall ?? null,
      intakeMonths:
        editProgram.intake_months?.length > 0
          ? editProgram.intake_months
          : [9],
      entryRequirements: (editProgram.entry_requirements ?? []).join("\n"),
      description: editProgram.description ?? "",
      imageUrl: editProgram.image_url ?? null,
      active: Boolean(editProgram.active),
    };
  }, [editProgram, suggestedCurrency]);

  //
  // -----------------------------------------
  // MULTI-TENANT SAFE CRUD OPERATIONS
  // -----------------------------------------
  //

  // CREATE
  const handleCreate = async (values: ProgramFormValues) => {
    if (!tenantId || !universityId) {
      toast({
        title: "Missing account information",
        description: "Could not verify university account.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name.trim(),
        level: values.level.trim(),
        discipline: values.discipline.trim(),
        duration_months: values.durationMonths,
        tuition_currency: values.tuitionCurrency,
        tuition_amount: values.tuitionAmount,
        app_fee: values.applicationFee,
        seats_available: values.seatsAvailable,
        ielts_overall: values.ieltsOverall,
        toefl_overall: values.toeflOverall,
        intake_months: values.intakeMonths.sort((a, b) => a - b),
        entry_requirements: values.entryRequirements
          ? values.entryRequirements
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
        description: values.description?.trim() || null,
        image_url: values.imageUrl,
        active: values.active,
        tenant_id: tenantId,
        university_id: universityId,
      };

      const { error } = await supabase
        .from("programs")
        .insert(payload);

      if (error) throw error;

      toast({ title: "Programme created" });
      setCreateOpen(false);
      await refetch();
    } catch (err) {
      toast({
        title: "Unable to create programme",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATE
  const handleUpdate = async (values: ProgramFormValues) => {
    if (!editProgram) return;

    if (!tenantId || !universityId) {
      toast({
        title: "Missing account information",
        description: "Could not verify university account.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: values.name.trim(),
        level: values.level.trim(),
        discipline: values.discipline.trim(),
        duration_months: values.durationMonths,
        tuition_currency: values.tuitionCurrency,
        tuition_amount: values.tuitionAmount,
        app_fee: values.applicationFee,
        seats_available: values.seatsAvailable,
        ielts_overall: values.ieltsOverall,
        toefl_overall: values.toeflOverall,
        intake_months: values.intakeMonths.sort((a, b) => a - b),
        entry_requirements: values.entryRequirements
          ? values.entryRequirements
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean)
          : [],
        description: values.description?.trim() || null,
        image_url: values.imageUrl,
        active: values.active,
      };

      const { error } = await supabase
        .from("programs")
        .update(payload)
        .eq("id", editProgram.id)
        .eq("university_id", universityId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast({ title: "Programme updated" });
      setEditProgram(null);
      await refetch();
    } catch (err) {
      toast({
        title: "Unable to update programme",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // TOGGLE ACTIVE
  const handleToggleActive = async (id: string, active: boolean) => {
    if (!tenantId || !universityId) {
      toast({
        title: "Missing account information",
        description: "Could not verify university account.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingId(id);

    try {
      const { error } = await supabase
        .from("programs")
        .update({ active })
        .eq("id", id)
        .eq("university_id", universityId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast({
        title: "Programme updated",
        description: `Programme is now ${active ? "active" : "inactive"}.`,
      });

      await refetch();
    } catch (err) {
      toast({
        title: "Unable to update programme",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // DELETE
  const handleDelete = async () => {
    if (!deleteId) return;

    if (!tenantId || !universityId) {
      toast({
        title: "Missing account information",
        description: "Could not verify university account.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", deleteId)
        .eq("university_id", universityId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast({ title: "Programme deleted" });

      setDeleteId(null);
      await refetch();
    } catch (err) {
      toast({
        title: "Unable to delete programme",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  //
  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  //

  if (isLoading && !data) {
    return <LoadingState message="Loading programmes..." />;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Programmes</h1>
        <p className="text-sm text-muted-foreground">
          Manage your university programmes in UniDoxia.
        </p>
      </div>

      {/* CARD WRAPPER */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Programme catalogue</CardTitle>
            <CardDescription className="text-xs">
              {programs.length} programme{programs.length === 1 ? "" : "s"} connected to your university.
            </CardDescription>
          </div>

          <Button
            className="w-full sm:w-auto gap-2 bg-blue-500 text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> Add programme
          </Button>
        </CardHeader>

        <CardContent>
          {programs.length === 0 ? (
            <StatePlaceholder
              title="No programmes found"
              description="Add programmes to populate your catalogue."
              action={
                <Button variant="outline" onClick={() => setCreateOpen(true)}>
                  Add your first programme
                </Button>
              }
            />
          ) : (
            <ProgramTable
              programs={programs}
              searchTerm={search}
              onSearchChange={setSearch}
              levelFilter={levelFilter}
              levelOptions={levelOptions}
              onLevelFilterChange={setLevelFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onToggleActive={handleToggleActive}
              updatingId={updatingId}
              onView={(p) => setViewProgram(p)}
              onEdit={(p) => setEditProgram(p)}
              onDelete={(id) => setDeleteId(id)}
            />
          )}
        </CardContent>
      </Card>

      {/* CREATE DIALOG */}
      {createOpen && (
        <ProgramForm
          initialValues={createInitialValues}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isSubmitting={isSubmitting}
          submitLabel="Create programme"
          levelOptions={combinedLevelOptions}
          tenantId={tenantId}
          userId={user?.id ?? null}
        />
      )}

      {/* EDIT DIALOG */}
      {editProgram && editInitialValues && (
        <ProgramForm
          initialValues={editInitialValues}
          onSubmit={handleUpdate}
          onCancel={() => setEditProgram(null)}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          levelOptions={combinedLevelOptions}
          tenantId={tenantId}
          userId={user?.id ?? null}
        />
      )}

      {/* VIEW DIALOG */}
      <ProgramViewDialog
        program={viewProgram}
        open={Boolean(viewProgram)}
        onClose={() => setViewProgram(null)}
      />

      {/* DELETE DIALOG */}
      <ProgramDeleteDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
