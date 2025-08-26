"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
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
  Heart,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

interface MyClubViewProps {
  club: ClubWithMembers | null;
}

export function MyClubView({ club }: MyClubViewProps) {
  const { user, isAuthenticated } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);

  if (!club) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">You&apos;re not in a club</h3>
        <p className="text-muted-foreground">
          Join a club to connect with fellow car enthusiasts!
        </p>
      </div>
    );
  }

  const isLeader = club?.members.some(
    (m) => m.user_id === user?.id && m.role === "leader"
  );
  const isCoLeader = club?.members.some(
    (m) => m.user_id === user?.id && m.role === "co-leader"
  );
  const canManage = isLeader || isCoLeader;

  const memberCount = club?.members.length || 0;
  const maxMembers = 50;

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

      // For now, just refresh the page or redirect
      window.location.reload();
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

  const typeInfo = getClubTypeInfo(club.club_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{club.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {club.location}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {memberCount}/{maxMembers}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {club.total_likes}
            </div>
          </div>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Club Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Transfer Leadership
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Club Info Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
            {/* Column 1: Banner Image */}
            <div className="relative">
              {club.banner_image_url ? (
                <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={club.banner_image_url}
                    alt={`${club.name} banner`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center rounded-lg">
                  <Users className="h-16 w-16 text-primary opacity-50" />
                </div>
              )}
            </div>

            {/* Column 2: Club Name and Description */}
            <div className="space-y-4 md:col-span-1 lg:col-span-1">
              <div>
                <h2 className="text-2xl font-bold mb-2">{club.name}</h2>
                <p className="text-sm text-muted-foreground mb-3">#{club.id}</p>
              </div>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {club.description}
                </p>
              </div>
            </div>

            {/* Column 3: Stats List */}
            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold">Club Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    Likes
                  </div>
                  <span className="font-semibold">{club.total_likes}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <span className="font-semibold">{club.location}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {typeInfo.icon}
                    Type
                  </div>
                  <span className="font-semibold">{typeInfo.text}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Created
                  </div>
                  <span className="font-semibold">
                    {new Date(club.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Members
                  </div>
                  <span className="font-semibold">
                    {memberCount}/{maxMembers}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Card>
        <CardContent className="px-2">
          <div className="flex justify-end px-4 py-0">
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
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({memberCount}/50)
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
                  <Link href={`/profile/${member.user_id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.profile_image_url} />
                      <AvatarFallback>
                        {member.user.display_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${member.user_id}`}>
                      <p className="font-medium hover:underline">
                        {member.user.display_name}
                      </p>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      @{member.user.username}
                    </p>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}
                    </Badge>
                  </div>

                  {/* Join Date */}
                  <div className="text-sm text-muted-foreground hidden md:block">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  {canManage &&
                    member.role !== "leader" &&
                    member.user_id !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Promote to Co-Leader
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Remove from Club
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
  );
}
