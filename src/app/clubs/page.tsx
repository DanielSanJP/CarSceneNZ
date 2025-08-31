"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Users, Plus, Heart } from "lucide-react";
import { getUserClubMemberships } from "@/data";
import { CreateClubForm } from "@/components/clubs/create-club-form";
import { JoinClubView } from "@/components/clubs/join-club-view";
import { MyClubView } from "@/components/clubs/my-club-view";

interface Club {
  id: string;
  name: string;
  description: string;
  banner_image_url: string;
  club_type: "open" | "invite" | "closed";
  location: string;
  leader_id: string;
  total_likes: number;
  created_at: string;
}

interface ClubMembership {
  club: Club;
  role: "leader" | "co-leader" | "member";
  joined_at: string;
  memberCount: number;
}

type MainTab = "myclub" | "join" | "create";

function ClubsPageContent() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL or use default
  const getInitialTab = (): MainTab => {
    const tabFromUrl = searchParams.get("tab") as MainTab;
    if (tabFromUrl && ["myclub", "join", "create"].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return isAuthenticated ? "myclub" : "join";
  };

  const [mainTab, setMainTab] = useState<MainTab>(getInitialTab());
  const [userClubs, setUserClubs] = useState<ClubMembership[]>([]);

  // Handle tab change and update URL
  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab);
    const newUrl = `/clubs?tab=${tab}`;
    router.push(newUrl, { scroll: false });
  };

  // Sync tab state with URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as MainTab;
    if (tabFromUrl && ["myclub", "join", "create"].includes(tabFromUrl)) {
      setMainTab(tabFromUrl);
    } else {
      // If no valid tab in URL, set default and update URL
      const defaultTab = userClubs.length > 0 ? "myclub" : "join";
      setMainTab(defaultTab);
      router.replace(`/clubs?tab=${defaultTab}`, { scroll: false });
    }
  }, [searchParams, userClubs.length, router]);

  // Load user's club memberships
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserClubs([]);
      return;
    }

    const memberships = getUserClubMemberships(user.id);
    setUserClubs(memberships);

    // Update default tab based on whether user has clubs
    if (isAuthenticated) {
      setMainTab(memberships.length > 0 ? "myclub" : "join");
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">🏁 Car Clubs</h1>
            <p className="text-muted-foreground mb-6">
              Join the community, find your crew, share your passion
            </p>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-lg flex gap-1">
              {userClubs.length > 0 && (
                <Button
                  variant={mainTab === "myclub" ? "default" : "ghost"}
                  onClick={() => handleTabChange("myclub")}
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  My Club{userClubs.length > 1 ? "s" : ""}
                </Button>
              )}
              <Button
                variant={mainTab === "join" ? "default" : "ghost"}
                onClick={() => handleTabChange("join")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Join Club
              </Button>
              <Button
                variant={mainTab === "create" ? "default" : "ghost"}
                onClick={() => handleTabChange("create")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Club
              </Button>
            </div>
          </div>

          {mainTab === "myclub" ? (
            /* My Club Section */
            <MyClubView userClubs={userClubs} />
          ) : mainTab === "join" ? (
            /* Join Club Section */
            <JoinClubView currentTab={mainTab} />
          ) : (
            /* Create Club Section */
            <CreateClubForm embedded={true} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClubsPage() {
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
      <ClubsPageContent />
    </Suspense>
  );
}
