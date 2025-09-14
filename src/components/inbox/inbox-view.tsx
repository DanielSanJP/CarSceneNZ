"use client";

import { useState, memo, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/utils/supabase/client";
import type { InboxMessage, InboxMessagesData } from "@/types/inbox";
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
    return "now";
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  }

  // Less than 7 days
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }

  // Less than 4 weeks (about a month)
  if (diffInSeconds < 2419200) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}w`;
  }

  // Less than 365 days
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}mo`;
  }

  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years}y`;
}

interface InboxViewProps {
  inboxData: InboxMessagesData;
}

function InboxViewComponent({ inboxData }: InboxViewProps) {
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  // Local state for real-time updates - start with server data
  const [messages, setMessages] = useState<InboxMessage[]>(
    inboxData.messages || []
  );

  // Update local state when server data changes (on page refresh/navigation)
  useEffect(() => {
    setMessages(inboxData.messages || []);
  }, [inboxData.messages]);

  // Mark inbox as read when component mounts (client-side for immediate feedback)
  useEffect(() => {
    const markAsReadClientSide = async () => {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        console.log(
          "📬 Client-side: Marking inbox as read for immediate UI feedback"
        );

        const response = await fetch("/api/inbox/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (response.ok) {
          console.log("✅ Client-side: Inbox marked as read successfully");
        } else {
          console.error("❌ Client-side: Failed to mark inbox as read");
        }
      } catch (error) {
        console.error("❌ Client-side mark-read error:", error);
      }
    };

    // Small delay to ensure component is mounted and user is authenticated
    const timeoutId = setTimeout(markAsReadClientSide, 500);
    return () => clearTimeout(timeoutId);
  }, []); // Only run once when component mounts

  // Set up real-time subscription for new messages
  useEffect(() => {
    const supabase = createClient();

    // Get current user to filter messages
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log(`🔄 Setting up real-time subscription for user: ${user.id}`);

      // Subscribe to new messages for this user
      const channel = supabase
        .channel(`inbox-messages-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("📨 New message received via real-time:", payload.new);

            // Add new message to the top of the list
            const newMessage = payload.new as InboxMessage;
            setMessages((prev) => {
              // Prevent duplicates
              const exists = prev.some((msg) => msg.id === newMessage.id);
              if (exists) return prev;

              return [newMessage, ...prev];
            });

            // Show toast notification
            toast.success("New message received!");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("🗑️ Message deleted via real-time:", payload.old);

            // Remove deleted message from list
            const deletedId = payload.old?.id;
            if (deletedId) {
              setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
            }
          }
        )
        .subscribe((status) => {
          console.log("📡 Real-time subscription status:", status);
        });

      // Cleanup subscription
      return () => {
        console.log("🧹 Cleaning up real-time subscription");
        supabase.removeChannel(channel);
      };
    };

    getCurrentUser();
  }, []);

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
    setProcessingRequest(msg.id);
    try {
      const response = await fetch("/api/inbox/handle-join-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: msg.id,
          action,
          clubId: msg.club_id || "",
          senderId: msg.sender_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to handle join request");
      }

      toast.success(`Successfully ${action}ed join request`);
      // Refresh the page to show updated data
      window.location.reload();
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
    setProcessingRequest(msg.id);
    try {
      console.log("🔍 DEBUG - Message object:", msg);
      console.log("🔍 DEBUG - Message club_id:", msg.club_id);
      console.log("🔍 DEBUG - Message sender_id:", msg.sender_id);

      const requestData = {
        messageId: msg.id,
        action,
        clubId: msg.club_id || "",
        inviterId: msg.sender_id,
      };

      console.log("🔍 DEBUG - Sending request data:", requestData);

      const response = await fetch("/api/inbox/handle-club-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to handle club invitation");
      }

      toast.success(`Successfully ${action}ed club invitation`);
      // Refresh the page to show updated data
      window.location.reload();
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
                      href={`/profile/${
                        msg.sender?.username || msg.sender_username
                      }`}
                      className="flex-shrink-0"
                    >
                      {msg.sender?.profile_image_url ||
                      msg.sender_profile_image_url ? (
                        <Image
                          src={
                            msg.sender?.profile_image_url ||
                            msg.sender_profile_image_url ||
                            ""
                          }
                          alt={
                            msg.sender?.username ||
                            msg.sender_username ||
                            "User"
                          }
                          width={48}
                          height={48}
                          quality={100}
                          className="h-12 w-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                          <AvatarFallback className="text-sm">
                            {(
                              msg.sender?.username || msg.sender_username
                            )?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </Link>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      <Link
                        href={`/profile/${
                          msg.sender?.username || msg.sender_username
                        }`}
                        className="font-semibold hover:underline text-sm block truncate"
                      >
                        {msg.sender?.display_name ||
                          msg.sender_display_name ||
                          msg.sender?.username ||
                          msg.sender_username}
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
