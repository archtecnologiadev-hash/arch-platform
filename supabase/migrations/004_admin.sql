-- ARCH Platform — Admin system
-- Run once in: Supabase Dashboard → SQL Editor → New query

-- ── Extend users table ────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role        text DEFAULT 'user'  CHECK (role IN ('user', 'admin')),
  ADD COLUMN IF NOT EXISTS plano       text DEFAULT 'free'  CHECK (plano IN ('free', 'arquiteto', 'fornecedor', 'admin')),
  ADD COLUMN IF NOT EXISTS status_conta text DEFAULT 'ativo' CHECK (status_conta IN ('ativo', 'trial', 'suspenso')),
  ADD COLUMN IF NOT EXISTS telefone    text,
  ADD COLUMN IF NOT EXISTS trial_ate   timestamptz;

-- ── is_admin() helper (SECURITY DEFINER — bypasses RLS for this check) ────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- ── Additional RLS policies so admins can read/update/delete all users ────────
DROP POLICY IF EXISTS "admin_read_users"   ON public.users;
DROP POLICY IF EXISTS "admin_update_users" ON public.users;
DROP POLICY IF EXISTS "admin_delete_users" ON public.users;

CREATE POLICY "admin_read_users"   ON public.users FOR SELECT USING (is_admin());
CREATE POLICY "admin_update_users" ON public.users FOR UPDATE USING (is_admin());
CREATE POLICY "admin_delete_users" ON public.users FOR DELETE USING (is_admin());

-- Allow admin to also see all escritorios / projetos for metrics
DROP POLICY IF EXISTS "admin_read_escritorios" ON public.escritorios;
DROP POLICY IF EXISTS "admin_read_projetos"    ON public.projetos;
DROP POLICY IF EXISTS "admin_read_leads"       ON public.leads;

CREATE POLICY "admin_read_escritorios" ON public.escritorios FOR SELECT USING (is_admin());
CREATE POLICY "admin_read_projetos"    ON public.projetos    FOR SELECT USING (is_admin());
CREATE POLICY "admin_read_leads"       ON public.leads       FOR SELECT USING (is_admin());

-- ── Admin action log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_log (
  id             serial      PRIMARY KEY,
  admin_id       uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  target_user_id uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  acao           text        NOT NULL,
  detalhes       jsonb,
  created_at     timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_log_read"  ON public.admin_log;
DROP POLICY IF EXISTS "admin_log_write" ON public.admin_log;

CREATE POLICY "admin_log_read"  ON public.admin_log FOR SELECT USING (is_admin());
CREATE POLICY "admin_log_write" ON public.admin_log FOR INSERT WITH CHECK (is_admin());

-- ── Support tickets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id         serial      PRIMARY KEY,
  user_id    uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  titulo     text        NOT NULL,
  mensagem   text        NOT NULL,
  status     text        DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ticket_respostas (
  id         serial      PRIMARY KEY,
  ticket_id  integer     REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  mensagem   text        NOT NULL,
  is_admin   boolean     DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_respostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_user_read"    ON public.tickets;
DROP POLICY IF EXISTS "tickets_user_insert"  ON public.tickets;
DROP POLICY IF EXISTS "tickets_admin_all"    ON public.tickets;
DROP POLICY IF EXISTS "ticket_resp_read"     ON public.ticket_respostas;
DROP POLICY IF EXISTS "ticket_resp_insert"   ON public.ticket_respostas;
DROP POLICY IF EXISTS "ticket_resp_admin"    ON public.ticket_respostas;

CREATE POLICY "tickets_user_read"   ON public.tickets FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "tickets_user_insert" ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets_admin_all"   ON public.tickets FOR ALL   USING (is_admin());

CREATE POLICY "ticket_resp_read"   ON public.ticket_respostas FOR SELECT
  USING (ticket_id IN (SELECT id FROM public.tickets WHERE user_id = auth.uid()) OR is_admin());
CREATE POLICY "ticket_resp_insert" ON public.ticket_respostas FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ticket_resp_admin"  ON public.ticket_respostas FOR ALL USING (is_admin());

-- ── Set the first admin manually after running this migration ─────────────────
-- UPDATE public.users SET role = 'admin', plano = 'admin' WHERE email = 'seu@email.com';
