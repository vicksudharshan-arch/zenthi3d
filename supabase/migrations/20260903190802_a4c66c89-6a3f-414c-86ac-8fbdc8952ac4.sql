GRANT SELECT, INSERT ON public.parts TO anon;
GRANT SELECT, INSERT ON public.parts TO authenticated;
GRANT ALL ON public.parts TO service_role;
GRANT INSERT ON public.copyright_reports TO anon;
GRANT INSERT ON public.copyright_reports TO authenticated;
GRANT ALL ON public.copyright_reports TO service_role;
GRANT ALL ON public.admin_config TO service_role;