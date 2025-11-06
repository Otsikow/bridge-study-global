import { Globe2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import type { SupportedLanguage } from "@/i18n/resources";

interface LanguageSwitcherProps {
  className?: string;
  size?: "default" | "sm";
  showLabel?: boolean;
}

export const LanguageSwitcher = ({ className, size = "default", showLabel = false }: LanguageSwitcherProps) => {
  const { language, setLanguage, availableLanguages } = useLanguage();

  const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
    en: "English",
    de: "German",
    fr: "French",
    pt: "Portuguese",
    sw: "Swahili",
    es: "Spanish",
    zh: "Chinese",
    hi: "Hindi",
    ar: "Arabic",
  } as const;

  const options = useMemo(
    () =>
      availableLanguages.map((code) => ({
        code,
        label: LANGUAGE_LABELS[code] ?? code.toUpperCase(),
      })),
    [availableLanguages],
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
        <SelectTrigger
          className={cn(
            "w-[160px] justify-between",
            size === "sm" && "h-8 w-[140px] text-xs",
            )}
            aria-label="Select language"
        >
          <div className="flex items-center gap-2">
            <Globe2 className={cn("h-4 w-4", size === "sm" && "h-3.5 w-3.5")} />
              {showLabel && <span className="text-xs text-muted-foreground hidden sm:inline">Language</span>}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent align="end" className="max-h-[18rem]">
          {options.map(({ code, label }) => (
            <SelectItem key={code} value={code} className="flex items-center gap-2">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
