// API functions for interacting with activity data

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ActivityItem } from './types';
import {
  validatePaginationParams,
  formatDate,
  validateActivityData,
  handleServiceError,
} from './utils';

/**
 * Fetch activities with pagination
 */
export const fetchActivities = async (
  page = 1,
  pageSize = 10
): Promise<{ data: ActivityItem[]; count: number }> => {
  try {
    // Validate and sanitize input parameters
    const { page: validPage, pageSize: validPageSize } = validatePaginationParams(page, pageSize);

    const startIndex = (validPage - 1) * validPageSize;

    // First, get the total count for pagination purposes
    const { count, error: countError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting activities:', countError);
      throw new Error(`Database error: ${countError.message}`);
    }

    // Then fetch the actual data for the page using parameterized query
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false })
      .range(startIndex, startIndex + validPageSize - 1);

    if (error) {
      console.error('Error fetching activities:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) throw new Error('No data returned from database');

    // Format the data to match the ActivityItem interface
    const formattedData = data.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      // Format the date in a readable format with error handling
      date: formatDate(item.date),
      amount: item.amount,
      property: item.property,
      location: item.location,
    }));

    return { data: formattedData, count: count || 0 };
  } catch (error) {
    console.error('Error fetching activities:', error);
    handleServiceError(error, 'Failed to load activities. Please try again later.');

    // Return empty data with zero count for consistent return type
    return { data: [], count: 0 };
  }
};

/**
 * Add a new activity
 */
export const addActivity = async (
  activity: Omit<ActivityItem, 'id' | 'date'>
): Promise<boolean> => {
  try {
    // Validate input data
    const validation = validateActivityData(activity);
    if (!validation.valid) {
      toast.error(validation.message || 'Invalid activity data');
      return false;
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error fetching user:', userError);
      toast.error('Authentication error. Please log in again.');
      return false;
    }

    if (!user) {
      toast.error('You must be logged in to record an activity');
      return false;
    }

    // Prepare sanitized data for insertion
    const sanitizedActivity = {
      type: activity.type.trim(),
      description: activity.description.trim(),
      amount: activity.amount ? activity.amount.trim() : null,
      property: activity.property ? activity.property.trim() : null,
      location: activity.location ? activity.location.trim() : null,
      user_id: user.id,
    };

    // Add the activity with retry logic
    const maxRetries = 3;
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      const { error } = await supabase.from('activities').insert(sanitizedActivity);

      if (!error) {
        success = true;
      } else {
        console.error(`Attempt ${retries + 1} failed:`, error);
        retries++;

        if (retries >= maxRetries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }

    toast.success('Activity recorded successfully');
    return true;
  } catch (error) {
    console.error('Error adding activity:', error);
    handleServiceError(error, 'Failed to record activity. Please try again later.');
    return false;
  }
};

/**
 * Check if any activities exist for the current user
 */
export const checkActivitiesExist = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    const { count, error } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking activities:', error);
    return false;
  }
};
