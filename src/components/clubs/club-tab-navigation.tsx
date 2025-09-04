"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { ClubGallery } from "@/components/clubs/tabs/club-gallery";
import { CreateClubForm } from "@/components/clubs/tabs/create-club-form";
import { MyClubView } from "@/components/clubs/tabs/my-club-view";
import type { Club } from "@/types/club";
import type { User } from "@/types/user";

type MainTab = "gallery" | "myclub" | "create";

interface ClubTabNavigationProps {
  clubs: Club[];
  currentUser: User | null;
  userMemberships: Array<{
    club: Club;
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  createClubAction: (formData: FormData) => Promise<void>;
}

function ClubTabNavigationContent({
  clubs,
  currentUser,
  userMemberships,
  createClubAction,
}: ClubTabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current tab from URL
  const getCurrentTab = (): MainTab => {
    const tabFromUrl = searchParams.get("tab") as MainTab;
    if (tabFromUrl && ["gallery", "myclub", "create"].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return "gallery";
  };

  const currentTab = getCurrentTab();

  // Handle tab navigation
  const handleTabChange = (tab: MainTab) => {
    const newUrl = tab === "gallery" ? "/clubs" : `/clubs?tab=${tab}`;
    router.push(newUrl, { scroll: false });
  };

  // Check if user has clubs to show My Clubs tab
  const hasUserClubs = userMemberships.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Car Clubs</h1>
            <p className="text-muted-foreground mb-6">
              Join the community, find your crew, share your passion
            </p>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-lg flex gap-1">
              <Button
                variant={currentTab === "gallery" ? "default" : "ghost"}
                onClick={() => handleTabChange("gallery")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Browse Clubs
              </Button>
              {hasUserClubs && (
                <Button
                  variant={currentTab === "myclub" ? "default" : "ghost"}
                  onClick={() => handleTabChange("myclub")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  My Clubs
                </Button>
              )}
              <Button
                variant={currentTab === "create" ? "default" : "ghost"}
                onClick={() => handleTabChange("create")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Club
              </Button>
            </div>
          </div>

          {/* Content based on current tab */}
          {currentTab === "gallery" && (
            <ClubGallery clubs={clubs} currentUser={currentUser} />
          )}

          {currentTab === "myclub" && hasUserClubs && (
            <MyClubView
              userClubs={userMemberships.map((membership) => ({
                club: {
                  id: membership.club.id,
                  name: membership.club.name,
                  description: membership.club.description || "",
                  location: membership.club.location || "",
                  club_type: membership.club.club_type as
                    | "open"
                    | "invite"
                    | "closed",
                  banner_image_url: membership.club.banner_image_url || "",
                  leader_id: membership.club.leader_id,
                  total_likes: membership.club.total_likes,
                  created_at: membership.club.created_at,
                },
                role: membership.role as "leader" | "co-leader" | "member",
                joined_at: membership.joined_at,
                memberCount: membership.memberCount,
              }))}
              user={currentUser!}
            />
          )}

          {currentTab === "create" &&
            (currentUser ? (
              <CreateClubForm
                user={currentUser}
                action={createClubAction}
                embedded={true}
                onSuccess={() =>
                  handleTabChange(hasUserClubs ? "myclub" : "gallery")
                }
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Please log in to create a club.
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export function ClubTabNavigation({
  clubs,
  currentUser,
  userMemberships,
  createClubAction,
}: ClubTabNavigationProps) {
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
      <ClubTabNavigationContent
        clubs={clubs}
        currentUser={currentUser}
        userMemberships={userMemberships}
        createClubAction={createClubAction}
      />
    </Suspense>
  );
}
