"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, Users } from "lucide-react";
import Link from "next/link";
import type { InboxMessage } from "@/types/inbox";

interface InboxViewProps {
  messages: InboxMessage[];
  revalidateBadgeAction: () => Promise<void>;
  handleJoinRequestAction?: (
    messageId: string,
    action: "approve" | "reject",
    clubId: string,
    senderId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function InboxView({
  messages,
  revalidateBadgeAction,
  handleJoinRequestAction,
}: InboxViewProps) {
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  // Optimistic update - trigger badge revalidation when component mounts
  useEffect(() => {
    const markAsRead = async () => {
      // Call the server action to revalidate the unread count
      try {
        await revalidateBadgeAction();
      } catch (error) {
        console.error("Error revalidating badge:", error);
      }
    };

    markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Function to clean message content by removing metadata
  const getCleanMessage = (message: string): string => {
    // Remove HTML comment metadata
    return message
      .replace(/<!-- METADATA:CLUB_JOIN_REQUEST:.*? -->/g, "")
      .trim();
  };

  const handleJoinRequest = async (
    msg: InboxMessage,
    action: "approve" | "reject"
  ) => {
    if (!handleJoinRequestAction) {
      console.error("handleJoinRequestAction not provided");
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
        console.log(`Successfully ${action}ed join request`);
      } else {
        alert(
          `Failed to ${action} join request: ${result.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error(`Error ${action}ing join request:`, error);
      alert(`Failed to ${action} join request`);
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
          messages.map((msg) => (
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
                          onClick={() => handleJoinRequest(msg, "approve")}
                          disabled={processingRequest === msg.id}
                          className="bg-green-600 hover:bg-green-700"
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
                          variant="outline"
                          onClick={() => handleJoinRequest(msg, "reject")}
                          disabled={processingRequest === msg.id}
                          className="border-red-200 text-red-600 hover:bg-red-50"
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
