import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Globe, 
  Users, 
  FileCheck, 
  TrendingUp,
  Shield,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import gegLogo from '@/assets/geg-logo.png';

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
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>Trusted by 10,000+ students worldwide</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Apply to Top Universities
            <span className="block text-primary mt-2">
              With Guidance You Can Trust
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            GEG — Global Education Gateway connects international students with world-class universities 
            through verified agents and transparent application management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/search">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Search Universities
              </Button>
            </Link>
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

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl mb-20">
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
            { step: '1', title: 'Create Profile', desc: 'Sign up and complete your profile with academic history' },
            { step: '2', title: 'Search & Apply', desc: 'Find programs and submit applications with required documents' },
            { step: '3', title: 'Get Accepted', desc: 'Receive offers, manage visa process, and enroll' },
          ].map((item, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
              {index < 2 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="bg-gradient-hero border-0 text-primary-foreground">
          <CardContent className="pt-12 pb-12 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join thousands of students who have successfully enrolled in top universities worldwide
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
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