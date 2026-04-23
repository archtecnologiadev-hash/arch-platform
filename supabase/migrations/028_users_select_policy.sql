-- Allow authenticated users to read all users (needed for chat names, client search, etc.)
-- The previous policy "users_select_own" only allowed reading own row, breaking search and chat.
DROP POLICY IF EXISTS "users_select_all" ON public.users;
CREATE POLICY "users_select_all" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');
