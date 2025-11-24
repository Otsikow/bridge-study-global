import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Compass, ClipboardList, MessageCircle, Radar, PlaneTakeoff } from "lucide-react";

interface JourneySegmentConfig {
  key: "discover" | "plan" | "collaborate" | "submit" | "celebrate";
  icon: typeof Compass;
  gradient: string;
  ctaHref?: string;
}

const SEGMENT_CONFIG: JourneySegmentConfig[] = [
  { key: "discover", icon: Compass, gradient: "from-primary via-sky-500 to-cyan-500", ctaHref: "/auth/signup?role=student" },
  { key: "plan", icon: ClipboardList, gradient: "from-blue-600 via-indigo-500 to-purple-500" },
  { key: "collaborate", icon: MessageCircle, gradient: "from-purple-600 via-fuchsia-500 to-pink-500", ctaHref: "/auth/signup?role=agent" },
  { key: "submit", icon: Radar, gradient: "from-amber-500 via-orange-500 to-rose-500" },
  { key: "celebrate", icon: PlaneTakeoff, gradient: "from-emerald-500 via-teal-500 to-primary" },
];

export const JourneyRibbon = () => {
  const { t } = useTranslation();

  const segments = SEGMENT_CONFIG.map((segment) => {
    const baseKey = `pages.index.journeyRibbon.items.${segment.key}`;
    const ctaLabel = t(`${baseKey}.ctaLabel`, { defaultValue: "" });

    return {
      ...segment,
      stage: t(`${baseKey}.stage`),
      metricValue: t(`${baseKey}.metricValue`),
      metricLabel: t(`${baseKey}.metricLabel`),
      description: t(`${baseKey}.description`),
      ctaLabel: ctaLabel.trim() ? ctaLabel : null,
    };
  });

  return (
    <div className="relative mx-auto mt-8 max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16">
      <div className="absolute inset-0 -translate-y-6 scale-105 rounded-[40px] bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-inner backdrop-blur-lg dark:border-white/5 dark:bg-white/10">
        <div className="journey-marquee flex gap-4 sm:gap-5 md:gap-6">
          {[...segments, ...segments].map((segment, index) => (
            <div
              key={`${segment.key}-${index}`}
              className="relative w-[260px] flex-shrink-0 sm:w-[300px] md:w-[320px] xl:w-[340px]"
            >
              <div
                className={`group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left text-white shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] sm:min-h-[300px] sm:rounded-3xl sm:p-6 ${segment.gradient}`}
              >
                <div className="flex items-center gap-2.5 text-xs uppercase tracking-wide text-white/80 sm:gap-3 sm:text-sm">
                  <segment.icon className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                  <span className="max-w-[170px] text-left leading-tight text-white sm:max-w-[200px]">
                    {segment.stage}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-2 sm:mt-6">
                  <span className="text-3xl font-bold leading-none sm:text-4xl">{segment.metricValue}</span>
                  <span className="max-w-[120px] break-words text-[10px] font-semibold uppercase text-white/70 sm:max-w-none sm:text-xs">
                    {segment.metricLabel}
                  </span>
                </div>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-white/80 sm:mt-4 sm:text-sm">
                  {segment.description}
                </p>
                {segment.ctaHref && segment.ctaLabel && (
                  <Link
                    to={segment.ctaHref}
                    className="mt-4 inline-flex items-center text-xs font-semibold text-white transition hover:text-white/80 active:text-white/60 sm:mt-6 sm:text-sm"
                  >
                    <span className="truncate">{segment.ctaLabel}</span>
                    <ChevronRight className="ml-1 h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                  </Link>
                )}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-20 group-active:opacity-30">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_55%)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
