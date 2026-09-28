-- Documents RLS Policy
CREATE POLICY "Access documents with job access" ON documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = documents.job_id
    AND (jobs.created_by = auth.uid() OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  )
);
