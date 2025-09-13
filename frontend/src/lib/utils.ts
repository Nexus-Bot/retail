import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format timeline entry dates based on groupBy period
 * Handles different date formats returned by analytics API
 */
export const formatTimelineDate = (dateId: string, groupBy: string): string => {
  try {
    // Handle different groupBy formats
    if (groupBy === 'week') {
      // Format: "2024-W12" -> "Week 12, 2024"
      const [year, week] = dateId.split('-W');
      return `Week ${week}, ${year}`;
    } else if (groupBy === 'month') {
      // Format: "2024-03" -> "March 2024"
      const [year, month] = dateId.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return format(date, 'MMMM yyyy');
    } else if (groupBy === 'year') {
      // Format: "2024" -> "2024"
      return dateId;
    } else {
      // Default: treat as regular date for daily
      return format(new Date(dateId), 'MMM dd, yyyy');
    }
  } catch {
    // Fallback to original string if parsing fails
    return dateId;
  }
};

/**
 * Format currency with Indian Rupee symbol
 * Handles undefined/null values gracefully
 */
export const formatCurrency = (amount: number | undefined): string => {
  return `₹${(amount || 0).toLocaleString()}`;
};
