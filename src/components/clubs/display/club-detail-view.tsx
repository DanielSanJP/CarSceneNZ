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
  Mail,
} from "lucide-react";
import type { Club, ClubMember } from "@/types/club";
import type { User } from "@/types/user";
import { SendClubMail } from "@/components/inbox/send-club-mail";
import { RequestToJoin } from "@/components/inbox/request-to-join";
import type { ClubMailData } from "@/types/inbox";

interface ClubDetailViewProps {
  club: Club;
  members: (ClubMember & {
    total_cars: number;
    total_likes: number;
    most_liked_car_brand?: string;
    most_liked_car_model?: string;
    most_liked_car_likes: number;
  })[];
  memberCount: number;
  currentUser: User | null;
  isUserMember: boolean;
  userRole?: string;
  fromTab?: string;
  leaderboardTab?: string;
  sendClubMailAction: (
    mailData: ClubMailData
  ) => Promise<{ success: boolean; error?: string }>;
  joinClubAction: (
    clubId: string,
    userId: string
  ) => Promise<{ success: boolean; message?: string }>;
  leaveClubAction: (
    clubId: string,
    userId: string
  ) => Promise<{ success: boolean; message?: string }>;
  sendClubJoinRequestAction: (
    clubId: string,
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  sendClubMailAction,
  joinClubAction,
  leaveClubAction,
  sendClubJoinRequestAction,
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
      // Join immediately for public clubs (invite-only clubs use RequestToJoin component)
      const result = await joinClubAction(club.id, currentUser.id);

      if (result.success) {
        // Reload page to reflect changes
        window.location.reload();
      } else {
        alert(result.message || "Failed to join club");
      }
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
      const result = await leaveClubAction(club.id, currentUser.id);

      if (result.success) {
        if (isLeader) {
          // If leader is leaving, redirect to clubs page
          window.location.href = "/clubs";
        } else {
          // Reload page to reflect changes
          window.location.reload();
        }
      } else {
        alert(result.message || "Failed to leave club");
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
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{club.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {club.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {memberCount} members
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  {club.total_likes || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Club Info Card - Three Column Layout */}
          <Card className="overflow-hidden mb-8">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
                {/* Column 1: Banner Image */}
                <div className="relative">
                  {club.banner_image_url && !imageError ? (
                    <div className="relative w-full aspect-square lg:aspect-[4/3] overflow-hidden rounded-lg">
                      <Image
                        src={club.banner_image_url}
                        alt={`${club.name} banner`}
                        fill
                        className="object-cover"
                        quality={100}
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImageError(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square lg:aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center rounded-lg">
                      <Users className="h-16 w-16 text-primary opacity-50" />
                    </div>
                  )}
                </div>

                {/* Column 2: Club Name and Description */}
                <div className="space-y-4 md:col-span-1 lg:col-span-1">
                  {/* Club Name */}
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
                    <p className="text-sm text-muted-foreground mb-3">
                      #{club.id}
                    </p>
                  </div>
                  {/* About This Club */}
                  <div className="space-y-3">
                    <p className="text-muted-foreground leading-relaxed">
                      {club.description || "No description available."}
                    </p>
                    {canManage && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Link href={`/clubs/edit/${club.id}?from=${fromTab}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Club
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Stats List */}
                <div className="space-y-4 md:col-span-2 lg:col-span-1">
                  <h3 className="text-lg font-semibold">Club Stats</h3>
                  <div className="space-y-3">
                    {/* Likes */}
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span>Total Likes</span>
                      </div>
                      <span className="font-semibold">
                        {club.total_likes || 0}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Location</span>
                      </div>
                      <span className="font-semibold">{club.location}</span>
                    </div>

                    {/* Type */}
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {typeInfo.icon}
                        <span>Type</span>
                      </div>
                      <span className="font-semibold">{typeInfo.text}</span>
                    </div>

                    {/* Created */}
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Created</span>
                      </div>
                      <span className="font-semibold">
                        {new Date(club.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Members */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Members</span>
                      </div>
                      <span className="font-semibold text-primary">
                        {memberCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button Card */}
          <Card className="mb-8">
            <CardContent className="px-2">
              <div className="flex justify-between items-center px-4 py-0">
                {/* Left side - Send Club Mail for leaders */}
                <div>
                  {canManage && (
                    <SendClubMail
                      clubId={club.id}
                      clubName={club.name}
                      currentUserId={currentUser?.id || ""}
                      sendClubMailAction={sendClubMailAction}
                      trigger={
                        <Button size="lg">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Club Mail
                        </Button>
                      }
                    />
                  )}
                </div>

                {/* Right side - Join/Leave buttons */}
                <div>
                  {isUserMember ? (
                    <Button
                      variant="destructive"
                      onClick={handleLeaveClub}
                      disabled={isLeaving}
                      size="lg"
                    >
                      {isLeaving ? (
                        "Leaving..."
                      ) : (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Leave Club
                        </>
                      )}
                    </Button>
                  ) : !currentUser ? (
                    <Link href="/login">
                      <Button size="lg">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign In to Join
                      </Button>
                    </Link>
                  ) : club.club_type === "closed" ? (
                    <Button disabled size="lg">
                      <Lock className="h-4 w-4 mr-2" />
                      Closed
                    </Button>
                  ) : club.club_type === "open" ? (
                    <Button
                      onClick={handleJoinClub}
                      disabled={isJoining}
                      size="lg"
                    >
                      {isJoining ? (
                        "Joining..."
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Club
                        </>
                      )}
                    </Button>
                  ) : club.club_type === "invite" || club.is_invite_only ? (
                    <RequestToJoin
                      clubId={club.id}
                      clubName={club.name}
                      sendClubJoinRequestAction={sendClubJoinRequestAction}
                      trigger={
                        <Button size="lg">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Club
                        </Button>
                      }
                    />
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members List - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({memberCount})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memberCount > 0 ? (
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Rank Number */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium">
                        {index + 1}.
                      </div>

                      {/* Avatar */}
                      <Link href={`/profile/${member.user?.username}`}>
                        <Avatar className="h-12 w-12 cursor-pointer border-2 border-muted">
                          {member.user?.profile_image_url && (
                            <AvatarImage src={member.user.profile_image_url} />
                          )}
                          <AvatarFallback>
                            {member.user?.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${member.user?.username}`}>
                          <p className="font-medium hover:underline cursor-pointer">
                            {member.user?.display_name || member.user?.username}
                          </p>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          @{member.user?.username}
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="flex items-center gap-2 capitalize">
                        {getRoleIcon(member.role || "member")}
                        <Badge
                          className={`text-xs ${getRoleBadgeColor(
                            member.role || "member"
                          )}`}
                        >
                          {member.role || "member"}
                        </Badge>
                      </div>

                      {/* Total Likes */}
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                          <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-lg md:text-2xl font-bold text-primary">
                            {member.total_likes}
                          </span>
                        </div>
                      </div>

                      {/* Actions - placeholder for future member management */}
                      {(canManage || canManageMembers) &&
                        member.role !== "leader" &&
                        member.user_id !== currentUser?.id && (
                          <div className="text-xs text-muted-foreground">
                            {/* Future: Member management dropdown */}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                  <p>Be the first to join this club!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
