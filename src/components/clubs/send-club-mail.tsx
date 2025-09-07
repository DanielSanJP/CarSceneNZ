"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";

interface ClubMailData {
  subject: string;
  message: string;
  club_id: string;
  sender_id: string;
}

interface SendClubMailProps {
  clubId: string;
  clubName: string;
  currentUserId: string;
  trigger?: React.ReactNode;
  sendClubMailAction: (
    mailData: ClubMailData
  ) => Promise<{ success: boolean; error?: string }>;
}

export function SendClubMail({
  clubId,
  clubName,
  currentUserId,
  trigger,
  sendClubMailAction,
}: SendClubMailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in both subject and message");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await sendClubMailAction({
        subject: subject.trim(),
        message: message.trim(),
        club_id: clubId,
        sender_id: currentUserId,
      });

      if (result.success) {
        setIsOpen(false);
        setSubject("");
        setMessage("");
        // Show success toast
        toast.success("Message sent to all club members!", {
          description: `Your message "${subject}" has been delivered to ${clubName}.`,
        });
      } else {
        setError(result.error || "Failed to send message");
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("Failed to send message", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Mail className="h-4 w-4 mr-2" />
      Send Club Mail
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Message to {clubName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={6}
              className="resize-none"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !message.trim()}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
