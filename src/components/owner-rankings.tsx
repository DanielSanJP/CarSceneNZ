"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { users, cars, clubs, clubMembers } from "@/data";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  username: string;
  display_name: string;
  profile_image_url: string;
}

interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  total_likes: number;
}

interface LeaderboardEntry {
  user: User;
  totalLikes: number;
  clubName: string | null;
  rank: number;
}

export function OwnerRankings() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadOwnerLeaderboard() {
      try {
        // Use imported data directly
        const usersData: User[] = users;
        const carsData: Car[] = cars;
        const clubsData = clubs;
        const clubMembersData = clubMembers;

        // Calculate likes per user
        const userLikes = new Map<string, number>();
        const userClubs = new Map<string, string>();

        // Initialize all users
        usersData.forEach((user) => {
          userLikes.set(user.id, 0);
        });

        // Map users to their clubs
        clubMembersData.forEach((membership) => {
          const club = clubsData.find((c) => c.id === membership.club_id);
          if (club) {
            userClubs.set(membership.user_id, club.name);
          }
        });

        // Count total likes per user
        carsData.forEach((car) => {
          const currentLikes = userLikes.get(car.owner_id) || 0;
          userLikes.set(car.owner_id, currentLikes + car.total_likes);
        });

        // Create owner leaderboard entries
        const ownerEntries: LeaderboardEntry[] = usersData.map((user) => ({
          user,
          totalLikes: userLikes.get(user.id) || 0,
          clubName: userClubs.get(user.id) || null,
          rank: 0,
        }));

        // Sort by total likes (descending) and assign ranks
        ownerEntries.sort((a, b) => b.totalLikes - a.totalLikes);
        ownerEntries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(ownerEntries);
      } catch (error) {
        console.error("Failed to load owner leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOwnerLeaderboard();
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
        <p className="text-muted-foreground">Loading owner rankings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {leaderboard.slice(0, 100).map((entry) => (
        <Link
          key={entry.user.id}
          href={`/profile/${entry.user.username}`}
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

                {/* User Avatar */}
                <div className="relative h-14 w-14 md:h-20 md:w-20 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                  {entry.user.profile_image_url ? (
                    <Image
                      src={entry.user.profile_image_url}
                      alt={entry.user.display_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 112px, 160px"
                      quality={100}
                      priority={entry.rank <= 10}
                      unoptimized={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm md:text-xl font-medium">
                      {entry.user.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                    <h3 className="font-semibold text-sm md:text-lg truncate">
                      {entry.user.display_name}
                    </h3>
                    {entry.rank <= 10 && (
                      <Badge
                        variant="secondary"
                        className="text-xs hidden sm:inline"
                      >
                        Top {entry.rank <= 3 ? "3" : "10"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    @{entry.user.username}
                  </p>
                </div>

                {/* Likes Score */}
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

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No owner data found</p>
        </div>
      )}
    </div>
  );
}
