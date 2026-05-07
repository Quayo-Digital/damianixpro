import * as XLSX from 'xlsx';
import crypto from 'crypto';
import { supabaseAdmin } from './supabaseClient.mjs';

const PROPERTY_BATCH = 100;
const TENANT_BATCH = 100;
const _LINK_BATCH = 100; // reserved for property–tenant link chunking
const STAGE_BATCH = 250;

function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function canonPropertyHeader(h) {
  const aliases = {
    migration_external_ref: 'migration_external_ref',
    external_ref: 'migration_external_ref',
    external_id: 'migration_external_ref',
    property_code: 'migration_external_ref',
    legacy_property_id: 'migration_external_ref',
    code: 'migration_external_ref',
    property_name: 'name',
    name: 'name',
    title: 'name',
    address: 'address',
    street_address: 'address',
    city: 'city',
    town: 'city',
    state: 'state',
    province: 'state',
    region: 'state',
    status: 'status',
  };
  return aliases[h] ?? null;
}

function canonTenantHeader(h) {
  const aliases = {
    email: 'email',
    e_mail: 'email',
    first_name: 'first_name',
    firstname: 'first_name',
    given_name: 'first_name',
    last_name: 'last_name',
    lastname: 'last_name',
    surname: 'last_name',
    family_name: 'last_name',
    phone: 'phone',
    mobile: 'phone',
    property_external_ref: 'property_external_ref',
    external_ref: 'property_external_ref',
    property_code: 'property_external_ref',
    migration_external_ref: 'property_external_ref',
    linked_property_ref: 'property_external_ref',
    property_name: 'property_name',
    building: 'property_name',
    rent: 'rent_amount',
    rent_amount: 'rent_amount',
    monthly_rent: 'rent_amount',
    lease_rent: 'rent_amount',
    deposit: 'deposit_amount',
    deposit_amount: 'deposit_amount',
    security_deposit: 'deposit_amount',
    start_date: 'start_date',
    lease_start: 'start_date',
    end_date: 'end_date',
    lease_end: 'end_date',
  };
  return aliases[h] ?? null;
}

function rowObject(headers, row, canon) {
  const obj = {};
  headers.forEach((rawH, idx) => {
    const nk = canon(rawH);
    if (!nk || nk in obj) return;
    const v = row[idx];
    if (v === null || v === undefined) return;
    if (typeof v === 'number') {
      obj[nk] = v;
      return;
    }
    const s = String(v).trim();
    if (!s) return;
    obj[nk] = s;
  });
  return obj;
}

function inferPropertySheet(workbookSheets) {
  for (let i = 0; i < workbookSheets.length; i += 1) {
    const sh = workbookSheets[i];
    const headerRow = sh.rows[0]?.map(normalizeHeader) ?? [];
    if (!headerRow.length) continue;
    const mapped = headerRow.map((h) => canonPropertyHeader(h)).filter(Boolean);
    if (mapped.includes('name') && mapped.includes('migration_external_ref')) return i;
    if (mapped.includes('name') && mapped.some((x) => x === 'address' || x === 'city' || x === 'state')) return i;
  }
  return null;
}

function inferTenantSheet(workbookSheets, excludeIndex) {
  const preferredName = workbookSheets.findIndex(
    (s, idx) => !excludeIndex.has(idx) && /tenant|resident|occupant/i.test(String(s.name).trim())
  );
  if (preferredName >= 0) return preferredName;
  for (let i = 0; i < workbookSheets.length; i += 1) {
    if (excludeIndex.has(i)) continue;
    const headerRow = workbookSheets[i].rows[0]?.map(normalizeHeader) ?? [];
    const mapped = headerRow.map((h) => canonTenantHeader(h));
    if (mapped.includes('email')) return i;
  }
  return null;
}

function parseNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toDbPropertyStatus(status) {
  if (!status) return 'AVAILABLE';
  const normalized = String(status).trim().toUpperCase().replace(/\s+/g, '_');
  if (['AVAILABLE', 'RENTED', 'SOLD', 'UNDER_MAINTENANCE', 'UNDER_CONTRACT'].includes(normalized)) {
    return normalized;
  }
  return 'AVAILABLE';
}

