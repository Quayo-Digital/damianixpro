/**
 * Channel Manager Integration API Service
 * Handles synchronization with external booking platforms
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { handleError } from '@/utils/errorHandler';

export type ChannelName = 'airbnb' | 'booking_com' | 'expedia' | 'vrbo' | 'custom';
export type SyncDirection = 'to_channel' | 'from_channel' | 'bidirectional';
export type SyncType = 'availability' | 'pricing' | 'booking' | 'full';
export type SyncStatus = 'success' | 'failed' | 'partial';

export interface ChannelIntegration {
  id?: string;
  listing_id: string;
  channel_name: ChannelName;
  channel_listing_id: string;
  sync_enabled: boolean;
  sync_direction: SyncDirection;
  last_sync_at?: string;
  sync_status: 'active' | 'paused' | 'error';
  credentials?: Record<string, unknown>; // Encrypted channel credentials
  settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ChannelSyncLog {
  id?: string;
  integration_id: string;
  sync_type: SyncType;
  direction: 'to_channel' | 'from_channel';
  status: SyncStatus;
  items_synced: number;
  items_failed: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  logId?: string;
}

/**
 * Get all channel integrations for a listing
 */
export async function getChannelIntegrations(listingId: string): Promise<ChannelIntegration[]> {
  try {
    const { data, error } = await supabase
      .from('channel_manager_integrations')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ChannelIntegration[];
  } catch (error) {
    logger.error('Error fetching channel integrations', error);
    throw handleError(error, 'getChannelIntegrations');
  }
}

/**
 * Create a channel integration
 */
