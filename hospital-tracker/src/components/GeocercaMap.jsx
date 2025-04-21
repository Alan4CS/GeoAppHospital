import { useState } from "react";
import { MapContainer, TileLayer, Circle, useMapEvents } from "react-leaflet";

// Componente que coloca el marcador en el lugar donde se hace clic
function LocationMarker({ onLocationChange }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      onLocationChange(e.latlng);
    },
  });

  return position ? (
    <Circle center={position} radius={500} pathOptions={{ color: "blue" }} />
  ) : null;
}

// Componente principal del mapa con geocerca
export default function GeocercaMap({ onCoordsChange, centerFromOutside }) {
  const [radio, setRadio] = useState(500);
  const [center, setCenter] = useState(null);

  const position = centerFromOutside || [23.6345, -102.5528]; // Default México

  return (
    <div className="mt-6 space-y-4 col-span-2">
      <label className="block font-semibold text-gray-700">Ubicación y Geocerca (haz clic en el mapa)</label>

      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "300px", width: "100%" }}
        className="rounded-xl overflow-hidden border shadow"
        key={position.toString()} // Fuerza recarga del mapa al cambiar el estado
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <LocationMarker
          onLocationChange={(coords) => {
            setCenter(coords);
            onCoordsChange({ ...coords, radio });
          }}
        />

        {center && (
          <Circle center={center} radius={radio} pathOptions={{ color: "blue" }} />
        )}
      </MapContainer>

      {center && (
        <div className="space-y-1">
            <label className="block text-sm text-gray-600 font-medium">
            Radio de la geocerca (en metros)
            </label>
            <input
            type="number"
            min={1}
            max={1000}
            step={1}
            value={radio}
            onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                setRadio(value);
                onCoordsChange({ ...center, radio: value });
                }
            }}
            className="border rounded-lg px-4 py-2 w-full max-w-xs"
            placeholder="Ej. 30, 50, 100"
            />
        </div>
    )}

    </div>
  );
}
