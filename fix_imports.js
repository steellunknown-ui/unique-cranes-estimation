const fs = require('fs');
const files = [
  'app/api/clients/route.ts',
  'app/api/clients/[id]/route.ts',
  'app/api/jobs/route.ts',
  'app/api/jobs/[id]/route.ts',
  'app/api/jobs/[id]/status/route.ts',
  'app/api/jobs/create/route.ts',
  'app/api/jobs/[id]/requirements/route.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'\nimport { cookies } from 'next/headers'", 
    "import { createClient } from '@/lib/supabase/server'"
  );
  content = content.replace(
    /const supabase = createRouteHandlerClient\(\{ cookies \}\)/g, 
    "const supabase = await createClient()"
  );
  
  // also check if createClient needs to be awaited inside the request handler but POST(req) might not be async? 
  // No, all Next.js route handlers I wrote are async function GET(req: NextRequest) { ... } so await createClient() works.
  
  fs.writeFileSync(file, content);
}
console.log('Done refactoring');
