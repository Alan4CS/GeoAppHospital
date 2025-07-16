import { useState, useEffect, useMemo, useRef } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps"
import { scaleQuantile } from "d3-scale"
import { format, subDays, subMonths, subYears, isAfter } from "date-fns"
import { Calendar, Building2, MapPin, Clock, LogOut, Plus, Minus, Users, ArrowUpRight, Briefcase, Building, TrendingUp, Check, Coffee, Navigation } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from 'recharts'
import { feature } from "topojson-client"
import { geoCentroid } from "d3-geo"
import React from "react"
import { useAuth } from "../../../context/AuthContext"
import { generarReporteEstatalPDF } from "./reportes/EstatalReportPDF"

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

// Mapeo de códigos numéricos de estado a códigos de letras
const stateCodeMapping = {
  "01": "MXAGU", // Aguascalientes
  "02": "MXBCN", // Baja California
  "03": "MXBCS", // Baja California Sur
  "04": "MXCAM", // Campeche
  "05": "MXCOA", // Coahuila
  "06": "MXCOL", // Colima (NO es Chiapas)
  "07": "MXCHP", // Chiapas
  "08": "MXCHH", // Chihuahua
  "09": "MXCMX", // Ciudad de México
  "10": "MXDUR", // Durango
  "11": "MXGUA", // Guanajuato
  "12": "MXGRO", // Guerrero
  "13": "MXHID", // Hidalgo
  "14": "MXJAL", // Jalisco
  "15": "MXMEX", // México
  "16": "MXMIC", // Michoacán
  "17": "MXMOR", // Morelos
  "18": "MXNAY", // Nayarit
  "19": "MXNLE", // Nuevo León
  "20": "MXOAX", // Oaxaca
  "21": "MXPUE", // Puebla
  "22": "MXQUE", // Querétaro
  "23": "MXROO", // Quintana Roo
  "24": "MXSLP", // San Luis Potosí
  "25": "MXSIN", // Sinaloa
  "26": "MXSON", // Sonora
  "27": "MXTAB", // Tabasco
  "28": "MXTAM", // Tamaulipas
  "29": "MXTLA", // Tlaxcala
  "30": "MXVER", // Veracruz
  "31": "MXYUC", // Yucatán
  "32": "MXZAC", // Zacatecas
}

