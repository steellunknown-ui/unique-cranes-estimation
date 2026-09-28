-- Users can read extractions for their own jobs
CREATE POLICY "Users access own job extractions" 
ON ai_extractions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = ai_extractions.job_id
    AND (
      jobs.created_by = auth.uid() OR
      (SELECT role FROM user_profiles 
       WHERE id = auth.uid()) = 'admin'
    )
  )
);

-- Create client-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  false,
  20971520, -- 20MB in bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf'];

-- RLS for client-documents bucket
-- Users can upload/view documents if they are authenticated
CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'client-documents'
);

CREATE POLICY "Authenticated users can update client documents"
ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'client-documents'
);

CREATE POLICY "Authenticated users can read client documents"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'client-documents'
);
