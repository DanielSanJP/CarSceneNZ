export interface User {
  id: string; // Matches Supabase auth.uid
  username: string;
  display_name?: string;
  email?: string;
  profile_image_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  last_seen_inbox?: string; // ISO date string - when user last visited inbox
}

export interface UserFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Extended User interface for profile data
export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  carsCount: number;
  clubsCount: number;
  eventsCount: number;
}

// Profile data interface for SSR
export interface ProfileData {
  profileUser: UserProfile;
  userCars: Array<{
    id: string;
    user_id: string;
    brand: string;
    model: string;
    year: number;
    image_url?: string;
    total_likes: number;
    created_at: string;
    updated_at: string;
  }>;
  followers: User[];
  following: User[];
  userClubs: Array<{
    club: {
      id: string;
      name: string;
      description: string;
      banner_image_url?: string;
      club_type: string;
      location?: string;
      leader_id: string;
      total_likes: number;
      created_at: string;
      updated_at: string;
      leader: {
        id: string;
        username: string;
        display_name: string;
        profile_image_url?: string;
      };
    };
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  isFollowing: boolean;
  currentUser: User | null;
}

// Leader clubs data interface
export interface LeaderClubsData {
  leaderClubs: Array<{
    id: string;
    name: string;
    description: string;
    image_url: string | null;
    memberCount: number;
  } | null>;
}
