"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Star, Car } from "lucide-react";
import { getTopCars } from "@/lib/data/leaderboards";
import Link from "next/link";
import Image from "next/image";
import type { CarRanking } from "@/lib/data/leaderboards";

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    ),
  ]);
}

interface CarLeaderboardEntry {
  car: CarRanking["car"];
  owner: CarRanking["car"]["owner"];
  totalLikes: number;
  rank: number;
}

export function CarRankings() {
  const [carLeaderboard, setCarLeaderboard] = useState<CarLeaderboardEntry[]>(
    []
  );

  useEffect(() => {
    async function loadCarLeaderboard() {
      try {
        const carRankings = await withTimeout(getTopCars(10), 3000);

        // Transform to our component's format
        const carEntries: CarLeaderboardEntry[] = carRankings.map(
          (ranking) => ({
            car: ranking.car,
            owner: ranking.car.owner || {
              id: "",
              username: "",
              display_name: "Unknown",
            },
            totalLikes: ranking.likes,
            rank: ranking.rank,
          })
        );

        setCarLeaderboard(carEntries);
      } catch (error) {
        if (error instanceof Error && !error.message?.includes("Timeout")) {
          console.error("Error loading car leaderboard:", error);
        }
        // Keep empty array - component will show empty state
      }
    }

    loadCarLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-2 md:space-y-3">
      {carLeaderboard.slice(0, 100).map((entry) => (
        <Link
          key={entry.car.id}
          href={`/garage/${entry.car.id}?from=leaderboard&tab=cars`}
          className="block"
        >
          <Card className="transition-all hover:shadow-lg cursor-pointer">
            <CardContent className="px-2 md:px-4">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Rank Number */}
                <div className="flex items-center justify-center min-w-[40px] md:min-w-[60px]">
                  <div className="flex items-center gap-1">
                    <span className="text-lg md:text-2xl font-bold">
                      {entry.rank}
                    </span>
                    {getRankIcon(entry.rank)}
                  </div>
                </div>

                {/* Car Image */}
                <div className="relative h-14 w-14 md:h-20 md:w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  {entry.car.images && entry.car.images.length > 0 ? (
                    <Image
                      src={entry.car.images[0]}
                      alt={`${entry.car.brand} ${entry.car.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 112px, 160px"
                      quality={100}
                      priority={entry.rank <= 10}
                      unoptimized={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm md:text-xl font-medium">
                      {entry.car.brand.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Car Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                    <h3 className="font-semibold text-sm md:text-lg truncate">
                      {entry.car.brand} {entry.car.model}
                    </h3>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {entry.car.year}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    Owner: {entry.owner?.display_name || "Unknown"}
                  </p>
                </div>

                {/* Car Likes Score */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg md:text-2xl font-bold text-primary">
                      {entry.totalLikes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {carLeaderboard.length === 0 && (
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">
            No car rankings yet
          </h4>
          <p className="text-muted-foreground mb-4">
            Upload photos of your car and start collecting likes to compete!
          </p>
          <Link href="/garage/create">
            <Button>Share Your Car</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
