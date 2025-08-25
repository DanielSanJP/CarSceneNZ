"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { users, cars } from "@/data";

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
  carCount: number;
  rank: number;
}

export default function LeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadLeaderboardData() {
      try {
        // Use imported data directly
        const usersData: User[] = users;
        const carsData: Car[] = cars;

        // Calculate likes per user
        const userLikes = new Map<string, number>();
        const userCarCounts = new Map<string, number>();

        // Initialize all users
        usersData.forEach((user) => {
          userLikes.set(user.id, 0);
          userCarCounts.set(user.id, 0);
        });

        // Count cars per user and their total likes
        carsData.forEach((car) => {
          const currentCount = userCarCounts.get(car.owner_id) || 0;
          userCarCounts.set(car.owner_id, currentCount + 1);

          const currentLikes = userLikes.get(car.owner_id) || 0;
          userLikes.set(car.owner_id, currentLikes + car.total_likes);
        });

        // Create leaderboard entries
        const entries: LeaderboardEntry[] = usersData.map((user) => ({
          user,
          totalLikes: userLikes.get(user.id) || 0,
          carCount: userCarCounts.get(user.id) || 0,
          rank: 0,
        }));

        // Sort by total likes (descending) and assign ranks
        entries.sort((a, b) => b.totalLikes - a.totalLikes);
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(entries);
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboardData();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
    if (rank === 2)
      return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
    if (rank === 3)
      return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
    return "bg-white border-gray-200";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-8">Leaderboards</h1>
          <p>Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🏆 Leaderboards</h1>
        <p className="text-gray-600 mb-6">
          Top car enthusiasts ranked by total likes on their vehicles
        </p>
        <div className="flex justify-center gap-4 text-sm text-gray-500">
          <span>Total Players: {leaderboard.length}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-2">
        {leaderboard.slice(0, 100).map((entry) => (
          <Card
            key={entry.user.id}
            className={`p-4 transition-all hover:shadow-md ${getRankStyle(
              entry.rank
            )}`}
          >
            <div className="flex items-center gap-4">
              {/* Rank Number */}
              <div className="flex items-center justify-center min-w-[60px]">
                {entry.rank <= 3 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-700">
                      {entry.rank}
                    </span>
                    {getRankIcon(entry.rank)}
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-gray-700">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* User Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={entry.user.profile_image_url}
                  alt={entry.user.display_name}
                />
                <AvatarFallback>
                  {entry.user.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate">
                    {entry.user.display_name}
                  </h3>
                  {entry.rank <= 10 && (
                    <Badge variant="secondary" className="text-xs">
                      Top {entry.rank <= 3 ? "3" : "10"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">@{entry.user.username}</p>
                <p className="text-xs text-gray-500">
                  {entry.carCount} car{entry.carCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Likes (Trophies equivalent) */}
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <span className="text-2xl font-bold text-amber-600">
                    {entry.totalLikes.toLocaleString()}
                  </span>
                  <span className="text-red-500 text-xl">❤️</span>
                </div>
                <p className="text-xs text-gray-500">Total Likes</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  );
}
