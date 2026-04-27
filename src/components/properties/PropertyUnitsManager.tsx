import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchUnitsForProperty,
  createUnit,
  updateUnit,
  deleteUnit,
  type UnitRow,
} from '@/services/property/unitsApi';

const formatNgn = (n: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(n);

type Props = {
  propertyId: string;
  propertyName: string;
};

export function PropertyUnitsManager({ propertyId, propertyName }: Props) {
  const queryClient = useQueryClient();
  const queryKey = ['property-units', propertyId] as const;

  const {
    data: units = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchUnitsForProperty(propertyId),
    retry: false,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const [formUnitNumber, setFormUnitNumber] = useState('');
  const [formRent, setFormRent] = useState('');
  const [formStatus, setFormStatus] = useState<'vacant' | 'occupied'>('vacant');
  const [deleteTarget, setDeleteTarget] = useState<UnitRow | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['publicProperties'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rent = parseFloat(formRent.replace(/,/g, ''));
      if (!Number.isFinite(rent) || rent <= 0) {
        throw new Error('Enter a valid annual rent amount (₦).');
      }
      if (editing) {
        return updateUnit(editing.id, {
          unit_number: formUnitNumber.trim() || null,
          rent_amount: rent,
          status: formStatus,
        });
      }
      return createUnit({
        property_id: propertyId,
        unit_number: formUnitNumber.trim(),
        rent_amount: rent,
        status: formStatus,
      });
    },
    onSuccess: () => {
      toast.success(editing ? 'Unit updated' : 'Unit added');
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Could not save unit');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUnit(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.reason || 'Cannot delete unit');
        return;
      }
      toast.success('Unit removed');
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Could not delete unit');
    },
  });

  const openAdd = () => {
    setEditing(null);
    setFormUnitNumber('');
    setFormRent('');
    setFormStatus('vacant');
    setDialogOpen(true);
  };

  const openEdit = (u: UnitRow) => {
    setEditing(u);
    setFormUnitNumber(u.unit_number ?? '');
    setFormRent(String(u.rent_amount ?? ''));
    setFormStatus(u.status === 'occupied' ? 'occupied' : 'vacant');
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Units &amp; estates
            </CardTitle>
            <CardDescription>
              Register each rentable unit (flats, shops, plots in an estate). Tenants pick a unit
              when you have more than one. Rent is{' '}
              <span className="font-medium text-foreground">annual (₦)</span>, per Nigerian
              practice.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add unit
          </Button>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive">
              Could not load units.{' '}
              {error instanceof Error
                ? error.message
                : 'Apply the database migration that creates the units table.'}
            </p>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading units…
            </div>
          ) : units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No units yet for <span className="font-medium text-foreground">{propertyName}</span>.
              For a single standalone listing you can leave this empty. For an estate, add each unit
              here so applicants can choose one and occupancy shows on public cards.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Annual rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.unit_number?.trim() || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNgn(Number(u.rent_amount) || 0)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            u.status === 'occupied'
                              ? 'rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-900'
                              : 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900'
                          }
                        >
                          {u.status === 'occupied' ? 'Occupied' : 'Vacant'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(u)}
                          aria-label="Edit unit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(u)}
                          aria-label="Delete unit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit unit' : 'Add unit'}</DialogTitle>
            <DialogDescription>
              {propertyName} — annual rent in Nigerian Naira (per year).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="unit-number">Unit label</Label>
              <Input
                id="unit-number"
                name="unitNumber"
                placeholder="e.g. Block A — 12B"
                value={formUnitNumber}
                onChange={(e) => setFormUnitNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit-rent">Annual rent (₦)</Label>
              <Input
                id="unit-rent"
                name="rentAmount"
                type="number"
                min={1}
                step={1}
                placeholder="0"
                value={formRent}
                onChange={(e) => setFormRent(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as 'vacant' | 'occupied')}
              >
                <SelectTrigger id="unit-status" aria-label="Unit status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editing ? (
                'Save changes'
              ) : (
                'Add unit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this unit?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Unit "${deleteTarget.unit_number?.trim() || deleteTarget.id.slice(0, 8)}" will be deleted. You cannot remove a unit that has an active tenancy.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
