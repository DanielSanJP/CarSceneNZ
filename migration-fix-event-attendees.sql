-- Add unique constraint to prevent duplicate event attendee records
ALTER TABLE public.event_attendees
ADD CONSTRAINT event_attendees_event_user_unique UNIQUE (event_id, user_id);