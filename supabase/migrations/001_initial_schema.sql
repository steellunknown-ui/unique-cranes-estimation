-- User Profiles
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'estimator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ref_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  status TEXT CHECK (status IN (
    'draft','ai_processing','review','estimated','quoted','closed'
  )) DEFAULT 'draft',
  source TEXT CHECK (source IN ('pdf_upload','manual','cloned')),
  cloned_from UUID REFERENCES jobs(id),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Requirements
CREATE TABLE job_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  crane_type TEXT,
  quantity INTEGER,
  location_type TEXT,
  control_type TEXT,
  mh_capacity DECIMAL,
  ah_capacity DECIMAL,
  span DECIMAL,
  mh_lift DECIMAL,
  ah_lift DECIMAL,
  bay_length DECIMAL,
  mh_speed DECIMAL,
  ah_speed DECIMAL,
  ct_speed DECIMAL,
  lt_speed DECIMAL,
  micro_speed BOOLEAN,
  ambient_temp INTEGER,
  duty_class TEXT,
  vvvf_required BOOLEAN,
  power_supply TEXT,
  rail_size TEXT,
  dsl_type TEXT,
  special_features JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Extractions
CREATE TABLE ai_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  raw_extraction JSONB,
  field_confidence JSONB,
  missing_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component Catalog
CREATE TABLE components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  model TEXT NOT NULL,
  unit_price DECIMAL NOT NULL,
  unit TEXT DEFAULT 'piece',
  specs JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formulas
CREATE TABLE formulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  expression TEXT NOT NULL,
  variables JSONB,
  description TEXT,
  updated_by UUID REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rules
CREATE TABLE rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE
);

-- System Config
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawing Config
CREATE TABLE drawing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parameter TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  description TEXT
);

-- Estimations
CREATE TABLE estimations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  mh_breakdown JSONB,
  ah_breakdown JSONB,
  ct_breakdown JSONB,
  lt_breakdown JSONB,
  structural_cost DECIMAL,
  base_total DECIMAL,
  margin_multiplier DECIMAL,
  painting_cost DECIMAL,
  misc_cost DECIMAL,
  crd_cost DECIMAL,
  grand_total DECIMAL,
  gst_amount DECIMAL,
  grand_total_with_gst DECIMAL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('quotation','job_card','missing_fields','ga_drawing')),
  storage_path TEXT,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies: Admin sees and edits everything
CREATE POLICY "Admin full access" ON user_profiles FOR ALL USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Jobs: users see their own jobs, admin sees all
CREATE POLICY "Users see own jobs" ON jobs FOR SELECT USING (
  created_by = auth.uid() OR
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Users create jobs" ON jobs FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Users update own jobs" ON jobs FOR UPDATE USING (
  created_by = auth.uid() OR
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Config tables: all authenticated users can read, only admin can write
CREATE POLICY "All users read components" ON components FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write components" ON components FOR ALL USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "All users read formulas" ON formulas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write formulas" ON formulas FOR ALL USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "All users read system_config" ON system_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write system_config" ON system_config FOR ALL USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "All users read drawing_config" ON drawing_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin write drawing_config" ON drawing_config FOR ALL USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
);

-- Job requirements and estimations follow job access
CREATE POLICY "Access job requirements with job access" ON job_requirements FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_requirements.job_id
    AND (jobs.created_by = auth.uid() OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  )
);
CREATE POLICY "Access estimations with job access" ON estimations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = estimations.job_id
    AND (jobs.created_by = auth.uid() OR
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin')
  )
);
