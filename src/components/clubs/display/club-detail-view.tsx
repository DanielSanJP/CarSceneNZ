"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  MapPin,
  Calendar,
  Star,
  Crown,
  Shield,
  Globe,
  Lock,
  ArrowLeft,
  Edit,
  UserPlus,
  UserMinus,
  Settings,
} from "lucide-react";
import type { Club, ClubMember } from "@/types/club";
import type { User } from "@/types/user";

interface ClubDetailViewProps {
  club: Club;
  members: ClubMember[];
  memberCount: number;
  currentUser: User | null;
  isUserMember: boolean;
  userRole?: string;
  fromTab?: string;
  leaderboardTab?: string;
}

export function ClubDetailView({
  club,
  members,
  memberCount,
  currentUser,
  isUserMember,
  userRole,
  fromTab = "join",
  leaderboardTab = "clubs",
}: ClubDetailViewProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isLeader = userRole === "leader";
  const isCoLeader = userRole === "co-leader";
  const canManage = isLeader;
  const canManageMembers = isLeader || isCoLeader;

  const handleJoinClub = async () => {
    if (!currentUser || !club) return;

    setIsJoining(true);
    try {
      // In a real app, this would be an API call
      console.log("Joining club:", club.id);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error joining club:", error);
      alert("Failed to join club. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!currentUser || !club) return;

    const confirmLeave = window.confirm(
      isLeader
        ? "Are you sure you want to leave? As the leader, you'll need to transfer leadership or the club will be disbanded."
        : "Are you sure you want to leave this club?"
    );

    if (!confirmLeave) return;

    setIsLeaving(true);
    try {
      // In a real app, this would be an API call
      console.log("Leaving club:", club.id);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isLeader) {
        // If leader is leaving, redirect to clubs page
        window.location.href = "/clubs";
      } else {
        // Reload page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      console.error("Error leaving club:", error);
      alert("Failed to leave club. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  const getClubTypeInfo = (type: string) => {
    switch (type) {
      case "open":
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Open",
          description: "Anyone can join",
          color: "bg-green-500",
        };
      case "invite":
        return {
          icon: <Shield className="h-4 w-4" />,
          text: "Invite Only",
          description: "Members must be invited",
          color: "bg-orange-500",
        };
      case "closed":
        return {
          icon: <Lock className="h-4 w-4" />,
          text: "Closed",
          description: "Not accepting new members",
          color: "bg-red-500",
        };
      default:
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Unknown",
          description: "",
          color: "bg-gray-500",
        };
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "leader":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "co-leader":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "leader":
        return "bg-yellow-500 text-white";
      case "co-leader":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const typeInfo = getClubTypeInfo(club.club_type || "open");
  const canJoin = currentUser && !isUserMember && club.club_type === "open";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={
                fromTab === "leaderboard"
                  ? `/leaderboards?tab=${leaderboardTab}`
                  : `/clubs?tab=${fromTab}`
              }
            >
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{club.name}</h1>
              <p className="text-muted-foreground mt-1">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </p>
            </div>
            {canManage && (
              <Link href={`/clubs/edit/${club.id}?from=${fromTab}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Club
                </Button>
              </Link>
            )}
          </div>

          {/* Club Info Card - Three Column Layout */}
          <Card className="overflow-hidden mb-8">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - Club Image */}
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    {imageError ? (
                      <div className="h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <Users className="h-16 w-16 text-primary opacity-50" />
                      </div>
                    ) : (
                      <Image
                        src={club.banner_image_url || "/clubs/default-club.jpg"}
                        alt={club.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        onError={() => setImageError(true)}
                      />
                    )}
                  </div>
                </div>

                {/* Middle Column - Club Details */}
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {club.location}
                        </span>
                      </div>
                      <Badge className={`${typeInfo.color} text-white`}>
                        {typeInfo.icon}
                        <span className="ml-1">{typeInfo.text}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">
                          {club.total_likes}
                        </span>
                      </div>
                    </div>

                    <p className="text-muted-foreground">
                      {club.description || "No description available."}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Created {new Date(club.created_at).toLocaleDateString()}
                    </div>

                    {/* Leader Info */}
                    {club.leader && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={club.leader.profile_image_url} />
                          <AvatarFallback>
                            {club.leader.display_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {club.leader.display_name}
                            </p>
                            <Crown className="h-4 w-4 text-yellow-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Club Leader
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex justify-center">
                {!currentUser ? (
                  <Link href="/login">
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Login to Join
                    </Button>
                  </Link>
                ) : canJoin ? (
                  <Button onClick={handleJoinClub} disabled={isJoining}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isJoining ? "Joining..." : "Join Club"}
                  </Button>
                ) : isUserMember ? (
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-sm px-3 py-2">
                      <Users className="h-4 w-4 mr-2" />
                      You are a member
                    </Badge>
                    {canManageMembers && (
                      <Link href={`/clubs/edit/${club.id}?from=${fromTab}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Club
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleLeaveClub}
                      disabled={isLeaving}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      {isLeaving ? "Leaving..." : "Leave Club"}
                    </Button>
                  </div>
                ) : club.club_type === "invite" ? (
                  <Button variant="outline" disabled>
                    <Shield className="h-4 w-4 mr-2" />
                    Invite Only
                  </Button>
                ) : club.club_type === "closed" ? (
                  <Button variant="outline" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Closed Club
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    <Users className="h-4 w-4 mr-2" />
                    View Only
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({memberCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user?.profile_image_url} />
                        <AvatarFallback>
                          {member.user?.username?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {member.user?.username}
                          </p>
                          {getRoleIcon(member.role || "member")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-xs ${getRoleBadgeColor(
                              member.role || "member"
                            )}`}
                          >
                            {member.role || "member"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
