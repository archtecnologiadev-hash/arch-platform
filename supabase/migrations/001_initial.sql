-- ARCH Platform — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tables ───────────────────────────────────────────────────────────────────

-- Users: mirrors auth.users, stores role
create table public.users (
  id         uuid        references auth.users(id) on delete cascade primary key,
  email      text        not null,
  nome       text        not null,
  tipo       text        not null check (tipo in ('cliente', 'arquiteto', 'fornecedor')),
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Architecture studios
create table public.escritorios (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references public.users(id) on delete cascade not null,
  nome       text        not null,
  cidade     text,
  estado     text,
  estilo     text,
  bio        text,
  slug       text        unique,
  rating     numeric(3,2) default 0,
  created_at timestamptz default now() not null
);

-- Projects
create table public.projetos (
  id           uuid        default uuid_generate_v4() primary key,
  escritorio_id uuid       references public.escritorios(id) on delete set null,
  cliente_id   uuid        references public.users(id) on delete set null,
  nome         text        not null,
  etapa_atual  text        default 'briefing',
  status       text        default 'ativo' check (status in ('ativo', 'concluido', 'cancelado')),
  created_at   timestamptz default now() not null
);

-- Client leads / contact requests
create table public.leads (
  id           uuid        default uuid_generate_v4() primary key,
  escritorio_id uuid       references public.escritorios(id) on delete cascade,
  nome         text        not null,
  email        text        not null,
  telefone     text,
  mensagem     text,
  created_at   timestamptz default now() not null
);

-- Suppliers
create table public.fornecedores (
  id         uuid        default uuid_generate_v4() primary key,
  user_id    uuid        references public.users(id) on delete cascade,
  nome       text        not null,
  segmento   text,
  cidade     text,
  bio        text,
  slug       text        unique,
  created_at timestamptz default now() not null
);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.users        enable row level security;
alter table public.escritorios  enable row level security;
alter table public.projetos     enable row level security;
alter table public.leads        enable row level security;
alter table public.fornecedores enable row level security;

-- users: each user manages only their own row
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- escritorios: public read, owner write
create policy "escritorios_public_read" on public.escritorios
  for select using (true);

create policy "escritorios_owner_write" on public.escritorios
  for all using (auth.uid() = user_id);

-- projetos: visible to the client and the studio owner
create policy "projetos_read" on public.projetos
  for select using (
    auth.uid() = cliente_id or
    auth.uid() in (select user_id from public.escritorios where id = escritorio_id)
  );

create policy "projetos_escritorio_write" on public.projetos
  for all using (
    auth.uid() in (select user_id from public.escritorios where id = escritorio_id)
  );

-- leads: anyone can submit, only the studio owner reads
create policy "leads_public_insert" on public.leads
  for insert with check (true);

create policy "leads_owner_read" on public.leads
  for select using (
    auth.uid() in (select user_id from public.escritorios where id = escritorio_id)
  );

-- fornecedores: public read, owner write
create policy "fornecedores_public_read" on public.fornecedores
  for select using (true);

create policy "fornecedores_owner_write" on public.fornecedores
  for all using (auth.uid() = user_id);
