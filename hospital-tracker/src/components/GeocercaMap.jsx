// GeocercaMap.jsx
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"

function LocationSelector({ editable, onHospitalCoordsChange, onGeocercaCoordsChange }) {
  useMapEvents({
    click(e) {
      if (editable) {
        onHospitalCoordsChange(e.latlng)
      } else {
        onGeocercaCoordsChange(e.latlng)
      }
    },
  })
  return null
}

export default function GeocercaMap({
  editableHospitalCoords,
  editableGeocerca,
  centerFromOutside,
  initialHospitalCoords,
  initialGeocerca,
  onHospitalCoordsChange,
  onCoordsChange,
  editando = false,
}) {
  const [geocercaCenter, setGeocercaCenter] = useState(null)
  const [radio, setRadio] = useState(100)
  const [hospitalFijado, setHospitalFijado] = useState(!!initialHospitalCoords)

  const validCoords = (coords) => coords && !isNaN(coords.lat) && !isNaN(coords.lng)

  const hospitalPosition = validCoords(initialHospitalCoords)
    ? [initialHospitalCoords.lat, initialHospitalCoords.lng]
    : centerFromOutside || [23.6345, -102.5528]

  useEffect(() => {
    if (validCoords(initialHospitalCoords)) {
      setHospitalFijado(true)
    }
  }, [initialHospitalCoords])

  useEffect(() => {
    if (validCoords(initialGeocerca)) {
      setGeocercaCenter({ lat: initialGeocerca.lat, lng: initialGeocerca.lng })
      setRadio(initialGeocerca.radio || 100)
    } else if (validCoords(initialHospitalCoords)) {
      const coords = {
        lat: initialHospitalCoords.lat,
        lng: initialHospitalCoords.lng,
      }
      setGeocercaCenter(coords)
      setRadio(100)
      onCoordsChange({ ...coords, radio: 100 })
    }
  }, [initialGeocerca, initialHospitalCoords])

  const handleGeocercaMove = (coords) => {
    setGeocercaCenter(coords)
    onCoordsChange({ ...coords, radio })
  }

  const handleRadioChange = (e) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setRadio(value)
      if (geocercaCenter) onCoordsChange({ ...geocercaCenter, radio: value })
    }
  }

  const hospitalIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  })

  return (
    <div className="space-y-4">
      <label className="block font-semibold text-gray-700">
        {!editando && !hospitalFijado
          ? "Haz clic para seleccionar ubicación del hospital"
          : "Haz clic para mover la geocerca"}
      </label>

      <MapContainer
        center={hospitalPosition}
        zoom={16}
        style={{ height: "300px", width: "100%" }}
        className="rounded-xl overflow-hidden border shadow"
        key={hospitalPosition.join(',')}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <LocationSelector
          editable={editableHospitalCoords && !hospitalFijado}
          onHospitalCoordsChange={(coords) => {
            onHospitalCoordsChange(coords)
            setHospitalFijado(true)
            if (!initialGeocerca) {
              setGeocercaCenter(coords)
              setRadio(100)
              onCoordsChange({ ...coords, radio: 100 })
            }
          }}
          onGeocercaCoordsChange={handleGeocercaMove}
        />

        {validCoords(initialHospitalCoords) && (
          <Marker
            position={[initialHospitalCoords.lat, initialHospitalCoords.lng]}
            icon={hospitalIcon}
          />
        )}

        {hospitalFijado && geocercaCenter && (
          <Circle center={geocercaCenter} radius={radio} pathOptions={{ color: "blue" }} />
        )}
      </MapContainer>

      {!editando && hospitalFijado && (
        <button
          type="button"
          onClick={() => {
            setHospitalFijado(false)
            setGeocercaCenter(null)
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Reubicar hospital
        </button>
      )}

      {hospitalFijado && geocercaCenter && (
        <div>
          <label className="block text-sm text-gray-600 font-medium">
            Radio de la geocerca (en metros)
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            step={1}
            value={radio}
            onChange={handleRadioChange}
            className="border rounded-lg px-4 py-2 w-full max-w-xs"
          />
        </div>
      )}
    </div>
  )
}