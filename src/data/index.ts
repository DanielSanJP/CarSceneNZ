// Data utilities for Car Scene NZ
// Helper functions to work with mock JSON data

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  profile_image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  is_main_car: boolean;
  is_public: boolean;
  suspension_type: 'bags' | 'static';
  wheel_specs: {
    front: {
      brand: string;
      size: string;
      offset: string;
    };
    rear: {
      brand: string;
      size: string;
      offset: string;
    };
  };
  tire_specs: {
    front: string;
    rear: string;
  };
  images: string[];
  total_likes: number;
  created_at: string;
}

export interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string;
  poster_image_url: string;
  event_date: string;
  location: string;
  is_public: boolean;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  banner_image_url: string;
  club_type: 'open' | 'invite' | 'closed';
  leader_id: string;
  total_likes: number;
  created_at: string;
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
  status: 'interested' | 'going' | 'approved';
  created_at: string;
}

export interface CarLike {
  car_id: string;
  user_id: string;
  created_at: string;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: 'leader' | 'co-leader' | 'member';
  joined_at: string;
}

export interface UserFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Import JSON data
import usersData from './users.json';
import carsData from './cars.json';
import eventsData from './events.json';
import clubsData from './clubs.json';
import eventAttendeesData from './event-attendees.json';
import carLikesData from './car-likes.json';
import clubMembersData from './club-members.json';
import userFollowsData from './user-follows.json';

// Type-safe data exports
export const users: User[] = usersData as User[];
export const cars: Car[] = carsData as Car[];
export const events: Event[] = eventsData as Event[];
export const clubs: Club[] = clubsData as Club[];
export const eventAttendees: EventAttendee[] = eventAttendeesData as EventAttendee[];
export const carLikes: CarLike[] = carLikesData as CarLike[];
export const clubMembers: ClubMember[] = clubMembersData as ClubMember[];
export const userFollows: UserFollow[] = userFollowsData as UserFollow[];

// Utility functions
export const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

export const getCarsByUserId = (userId: string): Car[] => {
  return cars.filter(car => car.owner_id === userId);
};

export const getPublicCars = (): Car[] => {
  return cars.filter(car => car.is_public);
};

export const getUpcomingEvents = (): Event[] => {
  const now = new Date();
  return events
    .filter(event => new Date(event.event_date) > now)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
};

export const getEventsByHostId = (hostId: string): Event[] => {
  return events.filter(event => event.host_id === hostId);
};

export const getClubsByUserId = (userId: string): Club[] => {
  const userClubIds = clubMembers
    .filter(member => member.user_id === userId)
    .map(member => member.club_id);
  
  return clubs.filter(club => userClubIds.includes(club.id));
};

export const getClubMembers = (clubId: string): ClubMember[] => {
  return clubMembers.filter(member => member.club_id === clubId);
};

export const getEventAttendees = (eventId: string): EventAttendee[] => {
  return eventAttendees.filter(attendee => attendee.event_id === eventId);
};

export const getUserFollowing = (userId: string): string[] => {
  return userFollows
    .filter(follow => follow.follower_id === userId)
    .map(follow => follow.following_id);
};

export const getUserFollowers = (userId: string): string[] => {
  return userFollows
    .filter(follow => follow.following_id === userId)
    .map(follow => follow.follower_id);
};

export const getCarLikes = (carId: string): CarLike[] => {
  return carLikes.filter(like => like.car_id === carId);
};

export const getMostLikedCars = (limit: number = 10): Car[] => {
  return cars
    .sort((a, b) => b.total_likes - a.total_likes)
    .slice(0, limit);
};

export const searchCars = (query: string): Car[] => {
  const lowerQuery = query.toLowerCase();
  return cars.filter(car => 
    car.brand.toLowerCase().includes(lowerQuery) ||
    car.model.toLowerCase().includes(lowerQuery) ||
    car.year.toString().includes(lowerQuery)
  );
};

export const searchUsers = (query: string): User[] => {
  const lowerQuery = query.toLowerCase();
  return users.filter(user => 
    user.username.toLowerCase().includes(lowerQuery) ||
    user.display_name.toLowerCase().includes(lowerQuery)
  );
};
