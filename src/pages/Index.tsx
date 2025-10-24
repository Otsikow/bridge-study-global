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
import { ThemeToggle } from '@/components/ThemeToggle';
import campusWalk from '@/assets/campus-walk.png';
import campusGathering from '@/assets/campus-gathering.png';
import modernClassroom from '@/assets/modern-classroom.png';
import studentJourney from '@/assets/student-journey.png';
import visaSuccess from '@/assets/visa-success.png';
import campusLife from '@/assets/campus-life.png';
import studentStudying from '@/assets/student-studying.png';
import campusTour from '@/assets/campus-tour.png';

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
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md">Skip to content</a>
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <img src={gegLogo} alt="GEG Logo" className="h-8 w-8 sm:h-12 sm:w-12 object-contain flex-shrink-0 dark:brightness-0 dark:invert" />
              <span className="text-lg sm:text-xl font-bold truncate">GEG</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
              <ThemeToggle />
              <Link to="/feedback" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  Feedback
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden xs:inline">Sign In</span>
                  <span className="inline xs:hidden">In</span>
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm" className="text-xs sm:text-sm px-2.5 sm:px-4">
                  <span className="hidden xs:inline">Get Started</span>
                  <span className="inline xs:hidden">Start</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={campusWalk} alt="Students walking on university campus" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">
          <div className="max-w-4xl space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Trusted by 10,000+ students worldwide</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
              Apply to Top Universities
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                With Guidance You Can Trust
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-2xl leading-relaxed">
              GEG — Global Education Gateway connects international students with world-class universities
              through verified agents and transparent application management.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-3xl">
              <Link to="/auth/signup" className="flex-1 sm:flex-initial">
                <Button size="lg" className="w-full text-base px-6 h-12 sm:h-14 shadow-lg hover:shadow-xl transition-shadow">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
              </Link>
              <Link to="/search" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full text-base px-6 h-12 sm:h-14">
                  <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" />
                  Search Universities
                </Button>
              </Link>
              <Link to="/visa-calculator" className="flex-1 sm:flex-initial">
                <Button size="lg" variant="outline" className="w-full text-base px-6 h-12 sm:h-14">
                  <Calculator className="mr-2 h-4 w-4 flex-shrink-0" />
                  Visa Calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16" id="main">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1.5 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Your Journey to Success</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            From exploration to enrollment, we support you every step of the way
          </p>
        </div>

        <div className="space-y-16 sm:space-y-24">
          {/* Expert Guidance */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={campusGathering} 
                  alt="Students gathering with education advisors on campus" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Users className="h-4 w-4" />
                Expert Support
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Personalized Guidance Every Step</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Connect with verified education agents who understand your unique goals and aspirations. 
                Our experts provide personalized guidance throughout your entire application journey, 
                from university selection to visa processing.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Verified Agents</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Success Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Learning */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                World-Class Education
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Learn in State-of-the-Art Facilities</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Experience cutting-edge education in modern classrooms equipped with the latest technology. 
                Join a diverse community of international students and engage with world-renowned faculty 
                who are leaders in their fields.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Top-Ranked Universities</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Interactive Learning</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Global Network</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={modernClassroom} 
                alt="Students in modern classroom with advanced technology" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Campus Life */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={campusTour} 
                  alt="International students on campus tour" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Globe className="h-4 w-4" />
                Campus Experience
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Immerse Yourself in Campus Culture</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Discover vibrant campus life at universities worldwide. From orientation programs to cultural events, 
                you'll have countless opportunities to make lifelong connections, explore new perspectives, 
                and create unforgettable memories.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Student Clubs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Cultural Events</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Career Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flexible Learning */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Video className="h-4 w-4" />
                Flexible Study
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Study on Your Terms</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Manage your applications and stay connected with your education agent from anywhere in the world. 
                Our platform gives you the flexibility to track progress, submit documents, and communicate 
                with advisors on your schedule.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Mobile Access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Document Management</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={studentStudying} 
                alt="Student studying with laptop in comfortable environment" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Visa Success */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={visaSuccess} 
                  alt="Student celebrating visa approval success" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Shield className="h-4 w-4" />
                Visa Support
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">Navigate Visa Process with Confidence</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                From acceptance to visa approval, we're with you every step of the way. Our comprehensive 
                visa calculator and expert guidance ensure you have everything you need for a successful 
                application, bringing you one step closer to your dream education.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Visa Calculator</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Document Checklist</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Expert Review</span>
                </div>
              </div>
            </div>
          </div>
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

      {/* Footer moved to global layout */}
    </div>
  );
};

export default Index;
