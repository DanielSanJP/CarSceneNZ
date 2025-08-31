export interface User {
  id: string; // Matches Supabase auth.uid
  username: string;
  display_name: string;
  email: string;
  profile_image_url?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface UserFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}
