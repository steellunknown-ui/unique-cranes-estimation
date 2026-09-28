const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    if(line.includes('=')) {
        const [k, v] = line.split('=');
        env[k.trim()] = v.trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log("Users:");
    data.users.forEach(u => {
        console.log(`Email: ${u.email}`);
    });
  }
}

getUsers();
