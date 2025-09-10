import { revalidatePath } from 'next/cache';

// Server action to revalidate all event-related pages after creation/update
export async function revalidateEventsAction() {
  'use server';
  
  try {
    console.log('🔄 Revalidating all event-related pages...');
    
    // Revalidate all pages that show events
    revalidatePath('/', 'layout'); // Revalidate entire app
    revalidatePath('/events'); // Events listing
    revalidatePath('/events/my-events'); // User's events
    revalidatePath('/'); // Homepage (shows upcoming events)
    
    // If using tags (optional for future use)
    // revalidateTag('events');
    // revalidateTag('home');
    
    console.log('✅ All event pages revalidated successfully');
  } catch (error) {
    console.error('❌ Failed to revalidate event pages:', error);
    throw error;
  }
}

// More specific revalidation for different scenarios
export async function revalidateEventDetailAction(eventId: string) {
  'use server';
  
  try {
    console.log(`🔄 Revalidating event ${eventId} detail page...`);
    
    // Revalidate specific event page
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/edit/${eventId}`);
    
    console.log(`✅ Event ${eventId} pages revalidated`);
  } catch (error) {
    console.error(`❌ Failed to revalidate event ${eventId}:`, error);
    throw error;
  }
}

// Revalidate user-specific pages
export async function revalidateUserEventsAction(userId: string) {
  'use server';
  
  try {
    console.log(`🔄 Revalidating user ${userId} event pages...`);
    
    // Revalidate user's event pages
    revalidatePath('/events/my-events');
    revalidatePath(`/profile/${userId}`);
    
    console.log(`✅ User ${userId} event pages revalidated`);
  } catch (error) {
    console.error(`❌ Failed to revalidate user ${userId} events:`, error);
    throw error;
  }
}

// Complete revalidation after event creation
export async function revalidateAfterEventCreation(eventId: string, userId: string) {
  'use server';
  
  try {
    console.log(`🔄 Complete revalidation after event ${eventId} creation...`);
    
    // Revalidate all event-related pages
    await revalidateEventsAction();
    
    // Revalidate specific event page
    await revalidateEventDetailAction(eventId);
    
    // Revalidate user pages
    await revalidateUserEventsAction(userId);
    
    console.log(`✅ Complete revalidation finished for event ${eventId}`);
  } catch (error) {
    console.error(`❌ Complete revalidation failed for event ${eventId}:`, error);
    throw error;
  }
}
