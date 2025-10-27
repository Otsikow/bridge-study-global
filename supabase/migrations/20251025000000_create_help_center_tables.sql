-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_faqs_tenant_id ON public.faqs(tenant_id);
CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_is_active ON public.faqs(is_active);
CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faqs
CREATE POLICY "Users can view active FAQs from their tenant"
  ON public.faqs FOR SELECT
  USING (
    is_active = true AND
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Admins can manage FAQs"
  ON public.faqs FOR ALL
  USING (
    public.check_user_role(ARRAY['admin', 'staff'])
  );

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.check_user_role(ARRAY['admin', 'staff'])
  );

CREATE POLICY "Authenticated users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid() AND
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "Admins can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    public.check_user_role(ARRAY['admin', 'staff'])
  );

-- Insert some sample FAQs
INSERT INTO public.faqs (tenant_id, question, answer, category, display_order)
SELECT 
  id,
  question,
  answer,
  category,
  display_order
FROM (
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1) as id,
    'How do I get started?' as question,
    'Create an account and start by searching for programs. You can then complete your profile and begin your applications.' as answer,
    'Getting Started' as category,
    1 as display_order
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'Can I talk to an advisor?',
    'Yes. Our verified agents are available to guide you through program selection and applications.',
    'Support',
    2
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'How can I check visa eligibility?',
    'Use our Visa Calculator to get a quick, AI-assisted assessment of your eligibility.',
    'Visa & Immigration',
    3
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'What documents do I need for applications?',
    'Typically you need transcripts, test scores, letters of recommendation, and a statement of purpose. Each program may have specific requirements.',
    'Applications',
    4
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'How long does the application process take?',
    'Application processing times vary by institution but typically range from 4-12 weeks. We recommend applying at least 6 months before your intended start date.',
    'Applications',
    5
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'Can I track my application status?',
    'Yes! You can track all your applications in real-time from your dashboard. You''ll also receive notifications for any status updates.',
    'Applications',
    6
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'What payment methods do you accept?',
    'We accept credit/debit cards, bank transfers, and various international payment methods. Payment plans may be available for certain services.',
    'Payments',
    7
  UNION ALL
  SELECT 
    (SELECT id FROM public.tenants LIMIT 1),
    'Is my personal information secure?',
    'Absolutely. We use industry-standard encryption and security measures to protect your data. Read our privacy policy for more details.',
    'Security',
    8
) AS sample_faqs
WHERE id IS NOT NULL;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
