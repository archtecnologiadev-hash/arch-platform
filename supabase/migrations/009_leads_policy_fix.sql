-- ARC Platform — Fix leads INSERT policy for unauthenticated visitors
-- Run in: Supabase Dashboard → SQL Editor → New query

-- Drop any conflicting policies
DROP POLICY IF EXISTS "leads_insert"        ON public.leads;
DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;

-- Allow anyone (including unauthenticated visitors) to submit a lead
CREATE POLICY "leads_insert_public" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Ensure owner read policy exists
DROP POLICY IF EXISTS "leads_owner_read" ON public.leads;
CREATE POLICY "leads_owner_read" ON public.leads
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.escritorios WHERE id = escritorio_id)
  );
