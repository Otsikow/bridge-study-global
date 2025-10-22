import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContactForm } from '@/components/ContactForm';
import BackButton from '@/components/BackButton';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <BackButton variant="ghost" size="sm" fallback="/" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground">We typically respond within one business day.</p>
            <p className="text-sm">
              Prefer email? <a className="text-primary hover:underline" href="mailto:info@globaltalentgateway.com">info@globaltalentgateway.com</a>
            </p>
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
