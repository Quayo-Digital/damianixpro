import type { TenantImportRow, PropertyImportRow } from './importSchemas';
import {
  propertyImportRowSchema,
  tenantImportRowSchema,
  validateTenantPropertyLink,
} from './importSchemas';

export type ParseIssue = {
  sheet: string;
  rowNumber: number;
  messages: string[];
};

export type ParsedImportWorkbook = {
  properties: Array<{ sheet: string; rowNumber: number; data: PropertyImportRow }>;
  tenants: Array<{ sheet: string; rowNumber: number; data: TenantImportRow }>;
  issues: ParseIssue[];
};

function normalizeHeader(cell: unknown): string {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/** Map spreadsheet column names → canonical importer keys */
function canonPropertyHeader(h: string): string | null {
  const aliases: Record<string, string> = {
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

function canonTenantHeader(h: string): string | null {
  const aliases: Record<string, string> = {
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

function rowObject(
  headers: string[],
  row: unknown[],
  canon: (h: string) => string | null
): Record<string, string | number | undefined> {
  const obj: Record<string, string | number | undefined> = {};
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

/** Pick sheet whose first row resolves to canonical property-like headers */
function inferPropertySheet(workbookSheets: { name: string; rows: unknown[][] }[]): number | null {
  for (let i = 0; i < workbookSheets.length; i++) {
    const sh = workbookSheets[i];
    const headerRow = sh.rows[0]?.map(normalizeHeader) ?? [];
    if (!headerRow.length) continue;
    const mapped = headerRow.map((h) => canonPropertyHeader(h)).filter(Boolean);
    if (mapped.includes('name') && mapped.includes('migration_external_ref')) return i;
    if (
      mapped.filter((x) => x === 'address' || x === 'city' || x === 'state').length >= 1 &&
      mapped.includes('name')
    )
      return i;
  }
  return null;
}

/** Pick sheet primarily by name, else inferred email column */
function inferTenantSheet(
  workbookSheets: { name: string; rows: unknown[][] }[],
  excludeIndex: Set<number>
): number | null {
  const preferredName = workbookSheets.findIndex(
    (s, idx) => !excludeIndex.has(idx) && /tenant|resident|occupant/i.test(String(s.name).trim())
  );
  if (preferredName >= 0) return preferredName;

  for (let i = 0; i < workbookSheets.length; i++) {
    if (excludeIndex.has(i)) continue;
    const headerRow = workbookSheets[i].rows[0]?.map(normalizeHeader) ?? [];
    const canon = headerRow.map((h) => canonTenantHeader(h));
    if (canon.includes('email')) return i;
  }
  return null;
}

async function sheetRowsFromFile(file: File): Promise<{ name: string; rows: unknown[][] }[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const out: { name: string; rows: unknown[][] }[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
      header: 1,
      defval: null,
      raw: false,
    }) as unknown[][];
    out.push({ name: sheetName, rows });
  }
  return out.filter((s) => s.rows.length > 1);
}

function parsePropertySheet(sh: { name: string; rows: unknown[][] }): ParsedImportWorkbook {
  const issues: ParseIssue[] = [];
  const properties: ParsedImportWorkbook['properties'] = [];
  const headerCells = (sh.rows[0] ?? []).map(normalizeHeader);

  for (let r = 1; r < sh.rows.length; r++) {
    const line = sh.rows[r] ?? [];
    if (!line.some((c) => c !== null && c !== undefined && String(c).trim() !== '')) continue;
    const obj = rowObject(headerCells, line, canonPropertyHeader);
    const res = propertyImportRowSchema.safeParse(obj);
    if (!res.success) {
      issues.push({
        sheet: sh.name,
        rowNumber: r + 1,
        messages: res.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      continue;
    }
    properties.push({ sheet: sh.name, rowNumber: r + 1, data: res.data });
  }

  return { properties, tenants: [], issues };
}

function parseTenantSheet(sh: { name: string; rows: unknown[][] }): ParsedImportWorkbook {
  const issues: ParseIssue[] = [];
  const tenants: ParsedImportWorkbook['tenants'] = [];
  const headerCells = (sh.rows[0] ?? []).map(normalizeHeader);

  for (let r = 1; r < sh.rows.length; r++) {
    const line = sh.rows[r] ?? [];
    if (!line.some((c) => c !== null && c !== undefined && String(c).trim() !== '')) continue;
    const obj = rowObject(headerCells, line, canonTenantHeader);
    const res = tenantImportRowSchema.safeParse(obj);
    if (!res.success) {
      issues.push({
        sheet: sh.name,
        rowNumber: r + 1,
        messages: res.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      continue;
    }
    const linkErr = validateTenantPropertyLink(res.data);
    if (linkErr) {
      issues.push({ sheet: sh.name, rowNumber: r + 1, messages: [linkErr] });
      continue;
    }
    tenants.push({ sheet: sh.name, rowNumber: r + 1, data: res.data });
  }

  return { properties: [], tenants, issues };
}

/**
 * Parses an Excel workbook. Expects tabs `Properties` and `Tenants` when named;
 * otherwise infers sheets by columns (name/address vs email).
 */
export async function parseImportWorkbookFromFile(file: File): Promise<ParsedImportWorkbook> {
  const sheets = await sheetRowsFromFile(file);
  if (!sheets.length) {
    return {
      properties: [],
      tenants: [],
      issues: [{ sheet: '_', rowNumber: 0, messages: ['No data rows found'] }],
    };
  }

  const byPreferredName = (re: RegExp) => sheets.findIndex((s) => re.test(String(s.name).trim()));

  let propIdx = byPreferredName(/^properties$/i);
  if (propIdx < 0) propIdx = inferPropertySheet(sheets) ?? -1;

  const used = new Set<number>();
  if (propIdx >= 0) used.add(propIdx);

  let tenIdx = byPreferredName(/^tenants$/i);
  if (tenIdx < 0) tenIdx = inferTenantSheet(sheets, used);
  if (tenIdx >= 0) used.add(tenIdx);

  const merged: ParsedImportWorkbook = { properties: [], tenants: [], issues: [] };

  if (propIdx >= 0) {
    const p = parsePropertySheet(sheets[propIdx]);
    merged.properties.push(...p.properties);
    merged.issues.push(...p.issues);
  }

  if (tenIdx >= 0) {
    const t = parseTenantSheet(sheets[tenIdx]);
    merged.tenants.push(...t.tenants);
    merged.issues.push(...t.issues);
  }

  if (propIdx < 0 && tenIdx < 0) {
    merged.issues.push({
      sheet: sheets[0]?.name ?? '_',
      rowNumber: 1,
      messages: [
        'Could not detect property or tenant sheets. Add tabs named "Properties" and "Tenants", or use recognizable column headers.',
      ],
    });
  }

  return merged;
}

export async function downloadImportTemplateXlsx(): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const propertyHeaders = ['migration_external_ref', 'name', 'address', 'city', 'state', 'status'];
  const propertySample = [
    ['BLK-A-001', 'Sunset Annex Block A', '12 Admiralty Rd', 'Lagos', 'Lagos', 'AVAILABLE'],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([propertyHeaders, ...propertySample]),
    'Properties'
  );

  const tenantHeaders = [
    'email',
    'first_name',
    'last_name',
    'phone',
    'property_external_ref',
    'property_name',
    'rent_amount',
    'deposit_amount',
    'start_date',
    'end_date',
  ];
  const tenantSample = [
    [
      'ada.lovelace@example.com',
      'Ada',
      'Lovelace',
      '+2348000000000',
      'BLK-A-001',
      '',
      '450000',
      '900000',
      '2026-01-01',
      '',
    ],
  ];
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([tenantHeaders, ...tenantSample]),
    'Tenants'
  );

  XLSX.writeFile(wb, 'nigeria-homes-import-template.xlsx');
}
