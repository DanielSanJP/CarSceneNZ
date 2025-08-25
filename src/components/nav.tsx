"use client";

import * as React from "react";
import { Moon, Sun, Car, LogOut, User, Trophy, Calendar } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

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
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profile_image_url} alt={user.display_name} />
            <AvatarFallback>
              {user.display_name
                .split(" ")
                .map((n) => n[0])
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
          <Link href="/garage" className="cursor-pointer">
            <Car className="mr-2 h-4 w-4" />
            <span>My Garage</span>
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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary" />
            <Link href="/">
              <h1 className="text-2xl font-bold text-foreground">
                Car Scene NZ
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/events"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Events
                </div>
              </Link>
              <Link
                href="/garage"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  Garage
                </div>
              </Link>
              <Link
                href="/leaderboards"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Leaderboards
                </div>
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-2">
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
    </header>
  );
}
