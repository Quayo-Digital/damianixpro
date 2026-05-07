import { useCallback, useRef, useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  postAiQuery,
  type AiQueryTablePayload,
  type AiQuerySuccess,
} from '@/services/assistant/aiQueryApi';

type ChatTurn = {
  role: 'user' | 'assistant';
  text: string;
  payload?: AiQuerySuccess | null;
};

const SUGGESTIONS = ['Show tenants owing rent', 'Generate rent report', 'List vacant properties'];

function formatCell(value: unknown, format?: string): string {
  if (value == null) return '—';
  if (format === 'currency' && (typeof value === 'number' || typeof value === 'string')) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(n);
  }
  return String(value);
}

export interface DamianixProAssistantChatProps {
  className?: string;
  /** Compact card for side columns */
  compact?: boolean;
}

export function DamianixProAssistantChat({ className, compact }: DamianixProAssistantChatProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preferOpenAI, setPreferOpenAI] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, []);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setTurns((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    scrollToEnd();
    try {
      const result = await postAiQuery(q, { preferOpenAI });
      const text =
        result.message ||
        (result.data?.title ?? (result.intent === 'unknown' ? 'No matching action yet.' : 'Done.'));
      setTurns((prev) => [...prev, { role: 'assistant', text, payload: result }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed.';
      setTurns((prev) => [...prev, { role: 'assistant', text: msg, payload: null }]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }, [input, loading, preferOpenAI, scrollToEnd]);

  const renderTable = (data: AiQueryTablePayload) => {
    if (!data.rows?.length) {
      return <p className="text-sm text-foreground/75">No rows returned.</p>;
    }
    return (
      <div className="mt-2 overflow-x-auto rounded-md border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, i) => (
              <TableRow key={i}>
                {data.columns.map((c) => (
                  <TableCell key={c.key} className="max-w-[220px] truncate">
                    {formatCell(row[c.key], c.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'border-2 border-violet-300/90 bg-card text-card-foreground shadow-md ring-1 ring-violet-500/15 dark:border-violet-700 dark:ring-violet-400/20',
        className
      )}
    >
      <CardHeader className={cn(compact && 'pb-2')}>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Sparkles className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
          DamianixPro Assistant
        </CardTitle>
        <CardDescription className="text-foreground/80 dark:text-foreground/75">
          Ask in plain language about rent, vacancies, and collections. Results respect your
          property access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Button
              key={s}
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs"
              disabled={loading}
              onClick={() => {
                setInput(s);
              }}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="ai-prefer-openai"
            checked={preferOpenAI}
            onCheckedChange={setPreferOpenAI}
            disabled={loading}
          />
          <Label htmlFor="ai-prefer-openai" className="text-xs font-normal text-foreground/75">
            Prefer OpenAI routing (needs server OPENAI_API_KEY)
          </Label>
        </div>

        <ScrollArea
          className={cn(
            'rounded-md border border-border bg-muted text-foreground',
            compact ? 'h-[220px]' : 'h-[280px]'
          )}
        >
          <div className="space-y-3 p-3">
            {turns.length === 0 && (
              <p className="text-sm text-foreground/80">
                Examples: overdue tenants, six-month rent summary, vacant listings.
              </p>
            )}
            {turns.map((t, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  t.role === 'user'
                    ? 'ml-6 border border-violet-300/80 bg-violet-100 text-violet-950 dark:border-violet-600 dark:bg-violet-950/50 dark:text-violet-50'
                    : 'mr-6 border border-border bg-card text-card-foreground shadow-sm'
                )}
              >
                <p className="whitespace-pre-wrap font-medium text-foreground">{t.text}</p>
                {t.role === 'assistant' &&
                  t.payload?.data?.kind === 'table' &&
                  renderTable(t.payload.data)}
                {t.role === 'assistant' && t.payload?.meta?.router && (
                  <p className="mt-1 text-xs text-foreground/70">
                    Intent: {t.payload.intent} · router: {t.payload.meta.router}
                  </p>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-foreground/80">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running query…
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Who owes rent this month?"
            rows={compact ? 2 : 3}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="min-h-[72px] resize-none"
          />
          <Button
            type="button"
            className="shrink-0 self-end"
            disabled={loading || !input.trim()}
            onClick={() => void send()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
