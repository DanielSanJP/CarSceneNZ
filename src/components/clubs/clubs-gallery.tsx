"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { CreateClubForm } from "@/components/clubs/create-club-form";
import { JoinClubView } from "@/components/clubs/join-club-view";
import type { Club } from "@/types/club";
import type { User } from "@/types/user";

type MainTab = "join" | "create";

interface ClubsGalleryProps {
  clubs: Club[];
  currentUser: User | null;
}

function ClubsGalleryContent({ clubs, currentUser }: ClubsGalleryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL or use default
  const getInitialTab = (): MainTab => {
    const tabFromUrl = searchParams.get("tab") as MainTab;
    if (tabFromUrl && ["join", "create"].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return "join";
  };

  const [mainTab, setMainTab] = useState<MainTab>(getInitialTab());

  // Handle tab change and update URL
  const handleTabChange = (tab: MainTab) => {
    setMainTab(tab);
    const newUrl = `/clubs?tab=${tab}`;
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background">
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

          {mainTab === "join" ? (
            /* Join Club Section */
            <JoinClubView
              currentTab={mainTab}
              clubs={clubs}
              currentUser={currentUser}
            />
          ) : (
            /* Create Club Section */
            <CreateClubForm embedded={true} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ClubsGallery({ clubs, currentUser }: ClubsGalleryProps) {
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
      <ClubsGalleryContent clubs={clubs} currentUser={currentUser} />
    </Suspense>
  );
}
