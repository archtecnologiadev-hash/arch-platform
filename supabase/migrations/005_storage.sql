-- ARC Platform — Storage buckets + image columns
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Add image columns to escritorios ─────────────────────────────────────────
alter table public.escritorios
  add column if not exists image_url text,
  add column if not exists cover_url text;

-- ── Add extra columns to fornecedores ────────────────────────────────────────
alter table public.fornecedores
  add column if not exists instagram  text,
  add column if not exists whatsapp   text,
  add column if not exists email      text,
  add column if not exists founded    text,
  add column if not exists image_url  text,
  add column if not exists cover_url  text;

-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('escritorios', 'escritorios', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('fornecedores', 'fornecedores', true)
  on conflict (id) do nothing;

-- ── Storage RLS — escritorios bucket ─────────────────────────────────────────
create policy "escritorios_storage_public_read" on storage.objects
  for select using (bucket_id = 'escritorios');

create policy "escritorios_storage_owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'escritorios' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "escritorios_storage_owner_update" on storage.objects
  for update using (
    bucket_id = 'escritorios' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "escritorios_storage_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'escritorios' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Storage RLS — fornecedores bucket ────────────────────────────────────────
create policy "fornecedores_storage_public_read" on storage.objects
  for select using (bucket_id = 'fornecedores');

create policy "fornecedores_storage_owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'fornecedores' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "fornecedores_storage_owner_update" on storage.objects
  for update using (
    bucket_id = 'fornecedores' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "fornecedores_storage_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'fornecedores' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
