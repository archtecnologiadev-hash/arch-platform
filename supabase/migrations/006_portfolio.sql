-- ARC Platform — Portfolio tables + escritorios extra columns
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Extra columns for escritorios ─────────────────────────────────────────────
alter table public.escritorios
  add column if not exists nome_responsavel text,
  add column if not exists especialidades   text[]  default '{}',
  add column if not exists website          text;

-- ── Projetos portfolio ────────────────────────────────────────────────────────
create table if not exists public.projetos_portfolio (
  id            uuid primary key default gen_random_uuid(),
  escritorio_id uuid references public.escritorios(id) on delete cascade not null,
  nome          text not null,
  descricao     text,
  categoria     text,
  created_at    timestamptz default now()
);

-- ── Portfolio imagens ─────────────────────────────────────────────────────────
create table if not exists public.portfolio_imagens (
  id                   uuid primary key default gen_random_uuid(),
  projeto_portfolio_id uuid references public.projetos_portfolio(id) on delete cascade not null,
  url                  text not null,
  descricao            text,
  ordem                int  default 0,
  created_at           timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.projetos_portfolio enable row level security;
alter table public.portfolio_imagens   enable row level security;

-- projetos_portfolio
create policy "pp_public_read"  on public.projetos_portfolio for select using (true);
create policy "pp_owner_insert" on public.projetos_portfolio for insert with check (
  escritorio_id in (select id from public.escritorios where user_id = auth.uid())
);
create policy "pp_owner_update" on public.projetos_portfolio for update using (
  escritorio_id in (select id from public.escritorios where user_id = auth.uid())
);
create policy "pp_owner_delete" on public.projetos_portfolio for delete using (
  escritorio_id in (select id from public.escritorios where user_id = auth.uid())
);

-- portfolio_imagens
create policy "pi_public_read"  on public.portfolio_imagens for select using (true);
create policy "pi_owner_insert" on public.portfolio_imagens for insert with check (
  projeto_portfolio_id in (
    select pp.id from public.projetos_portfolio pp
    join public.escritorios e on pp.escritorio_id = e.id
    where e.user_id = auth.uid()
  )
);
create policy "pi_owner_delete" on public.portfolio_imagens for delete using (
  projeto_portfolio_id in (
    select pp.id from public.projetos_portfolio pp
    join public.escritorios e on pp.escritorio_id = e.id
    where e.user_id = auth.uid()
  )
);

-- ── Storage bucket garantido público ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('escritorios', 'escritorios', true)
  on conflict (id) do update set public = true;

-- Recriar policies de storage se não existirem (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'escritorios_storage_public_read'
  ) then
    execute $p$
      create policy "escritorios_storage_public_read" on storage.objects
        for select using (bucket_id = 'escritorios');
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'escritorios_storage_owner_upload'
  ) then
    execute $p$
      create policy "escritorios_storage_owner_upload" on storage.objects
        for insert with check (
          bucket_id = 'escritorios' and
          auth.uid()::text = (storage.foldername(name))[1]
        );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'escritorios_storage_owner_update'
  ) then
    execute $p$
      create policy "escritorios_storage_owner_update" on storage.objects
        for update using (
          bucket_id = 'escritorios' and
          auth.uid()::text = (storage.foldername(name))[1]
        );
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'escritorios_storage_owner_delete'
  ) then
    execute $p$
      create policy "escritorios_storage_owner_delete" on storage.objects
        for delete using (
          bucket_id = 'escritorios' and
          auth.uid()::text = (storage.foldername(name))[1]
        );
    $p$;
  end if;
end $$;
