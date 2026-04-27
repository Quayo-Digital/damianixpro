import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  createPropertyAnnouncement,
  fetchPropertyAnnouncements,
  type AnnouncementAudience,
  type PropertyAnnouncement,
} from '@/services/resident/propertyAnnouncementsApi';
import { Megaphone, Plus, RefreshCw } from 'lucide-react';

interface PropertyAnnouncementsManagerProps {
  propertyId: string;
}

export function PropertyAnnouncementsManager({ propertyId }: PropertyAnnouncementsManagerProps) {
  const [rows, setRows] = useState<PropertyAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<AnnouncementAudience>('all');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
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

  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const res = await createPropertyAnnouncement({
        propertyId,
        title: title.trim(),
        body: body.trim(),
        audience,
      });
      if (res.ok) {
        toast.success('Announcement published');
        setOpen(false);
        setTitle('');
        setBody('');
        setAudience('all');
        await load();
      } else {
        toast.error(res.error || 'Failed to publish');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4" />
            Resident announcements
          </CardTitle>
          <CardDescription>Posts appear for tenants linked to this property.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Message"
                  className="min-h-[120px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <Select
                  value={audience}
                  onValueChange={(v) => setAudience(v as AnnouncementAudience)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tenants</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void publish()}
                  disabled={saving || !title.trim() || !body.trim()}
                >
                  Publish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {rows.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded border p-2">
                <p className="font-medium">{a.title}</p>
                <p className="line-clamp-2 text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(a.published_at).toLocaleString()} · {a.audience}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
