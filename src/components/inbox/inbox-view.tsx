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
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-4">
                  {/* Left Column - Profile Info */}
                  <div className="col-span-3 flex items-start space-x-3">
                    {/* Profile Avatar */}
                    <Link href={`/profile/${msg.sender?.username}`}>
                      {msg.sender?.profile_image_url ? (
                        <Image
                          src={msg.sender.profile_image_url}
                          alt={msg.sender.username || "User"}
                          width={64}
                          height={64}
                          quality={100}
                          className="h-16 w-16 rounded-full object-cover hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <Avatar className="h-16 w-16 hover:opacity-80 transition-opacity">
                          <AvatarFallback className="text-lg">
                            {msg.sender?.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </Link>

                    {/* Name and Badge Column */}
                    <div className="flex-1 flex flex-col justify-between h-full min-h-[4rem]">
                      <div className="space-y-2">
                        {/* Display Name - Top */}
                        <div>
                          <Link
                            href={`/profile/${msg.sender?.username}`}
                            className="font-semibold hover:underline text-base"
                          >
                            {msg.sender?.display_name || msg.sender?.username}
                          </Link>
                        </div>

                        {/* Badge */}
                        <div>
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
                      </div>

                      {/* Date - Bottom Right */}
                      <div className="flex justify-end mt-auto">
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Message Content */}
                  <div className="col-span-9 space-y-3 min-w-0">
                    {/* Subject */}
                    <h3 className="font-semibold text-lg break-words">
                      {msg.subject || "No subject"}
                    </h3>

                    {/* Message Content */}
                    <p className="leading-relaxed break-words whitespace-pre-wrap">
                      {getCleanMessage(msg.message)}
                    </p>

                    {/* Club Context */}
                    {msg.club_name && (
                      <div className=" rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{msg.club_name}</span>
                        </div>
                      </div>
                    )}

                    {/* Join Request Actions - Show for all club join requests */}
                    {msg.message_type === "club_join_request" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleJoinRequest(msg, "approve")}
                          disabled={processingRequest === msg.id}
                        >
                          {processingRequest === msg.id ? (
                            <Clock className="h-4 w-4 mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleJoinRequest(msg, "reject")}
                          disabled={processingRequest === msg.id}
                        >
                          {processingRequest === msg.id ? (
                            <Clock className="h-4 w-4 mr-1" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Club Invitation Actions - Show for all club invitations */}
                    {msg.message_type === "club_invitation" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleClubInvitation(msg, "accept")}
                          disabled={processingRequest === msg.id}
                        >
                          {processingRequest === msg.id ? (
                            <Clock className="h-4 w-4 mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClubInvitation(msg, "reject")}
                          disabled={processingRequest === msg.id}
                        >
                          {processingRequest === msg.id ? (
                            <Clock className="h-4 w-4 mr-1" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
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
