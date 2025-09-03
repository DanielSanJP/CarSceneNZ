"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import type { Message } from "@/types/message";

interface InboxViewProps {
  messages: Message[];
}

export function InboxView({ messages }: InboxViewProps) {
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
              <CardContent className="flex p-4 pt-0 min-h-[100px]">
                <Link
                  href={`/profile/${msg.sender?.username}`}
                  className="flex space-x-4 flex-1 hover:underline"
                >
                  <Avatar>
                    <AvatarImage
                      src={msg.sender?.profile_image_url}
                      alt={msg.sender?.username}
                    />
                    <AvatarFallback>
                      {msg.sender?.username?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{msg.sender?.username}</p>
                  </div>
                </Link>
                <div className="flex-1">
                  <h3 className="font-medium">{msg.subject || "No subject"}</h3>
                  <p className="text-sm text-muted-foreground">{msg.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
