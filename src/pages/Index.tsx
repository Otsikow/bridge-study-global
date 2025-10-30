import { Link } from "react-router-dom";
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
  Globe,
  Users,
  FileCheck,
  GraduationCap,
  Search,
  Clock,
  TrendingUp,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Building2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import gegLogo from "@/assets/geg-logo.png";
import campusWalk from "@/assets/campus-walk.png";
import studentJourney from "@/assets/student-journey.png";
import acceptanceLetter from "@/assets/acceptance-letter.png";
import { FeaturedUniversitiesSection } from "@/components/landing/FeaturedUniversitiesSection";

const Index = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const stats = [
    { value: "200+", label: "Partner Universities", icon: Building2 },
    { value: "5000+", label: "Students Placed", icon: Users },
    { value: "50+", label: "Countries", icon: Globe },
    { value: "95%", label: "Success Rate", icon: TrendingUp },
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
      image: campusWalk,
    },
    {
      step: "02",
      icon: FileCheck,
      title: "Apply with Confidence",
      description:
        "Submit your application with verified agent support. Upload documents, track progress, and communicate in one place.",
      image: studentJourney,
    },
    {
      step: "03",
      icon: GraduationCap,
      title: "Get Admitted & Enroll",
      description:
        "Receive your offer letter, complete visa processing with our guidance, and start your global education journey.",
      image: acceptanceLetter,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Master's Student at MIT",
      country: "USA",
      image: "👩‍🎓",
      quote:
        "GEG made my dream of studying at MIT a reality. The platform was intuitive, and my agent was incredibly supportive.",
      rating: 5,
    },
    {
      name: "Raj Patel",
      role: "MBA Student at Oxford",
      country: "UK",
      image: "👨‍💼",
      quote:
        "The real-time tracking feature gave me peace of mind. I always knew where my application stood. Highly recommend GEG!",
      rating: 5,
    },
    {
      name: "Maria Garcia",
      role: "Engineering Student at Stanford",
      country: "USA",
      image: "👩‍💻",
      quote:
        "From finding the right program to visa approval, GEG supported me every step of the way. Outstanding service!",
      rating: 5,
    },
  ];

  const testimonialCount = testimonials.length;

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonialCount]);

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

  const nextTestimonial = () =>
    setCurrentTestimonial((prev) => (prev + 1) % testimonialCount);
  const prevTestimonial = () =>
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonialCount - 1 : prev - 1
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container relative mx-auto px-4 py-24 text-center">
          <img
            src={gegLogo}
            alt="Global Education Gateway logo"
            className="mx-auto mb-8 h-12 w-auto object-contain drop-shadow-lg dark:brightness-0 dark:invert"
          />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 animate-fade-in-down">
            <Sparkles className="h-4 w-4 animate-pulse-subtle" />
            <span>Trusted by 5000+ students worldwide</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 animate-fade-in-up">
            Your Gateway to{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Global Education
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up animate-delay-100">
            Connect with top universities, track applications in real-time, and
            receive expert guidance from verified agents.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animate-delay-200">
            <Link to="/auth/signup">
              <Button size="lg">
                <FileCheck className="mr-2 h-5 w-5" />
                Start Application
              </Button>
            </Link>
            <Link to="/auth/signup?role=agent">
              <Button variant="outline" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Join as Agent
              </Button>
            </Link>
            <Link to="/partnership">
              <Button
                variant="secondary"
                size="lg"
                className="bg-primary/10 text-primary hover:bg-primary/15"
              >
                <Building2 className="mr-2 h-5 w-5" />
                Partner with Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card 
            key={i} 
            className="text-center hover:shadow-lg transition-all animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardContent className="p-6">
              <s.icon className="h-8 w-8 mx-auto mb-3 text-primary transition-transform duration-300 hover:scale-110" />
              <div className="text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 animate-fade-in-down">
          Why Choose GEG?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Card
              key={i}
              className="relative overflow-hidden group hover:shadow-2xl transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <CardContent className="p-8">
                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.color} mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <f.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">{f.title}</h3>
                <p className="text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <FeaturedUniversitiesSection />

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
              <div className={i % 2 === 0 ? "animate-fade-in-left" : "animate-fade-in-right"}>
                <div className="text-8xl text-primary/10 font-bold absolute">
                  {step.step}
                </div>
                <div className="relative z-10">
                  <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20">
                    <step.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground mb-6">
                    {step.description}
                  </p>
                  <Link to="/auth/signup">
                    <Button variant="outline">Get Started</Button>
                  </Link>
                </div>
              </div>
              <div className={i % 2 === 0 ? "animate-fade-in-right" : "animate-fade-in-left"}>
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
        <h2 className="text-4xl font-bold mb-12 animate-fade-in-down">Success Stories</h2>
        <Card className="max-w-3xl mx-auto border-2 shadow-xl animate-scale-in transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-10">
            <Quote className="h-10 w-10 text-primary/20 mb-6 mx-auto animate-bounce-subtle" />
            <p className="italic text-xl mb-6">
              "{testimonials[currentTestimonial].quote}"
            </p>
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                <Star 
                  key={i} 
                  className="h-5 w-5 fill-primary text-primary transition-transform duration-300 hover:scale-125" 
                  style={{ animationDelay: `${i * 100}ms` }}
                />
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
          <Button variant="ghost" size="icon" onClick={prevTestimonial} className="hover:scale-110">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextTestimonial} className="hover:scale-110">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
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
              <h3 className="text-2xl font-semibold text-left">For {section.audience}</h3>
              <Accordion
                type="single"
                collapsible
                className="space-y-4"
              >
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

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground">
            Have questions? We’d love to help.
          </p>
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
