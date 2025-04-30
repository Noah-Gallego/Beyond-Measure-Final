import SingleProjectDisplay from '@/components/SingleProjectDisplay';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <SingleProjectDisplay projectId={params.id} />
    </div>
  );
} 