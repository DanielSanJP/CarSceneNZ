import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import messages from "@/data/messages.json";
import { Navigation } from "@/components/nav";
import Link from "next/link";

export default function InboxPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
            {messages.map((msg) => (
              <Card key={msg.id}>
                <CardContent className="flex p-4 pt-0 min-h-[100px]">
                  <Link
                    href={`/profile/${msg.sender.id}`}
                    className="flex space-x-4 flex-1 hover:underline"
                  >
                    <Avatar>
                      <AvatarImage
                        src={msg.sender.image}
                        alt={msg.sender.name}
                      />
                      <AvatarFallback>
                        {msg.sender.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{msg.sender.name}</p>
                    </div>
                  </Link>
                  <div className="flex-1">
                    <h3 className="font-medium">{msg.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {msg.message}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
