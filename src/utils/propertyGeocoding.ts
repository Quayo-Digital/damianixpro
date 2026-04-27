/**
 * Browser-safe geocoding for Nigerian property addresses.
 * - Photon (Komoot) and Nominatim run in parallel per query (whichever responds first wins).
 * - Open-Meteo provides a fast city-center fallback when street-level search fails.
 *
 * Note: Public Nominatim can be slow; short timeouts avoid a "broken" button that hangs forever.
 */

export type PropertyGeocodeResult = { lat: number; lon: number; source: string };

const REQUEST_TIMEOUT_MS = 16_000;

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...init.headers,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Photon: do not use osm_tag=place — it drops many street/building matches. */
async function geocodePhoton(query: string): Promise<PropertyGeocodeResult | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`;
  const data = await fetchJson<{
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: { countrycode?: string };
    }>;
  }>(url);

  const feats = data?.features;
  if (!feats?.length) return null;

  const inNg = feats.find((f) => f.properties?.countrycode === 'NG');
  const feat = inNg ?? feats[0];
  const coords = feat.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, source: 'Photon (OpenStreetMap)' };
}

async function geocodeNominatim(query: string): Promise<PropertyGeocodeResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&` +
    `q=${encodeURIComponent(query)}&countrycodes=ng&limit=5&addressdetails=1`;

  // Browsers send their own User-Agent; Nominatim accepts standard browser UA.
  const rows = await fetchJson<Array<{ lat: string; lon: string }>>(url, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  const hit = rows?.[0];
  if (!hit) return null;
  const lat = parseFloat(hit.lat);
  const lon = parseFloat(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, source: 'Nominatim (OpenStreetMap)' };
}

/** City / town center — better than nothing when street geocoding fails. */
async function geocodeOpenMeteoCity(name: string): Promise<PropertyGeocodeResult | null> {
  const q = name.trim().replace(/\s+/g, ' ');
  if (q.length < 2) return null;

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?` +
    `name=${encodeURIComponent(q)}&count=8&language=en&format=json`;

  const data = await fetchJson<{
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      country_code?: string;
    }>;
  }>(url);

  const results = data?.results;
  if (!results?.length) return null;

  const ng = results.find((r) => r.country_code === 'NG');
  const hit = ng ?? results[0];
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    source: `Open-Meteo (${hit.name}, approximate)`,
  };
}

function uniqueQueries(address: string, locationHint?: string): string[] {
  const a = address.trim();
  const loc = locationHint?.trim();
  const qs: string[] = [];

  if (a) {
    qs.push(`${a}, Nigeria`);
    if (loc) qs.push(`${a}, ${loc}, Nigeria`);
  }
  if (loc) qs.push(`${loc}, Nigeria`);

  return [...new Set(qs.filter(Boolean))];
}

const NIGERIAN_CITIES = [
  'Abuja',
  'Lagos',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Kaduna',
  'Enugu',
  'Benin City',
  'Calabar',
  'Jos',
  'Owerri',
  'Abeokuta',
  'Uyo',
  'Warri',
  'Akure',
] as const;

/** Heuristic: known city in full text, else last address segment (e.g. "GARKI 2 ABUJA FCT"). */
export function guessCityFromAddress(address: string): string | null {
  const lower = address.toLowerCase();
  for (const city of NIGERIAN_CITIES) {
    if (lower.includes(city.toLowerCase())) return city === 'Benin City' ? 'Benin' : city;
  }

  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  for (let i = parts.length - 1; i >= 0; i--) {
    let seg = parts[i].replace(/\bNigeria\b/gi, '').trim();
    seg = seg
      .replace(/\bFCT\b/gi, '')
      .replace(/\bState\b/gi, '')
      .trim();
    if (seg.length >= 3) return seg || parts[i];
  }
  return parts[parts.length - 1] || null;
}

/**
 * Resolve coordinates for a property address (Nigeria).
 * @param address - Full street address
 * @param locationHint - Optional "Location" field from the form (e.g. "Abuja FCT")
 */
/** Run Photon + Nominatim together; return as soon as one succeeds (avoids waiting on a slow provider). */
async function geocodePhotonOrNominatim(query: string): Promise<PropertyGeocodeResult | null> {
  return new Promise((resolve) => {
    let settled = false;
    const win = (r: PropertyGeocodeResult | null) => {
      if (settled) return;
      if (r) {
        settled = true;
        resolve(r);
      }
    };
    let pending = 2;
    const finish = () => {
      pending -= 1;
      if (pending === 0 && !settled) resolve(null);
    };

    geocodePhoton(query)
      .then((r) => {
        win(r);
        finish();
      })
      .catch(() => finish());

    geocodeNominatim(query)
      .then((r) => {
        win(r);
        finish();
      })
      .catch(() => finish());
  });
}

export async function geocodeNigerianPropertyAddress(
  address: string,
  locationHint?: string
): Promise<PropertyGeocodeResult | null> {
  const queries = uniqueQueries(address, locationHint);

  for (const q of queries) {
    const hit = await geocodePhotonOrNominatim(q);
    if (hit) return hit;
  }

  const city = (locationHint && locationHint.trim()) || guessCityFromAddress(address) || null;
  if (city) {
    const fallback = await geocodeOpenMeteoCity(city);
    if (fallback) return fallback;
  }

  return null;
}
