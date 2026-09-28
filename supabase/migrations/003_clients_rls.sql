-- RLS for clients table
CREATE POLICY "All authenticated users can read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All authenticated users can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All authenticated users can delete clients" ON clients FOR DELETE TO authenticated USING (true);
