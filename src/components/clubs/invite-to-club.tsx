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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus, Users, AlertCircle, Check } from "lucide-react";
import Image from "next/image";
import type { Club } from "@/types/club";

interface LeaderClub extends Club {
  memberCount: number;
}

interface InviteToClubProps {
  targetUserId: string;
  targetUsername: string;
  leaderClubs: LeaderClub[];
  trigger?: React.ReactNode;
  sendClubInvitationAction: (
    targetUserId: string,
    clubId: string,
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function InviteToClub({
  targetUserId,
  targetUsername,
  leaderClubs,
  trigger,
  sendClubInvitationAction,
}: InviteToClubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [message, setMessage] = useState(
    `Hi ${targetUsername}! We'd love to have you join our club.`
  );
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClub = leaderClubs.find((club) => club.id === selectedClubId);

  const handleSend = async () => {
    if (!selectedClubId) {
      setError("Please select a club to invite the user to");
      return;
    }

    if (!message.trim()) {
      setError("Please provide a message with your invitation");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await sendClubInvitationAction(
        targetUserId,
        selectedClubId,
        message.trim()
      );

      if (result.success) {
        setIsOpen(false);
        setSelectedClubId(null);
        setMessage(
          `Hi ${targetUsername}! We'd love to have you join our club.`
        );
        toast.success("Invitation sent!", {
          description: `Your invitation to ${selectedClub?.name} has been sent to ${targetUsername}.`,
        });
      } else {
        setError(result.error || "Failed to send invitation");
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("Failed to send invitation", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Don't show invite button if user isn't a leader of any clubs
  if (leaderClubs.length === 0) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" disabled={isSending}>
      <UserPlus className="h-4 w-4 mr-2" />
      Invite to Club
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite {targetUsername} to Club
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Club Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select Club</Label>
            <RadioGroup
              value={selectedClubId || ""}
              onValueChange={setSelectedClubId}
            >
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {leaderClubs.map((club) => (
                  <div key={club.id}>
                    <RadioGroupItem
                      value={club.id}
                      id={club.id}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={club.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-border ${
                        selectedClubId === club.id
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                    >
                      {/* Club Banner */}
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {club.banner_image_url ? (
                          <Image
                            src={club.banner_image_url}
                            alt={club.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Club Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {club.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{club.memberCount} members</span>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedClubId === club.id && (
                        <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="h-2 w-2 text-white" />
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="invitation-message">Invitation Message</Label>
            <Textarea
              id="invitation-message"
              placeholder={`Tell ${targetUsername} why you'd like them to join your club...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !selectedClubId}
            >
              {isSending ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
