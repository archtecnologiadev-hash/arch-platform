-- ARCH Platform — Schema updates for profile, projects, and events
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Extend escritorios with contact fields ────────────────────────────────────
alter table public.escritorios
  add column if not exists telefone  text,
  add column if not exists instagram text;

-- ── Extend projetos with type and description ─────────────────────────────────
alter table public.projetos
  add column if not exists tipo      text default 'residencial'
    check (tipo in ('residencial', 'comercial', 'institucional')),
  add column if not exists descricao text;

-- ── Events table (integer id matches CalendarioEvent type) ────────────────────
create table if not exists public.eventos (
  id          serial      primary key,
  projeto_id  uuid        references public.projetos(id) on delete cascade not null,
  titulo      text        not null,
  tipo        text        not null,
  data_inicio text        not null,
  data_fim    text        not null,
  hora_inicio text,
  hora_fim    text,
  observacao  text,
  created_at  timestamptz default now() not null
);

alter table public.eventos enable row level security;

-- Events visible/writable to the studio owner of that project
create policy "eventos_read" on public.eventos
  for select using (
    projeto_id in (
      select p.id from public.projetos p
      join public.escritorios e on e.id = p.escritorio_id
      where e.user_id = auth.uid()
    )
  );

create policy "eventos_write" on public.eventos
  for insert with check (
    projeto_id in (
      select p.id from public.projetos p
      join public.escritorios e on e.id = p.escritorio_id
      where e.user_id = auth.uid()
    )
  );

create policy "eventos_delete" on public.eventos
  for delete using (
    projeto_id in (
      select p.id from public.projetos p
      join public.escritorios e on e.id = p.escritorio_id
      where e.user_id = auth.uid()
    )
  );
