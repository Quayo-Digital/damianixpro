/**
 * Enhanced Calendar Component
 * Features:
 * - Drag-and-drop date selection
 * - Recurring availability patterns
 * - Dynamic pricing per date
 * - Channel manager integration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/contexts/auth';
import { logger } from '@/utils/logger';
import {
  Calendar as CalendarIcon,
  DollarSign,
  Repeat,
  Link2,
  Settings,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { RecurringPatternDialog } from './RecurringPatternDialog';
import { ChannelManagerDialog } from './ChannelManagerDialog';

// Types
interface DatePricing {
  date: string;
  price: number;
  available: boolean;
  minNights?: number;
  maxNights?: number;
}

interface RecurringPattern {
  id?: string;
  patternType: 'weekly' | 'monthly' | 'custom';
  patternConfig: {
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    daysOfMonth?: number[]; // 1-31
    weeksOfMonth?: number[]; // 1-4
  };
  startDate: string;
  endDate?: string;
  available: boolean;
  priceOverride?: number;
  minNights?: number;
  maxNights?: number;
}

interface ChannelIntegration {
  id?: string;
  channelName: string;
  channelListingId: string;
  syncEnabled: boolean;
  syncDirection: 'to_channel' | 'from_channel' | 'bidirectional';
  lastSyncAt?: string;
  syncStatus: 'active' | 'paused' | 'error';
}

interface EnhancedCalendarProps {
  listingId: string;
  listingTitle?: string;
  basePrice: number;
  mode?: 'view' | 'manage';
  onDateSelect?: (date: Date) => void;
  onPricingUpdate?: (pricing: DatePricing[]) => void;
}

export function EnhancedCalendar({
  listingId,
  listingTitle,
  basePrice,
  mode = 'view',
  onDateSelect,
  onPricingUpdate,
}: EnhancedCalendarProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuthSession();

  // Ensure manage mode is only available to authenticated users
  const effectiveMode = mode === 'manage' && !isAuthenticated() ? 'view' : mode;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [datePricing, setDatePricing] = useState<Map<string, DatePricing>>(new Map());
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [channelIntegrations, setChannelIntegrations] = useState<ChannelIntegration[]>([]);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingPattern, setEditingPattern] = useState<RecurringPattern | undefined>();
  const [editingChannel, setEditingChannel] = useState<ChannelIntegration | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Load calendar data
  useEffect(() => {
    loadCalendarData();
  }, [listingId, currentMonth]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Load date pricing
      const pricing = await loadDatePricing(listingId, currentMonth);
      setDatePricing(new Map(pricing.map((p) => [p.date, p])));

      // Load recurring patterns
      const patterns = await loadRecurringPatterns(listingId);
      setRecurringPatterns(patterns);

      // Load channel integrations
      const channels = await loadChannelIntegrations(listingId);
      setChannelIntegrations(channels);
    } catch (error) {
      logger.error('Error loading calendar data', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleMouseDown = (date: string) => {
    // Prevent unauthenticated users from selecting dates for editing
    if (effectiveMode !== 'manage' || !isAuthenticated()) return;
    setDragging(true);
    setDragStart(date);
    setSelectedDates(new Set([date]));
  };

  const handleMouseEnter = (date: string) => {
    if (!dragging || !dragStart) return;

    const start = new Date(dragStart);
    const end = new Date(date);
    const dates = new Set<string>();

    if (start <= end) {
      eachDayOfInterval({ start, end }).forEach((d) => {
        dates.add(format(d, 'yyyy-MM-dd'));
      });
    } else {
      eachDayOfInterval({ start: end, end: start }).forEach((d) => {
        dates.add(format(d, 'yyyy-MM-dd'));
      });
    }

    setSelectedDates(dates);
  };

  const handleMouseUp = () => {
    if (dragging && selectedDates.size > 0) {
      setShowPricingDialog(true);
    }
    setDragging(false);
    setDragStart(null);
  };

  // Get days for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get date status
  const getDateStatus = (
    date: Date
  ): {
    available: boolean;
    price: number;
    blocked: boolean;
    booked: boolean;
    hasPricing: boolean;
  } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const pricing = datePricing.get(dateStr);
    const isSelected = selectedDates.has(dateStr);
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

    return {
      available: !isPast && (pricing?.available ?? true),
      price: pricing?.price ?? basePrice,
      blocked: pricing?.available === false,
      booked: false, // Would come from bookings API
      hasPricing: !!pricing,
    };
  };

  // Apply pricing to selected dates
  const handleApplyPricing = async (price: number, minNights?: number, maxNights?: number) => {
    // Prevent unauthenticated users from editing
    if (!isAuthenticated()) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to manage pricing and availability',
        variant: 'destructive',
      });
      return;
    }

    if (selectedDates.size === 0) return;

    const updates: DatePricing[] = Array.from(selectedDates).map((date) => ({
      date,
      price,
      available: true,
      minNights,
      maxNights,
    }));

    try {
      await saveDatePricing(listingId, updates);
      updates.forEach((p) => datePricing.set(p.date, p));
      setDatePricing(new Map(datePricing));
      setSelectedDates(new Set());
      setShowPricingDialog(false);
      toast({
        title: 'Success',
        description: `Pricing updated for ${updates.length} date(s)`,
      });
      onPricingUpdate?.(updates);
    } catch (error) {
      logger.error('Error applying pricing', error);
      toast({
        title: 'Error',
        description: 'Failed to update pricing',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Enhanced Calendar & Pricing
              </CardTitle>
              {listingTitle && <CardDescription>{listingTitle}</CardDescription>}
            </div>
            {effectiveMode === 'manage' && isAuthenticated() && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPatternDialog(true)}>
                  <Repeat className="mr-2 h-4 w-4" />
                  Recurring Patterns
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowChannelDialog(true)}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Channel Manager
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              {effectiveMode === 'manage' && isAuthenticated() && (
                <TabsTrigger value="channels">Channels</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                >
                  Previous
                </Button>
                <h3 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                >
                  Next
                </Button>
              </div>

              {/* Calendar Grid */}
              <div
                ref={calendarRef}
                className="grid grid-cols-7 gap-1"
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {daysInMonth.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const status = getDateStatus(date);
                  const isSelected = selectedDates.has(dateStr);
                  const isToday = isSameDay(date, new Date());
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'relative min-h-[80px] border p-2 transition-colors',
                        isPast && 'opacity-50',
                        isSelected && 'ring-2 ring-primary',
                        status.blocked && 'border-red-200 bg-red-50',
                        status.booked && 'border-gray-300 bg-gray-100',
                        status.available &&
                          !status.blocked &&
                          'border-green-200 bg-green-50 hover:bg-green-100',
                        effectiveMode === 'manage' &&
                          isAuthenticated() &&
                          !isPast &&
                          'cursor-pointer'
                      )}
                      onMouseDown={() => handleMouseDown(dateStr)}
                      onMouseEnter={() => handleMouseEnter(dateStr)}
                      onClick={() => {
                        if (effectiveMode === 'view' && onDateSelect) {
                          onDateSelect(date);
                        } else if (effectiveMode === 'manage' && isAuthenticated()) {
                          setEditingDate(dateStr);
                          setShowPricingDialog(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isToday && 'rounded-full bg-primary px-2 py-0.5 text-primary-foreground'
                          )}
                        >
                          {format(date, 'd')}
                        </span>
                        {status.hasPricing && <DollarSign className="h-3 w-3 text-amber-600" />}
                      </div>
                      {status.price !== basePrice && (
                        <div className="mt-1 text-xs font-semibold text-amber-600">
                          ₦{status.price.toLocaleString()}
                        </div>
                      )}
                      {status.blocked && <div className="mt-1 text-xs text-red-600">Blocked</div>}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-green-300 bg-green-50"></div>
                  <span className="text-sm text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-red-300 bg-red-50"></div>
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-gray-300 bg-gray-100"></div>
                  <span className="text-sm text-muted-foreground">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-muted-foreground">Custom Pricing</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <PricingManagement
                listingId={listingId}
                datePricing={datePricing}
                basePrice={basePrice}
                onUpdate={loadCalendarData}
              />
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4">
              <RecurringPatternsManagement
                listingId={listingId}
                patterns={recurringPatterns}
                onUpdate={loadCalendarData}
                onEdit={(pattern) => {
                  setEditingPattern(pattern);
                  setShowPatternDialog(true);
                }}
                onAdd={() => {
                  setEditingPattern(undefined);
                  setShowPatternDialog(true);
                }}
              />
            </TabsContent>

            {effectiveMode === 'manage' && isAuthenticated() && (
              <TabsContent value="channels" className="space-y-4">
                <ChannelManagerManagement
                  listingId={listingId}
                  integrations={channelIntegrations}
                  onUpdate={loadCalendarData}
                  onEdit={(integration) => {
                    setEditingChannel(integration);
                    setShowChannelDialog(true);
                  }}
                  onAdd={() => {
                    setEditingChannel(undefined);
                    setShowChannelDialog(true);
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Pricing Dialog */}
      <PricingDialog
        open={showPricingDialog}
        onOpenChange={setShowPricingDialog}
        selectedDates={Array.from(selectedDates)}
        basePrice={basePrice}
        onApply={handleApplyPricing}
        editingDate={editingDate}
        existingPricing={editingDate ? datePricing.get(editingDate) : undefined}
      />

      {/* Recurring Pattern Dialog */}
      <RecurringPatternDialog
        open={showPatternDialog}
        onOpenChange={setShowPatternDialog}
        listingId={listingId}
        pattern={editingPattern}
        onSave={loadCalendarData}
      />

      {/* Channel Manager Dialog */}
      {effectiveMode === 'manage' && isAuthenticated() && (
        <ChannelManagerDialog
          open={showChannelDialog}
          onOpenChange={setShowChannelDialog}
          listingId={listingId}
          integration={editingChannel}
          onSave={loadCalendarData}
        />
      )}
    </div>
  );
}

// API functions
async function loadDatePricing(listingId: string, month: Date): Promise<DatePricing[]> {
  try {
    const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
    const { getDatePricing } = await import('@/services/shortlet/api/pricing');
    return await getDatePricing(listingId, startDate, endDate);
  } catch (error) {
    logger.error('Error loading date pricing', error);
    return [];
  }
}

async function loadRecurringPatterns(listingId: string): Promise<RecurringPattern[]> {
  try {
    const { getRecurringPatterns } = await import('@/services/shortlet/api/recurringPatterns');
    const patterns = await getRecurringPatterns(listingId);
    return patterns.map((p) => ({
      id: p.id,
      patternType: p.pattern_type,
      patternConfig: p.pattern_config,
      startDate: p.start_date,
      endDate: p.end_date,
      available: p.available,
      priceOverride: p.price_override,
      minNights: p.min_nights,
      maxNights: p.max_nights,
    }));
  } catch (error) {
    logger.error('Error loading recurring patterns', error);
    return [];
  }
}

async function loadChannelIntegrations(listingId: string): Promise<ChannelIntegration[]> {
  try {
    const { getChannelIntegrations } = await import('@/services/shortlet/api/channelManager');
    const integrations = await getChannelIntegrations(listingId);
    return integrations.map((i) => ({
      id: i.id,
      channelName: i.channel_name,
      channelListingId: i.channel_listing_id,
      syncEnabled: i.sync_enabled,
      syncDirection: i.sync_direction,
      lastSyncAt: i.last_sync_at,
      syncStatus: i.sync_status,
    }));
  } catch (error) {
    logger.error('Error loading channel integrations', error);
    return [];
  }
}

async function saveDatePricing(listingId: string, pricing: DatePricing[]): Promise<void> {
  try {
    const { bulkSetDatePricing } = await import('@/services/shortlet/api/pricing');
    await bulkSetDatePricing(
      listingId,
      pricing.map((p) => ({
        date: p.date,
        price: p.price,
        available: p.available,
        min_nights: p.minNights,
        max_nights: p.maxNights,
      }))
    );
  } catch (error) {
    logger.error('Error saving date pricing', error);
    throw error;
  }
}

// Sub-components
function PricingManagement({
  listingId,
  datePricing,
  basePrice,
  onUpdate,
}: {
  listingId: string;
  datePricing: Map<string, DatePricing>;
  basePrice: number;
  onUpdate: () => void;
}) {
  const pricingArray = Array.from(datePricing.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Date-Specific Pricing</h3>
          <p className="text-sm text-muted-foreground">
            Base price: ₦{basePrice.toLocaleString()}/night
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Pricing
        </Button>
      </div>

      <div className="space-y-2">
        {pricingArray.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No custom pricing set. All dates use base price.
            </p>
          </div>
        ) : (
          pricingArray.map((pricing) => (
            <div
              key={pricing.date}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{format(new Date(pricing.date), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-muted-foreground">
                  ₦{pricing.price.toLocaleString()}/night
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pricing.available ? 'default' : 'destructive'}>
                  {pricing.available ? 'Available' : 'Blocked'}
                </Badge>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecurringPatternsManagement({
  listingId,
  patterns,
  onUpdate,
  onEdit,
  onAdd,
}: {
  listingId: string;
  patterns: RecurringPattern[];
  onUpdate: () => void;
  onEdit: (pattern: RecurringPattern) => void;
  onAdd: () => void;
}) {
  const { toast } = useToast();

  const handleDelete = async (patternId?: string) => {
    if (!patternId) return;
    if (!confirm('Are you sure you want to delete this pattern?')) return;

    try {
      const { deleteRecurringPattern } = await import('@/services/shortlet/api/recurringPatterns');
      await deleteRecurringPattern(patternId);
      toast({
        title: 'Success',
        description: 'Pattern deleted successfully',
      });
      onUpdate();
    } catch (error) {
      logger.error('Error deleting pattern', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pattern',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recurring Availability Patterns</h3>
          <p className="text-sm text-muted-foreground">
            Set repeating availability and pricing rules
          </p>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pattern
        </Button>
      </div>

      <div className="space-y-2">
        {patterns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Repeat className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No recurring patterns configured</p>
          </div>
        ) : (
          patterns.map((pattern) => (
            <div key={pattern.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{pattern.patternType} Pattern</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(pattern.startDate), 'MMM dd, yyyy')} -{' '}
                    {pattern.endDate
                      ? format(new Date(pattern.endDate), 'MMM dd, yyyy')
                      : 'Ongoing'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pattern.available ? 'default' : 'destructive'}>
                    {pattern.available ? 'Available' : 'Blocked'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(pattern)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(pattern.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ChannelManagerManagement({
  listingId,
  integrations,
  onUpdate,
  onEdit,
  onAdd,
}: {
  listingId: string;
  integrations: ChannelIntegration[];
  onUpdate: () => void;
  onEdit: (integration: ChannelIntegration) => void;
  onAdd: () => void;
}) {
  const { toast } = useToast();

  const handleDelete = async (integrationId?: string) => {
    if (!integrationId) return;
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const { deleteChannelIntegration } = await import('@/services/shortlet/api/channelManager');
      await deleteChannelIntegration(integrationId);
      toast({
        title: 'Success',
        description: 'Integration deleted successfully',
      });
      onUpdate();
    } catch (error) {
      logger.error('Error deleting integration', error);
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const { syncAvailabilityToChannel } = await import('@/services/shortlet/api/channelManager');
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const result = await syncAvailabilityToChannel(integrationId, startDate, endDate);
      toast({
        title: result.success ? 'Sync Successful' : 'Sync Failed',
        description: `Synced ${result.itemsSynced} items`,
        variant: result.success ? 'default' : 'destructive',
      });
      onUpdate();
    } catch (error) {
      logger.error('Error syncing', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync with channel',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Channel Manager Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Sync availability and pricing with external platforms
          </p>
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      <div className="space-y-2">
        {integrations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Link2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No channel integrations configured</p>
          </div>
        ) : (
          integrations.map((integration) => (
            <div key={integration.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{integration.channelName}</p>
                  <p className="text-sm text-muted-foreground">
                    Last sync:{' '}
                    {integration.lastSyncAt
                      ? format(new Date(integration.lastSyncAt), 'MMM dd, yyyy HH:mm')
                      : 'Never'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={integration.syncStatus === 'active' ? 'default' : 'secondary'}>
                    {integration.syncStatus}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(integration.id!)}
                    disabled={!integration.syncEnabled}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(integration)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(integration.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PricingDialog({
  open,
  onOpenChange,
  selectedDates,
  basePrice,
  onApply,
  editingDate,
  existingPricing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDates: string[];
  basePrice: number;
  onApply: (price: number, minNights?: number, maxNights?: number) => void;
  editingDate?: string | null;
  existingPricing?: DatePricing;
}) {
  const [price, setPrice] = useState(existingPricing?.price ?? basePrice);
  const [minNights, setMinNights] = useState(existingPricing?.minNights ?? 1);
  const [maxNights, setMaxNights] = useState(existingPricing?.maxNights ?? undefined);
  const [available, setAvailable] = useState(existingPricing?.available ?? true);

  useEffect(() => {
    if (existingPricing) {
      setPrice(existingPricing.price);
      setMinNights(existingPricing.minNights ?? 1);
      setMaxNights(existingPricing.maxNights);
      setAvailable(existingPricing.available);
    } else {
      setPrice(basePrice);
      setMinNights(1);
      setMaxNights(undefined);
      setAvailable(true);
    }
  }, [existingPricing, basePrice]);

  const handleApply = () => {
    onApply(price, minNights, maxNights);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingDate ? 'Edit Pricing' : `Set Pricing for ${selectedDates.length} Date(s)`}
          </DialogTitle>
          <DialogDescription>
            {editingDate
              ? `Update pricing for ${format(new Date(editingDate), 'MMM dd, yyyy')}`
              : `Set custom pricing for selected dates`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price per Night (₦)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={0}
              step={1000}
            />
            <p className="text-xs text-muted-foreground">
              Base price: ₦{basePrice.toLocaleString()}/night
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-nights">Minimum Nights</Label>
              <Input
                id="min-nights"
                type="number"
                value={minNights}
                onChange={(e) => setMinNights(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-nights">Maximum Nights (Optional)</Label>
              <Input
                id="max-nights"
                type="number"
                value={maxNights || ''}
                onChange={(e) => setMaxNights(e.target.value ? Number(e.target.value) : undefined)}
                min={minNights}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="available">Available for Booking</Label>
            <Switch id="available" checked={available} onCheckedChange={setAvailable} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EnhancedCalendar;
