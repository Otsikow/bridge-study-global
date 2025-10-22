import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/ContactForm';
import BackButton from '@/components/BackButton';
import usingMobile from '@/assets/using-mobile.png';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <BackButton variant="ghost" size="sm" fallback="/" />
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
              <p className="text-muted-foreground text-lg">We typically respond within one business day.</p>
              <p className="text-sm">
                Prefer email? <a className="text-primary hover:underline font-medium" href="mailto:info@globaltalentgateway.com">info@globaltalentgateway.com</a>
              </p>
            </div>
            <div className="hidden md:block">
              <img 
                src={usingMobile} 
                alt="Contact us for support" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Contact;
