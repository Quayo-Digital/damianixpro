/**
 * Recurring Pattern Dialog Component
 * Create and edit recurring availability patterns
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { format } from 'date-fns';

interface RecurringPatternDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  pattern?: {
    id?: string;
    patternType: 'weekly' | 'monthly' | 'custom';
    patternConfig: {
      daysOfWeek?: number[];
      daysOfMonth?: number[];
      weeksOfMonth?: number[];
      specificDates?: string[];
    };
    startDate: string;
    endDate?: string;
    available: boolean;
    priceOverride?: number;
    minNights?: number;
    maxNights?: number;
  };
  onSave: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function RecurringPatternDialog({
  open,
  onOpenChange,
  listingId,
  pattern,
  onSave,
}: RecurringPatternDialogProps) {
  const { toast } = useToast();
  const [patternType, setPatternType] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [available, setAvailable] = useState(true);
  const [priceOverride, setPriceOverride] = useState<number | undefined>();
  const [minNights, setMinNights] = useState(1);
  const [maxNights, setMaxNights] = useState<number | undefined>();
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>([]);
  const [selectedWeeksOfMonth, setSelectedWeeksOfMonth] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pattern) {
      setPatternType(pattern.patternType);
      setStartDate(pattern.startDate);
      setEndDate(pattern.endDate || '');
      setAvailable(pattern.available);
      setPriceOverride(pattern.priceOverride);
      setMinNights(pattern.minNights || 1);
      setMaxNights(pattern.maxNights);
      setSelectedDaysOfWeek(pattern.patternConfig.daysOfWeek || []);
      setSelectedDaysOfMonth(pattern.patternConfig.daysOfMonth || []);
      setSelectedWeeksOfMonth(pattern.patternConfig.weeksOfMonth || []);
    } else {
      // Reset to defaults
      setPatternType('weekly');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setAvailable(true);
      setPriceOverride(undefined);
      setMinNights(1);
      setMaxNights(undefined);
      setSelectedDaysOfWeek([]);
      setSelectedDaysOfMonth([]);
      setSelectedWeeksOfMonth([]);
    }
  }, [pattern, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const patternConfig: any = {};

      if (patternType === 'weekly') {
        patternConfig.daysOfWeek = selectedDaysOfWeek;
      } else if (patternType === 'monthly') {
        patternConfig.daysOfMonth = selectedDaysOfMonth;
        if (selectedDaysOfWeek.length > 0) {
          patternConfig.daysOfWeek = selectedDaysOfWeek;
          patternConfig.weeksOfMonth = selectedWeeksOfMonth;
        }
      }

      const patternData = {
        listing_id: listingId,
        pattern_type: patternType,
        pattern_config: patternConfig,
        start_date: startDate,
        end_date: endDate || null,
        available,
        price_override: priceOverride || null,
        min_nights: minNights,
        max_nights: maxNights || null,
        active: true,
      };

      const { createRecurringPattern, updateRecurringPattern } =
        await import('@/services/shortlet/api/recurringPatterns');

      if (pattern?.id) {
        await updateRecurringPattern(pattern.id, patternData);
        toast({
          title: 'Success',
          description: 'Pattern updated successfully',
        });
      } else {
        await createRecurringPattern(patternData);
        toast({
          title: 'Success',
          description: 'Pattern created successfully',
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving pattern', error);
      toast({
        title: 'Error',
        description: 'Failed to save pattern',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pattern ? 'Edit Pattern' : 'Create Recurring Pattern'}</DialogTitle>
          <DialogDescription>
            Set up repeating availability and pricing rules for your listing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pattern Type */}
          <div className="space-y-2">
            <Label>Pattern Type</Label>
            <Select value={patternType} onValueChange={(v) => setPatternType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly (e.g., Every Monday-Friday)</SelectItem>
                <SelectItem value="monthly">Monthly (e.g., First Monday of each month)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date (Optional)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
              <p className="text-xs text-muted-foreground">Leave empty for ongoing pattern</p>
            </div>
          </div>

          {/* Pattern Configuration */}
          {patternType === 'weekly' && (
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDaysOfWeek.includes(day.value)}
                      onCheckedChange={() => toggleDayOfWeek(day.value)}
                    />
                    <Label
                      htmlFor={`day-${day.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {patternType === 'monthly' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Days of Month (1-31)</Label>
                <Input
                  placeholder="e.g., 1,15,30"
                  value={selectedDaysOfMonth.join(',')}
                  onChange={(e) => {
                    const days = e.target.value
                      .split(',')
                      .map((d) => parseInt(d.trim()))
                      .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
                    setSelectedDaysOfMonth(days);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter comma-separated days (e.g., 1,15,30)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Or Select Days of Week + Weeks</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-day-${day.value}`}
                        checked={selectedDaysOfWeek.includes(day.value)}
                        onCheckedChange={() => toggleDayOfWeek(day.value)}
                      />
                      <Label
                        htmlFor={`month-day-${day.value}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedDaysOfWeek.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <Label>Weeks of Month</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((week) => (
                        <div key={week} className="flex items-center space-x-2">
                          <Checkbox
                            id={`week-${week}`}
                            checked={selectedWeeksOfMonth.includes(week)}
                            onCheckedChange={(checked) => {
                              setSelectedWeeksOfMonth((prev) =>
                                checked ? [...prev, week] : prev.filter((w) => w !== week)
                              );
                            }}
                          />
                          <Label
                            htmlFor={`week-${week}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {week === 1 ? '1st' : week === 2 ? '2nd' : week === 3 ? '3rd' : '4th'}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="flex items-center justify-between">
            <Label htmlFor="available">Available for Booking</Label>
            <Switch id="available" checked={available} onCheckedChange={setAvailable} />
          </div>

          {/* Pricing Override */}
          <div className="space-y-2">
            <Label htmlFor="price-override">Price Override (Optional)</Label>
            <Input
              id="price-override"
              type="number"
              placeholder="Leave empty to use base price"
              value={priceOverride || ''}
              onChange={(e) =>
                setPriceOverride(e.target.value ? Number(e.target.value) : undefined)
              }
              min={0}
              step={1000}
            />
            <p className="text-xs text-muted-foreground">
              Set custom price for dates matching this pattern
            </p>
          </div>

          {/* Night Restrictions */}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : pattern ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
