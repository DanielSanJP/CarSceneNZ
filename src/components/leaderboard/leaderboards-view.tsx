"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Car, Trophy } from "lucide-react";
import { OwnerRankings } from "@/components/leaderboard/owner-rankings";
import { ClubRankings } from "@/components/leaderboard/club-rankings";
import { CarRankings } from "@/components/leaderboard/car-rankings";
import type { LeaderboardsData } from "@/types/leaderboard";

type TabType = "owners" | "clubs" | "cars";

interface LeaderboardsViewProps {
  defaultTab?: TabType;
  leaderboardsData: LeaderboardsData | null;
}

export function LeaderboardsView({
  defaultTab = "owners",
  leaderboardsData,
}: LeaderboardsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // Get tab from URL parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "clubs" || tabParam === "owners" || tabParam === "cars") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle error state or missing data
  if (!leaderboardsData) {
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">Failed to load leaderboards</h2>
        <p className="text-muted-foreground mb-6">
          There was an error loading the leaderboards data.
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </>
    );
  }

  const {
    cars: carsData,
    owners: ownersData,
    clubs: clubsData,
  } = leaderboardsData;

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return; // Don't change if same tab

    setActiveTab(tab);

    // Update URL without page refresh
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/leaderboards?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg flex gap-1 w-full max-w-md mx-auto">
          <Button
            variant={activeTab === "owners" ? "default" : "ghost"}
            onClick={() => handleTabChange("owners")}
            className="flex items-center gap-1 sm:gap-2 flex-1 px-2 sm:px-4"
          >
            <Car className="h-4 w-4" />
            <span>Owners</span>
          </Button>
          <Button
            variant={activeTab === "clubs" ? "default" : "ghost"}
            onClick={() => handleTabChange("clubs")}
            className="flex items-center gap-1 sm:gap-2 flex-1 px-2 sm:px-4"
          >
            <Users className="h-4 w-4" />
            <span>Clubs</span>
          </Button>
          <Button
            variant={activeTab === "cars" ? "default" : "ghost"}
            onClick={() => handleTabChange("cars")}
            className="flex items-center gap-1 sm:gap-2 flex-1 px-2 sm:px-4"
          >
            <Trophy className="h-4 w-4" />
            <span>Cars</span>
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <>
        {activeTab === "owners" && <OwnerRankings data={ownersData} />}
        {activeTab === "clubs" && <ClubRankings data={clubsData} />}
        {activeTab === "cars" && <CarRankings data={carsData} />}
      </>
    </>
  );
}
