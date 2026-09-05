CREATE TABLE public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passcode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_config TO service_role;

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages admin config"
  ON public.admin_config FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER admin_config_set_updated_at
  BEFORE UPDATE ON public.admin_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed passcode removed: admin_config auth was retired for role-based admin
-- access (public.user_roles + has_role). Values must be set server-side only.