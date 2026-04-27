import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageContent } from '@/components/layout/PageContent';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  buildThemeCssVars,
  replaceTemplateVariables,
  type WhiteLabelTemplateType,
} from '@/lib/whiteLabelHelpers';

type EmailTpl = {
  template_type: WhiteLabelTemplateType;
  subject: string;
  html_content: string;
  text_content: string;
};

const TEMPLATE_TYPES: WhiteLabelTemplateType[] = [
  'welcome',
  'invoice',
  'payment_failed',
  'subscription_ended',
];

const DEFAULT_VARS_JSON = `{
  "tenant_name": "Amina Oke",
  "amount_ngn": "₦180,000",
  "due_date": "2026-05-01",
  "invoice_id": "INV-2048",
  "plan_name": "Professional"
}`;

const FALLBACK_TEMPLATES: Record<WhiteLabelTemplateType, EmailTpl> = {
  welcome: {
    template_type: 'welcome',
    subject: 'Welcome to {{brand_name}}',
    html_content:
      '<p>Hi {{tenant_name}},</p><p>Your workspace on <strong>{{brand_name}}</strong> is ready.</p>',
    text_content: 'Hi {{tenant_name}}, welcome to {{brand_name}}.',
  },
  invoice: {
    template_type: 'invoice',
    subject: 'Invoice {{invoice_id}} — {{amount_ngn}} due {{due_date}}',
    html_content:
      '<p>Hello {{tenant_name}},</p><p>Invoice <strong>{{invoice_id}}</strong> for <strong>{{amount_ngn}}</strong> is due on <strong>{{due_date}}</strong>.</p>',
    text_content: 'Invoice {{invoice_id}} for {{amount_ngn}} due {{due_date}}. — {{brand_name}}',
  },
  payment_failed: {
    template_type: 'payment_failed',
    subject: 'Payment failed for {{brand_name}}',
    html_content:
      '<p>Hi {{tenant_name}},</p><p>We could not process <strong>{{amount_ngn}}</strong>. Please update your payment method.</p>',
    text_content: 'Payment failed for {{amount_ngn}}. Contact support at {{brand_name}}.',
  },
  subscription_ended: {
    template_type: 'subscription_ended',
    subject: 'Your {{plan_name}} subscription on {{brand_name}} has ended',
    html_content:
      '<p>Hi {{tenant_name}},</p><p>Your <strong>{{plan_name}}</strong> subscription has ended. Renew to keep premium access.</p>',
    text_content: 'Subscription {{plan_name}} ended for {{tenant_name}}.',
  },
};

type WhiteLabelRow = {
  id: string;
  brand_name: string;
  domain: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_css: string | null;
  email_templates: EmailTpl[] | null;
};

function parseVarsJson(raw: string): Record<string, string | number> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Variables must be a JSON object.');
  }
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v === 'string' || typeof v === 'number') out[k] = v;
  }
  return out;
}

function pickTemplate(
  templates: EmailTpl[] | null | undefined,
  type: WhiteLabelTemplateType
): EmailTpl {
  const fromDb = templates?.find((t) => t.template_type === type);
  return fromDb ?? FALLBACK_TEMPLATES[type];
}

