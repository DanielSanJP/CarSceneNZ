export interface Event {
  id: string;
  host_id: string; // References User.id
  title: string;
  description?: string;
  poster_image_url?: string;
  daily_schedule?: unknown; // JSONB - adjust based on actual structure
  location?: string;
  created_at: string;
  updated_at: string;
  host?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string; // References User.id
  status?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}
