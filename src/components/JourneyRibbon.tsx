import { Link } from "react-router-dom";
import { ChevronRight, Compass, ClipboardList, MessageCircle, Radar, PlaneTakeoff } from "lucide-react";

const journeyRibbon = [
    {
        stage: "Discover",
        icon: Compass,
        gradient: "from-primary via-sky-500 to-cyan-500",
        metricValue: "200+",
        metricLabel: "Partner Universities",
        description: "AI-matched program recommendations surface the best-fit universities the moment you sign up.",
        cta: {
            label: "Start Application",
            href: "/auth/signup?role=student",
        },
    },
    {
        stage: "Plan",
        icon: ClipboardList,
        gradient: "from-blue-600 via-indigo-500 to-purple-500",
        metricValue: "5000+",
        metricLabel: "Personalized plans created",
        description: "Task checklists and smart reminders keep thousands of students organized from transcripts to statements.",
    },
    {
        stage: "Collaborate",
        icon: MessageCircle,
        gradient: "from-purple-600 via-fuchsia-500 to-pink-500",
        metricValue: "24h",
        metricLabel: "Average agent response",
        description: "Verified advisors co-edit documents, answer questions, and align timelines in real time across every channel.",
        cta: {
            label: "Meet Your Agent",
            href: "/auth/signup?role=agent",
        },
    },
    {
        stage: "Submit",
        icon: Radar,
        gradient: "from-amber-500 via-orange-500 to-rose-500",
        metricValue: "95%",
        metricLabel: "Success Rate",
        description: "Centralized submissions with proactive nudges help applications move forward without missing a single deadline.",
    },
    {
        stage: "Celebrate",
        icon: PlaneTakeoff,
        gradient: "from-emerald-500 via-teal-500 to-primary",
        metricValue: "50+",
        metricLabel: "Countries represented",
        description: "Visa-ready checklists and pre-departure prep launch students to campuses across the globe with confidence.",
    },
];

export const JourneyRibbon = () => (
    <div className="relative mx-auto mt-8 sm:mt-12 lg:mt-16 max-w-7xl px-4 sm:px-6">
        <div className="absolute inset-0 -translate-y-6 scale-105 rounded-[40px] bg-primary/10 blur-3xl" />
        <div className="relative grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {journeyRibbon.map((segment, index) => (
                <div key={segment.stage} className="relative">
                    {index < journeyRibbon.length - 1 && (
                        <div
                            className="pointer-events-none absolute right-[-20px] top-1/2 hidden h-12 w-20 -translate-y-1/2 xl:block"
                            aria-hidden="true"
                        >
                            <div className="h-full w-full rotate-3 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-md" />
                        </div>
                    )}
                    <div
                        className={`group relative flex h-full min-h-[280px] sm:min-h-[300px] flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br ${segment.gradient} p-5 sm:p-6 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]`}
                    >
                        <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm uppercase tracking-wide text-white/80">
                            <segment.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="truncate">{segment.stage}</span>
                        </div>
                        <div className="mt-4 sm:mt-6 flex flex-wrap items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-bold leading-none">{segment.metricValue}</span>
                            <span className="text-[10px] sm:text-xs font-semibold uppercase text-white/70 break-words max-w-[120px] sm:max-w-none">
                                {segment.metricLabel}
                            </span>
                        </div>
                        <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-white/80 flex-1">{segment.description}</p>
                        {segment.cta && (
                            <Link
                                to={segment.cta.href}
                                className="mt-4 sm:mt-6 inline-flex items-center text-xs sm:text-sm font-semibold text-white transition hover:text-white/80 active:text-white/60"
                            >
                                <span className="truncate">{segment.cta.label}</span>
                                <ChevronRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
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
);
