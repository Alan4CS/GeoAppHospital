"use client"

import { useState, useEffect, useMemo } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { format, subDays, subMonths, subYears, isAfter } from "date-fns"
import { Calendar, Building2, MapPin, Clock, LogOut, Plus, Minus, Users, ArrowUpRight, Briefcase, Building, TrendingUp, Check } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from 'recharts'

// URL del mapa GeoJSON de México (estados)
const MEXICO_GEOJSON = "/lib/mx.json"

// Mapeo de códigos de estado a nombres
const stateCodeToName = {
  MXAGU: "Aguascalientes",
  MXBCN: "Baja California",
  MXBCS: "Baja California Sur",
  MXCAM: "Campeche",
  MXCHH: "Chihuahua",
  MXCHP: "Chiapas",
  MXCMX: "Ciudad de México",
  MXCOA: "Coahuila",
  MXCOL: "Colima",
  MXDUR: "Durango",
  MXGRO: "Guerrero",
  MXGUA: "Guanajuato",
  MXHID: "Hidalgo",
  MXJAL: "Jalisco",
  MXMEX: "México",
  MXMIC: "Michoacán",
  MXMOR: "Morelos",
  MXNAY: "Nayarit",
  MXNLE: "Nuevo León",
  MXOAX: "Oaxaca",
  MXPUE: "Puebla",
  MXQUE: "Querétaro",
  MXROO: "Quintana Roo",
  MXSIN: "Sinaloa",
  MXSLP: "San Luis Potosí",
  MXSON: "Sonora",
  MXTAB: "Tabasco",
  MXTAM: "Tamaulipas",
  MXTLA: "Tlaxcala",
  MXVER: "Veracruz",
  MXYUC: "Yucatán",
  MXZAC: "Zacatecas",
}

// Coordenadas del centro de cada estado (longitud, latitud)
const stateCoordinates = {
  MXROO: [-88.2000, 19.5000], // Quintana Roo
  MXYUC: [-89.0000, 20.7000], // Yucatán
  MXCAM: [-90.3000, 19.0000], // Campeche
  MXCHP: [-92.4000, 16.5000], // Chiapas
  MXTAB: [-92.9475, 17.9892], // Tabasco
}

// Niveles de zoom por estado
const stateZoomLevels = {
  MXROO: 6,
  MXYUC: 6,
  MXCAM: 6,
  MXCHP: 6,
  MXTAB: 6,
}

// Componente Tooltip
const MapTooltip = ({ x, y, municipality }) => {
  if (!municipality) return null

  return (
    <div
      style={{
        position: "absolute",
        left: `${x + 10}px`,
        top: `${y - 10}px`,
        transform: "translate(0, -100%)",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "8px 12px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        minWidth: "180px",
        fontSize: "12px",
        pointerEvents: "none",
        maxWidth: "250px",
      }}
    >
      <h4 className="font-bold text-gray-800 mb-2 border-b pb-1 text-sm">{municipality.municipality}</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Salidas:</span>
          <span className="font-medium text-red-600">{municipality.geofenceExits}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Horas:</span>
          <span className="font-medium text-emerald-600">{municipality.hoursWorked}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Hospitales:</span>
          <span className="font-medium text-blue-600">{municipality.hospitals}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Empleados:</span>
          <span className="font-medium text-purple-600">{municipality.employees}</span>
        </div>
      </div>
    </div>
  )
}

// Añadir estos estilos globales al inicio del archivo, justo después de "use client"
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

