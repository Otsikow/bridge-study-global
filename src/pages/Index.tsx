import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import {
  Globe,
  Users,
  FileCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Search,
  Clock,
  Shield,
  TrendingUp,
  MapPin,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Building2,
  Sparkles,
} from 'lucide-react';
import gegLogo from '@/assets/geg-logo.png';
import heroBanner from '@/assets/hero-banner.jpg';
import campusWalk from '@/assets/campus-walk.png';
import studentJourney from '@/assets/student-journey.png';
import acceptanceLetter from '@/assets/acceptance-letter.png';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Fetch universities for the carousel
  const { data: universities } = useQuery({
    queryKey: ['universities-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, logo_url, country')
        .eq('active', true)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-rotate logos carousel
  useEffect(() => {
    if (universities && universities.length > 0) {
      const interval = setInterval(() => {
        setCurrentLogoIndex((prev) => (prev + 1) % Math.ceil(universities.length / 4));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [universities]);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '200+', label: 'Partner Universities', icon: Building2 },
    { value: '5000+', label: 'Students Placed', icon: Users },
    { value: '50+', label: 'Countries', icon: Globe },
    { value: '95%', label: 'Success Rate', icon: TrendingUp },
  ];

  const features = [
    {
      icon: FileCheck,
      title: 'Apply Easily',
      description: 'Streamlined application process with step-by-step guidance. Submit applications to multiple universities with just a few clicks.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Clock,
      title: 'Track in Real-Time',
      description: 'Monitor your application status 24/7 with live updates. Get instant notifications at every stage of your journey.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Connect with Verified Agents',
      description: 'Access a network of certified education agents who provide personalized guidance and support throughout your application.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const howItWorksSteps = [
    {
      step: '01',
      icon: Search,
      title: 'Find Your Perfect Program',
      description: 'Browse through 200+ partner universities and thousands of programs. Use our AI-powered recommendation engine to find the perfect match for your goals.',
      image: campusWalk,
    },
    {
      step: '02',
      icon: FileCheck,
      title: 'Apply with Confidence',
      description: 'Submit your application with guidance from verified agents. Upload documents, track progress, and communicate with universities—all in one place.',
      image: studentJourney,
    },
    {
      step: '03',
      icon: GraduationCap,
      title: 'Get Admitted & Enroll',
      description: 'Receive your offer letter, complete visa processing with our support, and start your journey to global education success.',
      image: acceptanceLetter,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Master\'s Student at MIT',
      country: 'United States',
      image: '👩‍🎓',
      quote: 'GEG made my dream of studying at MIT a reality. The platform was incredibly easy to use, and my agent provided invaluable support throughout the entire process.',
      rating: 5,
    },
    {
      name: 'Raj Patel',
      role: 'MBA Student at Oxford',
      country: 'United Kingdom',
      image: '👨‍💼',
      quote: 'The real-time tracking feature gave me peace of mind. I always knew exactly where my application stood. Highly recommend GEG to anyone pursuing international education!',
      rating: 5,
    },
    {
      name: 'Maria Garcia',
      role: 'Engineering Student at Stanford',
      country: 'United States',
      image: '👩‍💻',
      quote: 'From finding the right program to getting my visa approved, GEG was with me every step of the way. The agent network is fantastic and truly knowledgeable.',
      rating: 5,
    },
    {
      name: 'Chen Wei',
      role: 'PhD Candidate at Cambridge',
      country: 'United Kingdom',
      image: '👨‍🔬',
      quote: 'The AI recommendations helped me discover programs I hadn\'t considered. The entire experience was seamless, professional, and ultimately successful!',
      rating: 5,
    },
  ];

  const getVisibleLogos = () => {
    if (!universities || universities.length === 0) return [];
    const logosPerSlide = 4;
    const start = currentLogoIndex * logosPerSlide;
    return universities.slice(start, start + logosPerSlide);
  };

  const nextLogo = () => {
    if (universities && universities.length > 0) {
      setCurrentLogoIndex((prev) => (prev + 1) % Math.ceil(universities.length / 4));
    }
  };

  const prevLogo = () => {
    if (universities && universities.length > 0) {
      setCurrentLogoIndex((prev) => 
        prev === 0 ? Math.ceil(universities.length / 4) - 1 : prev - 1
      );
    }
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md">
        Skip to content
      </a>
      <nav className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={gegLogo} 
                alt="Global Education Gateway Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain dark:brightness-0 dark:invert" 
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Global Education Gateway
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10" id="main">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative container mx-auto px-4 sm:px-6 py-20 sm:py-28 md:py-36">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Trusted by 5000+ students worldwide</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Your Gateway to
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Global Education
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connect with top universities worldwide, track your applications in real-time, and get expert guidance from verified education agents.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/auth/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-14 shadow-lg hover:shadow-xl transition-all">
                  <FileCheck className="mr-2 h-5 w-5" />
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth/signup?role=agent" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-14 border-2">
                  <Users className="mr-2 h-5 w-5" />
                  Join as an Agent
                </Button>
              </Link>
              <Link to="/search" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-14 border-2">
                  <Building2 className="mr-2 h-5 w-5" />
                  Explore Universities
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>No Application Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Verified Agents Only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
              <CardContent className="p-6 sm:p-8">
                <stat.icon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* University Partners Carousel */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Leading Universities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Partner with top institutions from around the world
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevLogo}
                className="hidden sm:flex rounded-full"
                disabled={!universities || universities.length === 0}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                  {getVisibleLogos().map((uni) => (
                    <div
                      key={uni.id}
                      className="flex items-center justify-center p-6 bg-background rounded-xl border-2 hover:border-primary/50 transition-all hover:scale-105"
                    >
                      <img
                        src={uni.logo_url || '/placeholder.svg'}
                        alt={uni.name}
                        className="max-h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={nextLogo}
                className="hidden sm:flex rounded-full"
                disabled={!universities || universities.length === 0}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex sm:hidden justify-center gap-4 mt-6">
              <Button variant="ghost" size="icon" onClick={prevLogo} className="rounded-full">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextLogo} className="rounded-full">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {universities && Array.from({ length: Math.ceil(universities.length / 4) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentLogoIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentLogoIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/30'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Why Choose Global Education Gateway?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to succeed in your international education journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <Card key={i} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <CardContent className="p-8 relative z-10">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start your global education journey
            </p>
          </div>

          <div className="space-y-24 max-w-6xl mx-auto">
            {howItWorksSteps.map((step, i) => (
              <div
                key={i}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  i % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={`${i % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="relative">
                    <div className="text-8xl font-bold text-primary/10 absolute -top-8 -left-4">
                      {step.step}
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
                        <step.icon className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      <div className="mt-6">
                        <Link to="/auth/signup">
                          <Button size="lg" variant="outline" className="group">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${i % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Slider */}
      <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from students who achieved their dreams with GEG
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Card className="border-2 shadow-xl">
              <CardContent className="p-8 sm:p-12">
                <Quote className="h-12 w-12 text-primary/20 mb-6" />
                
                <div className="mb-8">
                  <p className="text-xl sm:text-2xl leading-relaxed mb-6 italic">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                  
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonials[currentTestimonial].image}</div>
                  <div>
                    <div className="font-bold text-lg">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-muted-foreground">
                      {testimonials[currentTestimonial].role}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {testimonials[currentTestimonial].country}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-16 rounded-full bg-background shadow-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-16 rounded-full bg-background shadow-lg"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentTestimonial ? 'w-8 bg-primary' : 'w-2 bg-primary/30'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of students who have achieved their dreams of studying abroad with Global Education Gateway.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8 h-14 shadow-xl">
                  <FileCheck className="mr-2 h-5 w-5" />
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-14 bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={gegLogo} 
                  alt="GEG Logo" 
                  className="h-10 w-10 object-contain dark:brightness-0 dark:invert" 
                />
                <span className="text-lg font-bold">GEG</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted partner in global education. Connecting students with world-class universities since 2020.
              </p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">
                    Find Universities
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/visa-calculator" className="text-muted-foreground hover:text-primary transition-colors">
                    Visa Calculator
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Partners */}
            <div>
              <h3 className="font-semibold mb-4">For Partners</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/auth/signup?role=agent" className="text-muted-foreground hover:text-primary transition-colors">
                    Become an Agent
                  </Link>
                </li>
                <li>
                  <Link to="/auth/signup?role=partner" className="text-muted-foreground hover:text-primary transition-colors">
                    Partner as University
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Partnership Inquiries
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <a href="mailto:info@globaleducationgateway.com" className="text-muted-foreground hover:text-primary transition-colors">
                    info@globaleducationgateway.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <a href="tel:+1234567890" className="text-muted-foreground hover:text-primary transition-colors">
                    +1 (234) 567-890
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">
                    123 Education Street, London, UK
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              © {new Date().getFullYear()} Global Education Gateway. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link to="/legal/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/legal/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="/auth/login" className="hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/auth/signup" className="hover:text-primary transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
