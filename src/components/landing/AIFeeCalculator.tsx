import { type ComponentType, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Bus,
  CheckCircle2,
  GraduationCap,
  Home,
  ShieldCheck,
  Sparkles,
  Wallet,
  Globe2,
  Briefcase,
} from "lucide-react";

const COST_KEYS = [
  "tuition",
  "accommodation",
  "living",
  "insurance",
  "transportation",
  "visa",
  "misc",
] as const;

type CostKey = (typeof COST_KEYS)[number];

const DEFAULT_COSTS: Record<CostKey, number> = {
  tuition: 26000,
  accommodation: 12000,
  living: 6500,
  insurance: 1200,
  transportation: 1800,
  visa: 600,
  misc: 1500,
};

const ICONS: Record<CostKey, ComponentType<{ className?: string }>> = {
  tuition: GraduationCap,
  accommodation: Home,
  living: Wallet,
  insurance: ShieldCheck,
  transportation: Bus,
  visa: Globe2,
  misc: Briefcase,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function AIFeeCalculator() {
  const { t } = useTranslation();
  const [costs, setCosts] = useState<Record<CostKey, number>>(DEFAULT_COSTS);
  const [aiConfidence, setAiConfidence] = useState(92);
  const [isCalculating, setIsCalculating] = useState(false);

  const costFields = useMemo(
    () =>
      COST_KEYS.map((key) => ({
        key,
        label: t(`pages.index.feeCalculator.fields.${key}.label`),
        placeholder: t(`pages.index.feeCalculator.fields.${key}.placeholder`),
        icon: ICONS[key],
      })),
    [t]
  );

  const highlights = useMemo(
    () =>
      (t("pages.index.feeCalculator.highlights", { returnObjects: true }) as string[]) ?? [],
    [t]
  );

  const insightItems = useMemo(
    () =>
      (t("pages.index.feeCalculator.insights.items", { returnObjects: true }) as string[]) ?? [],
    [t]
  );

  const total = useMemo(
    () => COST_KEYS.reduce((sum, key) => sum + (costs[key] || 0), 0),
    [costs]
  );

  const monthlyBudget = total / 12;

  const handleCostChange = (key: CostKey, value: string) => {
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    setCosts((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const runAICalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setCosts((prev) => {
        const next = { ...prev };
        COST_KEYS.forEach((key) => {
          const adjustment = 0.92 + Math.random() * 0.12;
          next[key] = Math.round(prev[key] * adjustment);
        });
        return next;
      });
      setAiConfidence(88 + Math.round(Math.random() * 8));
      setIsCalculating(false);
    }, 700);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Badge className="w-fit bg-primary/10 text-primary" variant="secondary">
            {t("pages.index.feeCalculator.badge")}
          </Badge>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground sm:text-5xl">
              {t("pages.index.feeCalculator.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("pages.index.feeCalculator.description")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-3 rounded-2xl border bg-background/80 p-4 shadow-sm">
                <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">{highlight}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t("pages.index.feeCalculator.insights.title")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {insightItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Card className="border-primary/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl">
              <span>{t("pages.index.feeCalculator.formTitle")}</span>
              <Badge variant="outline" className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                {t("pages.index.feeCalculator.confidenceLabel", { value: aiConfidence })}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {costFields.map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 text-primary" />
                    {label}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    inputMode="decimal"
                    value={costs[key].toString()}
                    onChange={(event) => handleCostChange(key, event.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-muted/60 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("pages.index.feeCalculator.summary.subtitle")}
                  </p>
                  <p className="text-3xl font-semibold text-foreground">{formatCurrency(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("pages.index.feeCalculator.summary.monthlyLabel")}
                  </p>
                  <p className="text-lg font-semibold">{formatCurrency(monthlyBudget)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Progress value={aiConfidence} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {t("pages.index.feeCalculator.summary.confidenceHelper", { value: aiConfidence })}
                </p>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={runAICalculation} disabled={isCalculating}>
              <Sparkles className="h-4 w-4" />
              {isCalculating
                ? t("pages.index.feeCalculator.calculatingLabel")
                : t("pages.index.feeCalculator.cta")}
            </Button>

            <p className="text-xs text-muted-foreground">
              {t("pages.index.feeCalculator.summary.disclaimer")}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default AIFeeCalculator;
