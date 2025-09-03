"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  MapPin,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  MoreVertical,
  Settings,
  Globe,
  Lock,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/utils/supabase/client";
import type { User } from "@/types/ddd";

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
  const user = useCurrentUser();
  const [isLeaving, setIsLeaving] = useState<string | null>(null); // Track which club is being left
  const [leaders, setLeaders] = useState<Record<string, User | null>>({}); // Store leader data by club ID

  // Client-side function to get user by ID
  const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        return null;
      }

      return {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name || profile.username,
        email: "",
        profile_image_url: profile.profile_image_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  };

  // Fetch leader data for all clubs
  useEffect(() => {
    const fetchLeaders = async () => {
      const leaderPromises = userClubs.map(async (membership) => {
        try {
          const leader = await getUserById(membership.club.leader_id);
          return { clubId: membership.club.id, leader };
        } catch (error) {
          console.error("Error fetching leader:", error);
          return { clubId: membership.club.id, leader: null };
        }
      });

      const leaderResults = await Promise.all(leaderPromises);
      const leaderMap: Record<string, User | null> = {};
      leaderResults.forEach(({ clubId, leader }) => {
        leaderMap[clubId] = leader;
      });
      setLeaders(leaderMap);
    };

    if (userClubs.length > 0) {
      fetchLeaders();
    }
  }, [userClubs]);

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

  const handleLeaveClub = async (
    clubId: string,
    clubName: string,
    isLeader: boolean
  ) => {
    if (!user) return;

    const confirmLeave = window.confirm(
      isLeader
        ? `Are you sure you want to leave "${clubName}"? As the leader, you'll need to transfer leadership or the club will be disbanded.`
        : `Are you sure you want to leave "${clubName}"?`
    );

    if (!confirmLeave) return;

    setIsLeaving(clubId);
    try {
      // In a real app, this would be an API call
      console.log("Leaving club:", clubId);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, just refresh the page or redirect
      window.location.reload();
    } catch (error) {
      console.error("Error leaving club:", error);
      alert("Failed to leave club. Please try again.");
    } finally {
      setIsLeaving(null);
    }
  };

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
          const isClubLeader = role === "leader";
          const canManage = role === "leader";
          const canManageMembers = role === "leader" || role === "co-leader";

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
                  {leaders[membership.club.id] ? (
                    <div className="text-xs text-muted-foreground mb-4">
                      Led by {leaders[membership.club.id]?.display_name}
                    </div>
                  ) : null}

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
                    {canManageMembers && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManage && (
                            <DropdownMenuItem asChild>
                              <Link href={`/clubs/edit/${club.id}?from=myclub`}>
                                <Settings className="h-4 w-4 mr-2" />
                                Club Settings
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Members
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              handleLeaveClub(club.id, club.name, isClubLeader)
                            }
                            disabled={isLeaving === club.id}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            {isLeaving === club.id
                              ? "Leaving..."
                              : "Leave Club"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {!canManageMembers && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLeaveClub(club.id, club.name, false);
                        }}
                        disabled={isLeaving === club.id}
                      >
                        {isLeaving === club.id ? (
                          "Leaving..."
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Add new club card */}
      <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Join Another Club</h3>
            <p className="text-muted-foreground mb-4">
              Discover more communities and expand your network
            </p>
            <Link href="/clubs?tab=join">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Browse Clubs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
