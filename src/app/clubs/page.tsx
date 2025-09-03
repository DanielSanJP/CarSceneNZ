import { Suspense } from "react";
import { getUserOptional } from "@/lib/auth";
import { getAllClubs } from "@/lib/server/clubs";
import { ClubsGallery } from "@/components/clubs/clubs-gallery";

export default async function ClubsPage() {
  const [currentUser, clubs] = await Promise.all([
    getUserOptional(),
    getAllClubs(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">🏁 Car Clubs</h1>
                <p className="text-muted-foreground mb-6">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ClubsGallery
        clubs={clubs}
        currentUser={
          currentUser
            ? {
                ...currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null
        }
      />
    </Suspense>
  );
}
