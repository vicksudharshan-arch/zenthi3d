DROP POLICY IF EXISTS "Anyone can submit a part" ON public.parts;

CREATE POLICY "Anyone can submit a part"
ON public.parts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  license_accepted = true
  AND (
    status = 'pending'
    OR (request_id IS NOT NULL AND status IN ('approved', 'private_fulfillment'))
  )
);