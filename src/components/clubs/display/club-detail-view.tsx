"use client";

import { useState, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { manageMemberAction } from "@/lib/actions/club-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  MapPin,
  Star,
  Shield,
  Globe,
  Lock,
  ArrowLeft,
  Settings,
  UserPlus,
  UserMinus,
  Mail,
  UserCheck,
  UserX,
  User as UserIcon,
} from "lucide-react";
import type { User } from "@/types/user";
import { SendClubMail } from "@/components/clubs/send-club-mail";
import { RequestToJoin } from "@/components/clubs/request-to-join";
import type { ClubMailData } from "@/types/inbox";
import type { ClubDetailData } from "@/types/club";
import { joinClubAction, leaveClubAction } from "@/lib/actions/club-actions";

interface ClubDetailViewProps {
  currentUser: User | null;
  fromTab?: string;
  leaderboardTab?: string;
  clubDetailData: ClubDetailData;
}

export const ClubDetailView = memo(function ClubDetailView({
  currentUser,
  fromTab = "join",
  leaderboardTab = "clubs",
  clubDetailData,
}: ClubDetailViewProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [managingMemberId, setManagingMemberId] = useState<string | null>(null);
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [memberToKick, setMemberToKick] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Use data directly from props (no React Query)
  const clubData = clubDetailData;

  // Extract club data
  const { club, members, memberCount } = clubData;

  // Find user's membership status
  const userMembership = members.find(
    (member) => member.user.id === currentUser?.id
  );
  const isUserMember = !!userMembership;
  const userRole = userMembership?.role;

  const isLeader = userRole === "leader";
  const canManage = isLeader;

  const handleJoinClub = async () => {
    if (!currentUser || !club) return;

    setIsJoining(true);
    try {
      // Use Server Action for immediate cache invalidation
      const result = await joinClubAction(club.id, currentUser.id);

      if (result.success) {
        // Server Action automatically invalidates both Data Cache and Router Cache
        toast.success("Successfully joined the club!");
      } else {
        toast.error(result.message || "Failed to join club");
      }
    } catch (error) {
      console.error("Error joining club:", error);
      toast.error("Failed to join club. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!currentUser || !club) return;

    setIsLeaving(true);
    try {
      // Use Server Action for immediate cache invalidation
      const result = await leaveClubAction(club.id, currentUser.id);

      if (result.success) {
        // Server Action automatically invalidates both Data Cache and Router Cache
        toast.success("Successfully left the club");
      } else {
        toast.error(result.message || "Failed to leave club");
      }
    } catch (error) {
      console.error("Error leaving club:", error);
      toast.error("Failed to leave club. Please try again.");
    } finally {
      setIsLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  // API-based club mail function
  const sendClubMailAction = async (
    mailData: ClubMailData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/clubs/mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mailData),
      });

      return await response.json();
    } catch (error) {
      console.error("Error sending club mail:", error);
      return { success: false, error: "Failed to send club mail" };
    }
  };

  // API-based join request function
  const sendClubJoinRequestAction = async (
    clubId: string,
    message?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/clubs/join-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clubId, message }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error sending join request:", error);
      return { success: false, error: "Failed to send join request" };
    }
  };

  // Member management actions
  const handleMemberAction = async (
    action: "promote" | "demote" | "kick",
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setManagingMemberId(targetUserId);

    try {
      const result = await manageMemberAction(club.id, targetUserId, action);

      if (result.success) {
        // Successfully managed member - Server Action already revalidated the cache
        if (action === "kick") {
          toast.success("Member removed from club");
        } else if (action === "promote") {
          toast.success("Member promoted successfully");
        } else if (action === "demote") {
          toast.success("Member demoted successfully");
        }
      } else {
        toast.error(result.error || "Failed to manage member");
      }

      return result;
    } catch (error) {
      console.error("Error managing member:", error);
      return { success: false, error: "Failed to manage member" };
    } finally {
      setManagingMemberId(null);
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

  const typeInfo = getClubTypeInfo(club.club_type || "open");

  return (
    <>
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
        <CardContent className="py-2">
          <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-2">
            {/* Column 1: Banner Image */}
            <div className="relative col-span-1 space-y-3">
              {club.banner_image_url && !imageError ? (
                <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={club.banner_image_url}
                    alt={`${club.name} banner`}
                    fill
                    className="object-cover"
                    quality={75}
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center rounded-lg">
                  <Users className="h-16 w-16 text-primary opacity-50" />
                </div>
              )}
              {/* Total Likes */}
              <div className="flex items-center justify-center gap-2 py-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-lg">
                  {club.total_likes || 0}
                </span>
              </div>
            </div>

            {/* Column 2: Club Name and Description */}
            <div className="space-y-4 col-span-1 md:col-span-1 lg:col-span-1">
              {/* Club Name */}
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
                  {club.name}
                </h1>
                <p className="text-sm text-muted-foreground mb-3">#{club.id}</p>
              </div>
              {/* About This Club */}
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {club.description || "No description available."}
                </p>
              </div>
            </div>

            {/* Column 3: Stats List - Only visible on desktop */}
            <div className="space-y-4 hidden lg:block lg:col-span-1">
              <h3 className="text-lg font-semibold">Club Stats</h3>
              <div className="space-y-3">
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

          {/* Mobile Stats Section - Full Width Below Grid */}
          <div className="mt-6 lg:hidden">
            <h3 className="text-lg font-semibold mb-4">Club Stats</h3>
            <div className="flex flex-wrap gap-2">
              {/* Location */}
              <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg flex-1 min-w-0">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">Location</span>
                </div>
                <span className="font-semibold text-base text-center truncate w-full">
                  {club.location}
                </span>
              </div>

              {/* Type */}
              <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg flex-1 min-w-0">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-lg">{typeInfo.icon}</span>
                  <span className="text-xs">Type</span>
                </div>
                <span className="font-semibold text-base text-center truncate w-full">
                  {typeInfo.text}
                </span>
              </div>

              {/* Members */}
              <div className="flex flex-col items-center gap-1 px-2 py-2 bg-muted/50 rounded-lg flex-1 min-w-0">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">Members</span>
                </div>
                <span className="font-semibold text-base text-primary">
                  {memberCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button Card */}
      <Card className="mb-8">
        <CardContent className="">
          <div className="flex flex-wrap justify-between py-0 gap-2">
            {/* Left side - Edit Club and Send Club Mail for leaders */}
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Link href={`/clubs/edit/${club.id}?from=${fromTab}`}>
                  <Button variant="outline" size="lg">
                    <Settings className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Edit</span>
                  </Button>
                </Link>
              )}
              {canManage && (
                <SendClubMail
                  clubId={club.id}
                  clubName={club.name}
                  currentUserId={currentUser?.id || ""}
                  sendClubMailAction={sendClubMailAction}
                  trigger={
                    <Button size="lg">
                      <Mail className="h-4 w-4 mr-2" />
                      Mail
                    </Button>
                  }
                />
              )}
            </div>

            {/* Right side - Join/Leave buttons */}
            <div>
              {isUserMember ? (
                <Dialog
                  open={showLeaveDialog}
                  onOpenChange={setShowLeaveDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isLeaving || isLeader}
                      size="lg"
                      title={
                        isLeader
                          ? "Leaders cannot leave the club. Transfer leadership first."
                          : undefined
                      }
                    >
                      {isLeaving ? (
                        "Leaving..."
                      ) : (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Leave
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Leave Club</DialogTitle>
                      <DialogDescription>
                        {isLeader
                          ? "As the leader, you'll need to transfer leadership before leaving this club. This action cannot be undone."
                          : "Are you sure you want to leave this club?"}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowLeaveDialog(false)}
                        disabled={isLeaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLeaveClub}
                        disabled={isLeaving || isLeader}
                      >
                        {isLeaving ? "Leaving..." : "Leave Club"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                <Button onClick={handleJoinClub} disabled={isJoining} size="lg">
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
            <div className="space-y-2 md:space-y-3">
              {members.map((member, index) => (
                <DropdownMenu key={member.user.id}>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors cursor-pointer">
                      {/* Rank Number */}
                      <div className="flex items-center justify-center min-w-[30px] md:min-w-[40px]">
                        <span className="text-lg md:text-2xl font-bold">
                          {index + 1}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="relative h-14 w-14 md:h-20 md:w-20 flex-shrink-0 rounded-full overflow-hidden bg-muted border-2 border-muted">
                        {member.user?.profile_image_url ? (
                          <Image
                            src={member.user.profile_image_url}
                            alt={`${
                              member.user?.display_name || member.user?.username
                            }'s profile`}
                            fill
                            className="object-cover rounded-full"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={75}
                            priority={index < 5}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm md:text-xl font-medium">
                            {member.user?.username?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-lg truncate">
                          {member.user?.display_name || member.user?.username}
                        </h3>
                        {member.user?.display_name && member.user?.username && (
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            @{member.user.username}
                          </p>
                        )}
                        <p className="text-xs md:text-sm text-muted-foreground truncate capitalize">
                          {member.role || "member"}
                        </p>
                      </div>

                      {/* Total Likes */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                          <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500" />
                          <span className="text-lg md:text-2xl font-bold text-primary">
                            {member.total_likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" sideOffset={0}>
                    <DropdownMenuLabel>
                      {member.user?.display_name || member.user?.username}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${member.user?.username}`}>
                        <UserIcon className="h-4 w-4 mr-2" />
                        Visit Profile
                      </Link>
                    </DropdownMenuItem>
                    {canManage &&
                      member.role !== "leader" &&
                      member.user.id !== currentUser?.id && (
                        <>
                          <DropdownMenuSeparator />
                          {member.role === "member" && (
                            <DropdownMenuItem
                              disabled={managingMemberId === member.user.id}
                              onClick={async () => {
                                await handleMemberAction(
                                  "promote",
                                  member.user.id
                                );
                              }}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              {managingMemberId === member.user.id
                                ? "Promoting..."
                                : "Promote to Co-Leader"}
                            </DropdownMenuItem>
                          )}
                          {member.role === "co-leader" && (
                            <DropdownMenuItem
                              disabled={managingMemberId === member.user.id}
                              onClick={async () => {
                                await handleMemberAction(
                                  "demote",
                                  member.user.id
                                );
                              }}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              {managingMemberId === member.user.id
                                ? "Demoting..."
                                : "Demote to Member"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={managingMemberId === member.user.id}
                            onClick={() => {
                              setMemberToKick({
                                id: member.user.id,
                                name:
                                  member.user.display_name ||
                                  member.user.username,
                              });
                              setShowKickDialog(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            {managingMemberId === member.user.id
                              ? "Kicking..."
                              : "Kick from Club"}
                          </DropdownMenuItem>
                        </>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Kick Member Confirmation Dialog */}
      <Dialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kick Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to kick{" "}
              <strong>{memberToKick?.name}</strong> from the club? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowKickDialog(false);
                setMemberToKick(null);
              }}
              disabled={managingMemberId === memberToKick?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (memberToKick) {
                  await handleMemberAction("kick", memberToKick.id);
                  setShowKickDialog(false);
                  setMemberToKick(null);
                }
              }}
              disabled={managingMemberId === memberToKick?.id}
            >
              {managingMemberId === memberToKick?.id
                ? "Kicking..."
                : "Kick Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