function normKey(s) {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function tenantDisplayName(row) {
  const first = row.first_name?.trim();
  const last = row.last_name?.trim();
  if (first && last) return { first, last };
  const local = String(row.email || 'tenant').split('@')[0] || 'tenant';
  const parts = local.replace(/[._]+/g, ' ').trim().split(/\s+/);
  return {
    first: first || parts[0] || 'Imported',
    last: last || parts.slice(1).join(' ') || 'Resident',
  };
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDateOrNull(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, 10);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function rpcUpdateProgress(jobId, processedRows, batchSize = null) {
  await supabaseAdmin.rpc('import_job_update_progress', {
    p_job_id: jobId,
    p_processed_rows: processedRows,
    p_batch_size: batchSize,
  });
}

async function rpcFinalize(jobId, status, summary, errorReport) {
  const { error } = await supabaseAdmin.rpc('import_job_finalize', {
    p_job_id: jobId,
    p_status: status,
    p_summary: summary,
    p_error_report: errorReport,
  });
  return error;
}

async function stageRows(jobId, propertyRows, tenantRows) {
  await supabaseAdmin.from('data_import_staging_properties').delete().eq('job_id', jobId);
  await supabaseAdmin.from('data_import_staging_tenants').delete().eq('job_id', jobId);

  for (const batch of chunk(propertyRows, STAGE_BATCH)) {
    const { error } = await supabaseAdmin.from('data_import_staging_properties').insert(batch);
    if (error) throw new Error(`Stage properties failed: ${error.message}`);
  }
  for (const batch of chunk(tenantRows, STAGE_BATCH)) {
    const { error } = await supabaseAdmin.from('data_import_staging_tenants').insert(batch);
    if (error) throw new Error(`Stage tenants failed: ${error.message}`);
  }
}

async function parseWorkbookFromStorage(job) {
  const { data, error } = await supabaseAdmin.storage
    .from(job.storage_bucket)
    .download(job.storage_path);
  if (error || !data) throw new Error(error?.message || 'Could not download import workbook');

  const ab = await data.arrayBuffer();
  const checksumSha256 = crypto
    .createHash('sha256')
    .update(Buffer.from(ab))
    .digest('hex');
  if (job.checksum_sha256 && String(job.checksum_sha256).toLowerCase() !== checksumSha256.toLowerCase()) {
    throw new Error('Uploaded checksum does not match stored checksum for this job');
  }
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const sheets = wb.SheetNames.map((sheetName) => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: false,
    });
    return { name: sheetName, rows };
  }).filter((s) => s.rows.length > 1);

  if (!sheets.length) throw new Error('No data rows found in workbook');

  let propIdx = sheets.findIndex((s) => /^properties$/i.test(String(s.name).trim()));
  if (propIdx < 0) propIdx = inferPropertySheet(sheets) ?? -1;
  const used = new Set();
  if (propIdx >= 0) used.add(propIdx);

  let tenIdx = sheets.findIndex((s) => /^tenants$/i.test(String(s.name).trim()));
  if (tenIdx < 0) tenIdx = inferTenantSheet(sheets, used);

  const propertyRows = [];
  const tenantRows = [];
  const rowErrors = [];
  const sourceColumns = new Set();

  if (propIdx >= 0) {
    const sh = sheets[propIdx];
    const headers = (sh.rows[0] ?? []).map(normalizeHeader);
    headers.forEach((h) => {
      const c = canonPropertyHeader(h);
      if (c) sourceColumns.add(c);
    });
    for (let r = 1; r < sh.rows.length; r += 1) {
      const line = sh.rows[r] ?? [];
      if (!line.some((c) => c !== null && c !== undefined && String(c).trim() !== '')) continue;
      const obj = rowObject(headers, line, canonPropertyHeader);
      const name = typeof obj.name === 'string' ? obj.name.trim() : '';
      const validationError = name ? null : 'Property name is required';
      propertyRows.push({
        job_id: job.id,
        row_number: r + 1,
        sheet_name: sh.name,
        payload: obj,
        validation_error: validationError,
        status: validationError ? 'failed' : 'parsed',
      });
      if (validationError) {
        rowErrors.push({
          sheet: sh.name,
          row: r + 1,
          type: 'property',
          message: validationError,
        });
      }
    }
  }

  if (tenIdx >= 0) {
    const sh = sheets[tenIdx];
    const headers = (sh.rows[0] ?? []).map(normalizeHeader);
    headers.forEach((h) => {
      const c = canonTenantHeader(h);
      if (c) sourceColumns.add(c);
    });
    for (let r = 1; r < sh.rows.length; r += 1) {
      const line = sh.rows[r] ?? [];
      if (!line.some((c) => c !== null && c !== undefined && String(c).trim() !== '')) continue;
      const obj = rowObject(headers, line, canonTenantHeader);
      const email = String(obj.email || '').trim().toLowerCase();
      const hasLink = String(obj.property_external_ref || '').trim() || String(obj.property_name || '').trim();
      let validationError = null;
      if (!email || !email.includes('@')) validationError = 'Valid email is required';
      else if (!hasLink) validationError = 'Provide property_external_ref or property_name to link the tenant';
      tenantRows.push({
        job_id: job.id,
        row_number: r + 1,
        sheet_name: sh.name,
        payload: { ...obj, email },
        validation_error: validationError,
        status: validationError ? 'failed' : 'parsed',
      });
      if (validationError) {
        rowErrors.push({
          sheet: sh.name,
          row: r + 1,
          type: 'tenant',
          message: validationError,
        });
      }
    }
  }

  return { propertyRows, tenantRows, rowErrors, sourceColumns: [...sourceColumns], checksumSha256 };
}

