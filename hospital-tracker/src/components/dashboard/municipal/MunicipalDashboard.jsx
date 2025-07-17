"use client"

import React, { useState, useEffect, useMemo } from "react"
import { format, subDays, subMonths, subYears } from "date-fns"
import { Calendar, Building2, MapPin, Clock, Users, ArrowUpRight, TrendingUp, Plus, Minus, Check, Download } from "lucide-react"
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
import { useAuth } from "../../../context/AuthContext"
import { generarReporteMunicipalPDF } from "./reportes/MunicipalReportPDF"

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
            <span className="text-gray-600">Horas Descanso:</span>
            <span className="font-medium text-yellow-600">{hospital.hoursRest || 0}h</span>
          </div>
          <div className="flex justify-between items-center">
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
  // --- HOOKS DE AUTENTICACIÓN ---
  const { userRole, userId } = useAuth()
  
  // --- ESTADOS PARA CONTROL DE SELECCIÓN AUTOMÁTICA ---
  const [userStateCode, setUserStateCode] = useState("") // Estado del administrador
  const [userMunicipalityCode, setUserMunicipalityCode] = useState("") // Municipio del administrador
  const [isStateDisabled, setIsStateDisabled] = useState(false) // Controla si el selector de estado está deshabilitado
  const [isMunicipalityDisabled, setIsMunicipalityDisabled] = useState(false) // Controla si el selector de municipio está deshabilitado
  const [isLoadingUserLocation, setIsLoadingUserLocation] = useState(false) // Indica si está cargando la ubicación del usuario
  
  // --- ESTADOS ORIGINALES ---
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
  const [loadingPDF, setLoadingPDF] = useState(false)

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
        const response = await fetch("https://geoapphospital-b0yr.onrender.com/api/superadmin/estados")
        if (response.ok) {
          const data = await response.json()
          setEstados(data)
        } else {
          console.error("Error al cargar estados:", response.status)
        }
      } catch (error) {
        console.error("Error al cargar estados:", error)
      }
    }
    fetchEstados()
  }, [])

  // --- FUNCIONES PARA OBTENER DATOS DEL USUARIO SEGÚN ROL ---
  
  // Función para obtener el estado del administrador estatal
  const fetchUserState = async () => {
    console.log('[Debug] fetchUserState called - userRole:', userRole, 'userId:', userId);
    
    if (userRole !== "estadoadmin" || !userId) {
      console.log('[Debug] No es estadoadmin o no hay userId, saltando...');
      return;
    }
    
    setIsLoadingUserLocation(true);
    
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
        const estadoFromAPI = data[0].nombre_estado.toLowerCase().trim();
        console.log('[Debug] Estado encontrado:', estadoFromAPI);
        
        // Buscar el estado correspondiente en la lista de estados
        const estadoEncontrado = estados.find(estado => 
          estado.nombre_estado.toLowerCase().trim() === estadoFromAPI
        );
        
        if (estadoEncontrado) {
          setUserStateCode(estadoEncontrado.id_estado);
          setFilters(prev => ({
            ...prev,
            id_estado: estadoEncontrado.id_estado,
            nombre_estado: estadoEncontrado.nombre_estado
          }));
          setIsStateDisabled(true);
          console.log(`[MunicipalDashboard] ✅ Estado del administrador estatal configurado: ${estadoEncontrado.nombre_estado} (${estadoEncontrado.id_estado})`);
        } else {
          console.error('[Debug] ❌ No se encontró estado en la lista:', estadoFromAPI);
        }
      } else {
        console.log('[Debug] ❌ No se encontraron datos válidos o estado en la respuesta');
      }
    } catch (error) {
      console.error('[Debug] ❌ Error al obtener el estado del usuario:', error);
    } finally {
      setIsLoadingUserLocation(false);
    }
  };

  // Función para obtener el municipio del administrador municipal
  const fetchUserMunicipality = async () => {
    console.log('[Debug] fetchUserMunicipality called - userRole:', userRole, 'userId:', userId);
    
    if (userRole !== "municipioadmin" || !userId) {
      console.log('[Debug] No es municipioadmin o no hay userId, saltando...');
      return;
    }
    
    setIsLoadingUserLocation(true);
    
    try {
      console.log('[Debug] Fetching municipality for municipioadmin with userId:', userId);
      const response = await fetch(`https://geoapphospital-b0yr.onrender.com/api/municipioadmin/hospitals-by-user/${userId}`);
      console.log('[Debug] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Response error:', errorText);
        throw new Error(`Error al obtener el municipio del usuario: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Debug] Response data:', data);
      
      if (data && data.length > 0 && data[0].nombre_municipio && data[0].nombre_estado) {
        const municipioFromAPI = data[0].nombre_municipio.toLowerCase().trim();
        const estadoFromAPI = data[0].nombre_estado.toLowerCase().trim();
        console.log('[Debug] Municipio encontrado:', municipioFromAPI, 'Estado:', estadoFromAPI);
        
        // Buscar el estado correspondiente en la lista de estados
        const estadoEncontrado = estados.find(estado => 
          estado.nombre_estado.toLowerCase().trim() === estadoFromAPI
        );
        
        if (estadoEncontrado) {
          setUserStateCode(estadoEncontrado.id_estado);
          setFilters(prev => ({
            ...prev,
            id_estado: estadoEncontrado.id_estado,
            nombre_estado: estadoEncontrado.nombre_estado
          }));
          setIsStateDisabled(true);
          
          // Después de configurar el estado, cargar municipios y seleccionar el del usuario
          setTimeout(async () => {
            try {
              const municipiosResponse = await fetch(`https://geoapphospital-b0yr.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${estadoEncontrado.id_estado}`);
              if (municipiosResponse.ok) {
                const municipiosData = await municipiosResponse.json();
                setMunicipios(municipiosData);
                
                // Buscar el municipio específico
                const municipioEncontrado = municipiosData.find(municipio => 
                  municipio.nombre_municipio.toLowerCase().trim() === municipioFromAPI
                );
                
                if (municipioEncontrado) {
                  setUserMunicipalityCode(municipioEncontrado.id_municipio);
                  setFilters(prev => ({
                    ...prev,
                    id_municipio: municipioEncontrado.id_municipio,
                    nombre_municipio: municipioEncontrado.nombre_municipio
                  }));
                  setIsMunicipalityDisabled(true);
                  console.log(`[MunicipalDashboard] ✅ Municipio del administrador municipal configurado: ${municipioEncontrado.nombre_municipio} (${municipioEncontrado.id_municipio})`);
                } else {
                  console.error('[Debug] ❌ No se encontró municipio en la lista:', municipioFromAPI);
                }
              }
            } catch (error) {
              console.error('[Debug] ❌ Error al cargar municipios para municipioadmin:', error);
            }
          }, 500);
          
        } else {
          console.error('[Debug] ❌ No se encontró estado en la lista:', estadoFromAPI);
        }
      } else {
        console.log('[Debug] ❌ No se encontraron datos válidos en la respuesta');
      }
    } catch (error) {
      console.error('[Debug] ❌ Error al obtener el municipio del usuario:', error);
    } finally {
      setIsLoadingUserLocation(false);
    }
  };

  // Efecto para cargar la ubicación del usuario al inicializar el componente
  useEffect(() => {
    console.log('[Debug] useEffect triggered - userRole:', userRole, 'userId:', userId, 'estados length:', estados.length);
    
    // Solo ejecutar si tenemos tanto userRole como userId y la lista de estados cargada
    if (userRole && userId && estados.length > 0) {
      console.log('[Debug] Calling fetch functions...');
      if (userRole === "estadoadmin") {
        fetchUserState();
      } else if (userRole === "municipioadmin") {
        fetchUserMunicipality();
      }
    } else {
      console.log('[Debug] Esperando userRole, userId y estados...');
    }
  }, [userRole, userId, estados]);

  // Efecto para configurar los selectores según el rol del usuario
  useEffect(() => {
    console.log('[Debug] Role effect - userRole:', userRole);
    
    if (userRole === "estadoadmin") {
      setIsStateDisabled(true);
      setIsMunicipalityDisabled(false); // Pueden seleccionar municipio
      console.log('[Debug] Estado deshabilitado para estadoadmin');
    } else if (userRole === "municipioadmin") {
      setIsStateDisabled(true);
      setIsMunicipalityDisabled(true);
      console.log('[Debug] Estado y municipio deshabilitados para municipioadmin');
    } else {
      setIsStateDisabled(false);
      setIsMunicipalityDisabled(false);
      setUserStateCode("");
      setUserMunicipalityCode("");
      console.log('[Debug] Selectores habilitados para otros roles');
    }
  }, [userRole]);

  // Cargar municipios cuando cambia el estado seleccionado
  useEffect(() => {
    const fetchMunicipios = async () => {
      if (filters.id_estado) {
        try {
          const response = await fetch(`https://geoapphospital-b0yr.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${filters.id_estado}`)
          if (response.ok) {
            const data = await response.json()
            setMunicipios(data)
          } else {
            console.error("Error al cargar municipios:", response.status)
          }
        } catch (error) {
          console.error("Error al cargar municipios:", error)
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
    setIsLoadingData(true)
    try {
      if (!id_municipio) {
        setApiData({ empleados: [], hospitales: [] })
        setIsLoadingData(false)
        return
      }
      
      const requestBody = {
        id_municipio,
        fechaInicio: `${startDate} 00:00:00`,
        fechaFin: `${endDate} 23:59:59`
      }
      
      const response = await fetch("https://geoapphospital-b0yr.onrender.com/api/dashboards/municipio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      setApiData(data)
    } catch (error) {
      console.error("Error fetching municipal data:", error)
      setApiData(null)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    if (filters.id_municipio) {
      fetchMunicipalData(filters.id_municipio, dateRange.startDate, dateRange.endDate)
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
      let totalHorasDescanso = 0
      
      empleadosHospital.forEach(emp => {
        const stats = calcularEstadisticasEmpleadoPorDias(emp.registros)
        totalHorasT += stats.workedHours
        totalHorasFuera += stats.outsideHours
        totalHorasDescanso += stats.restHours
        
        // Para salidas, usar la función original que sí las calcula
        const statsConSalidas = calcularEstadisticasEmpleado(emp.registros)
        totalSalidas += statsConSalidas.totalExits || 0
      })
      
      // Obtener todos los grupos únicos del hospital
      const gruposUnicos = [...new Set(
        empleadosHospital
          .map(emp => emp.empleado.grupo)
          .filter(grupo => grupo && grupo.trim() !== "")
      )];
      
      const departmentText = gruposUnicos.length > 0 
        ? gruposUnicos.length === 1 
          ? gruposUnicos[0] 
          : `${gruposUnicos.length} grupos (${gruposUnicos.join(', ')})`
        : "Sin grupo";
      
      const totalHorasConDescanso = totalHorasT + totalHorasFuera + totalHorasDescanso
      
      return {
        id: hospital.id_hospital,
        name: hospital.nombre_hospital,
        coords: [hospital.longitud, hospital.latitud],
        employees: empleadosHospital.length,
        geofenceExits: totalSalidas,
        hoursWorked: Math.round(totalHorasT),
        hoursOutside: Math.round(totalHorasFuera),
        hoursRest: Math.round(totalHorasDescanso),
        // Eficiencia eliminada completamente
        department: departmentText,
        grupos: gruposUnicos, // Lista completa de grupos
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
    
    const totalEmployeesInMunicipality = hospitalesDelMunicipio
      .reduce((sum, hospital) => {
        return sum + (hospital.total_empleados || 0)
      }, 0)
    
    return {
      totalHospitals: hospitals.length,
      activeEmployees: activeEmployees, // Empleados con actividad
      totalEmployees: totalEmployeesInMunicipality, // Total de empleados en el municipio
      totalGeofenceExits: hospitals.reduce((sum, h) => sum + h.geofenceExits, 0),
      totalHoursWorked: hospitals.reduce((sum, h) => sum + h.hoursWorked, 0),
      totalHoursOutside: hospitals.reduce((sum, h) => sum + h.hoursOutside, 0),
      totalHoursRest: hospitals.reduce((sum, h) => sum + h.hoursRest, 0),
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
        <div className="max-w-7xl mx-auto pt-8 px-6">
          {/* Panel principal de título */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {userRole === "estadoadmin" ? "Panel de Análisis Municipal" : 
                     userRole === "municipioadmin" ? "Panel de Análisis Municipal" : 
                     "Dashboard de Análisis Municipal"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {userRole === "estadoadmin" 
                      ? `Dashboard municipal para ${filters.nombre_estado || 'su estado asignado'}`
                      : userRole === "municipioadmin" 
                      ? `Dashboard específico para ${filters.nombre_municipio || 'su municipio asignado'}`
                      : "Configura los parámetros de visualización municipal"
                    }
                  </p>
                  {/* Debug info - solo en desarrollo */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Debug: Role={userRole}, UserId={userId}, StateDisabled={isStateDisabled ? 'Si' : 'No'}, MunicipalityDisabled={isMunicipalityDisabled ? 'Si' : 'No'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Análisis */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-indigo-500" /> 
                    Estado
                  </label>
                  {isStateDisabled && (userRole === "estadoadmin" || userRole === "municipioadmin") && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      Asignado automáticamente
                    </span>
                  )}
                </div>
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
                  disabled={isStateDisabled}
                  className={`w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isStateDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                  }`}
                >
                  <option value="">Seleccionar Estado</option>
                  {estados.map((estado) => (
                    <option key={estado.id_estado} value={estado.id_estado}>
                      {estado.nombre_estado}
                    </option>
                  ))}
                </select>
                {filters.id_estado && filters.nombre_estado && (
                  <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-700">
                      Estado actual: <span className="font-semibold">{filters.nombre_estado}</span>
                    </p>
                    {isStateDisabled && (userRole === "estadoadmin" || userRole === "municipioadmin") && (
                      <p className="text-xs text-indigo-600 mt-1">
                        ⚡ Asignado por su rol de {userRole === "estadoadmin" ? "Administrador Estatal" : "Administrador Municipal"}
                      </p>
                    )}
                  </div>
                )}
                {isStateDisabled && !filters.id_estado && (userRole === "estadoadmin" || userRole === "municipioadmin") && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center space-x-2">
                      {isLoadingUserLocation && (
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <p className="text-sm text-amber-700">
                        {isLoadingUserLocation ? "🔄 Obteniendo ubicación asignada..." : "⚠️ No se pudo cargar la ubicación asignada"}
                      </p>
                    </div>
                    {!isLoadingUserLocation && (
                      <p className="text-xs text-amber-600 mt-1">
                        Verifique la consola del navegador para más detalles del error
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-purple-500" /> 
                    Municipio
                  </label>
                  {isMunicipalityDisabled && userRole === "municipioadmin" && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      Asignado automáticamente
                    </span>
                  )}
                </div>
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
                  disabled={!filters.id_estado || isMunicipalityDisabled}
                  className={`w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    (!filters.id_estado || isMunicipalityDisabled) ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                  }`}
                >
                  <option value="">Seleccionar Municipio</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.id_municipio} value={municipio.id_municipio}>
                      {municipio.nombre_municipio}
                    </option>
                  ))}
                </select>
                {filters.id_municipio && filters.nombre_municipio && (
                  <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-sm text-purple-700">
                      Municipio actual: <span className="font-semibold">{filters.nombre_municipio}</span>
                    </p>
                    {isMunicipalityDisabled && userRole === "municipioadmin" && (
                      <p className="text-xs text-purple-600 mt-1">
                        ⚡ Asignado por su rol de Administrador Municipal
                      </p>
                    )}
                  </div>
                )}
                {isMunicipalityDisabled && !filters.id_municipio && userRole === "municipioadmin" && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center space-x-2">
                      {isLoadingUserLocation && (
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <p className="text-sm text-amber-700">
                        {isLoadingUserLocation ? "🔄 Obteniendo municipio asignado..." : "⚠️ No se pudo cargar el municipio asignado"}
                      </p>
                    </div>
                    {!isLoadingUserLocation && (
                      <p className="text-xs text-amber-600 mt-1">
                        Verifique la consola del navegador para más detalles del error
                      </p>
                    )}
                  </div>
                )}
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

        {/* Botón de descarga de PDF Municipal */}
        {filters.id_municipio && hospitals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-200">
            <div className="flex justify-end">
              <button
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
                disabled={loadingPDF}
                onClick={async () => {
                  setLoadingPDF(true)
                  try {
                    const municipalData = {
                      nombre_municipio: filters.nombre_municipio,
                      nombre_estado: filters.nombre_estado,
                      totalHospitals: municipalStats.totalHospitals,
                      activeEmployees: municipalStats.activeEmployees,
                      totalEmployees: municipalStats.totalEmployees,
                      // averageEfficiency eliminado
                    }
                    
                    await generarReporteMunicipalPDF({
                      municipalData,
                      hospitals,
                      municipalStats,
                      startDate: dateRange.startDate,
                      endDate: dateRange.endDate,
                    })
                  } catch (err) {
                    console.error('Error al generar el PDF municipal:', err);
                    alert("Error al generar el PDF municipal. Revisa la consola para más detalles.");
                  }
                  setLoadingPDF(false)
                }}
              >
                {loadingPDF ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-blue-400 rounded-full"></span> 
                    Generando PDF...
                  </span>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Descargar Reporte Municipal PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mensaje informativo cuando no se han seleccionado filtros */}
        {!filters.id_estado || !filters.id_municipio ? (
          <div className="bg-white rounded-2xl shadow-md p-10 mb-8 border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Configura los filtros para ver el análisis municipal
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Selecciona un estado y municipio para acceder a las estadísticas detalladas de hospitales, 
                empleados y métricas de rendimiento municipal.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Análisis disponibles:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>KPIs municipales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Métricas por hospital</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Mapa interactivo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Gráficos comparativos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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

            {/* Horas en Geocerca Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 text-green-100" />
                <TrendingUp className="h-4 w-4 text-green-200" />
              </div>
              <h3 className="text-sm font-medium text-green-100 mb-1">Horas Geocerca</h3>
              <p className="text-2xl font-bold">{municipalStats.totalHoursWorked.toLocaleString()}</p>
            </div>

            {/* Horas Fuera Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 text-orange-100" />
                <TrendingUp className="h-4 w-4 text-orange-200" />
              </div>
              <h3 className="text-sm font-medium text-orange-100 mb-1">Horas Fuera</h3>
              <p className="text-2xl font-bold">{(municipalStats.totalHoursOutside || 0).toLocaleString()}</p>
            </div>

            {/* Horas Descanso Card */}
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-6 w-6 text-yellow-100" />
                <TrendingUp className="h-4 w-4 text-yellow-200" />
              </div>
              <h3 className="text-sm font-medium text-yellow-100 mb-1">Horas Descanso</h3>
              <p className="text-2xl font-bold">{(municipalStats.totalHoursRest || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6 mb-8">
            {/* Mapa */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Mapa de {filters.nombre_municipio || "Municipio"}
                    {((userRole === "estadoadmin" && isStateDisabled) || (userRole === "municipioadmin" && isMunicipalityDisabled)) && filters.nombre_municipio && (
                      <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                        {userRole === "municipioadmin" ? "Municipio asignado" : "Estado asignado"}
                      </span>
                    )}
                  </h3>
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
                          {/* Eficiencia eliminada */}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                {/* Tooltip */}
                <MapTooltip x={tooltipPosition.x} y={tooltipPosition.y} hospital={hoveredHospital} />
              </div>
            </div>

            {/* Charts Grid - Layout Mejorado */}
            <div className="space-y-6">
              {/* Primera fila: Gráfico principal de métricas */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Métricas por Hospital</h3>
                    <p className="text-sm text-gray-500">Comparación de horas y personal en {filters.nombre_municipio}</p>
                  </div>
                </div>
                <div className="h-[400px]">
                  {isLoadingData ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-500">Cargando datos...</div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={hospitals.map(hospital => ({
                          name: hospital.name.length > 15 ? hospital.name.substring(0, 15) + "..." : hospital.name,
                          "Horas Geocerca": hospital.hoursWorked,
                          "Horas Fuera": hospital.hoursOutside,
                          "Horas Descanso": hospital.hoursRest || 0,
                          "Total Horas": (hospital.hoursWorked + hospital.hoursOutside + (hospital.hoursRest || 0)),
                        }))}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 80,
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
                        <Bar dataKey="Horas Geocerca" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Horas Fuera" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Horas Descanso" fill="#eab308" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Total Horas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Segunda fila: Grid 2x2 para gráficos medianos */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Distribución de Empleados por Hospital */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Distribución de Empleados</h3>
                      <p className="text-sm text-gray-500">Personal por hospital</p>
                    </div>
                  </div>
                  <div className="h-[350px]">
                    {isLoadingData ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Cargando datos...</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hospitals.map((hospital, index) => ({
                              name: hospital.name.length > 20 ? hospital.name.substring(0, 20) + "..." : hospital.name,
                              value: hospital.employees,
                              fill: COLORS[index % COLORS.length]
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            dataKey="value"
                          >
                            {hospitals.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Salidas de Geocerca por Hospital */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Salidas de Geocerca</h3>
                      <p className="text-sm text-gray-500">Número de salidas por hospital</p>
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
                            name: hospital.name.length > 12 ? hospital.name.substring(0, 12) + "..." : hospital.name,
                            salidas: hospital.geofenceExits,
                            empleados: hospital.employees
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: "#4B5563", fontSize: 10 }}
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
                          <Bar dataKey="salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Tercera fila: Resumen Estadístico - Ancho completo */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Resumen Estadístico Municipal</h3>
                    <p className="text-sm text-gray-500">Estadísticas clave y hospitales destacados</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Métricas promedio */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Métricas Promedio</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Eficiencia Promedio eliminada completamente */}
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-green-600 font-medium">Horas Promedio/Hospital</div>
                        <div className="text-xl font-bold text-green-700">
                          {hospitals.length > 0 ? 
                            Math.round(hospitals.reduce((sum, h) => sum + h.hoursWorked, 0) / hospitals.length) 
                            : 0}h
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-xs text-orange-600 font-medium">Empleados Promedio</div>
                        <div className="text-xl font-bold text-orange-700">
                          {hospitals.length > 0 ? 
                            Math.round(hospitals.reduce((sum, h) => sum + h.employees, 0) / hospitals.length) 
                            : 0}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="text-xs text-red-600 font-medium">Salidas Promedio</div>
                        <div className="text-xl font-bold text-red-700">
                          {hospitals.length > 0 ? 
                            Math.round(hospitals.reduce((sum, h) => sum + h.geofenceExits, 0) / hospitals.length) 
                            : 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top hospitales */}
                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Hospitales Destacados</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {hospitals
                        // Ordenamiento por eficiencia eliminado
                        .slice(0, 6)
                        .map((hospital, index) => (
                          <div key={hospital.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {hospital.name.length > 22 ? hospital.name.substring(0, 22) + "..." : hospital.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {hospital.grupos && hospital.grupos.length > 0 
                                    ? hospital.grupos.length === 1 
                                      ? hospital.grupos[0]
                                      : `${hospital.grupos.length} grupos`
                                    : "Sin grupos"
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              {/* Mostrar empleados y horas trabajadas */}
                              <div className="text-xs text-gray-500">{hospital.employees} emp.</div>
                              <div className="text-xs text-green-600">{hospital.hoursWorked} h</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuarta fila: Tendencia de Horas - Ancho completo */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Tendencia de Horas por Hospital</h3>
                    <p className="text-sm text-gray-500">Evolución temporal de horas trabajadas</p>
                  </div>
                </div>
                <div className="h-[400px]">
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
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Horas Geocerca</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Horas Fuera</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Horas Descanso</th>
                        {/* Columna eficiencia eliminada */}
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
                            <span className="font-medium text-yellow-600">{hospital.hoursRest || 0}h</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              {/* Sin eficiencia */}
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
                          <td colSpan={9} className="px-6 py-12 text-center">
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