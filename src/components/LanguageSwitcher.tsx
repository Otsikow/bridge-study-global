import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Globe2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  size?: "default" | "sm";
  showLabel?: boolean;
}

export const LanguageSwitcher = ({ className, size = "default", showLabel = false }: LanguageSwitcherProps) => {
  const { t } = useTranslation();
  const { language, setLanguage, availableLanguages } = useLanguage();

  const options = useMemo(
    () =>
      availableLanguages.map((code) => ({
        code,
        label: t(`common.languageNames.${code}`),
      })),
    [availableLanguages, t],
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
        <SelectTrigger
          className={cn(
            "w-[160px] justify-between",
            size === "sm" && "h-8 w-[140px] text-xs",
          )}
          aria-label={t("common.labels.selectLanguage")}
        >
          <div className="flex items-center gap-2">
            <Globe2 className={cn("h-4 w-4", size === "sm" && "h-3.5 w-3.5")} />
            {showLabel && <span className="text-xs text-muted-foreground hidden sm:inline">{t("common.labels.language")}</span>}
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
