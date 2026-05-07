import { supabase } from '@/integrations/supabase/client';
import type { ParsedImportWorkbook } from './excelWorkbook';
import type { PropertyImportRow, TenantImportRow } from './importSchemas';
import { resolveOrganizationIdForPortfolio, toDbPropertyStatus } from './resolveOrganizationId';

const PROPERTY_BATCH = 45;
const TENANT_LINK_BATCH = 40;
const INSERT_PAUSE_MS = 40;

export type ImportProgress = {
  phase: 'properties' | 'tenants' | 'links' | 'finalize';
  done: number;
  total: number;
  message?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normKey(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function tenantDisplayName(row: TenantImportRow): { first: string; last: string } {
  const first = row.first_name?.trim();
  const last = row.last_name?.trim();
  if (first && last) return { first, last };
  const local = row.email.split('@')[0] ?? 'Tenant';
  const parts = local.replace(/[._]+/g, ' ').trim().split(/\s+/);
  return {
    first: first || parts[0] || 'Imported',
    last: last || parts.slice(1).join(' ') || 'Resident',
  };
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type BulkImportResult = {
  jobId: string | null;
  propertiesInserted: number;
  tenantRowsLinked: number;
  propertyErrors: string[];
  tenantErrors: string[];
  linkErrors: string[];
};

async function createImportJob(
  createdBy: string,
  organizationId: string,
  fileName: string,
  kind: 'properties' | 'tenants' | 'properties_and_tenants',
  totalRows: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('data_import_jobs')
    .insert({
      created_by: createdBy,
      organization_id: organizationId,
      import_kind: kind,
      file_name: fileName,
      status: 'importing',
      total_rows: totalRows,
      processed_rows: 0,
      summary: {},
      error_report: [],
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('data_import_jobs insert skipped:', error.message);
    return null;
  }
  return data?.id ?? null;
}

async function finishImportJob(
  jobId: string | null,
  payload: {
    status: 'completed' | 'failed';
    processed_rows: number;
    summary: Record<string, unknown>;
    error_report: unknown[];
  }
) {
  if (!jobId) return;
  await supabase
    .from('data_import_jobs')
    .update({
      status: payload.status,
      processed_rows: payload.processed_rows,
      summary: payload.summary,
      error_report: payload.error_report,
    })
    .eq('id', jobId);
}

export async function runBulkPortfolioImport(options: {
  ownerId: string;
  fileName: string;
  parsed: ParsedImportWorkbook;
  onProgress?: (p: ImportProgress) => void;
}): Promise<BulkImportResult> {
  const { ownerId, fileName, parsed, onProgress } = options;
  const organizationId = await resolveOrganizationIdForPortfolio(ownerId);

  const kind: 'properties' | 'tenants' | 'properties_and_tenants' =
    parsed.properties.length && parsed.tenants.length
      ? 'properties_and_tenants'
      : parsed.properties.length
        ? 'properties'
        : 'tenants';

  const totalRows = parsed.properties.length + parsed.tenants.length;
  const jobId = await createImportJob(ownerId, organizationId, fileName, kind, totalRows);

  const propertyErrors: string[] = [];
  const tenantErrors: string[] = [];
  const linkErrors: string[] = [];
  let propertiesInserted = 0;
  let tenantRowsLinked = 0;

  const refToPropertyId = new Map<string, string>();
  const nameToPropertyId = new Map<string, string>();

  const reportErrors: unknown[] = [];

  try {
    // --- Properties ---
    const propTotal = parsed.properties.length;
    for (let i = 0; i < parsed.properties.length; i += PROPERTY_BATCH) {
      const slice = parsed.properties.slice(i, i + PROPERTY_BATCH);
      const rows = slice.map(({ data, rowNumber, sheet }) => {
        const ref = data.migration_external_ref?.trim();
        return {
          row: { data, rowNumber, sheet },
          payload: {
            name: data.name.trim(),
            address: data.address?.trim() || null,
            city: data.city?.trim() || null,
            state: data.state?.trim() || null,
            status: toDbPropertyStatus(data.status) ?? 'AVAILABLE',
            owner_id: ownerId,
            organization_id: organizationId,
            migration_external_ref: ref || null,
          },
        };
      });

      for (const { row, payload } of rows) {
        const { error } = await supabase.from('properties').insert(payload);
        if (error) {
          const msg = `[${row.sheet} row ${row.rowNumber}] ${error.message}`;
          propertyErrors.push(msg);
          reportErrors.push({
            sheet: row.sheet,
            row: row.rowNumber,
            type: 'property',
            message: error.message,
          });
        } else {
          propertiesInserted++;
        }
      }

      onProgress?.({
        phase: 'properties',
        done: Math.min(i + slice.length, propTotal),
        total: Math.max(propTotal, 1),
        message: 'Creating properties in batches',
      });
      await sleep(INSERT_PAUSE_MS);
    }

    // Refresh id maps after inserts
    const { data: propRows } = await supabase
      .from('properties')
      .select('id,name,migration_external_ref')
      .eq('organization_id', organizationId)
      .eq('owner_id', ownerId);

    for (const p of propRows ?? []) {
      if (p.migration_external_ref) {
        refToPropertyId.set(String(p.migration_external_ref).trim(), p.id);
      }
      if (p.name) {
        nameToPropertyId.set(normKey(p.name), p.id);
      }
    }

    // --- Tenants + links ---
    const tenantTotal = parsed.tenants.length;
    const seenEmailTenantId = new Map<string, string>();

    for (let i = 0; i < parsed.tenants.length; i += TENANT_LINK_BATCH) {
      const slice = parsed.tenants.slice(i, i + TENANT_LINK_BATCH);

      for (const { data, rowNumber, sheet } of slice) {
        const emailKey = data.email.trim().toLowerCase();
        const refMatch = data.property_external_ref?.trim();
        let propertyId: string | null = null;

        if (refMatch) {
          propertyId = refToPropertyId.get(refMatch) ?? null;
        }
        if (!propertyId && data.property_name?.trim()) {
          propertyId = nameToPropertyId.get(normKey(data.property_name)) ?? null;
        }

        if (!propertyId) {
          const msg = `[${sheet} row ${rowNumber}] Unknown property (${refMatch || data.property_name || '?'})`;
          linkErrors.push(msg);
          reportErrors.push({ sheet, row: rowNumber, type: 'link', message: msg });
          continue;
        }

        try {
          let tenantId = seenEmailTenantId.get(emailKey) ?? null;

          if (!tenantId) {
            const { first, last } = tenantDisplayName(data);
            const { data: ins, error: insErr } = await supabase
              .from('tenants')
              .insert({
                email: data.email.trim().toLowerCase(),
                first_name: first,
                last_name: last,
                phone: data.phone?.trim() || null,
                status: 'active',
                user_id: null,
                created_by_import_user_id: ownerId,
              })
              .select('id')
              .maybeSingle();

            if (insErr || !ins?.id) {
              const msg = `[${sheet} row ${rowNumber}] Tenant insert: ${insErr?.message ?? 'no id returned'}`;
              tenantErrors.push(msg);
              reportErrors.push({ sheet, row: rowNumber, type: 'tenant', message: msg });
              continue;
            }
            tenantId = ins.id;
            seenEmailTenantId.set(emailKey, tenantId);
          }

          const start = (data.start_date?.trim() || todayISODate()).slice(0, 10);
          const end = data.end_date?.trim() ? data.end_date.trim().slice(0, 10) : null;

          const { error: ptErr } = await supabase.from('property_tenants').insert({
            property_id: propertyId,
            tenant_id: tenantId,
            start_date: start,
            end_date: end,
            rent_amount: data.rent_amount ?? null,
            deposit_amount: data.deposit_amount ?? null,
            status: 'active',
          });

          if (ptErr) {
            const msg = `[${sheet} row ${rowNumber}] Lease link: ${ptErr.message}`;
            linkErrors.push(msg);
            reportErrors.push({ sheet, row: rowNumber, type: 'link', message: ptErr.message });
          } else {
            tenantRowsLinked++;
          }
        } catch (e) {
          const msg = `[${sheet} row ${rowNumber}] ${e instanceof Error ? e.message : String(e)}`;
          linkErrors.push(msg);
          reportErrors.push({ sheet, row: rowNumber, type: 'exception', message: msg });
        }
      }

      onProgress?.({
        phase: 'links',
        done: Math.min(i + slice.length, tenantTotal),
        total: Math.max(tenantTotal, 1),
        message: 'Creating tenant profiles and lease links',
      });
      await sleep(INSERT_PAUSE_MS);
    }

    onProgress?.({ phase: 'finalize', done: 1, total: 1, message: 'Done' });

    await finishImportJob(jobId, {
      status: 'completed',
      processed_rows: totalRows,
      summary: {
        propertiesInserted,
        tenantRowsLinked: parsed.tenants.length ? tenantRowsLinked : 0,
        propertyErrorCount: propertyErrors.length,
        tenantErrorCount: tenantErrors.length,
        linkErrorCount: linkErrors.length,
      },
      error_report: reportErrors.slice(0, 500),
    });

    return {
      jobId,
      propertiesInserted,
      tenantRowsLinked: parsed.tenants.length ? tenantRowsLinked : 0,
      propertyErrors,
      tenantErrors,
      linkErrors,
    };
  } catch (e) {
    await finishImportJob(jobId, {
      status: 'failed',
      processed_rows: 0,
      summary: { error: e instanceof Error ? e.message : String(e) },
      error_report: reportErrors,
    });
    throw e;
  }
}
