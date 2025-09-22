"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, UserCheck, Plus, Star } from "lucide-react";
import { MyEventsView } from "@/components/events/my-events-view";
import { AttendingEventsView } from "@/components/events/attending-events-view";
import type { Event } from "@/types/event";
import type { User } from "@/types/user";
import Link from "next/link";

type MyEventsTab = "hosting" | "going" | "interested";

interface MyEventsTabNavigationProps {
  currentUser: User;
  defaultTab?: MyEventsTab;
  hostingEvents: Event[];
  goingEvents?: Event[];
  interestedEvents?: Event[];
}

export function MyEventsTabNavigation({
  currentUser,
  defaultTab = "hosting",
  hostingEvents,
  goingEvents = [],
  interestedEvents = [],
}: MyEventsTabNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<MyEventsTab>(defaultTab);

  // Get tab from URL parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "hosting" ||
      tabParam === "going" ||
      tabParam === "interested"
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: MyEventsTab) => {
    if (tab === activeTab) return; // Don't change if same tab

    setActiveTab(tab);

    // Update URL without page refresh
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/events/my-events?${params.toString()}`, { scroll: false });
  };

  // Get counts for each tab
  const hostingCount = hostingEvents.length;
  const goingCount = goingEvents.length;
  const interestedCount = interestedEvents.length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 min-w-0 pr-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Events</h1>
          <p className="text-muted-foreground">
            {activeTab === "hosting" &&
              "Manage and view all your hosted events"}
            {activeTab === "going" && "Events you're going to"}
            {activeTab === "interested" && "Events you're interested in"}
          </p>
        </div>
        <Link href="/events/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg flex gap-1">
          <Button
            variant={activeTab === "hosting" ? "default" : "ghost"}
            onClick={() => handleTabChange("hosting")}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Hosting
            {hostingCount > 0 && (
              <span className="bg-background text-foreground text-xs px-2 py-0.5 rounded-full">
                {hostingCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "going" ? "default" : "ghost"}
            onClick={() => handleTabChange("going")}
            className="flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4" />
            Going
            {goingCount > 0 && (
              <span className="bg-background text-foreground text-xs px-2 py-0.5 rounded-full">
                {goingCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "interested" ? "default" : "ghost"}
            onClick={() => handleTabChange("interested")}
            className="flex items-center gap-2"
          >
            <Star className="h-4 w-4" />
            Interested
            {interestedCount > 0 && (
              <span className="bg-background text-foreground text-xs px-2 py-0.5 rounded-full">
                {interestedCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <>
        {activeTab === "hosting" && (
          <MyEventsView events={hostingEvents} userId={currentUser.id} />
        )}
        {activeTab === "going" && (
          <AttendingEventsView events={goingEvents} eventType="going" />
        )}
        {activeTab === "interested" && (
          <AttendingEventsView
            events={interestedEvents}
            eventType="interested"
          />
        )}
      </>
    </>
  );
}
