/* Context modules intentionally export Provider + consumer hook; Fast Refresh rule is too strict here. */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  hexToHslTriplet,
  replaceTemplateVariables,
  type WhiteLabelTemplateType,
} from '@/lib/whiteLabelHelpers';

type TemplateType = WhiteLabelTemplateType;

type WhiteLabelTemplate = {
  template_type: TemplateType;
  subject: string;
  html_content: string;
  text_content: string;
  variables?: string[];
};

type WhiteLabelConfigRecord = {
  id: string;
  brand_name: string;
  domain: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_css: string | null;
  email_templates: WhiteLabelTemplate[] | null;
  subscription_id: string;
  is_active: boolean | null;
};

type WhiteLabelContextValue = {
  loading: boolean;
  isWhiteLabel: boolean;
  brandName: string;
  logoUrl: string | null;
  config: WhiteLabelConfigRecord | null;
  renderTemplate: (
    templateType: TemplateType,
    vars: Record<string, string | number>
  ) => WhiteLabelTemplate | null;
};

const DEFAULT_BRAND_NAME = 'DamianixPro';
const WL_CUSTOM_CSS_STYLE_ID = 'white-label-custom-css';

const WhiteLabelContext = createContext<WhiteLabelContextValue>({
  loading: false,
  isWhiteLabel: false,
  brandName: DEFAULT_BRAND_NAME,
  logoUrl: null,
  config: null,
  renderTemplate: () => null,
});

function normalizeHost(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
}

function isNonProductionHost(hostname: string): boolean {
  const h = normalizeHost(hostname);
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
}

function applyThemeVariables(config: WhiteLabelConfigRecord | null): void {
  const root = document.documentElement;
  if (!config) {
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--sidebar-primary');
    root.style.removeProperty('--sidebar-accent');
    return;
  }

  const primaryHsl = hexToHslTriplet(config.primary_color);
  const secondaryHsl = hexToHslTriplet(config.secondary_color);
  if (primaryHsl) {
    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--ring', primaryHsl);
    root.style.setProperty('--sidebar-primary', primaryHsl);
  }
  if (secondaryHsl) {
    root.style.setProperty('--accent', secondaryHsl);
    root.style.setProperty('--sidebar-accent', secondaryHsl);
  }
}

function applyCustomCss(config: WhiteLabelConfigRecord | null): void {
  const existing = document.getElementById(WL_CUSTOM_CSS_STYLE_ID);
  if (!config?.custom_css?.trim()) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.textContent = config.custom_css;
    return;
  }

  const styleTag = document.createElement('style');
  styleTag.id = WL_CUSTOM_CSS_STYLE_ID;
  styleTag.textContent = config.custom_css;
  document.head.appendChild(styleTag);
}

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WhiteLabelConfigRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadByDomain = async () => {
      if (typeof window === 'undefined') {
        if (!cancelled) setLoading(false);
        return;
      }

      const hostname = normalizeHost(window.location.hostname);
      if (isNonProductionHost(hostname)) {
        if (!cancelled) {
          setConfig(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('white_label_configs')
        .select(
          'id,brand_name,domain,custom_domain,logo_url,primary_color,secondary_color,custom_css,email_templates,subscription_id,is_active'
        )
        .eq('is_active', true)
        .or(`domain.eq.${hostname},custom_domain.eq.${hostname}`)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setConfig(null);
        setLoading(false);
        return;
      }

      const { data: subscriptionRow } = await supabase
        .from('user_subscriptions')
        .select('status,trial_end')
        .eq('id', data.subscription_id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      const activeOrTrialing =
        subscriptionRow?.status === 'active' ||
        (subscriptionRow?.status === 'trialing' &&
          (!subscriptionRow?.trial_end ||
            new Date(subscriptionRow.trial_end).getTime() > Date.now()));

      if (!activeOrTrialing) {
        setConfig(null);
        setLoading(false);
        return;
      }

      setConfig(data as WhiteLabelConfigRecord);
      setLoading(false);
    };

    void loadByDomain();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    applyThemeVariables(config);
    applyCustomCss(config);
  }, [config]);

  useEffect(() => {
    if (!config || typeof window === 'undefined') return;
    const currentHost = normalizeHost(window.location.hostname);
    const baseHost = normalizeHost(config.domain);
    const customHost = config.custom_domain ? normalizeHost(config.custom_domain) : null;

    // Canonical domain routing: when tenant has a custom domain, keep traffic there.
    if (customHost && currentHost === baseHost && !isNonProductionHost(currentHost)) {
      const next = `${window.location.protocol}//${customHost}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(next);
    }
  }, [config]);

  const value = useMemo<WhiteLabelContextValue>(() => {
    const brandName = config?.brand_name?.trim() || DEFAULT_BRAND_NAME;
    return {
      loading,
      isWhiteLabel: Boolean(config),
      brandName,
      logoUrl: config?.logo_url ?? null,
      config,
      renderTemplate: (templateType, vars) => {
        const template = config?.email_templates?.find((t) => t.template_type === templateType);
        if (!template) return null;
        return {
          ...template,
          subject: replaceTemplateVariables(template.subject, vars, brandName),
          html_content: replaceTemplateVariables(template.html_content, vars, brandName),
          text_content: replaceTemplateVariables(template.text_content, vars, brandName),
        };
      },
    };
  }, [config, loading]);

  return <WhiteLabelContext.Provider value={value}>{children}</WhiteLabelContext.Provider>;
}

export function useWhiteLabel() {
  return useContext(WhiteLabelContext);
}
