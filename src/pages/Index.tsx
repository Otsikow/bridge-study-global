import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContactForm } from '@/components/ContactForm';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Globe,
  Users,
  FileCheck,
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle,
  Search,
  Star,
  Quote,
  Calculator,
  Brain,
  Upload,
  DollarSign,
  Video,
  BookOpen,
} from 'lucide-react';
import gegLogo from '@/assets/geg-logo.png';
import heroBanner from '@/assets/hero-banner.jpg';

const Index = () => {
  const features = [
    {
      icon: Globe,
      title: 'Global Universities',
      description: 'Access programs from top universities worldwide',
    },
    {
      icon: FileCheck,
      title: 'Application Management',
      description: 'Track and manage your applications in one place',
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'Get support from verified education agents',
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Your data is protected with enterprise-grade security',
    },
    {
      icon: Calculator,
      title: 'Visa Calculator',
      description: 'Check your visa eligibility with AI-powered assessment',
    },
    {
      icon: Brain,
      title: 'AI-Powered Features',
      description: 'Get program recommendations and generate SoPs with AI',
    },
    {
      icon: Upload,
      title: 'Bulk Import',
      description: 'Import multiple students and manage applications efficiently',
    },
    {
      icon: DollarSign,
      title: 'Commission Tracking',
      description: 'Track earnings and manage commissions transparently',
    },
  ];

  const stats = [
    { value: '500+', label: 'Universities' },
    { value: '50+', label: 'Countries' },
    { value: '10K+', label: 'Students' },
    { value: '95%', label: 'Success Rate' },
  ];

  const faqs = [
    {
      question: 'How does GEG help me apply to universities?',
      answer:
        'GEG connects you with verified education agents who guide you through the entire application process. Our platform helps you search for programs, manage applications, track progress, and receive expert advice every step of the way.',
    },
    {
      question: 'Is there a fee to use the platform?',
      answer:
        'Creating an account and searching for universities is completely free. Our partner agents may charge for their consulting services, but all fees are transparent and discussed upfront before you commit.',
    },
    {
      question: 'How long does the application process take?',
      answer:
        'The timeline varies depending on the university and program. Typically, the application process takes 2-4 weeks to complete, with universities taking 4-8 weeks to respond. Your assigned agent will help you understand specific timelines for your chosen programs.',
    },
    {
      question: 'What documents do I need to apply?',
      answer:
        'Common documents include academic transcripts, English language test scores (IELTS/TOEFL), letters of recommendation, personal statement, and passport copy. Your agent will provide a detailed checklist.',
    },
    {
      question: 'Can I apply to multiple universities?',
      answer:
        'Yes! We encourage applying to multiple universities to increase your chances of acceptance. Our platform makes it easy to manage multiple applications simultaneously and track their progress in one place.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={gegLogo} alt="GEG Logo" className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold">GEG</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/feedback">
              <Button variant="ghost">Feedback</Button>
            </Link>
            <Link to="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBanner} alt="Students celebrating success" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>Trusted by 10,000+ students worldwide</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Apply to Top Universities
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                With Guidance You Can Trust
              </span>
            </h1>

            <p className="text-xl text-foreground/80 max-w-2xl">
              GEG — Global Education Gateway connects international students with world-class universities
              through verified agents and transparent application management.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 h-14 shadow-lg">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Search Universities
                </Button>
              </Link>
              <Link to="/visa-calculator">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  <Calculator className="mr-2 h-5 w-5" />
                  Visa Calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Find quick answers to common questions</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="py-6 text-left">
                  <span className="font-semibold text-base">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h2>
          <p className="text-lg text-muted-foreground">
            Have questions? We're here to help. Send us a message and we'll get back to you soon.
          </p>
        </div>
        <Card className="border-2">
          <CardContent className="pt-8 pb-8">
            <ContactForm />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3">
            <img src={gegLogo} alt="GEG Logo" className="h-8 w-8 object-contain" />
            <span className="font-semibold">GEG — Global Education Gateway</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 GEG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
