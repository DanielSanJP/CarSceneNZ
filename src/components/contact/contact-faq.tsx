import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export function ContactFAQ() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-1">How do I create an event?</h4>
          <p className="text-sm text-muted-foreground">
            Navigate to the Events page and click &ldquo;Create Event&rdquo; to
            get started.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Can I delete my account?</h4>
          <p className="text-sm text-muted-foreground">
            Yes, contact us and we can help you delete your account and
            associated data.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">
            How do I report inappropriate content?
          </h4>
          <p className="text-sm text-muted-foreground">
            Use the contact form or email us directly with details about the
            content.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">How do I join a car club?</h4>
          <p className="text-sm text-muted-foreground">
            Browse clubs on the Clubs page and click &ldquo;Request to
            Join&rdquo; or &ldquo;Join Club&rdquo; depending on the club type.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
