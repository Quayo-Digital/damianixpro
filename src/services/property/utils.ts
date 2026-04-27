import type { Property } from './types';

/** Extra fields saved in `properties.shortlet_details.form_meta` (no top-level columns). */
function readFormMeta(item: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const sd = item?.shortlet_details;
  if (sd == null || typeof sd !== 'object') return {};
  const fm = (sd as { form_meta?: unknown }).form_meta;
  return fm != null && typeof fm === 'object' ? { ...(fm as Record<string, unknown>) } : {};
}

function firstString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s !== '') return s;
  }
  return undefined;
}

function normalizeStatus(raw: unknown): Property['status'] {
  const s = String(raw ?? 'Available').trim();
  const upper = s.toUpperCase().replace(/\s+/g, '_');
  const map: Record<string, Property['status']> = {
    AVAILABLE: 'Available',
    RENTED: 'Rented',
    SOLD: 'Sold',
    UNDER_MAINTENANCE: 'Under Maintenance',
    UNDER_CONTRACT: 'Under Contract',
  };
  if (map[upper]) return map[upper];
  if (['Available', 'Rented', 'Sold', 'Under Maintenance', 'Under Contract'].includes(s)) {
    return s as Property['status'];
  }
  return 'Available';
}

function parseOptionalNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Annual rent (NGN) from a raw `properties` row: top-level columns and `shortlet_details.form_meta`
 * (where the add-property flow often stores `lease_price` / `monthly_rent`).
 */
export function annualRentNgnFromPropertyRow(
  row: Record<string, unknown> | null | undefined
): number {
  if (!row) return 0;
  const meta = readFormMeta(row);
  const lp = parseOptionalNumber(row.lease_price) ?? parseOptionalNumber(meta.lease_price);
  const mp = parseOptionalNumber(row.monthly_rent) ?? parseOptionalNumber(meta.monthly_rent);
  if (lp != null && lp > 0) return lp;
  if (mp != null && mp > 0) return mp * 12;
  return 0;
}

/**
 * Maps a property object from Supabase to the Property interface.
 * Merges `shortlet_details.form_meta` (where the add-property form stores imageUrl, price, etc.).
 */
export const mapSupabaseToProperty = (item: any): Property => {
  const meta = readFormMeta(item);

  const imageUrl =
    firstString(item.imageUrl, meta.imageUrl, item.image_url, meta.image_url) ?? undefined;

  return {
    id: item.id,
    name: item.name || '',
    address: item.address || '',
    type: firstString(item.type, meta.type) || 'residential',
    transaction_type: (firstString(item.transaction_type, meta.transaction_type) ||
      'LEASE') as Property['transaction_type'],
    property_category: (firstString(item.property_category, meta.property_category) ||
      'RESIDENTIAL') as Property['property_category'],
    price: firstString(item.price, meta.price) || '',
    sale_price: parseOptionalNumber(item.sale_price ?? meta.sale_price),
    lease_price: parseOptionalNumber(item.lease_price ?? meta.lease_price),
    price_per_sqft: parseOptionalNumber(item.price_per_sqft ?? meta.price_per_sqft),
    location: firstString(item.location, meta.location) || '',
    status: normalizeStatus(item.status),
    description: firstString(item.description, meta.description),
    bedrooms:
      item.bedrooms != null && item.bedrooms !== ''
        ? String(item.bedrooms)
        : meta.bedrooms != null && meta.bedrooms !== ''
          ? String(meta.bedrooms)
          : undefined,
    bathrooms:
      item.bathrooms != null && item.bathrooms !== ''
        ? String(item.bathrooms)
        : meta.bathrooms != null && meta.bathrooms !== ''
          ? String(meta.bathrooms)
          : undefined,
    squareFeet:
      item.squareFeet != null && item.squareFeet !== ''
        ? String(item.squareFeet)
        : meta.squareFeet != null && meta.squareFeet !== ''
          ? String(meta.squareFeet)
          : undefined,
    land_size_sqft: parseOptionalNumber(item.land_size_sqft ?? meta.land_size_sqft),
    land_size_acres: parseOptionalNumber(item.land_size_acres ?? meta.land_size_acres),
    development_status: (firstString(item.development_status, meta.development_status) ||
      undefined) as Property['development_status'] | undefined,
    amenities: item.amenities?.length ? item.amenities : [],
    imageUrl,
    lease_terms: item.lease_terms ?? undefined,
    availability_date: item.availability_date ?? undefined,
    agent_id: item.agent_id ?? undefined,
    agent_commission_rate: parseOptionalNumber(item.agent_commission_rate),
    features: item.features?.length ? item.features : [],
    latitude: item.latitude != null ? Number(item.latitude) : undefined,
    longitude: item.longitude != null ? Number(item.longitude) : undefined,
    tourUrl: firstString(item.tour_url, item.tourUrl, meta.tourUrl) ?? undefined,
    owner_id: item.owner_id,
    payment_plan_available: Boolean(item.payment_plan_available ?? meta.payment_plan_available),
    installment_months: parseOptionalNumber(item.installment_months ?? meta.installment_months),
    down_payment_percentage: parseOptionalNumber(
      item.down_payment_percentage ?? meta.down_payment_percentage
    ),
    is_negotiable: item.is_negotiable ?? meta.is_negotiable ?? true,
    market_value: parseOptionalNumber(item.market_value ?? meta.market_value),
    zoning_type: firstString(item.zoning_type, meta.zoning_type),
    title_document_url: firstString(item.title_document_url, meta.title_document_url),
    survey_plan_url: firstString(item.survey_plan_url, meta.survey_plan_url),
    c_of_o_url: firstString(item.c_of_o_url, meta.c_of_o_url),
    deed_of_assignment_url: firstString(item.deed_of_assignment_url, meta.deed_of_assignment_url),
    land_use_permit_url: firstString(item.land_use_permit_url, meta.land_use_permit_url),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};
