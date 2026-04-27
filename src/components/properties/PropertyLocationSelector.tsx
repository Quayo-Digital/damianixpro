import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reuse Leaflet default marker icon so it displays correctly in bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PropertyLocationSelectorProps {
  latitude?: string | number;
  longitude?: string | number;
  onChange: (lat: number, lng: number) => void;
}

function normalizeLatLng(
  latitude?: string | number,
  longitude?: string | number
): [number, number] | null {
  const lat =
    typeof latitude === 'number'
      ? latitude
      : typeof latitude === 'string' && latitude.trim()
        ? Number(latitude)
        : NaN;
  const lng =
    typeof longitude === 'number'
      ? longitude
      : typeof longitude === 'string' && longitude.trim()
        ? Number(longitude)
        : NaN;

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng];
  }

  return null;
}

function ClickAndDragHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function PropertyLocationSelector({
  latitude,
  longitude,
  onChange,
}: PropertyLocationSelectorProps) {
  const currentPosition = normalizeLatLng(latitude, longitude);

  const center: [number, number] = useMemo(() => {
    if (currentPosition) {
      return currentPosition;
    }
    // Default to Abuja center if no coordinates yet
    return [9.0765, 7.3986];
  }, [currentPosition]);

  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const tileUrl = maptilerKey
    ? `https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${maptilerKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = maptilerKey ? '© MapTiler © OpenStreetMap' : '© OpenStreetMap';

  return (
    <div className="mt-2 h-64 w-full overflow-hidden rounded-lg border bg-muted">
      <MapContainer
        center={center}
        zoom={currentPosition ? 15 : 12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: 'var(--muted)' }}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        <ClickAndDragHandler onChange={onChange} />
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
