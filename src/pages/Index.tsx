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
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  Search,
  Calculator,
  Brain,
  Upload,
  DollarSign,
  Video,
  BookOpen,
} from "lucide-react";
import gegLogo from "@/assets/geg-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import campusWalk from "@/assets/campus-walk.png";
import campusGathering from "@/assets/campus-gathering.png";
import modernClassroom from "@/assets/modern-classroom.png";
import campusTour from "@/assets/campus-tour.png";
import studentStudying from "@/assets/student-studying.png";
import visaSuccess from "@/assets/visa-success.png";

const Index = () => {
  const stats = [
    { value: "500+", label: "Universities" },
    { value: "50+", label: "Countries" },
    { value: "10K+", label: "Students" },
    { value: "95%", label: "Success Rate" },
  ];

  const faqs = [
    {
      question: "How does GEG help me apply to universities?",
      answer:
        "GEG connects you with verified education agents who guide you through the entire application process. Our platform helps you search for programs, manage applications, track progress, and receive expert advice every step of the way.",
    },
    {
      question: "Is there a fee to use the platform?",
      answer:
        "Creating an account and searching for universities is completely free. Our partner agents may charge for their consulting services, but all fees are transparent and discussed upfront before you commit.",
    },
    {
      question: "How long does the application process take?",
      answer:
        "The timeline varies depending on the university and program. Typically, the application process takes 2–4 weeks to complete, with universities taking 4–8 weeks to respond. Your assigned agent will help you understand specific timelines for your chosen programs.",
    },
    {
      question: "What documents do I need to apply?",
      answer:
        "Common documents include academic transcripts, English language test scores (IELTS/TOEFL), letters of recommendation, personal statement, and passport copy. Your agent will provide a detailed checklist.",
    },
    {
      question: "Can I apply to multiple universities?",
      answer:
        "Yes! We encourage applying to multiple universities to increase your chances of acceptance. Our platform makes it easy to manage multiple applications simultaneously and track their progress in one place.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-2 rounded-md"
      >
        Skip to content
      </a>
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={gegLogo}
              alt="GEG Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:brightness-0 dark:invert"
            />
            <span className="font-bold text-lg sm:text-xl truncate">GEG</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/universities">
              <Button variant="ghost" size="sm">
                Universities
              </Button>
            </Link>
            <Link to="/feedback">
              <Button variant="ghost" size="sm">
                Feedback
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={campusWalk}
            alt="Students walking on university campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Trusted by 10,000+ students worldwide
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Apply to Top Universities{" "}
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                With Guidance You Can Trust
              </span>
            </h1>

            <p className="text-lg text-foreground/80 max-w-2xl">
              GEG — Global Education Gateway connects international students
              with world-class universities through verified agents and
              transparent application management.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to="/auth/signup" className="flex-1 sm:flex-initial">
                <Button size="lg" className="w-full">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/universities" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Universities
                </Button>
              </Link>
              <Link to="/courses" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Discover Courses
                </Button>
              </Link>
              <Link to="/visa-calculator" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Visa Calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="main" className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center hover:shadow-lg transition">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Find quick answers to common questions
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border rounded-lg bg-card"
            >
              <AccordionTrigger className="py-6 px-4 font-semibold text-base text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-6 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
          <p className="text-lg text-muted-foreground">
            Have questions? We're here to help. Send us a message and we'll get
            back to you soon.
          </p>
        </div>
        <Card className="border-2">
          <CardContent className="py-8">
            <ContactForm />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
