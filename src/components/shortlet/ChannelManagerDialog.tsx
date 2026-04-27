/**
 * Channel Manager Integration Dialog
 * Configure and manage channel integrations
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { Link2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ChannelManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  integration?: {
    id?: string;
    channelName: string;
    channelListingId: string;
    syncEnabled: boolean;
    syncDirection: 'to_channel' | 'from_channel' | 'bidirectional';
    lastSyncAt?: string;
    syncStatus: 'active' | 'paused' | 'error';
  };
  onSave: () => void;
}

const CHANNELS = [
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'booking_com', label: 'Booking.com' },
  { value: 'expedia', label: 'Expedia' },
  { value: 'vrbo', label: 'VRBO' },
  { value: 'custom', label: 'Custom API' },
];

export function ChannelManagerDialog({
  open,
  onOpenChange,
  listingId,
  integration,
  onSave,
}: ChannelManagerDialogProps) {
  const { toast } = useToast();
  const [channelName, setChannelName] = useState<string>('airbnb');
  const [channelListingId, setChannelListingId] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncDirection, setSyncDirection] = useState<
    'to_channel' | 'from_channel' | 'bidirectional'
  >('bidirectional');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (integration) {
      setChannelName(integration.channelName);
      setChannelListingId(integration.channelListingId);
      setSyncEnabled(integration.syncEnabled);
      setSyncDirection(integration.syncDirection);
    } else {
      setChannelName('airbnb');
      setChannelListingId('');
      setSyncEnabled(true);
      setSyncDirection('bidirectional');
      setApiKey('');
      setApiSecret('');
      setWebhookUrl('');
    }
  }, [integration, open]);

  const handleSave = async () => {
    if (!channelListingId.trim()) {
      toast({
        title: 'Error',
        description: 'Channel listing ID is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const integrationData = {
        listing_id: listingId,
        channel_name: channelName,
        channel_listing_id: channelListingId,
        sync_enabled: syncEnabled,
        sync_direction: syncDirection,
        credentials: {
          api_key: apiKey,
          api_secret: apiSecret,
          webhook_url: webhookUrl,
        },
        sync_status: 'active' as const,
      };

      const { createChannelIntegration, updateChannelIntegration } =
        await import('@/services/shortlet/api/channelManager');

      if (integration?.id) {
        await updateChannelIntegration(integration.id, integrationData);
        toast({
          title: 'Success',
          description: 'Integration updated successfully',
        });
      } else {
        await createChannelIntegration(integrationData);
        toast({
          title: 'Success',
          description: 'Integration created successfully',
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving channel integration', error);
      toast({
        title: 'Error',
        description: 'Failed to save integration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!integration?.id) return;

    setIsSyncing(true);
    try {
      const { syncAvailabilityToChannel } = await import('@/services/shortlet/api/channelManager');

      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      const result = await syncAvailabilityToChannel(integration.id, startDate, endDate);

      toast({
        title: result.success ? 'Sync Successful' : 'Sync Failed',
        description: `Synced ${result.itemsSynced} items. ${result.itemsFailed} failed.`,
        variant: result.success ? 'default' : 'destructive',
      });

      onSave();
    } catch (error) {
      logger.error('Error syncing to channel', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync with channel',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {integration ? 'Edit Channel Integration' : 'Add Channel Integration'}
          </DialogTitle>
          <DialogDescription>
            Connect your listing to external booking platforms for automatic synchronization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Channel Selection */}
          <div className="space-y-2">
            <Label>Channel Platform</Label>
            <Select value={channelName} onValueChange={setChannelName} disabled={!!integration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel Listing ID */}
          <div className="space-y-2">
            <Label htmlFor="channel-listing-id">Channel Listing ID *</Label>
            <Input
              id="channel-listing-id"
              placeholder="Enter your listing ID from the channel platform"
              value={channelListingId}
              onChange={(e) => setChannelListingId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The unique identifier for your listing on{' '}
              {CHANNELS.find((c) => c.value === channelName)?.label}
            </p>
          </div>

          {/* Sync Direction */}
          <div className="space-y-2">
            <Label>Sync Direction</Label>
            <Select value={syncDirection} onValueChange={(v) => setSyncDirection(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_channel">To Channel (Export to platform)</SelectItem>
                <SelectItem value="from_channel">From Channel (Import from platform)</SelectItem>
                <SelectItem value="bidirectional">Bidirectional (Two-way sync)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Credentials */}
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">API Credentials</h4>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key / Client ID</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret / Client Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter API secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/webhooks/channel"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL to receive real-time updates from the channel
              </p>
            </div>
          </div>

          {/* Sync Status */}
          {integration && (
            <div className="space-y-2">
              <Label>Sync Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={integration.syncStatus === 'active' ? 'default' : 'secondary'}>
                  {integration.syncStatus}
                </Badge>
                {integration.lastSyncAt && (
                  <span className="text-sm text-muted-foreground">
                    Last sync: {format(new Date(integration.lastSyncAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sync Enabled */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sync-enabled">Enable Synchronization</Label>
              <p className="text-xs text-muted-foreground">
                Automatically sync availability and pricing with this channel
              </p>
            </div>
            <Switch id="sync-enabled" checked={syncEnabled} onCheckedChange={setSyncEnabled} />
          </div>

          {/* Manual Sync Button */}
          {integration && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing || !syncEnabled}
                className="flex-1"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isSyncing}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isSyncing}>
            {isSaving ? 'Saving...' : integration ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
