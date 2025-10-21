import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Quote
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
  ];

  const stats = [
    { value: '500+', label: 'Universities' },
    { value: '50+', label: 'Countries' },
    { value: '10K+', label: 'Students' },
    { value: '95%', label: 'Success Rate' },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      country: 'China',
      university: 'University of Toronto',
      image: '👩‍🎓',
      quote: 'GEG made my dream of studying in Canada a reality. The guidance from my agent was invaluable throughout the entire application process.',
      rating: 5
    },
    {
      name: 'Raj Patel',
      country: 'India',
      university: 'University of Melbourne',
      image: '👨‍🎓',
      quote: 'The platform is incredibly user-friendly. I was able to track all my applications and got accepted to my top choice university!',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      country: 'Mexico',
      university: 'King\'s College London',
      image: '👩‍🎓',
      quote: 'Transparent process, expert support, and amazing results. I couldn\'t have asked for a better experience.',
      rating: 5
    }
  ];

  const partnerUniversities = [
    'University of Toronto',
    'University of Melbourne',
    'King\'s College London',
    'National University of Singapore',
    'ETH Zurich',
    'University of British Columbia'
  ];

  const faqs = [
    {
      question: 'How does GEG help me apply to universities?',
      answer: 'GEG connects you with verified education agents who guide you through the entire application process. Our platform helps you search for programs, manage applications, track progress, and receive expert advice every step of the way.'
    },
    {
      question: 'Is there a fee to use the platform?',
      answer: 'Creating an account and searching for universities is completely free. Our partner agents may charge for their consulting services, but all fees are transparent and discussed upfront before you commit.'
    },
    {
      question: 'How long does the application process take?',
      answer: 'The timeline varies depending on the university and program. Typically, the application process takes 2-4 weeks to complete, with universities taking 4-8 weeks to respond. Your assigned agent will help you understand specific timelines for your chosen programs.'
    },
    {
      question: 'What documents do I need to apply?',
      answer: 'Common documents include academic transcripts, English language test scores (IELTS/TOEFL), letters of recommendation, personal statement, and passport copy. Specific requirements vary by university and program. Your agent will provide a detailed checklist.'
    },
    {
      question: 'Can I apply to multiple universities?',
      answer: 'Yes! We encourage applying to multiple universities to increase your chances of acceptance. Our platform makes it easy to manage multiple applications simultaneously and track their progress in one place.'
    }
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
        {/* Hero Image Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBanner} 
            alt="Diverse international students celebrating success" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Trusted by 10,000+ students worldwide</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Apply to Top Universities
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                With Guidance You Can Trust
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl">
              GEG — Global Education Gateway connects international students with world-class universities 
              through verified agents and transparent application management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/auth/signup">
                <Button size="lg" className="text-lg px-8 h-14 shadow-lg hover:shadow-xl transition-shadow">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 bg-background/80 backdrop-blur-sm">
                  Search Universities
                </Button>
              </Link>
            </div>

            {/* Quick Search Bar */}
            <div className="pt-8 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search universities, programs, or countries..." 
                  className="pl-12 h-14 text-base bg-background/90 backdrop-blur-sm shadow-lg border-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Study Abroad
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From program search to enrollment, we support you every step of the way
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Success Stories from Our Students
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from students who achieved their study abroad dreams with GEG
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.country}</p>
                  </div>
                </div>
                
                <div className="flex text-warning">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                  <p className="text-muted-foreground italic pl-6">
                    {testimonial.quote}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-primary">{testimonial.university}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Partner Universities */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl mb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Partner Universities
          </h2>
          <p className="text-lg text-muted-foreground">
            We work with prestigious institutions worldwide
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {partnerUniversities.map((university, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <p className="font-semibold">{university}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/search">
            <Button variant="outline" size="lg" className="text-base px-6">
              View All 500+ Partner Universities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Path to Success
          </h2>
          <p className="text-lg text-muted-foreground">
            Simple steps to achieve your study abroad dreams
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: '1', title: 'Create Profile', desc: 'Sign up and complete your profile with academic history', icon: Users },
            { step: '2', title: 'Search & Apply', desc: 'Find programs and submit applications with required documents', icon: FileCheck },
            { step: '3', title: 'Get Accepted', desc: 'Receive offers, manage visa process, and enroll', icon: CheckCircle },
          ].map((item, index) => (
            <Card key={index} className="relative border-2 hover:border-primary transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
              {index < 2 && (
                <div className="hidden md:block absolute top-12 left-[100%] w-8 h-0.5 bg-border" />
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Find quick answers to common questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold text-base">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link to="/auth/signup">
              <Button variant="outline">Contact Our Team</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-gradient-hero border-0 text-primary-foreground shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNGgtMnYyaDJ2LTJ6bS00LTRoMnYtMmgtMnYyem00IDBoMnYtMmgtMnYyem0tMiAyaDJ2LTJoLTJ2Mm0wLTRoMnYtMmgtMnYyem0tMiAyaDJ2LTJoLTJ2Mm0tMiAyaDJ2LTJoLTJ2Mm0tMiAyaDJ2LTJoLTJ2Mm0tMiAyaDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
          <CardContent className="pt-16 pb-16 space-y-8 relative z-10">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Free to get started • No credit card required</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl opacity-95 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who have successfully enrolled in top universities worldwide. 
              Start your application today and let us guide you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
              <Link to="/auth/signup">
                <Button size="lg" variant="secondary" className="text-lg px-10 h-14 shadow-xl hover:shadow-2xl transition-shadow">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="text-lg px-10 h-14 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  Explore Programs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src={gegLogo} alt="GEG Logo" className="h-8 w-8 object-contain" />
              <span className="font-semibold">GEG — Global Education Gateway</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 GEG. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;