export async function runImportJobCore({ job, workerInstance, insertJobEvent }) {
  if (!supabaseAdmin) throw new Error('Supabase service client is not configured');
  if (!job?.id) throw new Error('Job is required');

  const rowErrors = [];
  let propertiesInserted = 0;
  let tenantRowsLinked = 0;
  let processed = 0;

  await insertJobEvent(job.id, 'batch_started', {
    worker_instance: workerInstance,
    phase: 'parse_and_stage',
  });

  const parsed = await parseWorkbookFromStorage(job);
  rowErrors.push(...parsed.rowErrors);

  await stageRows(job.id, parsed.propertyRows, parsed.tenantRows);

  await supabaseAdmin
    .from('data_import_jobs')
    .update({
      source_columns: parsed.sourceColumns,
      checksum_sha256: parsed.checksumSha256,
    })
    .eq('id', job.id);

  const validProps = parsed.propertyRows.filter((r) => !r.validation_error);
  const validTenants = parsed.tenantRows.filter((r) => !r.validation_error);
  const propBatches = chunk(validProps, PROPERTY_BATCH);
  const noRefMarker = `${job.id}:${parsed.checksumSha256}:no_ref_properties_v1`;
  const { data: noRefClaimed, error: noRefClaimErr } = await supabaseAdmin.rpc(
    'import_job_claim_no_ref_property_guard',
    {
      p_job_id: job.id,
      p_marker: noRefMarker,
    }
  );
  if (noRefClaimErr) throw new Error(`Idempotency guard failed: ${noRefClaimErr.message}`);
  const shouldInsertNoRefProperties = Boolean(noRefClaimed);

  for (const batch of propBatches) {
    const payload = batch.map((r) => ({
      name: String(r.payload.name || '').trim(),
      address: r.payload.address ? String(r.payload.address).trim() : null,
      city: r.payload.city ? String(r.payload.city).trim() : null,
      state: r.payload.state ? String(r.payload.state).trim() : null,
      status: toDbPropertyStatus(r.payload.status),
      owner_id: job.created_by,
      organization_id: job.organization_id,
      migration_external_ref: r.payload.migration_external_ref
        ? String(r.payload.migration_external_ref).trim()
        : null,
    }));

    const withRef = payload.filter((p) => p.migration_external_ref);
    const noRef = payload.filter((p) => !p.migration_external_ref);
    if (withRef.length) {
      const { error } = await supabaseAdmin.from('properties').upsert(withRef, {
        onConflict: 'organization_id,migration_external_ref',
      });
      if (error) throw new Error(`Properties upsert failed: ${error.message}`);
    }
    if (noRef.length && shouldInsertNoRefProperties) {
      const { error } = await supabaseAdmin.from('properties').insert(noRef);
      if (error) throw new Error(`Properties insert failed: ${error.message}`);
    }

    const stagedIds = batch.map((r) => r.id);
    await supabaseAdmin
      .from('data_import_staging_properties')
      .update({ status: 'imported' })
      .in('id', stagedIds);

    propertiesInserted += batch.length;
    processed += batch.length;
    await rpcUpdateProgress(job.id, processed, PROPERTY_BATCH);
    await insertJobEvent(job.id, 'batch_committed', {
      worker_instance: workerInstance,
      phase: 'properties',
      batch_size: batch.length,
      processed_rows: processed,
    });
  }

  const { data: propertyMapRows, error: propMapErr } = await supabaseAdmin
    .from('properties')
    .select('id,name,migration_external_ref')
    .eq('organization_id', job.organization_id)
    .eq('owner_id', job.created_by);
  if (propMapErr) throw new Error(`Property map load failed: ${propMapErr.message}`);

  const refToPropertyId = new Map();
  const nameToPropertyId = new Map();
  for (const p of propertyMapRows || []) {
    if (p.migration_external_ref) refToPropertyId.set(String(p.migration_external_ref).trim(), p.id);
    if (p.name) nameToPropertyId.set(normKey(p.name), p.id);
  }

  for (const batch of chunk(validTenants, TENANT_BATCH)) {
    const emails = [...new Set(batch.map((r) => String(r.payload.email || '').trim().toLowerCase()).filter(Boolean))];
    if (emails.length) {
      const tenantRows = batch.map((r) => {
        const row = r.payload;
        const names = tenantDisplayName(row);
        return {
          email: String(row.email).trim().toLowerCase(),
          first_name: names.first,
          last_name: names.last,
          phone: row.phone ? String(row.phone).trim() : null,
          status: 'active',
          user_id: null,
          created_by_import_user_id: job.created_by,
        };
      });
      const { error } = await supabaseAdmin.from('tenants').upsert(tenantRows, { onConflict: 'email' });
      if (error) throw new Error(`Tenants upsert failed: ${error.message}`);
    }

    const { data: foundTenants, error: foundErr } = await supabaseAdmin
      .from('tenants')
      .select('id,email')
      .in('email', emails);
    if (foundErr) throw new Error(`Tenant lookup failed: ${foundErr.message}`);
    const emailToTenantId = new Map((foundTenants || []).map((t) => [String(t.email).toLowerCase(), t.id]));

    const linkRows = [];
    const failedStagingIds = [];
    const importedStagingIds = [];
    for (const r of batch) {
      const row = r.payload;
      const emailKey = String(row.email || '').trim().toLowerCase();
      const tenantId = emailToTenantId.get(emailKey) || null;
      let propertyId = null;
      const ref = row.property_external_ref ? String(row.property_external_ref).trim() : '';
      if (ref) propertyId = refToPropertyId.get(ref) || null;
      if (!propertyId && row.property_name) propertyId = nameToPropertyId.get(normKey(String(row.property_name))) || null;

      if (!tenantId || !propertyId) {
        failedStagingIds.push(r.id);
        rowErrors.push({
          sheet: r.sheet_name,
          row: r.row_number,
          type: 'link',
          message: `Could not resolve ${!tenantId ? 'tenant' : 'property'} for row`,
        });
        continue;
      }
      linkRows.push({
        property_id: propertyId,
        tenant_id: tenantId,
        start_date: toIsoDateOrNull(row.start_date) || todayISODate(),
        end_date: toIsoDateOrNull(row.end_date),
        rent_amount: parseNumberOrNull(row.rent_amount),
        deposit_amount: parseNumberOrNull(row.deposit_amount),
        status: 'active',
      });
      importedStagingIds.push(r.id);
    }

    if (linkRows.length) {
      const { error } = await supabaseAdmin.from('property_tenants').upsert(linkRows, {
        onConflict: 'property_id,tenant_id',
      });
      if (error) throw new Error(`Property tenant link upsert failed: ${error.message}`);
    }

    if (importedStagingIds.length) {
      await supabaseAdmin
        .from('data_import_staging_tenants')
        .update({ status: 'imported' })
        .in('id', importedStagingIds);
      tenantRowsLinked += importedStagingIds.length;
    }
    if (failedStagingIds.length) {
      await supabaseAdmin
        .from('data_import_staging_tenants')
        .update({ status: 'failed', validation_error: 'Could not resolve tenant/property link' })
        .in('id', failedStagingIds);
    }

    processed += batch.length;
    await rpcUpdateProgress(job.id, processed, TENANT_BATCH);
    await insertJobEvent(job.id, 'batch_committed', {
      worker_instance: workerInstance,
      phase: 'tenants_and_links',
      batch_size: batch.length,
      processed_rows: processed,
    });
  }

  const summary = {
    worker_instance: workerInstance,
    checksum_sha256: parsed.checksumSha256,
    noRefIdempotencyMarker: noRefMarker,
    noRefInsertClaimed: shouldInsertNoRefProperties,
    propertiesInserted,
    tenantRowsLinked,
    propertyRowsParsed: parsed.propertyRows.length,
    tenantRowsParsed: parsed.tenantRows.length,
    errorCount: rowErrors.length,
  };
  const finalizeErr = await rpcFinalize(job.id, 'completed', summary, rowErrors.slice(0, 500));
  if (finalizeErr) throw new Error(`Finalize failed: ${finalizeErr.message}`);

  await insertJobEvent(job.id, 'completed', {
    worker_instance: workerInstance,
    ...summary,
  });

  return summary;
}