export default function EstatalDashboard() {
  const [selectedState, setSelectedState] = useState("")
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [stateData, setStateData] = useState([])
  const [municipalityData, setMunicipalityData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredMunicipality, setHoveredMunicipality] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [metricToShow, setMetricToShow] = useState("geofenceExits")
  const [municipiosGeo, setMunicipiosGeo] = useState(null)
  const [mapPosition, setMapPosition] = useState({
    coordinates: [-102, 23],
    zoom: 3
  })

  // Estados para el filtro de fechas mejorado
  const [selectedPreset, setSelectedPreset] = useState("30d")
  const [hasChanges, setHasChanges] = useState(false)
  const [tempDateRange, setTempDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })

  const datePresets = [
    { label: "Últimos 7 días", value: "7d", days: 7 },
    { label: "Últimos 15 días", value: "15d", days: 15 },
    { label: "Últimos 30 días", value: "30d", days: 30 },
    { label: "Últimos 60 días", value: "60d", days: 60 },
    { label: "Últimos 90 días", value: "90d", days: 90 },
    { label: "Último trimestre", value: "3m", months: 3 },
    { label: "Últimos 6 meses", value: "6m", months: 6 },
    { label: "Último año", value: "1y", years: 1 },
    { label: "Personalizado", value: "custom" },
  ]

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset)
    const today = new Date()

    if (preset === "custom") {
      return
    }

    const presetConfig = datePresets.find((p) => p.value === preset)
    if (!presetConfig) return

    let newStartDate
    if (presetConfig.days) {
      newStartDate = subDays(today, presetConfig.days)
    } else if (presetConfig.months) {
      newStartDate = subMonths(today, presetConfig.months)
    } else if (presetConfig.years) {
      newStartDate = subYears(today, presetConfig.years)
    } else {
      return
    }

    setTempDateRange({
      startDate: format(newStartDate, "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    })
    setHasChanges(true)
  }

  const handleDateChange = (field, value) => {
    setTempDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
    setSelectedPreset("custom")
    setHasChanges(true)
  }

  const applyChanges = () => {
    setDateRange(tempDateRange)
    setHasChanges(false)
  }

  const resetToOriginal = () => {
    setTempDateRange(dateRange)
    setHasChanges(false)
    setSelectedPreset("")
  }

  const isValidRange =
    tempDateRange.startDate &&
    tempDateRange.endDate &&
    !isAfter(new Date(tempDateRange.startDate), new Date(tempDateRange.endDate))

  const daysDifference =
    tempDateRange.startDate && tempDateRange.endDate
      ? Math.ceil(
          (new Date(tempDateRange.endDate).getTime() -
            new Date(tempDateRange.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

  // Simular datos por estado y municipio
  useEffect(() => {
    setIsLoading(true)
    // Datos simulados por estado
    const mockStateData = [
      { state: "MXROO", geofenceExits: 150, hoursWorked: 2400, hospitals: 12, employees: 240 },
      { state: "MXYUC", geofenceExits: 80, hoursWorked: 1800, hospitals: 8, employees: 160 },
      { state: "MXCAM", geofenceExits: 60, hoursWorked: 1500, hospitals: 6, employees: 120 },
      { state: "MXCHP", geofenceExits: 95, hoursWorked: 2100, hospitals: 12, employees: 210 },
      { state: "MXTAB", geofenceExits: 65, hoursWorked: 1400, hospitals: 6, employees: 130 },
    ]
    setStateData(mockStateData)
    setSelectedState(mockStateData[0].state)
    setIsLoading(false)
  }, [dateRange])

  // Simular datos por municipio del estado seleccionado
  useEffect(() => {
    if (!selectedState) return
    setIsLoading(true)
    // Datos simulados por municipio usando los nombres oficiales del GeoJSON
    const mockMunicipalityData = {
      MXROO: [
        {
          municipality: "Benito Juárez",
          geofenceExits: 60,
          hoursWorked: 900,
          hospitals: 4,
          employees: 90,
          id: "MXROO_BJU",
        },
        {
          municipality: "Solidaridad",
          geofenceExits: 40,
          hoursWorked: 700,
          hospitals: 3,
          employees: 60,
          id: "MXROO_SOL",
        },
        {
          municipality: "Othón P. Blanco",
          geofenceExits: 30,
          hoursWorked: 500,
          hospitals: 2,
          employees: 40,
          id: "MXROO_OPB",
        },
        { municipality: "Tulum", geofenceExits: 20, hoursWorked: 300, hospitals: 1, employees: 20, id: "MXROO_TUL" },
        { municipality: "Cozumel", geofenceExits: 15, hoursWorked: 250, hospitals: 1, employees: 15, id: "MXROO_COZ" },
        {
          municipality: "Felipe Carrillo Puerto",
          geofenceExits: 10,
          hoursWorked: 200,
          hospitals: 1,
          employees: 10,
          id: "MXROO_FCP",
        },
        { municipality: "Bacalar", geofenceExits: 8, hoursWorked: 150, hospitals: 1, employees: 8, id: "MXROO_BAC" },
        {
          municipality: "José María Morelos",
          geofenceExits: 5,
          hoursWorked: 100,
          hospitals: 1,
          employees: 5,
          id: "MXROO_JMM",
        },
        {
          municipality: "Lázaro Cárdenas",
          geofenceExits: 5,
          hoursWorked: 100,
          hospitals: 1,
          employees: 5,
          id: "MXROO_LCA",
        },
        {
          municipality: "Isla Mujeres",
          geofenceExits: 5,
          hoursWorked: 100,
          hospitals: 1,
          employees: 5,
          id: "MXROO_IMU",
        },
        {
          municipality: "Puerto Morelos",
          geofenceExits: 5,
          hoursWorked: 100,
          hospitals: 1,
          employees: 5,
          id: "MXROO_PMO",
        },
      ],
      MXYUC: [
        { municipality: "Mérida", geofenceExits: 50, hoursWorked: 1000, hospitals: 5, employees: 100, id: "MXYUC_MER" },
        {
          municipality: "Valladolid",
          geofenceExits: 20,
          hoursWorked: 400,
          hospitals: 2,
          employees: 30,
          id: "MXYUC_VAL",
        },
        { municipality: "Progreso", geofenceExits: 10, hoursWorked: 400, hospitals: 1, employees: 30, id: "MXYUC_PRO" },
        { municipality: "Tizimín", geofenceExits: 15, hoursWorked: 300, hospitals: 1, employees: 20, id: "MXYUC_TIZ" },
        { municipality: "Kanasín", geofenceExits: 12, hoursWorked: 250, hospitals: 1, employees: 15, id: "MXYUC_KAN" },
      ],
      MXCAM: [
        { municipality: "Campeche", geofenceExits: 30, hoursWorked: 700, hospitals: 3, employees: 60, id: "MXCAM_CAM" },
        { municipality: "Carmen", geofenceExits: 20, hoursWorked: 500, hospitals: 2, employees: 40, id: "MXCAM_CAR" },
        {
          municipality: "Champotón",
          geofenceExits: 10,
          hoursWorked: 300,
          hospitals: 1,
          employees: 20,
          id: "MXCAM_CHA",
        },
        { municipality: "Escárcega", geofenceExits: 8, hoursWorked: 200, hospitals: 1, employees: 15, id: "MXCAM_ESC" },
        { municipality: "Calkiní", geofenceExits: 5, hoursWorked: 150, hospitals: 1, employees: 10, id: "MXCAM_CAL" },
      ],
      MXCHP: [
        {
          municipality: "Tuxtla Gutiérrez",
          geofenceExits: 40,
          hoursWorked: 900,
          hospitals: 4,
          employees: 90,
          id: "MXCHP_TGZ",
        },
        {
          municipality: "San Cristóbal de las Casas",
          geofenceExits: 30,
          hoursWorked: 700,
          hospitals: 3,
          employees: 60,
          id: "MXCHP_SCC",
        },
        {
          municipality: "Tapachula",
          geofenceExits: 25,
          hoursWorked: 500,
          hospitals: 2,
          employees: 40,
          id: "MXCHP_TAP",
        },
        {
          municipality: "Comitán de Domínguez",
          geofenceExits: 20,
          hoursWorked: 400,
          hospitals: 2,
          employees: 30,
          id: "MXCHP_COM",
        },
        {
          municipality: "Chiapa de Corzo",
          geofenceExits: 15,
          hoursWorked: 300,
          hospitals: 1,
          employees: 20,
          id: "MXCHP_CHC",
        },
      ],
      MXTAB: [
        { municipality: "Centro", geofenceExits: 35, hoursWorked: 800, hospitals: 4, employees: 80, id: "MXTAB_CEN" },
        { municipality: "Cárdenas", geofenceExits: 20, hoursWorked: 400, hospitals: 1, employees: 30, id: "MXTAB_CAR" },
        {
          municipality: "Comalcalco",
          geofenceExits: 10,
          hoursWorked: 200,
          hospitals: 1,
          employees: 20,
          id: "MXTAB_COM",
        },
        { municipality: "Macuspana", geofenceExits: 8, hoursWorked: 150, hospitals: 1, employees: 15, id: "MXTAB_MAC" },
        {
          municipality: "Huimanguillo",
          geofenceExits: 5,
          hoursWorked: 100,
          hospitals: 1,
          employees: 10,
          id: "MXTAB_HUI",
        },
      ],
    }
    setMunicipalityData(mockMunicipalityData[selectedState] || [])
    setIsLoading(false)
  }, [selectedState])

  // Cargar municipios GeoJSON (fallback de importación del lado del cliente)
  useEffect(() => {
    async function fetchMunicipios() {
      try {
        console.log("[Debug] Attempting to fetch municipios GeoJSON...")
        const res = await fetch("/lib/municipiosmx.json")
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        console.log("[Debug] Municipios GeoJSON structure:", {
          type: data.type,
          featuresCount: data.features?.length,
          sampleFeature: data.features?.[0],
        })

        // Validate GeoJSON structure
        if (!data.type || !data.features || !Array.isArray(data.features)) {
          console.error("[Error] Invalid GeoJSON structure:", data)
          return
        }

        setMunicipiosGeo(data)
        console.log("[Debug] Municipios loaded successfully")
      } catch (e) {
        console.error("[Error] Failed loading municipiosmx.json:", e)
        setMunicipiosGeo(null)
      }
    }
    fetchMunicipios()
  }, [])

  // Crear GeoJSON filtrado para los municipios del estado seleccionado
  const filteredMunicipiosGeo = useMemo(() => {
    if (!municipiosGeo || !selectedState) {
      console.log("[Debug] Cannot create filteredMunicipiosGeo:", {
        hasMunicipiosGeo: !!municipiosGeo,
        selectedState,
      })
      return null
    }

    const stateName = stateCodeToName[selectedState]
    if (!stateName) {
      console.error("[Error] No state name found for:", selectedState)
      return null
    }

    const filtered = municipiosGeo.features.filter((f) => f.properties.NAME_1 === stateName)
    console.log(`[Debug] Found ${filtered.length} municipalities for state ${selectedState} (name: ${stateName})`)

    // Create proper GeoJSON structure for filtered municipalities
    return {
      type: "FeatureCollection",
      features: filtered,
    }
  }, [selectedState, municipiosGeo])

  // Escalas de color para los mapas de calor
  const geofenceColorScale = useMemo(() => {
    return scaleQuantile()
      .domain(municipalityData.length > 0 ? municipalityData.map((d) => d.geofenceExits) : [0, 100])
      .range([
        "#fee2e2", // red-100
        "#fecaca", // red-200
        "#fca5a5", // red-300
        "#f87171", // red-400
        "#ef4444", // red-500
        "#dc2626", // red-600
        "#b91c1c", // red-700
        "#991b1b", // red-800
        "#7f1d1d", // red-900
      ])
  }, [municipalityData])

  const hoursWorkedColorScale = useMemo(() => {
    return scaleQuantile()
      .domain(municipalityData.length > 0 ? municipalityData.map((d) => d.hoursWorked) : [0, 1000])
      .range([
        "#ecfdf5", // emerald-50
        "#d1fae5", // emerald-100
        "#a7f3d0", // emerald-200
        "#6ee7b7", // emerald-300
        "#34d399", // emerald-400
        "#10b981", // emerald-500
        "#059669", // emerald-600
        "#047857", // emerald-700
        "#065f46", // emerald-800
      ])
  }, [municipalityData])

  // Función para obtener el color según la métrica seleccionada
  const getColorByMetric = (municipality) => {
    if (!municipality) return "#F5F5F5" // Color por defecto para municipios sin datos

    try {
      const value = metricToShow === "geofenceExits" ? municipality.geofenceExits : municipality.hoursWorked

      if (value === undefined || value === null) {
        console.warn("[Warning] No metric value for municipality:", municipality)
        return "#F5F5F5"
      }

      const scale = metricToShow === "geofenceExits" ? geofenceColorScale : hoursWorkedColorScale
      return scale(value)
    } catch (error) {
      console.error("[Error] Failed to get color for municipality:", municipality, error)
      return "#F5F5F5"
    }
  }

  // Municipios con coordenadas (proyección Mercator)
  const municipalityCoordinates = {
    // Quintana Roo
    MXROO_CUN: [-86.8466, 21.1619], // Cancún
    MXROO_PDC: [-87.0739, 20.6296], // Playa del Carmen
    MXROO_CHE: [-88.2999, 18.5001], // Chetumal
    MXROO_TUL: [-87.4649, 20.2114], // Tulum

    // Yucatán
    MXYUC_MER: [-89.6237, 20.9674], // Mérida
    MXYUC_VAL: [-88.2022, 20.6896], // Valladolid
    MXYUC_PRO: [-89.6626, 21.2811], // Progreso

    // Campeche
    MXCAM_CAM: [-90.5359, 19.8301], // Campeche
    MXCAM_CDC: [-91.8066, 18.6515], // Ciudad del Carmen
    MXCAM_CHA: [-90.7224, 19.3535], // Champotón

    // Chiapas
    MXCHP_TUX: [-93.1332, 16.7569], // Tuxtla Gutiérrez
    MXCHP_SCR: [-92.6376, 16.737], // San Cristóbal
    MXCHP_TAP: [-92.2673, 14.9101], // Tapachula

    // Tabasco
    MXTAB_VIL: [-92.9475, 17.9892], // Villahermosa
    MXTAB_CAR: [-93.3776, 18.0001], // Cárdenas
    MXTAB_COM: [-93.2245, 18.2709], // Comalcalco
  }

  // Ya no necesitamos el mapeo de nombres porque ahora usamos los nombres oficiales
  const municipalityNameMap = useMemo(() => ({}), [])

  // Efecto para actualizar la posición del mapa cuando cambia el estado seleccionado
  useEffect(() => {
    if (selectedState && stateCoordinates[selectedState]) {
      setMapPosition({
        coordinates: stateCoordinates[selectedState],
        zoom: stateZoomLevels[selectedState]
      })
    } else {
      // Volver a la vista general de México
      setMapPosition({
        coordinates: [-102, 23],
        zoom: 3
      })
    }
  }, [selectedState])

  return (
    <>
      <style jsx global>{customScrollbarStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header con Filtros */}
        <div className="max-w-7xl mx-auto pt-8 px-6">
          {/* Panel principal de filtros */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mr-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Filtros de Análisis</h2>
                  <p className="text-sm text-gray-600">Configura los parámetros de visualización</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={resetToOriginal}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Restablecer
                </button>
                <button 
                  onClick={applyChanges}
                  disabled={!isValidRange}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Aplicar Filtros
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Selector de Estado */}
              <div className="lg:col-span-4">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Estado Seleccionado</h3>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white shadow-sm text-base"
                  >
                    <option value="">Seleccionar Estado</option>
                    {stateData.map((state) => (
                      <option key={state.state} value={state.state}>
                        {stateCodeToName[state.state] || state.state}
                      </option>
                    ))}
                  </select>
                  {selectedState && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-sm text-emerald-700">
                        Estado actual: <span className="font-semibold">{stateCodeToName[selectedState]}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtros de Fecha */}
              <div className="lg:col-span-8">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-800">Período de Análisis</h3>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Selector Rápido */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selección Rápida
                      </label>
                      <select
                        value={selectedPreset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white shadow-sm"
                      >
                        <option value="">Personalizado</option>
                        {datePresets.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fechas Personalizadas */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Desde
                          </label>
                          <input
                            type="date"
                            value={tempDateRange.startDate}
                            onChange={(e) => handleDateChange("startDate", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hasta
                          </label>
                          <input
                            type="date"
                            value={tempDateRange.endDate}
                            onChange={(e) => handleDateChange("endDate", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white shadow-sm"
                          />
                        </div>
                      </div>
                      {isValidRange && (
                        <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-sm text-emerald-700">
                            Período: {daysDifference} días
                          </span>
                          {hasChanges && (
                            <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-100 rounded-full">
                              Cambios pendientes
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Total Hospitales</p>
              <p className="text-2xl font-bold">24</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Total Personal</p>
              <p className="text-2xl font-bold">1,248</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Salidas Totales</p>
              <p className="text-2xl font-bold">567</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Horas Totales</p>
              <p className="text-2xl font-bold">1,920</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 mb-8">
            {/* Mapa */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-gray-800">Mapa de {stateCodeToName[selectedState]}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setMetricToShow("geofenceExits")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      metricToShow === "geofenceExits"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Salidas
                  </button>
                  <button
                    onClick={() => setMetricToShow("hoursWorked")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      metricToShow === "hoursWorked"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Horas
                  </button>
                </div>
              </div>

              <div className="h-[450px] relative bg-gray-50 rounded-lg overflow-hidden">
                {/* Controles de Zoom */}
                <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
                  <button
                    onClick={() => setMapPosition(prev => ({
                      ...prev,
                      zoom: Math.min(prev.zoom + 1, 8)
                    }))}
                    className="bg-white rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
                    aria-label="Acercar"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setMapPosition(prev => ({
                      ...prev,
                      zoom: Math.max(prev.zoom - 1, 1)
                    }))}
                    className="bg-white rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
                    aria-label="Alejar"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 800,
                    center: [-102, 23],
                  }}
                  style={{ width: "100%", height: "100%" }}
                >
                  <ZoomableGroup 
                    center={mapPosition.coordinates} 
                    zoom={mapPosition.zoom}
                    minZoom={1}
                    maxZoom={8}
                    onMoveEnd={({ coordinates, zoom }) => {
                      setMapPosition({ coordinates, zoom });
                    }}
                  >
                    {/* Estados */}
                    <Geographies geography={MEXICO_GEOJSON}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const stateId = geo.properties.id
                          const isSelected = stateId === selectedState
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={isSelected ? "#E5E7EB" : "#F3F4F6"}
                              stroke="#9CA3AF"
                              strokeWidth={isSelected ? 1.5 : 0.5}
                              style={{
                                default: { outline: "none", opacity: isSelected ? 1 : 0.5 },
                                hover: { outline: "none", opacity: 1 },
                                pressed: { outline: "none" },
                              }}
                              onClick={() => setSelectedState(stateId)}
                            />
                          )
                        })
                      }
                    </Geographies>

                    {/* Renderizar polígonos de municipios solo si hay estado seleccionado */}
                    {selectedState && filteredMunicipiosGeo && (
                      <Geographies geography={filteredMunicipiosGeo}>
                        {({ geographies }) => {
                          console.log("[Debug] Rendering municipalities geographies:", {
                            count: geographies.length,
                            firstGeo: geographies[0]?.properties,
                          })
                          return geographies
                            .map((geo) => {
                              const munName = geo.properties.NAME_2
                              if (!munName) {
                                console.warn("[Warning] Municipality name not found in properties:", geo.properties)
                                return null
                              }

                              // Debug: Mostrar el nombre del municipio del GeoJSON
                              console.log("[Debug] GeoJSON Municipality:", munName)

                              // Usar el mapeo de nombres si existe
                              const mappedName = municipalityNameMap[munName] || munName

                              // Debug: Mostrar el nombre mapeado
                              console.log("[Debug] Mapped Municipality name:", mappedName)

                              const munData = municipalityData.find(
                                (m) => m.municipality && m.municipality.toLowerCase() === mappedName.toLowerCase(),
                              )

                              // Debug: Mostrar si se encontró coincidencia y los datos
                              console.log("[Debug] Found municipality data:", munData)

                              // Debug: Mostrar el color calculado
                              const color = getColorByMetric(munData)
                              console.log("[Debug] Calculated color for", mappedName, ":", color)

                              return (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill={color}
                                  stroke="#000000"
                                  strokeWidth={0.2}
                                  style={{
                                    default: {
                                      outline: "none",
                                      opacity: 0.7,
                                      cursor: "pointer",
                                    },
                                    hover: {
                                      outline: "none",
                                      opacity: 1,
                                      stroke: "#000000",
                                      strokeWidth: 0.5,
                                    },
                                    pressed: {
                                      outline: "none",
                                      opacity: 0.8,
                                      stroke: "#000000",
                                      strokeWidth: 0.7,
                                    },
                                  }}
                                  onMouseEnter={() => {
                                    setHoveredMunicipality(munData)
                                  }}
                                  onMouseMove={(e) => {
                                    const mapContainer = e.currentTarget.closest(".h-\\[450px\\]")
                                    if (mapContainer) {
                                      const rect = mapContainer.getBoundingClientRect()
                                      setTooltipPosition({
                                        x: e.clientX - rect.left,
                                        y: e.clientY - rect.top,
                                      })
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredMunicipality(null)
                                  }}
                                />
                              )
                            })
                            .filter(Boolean)
                        }}
                      </Geographies>
                    )}
                  </ZoomableGroup>
                </ComposableMap>

                {/* Tooltip */}
                <MapTooltip x={tooltipPosition.x} y={tooltipPosition.y} municipality={hoveredMunicipality} />
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Municipality Distribution Chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Distribución Municipal</h3>
                    <p className="text-sm text-gray-500">Distribución de recursos por municipio</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Hospitales</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Empleados</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Salidas</span>
                    </div>
                  </div>
                </div>
                <div className="h-[450px] overflow-y-auto pr-4 -ml-4 custom-scrollbar">
                  <div className="min-h-[450px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={450}>
                      <BarChart 
                        data={municipalityData} 
                        layout="vertical" 
                        barGap={12}
                        barSize={24}
                      >
                        <defs>
                          <linearGradient id="hospitalGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981"/>
                            <stop offset="100%" stopColor="#059669"/>
                          </linearGradient>
                          <linearGradient id="employeeGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1"/>
                            <stop offset="100%" stopColor="#4f46e5"/>
                          </linearGradient>
                          <linearGradient id="exitGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ef4444"/>
                            <stop offset="100%" stopColor="#dc2626"/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          horizontal={true}
                          vertical={false}
                          stroke="#E5E7EB"
                          strokeDasharray="3 3"
                        />
                        <XAxis 
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: '#4B5563',
                            fontSize: 12
                          }}
                          padding={{ left: 0, right: 40 }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="municipality" 
                          width={150}
                          tick={{
                            fill: '#1F2937',
                            fontSize: 13,
                            fontWeight: 500
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          labelStyle={{
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            color: '#1F2937'
                          }}
                          cursor={{ fill: '#F3F4F6' }}
                        />
                        <Bar 
                          dataKey="hospitals" 
                          name="Hospitales" 
                          fill="url(#hospitalGradient)"
                          radius={[0, 4, 4, 0]}
                        >
                          <LabelList 
                            dataKey="hospitals" 
                            position="right" 
                            fill="#059669"
                            fontSize={12}
                            fontWeight={600}
                            offset={10}
                          />
                        </Bar>
                        <Bar 
                          dataKey="employees" 
                          name="Empleados" 
                          fill="url(#employeeGradient)"
                          radius={[0, 4, 4, 0]}
                        >
                          <LabelList 
                            dataKey="employees" 
                            position="right" 
                            fill="#4f46e5"
                            fontSize={12}
                            fontWeight={600}
                            offset={10}
                          />
                        </Bar>
                        <Bar 
                          dataKey="geofenceExits" 
                          name="Salidas" 
                          fill="url(#exitGradient)"
                          radius={[0, 4, 4, 0]}
                        >
                          <LabelList 
                            dataKey="geofenceExits" 
                            position="right" 
                            fill="#dc2626"
                            fontSize={12}
                            fontWeight={600}
                            offset={10}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Hours Worked Trend */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Tendencia de Horas</h3>
                    <p className="text-sm text-gray-500">Distribución de horas trabajadas por municipio</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 mr-2"></div>
                      <span className="text-sm text-gray-600">Horas Trabajadas</span>
                    </div>
                  </div>
                </div>
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={municipalityData} 
                      margin={{ left: 20, right: 20, top: 10, bottom: 60 }}
                    >
                      <defs>
                        <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6"/>
                          <stop offset="100%" stopColor="#6366f1"/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="municipality" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        interval={0}
                        tick={{
                          fill: '#4B5563',
                          fontSize: 12,
                          fontWeight: 500
                        }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{
                          fill: '#4B5563',
                          fontSize: 12
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}h`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          padding: '12px'
                        }}
                        labelStyle={{
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          color: '#1F2937'
                        }}
                        formatter={(value) => [`${value} horas`, 'Horas Trabajadas']}
                      />
                      <Area
                        type="monotone"
                        dataKey="hoursWorked"
                        stroke="none"
                        fillOpacity={1}
                        fill="url(#hoursGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="hoursWorked"
                        name="Horas Trabajadas"
                        stroke="url(#lineGradient)"
                        strokeWidth={3}
                        dot={{
                          fill: 'white',
                          stroke: '#8b5cf6',
                          strokeWidth: 2,
                          r: 4
                        }}
                        activeDot={{
                          fill: '#8b5cf6',
                          stroke: 'white',
                          strokeWidth: 2,
                          r: 6
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}