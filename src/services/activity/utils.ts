// Helper functions for activity service

import { toast } from '@/components/ui/sonner';

/**
 * Validate and sanitize pagination parameters
 */
export const validatePaginationParams = (
  page: number,
  pageSize: number
): { page: number; pageSize: number } => {
  // Ensure positive integers for pagination parameters
  const validPage = Math.max(1, Math.floor(Number(page) || 1));
  const validPageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 10)));

  return { page: validPage, pageSize: validPageSize };
};

/**
 * Safely format date strings
 */
export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Validate activity data before submission
 */
export const validateActivityData = (
  activity: Omit<import('./types').ActivityItem, 'id' | 'date'>
): { valid: boolean; message?: string } => {
  if (!activity) {
    return { valid: false, message: 'No activity data provided' };
  }

  if (!activity.type || !activity.type.trim()) {
    return { valid: false, message: 'Activity type is required' };
  }

  if (!activity.description || !activity.description.trim()) {
    return { valid: false, message: 'Activity description is required' };
  }

  // Validate amount if provided
  if (activity.amount && typeof activity.amount !== 'string') {
    return { valid: false, message: 'Amount must be a string' };
  }

  return { valid: true };
};

/**
 * Display and log error messages
 */
export const handleServiceError = (error: unknown, friendlyMessage: string): void => {
  // More descriptive error messages based on error type
  if (error instanceof Error) {
    if (error.message.includes('JWT')) {
      toast.error('Authentication error: Your session has expired. Please log in again.');
    } else if (error.message.includes('network')) {
      toast.error('Network error: Please check your connection and try again.');
    } else if (error.message.includes('Database error')) {
      toast.error('Database error occurred. Please try again later.');
    } else {
      // Avoid exposing detailed error messages to users
      toast.error(friendlyMessage);
      // Log the actual error for debugging
      console.error(`Detailed error: ${error.message}`);
    }
  } else {
    toast.error(friendlyMessage);
  }
};
