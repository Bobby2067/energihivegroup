import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { enAU } from "date-fns/locale";

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Australian Date/Time Formatting
 */

// Australian time zones
export const TIMEZONE = {
  AEST: "Australia/Sydney", // Australian Eastern Standard Time (UTC+10)
  AEDT: "Australia/Sydney", // Australian Eastern Daylight Time (UTC+11)
  ACST: "Australia/Adelaide", // Australian Central Standard Time (UTC+9:30)
  ACDT: "Australia/Adelaide", // Australian Central Daylight Time (UTC+10:30)
  AWST: "Australia/Perth", // Australian Western Standard Time (UTC+8)
};

/**
 * Format a date for Australian locale
 * 
 * @param date - Date to format
 * @param formatStr - Format string (defaults to Australian date format)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  formatStr = "dd/MM/yyyy"
): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) return "Invalid Date";
  
  return format(dateObj, formatStr, { locale: enAU });
}

/**
 * Format a date with time for Australian locale
 * 
 * @param date - Date to format
 * @param formatStr - Format string (defaults to Australian date and time format)
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  formatStr = "dd/MM/yyyy h:mm a"
): string {
  return formatDate(date, formatStr);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * 
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined
): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  if (!isValid(dateObj)) return "Invalid Date";
  
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: enAU });
}

/**
 * Convert a date to Australian time zone
 * 
 * @param date - Date to convert
 * @param timezone - Australian time zone
 * @returns Date in Australian time zone
 */
export function toAustralianTime(
  date: Date | string | number,
  timezone: string = TIMEZONE.AEST
): Date {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  
  return new Date(
    dateObj.toLocaleString("en-AU", { timeZone: timezone })
  );
}

/**
 * Check if a time is during peak hours (typically 2pm-8pm in Australia)
 * 
 * @param date - Date to check
 * @returns Whether the time is during peak hours
 */
export function isDuringPeakHours(date: Date | string | number): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  const hours = dateObj.getHours();
  
  // Peak hours are typically 2pm-8pm in Australia
  return hours >= 14 && hours < 20;
}

/**
 * Check if a time is during shoulder hours (typically 7am-2pm, 8pm-10pm in Australia)
 * 
 * @param date - Date to check
 * @returns Whether the time is during shoulder hours
 */
export function isDuringShoulderHours(date: Date | string | number): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  const hours = dateObj.getHours();
  
  // Shoulder hours are typically 7am-2pm, 8pm-10pm in Australia
  return (hours >= 7 && hours < 14) || (hours >= 20 && hours < 22);
}

/**
 * Check if a time is during off-peak hours (typically 10pm-7am in Australia)
 * 
 * @param date - Date to check
 * @returns Whether the time is during off-peak hours
 */
export function isDuringOffPeakHours(date: Date | string | number): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  const hours = dateObj.getHours();
  
  // Off-peak hours are typically 10pm-7am in Australia
  return hours >= 22 || hours < 7;
}

/**
 * Get the current time-of-use period for Australian electricity
 * 
 * @param date - Date to check (defaults to now)
 * @returns Time-of-use period: 'peak', 'shoulder', or 'off-peak'
 */
export function getCurrentTOU(date: Date | string | number = new Date()): 'peak' | 'shoulder' | 'off-peak' {
  if (isDuringPeakHours(date)) return 'peak';
  if (isDuringShoulderHours(date)) return 'shoulder';
  return 'off-peak';
}

/**
 * Australian Currency Formatting
 */

/**
 * Format a number as Australian dollars
 * 
 * @param amount - Amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatAUD(
  amount: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === null || amount === undefined) return "N/A";
  
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Format a number as Australian dollars without cents
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string without cents
 */
