"use client";

import { useState, memo, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, Users } from "lucide-react";
import Link from "next/link";
import type { InboxMessage } from "@/types/inbox";
import { useInboxRealtime } from "@/hooks/use-inbox-realtime";
import { useInboxPageActive } from "@/hooks/use-inbox-page-active";
import { useInboxSafe } from "@/hooks/use-inbox-safe";
import { toast } from "sonner";

// Helper function to format relative time
function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - messageDate.getTime()) / 1000
  );

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return "Just now";
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  // Less than 7 days
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) {
      return "Yesterday";
    }
    return `${days} days ago`;
  }

  // Less than 30 days
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  // Less than 365 days
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }

  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

interface InboxViewProps {
  userId: string;
  initialMessages: InboxMessage[];
  refreshMessages: () => Promise<void>;
  handleJoinRequestAction?: (
    messageId: string,
    action: "approve" | "reject",
    clubId: string,
    senderId: string
  ) => Promise<{ success: boolean; error?: string }>;
  handleClubInvitationAction?: (
    messageId: string,
    action: "accept" | "reject",
    clubId: string,
    inviterId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

function InboxViewComponent({
  userId,
  initialMessages,
  refreshMessages,
  handleJoinRequestAction,
  handleClubInvitationAction,
}: InboxViewProps) {
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  // Use the inbox page active hook for automatic read state management
  useInboxPageActive();

  // Get inbox context for badge coordination
  const { refreshUnreadCount } = useInboxSafe();

  // Handle new message coordination between realtime and badge counting
  const handleNewMessage = useCallback((newMessage: InboxMessage) => {
    console.log("New message received in inbox view:", newMessage);

    // The useInboxPageActive hook and context will handle auto-read behavior
    // We just need to ensure the message appears in the list (which it will)
  }, []);

  // Use Supabase real-time inbox updates with coordination callback
  const { messages } = useInboxRealtime({
    userId,
    initialMessages,
    refreshMessages,
    onNewMessage: handleNewMessage,
    refreshUnreadCount,
  });

  // Function to clean message content by removing metadata
  const getCleanMessage = (message: string): string => {
    // Remove HTML comment metadata for both join requests and invitations
    return message
      .replace(/<!-- METADATA:CLUB_JOIN_REQUEST:.*? -->/g, "")
      .replace(/<!-- METADATA:CLUB_INVITATION:.*? -->/g, "")
      .trim();
  };
  const handleJoinRequest = async (
    msg: InboxMessage,
    action: "approve" | "reject"
  ) => {
    if (!handleJoinRequestAction) {
      toast.error("Join request action not available");
      return;
    }

    setProcessingRequest(msg.id);
    try {
      const result = await handleJoinRequestAction(
        msg.id,
        action,
        msg.club_id || "",
        msg.sender_id
      );
      if (result.success) {
        // Server action will handle revalidation, no need for manual reload
        toast.success(`Successfully ${action}ed join request`);
      } else {
        toast.error(
          `Failed to ${action} join request: ${result.error || "Unknown error"}`
        );
      }
    } catch {
      toast.error(`Failed to ${action} join request`);
    } finally {
      setProcessingRequest(null);
    }
  };
  const handleClubInvitation = async (
    msg: InboxMessage,
    action: "accept" | "reject"
  ) => {
    if (!handleClubInvitationAction) {
      toast.error("Club invitation action not available");
      return;
    }

    setProcessingRequest(msg.id);
    try {
      const result = await handleClubInvitationAction(
        msg.id,
        action,
        msg.club_id || "",
        msg.sender_id
      );
      if (result.success) {
        // Server action will handle revalidation, no need for manual reload
        toast.success(`Successfully ${action}ed club invitation`);
      } else {
        toast.error(
          `Failed to ${action} club invitation: ${
            result.error || "Unknown error"
          }`
        );
      }
    } catch {
      toast.error(`Failed to ${action} club invitation`);
    } finally {
      setProcessingRequest(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground mt-2">
          Stay connected with your car community
        </p>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No messages yet
          </div>
        ) : (
          messages.map((msg: InboxMessage) => (
            <Card key={msg.id}>
              <CardContent className="p-3 sm:p-4">
                {/* Mobile-first: Stack everything vertically on small screens */}
                <div className="space-y-3 sm:grid sm:grid-cols-12 sm:gap-4 sm:space-y-0">
                  {/* Profile Section */}
                  <div className="flex items-start gap-3 sm:col-span-3">
                    {/* Avatar */}
                    <Link
                      href={`/profile/${msg.sender?.username}`}
                      className="flex-shrink-0"
                    >
                      {msg.sender?.profile_image_url ? (
                        <Image
                          src={msg.sender.profile_image_url}
                          alt={msg.sender.username || "User"}
                          width={48}
                          height={48}
                          quality={100}
                          className="h-12 w-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                          <AvatarFallback className="text-sm">
                            {msg.sender?.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </Link>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <Link
                        href={`/profile/${msg.sender?.username}`}
                        className="font-semibold hover:underline text-sm block truncate"
                      >
                        {msg.sender?.display_name || msg.sender?.username}
                      </Link>

                      {/* Badge and Date on same line for mobile */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex-shrink-0">
                          {msg.message_type === "club_join_request" && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Join Request
                            </Badge>
                          )}
                          {msg.message_type === "club_invitation" && (
                            <Badge variant="default" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Club Invitation
                            </Badge>
                          )}
                          {msg.message_type === "club_announcement" && (
                            <Badge variant="outline" className="text-xs">
                              Club Mail
                            </Badge>
                          )}
                        </div>

                        {/* Relative time on mobile */}
                        <p
                          className="text-xs text-muted-foreground flex-shrink-0 sm:hidden"
                          title={new Date(msg.created_at).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        >
                          {getRelativeTime(msg.created_at)}
                        </p>
                      </div>

                      {/* Relative time on desktop (hidden on mobile) */}
                      <div className="hidden sm:block mt-2">
                        <p
                          className="text-xs text-muted-foreground cursor-help"
                          title={new Date(msg.created_at).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        >
                          {getRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="sm:col-span-9 space-y-2 min-w-0">
                    {/* Subject */}
                    <h3 className="font-semibold text-base sm:text-lg break-words leading-tight">
                      {msg.subject || "No subject"}
                    </h3>

                    {/* Message Content */}
                    <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
                      {getCleanMessage(msg.message)}
                    </p>

                    {/* Club Context */}
                    {msg.club_name && (
                      <div className="bg-muted rounded-lg p-2 sm:p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{msg.club_name}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(msg.message_type === "club_join_request" ||
                      msg.message_type === "club_invitation") && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        {msg.message_type === "club_join_request" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleJoinRequest(msg, "approve")}
                              disabled={processingRequest === msg.id}
                              className="flex-1 sm:flex-none"
                            >
                              {processingRequest === msg.id ? (
                                <Clock className="h-4 w-4 mr-2" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinRequest(msg, "reject")}
                              disabled={processingRequest === msg.id}
                              className="flex-1 sm:flex-none"
                            >
                              {processingRequest === msg.id ? (
                                <Clock className="h-4 w-4 mr-2" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </>
                        )}

                        {msg.message_type === "club_invitation" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                handleClubInvitation(msg, "accept")
                              }
                              disabled={processingRequest === msg.id}
                              className="flex-1 sm:flex-none"
                            >
                              {processingRequest === msg.id ? (
                                <Clock className="h-4 w-4 mr-2" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleClubInvitation(msg, "reject")
                              }
                              disabled={processingRequest === msg.id}
                              className="flex-1 sm:flex-none"
                            >
                              {processingRequest === msg.id ? (
                                <Clock className="h-4 w-4 mr-2" />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Export memoized component for performance
export const InboxView = memo(InboxViewComponent);
