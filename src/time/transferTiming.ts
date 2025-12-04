/**
 * Transfer timing estimation utilities
 * 
 * This module provides functions to estimate arrival times for different
 * transfer speeds, accounting for business days, weekends, and cutoff times.
 */

import { TransferSpeed } from '../types/index.js';
import { isBusinessDay, addBusinessDays, getNextBusinessDay } from './businessDays.js';

/**
 * EST timezone offset in hours (UTC-5)
 * Note: This is a simplified implementation that doesn't account for DST
 */
const EST_OFFSET_HOURS = -5;
const EST_OFFSET_MS = EST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Helper to get EST date components from a UTC date
 */
function getESTComponents(date: Date): { year: number; month: number; day: number } {
  const estMs = date.getTime() + EST_OFFSET_MS;
  const estDate = new Date(estMs);
  
  return {
    year: estDate.getUTCFullYear(),
    month: estDate.getUTCMonth(),
    day: estDate.getUTCDate()
  };
}

/**
 * Helper to create a UTC date from EST components
 */
function createUTCFromEST(year: number, month: number, day: number, hour: number = 0): Date {
  const estDate = new Date(Date.UTC(year, month, day, hour, 0, 0, 0));
  return new Date(estDate.getTime() - EST_OFFSET_MS);
}

/**
 * Cutoff time for same-day and 1-day transfers (5pm EST = 17:00)
 */
const CUTOFF_HOUR_EST = 17;

/**
 * Converts a date to EST timezone and returns the hour in EST
 * 
 * @param date - The date to convert
 * @returns The hour in EST (0-23)
 */
function getHourInEST(date: Date): number {
  // Get UTC hour
  const utcHour = date.getUTCHours();
  
  // Convert to EST
  let estHour = utcHour + EST_OFFSET_HOURS;
  
  // Handle day boundary wrapping
  if (estHour < 0) {
    estHour += 24;
  } else if (estHour >= 24) {
    estHour -= 24;
  }
  
  return estHour;
}

/**
 * Checks if a date/time is before the 5pm EST cutoff on a business day
 * 
 * @param date - The date to check
 * @returns true if it's a business day before 5pm EST
 */