export async function createChannelIntegration(
  integration: Omit<ChannelIntegration, 'id' | 'created_at' | 'updated_at'>
): Promise<ChannelIntegration> {
  try {
    const { data, error } = await supabase
      .from('channel_manager_integrations')
      .insert({
        ...integration,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChannelIntegration;
  } catch (error) {
    logger.error('Error creating channel integration', error);
    throw handleError(error, 'createChannelIntegration');
  }
}

/**
 * Update a channel integration
 */
export async function updateChannelIntegration(
  integrationId: string,
  updates: Partial<ChannelIntegration>
): Promise<ChannelIntegration> {
  try {
    const { data, error } = await supabase
      .from('channel_manager_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
      .select()
      .single();

    if (error) throw error;
    return data as ChannelIntegration;
  } catch (error) {
    logger.error('Error updating channel integration', error);
    throw handleError(error, 'updateChannelIntegration');
  }
}

/**
 * Delete a channel integration
 */
export async function deleteChannelIntegration(integrationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('channel_manager_integrations')
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting channel integration', error);
    throw handleError(error, 'deleteChannelIntegration');
  }
}

/**
 * Sync availability to channel
 */
export async function syncAvailabilityToChannel(
  integrationId: string,
  startDate: string,
  endDate: string
): Promise<SyncResult> {
  try {
    const integration = await getChannelIntegration(integrationId);
    if (!integration.sync_enabled) {
      throw new Error('Integration is not enabled');
    }

    // Get availability data
    const { getCalendarView } = await import('./calendar');
    const calendar = await getCalendarView({
      listing_id: integration.listing_id,
      start_date: startDate,
      end_date: endDate,
      include_bookings: true,
    });

    // Transform to channel format
    const channelData = transformToChannelFormat(integration.channel_name, calendar);

    // Sync to channel (this would call the actual channel API)
    const syncResult = await performChannelSync(
      integration,
      'availability',
      'to_channel',
      channelData
    );

    // Log sync
    await logChannelSync({
      integration_id: integrationId,
      sync_type: 'availability',
      direction: 'to_channel',
      status: syncResult.success ? 'success' : 'failed',
      items_synced: syncResult.itemsSynced,
      items_failed: syncResult.itemsFailed,
      error_message: syncResult.errors.join('; '),
    });

    // Update last sync time
    await updateChannelIntegration(integrationId, {
      last_sync_at: new Date().toISOString(),
      sync_status: syncResult.success ? 'active' : 'error',
    });

    return syncResult;
  } catch (error) {
    logger.error('Error syncing availability to channel', error);
    throw handleError(error, 'syncAvailabilityToChannel');
  }
}

/**
 * Sync availability from channel
 */
export async function syncAvailabilityFromChannel(
  integrationId: string,
  startDate: string,
  endDate: string
): Promise<SyncResult> {
  try {
    const integration = await getChannelIntegration(integrationId);
    if (!integration.sync_enabled) {
      throw new Error('Integration is not enabled');
    }

    // Fetch from channel API
    const channelData = await fetchFromChannel(integration, 'availability', startDate, endDate);

    // Transform and save to our database
    const { bulkUpdateAvailability } = await import('./calendar');
    const transformed = transformFromChannelFormat(integration.channel_name, channelData);

    const result = await bulkUpdateAvailability({
      listing_id: integration.listing_id,
      dates: transformed,
    });

    // Log sync
    await logChannelSync({
      integration_id: integrationId,
      sync_type: 'availability',
      direction: 'from_channel',
      status: result.errors.length === 0 ? 'success' : 'partial',
      items_synced: result.created + result.updated,
      items_failed: result.errors.length,
      error_message: result.errors.join('; '),
    });

    // Update last sync time
    await updateChannelIntegration(integrationId, {
      last_sync_at: new Date().toISOString(),
      sync_status: result.errors.length === 0 ? 'active' : 'error',
    });

    return {
      success: result.errors.length === 0,
      itemsSynced: result.created + result.updated,
      itemsFailed: result.errors.length,
      errors: result.errors,
    };
  } catch (error) {
    logger.error('Error syncing availability from channel', error);
    throw handleError(error, 'syncAvailabilityFromChannel');
  }
}

/**
 * Sync pricing to channel
 */
export async function syncPricingToChannel(
  integrationId: string,
  startDate: string,
  endDate: string
): Promise<SyncResult> {
  try {
    const integration = await getChannelIntegration(integrationId);

    // Get pricing data
    const { getDatePricing } = await import('./pricing');
    const pricing = await getDatePricing(integration.listing_id, startDate, endDate);

    // Transform to channel format
    const channelData = pricing.map((p) => ({
      date: p.date,
      price: p.price,
      available: p.available,
    }));

    // Sync to channel
    const syncResult = await performChannelSync(integration, 'pricing', 'to_channel', channelData);

    // Log sync
    await logChannelSync({
      integration_id: integrationId,
      sync_type: 'pricing',
      direction: 'to_channel',
      status: syncResult.success ? 'success' : 'failed',
      items_synced: syncResult.itemsSynced,
      items_failed: syncResult.itemsFailed,
      error_message: syncResult.errors.join('; '),
    });

    return syncResult;
  } catch (error) {
    logger.error('Error syncing pricing to channel', error);
    throw handleError(error, 'syncPricingToChannel');
  }
}

/**
 * Get channel integration by ID
 */
async function getChannelIntegration(integrationId: string): Promise<ChannelIntegration> {
  const { data, error } = await supabase
    .from('channel_manager_integrations')
    .select('*')
    .eq('id', integrationId)
    .single();

  if (error) throw error;
  return data as ChannelIntegration;
}

/**
 * Log channel sync operation
 */
async function logChannelSync(
  log: Omit<ChannelSyncLog, 'id' | 'created_at'>
): Promise<ChannelSyncLog> {
  const { data, error } = await supabase.from('channel_sync_logs').insert(log).select().single();

  if (error) throw error;
  return data as ChannelSyncLog;
}

/**
 * Get sync logs for an integration
 */
export async function getChannelSyncLogs(
  integrationId: string,
  limit: number = 50
): Promise<ChannelSyncLog[]> {
  try {
    const { data, error } = await supabase
      .from('channel_sync_logs')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ChannelSyncLog[];
  } catch (error) {
    logger.error('Error fetching sync logs', error);
    throw handleError(error, 'getChannelSyncLogs');
  }
}

/**
 * Transform calendar data to channel format
 */
function transformToChannelFormat(channelName: ChannelName, calendar: any): any {
  // This would transform our calendar format to the specific channel's API format
  // Implementation depends on channel API requirements
  switch (channelName) {
    case 'airbnb':
      return {
        // Airbnb API format
        calendar: calendar.dates.map((d: any) => ({
          date: d.date,
          available: d.available,
          price: d.price,
        })),
      };
    case 'booking_com':
      return {
        // Booking.com API format
        availability: calendar.dates.map((d: any) => ({
          date: d.date,
          available: d.available ? 1 : 0,
          price: d.price,
        })),
      };
    default:
      return calendar;
  }
}

/**
 * Transform channel data to our format
 */
function transformFromChannelFormat(
  channelName: ChannelName,
  channelData: any
): Array<{
  start_date: string;
  end_date: string;
  available: boolean;
  source: 'external';
  source_id?: string;
  notes?: string;
}> {
  // Transform channel-specific format to our availability format
  // This is a simplified version - actual implementation would handle channel-specific formats
  return [];
}

/**
 * Perform actual channel sync (placeholder - would call real channel APIs)
 */
async function performChannelSync(
  integration: ChannelIntegration,
  syncType: SyncType,
  direction: 'to_channel' | 'from_channel',
  data: any
): Promise<SyncResult> {
  // This would make actual API calls to the channel
  // For now, return a mock result
  logger.info('Channel sync', {
    channel: integration.channel_name,
    type: syncType,
    direction,
    items: Array.isArray(data) ? data.length : 1,
  });

  // TODO: Implement actual channel API calls
  // Example:
  // if (integration.channel_name === 'airbnb') {
  //   return await syncToAirbnb(integration, data);
  // }

  return {
    success: true,
    itemsSynced: Array.isArray(data) ? data.length : 1,
    itemsFailed: 0,
    errors: [],
  };
}

/**
 * Fetch data from channel (placeholder)
 */
async function fetchFromChannel(
  integration: ChannelIntegration,
  type: SyncType,
  startDate: string,
  endDate: string
): Promise<any> {
  // This would fetch data from the channel API
  // TODO: Implement actual channel API calls
  logger.info('Fetching from channel', {
    channel: integration.channel_name,
    type,
    startDate,
    endDate,
  });

  return [];
}
