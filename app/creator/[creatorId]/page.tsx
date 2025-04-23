import Dashboard from "@/app/dashboard/page.tsx"; // update the path if needed

export default function CreatorPage({ params }: { params: { creatorId: string } }) {
  return <Dashboard creatorId={params.creatorId} />;
}
