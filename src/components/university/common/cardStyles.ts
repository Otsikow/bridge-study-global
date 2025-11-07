import { cn } from "@/lib/utils";

export const UNIVERSITY_CARD_GRADIENT =
  "border border-blue-900/60 bg-gradient-to-br from-slate-950 via-blue-950/70 to-slate-900/70 text-slate-100 shadow-[0_28px_60px_-32px_rgba(15,23,42,0.85)] backdrop-blur-md transition hover:border-blue-800/60 hover:shadow-[0_32px_72px_-30px_rgba(37,99,235,0.55)]";

export const UNIVERSITY_SURFACE_TINT =
  "border border-blue-900/40 bg-blue-950/40 text-slate-200/90 backdrop-blur-md";

export const UNIVERSITY_SURFACE_SUBTLE =
  "border border-blue-900/30 bg-blue-950/20 backdrop-blur";

export const withUniversityCardStyles = (
  ...classes: Array<string | false | null | undefined>
) => cn(UNIVERSITY_CARD_GRADIENT, ...classes);

export const withUniversitySurfaceTint = (
  ...classes: Array<string | false | null | undefined>
) => cn(UNIVERSITY_SURFACE_TINT, ...classes);

export const withUniversitySurfaceSubtle = (
  ...classes: Array<string | false | null | undefined>
) => cn(UNIVERSITY_SURFACE_SUBTLE, ...classes);
