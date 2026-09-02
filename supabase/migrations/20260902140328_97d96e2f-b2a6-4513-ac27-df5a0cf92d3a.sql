alter table public.parts
  add column if not exists placement text,
  add column if not exists material text,
  add column if not exists thickness_infill text;