// Componente Tooltip mejorado con posicionamiento relativo al contenedor
const MapTooltip = ({ x, y, municipality, containerRef, loadingTooltip }) => {
  if (!municipality) return null

  // Calcular posición relativa al contenedor del mapa
  let adjustedX = x + 15 // offset para evitar que el cursor tape el tooltip
  let adjustedY = y - 10

  // Ajustar posición para evitar que se salga del contenedor
  const tooltipWidth = 250
  const tooltipHeight = 120
  const containerWidth = containerRef?.current?.clientWidth || 800
  const containerHeight = containerRef?.current?.clientHeight || 450

  // Ajuste horizontal
  if (adjustedX + tooltipWidth > containerWidth) {
    adjustedX = x - tooltipWidth - 15
  }
  if (adjustedX < 0) {
    adjustedX = 10
  }

  // Ajuste vertical
  if (adjustedY + tooltipHeight > containerHeight) {
    adjustedY = y - tooltipHeight - 15
  }
  if (adjustedY < 0) {
    adjustedY = 10
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
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
        backdropFilter: "blur(4px)",
      }}
    >
      <h4 className="font-bold text-gray-800 mb-2 border-b pb-1 text-sm">
        {municipality.municipio || municipality.municipality || 'Municipio'}
      </h4>
      <div className="space-y-1 text-xs">
        {loadingTooltip ? (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando datos...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Registros de Salida:</span>
              <span className="font-medium text-red-600">{municipality.geofenceExits || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Horas:</span>
              <span className="font-medium text-emerald-600">{municipality.hoursWorked || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hospitales:</span>
              <span className="font-medium text-blue-600">{municipality.hospitals || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Empleados:</span>
              <span className="font-medium text-purple-600">{municipality.employees || 0}</span>
            </div>
            {municipality.estado && (
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium">{municipality.estado}</span>
              </div>
            )}
          </>
        )}
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
  // --- HOOKS DE ESTADO Y EFECTOS ---
  const { userRole, userId } = useAuth()
  const [selectedState, setSelectedState] = useState("")
  const [userStateCode, setUserStateCode] = useState("") // Estado del administrador estatal
  const [isStateDisabled, setIsStateDisabled] = useState(false) // Controla si el selector está deshabilitado
  const [isLoadingUserState, setIsLoadingUserState] = useState(false) // Indica si está cargando el estado del usuario
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredMunicipality, setHoveredMunicipality] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [metricToShow, setMetricToShow] = useState("geofenceExits")
  const [municipiosGeo, setMunicipiosGeo] = useState(null)
  const [mapPosition, setMapPosition] = useState({
    coordinates: [-102, 23],
    zoom: 3
  })
  const [selectedPreset, setSelectedPreset] = useState("30d")
  const [hasChanges, setHasChanges] = useState(false)
  const [tempDateRange, setTempDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  // Estados para datos de gráficas
  const [entradasSalidasData, setEntradasSalidasData] = useState([]);
  const [eventosData, setEventosData] = useState([]);
  const [rankingHospitalesData, setRankingHospitalesData] = useState([]);
  const [horasPorMunicipioData, setHorasPorMunicipioData] = useState([]);
  const [municipalityData, setMunicipalityData] = useState([]); // <--- nuevo estado
  const [metricas, setMetricas] = useState({}); // <--- nuevo estado para métricas
  const [loadingGraficas, setLoadingGraficas] = useState(false);
  const [errorGraficas, setErrorGraficas] = useState(null);
  
  // Estados para tooltip dinámico
  const [loadingTooltip, setLoadingTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [hoveredMunicipalityId, setHoveredMunicipalityId] = useState(null);
  
  // Estados para mapeo de municipios
  const [municipiosList, setMunicipiosList] = useState([]);
  const [municipiosMap, setMunicipiosMap] = useState(new Map());
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Estados para el filtro de fechas mejorado
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

  // --- VARIABLES DERIVADAS (después de los hooks) ---
  const totalHospitales = metricas?.total_hospitales || 0;
  const totalPersonal = metricas?.total_empleados || 0;
  const totalSalidas = metricas?.total_salidas_geocerca || 0;
  const totalHoras = Math.round(metricas?.total_horas_trabajadas || 0);
  const totalHorasDescanso = Math.round(metricas?.total_horas_descanso || 0);
  const totalHorasFuera = Math.round(metricas?.total_horas_fuera || 0);

  // Cargar municipios TopoJSON del sureste mexicano (mx_tj.json - versión optimizada)
  useEffect(() => {
    async function fetchMunicipios() {
      try {
        console.log("[Debug] Attempting to fetch mx_tj.json (Southeast Mexico TopoJSON)...")
        const res = await fetch("/lib/mx_tj.json")
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        console.log("[Debug] mx_tj.json TopoJSON structure:", {
          type: data.type,
          objects: Object.keys(data.objects || {}),
          municipalitiesCount: data.objects?.municipalities?.geometries?.length,
          statesCount: data.objects?.states?.geometries?.length,
          sampleMunicipality: data.objects?.municipalities?.geometries?.[0],
        })

        // Validate TopoJSON structure
        if (!data.type || data.type !== "Topology" || !data.objects || !data.objects.municipalities) {
          console.error("[Error] Invalid TopoJSON structure:", data)
          return
        }

        // Mostrar estados disponibles en el TopoJSON
        if (data.objects.municipalities?.geometries) {
          const availableStates = [...new Set(data.objects.municipalities.geometries.map(m => m.properties?.state_name))].filter(Boolean)
          console.log("[Debug] Available states in TopoJSON:", availableStates)
        }

        setMunicipiosGeo(data)
        console.log("[Debug] mx_tj.json TopoJSON loaded successfully - Southeast Mexico municipalities available")
      } catch (e) {
        console.error("[Error] Failed loading mx_tj.json (Southeast Mexico TopoJSON):", e)
        setMunicipiosGeo(null)
      }
    }
    fetchMunicipios()
  }, [])  // Crear GeoJSON filtrado para los municipios del estado seleccionado (usando mx_tj.json TopoJSON)
  const filteredMunicipiosGeo = useMemo(() => {
    if (!municipiosGeo || !selectedState) {
      console.log("[Debug] Cannot create filteredMunicipiosGeo:", {
        hasMunicipiosGeo: !!municipiosGeo,
        selectedState,
      })
      return null
    }

    // Verificar que tenemos la estructura TopoJSON correcta
    if (!municipiosGeo.objects?.municipalities?.geometries) {
      console.error("[Error] Invalid TopoJSON structure - missing municipalities:", municipiosGeo.objects)
      return null
    }

    // Obtener el código numérico del estado seleccionado
    const stateName = stateCodeToName[selectedState]
    if (!stateName) {
      console.error("[Error] No state name found for:", selectedState)
      return null
    }

    // Encontrar el código numérico correspondiente al estado seleccionado
    const stateCode = Object.keys(stateCodeMapping).find(code => stateCodeMapping[code] === selectedState)
    if (!stateCode) {
      console.error("[Error] No state code found for:", selectedState)
      return null
    }

    console.log("[Debug] Filtering municipalities for state:", {
      selectedState,
      stateName,
      stateCode
    })

    try {
      // Convertir TopoJSON completo a GeoJSON primero
      const allMunicipalities = feature(municipiosGeo, municipiosGeo.objects.municipalities)
      
      console.log("[Debug] Converted TopoJSON to GeoJSON:", {
        type: allMunicipalities.type,
        featuresCount: allMunicipalities.features?.length,
        sampleFeature: allMunicipalities.features?.[0]
      })

      // Filtrar municipios por código del estado
      const filtered = allMunicipalities.features.filter((feature) => {
        const stateCodeInTopo = String(feature.properties?.state_code)
         const match = String(feature.properties.state_code).padStart(2, "0") === stateCode
        
        if (match) {
          console.log("[Debug] Found municipality for state:", {
            municipality: feature.properties?.mun_name,
            stateCode: stateCodeInTopo,
            munCode: feature.properties?.mun_code
          })
        }
        
        return match
      })

      console.log(`[Debug] Found ${filtered.length} municipalities for state ${selectedState} (code: ${stateCode}) in TopoJSON`)

      // Mostrar todos los municipios disponibles para debug
      if (filtered.length > 0) {
        console.log("[Debug] Available municipalities in TopoJSON for this state:", 
          filtered.map(f => f.properties?.mun_name).filter(Boolean).sort()
        )
      }

      // Crear GeoJSON con las features filtradas
      return {
        type: "FeatureCollection",
        features: filtered
      }
    } catch (error) {
      console.error("[Error] Failed to convert TopoJSON to GeoJSON:", error)
      return null
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

  // Objeto para simplificar las comparaciones de métricas
  const selectedMetric = useMemo(() => {
    return metricToShow === "geofenceExits"
      ? {
          key: "geofenceExits",
          scale: geofenceColorScale,
        }
      : {
          key: "hoursWorked",
          scale: hoursWorkedColorScale,
        }
  }, [metricToShow, geofenceColorScale, hoursWorkedColorScale])

  // Función para obtener el color según la métrica seleccionada
  const getColorByMetric = (municipality) => {
    if (!municipality) return "#F5F5F5" // Color por defecto para municipios sin datos

    try {
      const value = municipality[selectedMetric.key]

      if (value === undefined || value === null) {
        console.warn("[Warning] No metric value for municipality:", municipality)
        return "#F5F5F5"
      }

      return selectedMetric.scale(value)
    } catch (error) {
      console.error("[Error] Failed to get color for municipality:", municipality, error)
      return "#F5F5F5"
    }
  }

  // Cargar la configuración de estados (centro y zoom) desde el JSON generado
  const [stateMapConfig, setStateMapConfig] = useState({})
  useEffect(() => {
    fetch('/lib/state_map_config.json')
      .then(res => res.json())
      .then(setStateMapConfig)
      .catch(() => setStateMapConfig({}))
  }, [])

  // Efecto para cargar municipios cuando cambia el estado seleccionado
  useEffect(() => {
    if (selectedState) {
      const id_estado = stateCodeToId[selectedState];
      if (id_estado) {
        fetchMunicipiosByEstado(id_estado);
      }
    } else {
      setMunicipiosList([]);
      setMunicipiosMap(new Map());
    }
  }, [selectedState]);

  // Efecto para actualizar la posición del mapa cuando cambia el estado seleccionado
  useEffect(() => {
    if (selectedState) {
      // Buscar el código numérico del estado seleccionado
      const stateCode = Object.keys(stateCodeMapping).find(code => stateCodeMapping[code] === selectedState)
      if (stateCode && stateMapConfig[stateCode]) {
        setMapPosition({
          coordinates: stateMapConfig[stateCode].center,
          zoom: stateMapConfig[stateCode].zoom
        })
      } else if (filteredMunicipiosGeo && filteredMunicipiosGeo.features && filteredMunicipiosGeo.features.length > 0) {
        // Calcula el centroid del estado usando d3-geo
        const centroid = geoCentroid(filteredMunicipiosGeo)
        setMapPosition({ coordinates: centroid, zoom: 5 })
      } else {
        setMapPosition({ coordinates: [-102, 23], zoom: 3 })
      }
    }
  }, [selectedState, stateMapConfig, filteredMunicipiosGeo])

  // Mapeo rápido municipio-metricas para acceso O(1)
  const municipalityMap = useMemo(() => {
    const map = new Map();
    municipalityData.forEach((m) => {
      if (m && m.municipio) {
        map.set(m.municipio.toLowerCase(), m);
      } else if (m && m.municipality) {
        map.set(m.municipality.toLowerCase(), m);
      }
    });
    return map;
  }, [municipalityData]);

  // Función para generar el reporte PDF
  const handleGeneratePDF = async () => {
    if (!selectedState || !dateRange.startDate || !dateRange.endDate) {
      alert('Por favor selecciona un estado y un rango de fechas válido');
      return;
    }

    setLoadingPDF(true);
    try {
      const estatalData = {
        nombre_estado: stateCodeToName[selectedState] || selectedState,
        totalMunicipios: municipalityData.length || 0
      };

      const estatalStats = {
        totalHospitales,
        totalEmpleados: totalPersonal,
        totalMunicipios: municipalityData.length || 0,
        totalHoras,
        totalHorasDescanso,
        totalHorasFuera,
        totalSalidas,
        eficienciaPromedio: totalSalidas > 0 ? Math.round((totalHoras / (totalHoras + totalSalidas)) * 100) : 0
      };

      // Debug logs para verificar los datos
      console.log('[PDF Debug] EstatalStats:', estatalStats);
      console.log('[PDF Debug] Municipios data (completos):', municipalityData);
      console.log('[PDF Debug] Horas por municipio:', horasPorMunicipioData);
      console.log('[PDF Debug] Hospitales data:', rankingHospitalesData);
      console.log('[PDF Debug] EstatalData:', estatalData);

      await generarReporteEstatalPDF({
        estatalData,
        municipios: municipalityData,
        hospitales: rankingHospitalesData,
        estatalStats,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setLoadingPDF(false);
    }
  };

  const mapContainerRef = useRef(null)

  // Mapeo de código de estado tipo 'MXROO' a id_estado numérico
  const stateCodeToId = {
    MXAGU: '1', MXBCN: '2', MXBCS: '3', MXCAM: '4', MXCOA: '5', MXCOL: '6', MXCHP: '7', MXCHH: '8', MXCMX: '9',
    MXDUR: '10', MXGUA: '11', MXGRO: '12', MXHID: '13', MXJAL: '14', MXMEX: '15', MXMIC: '16', MXMOR: '17', MXNAY: '18',
    MXNLE: '19', MXOAX: '20', MXPUE: '21', MXQUE: '22', MXROO: '23', MXSLP: '24', MXSIN: '25', MXSON: '26', MXTAB: '27',
    MXTAM: '28', MXTLA: '29', MXVER: '30', MXYUC: '31', MXZAC: '32'
  };

  // Función para obtener el estado del administrador estatal
  const fetchUserState = async () => {
    console.log('[Debug] fetchUserState called - userRole:', userRole, 'userId:', userId);
    
    if (userRole !== "estadoadmin" || !userId) {
      console.log('[Debug] No es estadoadmin o no hay userId, saltando...');
      return;
    }
    
    setIsLoadingUserState(true);
    
    try {
      console.log('[Debug] Fetching state for estadoadmin with userId:', userId);
      const response = await fetch(`https://geoapphospital-b0yr.onrender.com/api/estadoadmin/hospitals-by-user/${userId}`);
      console.log('[Debug] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Response error:', errorText);
        throw new Error(`Error al obtener el estado del usuario: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Debug] Response data:', data);
      
      if (data && data.length > 0 && data[0].nombre_estado) {
        console.log('[Debug] Estado encontrado:', data[0].nombre_estado);
        
        // Buscar el código del estado correspondiente (búsqueda flexible)
        const estadoFromAPI = data[0].nombre_estado.toLowerCase().trim();
        console.log('[Debug] Estado normalizado del API:', estadoFromAPI);
        
        let stateCode = Object.keys(stateCodeToName).find(code => {
          const estadoEnMapeo = stateCodeToName[code].toLowerCase().trim();
          console.log('[Debug] Comparando:', estadoFromAPI, 'con', estadoEnMapeo);
          return estadoEnMapeo === estadoFromAPI;
        });
        
        // Si no encontramos coincidencia exacta, intentar búsqueda por palabras clave
        if (!stateCode) {
          console.log('[Debug] No se encontró coincidencia exacta, intentando búsqueda por palabras clave...');
          
          // Mapeo de variaciones comunes
          const variaciones = {
            'quintana roo': 'MXROO',
            'ciudad de mexico': 'MXCMX',
            'estado de mexico': 'MXMEX',
            'nuevo leon': 'MXNLE',
            'san luis potosi': 'MXSLP',
            'baja california': 'MXBCN',
            'baja california sur': 'MXBCS'
          };
          
          stateCode = variaciones[estadoFromAPI];
          
          if (stateCode) {
            console.log('[Debug] Encontrado por variación:', stateCode);
          }
        }
        
        console.log('[Debug] Código de estado final:', stateCode);
        
        if (stateCode) {
          setUserStateCode(stateCode);
          setSelectedState(stateCode);
          setIsStateDisabled(true); // Deshabilitar el selector para estadoadmin
          console.log(`[EstatalDashboard] ✅ Estado del administrador estatal configurado: ${data[0].nombre_estado} (${stateCode})`);
        } else {
          console.error('[Debug] ❌ No se encontró código para el estado:', data[0].nombre_estado);
          console.log('[Debug] Estados disponibles en mapeo:', Object.values(stateCodeToName));
        }
      } else {
        console.log('[Debug] ❌ No se encontraron datos válidos o estado en la respuesta');
      }
    } catch (error) {
      console.error('[Debug] ❌ Error al obtener el estado del usuario:', error);
    } finally {
      setIsLoadingUserState(false);
    }
  };

  // Efecto para cargar el estado del usuario al inicializar el componente
  useEffect(() => {
    console.log('[Debug] useEffect triggered - userRole:', userRole, 'userId:', userId);
    
    // Solo ejecutar si tenemos tanto userRole como userId
    if (userRole && userId) {
      console.log('[Debug] Calling fetchUserState...');
      fetchUserState();
    } else {
      console.log('[Debug] Esperando userRole y userId...');
    }
  }, [userRole, userId]);

  // Efecto para configurar el estado según el rol del usuario
  useEffect(() => {
    console.log('[Debug] Role effect - userRole:', userRole);
    
    if (userRole === "estadoadmin") {
      setIsStateDisabled(true);
      console.log('[Debug] Estado deshabilitado para estadoadmin');
    } else {
      setIsStateDisabled(false);
      setUserStateCode("");
      console.log('[Debug] Estado habilitado para otros roles');
    }
  }, [userRole]);

  // Efecto para cargar las gráficas y métricas
  useEffect(() => {
    async function fetchGraficas() {
      if (!selectedState || !dateRange.startDate || !dateRange.endDate) return;
      const id_estado = stateCodeToId[selectedState];
      if (!id_estado) return;
      setLoadingGraficas(true);
      setErrorGraficas(null);
      try {
        const base = 'https://geoapphospital-b0yr.onrender.com/api/dashboards/estatal';
        const params = `?id_estado=${id_estado}&fechaInicio=${dateRange.startDate}&fechaFin=${dateRange.endDate}`;
        const [entradasSalidasRes, eventosRes, rankingRes, horasRes, metricasRes] = await Promise.all([
          fetch(`${base}/entradas-salidas${params}`),
          fetch(`${base}/eventos-geocerca${params}`),
          fetch(`${base}/ranking-hospitales${params}`),
          fetch(`${base}/horas-municipio${params}`),
          fetch(`${base}/metricas${params}`)
        ]);
        if (!entradasSalidasRes.ok || !eventosRes.ok || !rankingRes.ok || !horasRes.ok || !metricasRes.ok) {
          throw new Error('Error al obtener datos de las gráficas');
        }
        const entradasSalidas = await entradasSalidasRes.json();
        const eventos = await eventosRes.json();
        const ranking = await rankingRes.json();
        const horas = await horasRes.json();
        const metricasData = await metricasRes.json();
        setEntradasSalidasData(entradasSalidas);
        setEventosData(eventos);
        setRankingHospitalesData(ranking);
        setHorasPorMunicipioData(horas);
        setMetricas(metricasData);
      } catch (err) {
        setErrorGraficas(err.message || 'Error desconocido');
      } finally {
        setLoadingGraficas(false);
      }
    }
    fetchGraficas();
  }, [selectedState, dateRange]);

  // Efecto para cargar la distribución municipal (MEJORADO)
  useEffect(() => {
    async function fetchMunicipalityData() {
      if (!selectedState || !dateRange.startDate || !dateRange.endDate) return;
      const id_estado = stateCodeToId[selectedState];
      if (!id_estado) return;
      try {
        const base = 'https://geoapphospital-b0yr.onrender.com/api/dashboards/estatal';
        const params = `?id_estado=${id_estado}&fechaInicio=${dateRange.startDate}&fechaFin=${dateRange.endDate}`;
        
        // Usar el nuevo endpoint completo para datos municipales
        const res = await fetch(`${base}/distribucion-municipal-completa${params}`);
        if (!res.ok) {
          // Fallback al endpoint original si el nuevo no está disponible
          console.warn('Endpoint completo no disponible, usando endpoint original');
          const resFallback = await fetch(`${base}/distribucion-municipal${params}`);
          if (!resFallback.ok) throw new Error('Error al obtener distribución municipal');
          const data = await resFallback.json();
          setMunicipalityData(data);
          return;
        }
        
        const data = await res.json();
        console.log('[Dashboard] Datos municipales mejorados recibidos:', data);
        setMunicipalityData(data);
      } catch (err) {
        setMunicipalityData([]);
      }
    }
    fetchMunicipalityData();
  }, [selectedState, dateRange]);

  // Función para obtener datos del tooltip dinámicamente
  const fetchMunicipalityTooltipData = async (municipioId) => {
    if (!municipioId || !dateRange.startDate || !dateRange.endDate) return null;
    
    setLoadingTooltip(true);
    try {
      const base = 'https://geoapphospital-b0yr.onrender.com/api/dashboards/estatal';
      const params = `?id_municipio=${municipioId}&fechaInicio=${dateRange.startDate}&fechaFin=${dateRange.endDate}`;
      const res = await fetch(`${base}/municipio-detalle${params}`);
      if (!res.ok) throw new Error('Error al obtener detalle del municipio');
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching municipality tooltip data:', err);
      return null;
    } finally {
      setLoadingTooltip(false);
    }
  };

  // Función para obtener municipios por estado
  const fetchMunicipiosByEstado = async (id_estado) => {
    if (!id_estado) return;
    
    try {
      const res = await fetch(`https://geoapphospital-b0yr.onrender.com/api/dashboards/municipios-by-estado/${id_estado}`);
      if (!res.ok) throw new Error('Error al obtener municipios');
      const data = await res.json();
      
      setMunicipiosList(data);
      
      // Crear mapa nombre -> id_municipio para búsqueda rápida
      const map = new Map();
      data.forEach(municipio => {
        map.set(municipio.nombre_municipio.toLowerCase(), municipio.id_municipio);
      });
      setMunicipiosMap(map);
      
      console.log('[Debug] Municipios loaded for state:', id_estado, 'Count:', data.length);
    } catch (err) {
      console.error('Error fetching municipios:', err);
      setMunicipiosList([]);
      setMunicipiosMap(new Map());
    }
  };

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
                  <h2 className="text-2xl font-bold text-gray-800">
                    {userRole === "estadoadmin" ? "Panel de Análisis Estatal" : "Filtros de Análisis"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {userRole === "estadoadmin" 
                      ? `Dashboard específico para ${selectedState ? stateCodeToName[selectedState] : 'su estado asignado'}`
                      : "Configura los parámetros de visualización"
                    }
                  </p>
                  {/* Debug info - solo en desarrollo */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Debug: Role={userRole}, UserId={userId}, StateCode={userStateCode}, Loading={isLoadingUserState ? 'Si' : 'No'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGeneratePDF}
                  disabled={!selectedState || !dateRange.startDate || !dateRange.endDate || loadingPDF}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingPDF ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Reporte PDF
                    </>
                  )}
                </button>
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
                    disabled={isStateDisabled}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white shadow-sm text-base ${
                      isStateDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                    }`}
                  >
                    <option value="">Seleccionar Estado</option>
                    {Object.entries(stateCodeToName).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name || code}
                      </option>
                    ))}
                  </select>
                  {selectedState && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-sm text-emerald-700">
                        Estado actual: <span className="font-semibold">{stateCodeToName[selectedState]}</span>
                      </p>
                      {isStateDisabled && userRole === "estadoadmin" && (
                        <p className="text-xs text-emerald-600 mt-1">
                          ⚡ Asignado automáticamente por su rol de Administrador Estatal
                        </p>
                      )}
                    </div>
                  )}
                  {isStateDisabled && !selectedState && userRole === "estadoadmin" && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center space-x-2">
                        {isLoadingUserState && (
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <p className="text-sm text-amber-700">
                          {isLoadingUserState ? "🔄 Obteniendo estado asignado..." : "⚠️ No se pudo cargar el estado asignado"}
                        </p>
                      </div>
                      {!isLoadingUserState && (
                        <p className="text-xs text-amber-600 mt-1">
                          Verifique la consola del navegador para más detalles del error
                        </p>
                      )}
                    </div>
                  )}
                  {userRole === "estadoadmin" && !isStateDisabled && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-700">
                        ℹ️ Esperando autenticación del administrador estatal...
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
                        Selección Rápido
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Total Hospitales</p>
              <p className="text-2xl font-bold">{totalHospitales}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Total Empleados</p>
              <p className="text-2xl font-bold">{totalPersonal}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Horas Trabajadas</p>
              <p className="text-2xl font-bold">{totalHoras}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Coffee className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Horas de Descanso</p>
              <p className="text-2xl font-bold">{totalHorasDescanso}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Navigation className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Horas Fuera Geocerca</p>
              <p className="text-2xl font-bold">{totalHorasFuera}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/70" />
              </div>
              <p className="text-sm text-white/70">Salidas de Geocerca</p>
              <p className="text-2xl font-bold">{totalSalidas}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 mb-8">
            {/* Mapa */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedState ? `Mapa de ${stateCodeToName[selectedState]}` : "Seleccionar un estado"}
                    {userRole === "estadoadmin" && selectedState && (
                      <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                        Estado asignado
                      </span>
                    )}
                  </h3>
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
                    Registros de Salida
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

              <div ref={mapContainerRef} className="h-[450px] relative bg-gray-50 rounded-lg overflow-hidden">
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
                    </Geographies>                    {/* Renderizar polígonos de municipios solo si hay estado seleccionado */}
                    {selectedState && filteredMunicipiosGeo && (
                      <Geographies geography={filteredMunicipiosGeo}>
                        {({ geographies }) => {
                          console.log("[Debug] Rendering municipalities from GeoJSON:", {
                            count: geographies.length,
                            firstGeo: geographies[0]?.properties,
                          })
                          return geographies
                            .map((geo) => {
                              const munName = geo.properties?.mun_name
                              const munId = geo.properties?.mun_code || geo.properties?.id_municipio
                              
                              if (!munName) {
                                console.warn("[Warning] Municipality name not found in GeoJSON properties:", geo.properties)
                                return null
                              }

                              // Usar el mapeo correcto para obtener el ID del municipio
                              const correctMunId = municipiosMap.get(munName.toLowerCase()) || munId

                              // Debug: Mostrar el nombre del municipio del GeoJSON
                              console.log("[Debug] GeoJSON Municipality:", munName, "Original ID:", munId, "Mapped ID:", correctMunId)

                              const munData = municipalityMap.get(munName.toLowerCase())

                              // Debug: Mostrar si se encontró coincidencia y los datos
                              console.log("[Debug] Found municipality data:", munData)

                              // Debug: Mostrar el color calculado
                              const color = getColorByMetric(munData)
                              console.log("[Debug] Calculated color for", munName, ":", color)

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
                                  onMouseEnter={async () => {
                                    setHoveredMunicipalityId(correctMunId);
                                    if (correctMunId) {
                                      const data = await fetchMunicipalityTooltipData(correctMunId);
                                      if (data) {
                                        setTooltipData(data);
                                        setHoveredMunicipality(data);
                                      } else {
                                        // Fallback to existing data if API call fails
                                        setHoveredMunicipality(munData);
                                        setTooltipData(null);
                                      }
                                    } else {
                                      setHoveredMunicipality(munData);
                                      setTooltipData(null);
                                    }
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
                                    setHoveredMunicipality(null);
                                    setTooltipData(null);
                                    setHoveredMunicipalityId(null);
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
                <MapTooltip 
                  x={tooltipPosition.x} 
                  y={tooltipPosition.y} 
                  municipality={hoveredMunicipality} 
                  containerRef={mapContainerRef} 
                  loadingTooltip={loadingTooltip}
                />
              </div>
            </div>
            {/* Fin del mapa, se eliminó la gráfica de distribución municipal */}
          </div>
        </div>
        {/* Grid de gráficas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         {loadingGraficas && (
           <div className="col-span-2 text-center py-8">
             <span className="text-lg text-gray-500">Cargando gráficas...</span>
           </div>
         )}
         {errorGraficas && (
           <div className="col-span-2 text-center py-8">
             <span className="text-lg text-red-500">{errorGraficas}</span>
           </div>
         )}
          {/* Entradas y Salidas de Geocerca por Día */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Entradas y salidas de geocerca por día</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entradasSalidasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={(value) => {
                    // Formatear fecha para mostrar solo YYYY-MM-DD
                    if (value && value.includes('T')) {
                      return value.split('T')[0];
                    }
                    return value;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas a geocerca" />
                <Bar dataKey="salidas" fill="#ef4444" name="Salidas de geocerca" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Distribución de Eventos de Geocerca */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Distribución de eventos de geocerca</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={eventosData} 
                  dataKey="cantidad" 
                  nameKey="evento" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={{ fontSize: 11 }}
                  labelLine={false}
                >
                  {eventosData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={["#ef4444", "#10b981", "#f59e42", "#6366f1"][idx % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Ranking de Hospitales por Registros de Salida */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ranking de hospitales por registros de salida</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rankingHospitalesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  dataKey="nombre_hospital" 
                  type="category" 
                  tick={{ fontSize: 15 }}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="salidas" fill="#6366f1" name="Registros de salida" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Horas trabajadas por municipio */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Horas trabajadas por municipio</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={horasPorMunicipioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="municipio" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="horas" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  fill="#8b5cf6" 
                  fillOpacity={0.3}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}