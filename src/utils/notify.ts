import { toast } from '@/components/ui/sonner';

export function notifySuccess(message: string, description?: string) {
  toast.success(message, description ? { description } : undefined);
}

export function notifyInfo(message: string, description?: string) {
  toast.info(message, description ? { description } : undefined);
}

export function notifyError(message: string, description?: string) {
  toast.error(message, description ? { description } : undefined);
}

export function notifyFromError(prefix: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  notifyError(prefix, msg);
}
