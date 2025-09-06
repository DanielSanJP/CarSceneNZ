"use client";

import * as React from "react";
import Image from "next/image";
import {
  Car,
  Trophy,
  Calendar,
  Users,
  Mail,
  User,
  LogOut,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InboxUnreadBadge } from "@/components/inbox/inbox-unread-badge";
import type { User as UserType } from "@/types/user";

// Main navigation items (available to everyone)
const mainNavItems = [
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "Cars",
    url: "/garage",
    icon: Car,
  },
  {
    title: "Leaderboards",
    url: "/leaderboards",
    icon: Trophy,
  },
  {
    title: "Clubs",
    url: "/clubs",
    icon: Users,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
];

// User-specific navigation items (only for authenticated users)
const userNavItems = [
  {
    title: "My Garage",
    url: "/garage/my-garage",
    icon: Car,
  },
  {
    title: "My Events",
    url: "/events/my-events",
    icon: Calendar,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Mail,
  },
];

interface AppSidebarProps {
  user: UserType | null;
  unreadCount: number;
}

export function AppSidebar({ user, unreadCount }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const isActivePath = (path: string) => {
    if (path === "/") return pathname === "/";

    // For exact matches and specific sub-routes
    if (pathname === path) return true;

    // Only match sub-routes if we're not dealing with overlapping paths
    if (path === "/events" && pathname.startsWith("/events/")) {
      // Don't activate main events if we're on a specific sub-route
      return pathname === "/events";
    }

    if (path === "/garage" && pathname.startsWith("/garage/")) {
      // Don't activate main garage if we're on a specific sub-route
      return pathname === "/garage";
    }

    // For other paths, use exact match or direct sub-path
    return pathname.startsWith(path + "/") || pathname === path;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setOpenMobile(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  // Use user data for display
  const displayName = user?.display_name || user?.username || "User";
  const username = user?.username || "user";
  const avatarUrl = user?.profile_image_url;

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2"
          onClick={handleLinkClick}
        >
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">
            Car Scene NZ
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActivePath(item.url)}>
                    <Link href={item.url} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User-specific navigation (only if authenticated) */}
        {user && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>My Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActivePath(item.url)}
                      >
                        <Link
                          href={item.url}
                          onClick={handleLinkClick}
                          className="relative"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.title === "Inbox" && (
                            <InboxUnreadBadge unreadCount={unreadCount} />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* User Profile */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(`/profile/${username}`)}
                  >
                    <Link
                      href={`/profile/${username}`}
                      className="flex items-center gap-3"
                      onClick={handleLinkClick}
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={32}
                          height={32}
                          quality={100}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {displayName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">
                          {displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{username}
                        </span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Logout Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/login" onClick={handleLinkClick}>
                      <User className="h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/register" onClick={handleLinkClick}>
                      <User className="h-4 w-4" />
                      <span>Get Started</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
