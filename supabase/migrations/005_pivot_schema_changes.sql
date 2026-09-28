-- Add client fields to jobs
ALTER TABLE jobs
ADD COLUMN client_company TEXT,
ADD COLUMN client_name TEXT,
ADD COLUMN client_email TEXT,
ADD COLUMN client_phone TEXT;

-- For existing jobs, we might want to migrate data from the clients table, 
-- but since this is a new system and we're dropping clients, we'll just drop the constraint.
ALTER TABLE jobs
DROP CONSTRAINT IF EXISTS jobs_client_id_fkey;

-- Drop the client_id column from jobs
ALTER TABLE jobs
DROP COLUMN IF EXISTS client_id;

-- Drop the clients table
DROP TABLE IF EXISTS clients;
