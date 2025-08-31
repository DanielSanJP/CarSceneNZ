export interface Club {
  id: string;
  name: string;
  description?: string;
  banner_image_url?: string;
  club_type?: string;
  location?: string;
  leader_id: string; // References User.id
  total_likes: number;
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
