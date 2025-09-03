import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getUserOptional } from "@/lib/auth";
import { getClubById, getClubMembers, isClubMember } from "@/lib/server/clubs";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubDetailPageProps) {
  const { id } = await params;
  const { from = "join", tab = "clubs" } = await searchParams;

  const [currentUser, club] = await Promise.all([
    getUserOptional(),
    getClubById(id),
  ]);

  if (!club) {
    notFound();
  }

  const [members, isUserMember] = await Promise.all([
    getClubMembers(club.id),
    currentUser
      ? isClubMember(club.id, currentUser.id)
      : Promise.resolve(false),
  ]);

  const memberCount = members.length;

  // Find user's role in the club
  const userMembership = currentUser
    ? members.find((member) => member.user_id === currentUser.id)
    : null;
  const userRole = userMembership?.role;

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
      <ClubDetailView
        club={club}
        members={members}
        memberCount={memberCount}
        currentUser={
          currentUser
            ? {
                ...currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null
        }
        isUserMember={isUserMember}
        userRole={userRole}
        fromTab={from}
        leaderboardTab={tab}
      />
    </Suspense>
  );
}
