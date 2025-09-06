/**
 * Shared utilities that can be used in both client and server components
 */

/**
 * Generate a temporary ID for new resources before they're created
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate a temporary car ID (alias for generateTempId for backward compatibility)
 */
export const generateTempCarId = generateTempId

/**
 * Generate a temporary club ID (alias for generateTempId for backward compatibility)
 */
export const generateTempClubId = generateTempId

/**
 * Generate a temporary event ID (alias for generateTempId for backward compatibility)
 */
export const generateTempEventId = generateTempId
