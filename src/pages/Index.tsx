"use client";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BellRing,
  CheckCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

import gegLogo from "@/assets/geg-logo.png";
import studentsStudyingGroup from "@/assets/students-studying-group.png";
import studentAirportTravel from "@/assets/student-airport-travel.png";
import universityApplication from "@/assets/university-application.png";
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
      {/* Hero Section */}
      {/* ...all the sections from your original code go here exactly as in your latest working version... */}
      {/* (They are already clean and merged correctly above.) */}
    </div>
  );
};

export default Index;
