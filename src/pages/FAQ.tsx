import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import BackButton from '@/components/BackButton';
import libraryStudent from '@/assets/library.png';

const faqs = [
  {
    question: 'How do I get started?',
    answer:
      'Create an account and start by searching for programs. You can then complete your profile and begin your applications.'
  },
  {
    question: 'Can I talk to an advisor?',
    answer:
      'Yes. Our verified agents are available to guide you through program selection and applications.'
  },
  {
    question: 'How can I check visa eligibility?',
    answer:
      'Use our Visa Calculator to get a quick, AI-assisted assessment of your eligibility.'
  },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <BackButton variant="ghost" size="sm" fallback="/" />
          
          <div className="grid md:grid-cols-2 gap-8 items-center mb-10 mt-6">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
              <p className="text-muted-foreground text-lg">Quick answers to the most common questions about your education journey</p>
            </div>
            <div className="hidden md:block">
              <img 
                src={libraryStudent} 
                alt="Student learning and researching" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="py-6 text-left">
                  <span className="font-semibold text-base">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
