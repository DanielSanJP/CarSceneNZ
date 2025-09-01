import type { CarPerformanceMod } from '@/types/car';

// Performance component data interface for form handling
export interface PerformanceComponentsData {
  performance_mods?: CarPerformanceMod[];
}

/**
 * Get all performance modifications for a car
 * Note: Performance mods table was removed, returning empty data
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getPerformanceComponents(_carId: string): Promise<{
  performance_mods?: CarPerformanceMod[];
}> {
  try {
    // Performance mods table was deleted, return empty data
    return {
      performance_mods: undefined,
    };
  } catch (error) {
    console.error('Error fetching performance components:', error);
    return {};
  }
}

/**
 * Update performance modifications for a car
 * Note: Performance mods table was removed, no-op function
 */
export async function updatePerformanceComponents(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _carId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: PerformanceComponentsData
): Promise<boolean> {
  try {
    // Performance mods table was deleted, no operation needed
    return true;
  } catch (error) {
    console.error('Error updating performance components:', error);
    return false;
  }
}

/**
 * Delete all performance components for a car (for cleanup)
 * Note: Performance mods table was removed, no-op function
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deletePerformanceComponents(_carId: string): Promise<boolean> {
  try {
    // Performance mods table was deleted, no operation needed
    return true;
  } catch (error) {
    console.error('Error deleting performance components:', error);
    return false;
  }
}

/**
 * Helper functions for performance modifications
 */

// Get performance mods by category
export function getPerformanceModsByCategory(
  performanceMods: CarPerformanceMod[] | undefined,
  category: string
): CarPerformanceMod[] {
  return performanceMods?.filter(mod => mod.category === category) || [];
}

// Get comma-separated list of modifications for a category
export function getPerformanceModsList(
  performanceMods: CarPerformanceMod[] | undefined,
  category: string
): string {
  const mods = getPerformanceModsByCategory(performanceMods, category);
  return mods.map(mod => mod.modification).join(', ');
}
