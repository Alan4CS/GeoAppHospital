"use client";

import { useState, useEffect, useRef } from "react";
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

  // Datos simulados usando los códigos de estado
  useEffect(() => {
    const mockData = [
      {
        state: "MXAGU",
        geofenceExits: 45,
        hoursWorked: 1200,
        hospitals: 4,
        employees: 80,
      },
      {
        state: "MXBCN",
        geofenceExits: 180,
        hoursWorked: 3200,
        hospitals: 15,
        employees: 320,
      },
      {
        state: "MXBCS",
        geofenceExits: 35,
        hoursWorked: 800,
        hospitals: 3,
        employees: 60,
      },
      {
        state: "MXCAM",
        geofenceExits: 60,
        hoursWorked: 1500,
        hospitals: 6,
        employees: 120,
      },
      {
        state: "MXCHP",
        geofenceExits: 95,
        hoursWorked: 2100,
        hospitals: 12,
        employees: 210,
      },
      {
        state: "MXCHH",
        geofenceExits: 140,
        hoursWorked: 2800,
        hospitals: 14,
        employees: 280,
      },
      {
        state: "MXCMX",
        geofenceExits: 320,
        hoursWorked: 5500,
        hospitals: 35,
        employees: 550,
      },
      {
        state: "MXCOA",
        geofenceExits: 110,
        hoursWorked: 2400,
        hospitals: 11,
        employees: 240,
      },
      {
        state: "MXCOL",
        geofenceExits: 25,
        hoursWorked: 600,
        hospitals: 2,
        employees: 40,
      },
      {
        state: "MXDUR",
        geofenceExits: 70,
        hoursWorked: 1600,
        hospitals: 7,
        employees: 140,
      },
      {
        state: "MXGUA",
        geofenceExits: 160,
        hoursWorked: 3000,
        hospitals: 16,
        employees: 300,
      },
      {
        state: "MXGRO",
        geofenceExits: 85,
        hoursWorked: 1900,
        hospitals: 9,
        employees: 180,
      },
      {
        state: "MXHID",
        geofenceExits: 75,
        hoursWorked: 1700,
        hospitals: 8,
        employees: 160,
      },
      {
        state: "MXJAL",
        geofenceExits: 220,
        hoursWorked: 4200,
        hospitals: 25,
        employees: 420,
      },
      {
        state: "MXMEX",
        geofenceExits: 280,
        hoursWorked: 4800,
        hospitals: 30,
        employees: 480,
      },
      {
        state: "MXMIC",
        geofenceExits: 120,
        hoursWorked: 2600,
        hospitals: 13,
        employees: 260,
      },
      {
        state: "MXMOR",
        geofenceExits: 55,
        hoursWorked: 1300,
        hospitals: 5,
        employees: 100,
      },
      {
        state: "MXNAY",
        geofenceExits: 40,
        hoursWorked: 900,
        hospitals: 4,
        employees: 70,
      },
      {
        state: "MXNLE",
        geofenceExits: 200,
        hoursWorked: 3800,
        hospitals: 22,
        employees: 380,
      },
      {
        state: "MXOAX",
        geofenceExits: 90,
        hoursWorked: 2000,
        hospitals: 10,
        employees: 200,
      },
      {
        state: "MXPUE",
        geofenceExits: 130,
        hoursWorked: 2700,
        hospitals: 14,
        employees: 270,
      },
      {
        state: "MXQUE",
        geofenceExits: 80,
        hoursWorked: 1800,
        hospitals: 8,
        employees: 150,
      },
      {
        state: "MXROO",
        geofenceExits: 150,
        hoursWorked: 2400,
        hospitals: 12,
        employees: 240,
      },
      {
        state: "MXSLP",
        geofenceExits: 95,
        hoursWorked: 2200,
        hospitals: 10,
        employees: 190,
      },
      {
        state: "MXSIN",
        geofenceExits: 105,
        hoursWorked: 2300,
        hospitals: 11,
        employees: 220,
      },
      {
        state: "MXSON",
        geofenceExits: 125,
        hoursWorked: 2500,
        hospitals: 12,
        employees: 250,
      },
      {
        state: "MXTAB",
        geofenceExits: 65,
        hoursWorked: 1400,
        hospitals: 6,
        employees: 130,
      },
      {
        state: "MXTAM",
        geofenceExits: 115,
        hoursWorked: 2400,
        hospitals: 12,
        employees: 230,
      },
      {
        state: "MXTLA",
        geofenceExits: 30,
        hoursWorked: 700,
        hospitals: 3,
        employees: 50,
      },
      {
        state: "MXVER",
        geofenceExits: 170,
        hoursWorked: 3400,
        hospitals: 18,
        employees: 340,
      },
      {
        state: "MXYUC",
        geofenceExits: 80,
        hoursWorked: 1800,
        hospitals: 8,
        employees: 160,
      },
      {
        state: "MXZAC",
        geofenceExits: 50,
        hoursWorked: 1100,
        hospitals: 5,
        employees: 90,
      },
    ];
    setStateData(mockData);
  }, [dateRange]);

  // Escalas de color para los mapas de calor
  const geofenceColorScale = scaleQuantile()
    .domain(stateData.map((d) => d.geofenceExits))
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
    .domain(stateData.map((d) => d.hoursWorked))
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

  // Estadísticas totales
  const totalStats = {
    hospitals: stateData.reduce((sum, state) => sum + state.hospitals, 0),
    employees: stateData.reduce((sum, state) => sum + state.employees, 0),
    totalExits: stateData.reduce((sum, state) => sum + state.geofenceExits, 0),
    totalHours: stateData.reduce((sum, state) => sum + state.hoursWorked, 0),
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

        {/* Compact KPI Cards */}
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
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Column - Maps */}
          <div className="xl:col-span-4 space-y-6">
            {/* Mapa de Geocercas */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
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
                className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden"
                style={{ height: "500px" }}
              >
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 1200,
                    center: [-102, 23],
                  }}
                  style={{ width: "100%", height: "100%" }}
                  width={800}
                  height={500}
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
                                ? geofenceColorScale(stateInfo.geofenceExits)
                                : "#f8fafc"
                            }
                            stroke="#000000"
                            strokeWidth={0.5}
                            onMouseMove={(evt) => {
                              const containerRect =
                                mapContainerRef.current?.getBoundingClientRect();
                              const offsetX = evt.clientX - containerRect.left;
                              const offsetY = evt.clientY - containerRect.top;
                              const stateName =
                                stateCodeToName[stateCode] ||
                                geo.properties.name;
                              setGeocercaTooltip({
                                content: stateInfo
                                  ? `${stateName}\nSalidas: ${stateInfo.geofenceExits}\nHospitales: ${stateInfo.hospitals}`
                                  : stateName || "Estado",
                                position: { x: offsetX + 12, y: offsetY + 12 },
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
                                  ? geofenceColorScale(stateInfo.geofenceExits)
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
                      fontSize: "12px",
                      zIndex: 1000,
                      whiteSpace: "pre-line",
                      pointerEvents: "none",
                      transform: "translateY(-100%)",
                    }}
                  >
                    {geocercaTooltip.content}
                  </div>
                )}
              </div>
              {/* Leyenda */}
              <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
                <span className="font-medium text-gray-600">Menos salidas</span>
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

            {/* Mapa de Horas */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
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
              <div
                className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden"
                style={{ height: "500px" }}
              >
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    scale: 1200,
                    center: [-102, 23],
                  }}
                  style={{ width: "100%", height: "100%" }}
                  width={800}
                  height={500}
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
                                ? hoursColorScale(stateInfo.hoursWorked)
                                : "#f8fafc"
                            }
                            stroke="#000000"
                            strokeWidth={0.5}
                            onMouseMove={(evt) => {
                              const containerRect =
                                evt.currentTarget.ownerSVGElement.getBoundingClientRect();
                              const offsetX = evt.clientX - containerRect.left;
                              const offsetY = evt.clientY - containerRect.top;
                              const stateName =
                                stateCodeToName[stateCode] ||
                                geo.properties.name;
                              setHorasTooltip({
                                content: stateInfo
                                  ? `${stateName}\nHoras: ${stateInfo.hoursWorked}\nHospitales: ${stateInfo.hospitals}`
                                  : stateName || "Estado",
                                position: { x: offsetX + 12, y: offsetY + 12 },
                                show: true,
                              });
                            }}
                            onMouseLeave={() => {
                              setHorasTooltip({ ...horasTooltip, show: false });
                            }}
                            style={{
                              default: {
                                outline: "none",
                                cursor: "pointer",
                                fill: stateInfo
                                  ? hoursColorScale(stateInfo.hoursWorked)
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
                      fontSize: "12px",
                      zIndex: 1000,
                      whiteSpace: "pre-line",
                      pointerEvents: "none",
                      transform: "translateY(-100%)",
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

          {/* Right Column - Top 10 Charts */}
          <div className="xl:col-span-1 space-y-6">
            {/* Top 10 Geocercas */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20">
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
                {topGeofenceStates.map((state, index) => (
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
                              (state.geofenceExits /
                                topGeofenceStates[0].geofenceExits) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 10 Horas */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-white/20">
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
                {topHoursStates.map((state, index) => (
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
                              (state.hoursWorked /
                                topHoursStates[0].hoursWorked) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
