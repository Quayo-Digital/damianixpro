import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@/services/property';
import { Card } from '@/components/ui/card';

// Fix default marker icons in Leaflet when using bundlers (e.g. Vite)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface PropertyMapProps {
  properties: Property[];
}

/** Parses property lat/lng to numbers; returns null if missing or invalid */
function parseCoords(property: Property): [number, number] | null {
  const lat =
    typeof property.latitude === 'number'
      ? property.latitude
      : property.latitude != null
        ? Number(property.latitude)
        : NaN;
  const lng =
    typeof property.longitude === 'number'
      ? property.longitude
      : property.longitude != null
        ? Number(property.longitude)
        : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}

/** Fits map bounds to markers when positions change */
function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [50, 50], maxZoom: 15 });
  }, [map, positions]);
  return null;
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const positionsWithProperties = useMemo(() => {
    const list: { position: [number, number]; property: Property }[] = [];
    properties.forEach((p) => {
      const coords = parseCoords(p);
      if (coords) list.push({ position: coords, property: p });
    });
    return list;
  }, [properties]);

  const positionsOnly = useMemo(
    () => positionsWithProperties.map((x) => x.position),
    [positionsWithProperties]
  );

  const center: [number, number] = useMemo(() => {
    if (positionsWithProperties.length > 0) {
      const lats = positionsWithProperties.map((x) => x.position[0]);
      const lngs = positionsWithProperties.map((x) => x.position[1]);
      return [
        (Math.min(...lats) + Math.max(...lats)) / 2,
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
      ];
    }
    return [9.0765, 7.3986]; // Abuja default
  }, [positionsWithProperties]);

  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const tileUrl = maptilerKey
    ? `https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${maptilerKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = maptilerKey
    ? '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-lg bg-muted">
      <MapContainer
        center={center}
        zoom={positionsWithProperties.length <= 1 ? 12 : 10}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: 'var(--muted)' }}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        <FitBounds positions={positionsOnly} />
        {positionsWithProperties.map(({ position, property }) => (
          <Marker key={property.id} position={position}>
            <Popup>
              <div className="min-w-[200px] max-w-[264px] overflow-hidden rounded-lg bg-card text-card-foreground shadow">
                <a
                  href={`/public/properties/${property.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={property.imageUrl || '/placeholder.svg'}
                    alt={property.name}
                    loading="lazy"
                    decoding="async"
                    className="h-32 w-full object-cover"
                  />
                </a>
                <div className="p-3">
                  <a
                    href={`/public/properties/${property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold text-foreground hover:text-primary"
                  >
                    {property.name}
                  </a>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {property.address}, {property.location}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-primary">{property.price}</span>
                    <a
                      href={`/public/properties/${property.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {properties.length > 0 && positionsWithProperties.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-md p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold">No map coordinates</h3>
            <p className="mb-4 text-muted-foreground">
              None of the listed properties have location coordinates yet. The map will show markers
              when latitude and longitude are set.
            </p>
            <p className="text-sm text-muted-foreground">
              Showing {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} in list
              view.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
