-- Update RLS policies to avoid referencing the students table from other tables
-- This reduces the chance of infinite recursion when policies are evaluated

-- APPLICATION DOCUMENTS
DROP POLICY IF EXISTS "Students can manage docs for their applications" ON public.application_documents;
DROP POLICY IF EXISTS "Agents can view docs for their applications" ON public.application_documents;

CREATE POLICY "Students can manage docs for their applications"
ON public.application_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_documents.application_id
      AND a.student_profile_id = auth.uid()
  )
);

CREATE POLICY "Agents can view docs for their applications"
ON public.application_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.agents ag ON a.agent_id = ag.id
    WHERE a.id = application_documents.application_id
      AND ag.profile_id = auth.uid()
  )
);

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages for their applications" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages on their applications" ON public.messages;

CREATE POLICY "Users can view messages for their applications"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = messages.application_id
      AND (
        a.student_profile_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.agents ag
          WHERE ag.id = a.agent_id
            AND ag.profile_id = auth.uid()
        )
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Users can send messages on their applications"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = messages.application_id
        AND (
          a.student_profile_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.agents ag
            WHERE ag.id = a.agent_id
              AND ag.profile_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'staff')
    )
  )
);

-- PAYMENTS
DROP POLICY IF EXISTS "Students can view their payments" ON public.payments;
CREATE POLICY "Students can view their payments"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = payments.application_id
      AND a.student_profile_id = auth.uid()
  )
);

-- OFFERS
DROP POLICY IF EXISTS "Students can view offers for their applications" ON public.offers;
DROP POLICY IF EXISTS "Students can accept offers" ON public.offers;

CREATE POLICY "Students can view offers for their applications"
ON public.offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = offers.application_id
      AND a.student_profile_id = auth.uid()
  )
);

CREATE POLICY "Students can accept offers"
ON public.offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = offers.application_id
      AND a.student_profile_id = auth.uid()
  )
);

-- CAS/LOA
DROP POLICY IF EXISTS "Students can view their CAS LOA" ON public.cas_loa;
CREATE POLICY "Students can view their CAS LOA"
ON public.cas_loa
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = cas_loa.application_id
      AND a.student_profile_id = auth.uid()
  )
);