function isBeforeCutoff(date: Date): boolean {
  // Convert to EST to check the correct calendar day
  const estTime = new Date(date.getTime() - (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
  
  if (!isBusinessDay(estTime)) {
    return false;
  }
  
  const hourEST = getHourInEST(date);
  return hourEST < CUTOFF_HOUR_EST;
}

/**
 * Gets the end of the current business day (5pm EST)
 * If the date is not a business day, moves to the next business day first
 * 
 * @param date - The current date
 * @returns A new Date set to 5pm EST on the same EST calendar day (or next business day if weekend)
 */
function getEndOfBusinessDay(date: Date): Date {
  // Convert to EST to check if it's a business day
  const estTime = new Date(date.getTime() - (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
  
  // First, ensure we're working with a business day in EST
  let workingEstTime = estTime;
  if (!isBusinessDay(workingEstTime)) {
    workingEstTime = getNextBusinessDay(workingEstTime);
  }
  
  // Get the EST calendar date components (treating the adjusted time as UTC to get the right calendar day)
  const estYear = workingEstTime.getUTCFullYear();
  const estMonth = workingEstTime.getUTCMonth();
  const estDay = workingEstTime.getUTCDate();
  
  // Create a new date at 5pm EST on that EST calendar day
  // 5pm EST = 17:00 EST, which in UTC is 22:00 (17 + 5)
  const result = new Date(Date.UTC(estYear, estMonth, estDay, CUTOFF_HOUR_EST - EST_OFFSET_HOURS, 0, 0, 0));
  
  return result;
}

/**
 * Estimates arrival time for instant transfers
 * Instant transfers complete within 5 minutes, available 24/7 including weekends
 * 
 * @param initiationTime - When the transfer is initiated
 * @returns Estimated arrival time (current time + 5 minutes)
 * 
 * Requirements: 4.1, 9.4
 */
export function estimateInstantArrival(initiationTime: Date): Date {
  const arrival = new Date(initiationTime);
  arrival.setMinutes(arrival.getMinutes() + 5);
  return arrival;
}

/**
 * Estimates arrival time for same-day transfers
 * - If initiated before 5pm EST on a business day: end of current business day
 * - If initiated after 5pm EST or on a weekend: end of next business day
 * 
 * @param initiationTime - When the transfer is initiated
 * @returns Estimated arrival time
 * 
 * Requirements: 4.2, 4.3
 */
export function estimateSameDayArrival(initiationTime: Date): Date {
  if (isBeforeCutoff(initiationTime)) {
    // Before 5pm EST on a business day - arrives end of current business day
    return getEndOfBusinessDay(initiationTime);
  } else {
    // After 5pm EST or on a weekend - arrives end of next business day
    // Convert to EST to get next business day
    const estTime = new Date(initiationTime.getTime() - (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
    const nextBusinessDay = getNextBusinessDay(estTime);
    
    // Convert back to UTC
    const utcNext = new Date(nextBusinessDay.getTime() + (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
    return getEndOfBusinessDay(utcNext);
  }
}

/**
 * Estimates arrival time for 1-day ACH transfers
 * - If initiated Mon-Thu before 5pm EST: next business day
 * - If initiated Fri-Sun: Tuesday
 * 
 * @param initiationTime - When the transfer is initiated
 * @returns Estimated arrival time
 * 
 * Requirements: 4.4, 4.5, 9.3
 */
export function estimateOneDayArrival(initiationTime: Date): Date {
  // Convert to EST to get the correct calendar day
  const estTime = new Date(initiationTime.getTime() - (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
  const dayOfWeek = estTime.getUTCDay();
  
  // Check if it's Friday (5), Saturday (6), or Sunday (0) in EST
  const isFridayOrWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  
  // Also check if it's Thursday after 5pm EST (which effectively becomes Friday)
  const isThursdayAfterCutoff = dayOfWeek === 4 && !isBeforeCutoff(initiationTime);
  
  if (isFridayOrWeekend || isThursdayAfterCutoff) {
    // Initiated Fri-Sun (or Thu after 5pm) -> arrives Tuesday
    // Find the next Monday first in EST
    let result = new Date(estTime);
    
    // Advance to Monday
    while (result.getUTCDay() !== 1) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
    
    // Then add one more day to get to Tuesday
    result.setUTCDate(result.getUTCDate() + 1);
    
    // Convert back to UTC and get end of business day
    const utcResult = new Date(result.getTime() + (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
    return getEndOfBusinessDay(utcResult);
  } else {
    // Mon-Thu before 5pm EST -> next business day
    const nextBusinessDay = getNextBusinessDay(estTime);
    // Convert back to UTC
    const utcNext = new Date(nextBusinessDay.getTime() + (EST_OFFSET_HOURS * -1 * 60 * 60 * 1000));
    return getEndOfBusinessDay(utcNext);
  }
}

/**
 * Estimates arrival time for 3-day ACH transfers
 * Adds 3 business days to the current time, skipping weekends
 * 
 * @param initiationTime - When the transfer is initiated
 * @returns Estimated arrival time
 * 
 * Requirements: 4.6
 */
export function estimateThreeDayArrival(initiationTime: Date): Date {
  // Work in EST timezone by treating UTC dates as EST dates
  // This avoids double conversion issues
  const estComponents = getESTComponents(initiationTime);
  const estAsUTC = createUTCFromEST(estComponents.year, estComponents.month, estComponents.day);
  
  // Add 3 business days
  const arrivalDay = addBusinessDays(estAsUTC, 3);
  
  // Set to end of business day (5pm EST = 22:00 UTC)
  arrivalDay.setUTCHours(22, 0, 0, 0);
  
  return arrivalDay;
}

/**
 * Main function to estimate arrival time based on transfer speed
 * Dispatches to the appropriate estimation function based on the transfer method
 * 
 * @param transferSpeed - The speed/method of the transfer
 * @param initiationTime - When the transfer is initiated
 * @returns Estimated arrival time
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function estimateArrivalTime(
  transferSpeed: TransferSpeed,
  initiationTime: Date
): Date {
  switch (transferSpeed) {
    case TransferSpeed.INSTANT:
      return estimateInstantArrival(initiationTime);
    
    case TransferSpeed.SAME_DAY:
      return estimateSameDayArrival(initiationTime);
    
    case TransferSpeed.ONE_DAY:
      return estimateOneDayArrival(initiationTime);
    
    case TransferSpeed.THREE_DAY:
      return estimateThreeDayArrival(initiationTime);
    
    default:
      throw new Error(`Unknown transfer speed: ${transferSpeed}`);
  }
}
