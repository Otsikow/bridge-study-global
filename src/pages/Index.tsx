import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/ContactForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Users,
    FileCheck,
    GraduationCap,
    Search,
    Clock,
    Star,
    Quote,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ArrowRight,
    Calculator,
    ShieldCheck,
    Globe2,
    TrendingUp,
} from "lucide-react";

import gegLogo from "@/assets/geg-logo.png";
import studentsStudyingGroup from "@/assets/students-studying-group.png";
import studentAirportTravel from "@/assets/student-airport-travel.png";
import universityApplication from "@/assets/university-application.png";
import studentWorkStudy from "@/assets/student-work-study.png";
import agentStudentConsulting from "@/assets/agent-student-consulting.png";
import universityBuildings from "@/assets/university-buildings.png";

import { FeaturedUniversitiesSection } from "@/components/landing/FeaturedUniversitiesSection";
import { StoryboardSection } from "@/components/landing/StoryboardSection";
import { JourneyRibbon } from "@/components/JourneyRibbon";

const Index = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const heroCtas = [
    {
      badge: "Students",
      title: "Launch your global application",
      description:
        "Create a profile, upload documents once, and send polished applications to top universities in minutes.",
      action: "Start Application",
      href: "/auth/signup?role=student",
      image: studentsStudyingGroup,
    },
    {
      badge: "Agents",
      title: "Serve students with smart tools",
      description:
        "Access dashboards, collaborate in real time, and track every milestone while growing your agency brand.",
      action: "Join as Agent",
      href: "/auth/signup?role=agent",
      image: agentStudentConsulting,
    },
    {
      badge: "Universities",
      title: "Scale partnerships that convert",
      description:
        "Connect with qualified applicants, get market insights, and collaborate with vetted advisors worldwide.",
      action: "Partner with Us",
      href: "/partnership",
      image: universityBuildings,
    },
  ];

  const features = [
    {
      icon: FileCheck,
      title: "Apply Easily",
      description:
        "Streamlined application process with step-by-step guidance. Submit applications to multiple universities effortlessly.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Clock,
      title: "Track in Real-Time",
      description:
        "Monitor your application status 24/7 with live updates and instant notifications.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Connect with Verified Agents",
      description:
        "Access certified education agents who provide personalized support throughout your journey.",
      color: "from-orange-500 to-red-500",
    },
  ];

    const howItWorksSteps = [
    {
      step: "01",
      icon: Search,
      title: "Find Your Perfect Program",
      description:
        "Browse hundreds of universities and use our AI-powered recommendation engine to find the ideal match for your goals.",
      image: universityBuildings,
    },
    {
      step: "02",
      icon: FileCheck,
      title: "Apply with Confidence",
      description:
        "Submit your application with verified agent support. Upload documents, track progress, and communicate in one place.",
      image: universityApplication,
    },
    {
      step: "03",
      icon: GraduationCap,
      title: "Get Admitted & Enroll",
      description:
        "Receive your offer letter, complete visa processing with our guidance, and start your global education journey.",
      image: studentAirportTravel,
    },
  ];

      const courseHighlights = [
        {
          icon: Search,
          title: "Advanced Filters",
          description:
            "Filter by country, degree level, tuition, duration, and intake months without leaving the page.",
        },
        {
          icon: GraduationCap,
          title: "Program Insights",
          description:
            "Compare tuition, duration, and next intakes on every card to shortlist the right programs instantly.",
        },
        {
          icon: Sparkles,
          title: "Smart Suggestions",
          description:
            "See curated fallback results so you always have inspiring options, even when live data is still loading.",
        },
      ];

      const visaHighlights = [
        {
          icon: ShieldCheck,
          title: "Personalized Assessment",
          description:
            "Enter your academic profile, test scores, and finances to receive a tailored visa-readiness score in seconds.",
        },
        {
          icon: Globe2,
          title: "Country Comparisons",
          description:
            "Compare eligibility requirements for top study destinations side by side to plan with confidence.",
        },
        {
          icon: TrendingUp,
          title: "Actionable Guidance",
          description:
            "Unlock a checklist of next steps, documentation tips, and expert advice to boost your approval chances.",
        },
      ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Master's Student at MIT",
      country: "USA",
      quote:
        "GEG made my dream of studying at MIT a reality. The platform was intuitive, and my agent was incredibly supportive.",
      rating: 5,
    },
    {
      name: "Raj Patel",
      role: "MBA Student at Oxford",
      country: "UK",
      quote:
        "The real-time tracking feature gave me peace of mind. I always knew where my application stood. Highly recommend GEG!",
      rating: 5,
    },
    {
      name: "Maria Garcia",
      role: "Engineering Student at Stanford",
      country: "USA",
      quote:
        "From finding the right program to visa approval, GEG supported me every step of the way. Outstanding service!",
      rating: 5,
    },
  ];

  const testimonialCount = testimonials.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonialCount]);

  const nextTestimonial = () =>
    setCurrentTestimonial((prev) => (prev + 1) % testimonialCount);
  const prevTestimonial = () =>
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonialCount - 1 : prev - 1
    );

  const faqs = [
    {
      audience: "Students",
      items: [
        {
          question: "How does GEG help me apply to universities?",
          answer:
            "GEG connects you with verified agents who guide you through every stage — from selecting universities to submitting documents.",
        },
        {
          question: "Is there a fee to use the platform?",
          answer:
            "Creating an account and exploring universities is free. Agents may charge consulting fees, clearly shown before commitment.",
        },
        {
          question: "What documents do I need to apply?",
          answer:
            "Academic transcripts, English test scores (IELTS/TOEFL), recommendations, personal statement, and passport copy are typically required.",
        },
        {
          question: "Can I apply to multiple universities?",
          answer:
            "Yes! You can apply to multiple universities at once and track all applications in one dashboard.",
        },
        {
          question: "How do I stay informed about my application status?",
          answer:
            "Your personalized dashboard shows real-time updates, deadlines, and next steps so you always know what to do next.",
        },
      ],
    },
    {
      audience: "Universities",
      items: [
        {
          question: "How can our university partner with GEG?",
          answer:
            "Submit a partnership request through the University Portal or contact our partnerships team. We'll verify your institution and set up onboarding within a few business days.",
        },
        {
          question: "What insights do universities receive?",
          answer:
            "Universities gain access to dashboards showing applicant pipelines, conversion metrics, and regional interest so you can plan recruitment campaigns with confidence.",
        },
        {
          question: "Can we manage offers directly on the platform?",
          answer:
            "Yes. Admissions teams can issue conditional or unconditional offers, request missing documents, and communicate with students and agents from a single workspace.",
        },
      ],
    },
    {
      audience: "Agents",
      items: [
        {
          question: "What support do agents receive on GEG?",
          answer:
            "Agents receive a dedicated CRM, marketing collateral, and on-demand training to help match students with suitable programs quickly.",
        },
        {
          question: "How are agent commissions handled?",
          answer:
            "Commission structures are transparent. Universities define the terms, and payouts are tracked within the agent dashboard for easy reconciliation.",
        },
        {
          question: "Can agents collaborate with university admissions teams?",
          answer:
            "Absolutely. Shared workspaces and messaging threads keep all parties aligned on student progress, missing documents, and interview scheduling.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container relative mx-auto px-4 py-24 text-center">
          <img
            src={gegLogo}
            alt="Global Education Gateway logo"
            className="mx-auto mb-8 h-12 w-auto object-contain drop-shadow-lg dark:brightness-0 dark:invert"
          />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Trusted by 5000+ students worldwide</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Your Gateway to{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Global Education
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with top universities, track applications in real-time, and
            receive expert guidance from verified agents.
          </p>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            {heroCtas.map((cta) => (
              <Link
                key={cta.title}
                to={cta.href}
                className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 text-left shadow-xl transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-white/5"
                aria-label={cta.action}
              >
                <img
                  src={cta.image}
                  alt={cta.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-primary/20" />
                <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
                  <div>
                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                      {cta.badge}
                    </span>
                    <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
                      {cta.title}
                    </h3>
                    <p className="mt-3 text-sm text-white/80 sm:text-base">
                      {cta.description}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs uppercase tracking-wide text-primary-foreground">
                      {cta.action}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
                <div className="pointer-events-none absolute inset-x-6 bottom-5 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
          <JourneyRibbon />
        </div>
      </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose GEG?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="relative overflow-hidden group hover:shadow-2xl">
                <CardContent className="p-8">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.color} mb-6`}
                  >
                    <f.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Course Discovery Spotlight */}
        <section className="relative py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent" />
          <div className="container mx-auto grid items-center gap-14 px-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20">
                <Sparkles className="h-4 w-4" /> Course Discovery
              </span>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                  Explore programs around the world in minutes
                </h2>
                <p className="text-lg text-muted-foreground">
                  Browse an always-on catalogue of universities and programs, powered by tenant-specific data and curated fallbacks so you never hit a dead end.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courseHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-3xl border border-white/40 bg-white/80 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <item.icon className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/courses">
                    <Search className="h-5 w-5" /> Browse the Catalogue
                  </Link>
                </Button>
                <Button asChild variant="link" className="text-base">
                  <Link to="/courses#filters">See filters in action</Link>
                </Button>
              </div>
            </div>
            <Link to="/courses" className="block" aria-label="Open the course discovery workspace">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-white/95 shadow-2xl ring-1 ring-primary/10 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl cursor-pointer dark:bg-slate-950/70">
                <CardContent className="space-y-8 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Course discovery</p>
                        <p className="text-lg font-semibold text-foreground">Course Discovery Workspace</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                      <Sparkles className="h-4 w-4" /> Fresh matches daily
                    </span>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4 rounded-3xl bg-slate-50/60 p-5 shadow-inner dark:bg-slate-900/50">
                      <div className="grid grid-cols-2 gap-4 text-left text-sm text-muted-foreground">
                        {["Country", "Degree Level", "Discipline", "Tuition", "Duration", "Intake Month"].map((label) => (
                          <div key={label} className="space-y-2">
                            <div className="font-semibold text-foreground/80">{label}</div>
                            <div className="h-10 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800" />
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl bg-primary text-primary-foreground px-6 py-3 text-center text-sm font-semibold shadow-lg">
                        Launch Discovery
                      </div>
                    </div>
                    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-6 text-left shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-primary uppercase tracking-wide">Live results</p>
                        <h4 className="text-2xl font-bold text-foreground">See the best-fit programs instantly</h4>
                        <p className="text-sm text-muted-foreground">
                          Shortlist stand-out programs, review tuition at a glance, and jump straight into an application when you are ready.
                        </p>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between rounded-2xl bg-slate-100/90 px-4 py-3 font-medium text-foreground dark:bg-slate-800/80">
                          <span>Oxford · MSc Computer Science</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 text-muted-foreground dark:bg-slate-800/60">
                          <span>Toronto · BSc Data Science</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 text-muted-foreground dark:bg-slate-800/60">
                          <span>Melbourne · Master of Engineering</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

          {/* Visa Calculator Spotlight */}
          <section className="relative py-24">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
          <div className="container mx-auto grid items-center gap-14 px-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20">
                <Sparkles className="h-4 w-4" /> Feature Spotlight
              </span>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                  Understand your visa eligibility before you apply
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our Visa Eligibility Calculator analyses your profile instantly so you can focus on the countries and programs that welcome you the most. Share your aspirations, run comparisons, and move forward with clarity.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visaHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-3xl border border-white/40 bg-white/80 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <item.icon className="mb-4 h-8 w-8 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/visa-calculator">
                    <Calculator className="h-5 w-5" /> Explore the Visa Calculator
                  </Link>
                </Button>
                <Button asChild variant="link" className="text-base">
                  <Link to="/visa-calculator#how-it-works">Learn how it works</Link>
                </Button>
              </div>
            </div>
            <Link to="/visa-calculator" className="block">
              <Card className="relative overflow-hidden rounded-3xl border-0 bg-white/95 shadow-2xl ring-1 ring-primary/10 backdrop-blur-sm dark:bg-slate-950/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl cursor-pointer">
                <CardContent className="space-y-8 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Interactive Tool</p>
                      <p className="text-lg font-semibold text-foreground">Visa Eligibility Calculator</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                    <Globe2 className="h-4 w-4" /> Compare Countries
                  </span>
                </div>
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4 rounded-3xl bg-slate-50/60 p-5 shadow-inner dark:bg-slate-900/50">
                    <div className="grid grid-cols-2 gap-4 text-left text-sm text-muted-foreground">
                      {["IELTS Score", "TOEFL Score", "GPA", "Age", "Bank Balance", "Work Experience"].map((label) => (
                        <div key={label} className="space-y-2">
                          <div className="font-semibold text-foreground/80">{label}</div>
                          <div className="h-10 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950/40 dark:ring-slate-800" />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-primary text-primary-foreground px-6 py-3 text-center text-sm font-semibold shadow-lg">
                      Calculate Eligibility
                    </div>
                  </div>
                  <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/80 p-6 text-left shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-primary uppercase tracking-wide">Instant results</p>
                      <h4 className="text-2xl font-bold text-foreground">You are 87% ready for Canada</h4>
                      <p className="text-sm text-muted-foreground">
                        Strengthen your finances and add proof of funds to boost your chances even further.
                      </p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-100/90 px-4 py-3 font-medium text-foreground dark:bg-slate-800/80">
                        <span>Study Permit Checklist</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 text-muted-foreground dark:bg-slate-800/60">
                        <span>Agent guidance session</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 text-muted-foreground dark:bg-slate-800/60">
                        <span>Compare another country</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          </div>
        </section>

      <FeaturedUniversitiesSection />
      <StoryboardSection />

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 space-y-24">
          {howItWorksSteps.map((step, i) => (
            <div
              key={i}
              className={`grid md:grid-cols-2 items-center gap-12 ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div>
                <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                  <step.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <Link to="/auth/signup?role=student">
                  <Button variant="outline">Get Started</Button>
                </Link>
              </div>
              <div>
                <img
                  src={step.image}
                  alt={step.title}
                  className="rounded-2xl shadow-xl transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-12">Success Stories</h2>
        <Card className="max-w-3xl mx-auto border-2 shadow-xl">
          <CardContent className="p-10">
            <Quote className="h-10 w-10 text-primary/20 mb-6 mx-auto" />
            <p className="italic text-xl mb-6">
              "{testimonials[currentTestimonial].quote}"
            </p>
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <div className="text-lg font-bold">
              {testimonials[currentTestimonial].name}
            </div>
            <div className="text-muted-foreground">
              {testimonials[currentTestimonial].role} —{" "}
              {testimonials[currentTestimonial].country}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="ghost" size="icon" onClick={prevTestimonial}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextTestimonial}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Quick answers to common questions
          </p>
        </div>
        <div className="max-w-4xl mx-auto space-y-12">
          {faqs.map((section, sectionIndex) => (
            <div key={section.audience} className="space-y-6">
              <h3 className="text-2xl font-semibold text-left">
                For {section.audience}
              </h3>
              <Accordion type="single" collapsible className="space-y-4">
                {section.items.map((faq, faqIndex) => (
                  <AccordionItem
                    key={`${sectionIndex}-${faqIndex}`}
                    value={`item-${sectionIndex}-${faqIndex}`}
                    className="border rounded-lg bg-card"
                  >
                    <AccordionTrigger className="py-6 px-4 font-semibold text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-6 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground">Have questions? We’d love to help.</p>
        </div>
        <Card className="max-w-2xl mx-auto border-2">
          <CardContent className="p-8">
            <ContactForm />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 py-12 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Global Education Gateway. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
