/**
 * iCal Import/Export Utilities
 * Handles calendar synchronization with external systems (Airbnb, Booking.com, etc.)
 */

import { Availability } from '../types';
import { createAvailability, getListingAvailability } from '../api/calendar';

// ============================================================================
// iCal Export
// ============================================================================

/**
 * Generate iCal format string for listing availability
 */
export function generateICal(listingId: string, availabilities: Availability[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DamianixPro//Short-Let Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n') + '\r\n';

  // Add blocked dates as events
  for (const availability of availabilities) {
    if (!availability.available) {
      const start = new Date(availability.start_date).toISOString()
        .replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(new Date(availability.end_date).getTime() + 86400000)
        .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      ical += [
        'BEGIN:VEVENT',
        `UID:${listingId}-${availability.id}@damianixpro.com`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `DTSTAMP:${now}`,
        `SUMMARY:Blocked - ${availability.notes || 'Unavailable'}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    }
  }

  ical += 'END:VCALENDAR\r\n';
  return ical;
}

/**
 * Export listing calendar as iCal file
 */
export async function exportListingCalendar(listingId: string): Promise<string> {
  const availabilities = await getListingAvailability(listingId);
  return generateICal(listingId, availabilities);
}

// ============================================================================
// iCal Import
// ============================================================================

interface ParsedICalEvent {
  start: Date;
  end: Date;
  summary?: string;
  uid?: string;
}

/**
 * Parse iCal string
 */
export function parseICal(icalString: string): ParsedICalEvent[] {
  const events: ParsedICalEvent[] = [];
  const lines = icalString.split(/\r?\n/);
  
  let currentEvent: Partial<ParsedICalEvent> | null = null;
  let inEvent = false;

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.start && currentEvent.end) {
        events.push({
          start: currentEvent.start,
          end: currentEvent.end,
          summary: currentEvent.summary,
          uid: currentEvent.uid
        });
      }
      inEvent = false;
      currentEvent = null;
    } else if (inEvent && currentEvent) {
      if (line.startsWith('DTSTART:')) {
        const dateStr = line.substring(8).replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
        currentEvent.start = new Date(dateStr);
      } else if (line.startsWith('DTEND:')) {
        const dateStr = line.substring(6).replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
        currentEvent.end = new Date(dateStr);
      } else if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('UID:')) {
        currentEvent.uid = line.substring(4);
      }
    }
  }

  return events;
}

/**
 * Import iCal events as blocked dates
 */
export async function importICalToAvailability(
  listingId: string,
  icalString: string,
  source: string = 'external'
): Promise<{
  imported: number;
  errors: string[];
}> {
  const events = parseICal(icalString);
  const errors: string[] = [];
  let imported = 0;

  for (const event of events) {
    try {
      const startDate = event.start.toISOString().split('T')[0];
      const endDate = new Date(event.end.getTime() - 86400000).toISOString().split('T')[0]; // Subtract 1 day

      await createAvailability({
        listing_id: listingId,
        start_date: startDate,
        end_date: endDate,
        available: false,
        source: source as any,
        source_id: event.uid,
        notes: event.summary || `Imported from ${source}`
      });

      imported++;
    } catch (error) {
      errors.push(
        `Failed to import event ${event.uid || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return { imported, errors };
}

/**
 * Sync external calendar (placeholder for future channel manager integration)
 */
export async function syncExternalCalendar(
  listingId: string,
  provider: 'airbnb' | 'booking.com' | 'other',
  calendarUrl?: string
): Promise<{
  success: boolean;
  synced: number;
  error?: string;
}> {
  // This would fetch iCal from external provider and import
  // For now, return placeholder
  return {
    success: false,
    synced: 0,
    error: 'External calendar sync not yet implemented'
  };
}

