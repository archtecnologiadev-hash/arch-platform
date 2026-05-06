-- Fix: catalog is global public reference data — open SELECT to all (including anon)
-- auth.role() = 'authenticated' was silently blocking server-side reads via SSR client

DROP POLICY IF EXISTS "catalogo_read_all" ON public.catalogo_fabricantes;

CREATE POLICY "catalogo_public_read" ON public.catalogo_fabricantes
  FOR SELECT USING (true);
