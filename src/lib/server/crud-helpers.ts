// import 'server-only';
import { createClient } from '@/lib/utils/supabase/server';

// Generic CRUD helper functions to reduce code duplication - server-only version

/**
 * Create a record in any table
 */
export async function createRecord<T>(
  table: string,
  data: Partial<T>
): Promise<T | null> {
  try {
    const supabase = await createClient();
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`Error creating record in ${table}:`, error);
      return null;
    }

    return result as T;
  } catch (error) {
    console.error(`Error in createRecord for ${table}:`, error);
    return null;
  }
}

/**
 * Update a record by ID
 */
export async function updateRecord<T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<T | null> {
  try {
    const supabase = await createClient();
    const { data: result, error } = await supabase
      .from(table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating record in ${table}:`, error);
      return null;
    }

    return result as T;
  } catch (error) {
    console.error(`Error in updateRecord for ${table}:`, error);
    return null;
  }
}

/**
 * Get a single record by car_id (for one-to-one relationships)
 */
export async function getRecordByCarId<T>(
  table: string,
  carId: string
): Promise<T | null> {
  try {
    const supabase = await createClient();
    // First check if any records exist for this car_id
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('car_id', carId);

    if (error) {
      console.error(`Error fetching record from ${table}:`, error);
      return null;
    }

    // If no records found, return null (this is expected for optional components)
    if (!data || data.length === 0) {
      return null;
    }

    // Return the first record (there should only be one due to UNIQUE constraint)
    return data[0] as T;
  } catch (error) {
    console.error(`Error in getRecordByCarId for ${table}:`, error);
    return null;
  }
}

/**
 * Get multiple records by car_id (for one-to-many relationships)
 */
export async function getRecordsByCarId<T>(
  table: string,
  carId: string
): Promise<T[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('car_id', carId);

    if (error) {
      console.error(`Error fetching records from ${table}:`, error);
      return [];
    }

    return (data as T[]) || [];
  } catch (error) {
    console.error(`Error in getRecordsByCarId for ${table}:`, error);
    return [];
  }
}

/**
 * Delete all records for a car (for cleanup)
 */
export async function deleteRecordsByCarId(
  table: string,
  carId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('car_id', carId);

    if (error) {
      console.error(`Error deleting records from ${table}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in deleteRecordsByCarId for ${table}:`, error);
    return false;
  }
}

/**
 * Upsert (insert or update) a record for one-to-one relationships
 */
export async function upsertRecord<T extends { id: string }>(
  table: string,
  carId: string,
  data: Partial<T>
): Promise<T | null> {
  try {
    // First try to get existing record
    const existing = await getRecordByCarId<T>(table, carId);
    
    if (existing) {
      // Update existing record
      return await updateRecord<T>(table, existing.id, data);
    } else {
      // Create new record
      return await createRecord<T>(table, { ...data, car_id: carId });
    }
  } catch (error) {
    console.error(`Error in upsertRecord for ${table}:`, error);
    return null;
  }
}

/**
 * Upsert multiple records for one-to-many relationships (like wheels, gauges)
 */
export async function upsertRecords<T extends { id?: string; position?: string }>(
  table: string,
  carId: string,
  records: T[]
): Promise<T[]> {
  try {
    // Delete existing records first
    await deleteRecordsByCarId(table, carId);
    
    // Insert new records
    const results: T[] = [];
    for (const record of records) {
      const created = await createRecord<T>(table, { ...record, car_id: carId });
      if (created) {
        results.push(created);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error in upsertRecords for ${table}:`, error);
    return [];
  }
}
