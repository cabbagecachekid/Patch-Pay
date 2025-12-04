/**
 * Business day utilities for transfer timing calculations
 * 
 * Business days are Monday through Friday (excluding weekends).
 * This module provides functions to check if a date is a business day,
 * add business days to a date, and get the next business day.
 */

/**
 * Checks if a given date falls on a business day (Monday-Friday)
 * 
 * @param date - The date to check
 * @returns true if the date is Monday-Friday, false if Saturday-Sunday
 * 
 * Requirements: 9.1, 9.2
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getUTCDay();
  // 0 = Sunday, 6 = Saturday
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Adds a specified number of business days to a date, skipping weekends
 * 
 * @param startDate - The starting date
 * @param days - Number of business days to add (must be >= 0)
 * @returns A new Date object representing the result
 * 
 * Requirements: 9.1, 9.2
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  if (days < 0) {
    throw new Error("Number of business days must be non-negative");
  }

  const result = new Date(startDate);
  let remainingDays = days;

  while (remainingDays > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    
    if (isBusinessDay(result)) {
      remainingDays--;
    }
  }

  return result;
}

/**
 * Gets the next business day after a given date
 * If the date is already a business day, returns the next business day
 * 
 * @param date - The starting date
 * @returns A new Date object representing the next business day
 * 
 * Requirements: 9.1, 9.2
 */
export function getNextBusinessDay(date: Date): Date {
  const result = new Date(date);
  
  // Move to the next day
  result.setUTCDate(result.getUTCDate() + 1);
  
  // Keep advancing until we hit a business day
  while (!isBusinessDay(result)) {
    result.setUTCDate(result.getUTCDate() + 1);
  }
  
  return result;
}