export default function AdminWhiteLabelPreviewPage() {
  const [brandName, setBrandName] = useState('Acme Estates');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#7c3aed');
  const [logoUrl, setLogoUrl] = useState('');
  const [domain, setDomain] = useState('app.acme-estates.ng');
  const [customDomain, setCustomDomain] = useState('');
  const [customCssBlock, setCustomCssBlock] = useState(
    'border-radius: 1rem;\nbox-shadow: 0 12px 40px rgba(15, 23, 42, 0.12);'
  );
  const [templateType, setTemplateType] = useState<WhiteLabelTemplateType>('welcome');
  const [draftTemplates, setDraftTemplates] = useState<EmailTpl[] | null>(null);
  const [varsJson, setVarsJson] = useState(DEFAULT_VARS_JSON);

  const { data: configs, error: configsError } = useQuery({
    queryKey: ['admin-white-label-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('white_label_configs')
        .select(
          'id,brand_name,domain,custom_domain,logo_url,primary_color,secondary_color,custom_css,email_templates'
        )
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as WhiteLabelRow[];
    },
  });

  const loadRow = useCallback(
    (id: string) => {
      const row = configs?.find((c) => c.id === id);
      if (!row) return;
      setBrandName(row.brand_name || 'Partner');
      setPrimaryColor(row.primary_color || '#2563eb');
      setSecondaryColor(row.secondary_color || '#7c3aed');
      setLogoUrl(row.logo_url || '');
      setDomain(row.domain || '');
      setCustomDomain(row.custom_domain || '');
      setCustomCssBlock(row.custom_css || '');
      setDraftTemplates(Array.isArray(row.email_templates) ? row.email_templates : null);
      toast.success('Loaded draft from database (preview only — not published).');
    },
    [configs]
  );

  const { vars, varsError } = useMemo(() => {
    try {
      return { vars: parseVarsJson(varsJson), varsError: null as string | null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON';
      return { vars: {} as Record<string, string | number>, varsError: msg };
    }
  }, [varsJson]);

  const activeTemplate = useMemo(
    () => pickTemplate(draftTemplates, templateType),
    [draftTemplates, templateType]
  );

  const rendered = useMemo(() => {
    const subject = replaceTemplateVariables(activeTemplate.subject, vars, brandName);
    const html_content = replaceTemplateVariables(activeTemplate.html_content, vars, brandName);
    const text_content = replaceTemplateVariables(activeTemplate.text_content, vars, brandName);
    return { subject, html_content, text_content };
  }, [activeTemplate, vars, brandName]);

  const previewVarsStyle = useMemo(
    () => buildThemeCssVars(primaryColor, secondaryColor),
    [primaryColor, secondaryColor]
  );

  const scopedPreviewCss = useMemo(() => {
    const body = customCssBlock.trim();
    if (!body) return '';
    return `#wl-preview-root { ${body} }`;
  }, [customCssBlock]);

  const exportPayload = useMemo(
    () =>
      JSON.stringify(
        {
          brand_name: brandName,
          domain,
          custom_domain: customDomain || null,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          custom_css: customCssBlock || null,
          email_templates: draftTemplates,
        },
        null,
        2
      ),
    [
      brandName,
      domain,
      customDomain,
      logoUrl,
      primaryColor,
      secondaryColor,
      customCssBlock,
      draftTemplates,
    ]
  );

  const copyExport = () => {
    void navigator.clipboard.writeText(exportPayload);
    toast.success('JSON copied to clipboard (use for DB / handoff).');
  };

  const resetDraft = () => {
    setBrandName('Acme Estates');
    setPrimaryColor('#2563eb');
    setSecondaryColor('#7c3aed');
    setLogoUrl('');
    setDomain('app.acme-estates.ng');
    setCustomDomain('');
    setCustomCssBlock('border-radius: 1rem;\nbox-shadow: 0 12px 40px rgba(15, 23, 42, 0.12);');
    setDraftTemplates(null);
    setTemplateType('welcome');
    setVarsJson(DEFAULT_VARS_JSON);
    toast.message('Reset to sample defaults.');
  };

  const safeHtml = DOMPurify.sanitize(rendered.html_content, { USE_PROFILES: { html: true } });

  return (
    <PageLayout>
      <PageContent
        title="White Label Preview"
        description="Adjust branding, theme tokens, and template variables. Nothing here writes to the database — use export JSON when you are ready to publish via Supabase or your ops process."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={resetDraft}>
              Reset sample
            </Button>
            <Button type="button" onClick={copyExport}>
              Copy export JSON
            </Button>
          </div>
        }
      >
        {configsError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Could not load saved configs</AlertTitle>
            <AlertDescription>
              {configsError instanceof Error ? configsError.message : String(configsError)}. You can
              still use manual fields below. Ensure admins can read{' '}
              <code className="text-xs">white_label_configs</code> if you need the picker.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Load draft</CardTitle>
                <CardDescription>
                  Populate the form from an existing row (read-only). Publishing still happens
                  outside this screen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="wl-config-pick">Saved white label configs</Label>
                <Select disabled={!configs?.length} onValueChange={(id) => loadRow(id)}>
                  <SelectTrigger id="wl-config-pick">
                    <SelectValue
                      placeholder={configs?.length ? 'Choose a row…' : 'No rows found'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(configs ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.brand_name} — {c.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brand &amp; theme</CardTitle>
                <CardDescription>Maps to runtime CSS variables (primary / accent).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="wl-brand">Brand name</Label>
                  <Input
                    id="wl-brand"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-primary">Primary color</Label>
                  <Input
                    id="wl-primary"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-secondary">Secondary / accent</Label>
                  <Input
                    id="wl-secondary"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#7c3aed"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="wl-logo">Logo URL (optional)</Label>
                  <Input
                    id="wl-logo"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-domain">Base domain</Label>
                  <Input
                    id="wl-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="app.partner.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-custom-domain">Custom domain (optional)</Label>
                  <Input
                    id="wl-custom-domain"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="rentals.partner.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="wl-css">Preview-only CSS (declarations)</Label>
                  <Textarea
                    id="wl-css"
                    rows={4}
                    value={customCssBlock}
                    onChange={(e) => setCustomCssBlock(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Wrapped as{' '}
                    <code className="rounded bg-muted px-1">#wl-preview-root {'{ … }'}</code>. Live
                    custom CSS in production is injected globally; keep rules tight when publishing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email template</CardTitle>
                <CardDescription>
                  Uses DB templates when loaded; otherwise built-in samples. Tokens:{' '}
                  <code className="text-xs">{'{{variable}}'}</code> plus{' '}
                  <code className="text-xs">{'{{brand_name}}'}</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select
                    value={templateType}
                    onValueChange={(v) => setTemplateType(v as WhiteLabelTemplateType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-vars">Template variables (JSON object)</Label>
                  <Textarea
                    id="wl-vars"
                    rows={10}
                    value={varsJson}
                    onChange={(e) => setVarsJson(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {varsError ? <p className="text-sm text-destructive">{varsError}</p> : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live UI preview</CardTitle>
                <CardDescription>
                  Scoped to <code className="text-xs">#wl-preview-root</code> — mirrors tenant theme
                  tokens used by the app shell.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scopedPreviewCss ? (
                  <style dangerouslySetInnerHTML={{ __html: scopedPreviewCss }} />
                ) : null}
                <div
                  id="wl-preview-root"
                  className="space-y-4 rounded-xl border border-border bg-background p-6 text-foreground"
                  style={previewVarsStyle}
                >
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt=""
                        className="h-10 w-10 rounded-md object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                        {(brandName.trim().charAt(0) || 'P').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-semibold">{brandName}</div>
                      <div className="text-xs text-muted-foreground">{customDomain || domain}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm">
                      Primary action
                    </Button>
                    <Button type="button" size="sm" variant="secondary">
                      Secondary
                    </Button>
                    <Button type="button" size="sm" variant="outline">
                      Outline
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
                    <p className="text-sm font-medium">Sample card</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tenant: {vars.tenant_name ?? '—'} · Invoice: {vars.invoice_id ?? '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rendered email</CardTitle>
                <CardDescription>Subject + HTML (sanitized) + plain text.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Subject</p>
                  <p className="mt-1 text-sm font-medium">{rendered.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">HTML</p>
                  <div
                    className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-md border border-border bg-muted/30 p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Plain text</p>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
                    {rendered.text_content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}
