"use client";

import { useState } from "react";
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
  Heart,
  Filter,
} from "lucide-react";
import { clubs, clubMembers, getUserById } from "@/data";
import Image from "next/image";
import Link from "next/link";

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

export function JoinClubView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("likes");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const clubsData = clubs as Club[];
  const clubMembersData = clubMembers as ClubMember[];

  // Get member counts for each club
  const getClubMemberCount = (clubId: string) => {
    return clubMembersData.filter((member) => member.club_id === clubId).length;
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
    let filtered = clubsData;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((club) => {
        // Check if search term starts with # for ID search
        if (searchTerm.startsWith("#")) {
          const idSearch = searchTerm.substring(1); // Remove the # symbol
          return club.id.toLowerCase().includes(idSearch.toLowerCase());
        }

        // Regular search in name and description
        return (
          club.name.toLowerCase().includes(searchLower) ||
          club.description.toLowerCase().includes(searchLower) ||
          club.id.toLowerCase().includes(searchLower) // Also allow ID search without #
        );
      });
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((club) => club.location === locationFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((club) => club.club_type === typeFilter);
    }

    // Sort
    switch (sortBy) {
      case "likes":
        filtered.sort((a, b) => b.total_likes - a.total_likes);
        break;
      case "members":
        filtered.sort(
          (a, b) => getClubMemberCount(b.id) - getClubMemberCount(a.id)
        );
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  };

  const handleImageError = (clubId: string) => {
    setFailedImages((prev) => new Set(prev).add(clubId));
  };

  // Get unique locations for filter
  const locations = [...new Set(clubsData.map((club) => club.location))].sort();

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
        {getFilteredClubs().map((club) => {
          const memberCount = getClubMemberCount(club.id);
          const typeInfo = getClubTypeInfo(club.club_type);
          const leader = getUserById(club.leader_id);

          return (
            <Card
              key={club.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 group py-0"
            >
              {/* Banner Image Background */}
              <div className="relative aspect-square overflow-hidden">
                {failedImages.has(club.id) ? (
                  <div className="h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <Users className="h-12 w-12 text-primary opacity-50" />
                  </div>
                ) : (
                  <Image
                    src={club.banner_image_url}
                    alt={club.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => handleImageError(club.id)}
                  />
                )}
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Member count in Clash of Clans style */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {memberCount}/50
                </div>

                {/* Club type badge */}
                <div
                  className={`absolute top-3 left-3 ${typeInfo.color} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                >
                  {typeInfo.icon}
                  {typeInfo.text}
                </div>
              </div>

              <CardContent className="p-4">
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
                      <Heart className="h-3 w-3" />
                      {club.total_likes}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {club.description.length > 100
                    ? `${club.description.substring(0, 100)}...`
                    : club.description}
                </p>

                {/* Leader info */}
                {leader && (
                  <div className="text-xs text-muted-foreground mb-4">
                    Led by {leader.display_name}
                  </div>
                )}

                {/* Action button */}
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    {club.club_type === "open"
                      ? "Join Club"
                      : club.club_type === "invite"
                      ? "Request Invite"
                      : "View Club"}
                  </Button>
                  <Link href={`/clubs/${club.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
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
