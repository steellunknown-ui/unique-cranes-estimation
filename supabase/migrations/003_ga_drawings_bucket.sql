-- Create ga-drawings bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ga-drawings', 'ga-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for ga-drawings bucket
CREATE POLICY "Authenticated users can upload GA drawings"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ga-drawings');

CREATE POLICY "Authenticated users can update GA drawings"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ga-drawings');

CREATE POLICY "Authenticated users can read GA drawings"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ga-drawings');
