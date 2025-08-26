"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Users, Plus, Heart } from "lucide-react";
import { clubs, clubMembers, users } from "@/data";
import { CreateClubForm } from "@/components/create-club-form";
import { JoinClubView } from "@/components/join-club-view";
import { MyClubView } from "@/components/my-club-view";

interface Club {
  id: string;
  name: string;
  description: string;
  banner_image_url: string;
  club_type: "open" | "invite" | "closed";
  location: string;
  leader_id: string;
  total_likes: number;
  created_at: string;
}

interface ClubMember {
  club_id: string;
  user_id: string;
  role: "leader" | "co-leader" | "member";
  joined_at: string;
}

interface ClubWithMembers {
  id: string;
  name: string;
  description: string;
  location: string;
  club_type: "open" | "invite" | "closed";
  banner_image_url: string;
  leader_id: string;
  total_likes: number;
  created_at: string;
  members: Array<{
    user_id: string;
    role: "leader" | "co-leader" | "member";
    joined_at: string;
    user: {
      id: string;
      username: string;
      display_name: string;
      profile_image_url: string;
    };
  }>;
}

type MainTab = "myclub" | "join" | "create";

export default function ClubsPage() {
  const { user, isAuthenticated } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>(
    // Default to "myclub" if user is in a club, otherwise "join"
    isAuthenticated ? "myclub" : "join"
  );
  const [userClub, setUserClub] = useState<ClubWithMembers | null>(null);

  const clubsData = clubs as Club[];
  const clubMembersData = clubMembers as ClubMember[];

  // Check if user is in a club
  useEffect(() => {
    const getUserClub = (): ClubWithMembers | null => {
      if (!isAuthenticated || !user) return null;

      const userMembership = clubMembersData.find(
        (member) => member.user_id === user.id
      );
      if (!userMembership) return null;

      const foundClub = clubsData.find((c) => c.id === userMembership.club_id);
      if (!foundClub) return null;

      // Get club members with user data (similar to club detail page)
      const members = clubMembersData
        .filter((cm) => cm.club_id === foundClub.id)
        .map((cm) => {
          const userData = users.find((u) => u.id === cm.user_id);
          return {
            user_id: cm.user_id,
            role: cm.role,
            joined_at: cm.joined_at,
            user: userData || {
              id: cm.user_id,
              username: "Unknown",
              display_name: "Unknown User",
              profile_image_url: "",
            },
          };
        })
        .sort((a, b) => {
          // Sort by role: leader first, then co-leaders, then members
          const roleOrder: Record<string, number> = {
            leader: 0,
            "co-leader": 1,
            member: 2,
          };
          return roleOrder[a.role] - roleOrder[b.role];
        });

      return {
        id: foundClub.id,
        name: foundClub.name,
        description: foundClub.description,
        location: foundClub.location,
        club_type: foundClub.club_type,
        banner_image_url: foundClub.banner_image_url,
        leader_id: foundClub.leader_id,
        total_likes: foundClub.total_likes,
        created_at: foundClub.created_at,
        members,
      };
    };

    const club = getUserClub();
    setUserClub(club);

    // Update default tab based on whether user is in a club
    if (isAuthenticated) {
      setMainTab(club ? "myclub" : "join");
    }
  }, [isAuthenticated, user, clubsData, clubMembersData]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">🏁 Car Clubs</h1>
            <p className="text-muted-foreground mb-6">
              Join the community, find your crew, share your passion
            </p>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-lg flex gap-1">
              {userClub && (
                <Button
                  variant={mainTab === "myclub" ? "default" : "ghost"}
                  onClick={() => setMainTab("myclub")}
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  My Club
                </Button>
              )}
              <Button
                variant={mainTab === "join" ? "default" : "ghost"}
                onClick={() => setMainTab("join")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Join Club
              </Button>
              <Button
                variant={mainTab === "create" ? "default" : "ghost"}
                onClick={() => setMainTab("create")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Club
              </Button>
            </div>
          </div>

          {mainTab === "myclub" ? (
            /* My Club Section */
            <MyClubView club={userClub} />
          ) : mainTab === "join" ? (
            /* Join Club Section */
            <JoinClubView />
          ) : (
            /* Create Club Section */
            <CreateClubForm embedded={true} />
          )}
        </div>
      </div>
    </div>
  );
}
