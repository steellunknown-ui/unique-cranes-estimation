import { use } from 'react';

export default function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Job Details: {id}</h1>
    </div>
  );
}