export function formatAUDWithoutCents(
  amount: number | null | undefined
): string {
  if (amount === null || amount === undefined) return "N/A";
  
  return formatAUD(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format a number as Australian dollars with compact notation
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string with compact notation
 */
export function formatAUDCompact(
  amount: number | null | undefined
): string {
  if (amount === null || amount === undefined) return "N/A";
  
  return formatAUD(amount, {
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/**
 * Calculate GST (10% in Australia)
 * 
 * @param amount - Amount to calculate GST for
 * @returns GST amount
 */
export function calculateGST(amount: number): number {
  return Math.round((amount * 0.1) * 100) / 100; // 10% GST rounded to 2 decimal places
}

/**
 * Battery Level Calculations
 */

/**
 * Get battery level category based on percentage
 * 
 * @param percentage - Battery level percentage (0-100)
 * @returns Battery level category
 */
export function getBatteryLevelCategory(percentage: number): 'critical' | 'low' | 'medium' | 'high' | 'full' {
  if (percentage <= 10) return 'critical';
  if (percentage <= 25) return 'low';
  if (percentage <= 60) return 'medium';
  if (percentage <= 90) return 'high';
  return 'full';
}

/**
 * Get battery level color based on percentage
 * 
 * @param percentage - Battery level percentage (0-100)
 * @returns CSS variable for battery level color
 */
export function getBatteryLevelColor(percentage: number): string {
  const category = getBatteryLevelCategory(percentage);
  
  switch (category) {
    case 'critical': return 'var(--battery-critical)';
    case 'low': return 'var(--battery-low)';
    case 'medium': return 'var(--battery-medium)';
    case 'high': return 'var(--battery-high)';
    case 'full': return 'var(--battery-full)';
  }
}

/**
 * Get battery level class based on percentage
 * 
 * @param percentage - Battery level percentage (0-100)
 * @returns CSS class for battery level
 */
export function getBatteryLevelClass(percentage: number): string {
  const category = getBatteryLevelCategory(percentage);
  return `battery-${category}`;
}

/**
 * Calculate remaining battery runtime based on current load
 * 
 * @param batteryLevelPercent - Battery level percentage (0-100)
 * @param batteryCapacityKWh - Total battery capacity in kWh
 * @param currentLoadKW - Current load in kW
 * @returns Estimated runtime in hours
 */
export function calculateBatteryRuntime(
  batteryLevelPercent: number,
  batteryCapacityKWh: number,
  currentLoadKW: number
): number {
  if (currentLoadKW <= 0) return Infinity;
  
  const availableCapacity = (batteryLevelPercent / 100) * batteryCapacityKWh;
  return availableCapacity / currentLoadKW;
}

/**
 * Energy Unit Conversions
 */

/**
 * Convert watt-hours to kilowatt-hours
 * 
 * @param wh - Watt-hours
 * @returns Kilowatt-hours
 */
export function whToKWh(wh: number): number {
  return wh / 1000;
}

/**
 * Convert kilowatt-hours to watt-hours
 * 
 * @param kwh - Kilowatt-hours
 * @returns Watt-hours
 */
export function kwhToWh(kwh: number): number {
  return kwh * 1000;
}

/**
 * Convert watts to kilowatts
 * 
 * @param w - Watts
 * @returns Kilowatts
 */
export function wToKW(w: number): number {
  return w / 1000;
}

/**
 * Convert kilowatts to watts
 * 
 * @param kw - Kilowatts
 * @returns Watts
 */
export function kwToW(kw: number): number {
  return kw * 1000;
}

/**
 * Format energy value with appropriate units
 * 
 * @param value - Energy value
 * @param unit - Energy unit ('wh', 'kwh', 'w', 'kw')
 * @returns Formatted energy string
 */
export function formatEnergy(
  value: number,
  unit: 'wh' | 'kwh' | 'w' | 'kw' = 'kwh'
): string {
  if (value === null || value === undefined) return "N/A";
  
  const formattedValue = value.toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  switch (unit.toLowerCase()) {
    case 'wh': return `${formattedValue} Wh`;
    case 'kwh': return `${formattedValue} kWh`;
    case 'w': return `${formattedValue} W`;
    case 'kw': return `${formattedValue} kW`;
    default: return `${formattedValue} ${unit}`;
  }
}

/**
 * Format power flow direction
 * 
 * @param value - Power value (positive for import, negative for export)
 * @returns Formatted power flow string
 */
export function formatPowerFlow(value: number): string {
  if (value === 0) return "No flow";
  if (value > 0) return `Importing ${formatEnergy(Math.abs(value), 'w')}`;
  return `Exporting ${formatEnergy(Math.abs(value), 'w')}`;
}

/**
 * Calculate cost of energy based on rate
 * 
 * @param kwh - Energy in kilowatt-hours
 * @param rate - Rate in cents per kilowatt-hour
 * @returns Cost in dollars
 */
export function calculateEnergyCost(kwh: number, rate: number): number {
  return (kwh * rate) / 100; // Convert cents to dollars
}

/**
 * Validation Helpers
 */

/**
 * Validate an Australian postal code
 * 
 * @param postalCode - Postal code to validate
 * @returns Whether the postal code is valid
 */
export function isValidAustralianPostalCode(postalCode: string): boolean {
  return /^\d{4}$/.test(postalCode);
}

/**
 * Validate an Australian phone number
 * 
 * @param phone - Phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidAustralianPhone(phone: string): boolean {
  return /^(\+61|0)[2-478](\d{8}|\d{4}\s\d{4})$/.test(phone);
}

/**
 * Validate an Australian ABN (Australian Business Number)
 * 
 * @param abn - ABN to validate
 * @returns Whether the ABN is valid
 */
export function isValidABN(abn: string): boolean {
  // Remove spaces and check length
  const cleanABN = abn.replace(/\s/g, '');
  if (cleanABN.length !== 11 || !/^\d+$/.test(cleanABN)) return false;
  
  // ABN validation algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;
  
  // Subtract 1 from first digit
  const digits = cleanABN.split('').map(Number);
  digits[0] -= 1;
  
  // Calculate weighted sum
  for (let i = 0; i < weights.length; i++) {
    sum += digits[i] * weights[i];
  }
  
  return sum % 89 === 0;
}

/**
 * Validate an Australian NMI (National Metering Identifier)
 * 
 * @param nmi - NMI to validate
 * @returns Whether the NMI is valid
 */
export function isValidNMI(nmi: string): boolean {
  // NMI is 10 digits for Australian electricity meters
  return /^\d{10}$/.test(nmi);
}

/**
 * Common UI Utilities
 */

/**
 * Truncate text with ellipsis
 * 
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return `${text.substring(0, length)}...`;
}

/**
 * Generate initials from a name
 * 
 * @param name - Name to generate initials from
 * @returns Initials
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return name.substring(0, 2).toUpperCase();
  
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Debounce a function
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get a random item from an array
 * 
 * @param array - Array to get random item from
 * @returns Random item
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Check if a device is a mobile device
 * 
 * @returns Whether the device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  );
}

/**
 * Get browser locale
 * 
 * @returns Browser locale
 */
export function getBrowserLocale(): string {
  if (typeof window === 'undefined') return 'en-AU';
  
  return window.navigator.language || 'en-AU';
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * 
 * @param value - Value to check
 * @returns Whether the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  
  return false;
}

/**
 * Calculate average of an array of numbers
 * 
 * @param numbers - Array of numbers
 * @returns Average
 */
export function calculateAverage(numbers: number[]): number {
  if (!numbers.length) return 0;
  
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
}

/**
 * Sleep for a specified duration
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert a string to title case
 * 
 * @param str - String to convert
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a camelCase string to a human-readable string
 * 
 * @param str - String to convert
 * @returns Human-readable string
 */
export function camelCaseToHuman(str: string): string {
  if (!str) return '';
  
  const result = str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
    
  return result;
}
