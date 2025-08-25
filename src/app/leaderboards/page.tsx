"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Heart, Users, Car } from "lucide-react";
import { users, cars, clubs, clubMembers } from "@/data";
import { Navigation } from "@/components/nav";
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

interface Club {
  id: string;
  name: string;
  banner_image_url: string;
  total_likes: number;
}

interface ClubMember {
  club_id: string;
  user_id: string;
  role: string;
}

interface LeaderboardEntry {
  user: User;
  totalLikes: number;
  clubName: string | null;
  rank: number;
}

interface ClubLeaderboardEntry {
  club: Club;
  totalLikes: number;
  memberCount: number;
  rank: number;
}

type TabType = "owners" | "clubs";

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("owners");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [clubLeaderboard, setClubLeaderboard] = useState<
    ClubLeaderboardEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadLeaderboardData() {
      try {
        // Use imported data directly
        const usersData: User[] = users;
        const carsData: Car[] = cars;
        const clubsData = clubs;
        const clubMembersData = clubMembers;

        // === OWNER LEADERBOARD ===
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

        // === CLUB LEADERBOARD ===
        // Calculate club member counts
        const clubMemberCounts = new Map<string, number>();
        clubMembersData.forEach((membership) => {
          const count = clubMemberCounts.get(membership.club_id) || 0;
          clubMemberCounts.set(membership.club_id, count + 1);
        });

        // Create club leaderboard entries
        const clubEntries: ClubLeaderboardEntry[] = clubsData.map((club) => ({
          club,
          totalLikes: club.total_likes,
          memberCount: clubMemberCounts.get(club.id) || 0,
          rank: 0,
        }));

        // Sort by total likes (descending) and assign ranks
        clubEntries.sort((a, b) => b.totalLikes - a.totalLikes);
        clubEntries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setClubLeaderboard(clubEntries);
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboardData();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Leaderboards</h1>
            <p className="text-muted-foreground">Loading rankings...</p>
          </div>
        </div>
      </>
    );
  }

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
                onClick={() => setActiveTab("owners")}
                className="flex items-center gap-2"
              >
                <Car className="h-4 w-4" />
                Owner Rankings
              </Button>
              <Button
                variant={activeTab === "clubs" ? "default" : "ghost"}
                onClick={() => setActiveTab("clubs")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Club Rankings
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-2 md:space-y-3">
          {activeTab === "owners"
            ? // Owner Leaderboard
              leaderboard.slice(0, 100).map((entry) => (
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
                          <p className="text-xs text-muted-foreground truncate">
                            {entry.clubName || "No Club"}
                          </p>
                        </div>

                        {/* Likes Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                            <Heart className="h-4 w-4 md:h-5 md:w-5 text-red-500 fill-red-500" />
                            <span className="text-lg md:text-2xl font-bold text-primary">
                              {entry.totalLikes.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            : // Club Leaderboard
              clubLeaderboard.slice(0, 100).map((entry) => (
                <Card
                  key={entry.club.id}
                  className="transition-all hover:shadow-lg"
                >
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

                      {/* Club Logo */}
                      <div className="relative h-14 w-14 md:h-20 md:w-20 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                        {entry.club.banner_image_url ? (
                          <Image
                            src={entry.club.banner_image_url}
                            alt={entry.club.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 112px, 160px"
                            quality={100}
                            priority={entry.rank <= 10}
                            unoptimized={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm md:text-xl font-medium">
                            {entry.club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Club Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                          <h3 className="font-semibold text-sm md:text-lg truncate">
                            {entry.club.name}
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
                        <p className="text-xs text-muted-foreground">
                          {entry.memberCount} member
                          {entry.memberCount !== 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Club Likes Score */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                          <Heart className="h-4 w-4 md:h-5 md:w-5 text-red-500 fill-red-500" />
                          <span className="text-lg md:text-2xl font-bold text-primary">
                            {entry.totalLikes.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {((activeTab === "owners" && leaderboard.length === 0) ||
          (activeTab === "clubs" && clubLeaderboard.length === 0)) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No data found</p>
          </div>
        )}
      </div>
    </>
  );
}
