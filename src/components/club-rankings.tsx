"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { clubs, clubMembers } from "@/data";
import Link from "next/link";
import Image from "next/image";

interface Club {
  id: string;
  name: string;
  banner_image_url: string;
  total_likes: number;
}

interface ClubLeaderboardEntry {
  club: Club;
  totalLikes: number;
  memberCount: number;
  rank: number;
}

export function ClubRankings() {
  const [clubLeaderboard, setClubLeaderboard] = useState<
    ClubLeaderboardEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadClubLeaderboard() {
      try {
        // Use imported data directly
        const clubsData = clubs;
        const clubMembersData = clubMembers;

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
        console.error("Failed to load club leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadClubLeaderboard();
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
        <p className="text-muted-foreground">Loading club rankings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {clubLeaderboard.slice(0, 100).map((entry) => (
        <Link
          key={entry.club.id}
          href={`/clubs/${entry.club.id}?from=leaderboard&tab=clubs`}
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
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.memberCount} member
                    {entry.memberCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Club Likes Score */}
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

      {clubLeaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No club data found</p>
        </div>
      )}
    </div>
  );
}
