import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LifeBuoy, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type ChatRole = 'user' | 'assistant';

interface ChatLine {
  role: ChatRole;
  content: string;
}

const VOICE_BASE = import.meta.env.VITE_VOICE_SERVER_URL || 'http://localhost:4000';

const INTRO: ChatLine = {
  role: 'assistant',
  content:
    "Hi — I'm DamianixPro Support. Ask about browsing rentals, applying as a tenant, payments, dashboards, or troubleshooting. I won't ask for passwords or card details.",
};

/**
 * Floating support chat: calls POST /api/support/chat on the voice server (OPENAI_API_KEY).
 * Set VITE_ENABLE_SUPPORT_CHAT=false to hide.
 */
export function SupportChatbot() {
  const enabled = import.meta.env.VITE_ENABLE_SUPPORT_CHAT !== 'false';
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([INTRO]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, open, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    let payload: ChatLine[] = [];
    setLines((prev) => {
      payload = [...prev, { role: 'user', content: text }];
      return payload;
    });

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const pagePath = `${location.pathname}${location.search}`.slice(0, 500);

      const res = await fetch(`${VOICE_BASE}/api/support/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: payload,
          pagePath,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        fallback?: boolean;
      };

      if (!res.ok) {
        setLines((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              data.error ||
              'Something went wrong. Try again in a moment or open the Help Center for guides.',
          },
        ]);
        return;
      }

      setLines((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: String(data.message || data.error || 'No reply received.'),
        },
      ]);
    } catch {
      setLines((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Could not reach the support service. If you’re developing locally, run `npm run voice:dev` and check VITE_VOICE_SERVER_URL.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, location.pathname, location.search]);

  const clearChat = useCallback(() => {
    setLines([INTRO]);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      {!open && (
        <Button
          type="button"
          size="icon"
          aria-label="Open support chat"
          className={cn(
            'fixed bottom-5 right-5 z-[100] h-14 w-14 rounded-full shadow-lg',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full max-w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="space-y-1 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="h-5 w-5 text-primary" />
              Support
            </SheetTitle>
            <SheetDescription className="sr-only">
              Chat with DamianixPro support assistant. You can ask how to use the app or fix common
              issues.
            </SheetDescription>
            <p className="text-xs font-normal text-muted-foreground">
              AI answers common questions. For account-specific issues, use{' '}
              <Link
                to="/help"
                className="text-primary underline-offset-2 hover:underline"
                onClick={() => setOpen(false)}
              >
                Help Center
              </Link>
              .
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={clearChat}
              >
                New conversation
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1 px-4 py-3">
            <div className="flex flex-col gap-3 pr-2">
              {lines.map((line, i) => (
                <div
                  key={`${i}-${line.role}-${line.content.slice(0, 24)}`}
                  className={cn(
                    'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    line.role === 'user'
                      ? 'ml-6 bg-primary text-primary-foreground'
                      : 'mr-6 border border-border bg-muted/50 text-foreground'
                  )}
                >
                  {line.content}
                </div>
              ))}
              {loading && (
                <div className="mr-6 rounded-2xl border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              className="min-h-[80px] resize-none"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              type="button"
              className="mt-2 w-full gap-2"
              disabled={loading || !input.trim()}
              onClick={() => void send()}
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
