"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  MapPin,
  Search,
  Shield,
  Lock,
  Globe,
  Star,
  Filter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Club } from "@/types/club";
import type { User } from "@/types/user";

interface ClubGalleryProps {
  clubs: Club[];
  currentUser: User | null;
}

export function ClubGallery({
  clubs: propClubs,
  currentUser,
}: ClubGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("likes");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [clubs, setClubs] = useState<Club[]>(propClubs || []);

  // Update clubs when propClubs changes
  useEffect(() => {
    if (propClubs) {
      setClubs(propClubs);
    }
  }, [propClubs]);

  // For now, since we don't have auth, we'll show all clubs

  // Get member counts for each club (simplified for now)
  const getClubMemberCount = (clubId: string) => {
    // For now, return a random number between 5-50 based on club ID for consistency
    const hash = clubId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return Math.floor((hash % 45) + 5);
  };

  // Check if current user is a member of a club
  const isUserMemberOfClub = (clubId: string) => {
    // Check if current user is provided and has membership
    if (!currentUser) return false;

    // For now, since we don't have membership data in props, return false
    // In future, this would check membership based on clubId and currentUser
    console.log(
      "Checking membership for club:",
      clubId,
      "user:",
      currentUser.id
    ); // Prevent unused parameter warning
    return false;
  };

  // Get club type icon and styling
  const getClubTypeInfo = (type: string) => {
    switch (type) {
      case "open":
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Anyone can join",
          color: "bg-green-500",
        };
      case "invite":
        return {
          icon: <Shield className="h-4 w-4" />,
          text: "Invite only",
          color: "bg-orange-500",
        };
      case "closed":
        return {
          icon: <Lock className="h-4 w-4" />,
          text: "Closed",
          color: "bg-red-500",
        };
      default:
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Unknown",
          color: "bg-gray-500",
        };
    }
  };

  // Filter and sort clubs
  const getFilteredClubs = () => {
    let filtered = clubs;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((club: Club) => {
        // Check if search term starts with # for ID search
        if (searchTerm.startsWith("#")) {
          const idSearch = searchTerm.substring(1); // Remove the # symbol
          return club.id.toLowerCase().includes(idSearch.toLowerCase());
        }

        // Regular search in name and description
        return (
          club.name.toLowerCase().includes(searchLower) ||
          (club.description?.toLowerCase().includes(searchLower) ?? false) ||
          club.id.toLowerCase().includes(searchLower) // Also allow ID search without #
        );
      });
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(
        (club: Club) => club.location === locationFilter
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((club: Club) => club.club_type === typeFilter);
    }

    // Sort
    switch (sortBy) {
      case "likes":
        filtered.sort((a: Club, b: Club) => b.total_likes - a.total_likes);
        break;
      case "members":
        filtered.sort(
          (a: Club, b: Club) =>
            getClubMemberCount(b.id) - getClubMemberCount(a.id)
        );
        break;
      case "newest":
        filtered.sort(
          (a: Club, b: Club) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "name":
        filtered.sort((a: Club, b: Club) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  };

  const handleImageError = (clubId: string) => {
    setFailedImages((prev) => new Set(prev).add(clubId));
  };

  // Get unique locations for filter
  const locations = [
    ...new Set(
      clubs
        .map((club: Club) => club.location)
        .filter((loc): loc is string => Boolean(loc))
    ),
  ].sort();

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter Clubs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clubs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="invite">Invite Only</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likes">Most Likes</SelectItem>
                  <SelectItem value="members">Most Members</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters and Results Summary */}
          {(searchTerm || locationFilter !== "all" || typeFilter !== "all") && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing {getFilteredClubs().length} clubs</span>
                {searchTerm && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                    Search: &quot;{searchTerm}&quot;
                  </span>
                )}
                {locationFilter !== "all" && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                    Location: {locationFilter}
                  </span>
                )}
                {typeFilter !== "all" && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">
                    Type: {typeFilter}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("all");
                  setTypeFilter("all");
                  setSortBy("likes");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clubs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getFilteredClubs().map((club: Club) => {
          const memberCount = getClubMemberCount(club.id);
          const typeInfo = getClubTypeInfo(club.club_type || "general");
          const leader = { name: "Unknown Leader" }; // Placeholder since getUserById is not available
          const isUserMember = isUserMemberOfClub(club.id);

          // Determine button text based on club type and membership
          const getActionButtonText = () => {
            if (isUserMember) {
              return "View Club";
            }

            switch (club.club_type) {
              case "open":
                return "Join Club";
              case "invite":
                return "Request Invite";
              case "closed":
                return "View Club";
              default:
                return "View Club";
            }
          };

          return (
            <Link href={`/clubs/${club.id}?from=gallery`} key={club.id}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group py-0">
                {/* Banner Image Background */}
                <div className="relative aspect-square overflow-hidden">
                  {failedImages.has(club.id) ? (
                    <div className="h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Users className="h-12 w-12 text-primary opacity-50" />
                    </div>
                  ) : (
                    <Image
                      src={club.banner_image_url || "/clubs/default-club.jpg"}
                      alt={club.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={() => handleImageError(club.id)}
                    />
                  )}

                  {/* Member count */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {memberCount}
                  </div>

                  {/* Club type badge */}
                  <div
                    className={`absolute top-3 left-3 ${typeInfo.color} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                  >
                    {typeInfo.icon}
                    {typeInfo.text}
                  </div>
                </div>

                <CardContent className="p-4 pt-0">
                  {/* Club name and location */}
                  <div className="space-y-2 mb-3">
                    <h3 className="font-bold text-lg leading-tight">
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {club.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {club.total_likes}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {club.description && club.description.length > 100
                      ? `${club.description.substring(0, 100)}...`
                      : club.description || "No description available."}
                  </p>

                  {/* Leader info */}
                  {leader && (
                    <div className="text-xs text-muted-foreground mb-4">
                      Led by {leader.name}
                    </div>
                  )}

                  {/* Action button */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // If user is already a member, navigate to club page
                        if (isUserMember) {
                          window.location.href = `/clubs/${club.id}?from=gallery`;
                          return;
                        }

                        // Handle join/request logic here
                        const actionText =
                          club.club_type === "open"
                            ? "Joining"
                            : "Requesting to join";
                        console.log(`${actionText} club:`, club.id);
                      }}
                    >
                      {getActionButtonText()}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/clubs/${club.id}?from=gallery`;
                      }}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {getFilteredClubs().length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No clubs found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse all clubs
          </p>
        </div>
      )}
    </div>
  );
}
