import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getClubById } from "@/lib/server/clubs";
import { EditClubForm } from "@/components/clubs/edit-club-form";

interface EditClubPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function EditClubPage({
  params,
  searchParams,
}: EditClubPageProps) {
  const { id } = await params;
  const { from = "join" } = await searchParams;

  const [currentUser, club] = await Promise.all([getUser(), getClubById(id)]);

  if (!club) {
    notFound();
  }

  // Check if user is the leader of the club
  if (club.leader_id !== currentUser.id) {
    redirect(`/clubs/${id}`);
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <EditClubForm club={club} fromTab={from} />
    </Suspense>
  );
}
