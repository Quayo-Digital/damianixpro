import { useCallback, useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeaseAgreement } from '@/services/applications/types';
import {
  ensureLeaseCoordinationChecklist,
  getLeaseCoordinationChecklist,
  updateLeaseCoordinationAiHint,
  updateLeaseCoordinationPhase,
  updateLeaseCoordinationTasks,
} from '@/services/leases/leaseCoordinationApi';
import type {
  CoordinationPhase,
  CoordinationTask,
  CoordinationTaskStatus,
} from '@/services/leases/leaseCoordinationTypes';
import { fetchLeaseOnboardingCoordinationPlan } from '@/services/ai/leaseOnboardingAssistApi';
import { Loader2, Sparkles, ListChecks } from 'lucide-react';

interface LeaseOnboardingCoordinationSheetProps {
  lease: LeaseAgreement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: CoordinationTaskStatus[] = ['pending', 'in_progress', 'done', 'skipped'];

function patchTaskStatus(
  tasks: CoordinationTask[],
  taskId: string,
  status: CoordinationTaskStatus
) {
  return tasks.map((t) => {
    if (t.id !== taskId) return t;
    const completed_at =
      status === 'done' || status === 'skipped' ? new Date().toISOString() : null;
    return { ...t, status, completed_at };
  });
}

export function LeaseOnboardingCoordinationSheet({
  lease,
  open,
  onOpenChange,
}: LeaseOnboardingCoordinationSheetProps) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<CoordinationTask[]>([]);
  const [phase, setPhase] = useState<CoordinationPhase>('post_executed');
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [hasRow, setHasRow] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const load = useCallback(async () => {
    if (!lease?.id) return;
    setLoading(true);
    try {
      const row = await getLeaseCoordinationChecklist(lease.id);
      if (row) {
        setHasRow(true);
        setTasks(row.tasks);
        setPhase(row.phase);
        setAiHint(row.ai_coordination_hint);
      } else {
        setHasRow(false);
        setTasks([]);
        setPhase('post_executed');
        setAiHint(null);
      }
    } finally {
      setLoading(false);
    }
  }, [lease?.id]);

  useEffect(() => {
    if (open && lease?.id) {
      void load();
    }
  }, [open, lease?.id, load]);

  const handleInit = async () => {
    if (!lease?.id || !lease.property_id || !lease.tenant_id) return;
    setInitLoading(true);
    try {
      const { row, created } = await ensureLeaseCoordinationChecklist({
        leaseId: lease.id,
        propertyId: lease.property_id,
        tenantId: lease.tenant_id,
        leaseStartDate: lease.start_date ?? null,
      });
      if (row) {
        setHasRow(true);
        setTasks(row.tasks);
        setPhase(row.phase);
        setAiHint(row.ai_coordination_hint);
      } else if (!created) {
        setHasRow(false);
      }
    } finally {
      setInitLoading(false);
    }
  };

  const persistTasks = async (next: CoordinationTask[]) => {
    if (!lease?.id || !hasRow) return;
    setTasks(next);
    await updateLeaseCoordinationTasks(lease.id, next);
  };

  const onStatusChange = async (taskId: string, status: CoordinationTaskStatus) => {
    const next = patchTaskStatus(tasks, taskId, status);
    await persistTasks(next);
  };

  const onPhaseChange = async (nextPhase: CoordinationPhase) => {
    if (!lease?.id || !hasRow) return;
    setPhase(nextPhase);
    await updateLeaseCoordinationPhase(lease.id, nextPhase);
  };

  const onAiPlan = async () => {
    if (!lease || !hasRow) return;
    setAiLoading(true);
    try {
      const result = await fetchLeaseOnboardingCoordinationPlan(lease, phase, tasks);
      if (result.ok) {
        setAiHint(result.text);
        await updateLeaseCoordinationAiHint(lease.id, result.text);
      } else {
        setAiHint(result.error);
      }
    } finally {
      setAiLoading(false);
    }
  };

  if (!lease) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg">
        <SheetHeader className="space-y-1 pr-8 text-left">
          <SheetTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Onboarding coordination
          </SheetTitle>
          <SheetDescription asChild>
            <div className="space-y-1 text-left text-sm text-muted-foreground">
              <span className="block font-medium text-foreground">
                {lease.property_name ?? 'Property'} · {lease.tenant_name ?? 'Tenant'}
              </span>
              <span className="block">
                Time-sensitive handoffs after lease execution. You approve real actions (messages,
                access, accounting); AI only suggests order and focus.
              </span>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 pb-4 pt-2">
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading checklist…
            </div>
          ) : !hasRow ? (
            <div className="space-y-3 rounded-md border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                No coordination checklist yet for this lease. Create one to track onboarding tasks
                across teams. Requires the{' '}
                <code className="rounded bg-muted px-1 text-xs">lease_coordination_checklists</code>{' '}
                table (see latest Supabase migration).
              </p>
              <Button type="button" onClick={handleInit} disabled={initLoading}>
                {initLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Initialize checklist'
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Phase</span>
                <Select
                  value={phase}
                  onValueChange={(v) => void onPhaseChange(v as CoordinationPhase)}
                >
                  <SelectTrigger className="h-8 w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post_executed">Post executed</SelectItem>
                    <SelectItem value="pre_move_in">Pre move-in</SelectItem>
                    <SelectItem value="move_in_week">Move-in week</SelectItem>
                    <SelectItem value="stabilization">Stabilization</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-xs font-normal">
                  {tasks.filter((t) => t.status === 'done').length}/{tasks.length} done
                </Badge>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => void onAiPlan()}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Planning…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI coordination plan
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                AI suggests priorities and handoffs — review before acting. Not legal advice.
              </p>

              {aiHint ? (
                <ScrollArea className="max-h-[140px] rounded-md border bg-muted/20 p-3">
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {aiHint}
                  </pre>
                </ScrollArea>
              ) : null}

              <Separator />

              <ScrollArea className="min-h-0 flex-1 pr-3">
                <ul className="space-y-3 pb-4">
                  {tasks
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((task) => (
                      <li key={task.id} className="rounded-md border p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-medium leading-snug">{task.title}</p>
                            {task.description ? (
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            ) : null}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {task.owner_team ? (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  {task.owner_team}
                                </Badge>
                              ) : null}
                              {task.due_at ? (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  Due {new Date(task.due_at).toLocaleDateString()}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <Select
                            value={task.status}
                            onValueChange={(v) =>
                              void onStatusChange(task.id, v as CoordinationTaskStatus)
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px] shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
