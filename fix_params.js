const fs = require('fs');
const apiFiles = [
  'app/api/clients/[id]/route.ts',
  'app/api/jobs/[id]/route.ts',
  'app/api/jobs/[id]/status/route.ts',
  'app/api/jobs/[id]/requirements/route.ts'
];

for (const file of apiFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /export async function (\w+)\(req: NextRequest, \{ params \}: \{ params: \{ id: string \} \}\) \{/g,
    "export async function $1(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {\n  const resolvedParams = await params;\n  const id = resolvedParams.id;"
  );
  content = content.replace(/params\.id/g, 'id');
  fs.writeFileSync(file, content);
}

const clientFiles = [
  'app/(app)/clients/[id]/page.tsx',
  'app/(app)/jobs/[id]/layout.tsx',
  'app/(app)/jobs/[id]/requirements/page.tsx'
];

for (const file of clientFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /export default function (\w+)\(\{ params,?(.*?) \}: \{ params: \{ id: string \},?(.*?) \}\) \{/g,
    "import { use } from 'react';\n\nexport default function $1({ params,$2 }: { params: Promise<{ id: string }>,$3 }) {\n  const resolvedParams = use(params);\n  const id = resolvedParams.id;"
  );
  content = content.replace(/params\.id/g, 'id');
  fs.writeFileSync(file, content);
}

console.log('Done fixing Next.js 15+ params Promise');
