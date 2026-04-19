-- ARCH Platform — Auth trigger + policy fix
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- ── 1. Drop old insert policy (auth.uid() is null right after signUp) ────────
drop policy if exists "users_insert_own" on public.users;

-- ── 2. Trigger function: fires on every new auth.users row ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, nome, tipo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'tipo', 'cliente')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 3. Attach trigger to auth.users ──────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
