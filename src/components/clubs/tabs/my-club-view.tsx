"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Users, MapPin, Crown, Shield, Globe, Lock, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  club_type: "open" | "invite" | "closed";
  banner_image_url: string;
  leader_id: string;
  total_likes: number;
  created_at: string;
  leader?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

interface ClubMembership {
  club: Club;
  role: "leader" | "co-leader" | "member";
  joined_at: string;
  memberCount: number;
}

interface MyClubViewProps {
  // Updated to expect array of club memberships instead of single club
  userClubs: ClubMembership[];
}

export function MyClubView({ userClubs }: MyClubViewProps) {
  // Empty state - user is not in any clubs
  if (!userClubs || userClubs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            You&apos;re not in any clubs yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Join a club to connect with fellow car enthusiasts and share your
            passion!
          </p>
          <Link href="/clubs?tab=join">
            <Button size="lg">
              <Users className="h-4 w-4 mr-2" />
              Find Clubs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getClubTypeInfo = (type: string) => {
    switch (type) {
      case "open":
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Open",
          color: "bg-green-500",
        };
      case "invite":
        return {
          icon: <Shield className="h-4 w-4" />,
          text: "Invite Only",
          color: "bg-orange-500",
        };
      case "closed":
        return {
          icon: <Lock className="h-4 w-4" />,
          text: "Closed",
          color: "bg-red-500",
        };
      default:
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Unknown",
          color: "bg-gray-500",
        };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "leader":
        return <Crown className="h-4 w-4" />;
      case "co-leader":
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "leader":
        return "bg-yellow-500 text-white";
      case "co-leader":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Clubs</h1>
          <p className="text-muted-foreground mt-1">
            You&apos;re a member of {userClubs.length} club
            {userClubs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/clubs?tab=join">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Find More Clubs
          </Button>
        </Link>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userClubs.map((membership) => {
          const { club, role, memberCount } = membership;
          const typeInfo = getClubTypeInfo(club.club_type);

          return (
            <Link href={`/clubs/${club.id}?from=myclub`} key={club.id}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group py-0">
                {/* Banner Image */}
                <div className="relative aspect-square overflow-hidden">
                  {club.banner_image_url ? (
                    <Image
                      src={club.banner_image_url}
                      alt={`${club.name} banner`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Users className="h-12 w-12 text-primary opacity-50" />
                    </div>
                  )}

                  {/* Member count */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {memberCount}
                  </div>

                  {/* Club type badge */}
                  <div
                    className={`absolute top-3 left-3 ${typeInfo.color} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                  >
                    {typeInfo.icon}
                    {typeInfo.text}
                  </div>

                  {/* User role badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge
                      className={
                        getRoleBadge(role) + " flex items-center gap-1"
                      }
                    >
                      {getRoleIcon(role)}
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 pt-0">
                  {/* Club name and stats */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">
                        {club.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {club.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {club.total_likes}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {club.description}
                    </p>
                  </div>

                  {/* Leader info */}
                  {club.leader && (
                    <div className="text-xs text-muted-foreground mb-4">
                      Led by {club.leader.display_name || club.leader.username}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/clubs/${club.id}?from=myclub`;
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
