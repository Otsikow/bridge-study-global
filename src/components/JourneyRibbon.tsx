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
            href: "/auth/signup",
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
    <div className="relative mx-auto mt-16 max-w-6xl">
        <div className="absolute inset-0 -translate-y-6 scale-105 rounded-[40px] bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-5">
            {journeyRibbon.map((segment, index) => (
                <div key={segment.stage} className="relative">
                    {index < journeyRibbon.length - 1 && (
                        <div
                            className="pointer-events-none absolute right-[-20px] top-1/2 hidden h-12 w-20 -translate-y-1/2 md:block"
                            aria-hidden="true"
                        >
                            <div className="h-full w-full rotate-3 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent blur-md" />
                        </div>
                    )}
                    <div
                        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${segment.gradient} p-6 text-left text-white shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                    >
                        <div className="flex items-center gap-3 text-sm uppercase tracking-wide text-white/80">
                            <segment.icon className="h-5 w-5" />
                            <span>{segment.stage}</span>
                        </div>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-4xl font-bold leading-none">{segment.metricValue}</span>
                            <span className="text-xs font-semibold uppercase text-white/70">
                                {segment.metricLabel}
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-white/80">{segment.description}</p>
                        {segment.cta && (
                            <Link
                                to={segment.cta.href}
                                className="mt-6 inline-flex items-center text-sm font-semibold text-white transition hover:text-white/80"
                            >
                                {segment.cta.label}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        )}
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-20">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_55%)]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
