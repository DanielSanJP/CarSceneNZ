import { User } from './user';
import { Event } from './event';
import { Club } from './club';
import { Car } from './car';

export interface ClubsPageProps {
  clubs: Club[];
  user: User | null;
}

export interface EventDetailPageProps {
  event: Event;
  attendees: User[];
  params: { id: string };
}

export interface GaragePageProps {
  cars: Car[];
  user: User;
}
