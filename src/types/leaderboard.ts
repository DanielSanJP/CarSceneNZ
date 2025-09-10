// Leaderboard types - can be imported by both server and client components
import type { Car } from './car';
import type { User } from './user';
import type { Club } from './club';

export interface CarRanking {
  car: Car;
  rank: number;
  likes: number;
}

export interface OwnerRanking {
  owner: User;
  rank: number;
  totalLikes: number;
  carCount: number;
}

export interface ClubRanking {
  club: Club;
  rank: number;
  likes: number;
  memberCount: number;
}

export interface LeaderboardsData {
  cars: CarRanking[];
  owners: OwnerRanking[];
  clubs: ClubRanking[];
  meta: {
    generated_at: string;
    cache_key: string;
  };
}
