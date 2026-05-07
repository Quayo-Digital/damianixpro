import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '@/contexts/auth';
import {
  downloadImportTemplateXlsx,
  parseImportWorkbookFromFile,
  type ParsedImportWorkbook,
} from '@/services/onboarding/excelWorkbook';
import {
  loadSetupWizardState,
  saveSetupWizardState,
  type SetupWizardPersistedState,
} from '@/services/onboarding/wizardStateRepository';
import {
  createServerImportJob,
  getServerImportJob,
  markImportUploadComplete,
  startServerImportJob,
  uploadWorkbookToSignedImportUrl,
} from '@/services/onboarding/serverImportApi';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const STEP_LABELS = [
  'Overview',
  'Company profile',
  'Template & upload',
  'Validation',
  'Import run',
  'Complete',
] as const;

const MAX_ERRORS_PREVIEW = 200;

type ActivationStepId =
  | 'create_company'
  | 'add_property'
  | 'add_units'
  | 'add_tenants'
  | 'activate_payments';

type ActivationEvent = {
  stepId: ActivationStepId;
  action: 'started' | 'completed' | 'skipped';
  at: string;
};

const ACTIVATION_STEPS: Array<{
  id: ActivationStepId;
  title: string;
  detail: string;
  tooltip: string;
  /** Route to navigate to. Omit when the action targets a step inside this same wizard. */
  linkTo?: string;
  /** Wizard step index to jump to when the activation step is in-page (e.g. company profile). */
  wizardStep?: number;
  linkLabel: string;
}> = [
  {
    id: 'create_company',
    title: 'Create company',
    detail: 'Set identity, timezone, and operating profile.',
    tooltip: 'A complete profile improves defaults, billing setup, and team onboarding prompts.',
    wizardStep: 1,
    linkLabel: 'Open company setup',
  },
  {
    id: 'add_property',
    title: 'Add property',
    detail: 'Create your first property record.',
    tooltip: 'Properties are the anchor for units, leases, and payment analytics.',
    linkTo: '/properties',
    linkLabel: 'Open properties',
  },
  {
    id: 'add_units',
    title: 'Add units',
    detail: 'Define rentable inventory for occupancy tracking.',
    tooltip: 'Units unlock occupancy %, vacancy insights, and rent roll completeness.',
    linkTo: '/properties',
    linkLabel: 'Manage units',
  },
  {
    id: 'add_tenants',
    title: 'Add tenants',
    detail: 'Link residents to active units and leases.',
    tooltip: 'Tenant records are required for collections, arrears tracking, and reminders.',
    linkTo: '/tenants',
    linkLabel: 'Open tenants',
  },
  {
    id: 'activate_payments',
    title: 'Activate payments',
    detail: 'Enable payment collection and settlement workflows.',
    tooltip:
      'This is the final activation milestone and primary value trigger for revenue tracking.',
    linkTo: '/payments',
    linkLabel: 'Open payments',
  },
];

