-- Create user_feedback table to store all feedback submissions
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID REFERENCES auth.users(id),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('general', 'bug', 'feature', 'improvement')),
  category TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 2000),
  contact_requested BOOLEAN DEFAULT false,
  contact_email TEXT,
  user_agent TEXT,
  page_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'closed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.user_feedback
  FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

-- Policy: Admins can update feedback (add notes, change status)
CREATE POLICY "Admins can update feedback"
  ON public.user_feedback
  FOR UPDATE
  USING (is_admin_or_staff(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_type ON public.user_feedback(feedback_type);

-- Grant permissions
GRANT SELECT, INSERT ON public.user_feedback TO anon, authenticated;
GRANT UPDATE ON public.user_feedback TO authenticated;