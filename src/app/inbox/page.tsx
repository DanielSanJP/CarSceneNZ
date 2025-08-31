import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import messages from "@/data/messages.json";
import { Navigation } from "@/components/nav";
import Link from "next/link";

export default function InboxPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Inbox</h1>
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="flex p-4 pt-0">
                <Link
                  href={`/profile/${msg.sender.id}`}
                  className="flex space-x-4 flex-1 hover:underline"
                >
                  <Avatar>
                    <AvatarImage src={msg.sender.image} alt={msg.sender.name} />
                    <AvatarFallback>{msg.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{msg.sender.name}</p>
                  </div>
                </Link>
                <div className="flex-1">
                  <h3 className="font-medium">{msg.subject}</h3>
                  <p className="text-sm text-muted-foreground">{msg.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
