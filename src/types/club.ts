export interface Club {
  id: string;
  name: string;
  description?: string;
  banner_image_url?: string;
  club_type?: string;
  location?: string;
  leader_id: string; // References User.id
  total_likes: number;
  is_invite_only?: boolean;
  created_at: string;
  updated_at: string;
  leader?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string; // References User.id
  role?: string;
  joined_at: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

// Clubs Gallery Data Interface
export interface ClubsGalleryData {
  clubs: Array<Club & { 
    memberCount: number;
    isUserMember?: boolean; // Whether current user is a member
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    search: string;
    location: string;
    club_type: string;
    sortBy: string;
  };
}

// User Clubs Data Interface
export interface UserClubsData {
  clubs: Array<{
    club: Club;
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  total: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Club Detail Data Interface
export interface ClubDetailData {
  club: Club;
  members: Array<{
    user: {
      id: string;
      username: string;
      display_name: string;
      profile_image_url?: string;
    };
    role: string;
    joined_at: string;
    total_cars: number;
    total_likes: number;
    most_liked_car_brand?: string;
    most_liked_car_model?: string;
    most_liked_car_likes: number;
  }>;
  memberCount: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}
