'use client';

// Client-side API functions for profile data
import type { User } from '@/types/user';
import type { Car } from '@/types/car';
import type { Club } from '@/types/club';

// Define UserProfile interface for the client
export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  carsCount: number;
  clubsCount: number;
  eventsCount: number;
}

export interface ProfileData {
  profileUser: UserProfile;
  userCars: Car[];
  followers: User[];
  following: User[];
  userClubs: Array<{
    club: Club;
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  isFollowing: boolean;
  currentUser: User | null;
}

export interface LeaderClubsData {
  leaderClubs: Array<{
    id: string;
    name: string;
    description: string;
    image_url: string | null;
    memberCount: number;
  } | null>;
}

// Get profile data
export async function getProfileData(userId: string): Promise<ProfileData> {
  const response = await fetch(`/api/profile/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch profile data');
  }

  return response.json();
}

// Follow/unfollow user
export async function toggleFollow(targetUserId: string, action: 'follow' | 'unfollow') {
  const response = await fetch('/api/profile/follow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetUserId,
      action,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to ${action} user`);
  }

  return response.json();
}

// Get leader clubs
export async function getLeaderClubs(): Promise<LeaderClubsData> {
  const response = await fetch('/api/profile/clubs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch leader clubs');
  }

  return response.json();
}

// Send club invitation
export async function sendClubInvitation(
  targetUserId: string,
  clubId: string,
  message?: string
) {
  const response = await fetch('/api/profile/clubs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetUserId,
      clubId,
      message,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send club invitation');
  }

  return response.json();
}