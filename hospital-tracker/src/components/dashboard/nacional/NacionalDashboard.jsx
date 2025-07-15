import { useState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { generarReporteNacionalPDF } from "./reportes/NacionalReportPDF";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import { format, subDays, subMonths, subYears, isAfter } from "date-fns";
import {
  Calendar,
  Building2,
  Users,
  TrendingUp,
  MapPin,
  Check,
} from "lucide-react";

// Configuración de la API
const API_BASE_URL = "https://geoapphospital-b0yr.onrender.com";

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
};

export default function NacionalDashboard() {
  const [loadingPDF, setLoadingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    setLoadingPDF(true);
    try {
      await generarReporteNacionalPDF({
        dateRange,
        totalStats,
        stateData: stateData.map(s => ({
          ...s,
          stateName: stateCodeToName[s.state] || s.state
        }))
      });
    } finally {
      setLoadingPDF(false);
    }
  };
  const [activeTab, setActiveTab] = useState("Nacional");
  const [dateRange, setDateRange] = useState({
    startDate: format(
      new Date(new Date().setDate(new Date().getDate() - 30)),
      "yyyy-MM-dd"
    ),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Estados para el filtro de fechas mejorado
  const [selectedPreset, setSelectedPreset] = useState("30d");
  const [hasChanges, setHasChanges] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({
    startDate: format(
      new Date(new Date().setDate(new Date().getDate() - 30)),
      "yyyy-MM-dd"
    ),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const [stateData, setStateData] = useState([]);
  const [totalStats, setTotalStats] = useState({
    hospitals: 0,
    employees: 0,
    totalExits: 0,
    totalHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geocercaTooltip, setGeocercaTooltip] = useState({
    content: "",
    position: { x: 0, y: 0 },
    show: false,
  });
  const [horasTooltip, setHorasTooltip] = useState({
    content: "",
    position: { x: 0, y: 0 },
    show: false,
  });

  const mapContainerRef = useRef(null);

  // Función para calcular la mejor posición del tooltip
  const calculateTooltipPosition = (mouseX, mouseY, containerRect, tooltipWidth = 220) => {
    const padding = 20; // Padding desde los bordes
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    let x, y;

    // Calcular posición X (izquierda o derecha)
    const spaceRight = containerWidth - mouseX;
    const spaceLeft = mouseX;

    if (spaceRight >= tooltipWidth + padding) {
      // Hay espacio a la derecha
      x = mouseX + 12;
    } else if (spaceLeft >= tooltipWidth + padding) {
      // No hay espacio a la derecha, pero sí a la izquierda
      x = mouseX - tooltipWidth - 12;
    } else {
      // No hay espacio suficiente en ningún lado, centrar
      x = Math.max(padding, Math.min(containerWidth - tooltipWidth - padding, mouseX - tooltipWidth / 2));
    }

    // Calcular posición Y
    const tooltipHeight = 80; // Altura estimada del tooltip
    const spaceBelow = containerHeight - mouseY;
    const spaceAbove = mouseY;

    if (spaceBelow >= tooltipHeight + padding) {
      // Hay espacio abajo
      y = mouseY + 12;
    } else if (spaceAbove >= tooltipHeight + padding) {
      // No hay espacio abajo, pero sí arriba
      y = mouseY - tooltipHeight - 12;
    } else {
      // Centrar verticalmente
      y = Math.max(padding, Math.min(containerHeight - tooltipHeight - padding, mouseY - tooltipHeight / 2));
    }

    return { x, y };
  };

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
  ];

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    const today = new Date();

    if (preset === "custom") {
      return;
    }

    const presetConfig = datePresets.find((p) => p.value === preset);
    if (!presetConfig) return;

    let newStartDate;
    if (presetConfig.days) {
      newStartDate = subDays(today, presetConfig.days);
    } else if (presetConfig.months) {
      newStartDate = subMonths(today, presetConfig.months);
    } else if (presetConfig.years) {
      newStartDate = subYears(today, presetConfig.years);
    } else {
      return;
    }

    setTempDateRange({
      startDate: format(newStartDate, "yyyy-MM-dd"),
      endDate: format(today, "yyyy-MM-dd"),
    });
    setHasChanges(true);
  };

  const handleDateChange = (field, value) => {
    setTempDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSelectedPreset("custom");
    setHasChanges(true);
  };

  const applyChanges = () => {
    setDateRange(tempDateRange);
    setHasChanges(false);
  };

  const resetToOriginal = () => {
    setTempDateRange(dateRange);
    setHasChanges(false);
    setSelectedPreset("");
  };

  const isValidRange =
    tempDateRange.startDate &&
    tempDateRange.endDate &&
    !isAfter(
      new Date(tempDateRange.startDate),
      new Date(tempDateRange.endDate)
    );

  const daysDifference =
    tempDateRange.startDate && tempDateRange.endDate
      ? Math.ceil(
          (new Date(tempDateRange.endDate).getTime() -
            new Date(tempDateRange.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  // Función para cargar datos desde la API
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fechaInicio = dateRange.startDate;
      const fechaFin = dateRange.endDate;
      
      // Cargar estadísticas por estado y totales en paralelo
      const [estadisticasRes, totalesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboards/nacional/estadisticas-estados?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`),
        fetch(`${API_BASE_URL}/api/dashboards/nacional/totales?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)
      ]);

      if (!estadisticasRes.ok || !totalesRes.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }

      const estadisticasData = await estadisticasRes.json();
      const totalesData = await totalesRes.json();

      if (estadisticasData.success) {
        setStateData(estadisticasData.data);
      }
      
      if (totalesData.success) {
        setTotalStats({
          hospitals: totalesData.data.totalHospitals,
          employees: totalesData.data.totalEmployees,
          totalExits: totalesData.data.totalGeofenceExits,
          totalHours: totalesData.data.totalHoursWorked,
        });
      }

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  // Escalas de color para los mapas de calor
  const geofenceColorScale = scaleQuantile()
    .domain(stateData.length > 0 ? stateData.map((d) => d.geofenceExits).filter(val => val > 0) : [0, 1])
    .range([
      "#fef2f2",
      "#fecaca",
      "#fca5a5",
      "#f87171",
      "#ef4444",
      "#dc2626",
      "#b91c1c",
      "#991b1b",
      "#7f1d1d",
    ]);

  const hoursColorScale = scaleQuantile()
    .domain(stateData.length > 0 ? stateData.map((d) => d.hoursWorked).filter(val => val > 0) : [0, 1])
    .range([
      "#eff6ff",
      "#dbeafe",
      "#bfdbfe",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#2563eb",
      "#1d4ed8",
      "#1e40af",
    ]);

  // Función para obtener color de geocerca de manera segura
  const getGeofenceColor = (value) => {
    if (!value || value === 0) return "#f8fafc";
    try {
      return geofenceColorScale(value);
    } catch (error) {
      return "#fef2f2"; // Color más claro como fallback
    }
  };

  // Función para obtener color de horas de manera segura
  const getHoursColor = (value) => {
    if (!value || value === 0) return "#f8fafc";
    try {
      return hoursColorScale(value);
    } catch (error) {
      return "#eff6ff"; // Color más claro como fallback
    }
  };

  // Top 10 estados
  const topGeofenceStates = [...stateData]
    .sort((a, b) => b.geofenceExits - a.geofenceExits)
    .slice(0, 10);
  const topHoursStates = [...stateData]
    .sort((a, b) => b.hoursWorked - a.hoursWorked)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleGeneratePDF}
            disabled={loadingPDF}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </button>
        </div>
      </div>
      {/* Filtro de fechas compacto */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Título */}
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Período de Análisis
              </h3>
            </div>

            {/* Selector de presets */}
            <div className="w-full md:w-64">
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

            {/* Inputs de fecha */}
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                </div>
                <input
                  type="date"
                  value={tempDateRange.startDate}
                  onChange={(e) =>
                    handleDateChange("startDate", e.target.value)
                  }
                  className="h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <input
                  type="date"
                  value={tempDateRange.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={resetToOriginal}
                disabled={!hasChanges}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={applyChanges}
                disabled={!isValidRange || !hasChanges}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Aplicar
              </button>
            </div>
          </div>

          {/* Mensaje de rango seleccionado */}
          {isValidRange && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-500 mr-2" />
              <span className="text-sm text-emerald-800">
                Rango seleccionado: {daysDifference + 1} días (
                {format(new Date(tempDateRange.startDate), "dd/MM/yyyy")} -{" "}
                {format(new Date(tempDateRange.endDate), "dd/MM/yyyy")})
              </span>
            </div>
          )}

          {/* Mensaje de error */}
          {tempDateRange.startDate &&
            tempDateRange.endDate &&
            !isValidRange && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-2 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-red-800">
                  La fecha de inicio debe ser anterior a la fecha final
                </span>
              </div>
            )}
        </div>

        {/* Loading y Error States */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del dashboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-3">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">Error al cargar datos</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Compact KPI Cards */}
        {!loading && !error && (
          <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-6 w-6 text-emerald-100" />
              <TrendingUp className="h-4 w-4 text-emerald-200" />
            </div>
            <h3 className="text-sm font-medium text-emerald-100 mb-1">
              Total Hospitales
            </h3>
            <p className="text-2xl font-bold">{totalStats.hospitals}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-6 w-6 text-blue-100" />
              <TrendingUp className="h-4 w-4 text-blue-200" />
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-1">
              Total Empleados
            </h3>
            <p className="text-2xl font-bold">
              {totalStats.employees.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="h-6 w-6 text-red-100" />
              <TrendingUp className="h-4 w-4 text-red-200" />
            </div>
            <h3 className="text-sm font-medium text-red-100 mb-1">
              Salidas Totales
            </h3>
            <p className="text-2xl font-bold">
              {totalStats.totalExits.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-6 w-6 text-purple-100" />
              <TrendingUp className="h-4 w-4 text-purple-200" />
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-1">
              Horas Totales
            </h3>
            <p className="text-2xl font-bold">
              {totalStats.totalHours.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Maps and Charts Layout */}
        <div className="grid grid-cols-1 gap-6">
          {/* Sección de Geocercas */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Mapa de Geocercas */}
            <div className="xl:col-span-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-3 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full mr-4"></div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Salidas de Geocerca por Estado
                      </h3>
                      <p className="text-sm text-gray-600">
                        Distribución nacional de incidencias
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  ref={mapContainerRef}
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center h-[calc(100%-120px)]"
                >
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 1400,
                      center: [-102, 24],
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "1000px",
                      margin: "0 auto",
                    }}
                  >
                    <Geographies geography="/lib/mx.json">
                      {({ geographies }) => {
                        return geographies.map((geo) => {
                          const stateCode = geo.properties.id;
                          const stateInfo = stateData.find(
                            (s) => s.state === stateCode
                          );

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={
                                stateInfo
                                  ? getGeofenceColor(stateInfo.geofenceExits)
                                  : "#f8fafc"
                              }
                              stroke="#000000"
                              strokeWidth={0.5}
                              onMouseMove={(evt) => {
                                const containerRect =
                                  mapContainerRef.current?.getBoundingClientRect();
                                const offsetX =
                                  evt.clientX - containerRect.left;
                                const offsetY = evt.clientY - containerRect.top;
                                const stateName =
                                  stateCodeToName[stateCode] ||
                                  geo.properties.name;
                                
                                const tooltipPosition = calculateTooltipPosition(
                                  offsetX, 
                                  offsetY, 
                                  containerRect
                                );

                                setGeocercaTooltip({
                                  content: stateInfo
                                    ? `${stateName}\nSalidas: ${stateInfo.geofenceExits}\nHospitales: ${stateInfo.hospitals}`
                                    : stateName || "Estado",
                                  position: tooltipPosition,
                                  show: true,
                                });
                              }}
                              onMouseLeave={() => {
                                setGeocercaTooltip({
                                  ...geocercaTooltip,
                                  show: false,
                                });
                              }}
                              style={{
                                default: {
                                  outline: "none",
                                  cursor: "pointer",
                                  fill: stateInfo
                                    ? getGeofenceColor(stateInfo.geofenceExits)
                                    : "#f8fafc",
                                  transition: "all 0.2s ease",
                                },
                                hover: {
                                  outline: "none",
                                  fill: stateInfo ? "#dc2626" : "#e2e8f0",
                                  cursor: "pointer",
                                  filter: "brightness(1.1)",
                                },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        });
                      }}
                    </Geographies>
                  </ComposableMap>
                  {geocercaTooltip.show && (
                    <div
                      style={{
                        position: "absolute",
                        left: geocercaTooltip.position.x,
                        top: geocercaTooltip.position.y,
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        color: "white",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        zIndex: 1000,
                        whiteSpace: "pre-line",
                        pointerEvents: "none",
                        minWidth: "200px",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {geocercaTooltip.content}
                    </div>
                  )}
                </div>
                {/* Leyenda */}
                <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
                  <span className="font-medium text-gray-600">
                    Menos salidas
                  </span>
                  <div className="flex space-x-1">
                    {[
                      "#fef2f2",
                      "#fca5a5",
                      "#ef4444",
                      "#dc2626",
                      "#991b1b",
                      "#7f1d1d",
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-4 border border-gray-300 rounded-sm shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-gray-600">Más salidas</span>
                </div>
              </div>
            </div>

            {/* Top 10 Geocercas */}
            <div className="xl:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20 h-[700px]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      Top 10 Estados
                    </h3>
                    <p className="text-xs text-gray-600">Salidas de geocerca</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topGeofenceStates.length > 0 ? (
                    topGeofenceStates.map((state, index) => (
                      <div
                        key={state.state}
                        className="flex items-center group hover:bg-red-50 rounded-lg p-2 transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {stateCodeToName[state.state] || state.state}
                            </span>
                            <span className="text-xs font-bold text-red-600">
                              {state.geofenceExits}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                              style={{
                                width: `${
                                  topGeofenceStates[0]?.geofenceExits > 0
                                    ? (state.geofenceExits / topGeofenceStates[0].geofenceExits) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay datos disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Horas */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Mapa de Horas */}
            <div className="xl:col-span-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-4"></div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Horas Trabajadas por Estado
                      </h3>
                      <p className="text-sm text-gray-600">
                        Distribución de carga laboral
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center h-[calc(100%-120px)]">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 1400,
                      center: [-102, 24],
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: "1000px",
                      margin: "0 auto",
                    }}
                  >
                    <Geographies geography="/lib/mx.json">
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const stateCode = geo.properties.id;
                          const stateInfo = stateData.find(
                            (s) => s.state === stateCode
                          );

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={
                                stateInfo
                                  ? getHoursColor(stateInfo.hoursWorked)
                                  : "#f8fafc"
                              }
                              stroke="#000000"
                              strokeWidth={0.5}
                              onMouseMove={(evt) => {
                                const containerRect =
                                  evt.currentTarget.ownerSVGElement.getBoundingClientRect();
                                const offsetX =
                                  evt.clientX - containerRect.left;
                                const offsetY = evt.clientY - containerRect.top;
                                const stateName =
                                  stateCodeToName[stateCode] ||
                                  geo.properties.name;
                                
                                const tooltipPosition = calculateTooltipPosition(
                                  offsetX, 
                                  offsetY, 
                                  containerRect
                                );

                                setHorasTooltip({
                                  content: stateInfo
                                    ? `${stateName}\nHoras: ${stateInfo.hoursWorked}\nHospitales: ${stateInfo.hospitals}`
                                    : stateName || "Estado",
                                  position: tooltipPosition,
                                  show: true,
                                });
                              }}
                              onMouseLeave={() => {
                                setHorasTooltip({
                                  ...horasTooltip,
                                  show: false,
                                });
                              }}
                              style={{
                                default: {
                                  outline: "none",
                                  cursor: "pointer",
                                  fill: stateInfo
                                    ? getHoursColor(stateInfo.hoursWorked)
                                    : "#f8fafc",
                                  transition: "all 0.2s ease",
                                },
                                hover: {
                                  outline: "none",
                                  fill: stateInfo ? "#1d4ed8" : "#e2e8f0",
                                  cursor: "pointer",
                                  filter: "brightness(1.1)",
                                },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                  {horasTooltip.show && (
                    <div
                      style={{
                        position: "absolute",
                        left: horasTooltip.position.x,
                        top: horasTooltip.position.y,
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        color: "white",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        zIndex: 1000,
                        whiteSpace: "pre-line",
                        pointerEvents: "none",
                        minWidth: "200px",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {horasTooltip.content}
                    </div>
                  )}
                </div>
                {/* Leyenda */}
                <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
                  <span className="font-medium text-gray-600">Menos horas</span>
                  <div className="flex space-x-1">
                    {[
                      "#eff6ff",
                      "#bfdbfe",
                      "#60a5fa",
                      "#3b82f6",
                      "#1d4ed8",
                      "#1e40af",
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-4 border border-gray-300 rounded-sm shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-gray-600">Más horas</span>
                </div>
              </div>
            </div>

            {/* Top 10 Horas */}
            <div className="xl:col-span-1">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20 h-[700px]">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      Top 10 Estados
                    </h3>
                    <p className="text-xs text-gray-600">Horas trabajadas</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {topHoursStates.length > 0 ? (
                    topHoursStates.map((state, index) => (
                      <div
                        key={state.state}
                        className="flex items-center group hover:bg-blue-50 rounded-lg p-2 transition-colors"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {stateCodeToName[state.state] || state.state}
                            </span>
                            <span className="text-xs font-bold text-blue-600">
                              {state.hoursWorked.toLocaleString()}h
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                              style={{
                                width: `${
                                  topHoursStates[0]?.hoursWorked > 0
                                    ? (state.hoursWorked / topHoursStates[0].hoursWorked) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No hay datos disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
