"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
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
  Calendar,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getClubById } from "@/data";
import { getAllCars } from "@/data";

// Helper function to calculate total likes for a user's cars
const getUserTotalLikes = async (userId: string): Promise<number> => {
  const allCars = await getAllCars();
  return allCars
    .filter((car) => car.owner_id === userId)
    .reduce((total, car) => total + (car.total_likes || 0), 0);
};

interface ClubWithMembers {
  id: string;
  name: string;
  description: string;
  location: string;
  club_type: "open" | "invite" | "closed";
  banner_image_url: string;
  leader_id: string;
  total_likes: number;
  created_at: string;
  members: Array<{
    user_id: string;
    role: "leader" | "co-leader" | "member";
    joined_at: string;
    user: {
      id: string;
      username: string;
      display_name: string;
      profile_image_url: string;
    };
  }>;
}

function ClubDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isAuthenticated } = useAuth();
  const clubId = params.id as string;
  const fromTab = searchParams.get("from") || "join";
  const leaderboardTab = searchParams.get("tab") || "clubs";

  const [club, setClub] = useState<ClubWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const loadClubData = async () => {
      try {
        setIsLoading(true);

        // Get club details
        const foundClub = await getClubById(clubId);
        if (!foundClub) {
          setIsLoading(false);
          return;
        }

        // For now, we'll set the club without members
        // TODO: Implement member fetching when the function becomes available
        setClub({
          id: foundClub.id,
          name: foundClub.name,
          description: foundClub.description || "",
          location: foundClub.location || "",
          club_type: foundClub.club_type as "open" | "invite" | "closed",
          banner_image_url: foundClub.banner_image_url || "",
          leader_id: foundClub.leader_id,
          total_likes: foundClub.total_likes || 0,
          created_at: foundClub.created_at,
          members: [], // Initialize with empty array for now
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading club data:", error);
        setIsLoading(false);
      }
    };

    loadClubData();
  }, [clubId]);

  const isMember = club?.members.some((m) => m.user_id === user?.id);
  const isLeader = club?.members.some(
    (m) => m.user_id === user?.id && m.role === "leader"
  );
  const isCoLeader = club?.members.some(
    (m) => m.user_id === user?.id && m.role === "co-leader"
  );
  const canManage = isLeader;
  const canManageMembers = isLeader || isCoLeader;

  const memberCount = club?.members.length || 0;

  const handleJoinClub = async () => {
    if (!isAuthenticated || !user || !club) return;

    setIsJoining(true);
    try {
      // In a real app, this would be an API call
      console.log("Joining club:", club.id);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add member to local state (in real app, this would be handled by the API)
      const newMember = {
        user_id: user.id,
        role: "member" as const,
        joined_at: new Date().toISOString(),
        user: {
          id: user.id,
          username: profile?.username || user.email || "",
          display_name:
            profile?.display_name || profile?.username || user.email || "",
          profile_image_url: profile?.profile_image_url || "",
        },
      };

      setClub((prev) =>
        prev
          ? {
              ...prev,
              members: [...prev.members, newMember],
            }
          : null
      );
    } catch (error) {
      console.error("Error joining club:", error);
      alert("Failed to join club. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!isAuthenticated || !user || !club) return;

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
        // If leader is leaving, redirect to clubs page (club would be disbanded or leadership transferred)
        router.push("/clubs");
      } else {
        // Remove member from local state
        setClub((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m.user_id !== user.id),
              }
            : null
        );
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
        };
      case "invite":
        return {
          icon: <Shield className="h-4 w-4" />,
          text: "Invite Only",
          description: "Members must be invited",
        };
      case "closed":
        return {
          icon: <Lock className="h-4 w-4" />,
          text: "Closed",
          description: "Not accepting new members",
        };
      default:
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Unknown",
          description: "",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading club...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Club Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The club you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Link
              href={
                fromTab === "leaderboard"
                  ? `/leaderboards?tab=${leaderboardTab}`
                  : `/clubs?tab=${fromTab}`
              }
            >
              <Button>
                Back to {fromTab === "leaderboard" ? "Leaderboards" : "Clubs"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = getClubTypeInfo(club.club_type);
  const canJoin = isAuthenticated && !isMember && club.club_type === "open";

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
                  {club.total_likes}
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
                  {club.banner_image_url ? (
                    <div className="relative w-full aspect-square lg:aspect-[4/3] overflow-hidden rounded-lg">
                      <Image
                        src={club.banner_image_url}
                        alt={`${club.name} banner`}
                        fill
                        className="object-cover"
                        quality={100}
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      {club.description}
                    </p>
                    {canManage && (
                      <div className="pt-2">
                        <Link href={`/clubs/edit/${club.id}`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Club
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
                      <span className="font-semibold">{club.total_likes}</span>
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
                        {new Date(club.created_at).toLocaleDateString("en-NZ", {
                          year: "numeric",
                          month: "short",
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
              <div className="flex justify-end px-4 py-0">
                {isMember ? (
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
                ) : canJoin ? (
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
                ) : !isAuthenticated ? (
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
                ) : club.club_type === "invite" ? (
                  <Button disabled size="lg">
                    <Shield className="h-4 w-4 mr-2" />
                    Invite Only
                  </Button>
                ) : null}
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
                {canManage && (
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memberCount > 0 ? (
                <div className="space-y-3">
                  {club.members.map((member, index) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Rank Number */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <Link href={`/profile/${member.user.username}`}>
                        <Avatar className="h-12 w-12 cursor-pointer border-2 border-muted">
                          <AvatarImage src={member.user.profile_image_url} />
                          <AvatarFallback className="text-lg font-semibold">
                            {member.user.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${member.user.username}`}>
                          <div className="font-medium hover:underline cursor-pointer">
                            {member.user.display_name}
                          </div>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          @{member.user.username}
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <Badge
                          variant="secondary"
                          className={`${getRoleBadgeColor(
                            member.role
                          )} font-medium`}
                        >
                          {member.role === "leader"
                            ? "Leader"
                            : member.role === "co-leader"
                            ? "Co-Leader"
                            : "Member"}
                        </Badge>
                      </div>

                      {/* Total Likes */}
                      <div className="text-sm text-muted-foreground hidden md:block">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {getUserTotalLikes(member.user_id)}
                        </div>
                      </div>

                      {/* Actions */}
                      {canManageMembers &&
                        member.role !== "leader" &&
                        member.user_id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canManage && member.role === "co-leader" && (
                                <>
                                  <DropdownMenuItem className="text-orange-600">
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Demote to Member
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {canManage && member.role === "member" && (
                                <>
                                  <DropdownMenuItem>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Promote to Co-Leader
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem className="text-red-600">
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

export default function ClubDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading Club...</h1>
            </div>
          </div>
        </div>
      }
    >
      <ClubDetailPageContent />
    </Suspense>
  );
}
