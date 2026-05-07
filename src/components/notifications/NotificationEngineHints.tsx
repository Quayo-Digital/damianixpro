import { Badge } from '@/components/ui/badge';
import type { NotificationEngineMetadata } from '@/types/notification';

const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  in_app: 'In-app',
};

/** Shows multi-channel fan-out hints from notification_engine metadata (outbox-delivered rows). */
export function NotificationEngineHints({
  metadata,
}: {
  metadata?: NotificationEngineMetadata | null;
}) {
  if (!metadata?.notification_engine) return null;
  const ch = metadata.engine_fanout_channels;
  if (!Array.isArray(ch) || ch.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Also sent
      </span>
      {ch.map((c) => (
        <Badge key={c} variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
          {CHANNEL_LABEL[c] || c}
        </Badge>
      ))}
    </div>
  );
}

export function NotificationEngineInfoCard() {
  return (
    <div className="mb-6 rounded-lg border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Notification engine</p>
      <p className="mt-1">
        Rent due reminders, payment confirmations, and maintenance updates are queued on the server
        outbox. You see <strong className="text-foreground">in-app</strong> alerts here; matching
        rows may also trigger <strong className="text-foreground">email</strong> (when Resend is
        configured) and <strong className="text-foreground">SMS</strong> via an abstract provider (
        <code className="text-xs">SMS_PROVIDER=noop</code> logs only; Twilio when credentials
        exist). WhatsApp sends when Meta credentials are set.
      </p>
    </div>
  );
}
