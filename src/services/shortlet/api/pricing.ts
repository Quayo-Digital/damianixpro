/**
 * Dynamic Pricing API Service
 * Handles date-specific pricing, pricing rules, and price calculations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { handleError } from '@/utils/errorHandler';

export interface DatePricing {
  id?: string;
  listing_id: string;
  date: string;
  price: number;
  min_nights?: number;
  max_nights?: number;
  available: boolean;
  source?: 'manual' | 'channel_manager' | 'pricing_rule';
  source_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PricingRule {
  id?: string;
  listing_id: string;
  rule_name: string;
  rule_type: 'seasonal' | 'demand' | 'day_of_week' | 'advance_booking' | 'length_of_stay';
  rule_config: {
    // Seasonal
    start_month?: number;
    end_month?: number;
    price_multiplier?: number;
    // Day of week
    days_of_week?: number[]; // 0-6
    price_adjustment?: number; // Percentage or fixed amount
    // Advance booking
    days_in_advance?: number;
    discount_percent?: number;
    // Length of stay
    min_nights?: number;
    discount_per_night?: number;
    // Demand-based
    occupancy_threshold?: number;
    price_increase_percent?: number;
  };
  priority: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get pricing for a date range
 */
export async function getDatePricing(
  listingId: string,
  startDate: string,
  endDate: string
): Promise<DatePricing[]> {
  try {
    const { data, error } = await supabase
      .from('listing_pricing')
      .select('*')
      .eq('listing_id', listingId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []) as DatePricing[];
  } catch (error) {
    logger.error('Error fetching date pricing', error);
    throw handleError(error, 'getDatePricing');
  }
}

/**
 * Get pricing for a specific date
 */
export async function getDatePrice(listingId: string, date: string): Promise<DatePricing | null> {
  try {
    const { data, error } = await supabase
      .from('listing_pricing')
      .select('*')
      .eq('listing_id', listingId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data as DatePricing | null;
  } catch (error) {
    logger.error('Error fetching date price', error);
    throw handleError(error, 'getDatePrice');
  }
}

/**
 * Set pricing for a single date
 */
export async function setDatePrice(
  pricing: Omit<DatePricing, 'id' | 'created_at' | 'updated_at'>
): Promise<DatePricing> {
  try {
    const { data, error } = await supabase
      .from('listing_pricing')
      .upsert(
        {
          listing_id: pricing.listing_id,
          date: pricing.date,
          price: pricing.price,
          min_nights: pricing.min_nights,
          max_nights: pricing.max_nights,
          available: pricing.available,
          source: pricing.source || 'manual',
          source_id: pricing.source_id,
          notes: pricing.notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'listing_id,date',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data as DatePricing;
  } catch (error) {
    logger.error('Error setting date price', error);
    throw handleError(error, 'setDatePrice');
  }
}

/**
 * Bulk set pricing for multiple dates
 */
export async function bulkSetDatePricing(
  listingId: string,
  pricing: Array<Omit<DatePricing, 'id' | 'listing_id' | 'created_at' | 'updated_at'>>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const price of pricing) {
    try {
      await setDatePrice({
        ...price,
        listing_id: listingId,
      });
      success++;
    } catch (error) {
      logger.error('Error setting price for date', error, { date: price.date });
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Delete pricing for a date
 */
export async function deleteDatePrice(listingId: string, date: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('listing_pricing')
      .delete()
      .eq('listing_id', listingId)
      .eq('date', date);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting date price', error);
    throw handleError(error, 'deleteDatePrice');
  }
}

/**
 * Calculate price for a date range considering all pricing rules
 */
export async function calculateDynamicPrice(
  listingId: string,
  basePrice: number,
  checkinDate: string,
  checkoutDate: string,
  guestsCount: number = 1
): Promise<{
  totalPrice: number;
  nightlyPrices: Array<{ date: string; price: number }>;
  breakdown: {
    basePrice: number;
    customPricing: number;
    ruleAdjustments: number;
    total: number;
  };
}> {
  try {
    // Get all pricing for the date range
    const datePricing = await getDatePricing(listingId, checkinDate, checkoutDate);

    // Get active pricing rules
    const pricingRules = await getActivePricingRules(listingId, checkinDate, checkoutDate);

    // Generate date range
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));

    const nightlyPrices: Array<{ date: string; price: number }> = [];
    let totalPrice = 0;
    let customPricingCount = 0;
    let ruleAdjustments = 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkin);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Start with base price
      let price = basePrice;

      // Check for custom date pricing
      const customPrice = datePricing.find((p) => p.date === dateStr);
      if (customPrice) {
        price = customPrice.price;
        customPricingCount++;
      }

      // Apply pricing rules
      for (const rule of pricingRules) {
        if (rule.active && isRuleApplicable(rule, currentDate, nights)) {
          price = applyPricingRule(price, rule, currentDate, nights);
          ruleAdjustments++;
        }
      }

      nightlyPrices.push({ date: dateStr, price });
      totalPrice += price;
    }

    return {
      totalPrice,
      nightlyPrices,
      breakdown: {
        basePrice: basePrice * nights,
        customPricing: totalPrice - basePrice * nights,
        ruleAdjustments,
        total: totalPrice,
      },
    };
  } catch (error) {
    logger.error('Error calculating dynamic price', error);
    throw handleError(error, 'calculateDynamicPrice');
  }
}

