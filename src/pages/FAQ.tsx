import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import BackButton from '@/components/BackButton';

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
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <BackButton variant="ghost" size="sm" fallback="/" />
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Quick answers to the most common questions</p>
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
      </section>
    </div>
  );
};

export default FAQ;