export function OrganizationMigrationWizard() {
  const { user } = useAuthSession();
  const userId = user?.id ?? '';
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [persistLoaded, setPersistLoaded] = useState(false);

  const [wizardState, setWizardState] = useState<SetupWizardPersistedState>({});
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedImportWorkbook | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ pct: number; message: string } | null>(
    null
  );
  const [lastResultSummary, setLastResultSummary] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activationCurrentStep, setActivationCurrentStep] = useState(0);
  const [activationStatus, setActivationStatus] = useState<
    Record<ActivationStepId, { completed: boolean; skipped: boolean }>
  >({
    create_company: { completed: false, skipped: false },
    add_property: { completed: false, skipped: false },
    add_units: { completed: false, skipped: false },
    add_tenants: { completed: false, skipped: false },
    activate_payments: { completed: false, skipped: false },
  });
  const [activationEvents, setActivationEvents] = useState<ActivationEvent[]>([]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const loaded = await loadSetupWizardState(userId);
      if (loaded && loaded.step >= 0 && loaded.step < STEP_LABELS.length) {
        setStep(loaded.step);
        setWizardState((s) => ({ ...s, ...loaded.state }));
        if (typeof loaded.state.activationCurrentStep === 'number') {
          setActivationCurrentStep(
            Math.max(0, Math.min(ACTIVATION_STEPS.length - 1, loaded.state.activationCurrentStep))
          );
        }
        if (loaded.state.activationStatus && typeof loaded.state.activationStatus === 'object') {
          setActivationStatus((prev) => {
            const next = { ...prev };
            for (const cfg of ACTIVATION_STEPS) {
              const raw = loaded.state.activationStatus?.[cfg.id];
              if (raw && typeof raw === 'object') {
                next[cfg.id] = {
                  completed: Boolean(raw.completed),
                  skipped: Boolean(raw.skipped),
                };
              }
            }
            return next;
          });
        }
        if (Array.isArray(loaded.state.activationEvents)) {
          const parsed = loaded.state.activationEvents
            .map((ev) => {
              if (!ev || typeof ev !== 'object') return null;
              const stepId = (ev as { stepId?: string }).stepId;
              const action = (ev as { action?: string }).action;
              const at = (ev as { at?: string }).at;
              if (
                !stepId ||
                !action ||
                !at ||
                !ACTIVATION_STEPS.some((s) => s.id === stepId) ||
                !['started', 'completed', 'skipped'].includes(action)
              ) {
                return null;
              }
              return {
                stepId: stepId as ActivationStepId,
                action: action as ActivationEvent['action'],
                at,
              };
            })
            .filter(Boolean) as ActivationEvent[];
          setActivationEvents(parsed);
        }
        if (loaded.state.lastImportSummary) {
          setLastResultSummary(loaded.state.lastImportSummary);
        }
      }
      setPersistLoaded(true);
    })();
  }, [userId]);

  const persist = useCallback(
    async (nextStep: number, next: SetupWizardPersistedState) => {
      if (!userId) return;
      setWizardState(next);
      await saveSetupWizardState(userId, nextStep, next);
    },
    [userId]
  );

  const blockingIssuesCount = parsed?.issues.length ?? 0;
  /** Parser emits an issue row for each invalid spreadsheet line — block until cleared. */
  const canProceedValidate = blockingIssuesCount === 0;
  const activationDoneCount = ACTIVATION_STEPS.filter(
    (s) => activationStatus[s.id].completed
  ).length;
  const activationSkippedCount = ACTIVATION_STEPS.filter(
    (s) => activationStatus[s.id].skipped
  ).length;
  const activationProgressPct = Math.round((activationDoneCount / ACTIVATION_STEPS.length) * 100);
  const firstStepStartedAt =
    activationEvents.find((e) => e.stepId === 'create_company' && e.action === 'started')?.at ??
    null;
  const finalStepCompletedAt =
    activationEvents.find((e) => e.stepId === 'activate_payments' && e.action === 'completed')
      ?.at ?? null;
  const funnelConverted = Boolean(firstStepStartedAt && finalStepCompletedAt);
  const funnelConversionRate = funnelConverted ? 100 : activationProgressPct;

  const persistActivation = useCallback(
    async (
      nextStepIndex: number,
      nextStatus: Record<ActivationStepId, { completed: boolean; skipped: boolean }>,
      nextEvents: ActivationEvent[]
    ) => {
      const nextWizard = {
        ...wizardState,
        activationCurrentStep: nextStepIndex,
        activationStatus: nextStatus,
        activationEvents: nextEvents,
      };
      await persist(step, nextWizard);
    },
    [persist, step, wizardState]
  );

  const appendActivationEvent = useCallback(
    async (event: ActivationEvent) => {
      const nextEvents = [...activationEvents, event];
      setActivationEvents(nextEvents);
      await persistActivation(activationCurrentStep, activationStatus, nextEvents);
      return nextEvents;
    },
    [activationCurrentStep, activationEvents, activationStatus, persistActivation]
  );

  const markActivationStep = useCallback(
    async (id: ActivationStepId, mode: 'complete' | 'skip') => {
      const nextStatus = {
        ...activationStatus,
        [id]: {
          completed: mode === 'complete',
          skipped: mode === 'skip',
        },
      };
      const nextStep = Math.min(activationCurrentStep + 1, ACTIVATION_STEPS.length - 1);
      const now = new Date().toISOString();
      const nextEvents = [
        ...activationEvents,
        { stepId: id, action: mode === 'complete' ? 'completed' : 'skipped', at: now },
      ];
      setActivationStatus(nextStatus);
      setActivationCurrentStep(nextStep);
      setActivationEvents(nextEvents);
      await persistActivation(nextStep, nextStatus, nextEvents);
      toast.success(mode === 'complete' ? 'Step marked complete' : 'Step skipped for now');
    },
    [activationCurrentStep, activationEvents, activationStatus, persistActivation]
  );

  useEffect(() => {
    const currentStep = ACTIVATION_STEPS[activationCurrentStep];
    if (!currentStep) return;
    const currentStatus = activationStatus[currentStep.id];
    if (currentStatus.completed || currentStatus.skipped) return;
    const alreadyStarted = activationEvents.some(
      (ev) => ev.stepId === currentStep.id && ev.action === 'started'
    );
    if (alreadyStarted) return;
    void appendActivationEvent({
      stepId: currentStep.id,
      action: 'started',
      at: new Date().toISOString(),
    });
  }, [activationCurrentStep, activationEvents, activationStatus, appendActivationEvent]);

  const handleParseFile = useCallback(async (f: File | null) => {
    setFile(f);
    setParsed(null);
    if (!f) return;
    setParsing(true);
    try {
      const result = await parseImportWorkbookFromFile(f);
      setParsed(result);
      toast.success(
        `Parsed ${result.properties.length} properties, ${result.tenants.length} tenant rows`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not read spreadsheet');
    } finally {
      setParsing(false);
    }
  }, []);

  const runImport = useCallback(async () => {
    if (!userId || !parsed || !file) {
      toast.error('Upload a workbook first.');
      return;
    }
    setImporting(true);
    setImportProgress({ pct: 5, message: 'Starting…' });
    try {
      const sourceColumns = [
        ...new Set(
          [
            ...Object.keys(parsed.properties[0]?.data ?? {}),
            ...Object.keys(parsed.tenants[0]?.data ?? {}),
          ].filter(Boolean)
        ),
      ];

      setImportProgress({ pct: 12, message: 'Creating signed server import job…' });
      const created = await createServerImportJob({
        ownerId: userId,
        fileName: file.name,
        propertyRows: parsed.properties.length,
        tenantRows: parsed.tenants.length,
        sourceColumns,
      });

      setActiveJobId(created.job.id);
      setImportProgress({ pct: 38, message: 'Uploading workbook to secure storage…' });
      await uploadWorkbookToSignedImportUrl(created.upload, file);

      setImportProgress({ pct: 62, message: 'Recording upload audit metadata…' });
      await markImportUploadComplete(created.job.id);

      setImportProgress({ pct: 80, message: 'Queueing import for worker processing…' });
      const queued = await startServerImportJob(created.job.id);
      const jobView = await getServerImportJob(created.job.id);

      const lines = [
        `Job ID: ${created.job.id}`,
        `Status: ${jobView.job.status}`,
        `Rows queued: ${jobView.job.total_rows}`,
        `Current processed rows: ${jobView.job.processed_rows}`,
        `Message: ${queued.message}`,
      ];
      setLastResultSummary(lines.join('\n'));
      toast.success('Import file uploaded and queued for server-side worker processing');

      const nextWizard = {
        ...wizardState,
        lastFileName: file.name,
        lastImportAt: new Date().toISOString(),
        lastImportSummary: lines.join('\n'),
      };
      await persist(5, nextWizard);
      setStep(5);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  }, [file, parsed, persist, step, userId, wizardState]);

  const stepper = useMemo(
    () => (
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {STEP_LABELS.map((label, idx) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                idx <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx < step ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${idx === step ? 'font-medium' : 'text-muted-foreground'}`}
            >
              {label}
            </span>
            {idx < STEP_LABELS.length - 1 && (
              <div className="mx-1 hidden h-px w-6 bg-border sm:block" aria-hidden />
            )}
          </div>
        ))}
      </div>
    ),
    [step]
  );

  const jumpToWizardStep = useCallback(
    (targetStep: number) => {
      const clamped = Math.max(0, Math.min(STEP_LABELS.length - 1, targetStep));
      // Update UI immediately — awaiting persistence first felt broken when saves were slow or stalled.
      setStep(clamped);
      void persist(clamped, wizardState);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById('wizard-main-step-panel')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        });
      });
    },
    [persist, wizardState]
  );

  if (!persistLoaded || !userId) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading setup…
      </div>
    );
  }

  return (
    <div id="organization-migration-wizard" className="mx-auto max-w-4xl">
      {stepper}
      <Card className="mb-6 border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Guided activation onboarding</CardTitle>
          <CardDescription>
            Complete the five core steps to reduce setup friction and improve activation rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border bg-card p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Step 1 started
              </p>
              <p className="text-sm font-medium">
                {firstStepStartedAt ? new Date(firstStepStartedAt).toLocaleString() : 'Not started'}
              </p>
            </div>
            <div className="rounded-md border bg-card p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Step 5 completed
              </p>
              <p className="text-sm font-medium">
                {finalStepCompletedAt
                  ? new Date(finalStepCompletedAt).toLocaleString()
                  : 'Not completed'}
              </p>
            </div>
            <div className="rounded-md border bg-card p-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Funnel conversion
              </p>
              <p className="text-sm font-medium">{funnelConversionRate}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress: {activationDoneCount}/5 completed</span>
              <span>{activationSkippedCount} skipped</span>
            </div>
            <Progress value={activationProgressPct} className="h-2" />
          </div>

          <TooltipProvider>
            <div className="space-y-2">
              {ACTIVATION_STEPS.map((cfg, idx) => {
                const st = activationStatus[cfg.id];
                const isActive = idx === activationCurrentStep;
                const statusLabel = st.completed
                  ? 'Completed'
                  : st.skipped
                    ? 'Skipped'
                    : isActive
                      ? 'Current'
                      : 'Pending';
                return (
                  <div
                    key={cfg.id}
                    className={`rounded-lg border p-3 ${
                      isActive ? 'border-primary/40 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                          <span className="font-medium">{cfg.title}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`About ${cfg.title}`}
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              {cfg.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">{cfg.detail}</p>
                      </div>
                      <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {typeof cfg.wizardStep === 'number' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => jumpToWizardStep(cfg.wizardStep!)}
                        >
                          {cfg.linkLabel}
                        </Button>
                      ) : cfg.linkTo ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (cfg.linkTo) navigate(cfg.linkTo);
                          }}
                        >
                          {cfg.linkLabel}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void markActivationStep(cfg.id, 'complete')}
                      >
                        Mark complete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void markActivationStep(cfg.id, 'skip')}
                      >
                        Skip for now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Anchor below guided activation — scroll target so “Open company setup” reveals the step panels */}
      <div id="wizard-main-step-panel" className="scroll-mt-24" />

      {step === 0 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Organization onboarding & data migration
            </CardTitle>
            <CardDescription>
              Guided setup for landlords and admins moving from spreadsheets or legacy systems. Work
              is batched so large portfolios remain responsive; pause between steps anytime—your
              progress is saved to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              <li>Two-sheet Excel workbook: Properties and Tenants (template provided).</li>
              <li>
                Column mapping tolerates common header aliases used by Nigerian property sheets.
              </li>
              <li>Validation highlights every bad row before any database writes run.</li>
              <li>Imports create properties first, then tenant profiles with lease rows.</li>
            </ul>
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertTitle>Recommended</AlertTitle>
              <AlertDescription>
                Portfolio owners or platform admins should run the import wizard. Rows are created
                as the signed-in user as property owner unless your internal process assigns agents
                after import.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="button"
              onClick={() => void persist(1, wizardState).then(() => setStep(1))}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 1 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
            <CardDescription>
              Captures naming context for your rollout. Stored with your onboarding progress (not a
              full org directory replacement).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="co-name">Legal / operating name</Label>
              <Input
                id="co-name"
                value={wizardState.companyName ?? ''}
                onChange={(e) => setWizardState((s) => ({ ...s, companyName: e.target.value }))}
                placeholder="e.g. Northwind Estates Nigeria Ltd"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tz">Primary time zone</Label>
                <Input
                  id="tz"
                  value={wizardState.timeZone ?? ''}
                  onChange={(e) => setWizardState((s) => ({ ...s, timeZone: e.target.value }))}
                  placeholder="Africa/Lagos"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry type hint</Label>
                <Input
                  id="industry"
                  value={wizardState.industryType ?? ''}
                  onChange={(e) => setWizardState((s) => ({ ...s, industryType: e.target.value }))}
                  placeholder="landlord, agency, institutional…"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => void persist(0, wizardState).then(() => setStep(0))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={() =>
                persist(2, {
                  ...wizardState,
                  companyName: wizardState.companyName?.trim(),
                  timeZone: wizardState.timeZone?.trim() || 'Africa/Lagos',
                  industryType: wizardState.industryType?.trim(),
                }).then(() => setStep(2))
              }
            >
              Save & continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Template & workbook upload</CardTitle>
            <CardDescription>
              Download the starter Excel file, replace sample rows with your portfolio, keep tab
              names <code className="text-xs">Properties</code> and{' '}
              <code className="text-xs">Tenants</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => void downloadImportTemplateXlsx()}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download template (.xlsx)
              </Button>
            </div>
            <Separator />
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Upload className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                Spreadsheet uploads are parsed in-browser. Very large files (50k+ rows) may take a
                short while.
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="max-w-xs cursor-pointer"
                disabled={parsing}
                onChange={(e) => void handleParseFile(e.target.files?.[0] ?? null)}
              />
              {parsing && (
                <div className="mt-4 flex justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing…
                </div>
              )}
            </div>
            {parsed && (
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">{file?.name ?? 'Workbook'}:</strong>{' '}
                {parsed.properties.length} property rows · {parsed.tenants.length} tenant rows ·{' '}
                {blockingIssuesCount} blocking issues
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => void persist(1, wizardState).then(() => setStep(1))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              disabled={!parsed}
              onClick={() => {
                void persist(3, wizardState).then(() => setStep(3));
              }}
            >
              Continue to validation
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Validation</CardTitle>
            <CardDescription>
              Fix blocking issues in Excel, re-upload from the previous step, then continue.
              Warnings below are capped for browser performance—you can scroll the full export in a
              later iteration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parsed ? (
              <Alert variant="destructive">
                <AlertTitle>No workbook</AlertTitle>
                <AlertDescription>Go back and upload your spreadsheet.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-4 text-sm">
                  <SummaryPill
                    label="Properties (ok)"
                    value={parsed.properties.length}
                    variant="good"
                  />
                  <SummaryPill label="Tenants (ok)" value={parsed.tenants.length} variant="good" />
                  <SummaryPill
                    label="Blocking issues"
                    value={blockingIssuesCount}
                    variant={blockingIssuesCount ? 'bad' : 'good'}
                  />
                </div>
                <ScrollArea className="h-[min(380px,calc(100vh-24rem))] rounded-md border">
                  <div className="min-w-[640px] p-4">
                    {!parsed.issues.length ? (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        No validation issues detected. Proceed to run the import.
                      </p>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="p-2">Sheet</th>
                            <th className="p-2">Row</th>
                            <th className="p-2">Problems</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.issues.slice(0, MAX_ERRORS_PREVIEW).map((iss, idx) => (
                            <tr
                              key={`${iss.sheet}-${iss.rowNumber}-${idx}`}
                              className="border-b border-border/60"
                            >
                              <td className="p-2">{iss.sheet}</td>
                              <td className="p-2 font-mono">{iss.rowNumber || '—'}</td>
                              <td className="p-2 text-muted-foreground">
                                {iss.messages.join('; ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {parsed.issues.length > MAX_ERRORS_PREVIEW && (
                      <p className="mt-2 text-xs text-amber-600">
                        Showing first {MAX_ERRORS_PREVIEW} of {parsed.issues.length} issues. Narrow
                        your sheet and re-parse for the rest.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => void persist(2, wizardState).then(() => setStep(2))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Adjust file
            </Button>
            <Button
              type="button"
              disabled={!canProceedValidate || !parsed}
              onClick={() => {
                void persist(4, wizardState).then(() => setStep(4));
              }}
            >
              Approve & run import
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Run import</CardTitle>
            <CardDescription>
              Upload signs your workbook to private storage and queues a server-side import job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {importProgress && (
              <div className="space-y-2">
                <Progress value={importProgress.pct} className="h-2" />
                <p className="text-sm text-muted-foreground">{importProgress.message}</p>
              </div>
            )}
            {!importing && !importProgress && (
              <Alert>
                <AlertTitle>Ready when you are</AlertTitle>
                <AlertDescription>
                  This will insert properties where needed, create tenant stubs (until they sign
                  up), and add active lease rows once the server worker is enabled. In Phase 1 this
                  step creates the job, uploads securely, and records audit events.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={importing}
              onClick={() => void persist(3, wizardState).then(() => setStep(3))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="button" disabled={importing || !parsed} onClick={() => void runImport()}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                'Start import'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 5 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Done</CardTitle>
            <CardDescription>Summary of your last migration pass.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastResultSummary ? (
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/60 p-4 text-sm">
                {lastResultSummary}
              </pre>
            ) : (
              <p className="text-muted-foreground">No import has been run yet in this session.</p>
            )}
            {activeJobId && (
              <p className="text-xs text-muted-foreground">Import Job ID: {activeJobId}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="default" onClick={() => navigate('/properties')}>
                Go to properties
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/tenants')}>
                View tenants module
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => void persist(0, wizardState).then(() => setStep(0))}
            >
              Restart wizard overview
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: 'good' | 'bad';
}) {
  return (
    <div
      className={`rounded-full border px-3 py-1 ${
        variant === 'bad' && value > 0
          ? 'border-destructive/40 bg-destructive/10'
          : 'border-border bg-card'
      }`}
    >
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-semibold">{value}</span>
    </div>
  );
}
