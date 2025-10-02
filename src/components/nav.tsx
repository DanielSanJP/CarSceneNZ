"use client";

import * as React from "react";
import { Car, Trophy, Calendar, Users, Mail, User, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { SearchBar, MobileSearchButton } from "@/components/search-bar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeButton } from "@/components/theme-button";
import { InboxUnreadBadge } from "@/components/inbox/inbox-unread-badge";
import type { User as UserType } from "@/types/user";

function ProfileDropdown({ user }: { user: UserType | null }) {
  const [imageError, setImageError] = React.useState(false);

  // Use user data from our combined auth context
  const displayName = user?.display_name || user?.username || "User";
  const username = user?.username || "user";
  const avatarUrl = user?.profile_image_url;
  // Reset image error when avatarUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl, user, displayName, username]);

  if (!user) return null;
  const handleLogout = async () => {
    try {
      await signOut();
      // If we reach here without redirect, something unexpected happened
      console.warn("Sign out completed without redirect - unexpected behavior");
    } catch (error) {
      // Check if this is a Next.js redirect (successful sign out)
      if (
        error &&
        typeof error === "object" &&
        (error.constructor.name === "RedirectError" ||
          (error as Error).message?.includes("NEXT_REDIRECT"))
      ) {
        // This is a successful redirect - don't show any toast
        // The redirect will happen automatically
        return;
      }

      // This is an actual sign out error
      toast.error("Error signing out. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full overflow-hidden bg-muted"
        >
          {avatarUrl && !imageError ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              quality={50}
              sizes="128px"
              priority
              onError={() => {
                setImageError(true);
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-medium">
              {displayName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{displayName}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              @{username}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/profile/${username}`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/garage/my-garage" className="cursor-pointer">
            <Car className="mr-2 h-4 w-4" />
            <span>My Garage</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/events/my-events" className="cursor-pointer">
            <Calendar className="mr-2 h-4 w-4" />
            <span>My Events</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/clubs/my-clubs" className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>My Clubs</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/inbox"
            className="cursor-pointer flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              <span>Inbox</span>
            </div>
            <InboxUnreadBadge variant="inline" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navigation({ user }: { user: UserType | null }) {
  // DEBUG: Check if Navigation component is rendering
  console.log("🧭 NAVIGATION: Component rendering with user:", user?.id);

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

    if (path === "/clubs" && pathname.startsWith("/clubs/")) {
      // Don't activate main clubs if we're on a specific sub-route
      return pathname === "/clubs";
    }

    // For other paths, use exact match or direct sub-path
    return pathname.startsWith(path + "/") || pathname === path;
  };

  return (
    <div className="border-b">
      <div className=" mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Mobile sidebar trigger */}
            <SidebarTrigger className="lg:hidden" />

            {/* Always visible navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/"
                      className="flex flex-row items-center gap-3 px-4"
                      data-active={isActivePath("/")}
                    >
                      <Car className="h-10 w-10 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">
                        Car Scene NZ
                      </h2>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/events"
                      className="flex flex-row items-center gap-2"
                      data-active={isActivePath("/events")}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Events</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/garage"
                      className="flex flex-row items-center gap-2"
                      data-active={isActivePath("/garage")}
                    >
                      <Car className="h-4 w-4" />
                      <span>Cars</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/leaderboards"
                      className="flex flex-row items-center gap-2"
                      data-active={isActivePath("/leaderboards")}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Leaderboards</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/clubs"
                      className="flex flex-row items-center gap-2"
                      data-active={isActivePath("/clubs")}
                    >
                      <Users className="h-4 w-4" />
                      <span>Clubs</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {/* Authenticated only navigation */}
                {user && (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/inbox"
                          className="flex flex-row items-center gap-2 relative"
                          data-active={isActivePath("/inbox")}
                        >
                          <Mail className="h-4 w-4" />
                          <span>Inbox</span>
                          <InboxUnreadBadge />
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile logo */}
            <Link href="/" className="flex lg:hidden items-center ml-2">
              <Car className="h-8 w-8 text-primary" />
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <SearchBar />
            <MobileSearchButton />
            <ThemeButton />
            {user ? (
              <ProfileDropdown user={user} />
            ) : (
              <div className="hidden lg:flex space-x-2">
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
