"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Car, Trophy } from "lucide-react";
import { Navigation } from "@/components/nav";
import { OwnerRankings } from "@/components/leaderboard/owner-rankings";
import { ClubRankings } from "@/components/leaderboard/club-rankings";
import { CarRankings } from "@/components/leaderboard/car-rankings";

type TabType = "owners" | "clubs" | "cars";

function LeaderboardsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("owners");

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
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🏆 Leaderboards</h1>
          <p className="text-muted-foreground mb-6">
            Top performers in the Car Scene NZ community
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
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
        </div>

        <div className="max-w-7xl mx-auto">
          {activeTab === "owners" && <OwnerRankings />}
          {activeTab === "clubs" && <ClubRankings />}
          {activeTab === "cars" && <CarRankings />}
        </div>
      </div>
    </>
  );
}

export default function LeaderboardsPage() {
  return (
    <Suspense
      fallback={
        <>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">🏆 Leaderboards</h1>
              <p className="text-muted-foreground mb-6">Loading...</p>
            </div>
          </div>
        </>
      }
    >
      <LeaderboardsPageContent />
    </Suspense>
  );
}
