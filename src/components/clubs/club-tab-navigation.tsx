"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { ClubGallery } from "@/components/clubs/tabs/club-gallery";
import { CreateClubForm } from "@/components/clubs/tabs/create-club-form";
import { ClubCardSkeleton } from "@/components/ui/content-skeletons";
import type { Club } from "@/types/club";
import type { User } from "@/types/user";

type MainTab = "gallery" | "create";

interface ClubTabNavigationProps {
  clubs: (Club & { memberCount: number })[];
  currentUser: User | null;
  userClubIds: Set<string>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
  createClubAction: (formData: FormData) => Promise<void>;
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
  joinClubAction?: (
    clubId: string,
    userId: string
  ) => Promise<{ success: boolean; message?: string }>;
  sendClubJoinRequestAction?: (
    clubId: string,
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

function ClubTabNavigationContent({
  clubs,
  currentUser,
  userClubIds,
  pagination,
  createClubAction,
  uploadAction,
  joinClubAction,
  sendClubJoinRequestAction,
}: ClubTabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Get default tab - always start with gallery since myclub is now separate
  const getDefaultTab = (): MainTab => {
    const tabFromUrl = searchParams.get("tab") as MainTab;
    if (tabFromUrl && ["gallery", "create"].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    // Default to "gallery" since myclub is now a separate page
    return "gallery";
  };

  const [currentTab, setCurrentTab] = useState<MainTab>(getDefaultTab());

  // Update tab from URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as MainTab;
    if (tabFromUrl && ["gallery", "create"].includes(tabFromUrl)) {
      setCurrentTab(tabFromUrl);
    } else {
      // Default to "gallery" since myclub is now a separate page
      setCurrentTab("gallery");
    }
  }, [searchParams]);

  // Handle tab navigation
  const handleTabChange = (tab: MainTab) => {
    if (tab === currentTab) return; // Don't change if same tab

    // Update tab state immediately for instant visual feedback
    setCurrentTab(tab);

    // Show loading state briefly for better UX
    setIsTabLoading(true);

    if (tab === "gallery") {
      // Browse Clubs gets the tab parameter
      router.push("/clubs?tab=gallery", { scroll: false });
    } else {
      // Create Club and other tabs get tab parameters
      const newUrl = `/clubs?tab=${tab}`;
      router.push(newUrl, { scroll: false });
    }

    // Hide loading after a brief moment
    setTimeout(() => {
      setIsTabLoading(false);
    }, 150);
  };

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
          {isTabLoading ? (
            // Show appropriate skeleton based on tab type
            <>
              {currentTab === "gallery" && <ClubCardSkeleton count={9} />}
              {currentTab === "create" && (
                <div className="max-w-2xl mx-auto">
                  <ClubCardSkeleton count={1} />
                </div>
              )}
            </>
          ) : (
            <>
              {currentTab === "gallery" && (
                <ClubGallery
                  clubs={clubs}
                  currentUser={currentUser}
                  userClubIds={userClubIds}
                  pagination={pagination}
                  joinClubAction={joinClubAction}
                  sendClubJoinRequestAction={sendClubJoinRequestAction}
                />
              )}

              {currentTab === "create" && (
                <>
                  {currentUser ? (
                    <CreateClubForm
                      user={currentUser}
                      action={createClubAction}
                      embedded={true}
                      onSuccess={() => router.push("/clubs/my-clubs")}
                      uploadAction={uploadAction}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Please log in to create a club.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClubTabNavigation({
  clubs,
  currentUser,
  userClubIds,
  pagination,
  createClubAction,
  uploadAction,
  joinClubAction,
  sendClubJoinRequestAction,
}: ClubTabNavigationProps) {
  return (
    <ClubTabNavigationContent
      clubs={clubs}
      currentUser={currentUser}
      userClubIds={userClubIds}
      pagination={pagination}
      createClubAction={createClubAction}
      uploadAction={uploadAction}
      joinClubAction={joinClubAction}
      sendClubJoinRequestAction={sendClubJoinRequestAction}
    />
  );
}
