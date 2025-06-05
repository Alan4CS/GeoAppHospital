"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { Calendar, Building2, MapPin, Clock, Users, ArrowUpRight, TrendingUp, Plus, Minus } from "lucide-react"
import {
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

// URLs de los archivos GeoJSON
const MUNICIPIOS_GEOJSON = "/lib/municipiosmx.json"
const ESTADOS_GEOJSON = "/lib/mx.json"

// Datos simulados de hospitales por municipio
const hospitalData = {
  "Benito Juárez": [
    {
      id: 1,
      name: "Hospital General Cancún",
      coords: [-86.845, 21.161],
      employees: 45,
      geofenceExits: 15,
      hoursWorked: 360,
      efficiency: 92,
      department: "Urgencias",
    },
    {
      id: 2,
      name: "IMSS Zona 3",
      coords: [-86.85, 21.155],
      employees: 38,
      geofenceExits: 8,
      hoursWorked: 280,
      efficiency: 88,
      department: "Medicina General",
    },
    {
      id: 3,
      name: "Hospital Galenia",
      coords: [-86.83, 21.14],
      employees: 32,
      geofenceExits: 5,
      hoursWorked: 220,
      efficiency: 95,
      department: "Especialidades",
    },
    {
      id: 4,
      name: "Hospital Amerimed",
      coords: [-86.84, 21.15],
      employees: 28,
      geofenceExits: 12,
      hoursWorked: 200,
      efficiency: 85,
      department: "Cirugía",
    },
  ],
  "Solidaridad": [
    {
      id: 5,
      name: "Hospital General Playa del Carmen",
      coords: [-87.073, 20.629],
      employees: 42,
      geofenceExits: 10,
      hoursWorked: 320,
      efficiency: 90,
      department: "Urgencias",
    },
    {
      id: 6,
      name: "IMSS Playa del Carmen",
      coords: [-87.07, 20.63],
      employees: 25,
      geofenceExits: 6,
      hoursWorked: 180,
      efficiency: 87,
      department: "Medicina General",
    },
    {
      id: 7,
      name: "Hospital Riviera Maya",
      coords: [-87.08, 20.62],
      employees: 30,
      geofenceExits: 8,
      hoursWorked: 240,
      efficiency: 93,
      department: "Pediatría",
    },
  ],
  "Othón P. Blanco": [
    {
      id: 8,
      name: "Hospital General Chetumal",
      coords: [-88.3, 18.5],
      employees: 35,
      geofenceExits: 7,
      hoursWorked: 280,
      efficiency: 89,
      department: "Urgencias",
    },
    {
      id: 9,
      name: "IMSS Chetumal",
      coords: [-88.295, 18.505],
      employees: 22,
      geofenceExits: 4,
      hoursWorked: 160,
      efficiency: 91,
      department: "Medicina General",
    },
    {
      id: 30,
      name: "Hospital Naval Chetumal",
      coords: [-88.31, 18.51],
      employees: 28,
      geofenceExits: 6,
      hoursWorked: 220,
      efficiency: 88,
      department: "Especialidades",
    },
  ],
  "Tulum": [
    {
      id: 10,
      name: "Hospital Municipal Tulum",
      coords: [-87.465, 20.211],
      employees: 18,
      geofenceExits: 3,
      hoursWorked: 140,
      efficiency: 86,
      department: "Medicina General",
    },
    {
      id: 31,
      name: "Centro Médico Tulum",
      coords: [-87.47, 20.21],
      employees: 15,
      geofenceExits: 4,
      hoursWorked: 120,
      efficiency: 89,
      department: "Urgencias",
    },
  ],
  "Cozumel": [
    {
      id: 11,
      name: "Hospital General Cozumel",
      coords: [-86.922, 20.508],
      employees: 20,
      geofenceExits: 5,
      hoursWorked: 160,
      efficiency: 88,
      department: "Urgencias",
    },
    {
      id: 32,
      name: "IMSS Cozumel",
      coords: [-86.95, 20.51],
      employees: 25,
      geofenceExits: 7,
      hoursWorked: 200,
      efficiency: 87,
      department: "Medicina General",
    },
  ],
  "Felipe Carrillo Puerto": [
    {
      id: 12,
      name: "Hospital General Felipe Carrillo Puerto",
      coords: [-88.045, 19.577],
      employees: 30,
      geofenceExits: 8,
      hoursWorked: 240,
      efficiency: 85,
      department: "Urgencias",
    },
    {
      id: 13,
      name: "Centro de Salud FCP",
      coords: [-88.05, 19.58],
      employees: 15,
      geofenceExits: 3,
      hoursWorked: 120,
      efficiency: 90,
      department: "Medicina General",
    },
  ],
  "José María Morelos": [
    {
      id: 14,
      name: "Hospital Rural José María Morelos",
      coords: [-88.707, 19.736],
      employees: 20,
      geofenceExits: 4,
      hoursWorked: 160,
      efficiency: 87,
      department: "Medicina General",
    },
  ],
  "Lázaro Cárdenas": [
    {
      id: 15,
      name: "Hospital Kantunilkín",
      coords: [-87.492, 21.127],
      employees: 18,
      geofenceExits: 5,
      hoursWorked: 140,
      efficiency: 86,
      department: "Medicina General",
    },
    {
      id: 16,
      name: "Centro de Salud Holbox",
      coords: [-87.286, 21.526],
      employees: 12,
      geofenceExits: 2,
      hoursWorked: 100,
      efficiency: 92,
      department: "Urgencias",
    },
  ],
  "Isla Mujeres": [
    {
      id: 17,
      name: "Hospital Integral Isla Mujeres",
      coords: [-86.745, 21.232],
      employees: 25,
      geofenceExits: 6,
      hoursWorked: 200,
      efficiency: 89,
      department: "Urgencias",
    },
    {
      id: 18,
      name: "Centro de Salud Isla Mujeres",
      coords: [-86.742, 21.235],
      employees: 15,
      geofenceExits: 3,
      hoursWorked: 120,
      efficiency: 91,
      department: "Medicina General",
    },
  ],
  "Bacalar": [
    {
      id: 19,
      name: "Hospital General Bacalar",
      coords: [-88.392, 18.678],
      employees: 28,
      geofenceExits: 7,
      hoursWorked: 220,
      efficiency: 88,
      department: "Urgencias",
    },
    {
      id: 20,
      name: "Centro Médico Bacalar",
      coords: [-88.39, 18.68],
      employees: 20,
      geofenceExits: 4,
      hoursWorked: 160,
      efficiency: 90,
      department: "Medicina General",
    },
  ],
  "Puerto Morelos": [
    {
      id: 21,
      name: "Hospital Municipal Puerto Morelos",
      coords: [-86.874, 20.853],
      employees: 22,
      geofenceExits: 5,
      hoursWorked: 180,
      efficiency: 87,
      department: "Medicina General",
    },
    {
      id: 22,
      name: "Centro de Salud Puerto Morelos",
      coords: [-86.875, 20.855],
      employees: 15,
      geofenceExits: 3,
      hoursWorked: 120,
      efficiency: 89,
      department: "Urgencias",
    },
  ],
}

// Datos de tendencias mensuales simuladas
const monthlyTrends = [
  { month: "Ene", geofenceExits: 45, hoursWorked: 1200, efficiency: 88 },
  { month: "Feb", geofenceExits: 52, hoursWorked: 1350, efficiency: 90 },
  { month: "Mar", geofenceExits: 38, hoursWorked: 1180, efficiency: 92 },
  { month: "Abr", geofenceExits: 41, hoursWorked: 1280, efficiency: 89 },
  { month: "May", geofenceExits: 48, hoursWorked: 1420, efficiency: 91 },
  { month: "Jun", geofenceExits: 35, hoursWorked: 1100, efficiency: 94 },
]

// Datos de tendencias por hospital
const hospitalTrends = [
  { month: "Ene", "Hospital General": 320, "IMSS": 280, "Centro Médico": 240, "Hospital Municipal": 200 },
  { month: "Feb", "Hospital General": 340, "IMSS": 300, "Centro Médico": 260, "Hospital Municipal": 220 },
  { month: "Mar", "Hospital General": 310, "IMSS": 270, "Centro Médico": 230, "Hospital Municipal": 190 },
  { month: "Abr", "Hospital General": 350, "IMSS": 290, "Centro Médico": 250, "Hospital Municipal": 210 },
  { month: "May", "Hospital General": 330, "IMSS": 310, "Centro Médico": 270, "Hospital Municipal": 230 },
  { month: "Jun", "Hospital General": 360, "IMSS": 320, "Centro Médico": 280, "Hospital Municipal": 240 },
]

// Estilos personalizados para scrollbar
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`

// Estilos para los municipios
const municipioStyle = {
  fillColor: "#E0F2FE",
  weight: 2,
  opacity: 1,
  color: "#0284C7",
  fillOpacity: 0.5,
}

const municipioDefaultStyle = {
  fillColor: "transparent",
  weight: 1,
  opacity: 0.7,
  color: "#94A3B8",
  fillOpacity: 0,
  dashArray: "3,3"
}

// Componente para actualizar la vista del mapa
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

// Componente Tooltip para el mapa
const MapTooltip = ({ x, y, hospital }) => {
  if (!hospital) return null

  return (
    <div
      style={{
        position: "absolute",
        left: `${Math.min(x + 10, window.innerWidth - 220)}px`,
        top: `${Math.max(y - 120, 10)}px`,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        minWidth: "200px",
        fontSize: "12px",
        pointerEvents: "none",
        maxWidth: "200px",
      }}
    >
      <h4 className="font-bold text-gray-800 mb-2 border-b pb-1 text-sm">{hospital.name}</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Empleados:</span>
          <span className="font-medium text-blue-600">{hospital.employees}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Salidas:</span>
          <span className="font-medium text-red-600">{hospital.geofenceExits}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Horas:</span>
          <span className="font-medium text-emerald-600">{hospital.hoursWorked}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Eficiencia:</span>
          <span className="font-medium text-purple-600">{hospital.efficiency}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Departamento:</span>
          <span className="font-medium text-indigo-600">{hospital.department}</span>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedMunicipalDashboard() {
  const [estadosGeo, setEstadosGeo] = useState(null)
  const [municipiosGeo, setMunicipiosGeo] = useState(null)
  const [selectedEstado, setSelectedEstado] = useState("Quintana Roo")
  const [selectedMunicipio, setSelectedMunicipio] = useState("Benito Juárez")
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [hoveredHospital, setHoveredHospital] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [mapPosition, setMapPosition] = useState({
    coordinates: [-86.845, 21.161],
    zoom: 10,
  })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Cargar datos GeoJSON
  useEffect(() => {
    async function fetchGeos() {
      setIsLoading(true)
      try {
        const [resEstados, resMunicipios] = await Promise.all([fetch(ESTADOS_GEOJSON), fetch(MUNICIPIOS_GEOJSON)])
        setEstadosGeo(await resEstados.json())
        setMunicipiosGeo(await resMunicipios.json())
      } catch (e) {
        console.error("Error loading GeoJSON:", e)
        setEstadosGeo(null)
        setMunicipiosGeo(null)
      }
      setIsLoading(false)
    }
    fetchGeos()
  }, [])

  // Lista de estados disponibles
  const estadosList = useMemo(() => {
    if (!municipiosGeo) return []
    return [...new Set(municipiosGeo.features.map((f) => f.properties.NAME_1))].sort()
  }, [municipiosGeo])

  // Lista de municipios del estado seleccionado
  const municipiosList = useMemo(() => {
    if (!municipiosGeo || !selectedEstado) return []
    return municipiosGeo.features
      .filter((f) => f.properties.NAME_1 === selectedEstado)
      .map((f) => f.properties.NAME_2)
      .sort()
  }, [municipiosGeo, selectedEstado])

  // Hospitales del municipio seleccionado
  const hospitals = hospitalData[selectedMunicipio] || []

  // Datos agregados del municipio
  const municipalStats = useMemo(() => {
    return {
      totalHospitals: hospitals.length,
      totalEmployees: hospitals.reduce((sum, h) => sum + h.employees, 0),
      totalGeofenceExits: hospitals.reduce((sum, h) => sum + h.geofenceExits, 0),
      totalHoursWorked: hospitals.reduce((sum, h) => sum + h.hoursWorked, 0),
      averageEfficiency:
        hospitals.length > 0 ? Math.round(hospitals.reduce((sum, h) => sum + h.efficiency, 0) / hospitals.length) : 0,
    }
  }, [hospitals])

  // Datos para gráfico de distribución por departamento
  const departmentData = useMemo(() => {
    const deptMap = {}
    hospitals.forEach((h) => {
      if (!deptMap[h.department]) {
        deptMap[h.department] = {
          department: h.department,
          hospitals: 0,
          employees: 0,
          geofenceExits: 0,
          hoursWorked: 0,
        }
      }
      deptMap[h.department].hospitals += 1
      deptMap[h.department].employees += h.employees
      deptMap[h.department].geofenceExits += h.geofenceExits
      deptMap[h.department].hoursWorked += h.hoursWorked
    })
    return Object.values(deptMap)
  }, [hospitals])

  // Colores para gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  // GeoJSON filtrado del estado seleccionado
  const filteredEstadoGeo = useMemo(() => {
    if (!municipiosGeo || !selectedEstado) return null;
    return {
      type: "FeatureCollection",
      features: municipiosGeo.features.filter(f => f.properties.NAME_1 === selectedEstado)
    };
  }, [municipiosGeo, selectedEstado]);

  // Actualizar posición del mapa cuando cambia el municipio
  useEffect(() => {
    if (selectedMunicipio && hospitals.length > 0) {
      const avgLat = hospitals.reduce((sum, h) => sum + h.coords[1], 0) / hospitals.length
      const avgLon = hospitals.reduce((sum, h) => sum + h.coords[0], 0) / hospitals.length
      setMapPosition({
        coordinates: [avgLon, avgLat],
        zoom: 11,
      })
    }
  }, [selectedMunicipio, hospitals])

  return (
    <>
      <style jsx global>
        {customScrollbarStyles}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header con Filtros */}
        <div className="max-w-7xl mx-auto pt-8 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Selector de Estado y Municipio */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30 lg:col-span-2">
              <div className="flex items-center mb-6">
                <MapPin className="h-6 w-6 text-indigo-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-800">Selección de Ubicación</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base text-gray-700 font-semibold mb-2">
                    Estado: <span className="text-indigo-600">{selectedEstado}</span>
                  </label>
                  <select
                    value={selectedEstado}
                    onChange={(e) => {
                      setSelectedEstado(e.target.value)
                      setSelectedMunicipio("")
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow bg-white"
                  >
                    {estadosList.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base text-gray-700 font-semibold mb-2">
                    Municipio: <span className="text-emerald-600">{selectedMunicipio}</span>
                  </label>
                  <select
                    value={selectedMunicipio}
                    onChange={(e) => setSelectedMunicipio(e.target.value)}
                    disabled={!selectedEstado}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow bg-white disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar municipio</option>
                    {municipiosList.map((municipio) => (
                      <option key={municipio} value={municipio}>
                        {municipio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Filtro de Fechas */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30">
              <div className="flex items-center mb-6">
                <Calendar className="h-6 w-6 text-emerald-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-800">Período</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-base text-gray-700 mb-2 font-semibold">Desde</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow"
                  />
                </div>
                <div>
                  <label className="block text-base text-gray-700 mb-2 font-semibold">Hasta</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Hospitales Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-6 w-6 text-emerald-100" />
                <TrendingUp className="h-4 w-4 text-emerald-200" />
              </div>
              <h3 className="text-sm font-medium text-emerald-100 mb-1">Hospitales</h3>
              <p className="text-2xl font-bold">{municipalStats.totalHospitals}</p>
            </div>

            {/* Empleados Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-6 w-6 text-blue-100" />
                <TrendingUp className="h-4 w-4 text-blue-200" />
              </div>
              <h3 className="text-sm font-medium text-blue-100 mb-1">Empleados</h3>
              <p className="text-2xl font-bold">{municipalStats.totalEmployees.toLocaleString()}</p>
            </div>

            {/* Salidas Card */}
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-6 w-6 text-red-100" />
                <TrendingUp className="h-4 w-4 text-red-200" />
              </div>
              <h3 className="text-sm font-medium text-red-100 mb-1">Salidas</h3>
              <p className="text-2xl font-bold">{municipalStats.totalGeofenceExits}</p>
            </div>

            {/* Horas Card */}
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 text-purple-100" />
                <TrendingUp className="h-4 w-4 text-purple-200" />
              </div>
              <h3 className="text-sm font-medium text-purple-100 mb-1">Horas</h3>
              <p className="text-2xl font-bold">{municipalStats.totalHoursWorked.toLocaleString()}</p>
            </div>

            {/* Eficiencia Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <ArrowUpRight className="h-6 w-6 text-amber-100" />
                <TrendingUp className="h-4 w-4 text-amber-200" />
              </div>
              <h3 className="text-sm font-medium text-amber-100 mb-1">Eficiencia</h3>
              <p className="text-2xl font-bold">{municipalStats.averageEfficiency}%</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 mb-8">
            {/* Mapa */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Mapa de {selectedMunicipio || "Municipio"}</h3>
                  <p className="text-sm text-gray-500 mt-1">Ubicación de hospitales y distribución geográfica</p>
                </div>
                <div className="text-sm text-gray-600">{hospitals.length} hospitales registrados</div>
              </div>

              <div className="h-[450px] relative bg-gray-50 rounded-lg overflow-hidden">
                {/* Controles de Zoom */}
                <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() =>
                      setMapPosition((prev) => ({
                        ...prev,
                        zoom: Math.min(prev.zoom + 1, 15),
                      }))
                    }
                    className="bg-white rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
                    aria-label="Acercar"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() =>
                      setMapPosition((prev) => ({
                        ...prev,
                        zoom: Math.max(prev.zoom - 1, 8),
                      }))
                    }
                    className="bg-white rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
                    aria-label="Alejar"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <MapContainer
                  center={[mapPosition.coordinates[1], mapPosition.coordinates[0]]}
                  zoom={mapPosition.zoom}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <MapUpdater 
                    center={[mapPosition.coordinates[1], mapPosition.coordinates[0]]} 
                    zoom={mapPosition.zoom}
                  />
                  
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Capa de municipios del estado */}
                  {filteredEstadoGeo && (
                    <GeoJSON
                      key={selectedMunicipio}
                      data={filteredEstadoGeo}
                      style={(feature) => {
                        return feature.properties.NAME_2 === selectedMunicipio
                          ? municipioStyle
                          : municipioDefaultStyle;
                      }}
                    />
                  )}
                  
                  {/* Marcadores de hospitales */}
                  {hospitals.map((hospital) => (
                    <CircleMarker
                      key={hospital.id}
                      center={[hospital.coords[1], hospital.coords[0]]}
                      radius={8}
                      pathOptions={{
                        color: hospital.geofenceExits > 10 ? "#ef4444" : "#10b981",
                        fillColor: hospital.geofenceExits > 10 ? "#fee2e2" : "#d1fae5",
                        fillOpacity: 0.85,
                        weight: 2,
                      }}
                      eventHandlers={{
                        mouseover: (e) => {
                          const containerRect = e.target._map._container.getBoundingClientRect();
                          const point = e.target._map.latLngToContainerPoint(e.latlng);
                          setHoveredHospital(hospital);
                          setTooltipPosition({
                            x: point.x,
                            y: point.y,
                          });
                        },
                        mouseout: () => {
                          setHoveredHospital(null);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <h4 className="font-bold mb-1">{hospital.name}</h4>
                          <p>Empleados: {hospital.employees}</p>
                          <p>Salidas: {hospital.geofenceExits}</p>
                          <p>Eficiencia: {hospital.efficiency}%</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                {/* Tooltip */}
                <MapTooltip x={tooltipPosition.x} y={tooltipPosition.y} hospital={hoveredHospital} />
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Barras Comparativo */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Métricas por Hospital</h3>
                    <p className="text-sm text-gray-500">Comparación de horas y personal en {selectedMunicipio}</p>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hospitals.map(hospital => ({
                        name: hospital.name.split(' ').slice(-1)[0], // Último nombre para etiquetas más cortas
                        "Horas Trabajadas": hospital.hoursWorked,
                        "Horas Salidas": hospital.geofenceExits * 8, // Asumiendo 8 horas por salida
                        "Empleados": hospital.employees,
                      }))}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Horas Trabajadas" fill="#0088FE" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Horas Salidas" fill="#FF8042" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Empleados" fill="#00C49F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tendencia de Horas por Hospital */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Tendencia de Horas por Hospital</h3>
                    <p className="text-sm text-gray-500">Evolución mensual de horas trabajadas</p>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hospitalTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fill: "#4B5563", fontSize: 12 }} tickLine={false} />
                      <YAxis
                        tick={{ fill: "#4B5563", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Hospital General"
                        stroke="#0088FE"
                        strokeWidth={2}
                        dot={{ fill: "#0088FE", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="IMSS"
                        stroke="#00C49F"
                        strokeWidth={2}
                        dot={{ fill: "#00C49F", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Centro Médico"
                        stroke="#FFBB28"
                        strokeWidth={2}
                        dot={{ fill: "#FFBB28", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Hospital Municipal"
                        stroke="#FF8042"
                        strokeWidth={2}
                        dot={{ fill: "#FF8042", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabla de Hospitales */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Hospitales Registrados</h3>
                  <p className="text-sm text-gray-500">
                    Detalle completo de {hospitals.length} hospitales en {selectedMunicipio}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Hospital</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Departamento</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Empleados</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Salidas</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Horas</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Eficiencia</th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-700">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((hospital, index) => (
                      <tr
                        key={hospital.id}
                        className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{hospital.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {hospital.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-blue-600">{hospital.employees}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-red-600">{hospital.geofenceExits}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-emerald-600">{hospital.hoursWorked}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <span
                              className={`font-medium ${
                                hospital.efficiency >= 90
                                  ? "text-emerald-600"
                                  : hospital.efficiency >= 85
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }`}
                            >
                              {hospital.efficiency}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs text-gray-500 font-mono">
                            {hospital.coords[1].toFixed(3)}, {hospital.coords[0].toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {hospitals.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="text-gray-400">
                            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No hay hospitales registrados</p>
                            <p className="text-sm">Selecciona un municipio con datos disponibles</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}