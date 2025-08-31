"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { cars, users } from "@/data";
import Link from "next/link";
import Image from "next/image";

interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images: string[];
  total_likes: number;
}

interface User {
  id: string;
  username: string;
  display_name: string;
}

interface CarLeaderboardEntry {
  car: Car;
  owner: User;
  totalLikes: number;
  rank: number;
}

export function CarRankings() {
  const [carLeaderboard, setCarLeaderboard] = useState<CarLeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadCarLeaderboard() {
      try {
        // Use imported data directly
        const carsData: Car[] = cars;
        const usersData: User[] = users;

        // Create car leaderboard entries with owner info
        const carEntries: CarLeaderboardEntry[] = carsData.map((car) => {
          const owner = usersData.find((user) => user.id === car.owner_id);
          return {
            car,
            owner: owner || { id: "", username: "", display_name: "Unknown" },
            totalLikes: car.total_likes,
            rank: 0,
          };
        });

        // Sort by total likes (descending) and assign ranks
        carEntries.sort((a, b) => b.totalLikes - a.totalLikes);
        carEntries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setCarLeaderboard(carEntries);
      } catch (error) {
        console.error("Failed to load car leaderboard data:", error);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading car rankings...</p>
      </div>
    );
  }

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
                    Owner: {entry.owner.display_name}
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
          <p className="text-muted-foreground">No car data found</p>
        </div>
      )}
    </div>
  );
}
