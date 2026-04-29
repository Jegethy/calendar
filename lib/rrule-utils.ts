/**
 * RRule Utilities - Centralized recurrence rule handling
 * Consolidates all RRule logic in one place to avoid duplication
 */

import { RRule } from 'rrule';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'none';

/**
 * Parse an RFC 5545 RRULE string to determine the frequency
 * Returns 'none' if no valid recurrence rule
 */
export function parseRruleFrequency(rrule?: string | null): RecurrenceFrequency {
  if (!rrule) return 'none';
  
  if (rrule.includes('FREQ=DAILY')) return 'daily';
  if (rrule.includes('FREQ=WEEKLY')) return 'weekly';
  if (rrule.includes('FREQ=MONTHLY')) return 'monthly';
  
  return 'none';
}

/**
 * Build an RFC 5545 RRULE string from a frequency
 * Returns null if frequency is 'none'
 */
export function buildRrule(frequency: RecurrenceFrequency): string | null {
  switch (frequency) {
    case 'daily':
      return 'FREQ=DAILY';
    case 'weekly':
      return 'FREQ=WEEKLY';
    case 'monthly':
      return 'FREQ=MONTHLY';
    case 'none':
    default:
      return null;
  }
}

/**
 * Get all occurrences of a recurring event within a date range
 * 
 * @param rrule - RFC 5545 RRULE string
 * @param startTime - Start time of the event
 * @param rangeStart - Start of date range to check
 * @param rangeEnd - End of date range to check
 * @returns Array of Date objects representing each occurrence
 */
export function getEventOccurrences(
  rrule: string | null | undefined,
  startTime: Date,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  // Non-recurring event
  if (!rrule) {
    if (startTime >= rangeStart && startTime <= rangeEnd) {
      return [startTime];
    }
    return [];
  }

  try {
    // Parse the RRULE using the event's start time as DTSTART
    const dtstart = new Date(startTime);
    const rruleStr = `DTSTART:${dtstart.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nRRULE:${rrule}`;
    const rule = RRule.fromString(rruleStr);
    
    // Get all occurrences between the range dates
    return rule.between(rangeStart, rangeEnd, true);
  } catch (error) {
    // If RRule parsing fails, fall back to single occurrence
    console.warn('Failed to parse RRULE, treating as non-recurring:', rrule, error);
    if (startTime >= rangeStart && startTime <= rangeEnd) {
      return [startTime];
    }
    return [];
  }
}

/**
 * Check if an RRULE string represents a valid recurrence
 */
export function isValidRrule(rrule?: string | null): boolean {
  if (!rrule) return true; // null/undefined is valid (no recurrence)
  
  try {
    // Quick validation - see if it contains a valid FREQ
    if (!['FREQ=DAILY', 'FREQ=WEEKLY', 'FREQ=MONTHLY'].some(f => rrule.includes(f))) {
      return false;
    }
    
    // Try to construct with a minimal date to ensure it parses
    const testDate = new Date('2026-01-01T00:00:00Z');
    const testStr = `DTSTART:20260101T000000Z\nRRULE:${rrule}`;
    RRule.fromString(testStr);
    
    return true;
  } catch {
    return false;
  }
}
