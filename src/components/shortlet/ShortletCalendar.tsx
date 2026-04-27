/**
 * Short-Let Calendar Component
 * Displays and manages listing availability calendar
 */

import React, { useState, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { useShortletCalendar } from '@/hooks/useShortletCalendar';
import {
  Calendar as CalendarIcon,
  X,
  Lock,
  Unlock,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

interface ShortletCalendarProps {
  listingId: string;
  listingTitle?: string;
  onDateSelect?: (date: Date) => void;
  mode?: 'view' | 'manage';
}

export function ShortletCalendar({
  listingId,
  listingTitle,
  onDateSelect,
  mode = 'view',
}: ShortletCalendarProps) {
  const { toast } = useToast();
  const { calendar, isLoading, refreshCalendar, blockDates, unblockDates, checkConflicts } =
    useShortletCalendar();

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockNotes, setBlockNotes] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Initialize calendar view (next 90 days)
  useEffect(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 90);
    refreshCalendar(listingId, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
  }, [listingId, refreshCalendar]);

  // Check for conflicts when range is selected
  useEffect(() => {
    if (selectedRange?.from && selectedRange?.to && mode === 'manage') {
      checkConflicts(
        listingId,
        format(selectedRange.from, 'yyyy-MM-dd'),
        format(selectedRange.to, 'yyyy-MM-dd')
      ).then((result) => {
        if (result.has_conflicts) {
          const conflictTypes = result.conflicts.map((c) => c.type).join(', ');
          setConflictWarning(
            `Warning: ${result.conflicts.length} conflict(s) found (${conflictTypes})`
          );
        } else {
          setConflictWarning(null);
        }
      });
    }
  }, [selectedRange, listingId, mode, checkConflicts]);

  const handleBlockDates = async () => {
    if (!selectedRange?.from || !selectedRange?.to) return;

    try {
      await blockDates(
        listingId,
        format(selectedRange.from, 'yyyy-MM-dd'),
        format(selectedRange.to, 'yyyy-MM-dd'),
        blockNotes || undefined
      );
      setShowBlockDialog(false);
      setSelectedRange(undefined);
      setBlockNotes('');
      setConflictWarning(null);
    } catch (error) {
      console.error('Error blocking dates:', error);
    }
  };

  const handleUnblockDates = async () => {
    if (!selectedRange?.from || !selectedRange?.to) return;

    try {
      await unblockDates(
        listingId,
        format(selectedRange.from, 'yyyy-MM-dd'),
        format(selectedRange.to, 'yyyy-MM-dd')
      );
      setSelectedRange(undefined);
    } catch (error) {
      console.error('Error unblocking dates:', error);
    }
  };

  const handleDateClick = (date: Date) => {
    if (mode === 'view' && onDateSelect) {
      onDateSelect(date);
    }
  };

  // Get date modifiers for styling
  const getDateModifiers = () => {
    if (!calendar) return {};

    const modifiers: any = {
      available: [],
      blocked: [],
      booked: [],
    };

    calendar.dates.forEach((dateEntry) => {
      const date = new Date(dateEntry.date);
      if (dateEntry.blocked) {
        modifiers.blocked.push(date);
      } else if (dateEntry.available) {
        modifiers.available.push(date);
      } else {
        modifiers.booked.push(date);
      }
    });

    return modifiers;
  };

  const modifiers = getDateModifiers();
  const modifiersClassNames = {
    available: 'bg-green-100 text-green-800 hover:bg-green-200',
    blocked: 'bg-red-100 text-red-800 hover:bg-red-200 line-through',
    booked: 'bg-gray-200 text-gray-500 cursor-not-allowed',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Availability Calendar
              </CardTitle>
              {listingTitle && <CardDescription>{listingTitle}</CardDescription>}
            </div>
            {mode === 'manage' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBlockDialog(true)}
                  disabled={!selectedRange?.from || !selectedRange?.to}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Block Dates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnblockDates}
                  disabled={!selectedRange?.from || !selectedRange?.to}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unblock
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <DayPicker
                mode={mode === 'manage' ? 'range' : 'single'}
                selected={selectedRange}
                onSelect={(range) => setSelectedRange(range as DateRange)}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                disabled={modifiers.booked}
                className="rounded-md border"
                fromDate={new Date()}
              />

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-green-300 bg-green-100"></div>
                  <span className="text-sm text-muted-foreground">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-red-300 bg-red-100"></div>
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-gray-300 bg-gray-200"></div>
                  <span className="text-sm text-muted-foreground">Booked</span>
                </div>
              </div>

              {/* Selected Range Info */}
              {selectedRange?.from && selectedRange?.to && mode === 'manage' && (
                <div className="mt-4 rounded-md bg-muted p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {format(selectedRange.from, 'MMM dd, yyyy')} -{' '}
                        {format(selectedRange.to, 'MMM dd, yyyy')}
                      </p>
                      {conflictWarning && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          {conflictWarning}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Block Dates Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Dates</DialogTitle>
            <DialogDescription>
              Block these dates to prevent bookings. Add a reason (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRange?.from && selectedRange?.to && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  {format(selectedRange.from, 'MMM dd, yyyy')} -{' '}
                  {format(selectedRange.to, 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {conflictWarning && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  {conflictWarning}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="block-notes">Reason (Optional)</Label>
              <Textarea
                id="block-notes"
                placeholder="e.g., Maintenance, Owner use, etc."
                value={blockNotes}
                onChange={(e) => setBlockNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBlockDates}>Block Dates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
