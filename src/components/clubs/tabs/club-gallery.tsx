"use client";

import { useState, memo } from "react";
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
import type { User } from "@/types/user";
import type { Club, ClubsGalleryData } from "@/types/club";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { RequestToJoin } from "@/components/clubs/request-to-join";

interface ClubGalleryProps {
  currentUser: User | null;
  joinClubAction?: (
    clubId: string,
    userId: string
  ) => Promise<{ success: boolean; message?: string }>;
  sendClubJoinRequestAction?: (
    clubId: string,
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
  // URL search params for filters
  initialFilters?: {
    search?: string;
    location?: string;
    club_type?: string;
    sortBy?: string;
    page?: number;
  };
  clubsData: ClubsGalleryData | null;
}

export const ClubGallery = memo(function ClubGallery({
  currentUser,
  joinClubAction,
  sendClubJoinRequestAction,
  initialFilters = {},
  clubsData,
}: ClubGalleryProps) {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");
  const [locationFilter, setLocationFilter] = useState<string>(
    initialFilters.location || "all"
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    initialFilters.club_type || "all"
  );
  const [sortBy, setSortBy] = useState<string>(
    initialFilters.sortBy || "likes"
  );
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Handle error state or missing data
  if (!clubsData) {
    return (
      <>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load clubs</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the clubs data.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </>
    );
  }

  const clubs = clubsData?.clubs || [];
  const totalCount = clubsData?.pagination?.total || 0;
  const totalPages = clubsData?.pagination?.totalPages || 0;

  // Check if current user is a member of a club
  const isUserMemberOfClub = (
    club: Club & { memberCount: number; isUserMember?: boolean }
  ) => {
    return club.isUserMember || false;
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

  const handleImageError = (clubId: string) => {
    setFailedImages((prev) => new Set(prev).add(clubId));
  };

  // Get unique locations for filter dropdown from current clubs
  const locations = [
    ...new Set(
      clubs
        .map((club) => club.location)
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
                <span>Showing {clubs.length} clubs</span>
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
        {clubs.map(
          (club: Club & { memberCount: number; isUserMember?: boolean }) => {
            const memberCount = club.memberCount; // Use real member count from server
            const typeInfo = getClubTypeInfo(club.club_type || "general");
            const leader = club.leader; // Use real leader from server
            const isUserMember = isUserMemberOfClub(club);

            return (
              <Card
                key={club.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group py-0 cursor-pointer"
              >
                <Link href={`/clubs/${club.id}?from=gallery`} className="block">
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
                        loading="lazy"
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

                  <CardContent className="p-4 pt-6">
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
                        Led by {leader.display_name || leader.username}
                      </div>
                    )}
                  </CardContent>
                </Link>

                {/* Action buttons outside the clickable area */}
                <CardContent className="p-4 pt-0 relative z-10">
                  {/* Action button */}
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Main Action Button */}
                    {isUserMember ? (
                      <Link
                        href={`/clubs/${club.id}?from=gallery`}
                        className="flex-1"
                      >
                        <Button className="w-full" size="sm">
                          View Club
                        </Button>
                      </Link>
                    ) : !currentUser ? (
                      <Link href="/login" className="flex-1">
                        <Button className="w-full" size="sm">
                          Sign In to Join
                        </Button>
                      </Link>
                    ) : club.club_type === "closed" ? (
                      <Link
                        href={`/clubs/${club.id}?from=gallery`}
                        className="flex-1"
                      >
                        <Button className="w-full" size="sm" variant="outline">
                          View Club
                        </Button>
                      </Link>
                    ) : club.club_type === "invite" || club.is_invite_only ? (
                      sendClubJoinRequestAction ? (
                        <RequestToJoin
                          clubId={club.id}
                          clubName={club.name}
                          sendClubJoinRequestAction={sendClubJoinRequestAction}
                          trigger={
                            <Button className="flex-1" size="sm">
                              Request to Join
                            </Button>
                          }
                        />
                      ) : (
                        <Link
                          href={`/clubs/${club.id}?from=gallery`}
                          className="flex-1"
                        >
                          <Button className="w-full" size="sm">
                            Request to Join
                          </Button>
                        </Link>
                      )
                    ) : // Open club - direct join
                    joinClubAction ? (
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (!currentUser) return;

                          try {
                            const result = await joinClubAction(
                              club.id,
                              currentUser.id
                            );
                            if (result.success) {
                              window.location.reload();
                            } else {
                              alert(result.message || "Failed to join club");
                            }
                          } catch (error) {
                            console.error("Error joining club:", error);
                            alert("Failed to join club. Please try again.");
                          }
                        }}
                      >
                        Join Club
                      </Button>
                    ) : (
                      <Link
                        href={`/clubs/${club.id}?from=gallery`}
                        className="flex-1"
                      >
                        <Button className="w-full" size="sm">
                          Join Club
                        </Button>
                      </Link>
                    )}

                    {/* View Button */}
                    <Link href={`/clubs/${club.id}?from=gallery`}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {clubs.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No clubs found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or browse all clubs
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <PaginationInfo
              currentPage={currentPage}
              totalItems={totalCount}
              itemsPerPage={12}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
});
