"use client"

import { useState, useEffect, useMemo } from "react"
import { format, subDays, subMonths, subYears } from "date-fns"
import { Calendar, Building2, MapPin, Clock, Users, ArrowUpRight, TrendingUp, Plus, Minus, Check } from "lucide-react"
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
import { feature } from "topojson-client"
import { calcularEstadisticasEmpleado, calcularEstadisticasEmpleadoPorDias } from "../hospital/employeeStatsHelper"

// URLs de los archivos GeoJSON
const MUNICIPIOS_TOPOJSON = "/lib/mx_tj.json"
const ESTADOS_GEOJSON = "/lib/mx.json"

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
  "06": "MXCOL", // Colima
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
            <span className="text-gray-600">Horas Trabajadas:</span>
            <span className="font-medium text-emerald-600">{hospital.hoursWorked}h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Horas Fuera:</span>
            <span className="font-medium text-orange-600">{hospital.hoursOutside}h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Eficiencia:</span>
            <span className="font-medium text-purple-600">{hospital.efficiency}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Grupo:</span>
            <span className="font-medium text-indigo-600">{hospital.department}</span>
          </div>
        </div>
    </div>
  )
}

export default function EnhancedMunicipalDashboard() {
  const [estadosGeo, setEstadosGeo] = useState(null)
  const [municipiosTopo, setMunicipiosTopo] = useState(null)
  const [municipiosGeo, setMunicipiosGeo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [tempDateRange, setTempDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [selectedPreset, setSelectedPreset] = useState("30d")
  const [hasChanges, setHasChanges] = useState(false)
  const [hoveredHospital, setHoveredHospital] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [mapPosition, setMapPosition] = useState({
    coordinates: [-86.845, 21.161],
    zoom: 10,
  })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  // Estados para datos reales del API
  const [apiData, setApiData] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Estados para datos del backend (como en HospitalDashboard)
  const [estados, setEstados] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [filters, setFilters] = useState({
    id_estado: "",
    id_municipio: "",
    nombre_estado: "",
    nombre_municipio: "",
  })

  // Cargar estados desde el backend
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch("https://geoapphospital.onrender.com/api/superadmin/estados")
        if (response.ok) {
          const data = await response.json()
          setEstados(data)
          console.log("✅ Estados cargados desde el backend:", data)
        } else {
          console.error("❌ Error al cargar estados:", response.status)
        }
      } catch (error) {
        console.error("❌ Error al cargar estados:", error)
      }
    }
    fetchEstados()
  }, [])

  // Cargar municipios cuando cambia el estado seleccionado
  useEffect(() => {
    const fetchMunicipios = async () => {
      if (filters.id_estado) {
        try {
          const response = await fetch(`https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${filters.id_estado}`)
          if (response.ok) {
            const data = await response.json()
            setMunicipios(data)
            console.log("✅ Municipios cargados desde el backend:", data)
          } else {
            console.error("❌ Error al cargar municipios:", response.status)
          }
        } catch (error) {
          console.error("❌ Error al cargar municipios:", error)
        }
      } else {
        setMunicipios([])
      }
    }
    fetchMunicipios()
  }, [filters.id_estado])

  // Presets de fechas para filtro rápido
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

  // Función para manejar cambio de preset de fecha
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

  // Función para manejar cambio de fecha manual
  const handleDateChange = (field, value) => {
    setTempDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
    setSelectedPreset("custom")
    setHasChanges(true)
  }

  // Función para aplicar cambios de fecha
  const applyChanges = () => {
    setDateRange(tempDateRange)
    setHasChanges(false)
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      id_estado: "",
      id_municipio: "",
      nombre_estado: "",
      nombre_municipio: "",
    })
    setMunicipios([])
    setApiData(null)
    setSelectedPreset("30d")
    const today = new Date()
    const defaultStartDate = subDays(today, 30)
    const defaultDateRange = {
      startDate: format(defaultStartDate, "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    }
    setDateRange(defaultDateRange)
    setTempDateRange(defaultDateRange)
    setHasChanges(false)
  }

  // Función para resetear cambios
  const resetToOriginal = () => {
    setTempDateRange(dateRange)
    setHasChanges(false)
    setSelectedPreset("")
  }

  // Cargar datos GeoJSON y TopoJSON
  useEffect(() => {
    async function fetchGeos() {
      setIsLoading(true)
      try {
        const [resEstados, resMunicipios] = await Promise.all([
          fetch(ESTADOS_GEOJSON),
          fetch(MUNICIPIOS_TOPOJSON),
        ])
        setEstadosGeo(await resEstados.json())
        const topoData = await resMunicipios.json()
        setMunicipiosTopo(topoData)
        // Convertir TopoJSON a GeoJSON para el estado seleccionado (por defecto Quintana Roo)
        if (topoData && topoData.objects && topoData.objects.municipalities) {
          const allMunicipalities = feature(topoData, topoData.objects.municipalities)
          setMunicipiosGeo(allMunicipalities)
          if (allMunicipalities && allMunicipalities.features && allMunicipalities.features.length > 0) {
            console.log('Ejemplo de feature de municipiosGeo:', allMunicipalities.features[0])
          }
        } else {
          setMunicipiosGeo(null)
        }
      } catch (e) {
        console.error("Error loading GeoJSON/TopoJSON:", e)
        setEstadosGeo(null)
        setMunicipiosTopo(null)
        setMunicipiosGeo(null)
      }
      setIsLoading(false)
    }
    fetchGeos()
  }, [])

  // Función para obtener datos reales del endpoint
  const fetchMunicipalData = async (id_municipio, startDate, endDate) => {
    console.log(`🔄 Iniciando fetchMunicipalData para municipio ID: ${id_municipio} (${startDate} a ${endDate})`)
    setIsLoadingData(true)
    try {
      if (!id_municipio) {
        console.log(`⚠️ No se proporcionó id_municipio, retornando datos vacíos`)
        setApiData({ empleados: [], hospitales: [] })
        setIsLoadingData(false)
        return
      }
      
      const requestBody = {
        id_municipio,
        fechaInicio: `${startDate} 00:00:00`,
        fechaFin: `${endDate} 23:59:59`
      }
      console.log(`🚀 Haciendo petición al endpoint con body:`, requestBody)
      
      const response = await fetch("http://localhost:4000/api/dashboards/municipio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })
      
      console.log(`📡 Respuesta del servidor: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Datos recibidos:`, data)
      setApiData(data)
    } catch (error) {
      console.error("❌ Error fetching municipal data:", error)
      setApiData(null)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    console.log(`🔄 useEffect activado: id_estado=${filters.id_estado}, id_municipio=${filters.id_municipio}, fechas=${dateRange.startDate} - ${dateRange.endDate}`)
    if (filters.id_municipio) {
      console.log(`✅ Condiciones cumplidas, llamando fetchMunicipalData`)
      fetchMunicipalData(filters.id_municipio, dateRange.startDate, dateRange.endDate)
    } else {
      console.log(`⚠️ Condiciones no cumplidas: id_municipio=${filters.id_municipio}`)
    }
  }, [filters.id_municipio, dateRange.startDate, dateRange.endDate])

  // selectedEstado por defecto dinámico - ELIMINADO para requerir selección manual

  // Lista de municipios del estado seleccionado usando el mapeo - ELIMINADO, ahora usamos backend

  // Hospitales del municipio seleccionado (datos reales)
  const hospitals = useMemo(() => {
    if (!apiData || !apiData.hospitales) return []
    
    // Filtrar hospitales por municipio y estado seleccionado
    return apiData.hospitales.filter(hospital => 
      hospital.nombre_municipio === filters.nombre_municipio && 
      hospital.nombre_estado === filters.nombre_estado
    ).map(hospital => {
      // Calcular estadísticas para cada hospital basado en empleados
      const empleadosHospital = apiData.empleados.filter(emp => 
        emp.empleado.id_hospital === hospital.id_hospital
      )
      
      let totalHorasT = 0
      let totalSalidas = 0
      let totalHorasFuera = 0
      
      empleadosHospital.forEach(emp => {
        const stats = calcularEstadisticasEmpleadoPorDias(emp.registros)
        totalHorasT += stats.workedHours
        totalHorasFuera += stats.outsideHours
        
        // Para salidas, usar la función original que sí las calcula
        const statsConSalidas = calcularEstadisticasEmpleado(emp.registros)
        totalSalidas += statsConSalidas.totalExits || 0
      })
      
      return {
        id: hospital.id_hospital,
        name: hospital.nombre_hospital,
        coords: [hospital.longitud, hospital.latitud],
        employees: empleadosHospital.length,
        geofenceExits: totalSalidas,
        hoursWorked: Math.round(totalHorasT),
        hoursOutside: Math.round(totalHorasFuera),
        efficiency: empleadosHospital.length > 0 ? Math.round((totalHorasT / (totalHorasT + totalHorasFuera)) * 100) || 0 : 0,
        department: empleadosHospital.length > 0 ? empleadosHospital[0].empleado.grupo || "Sin grupo" : "Sin empleados",
        direccion: hospital.direccion
      }
    })
  }, [apiData, filters.nombre_municipio, filters.nombre_estado])

  // Datos agregados del municipio
  const municipalStats = useMemo(() => {
    // Empleados activos (con registros/actividad)
    const activeEmployees = hospitals.reduce((sum, h) => sum + h.employees, 0)
    
    // Total de empleados en el municipio (activos + inactivos)
    const hospitalesDelMunicipio = apiData?.hospitales ? 
      apiData.hospitales.filter(hospital => 
        hospital.nombre_municipio === filters.nombre_municipio && 
        hospital.nombre_estado === filters.nombre_estado
      ) : []
    
    console.log("🔍 Hospitales del municipio para calcular total:", hospitalesDelMunicipio)
    console.log("🔍 Primer hospital ejemplo:", hospitalesDelMunicipio[0])
    
    const totalEmployeesInMunicipality = hospitalesDelMunicipio
      .reduce((sum, hospital) => {
        console.log(`Hospital: ${hospital.nombre_hospital}, total_empleados: ${hospital.total_empleados}`)
        return sum + (hospital.total_empleados || 0)
      }, 0)
    
    return {
      totalHospitals: hospitals.length,
      activeEmployees: activeEmployees, // Empleados con actividad
      totalEmployees: totalEmployeesInMunicipality, // Total de empleados en el municipio
      totalGeofenceExits: hospitals.reduce((sum, h) => sum + h.geofenceExits, 0),
      totalHoursWorked: hospitals.reduce((sum, h) => sum + h.hoursWorked, 0),
      averageEfficiency:
        hospitals.length > 0 ? Math.round(hospitals.reduce((sum, h) => sum + h.efficiency, 0) / hospitals.length) : 0,
    }
  }, [hospitals, apiData, filters.nombre_municipio, filters.nombre_estado])

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

  // Datos de tendencias por hospital (basado en datos reales y período seleccionado)
  const hospitalTrends = useMemo(() => {
    if (!apiData || !hospitals.length) return []
    
    // Generar períodos basados en el rango de fechas seleccionado
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    
    let periods = []
    
    if (diffDays <= 30) {
      // Para períodos de 30 días o menos, mostrar por semanas
      const currentDate = new Date(startDate)
      let weekNum = 1
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate)
        const weekEnd = new Date(currentDate)
        weekEnd.setDate(weekEnd.getDate() + 6)
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime())
        
        const formatStart = weekStart.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
        const formatEnd = weekEnd.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
        
        periods.push({
          label: `${formatStart} - ${formatEnd}`,
          start: weekStart,
          end: weekEnd
        })
        
        currentDate.setDate(currentDate.getDate() + 7)
        weekNum++
      }
    } else if (diffDays <= 90) {
      // Para períodos de 30-90 días, mostrar por meses
      const currentDate = new Date(startDate)
      currentDate.setDate(1) // Primer día del mes
      
      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        if (monthEnd > endDate) monthEnd.setTime(endDate.getTime())
        
        const monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        
        periods.push({
          label: monthLabel,
          start: monthStart,
          end: monthEnd
        })
        
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    } else {
      // Para períodos mayores a 90 días, mostrar por trimestres
      const currentDate = new Date(startDate)
      let quarter = 1
      
      while (currentDate <= endDate) {
        const quarterStart = new Date(currentDate)
        const quarterEnd = new Date(currentDate)
        quarterEnd.setMonth(quarterEnd.getMonth() + 3)
        quarterEnd.setDate(quarterEnd.getDate() - 1)
        if (quarterEnd > endDate) quarterEnd.setTime(endDate.getTime())
        
        const formatStart = quarterStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        const formatEnd = quarterEnd.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
        
        periods.push({
          label: `${formatStart} - ${formatEnd}`,
          start: quarterStart,
          end: quarterEnd
        })
        
        currentDate.setMonth(currentDate.getMonth() + 3)
        quarter++
      }
    }
    
    // Generar datos para cada período
    return periods.map(period => {
      const trend = { period: period.label }
      
      hospitals.forEach(hospital => {
        // Filtrar empleados de este hospital en este período
        const empleadosHospital = apiData.empleados.filter(emp => 
          emp.empleado.id_hospital === hospital.id
        )
        
        let totalHorasPeriodo = 0
        empleadosHospital.forEach(emp => {
          // Filtrar registros del empleado en este período
          const registrosPeriodo = emp.registros.filter(registro => {
            const fechaRegistro = new Date(registro.fecha_hora)
            return fechaRegistro >= period.start && fechaRegistro <= period.end
          })
          
          if (registrosPeriodo.length > 0) {
            const stats = calcularEstadisticasEmpleadoPorDias(registrosPeriodo)
            totalHorasPeriodo += stats.workedHours
          }
        })
        
        // Usar nombre corto del hospital para la leyenda
        const hospitalKey = hospital.name.split(' ')[0] + (hospital.name.split(' ')[1] ? ' ' + hospital.name.split(' ')[1] : '')
        trend[hospitalKey] = Math.round(totalHorasPeriodo)
      })
      
      return trend
    })
  }, [apiData, hospitals, dateRange.startDate, dateRange.endDate])

  // Colores para gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  // GeoJSON filtrado del estado seleccionado
  const filteredEstadoGeo = useMemo(() => {
    if (!municipiosGeo || !filters.nombre_estado) return null;
    return {
      type: "FeatureCollection",
      features: municipiosGeo.features.filter(f => f.properties.state_name === filters.nombre_estado)
    };
  }, [municipiosGeo, filters.nombre_estado]);

  // GeoJSON del municipio seleccionado para resaltar
  const selectedMunicipioGeo = useMemo(() => {
    if (!municipiosGeo || !filters.nombre_estado || !filters.nombre_municipio) return null;
    // Encontrar el código de letras del estado seleccionado
    const codeLetter = Object.entries(stateCodeToName).find(([, name]) => name === filters.nombre_estado)?.[0];
    // Encontrar el código numérico
    const codeNum = Object.entries(stateCodeMapping).find(([, v]) => v === codeLetter)?.[0];
    const municipioFeature = municipiosGeo.features.find(
      (f) => String(f.properties.state_code).padStart(2, "0") === codeNum && f.properties.mun_name === filters.nombre_municipio
    );
    if (!municipioFeature) return null;
    return {
      type: "FeatureCollection",
      features: [municipioFeature],
    };
  }, [municipiosGeo, filters.nombre_estado, filters.nombre_municipio]);

  // Estilo destacado para el municipio seleccionado
  const municipioSelectedStyle = {
    fillColor: "#2563eb",
    weight: 3,
    opacity: 1,
    color: "#1e40af",
    fillOpacity: 0.25,
  };

  // Actualizar posición del mapa cuando cambia el municipio
  useEffect(() => {
    if (filters.nombre_municipio && hospitals.length > 0) {
      const avgLat = hospitals.reduce((sum, h) => sum + h.coords[1], 0) / hospitals.length
      const avgLon = hospitals.reduce((sum, h) => sum + h.coords[0], 0) / hospitals.length
      setMapPosition({
        coordinates: [avgLon, avgLat],
        zoom: 11,
      })
    }
  }, [filters.nombre_municipio, hospitals])

  // Sincronizar municipio seleccionado con el estado - ELIMINADO para requerir selección manual

  return (
    <>
      <style>
        {customScrollbarStyles}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header con Filtros */}
        <div className="max-w-7xl mx-auto pt-8 px-6">        {/* Filtros de Análisis */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200 mb-8">
          <div className="flex flex-col gap-6">
            {/* Período y fechas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-emerald-500" /> 
                  Período
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selección rápida</option>
                  {datePresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> 
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={tempDateRange.startDate}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> 
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={tempDateRange.endDate}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Estado-Municipio-Aplicar cambios */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-indigo-500" /> 
                  Estado
                </label>
                <select
                  value={filters.id_estado}
                  onChange={(e) => {
                    const selectedEstado = estados.find(estado => estado.id_estado === parseInt(e.target.value))
                    setFilters({
                      ...filters,
                      id_estado: e.target.value,
                      nombre_estado: selectedEstado ? selectedEstado.nombre_estado : "",
                      id_municipio: "",
                      nombre_municipio: "",
                    })
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar Estado</option>
                  {estados.map((estado) => (
                    <option key={estado.id_estado} value={estado.id_estado}>
                      {estado.nombre_estado}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-purple-500" /> 
                  Municipio
                </label>
                <select
                  value={filters.id_municipio}
                  onChange={(e) => {
                    const selectedMunicipio = municipios.find(municipio => municipio.id_municipio === parseInt(e.target.value))
                    setFilters({
                      ...filters,
                      id_municipio: e.target.value,
                      nombre_municipio: selectedMunicipio ? selectedMunicipio.nombre_municipio : "",
                    })
                  }}
                  disabled={!filters.id_estado}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Seleccionar Municipio</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.id_municipio} value={municipio.id_municipio}>
                      {municipio.nombre_municipio}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {hasChanges && (
                  <button
                    onClick={applyChanges}
                    className="w-full h-10 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Aplicar cambios
                  </button>
                )}
              </div>
              <div>
                <button
                  onClick={clearFilters}
                  className="w-full h-10 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje informativo cuando no se han seleccionado filtros */}
        {!filters.id_estado || !filters.id_municipio ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-center space-x-3">
                <MapPin className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Selecciona Estado y Municipio</h3>
                  <p className="text-blue-600 mt-1">
                    Para visualizar los datos del dashboard, primero selecciona un estado y un municipio en los filtros de arriba.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
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
              <p className="text-2xl font-bold">{municipalStats.activeEmployees.toLocaleString()}</p>
              <p className="text-xs text-blue-100 mt-1">
                {municipalStats.activeEmployees} activos de {municipalStats.totalEmployees} empleados
              </p>
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
                  <h3 className="text-xl font-bold text-gray-800">Mapa de {filters.nombre_municipio || "Municipio"}</h3>
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
                      key={filters.nombre_municipio}
                      data={filteredEstadoGeo}
                      style={municipioDefaultStyle}
                    />
                  )}
                  {/* Capa resaltada del municipio seleccionado */}
                  {selectedMunicipioGeo && (
                    <GeoJSON
                      key={filters.nombre_municipio + "-highlight"}
                      data={selectedMunicipioGeo}
                      style={municipioSelectedStyle}
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
                    <p className="text-sm text-gray-500">Comparación de horas y personal en {filters.nombre_municipio}</p>
                  </div>
                </div>
              <div className="h-[350px]">
                {isLoadingData ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Cargando datos...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hospitals.map(hospital => ({
                        name: hospital.name.length > 15 ? hospital.name.substring(0, 15) + "..." : hospital.name,
                        "Horas Trabajadas": hospital.hoursWorked,
                        "Horas Fuera": hospital.hoursOutside,
                        "Empleados": hospital.employees,
                      }))}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: "#4B5563", fontSize: 11 }}
                        tickLine={false}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                      <Bar dataKey="Horas Fuera" fill="#FF8042" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Empleados" fill="#00C49F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                {isLoadingData ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Cargando datos...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hospitalTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="period" tick={{ fill: "#4B5563", fontSize: 12 }} tickLine={false} />
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
                      {hospitals.map((hospital, index) => {
                        const hospitalKey = hospital.name.split(' ')[0] + (hospital.name.split(' ')[1] ? ' ' + hospital.name.split(' ')[1] : '')
                        return (
                          <Line
                            key={hospital.id}
                            type="monotone"
                            dataKey={hospitalKey}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                          />
                        )
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              </div>
            </div>

            {/* Tabla de Hospitales */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Hospitales Registrados</h3>
                  <p className="text-sm text-gray-500">
                    Detalle completo de {hospitals.length} hospitales en {filters.nombre_municipio}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Cargando datos...</div>
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Hospital</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Grupo/Departamento</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Empleados</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Salidas</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Horas Trabajadas</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Horas Fuera</th>
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
                            <div className="text-xs text-gray-500 mt-1">{hospital.direccion?.substring(0, 50)}...</div>
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
                            <span className="font-medium text-emerald-600">{hospital.hoursWorked}h</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-medium text-orange-600">{hospital.hoursOutside}h</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <span
                                className={`font-medium ${
                                  hospital.efficiency >= 90
                                    ? "text-emerald-600"
                                    : hospital.efficiency >= 70
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
                      {hospitals.length === 0 && !isLoadingData && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
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
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}