/**
 * Get active pricing rules for a date range
 */
export async function getActivePricingRules(
  listingId: string,
  startDate?: string,
  endDate?: string
): Promise<PricingRule[]> {
  try {
    let query = supabase
      .from('pricing_rules')
      .select('*')
      .eq('listing_id', listingId)
      .eq('active', true)
      .order('priority', { ascending: false });

    if (startDate) {
      query = query.or(`start_date.is.null,start_date.lte.${endDate || startDate}`);
    }
    if (endDate) {
      query = query.or(`end_date.is.null,end_date.gte.${startDate || endDate}`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as PricingRule[];
  } catch (error) {
    logger.error('Error fetching pricing rules', error);
    throw handleError(error, 'getActivePricingRules');
  }
}

/**
 * Create a pricing rule
 */
export async function createPricingRule(
  rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>
): Promise<PricingRule> {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        ...rule,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as PricingRule;
  } catch (error) {
    logger.error('Error creating pricing rule', error);
    throw handleError(error, 'createPricingRule');
  }
}

/**
 * Update a pricing rule
 */
export async function updatePricingRule(
  ruleId: string,
  updates: Partial<PricingRule>
): Promise<PricingRule> {
  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data as PricingRule;
  } catch (error) {
    logger.error('Error updating pricing rule', error);
    throw handleError(error, 'updatePricingRule');
  }
}

/**
 * Delete a pricing rule
 */
export async function deletePricingRule(ruleId: string): Promise<void> {
  try {
    const { error } = await supabase.from('pricing_rules').delete().eq('id', ruleId);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting pricing rule', error);
    throw handleError(error, 'deletePricingRule');
  }
}

// Helper functions
function isRuleApplicable(rule: PricingRule, date: Date, nights: number): boolean {
  const config = rule.rule_config;

  switch (rule.rule_type) {
    case 'seasonal':
      if (config.start_month !== undefined && config.end_month !== undefined) {
        const month = date.getMonth() + 1; // 1-12
        return month >= config.start_month && month <= config.end_month;
      }
      return true;

    case 'day_of_week':
      if (config.days_of_week) {
        const dayOfWeek = date.getDay();
        return config.days_of_week.includes(dayOfWeek);
      }
      return true;

    case 'advance_booking':
      if (config.days_in_advance !== undefined) {
        const daysUntil = Math.ceil(
          (date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil >= config.days_in_advance;
      }
      return true;

    case 'length_of_stay':
      if (config.min_nights !== undefined) {
        return nights >= config.min_nights;
      }
      return true;

    default:
      return true;
  }
}

function applyPricingRule(
  basePrice: number,
  rule: PricingRule,
  date: Date,
  nights: number
): number {
  const config = rule.rule_config;

  switch (rule.rule_type) {
    case 'seasonal':
      if (config.price_multiplier) {
        return basePrice * config.price_multiplier;
      }
      break;

    case 'day_of_week':
      if (config.price_adjustment) {
        // If positive, it's a percentage increase; if negative, it's a fixed discount
        if (config.price_adjustment > 0 && config.price_adjustment <= 100) {
          return basePrice * (1 + config.price_adjustment / 100);
        } else {
          return basePrice + config.price_adjustment;
        }
      }
      break;

    case 'advance_booking':
      if (config.discount_percent) {
        return basePrice * (1 - config.discount_percent / 100);
      }
      break;

    case 'length_of_stay':
      if (config.discount_per_night && nights >= (config.min_nights || 1)) {
        return basePrice - config.discount_per_night * (nights - (config.min_nights || 1));
      }
      break;
  }

  return basePrice;
}
