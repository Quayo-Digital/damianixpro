import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';
import { useTenantPrimaryPropertyId } from '@/hooks/useTenantPrimaryPropertyId';
import {
  fetchPropertyAnnouncements,
  type AnnouncementAudience,
  type PropertyAnnouncement,
} from '@/services/resident/propertyAnnouncementsApi';

/**
 * Tenant-facing feed: property-scoped announcements from Supabase (replaces demo data).
 * Managers publish from the property detail screen.
 */
export function TenantAnnouncements() {
  const propertyId = useTenantPrimaryPropertyId();
  const [filter, setFilter] = useState<'all' | AnnouncementAudience>('all');
  const [rows, setRows] = useState<PropertyAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchPropertyAnnouncements(propertyId));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    filter === 'all' ? rows : rows.filter((a) => a.audience === filter || a.audience === 'all');

  if (!propertyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Link your tenancy to a property to see building announcements from your manager.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading announcements…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No announcements for this property yet. Your property manager can post updates from the
          property page.
        </p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{announcement.title}</CardTitle>
                <Badge variant="outline">
                  {announcement.audience === 'all'
                    ? 'All tenants'
                    : announcement.audience === 'residential'
                      ? 'Residential'
                      : 'Commercial'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm text-muted-foreground">
                  {new Date(announcement.published_at).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap">{announcement.body}</p>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Megaphone className="mr-2 h-4 w-4" />
                  <span>From your property team</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
