"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllMessages } from "@/data";
import type { Message } from "@/types/message";

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const messagesData = await getAllMessages();
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Inbox</h1>
              <p className="text-muted-foreground mt-2">
                Stay connected with your car community
              </p>
            </div>
            <div className="text-center py-8">Loading messages...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
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
                      href={`/profile/${msg.sender?.id}`}
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
                      <h3 className="font-medium">
                        {msg.subject || "No subject"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {msg.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
