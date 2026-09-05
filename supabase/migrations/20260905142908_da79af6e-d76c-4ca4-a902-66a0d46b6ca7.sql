CREATE TABLE public.app_secrets (
  key_name text PRIMARY KEY,
  key_value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_secrets TO service_role;

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages app secrets"
  ON public.app_secrets FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER app_secrets_set_updated_at
  BEFORE UPDATE ON public.app_secrets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_secrets (key_name, key_value) VALUES ('brave_search_api_key', '');