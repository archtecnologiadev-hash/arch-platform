-- ARC Platform — auto-link cliente when they sign up with email matching a project
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE OR REPLACE FUNCTION public.auto_link_cliente_to_projeto()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.projetos
  SET cliente_id = NEW.id
  WHERE email_cliente = NEW.email
    AND cliente_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_user_link_cliente ON public.users;

CREATE TRIGGER on_new_user_link_cliente
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_link_cliente_to_projeto();
