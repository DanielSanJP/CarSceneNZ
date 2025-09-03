"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { OwnerRanking } from "@/types/leaderboard";

interface OwnerRankingsProps {
  data: OwnerRanking[];
}

export function OwnerRankings({ data }: OwnerRankingsProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🏆 Top Car Owners</h2>
        <p className="text-muted-foreground">
          Ranked by total likes across all their cars
        </p>
      </div>

      {data.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No rankings yet</h3>
            <p className="text-muted-foreground">
              Be the first to get likes on your cars!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {data.slice(0, 100).map((entry, index) => {
            const rank = index + 1;
            return (
              <Link
                key={entry.owner.id}
                href={`/profile/${entry.owner.username}`}
                className="block"
              >
                <Card className="transition-all hover:shadow-lg cursor-pointer">
                  <CardContent className="px-2 md:px-4">
                    <div className="flex items-center gap-2 md:gap-4">
                      {/* Rank Number */}
                      <div className="flex items-center justify-center min-w-[40px] md:min-w-[60px]">
                        <div className="flex items-center gap-1">
                          <span className="text-lg md:text-2xl font-bold">
                            {rank}
                          </span>
                          {getRankIcon(rank)}
                        </div>
                      </div>

                      {/* User Avatar */}
                      <div className="relative h-14 w-14 md:h-20 md:w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        {entry.owner.profile_image_url ? (
                          <Image
                            src={entry.owner.profile_image_url}
                            alt={entry.owner.username}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 112px, 160px"
                            quality={100}
                            priority={rank <= 10}
                            unoptimized={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm md:text-xl font-medium">
                            {(entry.owner.display_name || entry.owner.username)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                          <h3 className="font-semibold text-sm md:text-lg truncate">
                            {entry.owner.display_name || entry.owner.username}
                          </h3>
                          {rank <= 10 && (
                            <Badge
                              variant="secondary"
                              className="text-xs hidden sm:inline"
                            >
                              Top {rank <= 3 ? "3" : "10"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          @{entry.owner.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.carCount}{" "}
                          {entry.carCount === 1 ? "car" : "cars"}
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
            );
          })}
        </div>
      )}

      {data.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">
            No owner rankings yet
          </h4>
          <p className="text-muted-foreground mb-4">
            Share your car and start earning likes to appear on the leaderboard!
          </p>
          <Link href="/garage/create">
            <Button>Add Your Car</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
