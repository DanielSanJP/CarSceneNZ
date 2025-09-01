"use client";

import * as React from "react";
import {
  Moon,
  Sun,
  Car,
  Trophy,
  Calendar,
  Users,
  Mail,
  User,
  LogOut,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchBar } from "@/components/search-bar";
import { useAuth } from "@/lib/hooks/useAuth";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileDropdown() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profile_image_url} alt={user.display_name} />
            <AvatarFallback>
              {(user.display_name || user.username)
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.display_name}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              @{user.username}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/inbox" className="cursor-pointer">
            <Mail className="mr-2 h-4 w-4" />
            <span>Inbox</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/garage" className="cursor-pointer">
            <Car className="mr-2 h-4 w-4" />
            <span>My Garage</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/events/create" className="cursor-pointer">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Create Event</span>
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

export function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="border-b">
      <div className=" mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Always visible navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/"
                      className="flex flex-row items-center gap-3 px-4"
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
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Events</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/leaderboards"
                      className="flex flex-row items-center gap-2"
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
                    >
                      <Users className="h-4 w-4" />
                      <span>Clubs</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {/* Authenticated only navigation */}
                {isAuthenticated && (
                  <>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/garage"
                          className="flex flex-row items-center gap-2"
                        >
                          <Car className="h-4 w-4" />
                          <span>My Garage</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/inbox"
                          className="flex flex-row items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Inbox</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated && <SearchBar />}
            <ModeToggle />
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
