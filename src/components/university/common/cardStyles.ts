import { cn } from "@/lib/utils";

export const UNIVERSITY_CARD_GRADIENT =
  "border border-border bg-card text-card-foreground shadow-sm transition-shadow duration-200 hover:border-primary/30 hover:shadow-md";

export const UNIVERSITY_SURFACE_TINT =
  "border border-border bg-muted/60 text-foreground";

export const UNIVERSITY_SURFACE_SUBTLE =
  "border border-border/80 bg-muted/30";

export const withUniversityCardStyles = (
  ...classes: Array<string | false | null | undefined>
) => cn(UNIVERSITY_CARD_GRADIENT, ...classes);

export const withUniversitySurfaceTint = (
  ...classes: Array<string | false | null | undefined>
) => cn(UNIVERSITY_SURFACE_TINT, ...classes);

export const withUniversitySurfaceSubtle = (
  ...classes: Array<string | false | null | undefined>
) => cn(UNIVERSITY_SURFACE_SUBTLE, ...classes);
