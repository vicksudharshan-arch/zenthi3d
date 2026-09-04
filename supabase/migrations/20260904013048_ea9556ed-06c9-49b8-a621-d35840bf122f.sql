ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS step_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stl_files jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.parts
SET step_files = jsonb_build_array(
  jsonb_build_object(
    'path', step_file_path,
    'name', COALESCE(step_file_name, step_file_path),
    'size', COALESCE(step_file_size, 0)
  )
)
WHERE step_file_path IS NOT NULL AND step_files = '[]'::jsonb;

UPDATE public.parts
SET stl_files = jsonb_build_array(
  jsonb_build_object(
    'path', stl_file_path,
    'name', COALESCE(stl_file_name, stl_file_path),
    'size', COALESCE(stl_file_size, 0)
  )
)
WHERE stl_file_path IS NOT NULL AND stl_files = '[]'::jsonb;