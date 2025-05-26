import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Polygon, useMapEvent } from "react-leaflet"
import L from "leaflet"

export default function GeocercaMap({
  centerFromOutside,
  initialHospitalCoords,
  initialGeocerca,
  onCoordsChange,
  editando = false,
}) {
  const [polygonCoords, setPolygonCoords] = useState([])
  const [drawing, setDrawing] = useState(false)

  const hospitalIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  })

  const hospitalPosition = initialHospitalCoords
    ? [initialHospitalCoords.lat, initialHospitalCoords.lng]
    : centerFromOutside || [23.6345, -102.5528]

  useEffect(() => {
    console.log("🚀 initialGeocerca prop:", initialGeocerca)

    if (initialGeocerca && initialGeocerca.type === "Polygon") {
      let rawCoords = initialGeocerca.coordinates[0]
      console.log("🔎 Raw coords from backend:", rawCoords)

      if (
        rawCoords.length > 0 &&
        (rawCoords[0][0] !== rawCoords[rawCoords.length - 1][0] ||
          rawCoords[0][1] !== rawCoords[rawCoords.length - 1][1])
      ) {
        rawCoords = [...rawCoords, rawCoords[0]]
        console.log("✅ Closed polygon by adding first point at end:", rawCoords)
      }

      const converted = rawCoords.map(([lng, lat]) => [lat, lng])
      console.log("➡️ Converted coords for Leaflet:", converted)

      setPolygonCoords(converted)
    } else {
      console.warn("⚠️ No valid Polygon received or type mismatch")
    }
  }, [initialGeocerca])

  const MapClickHandler = () => {
    useMapEvent("click", (e) => {
      if (drawing) {
        console.log("🖱️ Click captured at:", e.latlng)
        setPolygonCoords((prev) => [...prev, [e.latlng.lat, e.latlng.lng]])
      }
    })
    return null
  }

  const handleStartDrawing = () => {
    console.log("✏️ Starting new drawing...")
    setDrawing(true)
    setPolygonCoords([])
  }

  const handleFinishDrawing = () => {
    setDrawing(false)
    if (polygonCoords.length >= 3) {
      const geojson = {
        type: "Polygon",
        coordinates: [polygonCoords.map(([lat, lng]) => [lng, lat])],
      }
      console.log("💾 GeoJSON to save:", geojson)
      onCoordsChange(geojson)
    } else {
      alert("Necesitas al menos 3 puntos para formar un polígono.")
    }
  }

  const handleClear = () => {
    console.log("🧹 Clearing polygon...")
    setPolygonCoords([])
    onCoordsChange(null)
  }

  return (
    <div className="space-y-4">
      <label className="block font-semibold text-gray-700">
        {editando
          ? "Edita la geocerca (haz clic en 'Comenzar dibujo' para redibujar)"
          : "Dibuja la geocerca del hospital"}
      </label>

      <MapContainer
        center={polygonCoords.length > 0 ? polygonCoords[0] : hospitalPosition}
        zoom={16}
        style={{ height: "300px", width: "100%" }}
        className="rounded-xl overflow-hidden border shadow"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {initialHospitalCoords && (
          <Marker position={[initialHospitalCoords.lat, initialHospitalCoords.lng]} icon={hospitalIcon} />
        )}

        <MapClickHandler />

        {polygonCoords.length > 0 && (
          <Polygon positions={polygonCoords} pathOptions={{ color: "blue" }} />
        )}
      </MapContainer>

      <div className="flex space-x-2">
        <button
          type="button"
          onClick={handleStartDrawing}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Comenzar dibujo
        </button>
        <button
          type="button"
          onClick={handleFinishDrawing}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={polygonCoords.length < 3}
        >
          Guardar geocerca
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}