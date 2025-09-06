"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface RequestToJoinProps {
  clubId: string;
  clubName: string;
  trigger?: React.ReactNode;
  sendClubJoinRequestAction: (
    clubId: string,
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function RequestToJoin({
  clubId,
  clubName,
  trigger,
  sendClubJoinRequestAction,
}: RequestToJoinProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(`I'd like to join your club`);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please provide a message with your join request");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await sendClubJoinRequestAction(clubId, message.trim());

      if (result.success) {
        setIsOpen(false);
        setMessage(`I'd like to join your club`);
        // Show success toast
        toast.success("Join request sent!", {
          description: `Your request to join ${clubName} has been sent to the club leaders.`,
        });
      } else {
        setError(result.error || "Failed to send join request");
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("Failed to send join request", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="default" size="sm" disabled={isSending}>
      <UserPlus className="h-4 w-4 mr-2" />
      Request to Join
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {clubName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message to Club Leaders</Label>
            <Textarea
              id="message"
              placeholder="Tell the club leaders why you'd like to join..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={6}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
