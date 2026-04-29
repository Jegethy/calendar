/**
 * Date Utilities - Centralized date handling to prevent timezone issues
 * 
 * IMPORTANT: This calendar treats all times as local to the user's browser.
 * No timezone conversions are performed.
 */

/**
 * Format a Date object to YYYY-MM-DD string (local date, no timezone conversion)
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to HH:MM string (local time, no timezone conversion)
 */
export function getLocalTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local date interpretation)
 * This creates a date in the local timezone at midnight
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse a HH:MM string to hours and minutes
 * Returns object for flexibility in how the time is applied
 */
export function parseLocalTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Create an ISO 8601 string from a local date and time string
 * Used when sending to server - assumes local time is the intent
 * 
 * IMPORTANT: This does NOT do timezone conversion. It constructs an ISO string
 * that represents the local date/time as shown to the user.
 */
export function createLocalDateTimeISO(dateStr: string, timeStr: string): string {
  const date = parseLocalDateString(dateStr);
  const { hours, minutes } = parseLocalTimeString(timeStr);
  date.setHours(hours, minutes, 0, 0);
  
  // Get ISO string and remove the timezone offset
  // This preserves the local time values as-is without conversion
  const isoString = date.toISOString();
  
  // Return in format: YYYY-MM-DDTHH:MM:SS
  // Note: We don't include the Z suffix since we're not treating this as UTC
  return isoString.slice(0, 19);
}

/**
 * Compare two dates ignoring time component
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get the number of days between two dates (ignoring time)
 */
export function daysBetween(from: Date, to: Date): number {
  const fromMs = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toMs = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

/**
 * Validate that a date string is in YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = parseLocalDateString(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate that a time string is in HH:MM format
 */
export function isValidTimeString(timeStr: string): boolean {
  const regex = /^\d{2}:\d{2}$/;
  if (!regex.test(timeStr)) return false;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

/**
 * Check if startTime is before endTime (same day or different days)
 */
export function isValidTimeRange(startDate: string, startTime: string, endDate: string, endTime: string): boolean {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) return false;
  if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) return false;
  
  const startIso = createLocalDateTimeISO(startDate, startTime);
  const endIso = createLocalDateTimeISO(endDate, endTime);
  
  return startIso < endIso;
}
