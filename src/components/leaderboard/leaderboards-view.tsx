"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Car, Trophy } from "lucide-react";
import { OwnerRankings } from "@/components/leaderboard/owner-rankings";
import { ClubRankings } from "@/components/leaderboard/club-rankings";
import { CarRankings } from "@/components/leaderboard/car-rankings";
import type {
  OwnerRanking,
  ClubRanking,
  CarRanking,
} from "@/types/leaderboard";

type TabType = "owners" | "clubs" | "cars";

interface LeaderboardsViewProps {
  ownersData: OwnerRanking[];
  clubsData: ClubRanking[];
  carsData: CarRanking[];
  defaultTab?: TabType;
}

export function LeaderboardsView({
  ownersData,
  clubsData,
  carsData,
  defaultTab = "owners",
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

  const handleTabChange = (tab: TabType) => {
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
        <div className="bg-muted p-1 rounded-lg flex gap-1">
          <Button
            variant={activeTab === "owners" ? "default" : "ghost"}
            onClick={() => handleTabChange("owners")}
            className="flex items-center gap-2"
          >
            <Car className="h-4 w-4" />
            Owner Rankings
          </Button>
          <Button
            variant={activeTab === "clubs" ? "default" : "ghost"}
            onClick={() => handleTabChange("clubs")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Club Rankings
          </Button>
          <Button
            variant={activeTab === "cars" ? "default" : "ghost"}
            onClick={() => handleTabChange("cars")}
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            Car Rankings
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "owners" && <OwnerRankings data={ownersData} />}
        {activeTab === "clubs" && <ClubRankings data={clubsData} />}
        {activeTab === "cars" && <CarRankings data={carsData} />}
      </div>
    </>
  );
}
