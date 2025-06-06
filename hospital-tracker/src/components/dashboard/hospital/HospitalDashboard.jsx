"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Check,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  LabelList,
  Legend,
} from "recharts";
import { format, subDays, subMonths, subYears, isAfter } from "date-fns";

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
`;

const HospitalDashboard = () => {
  // Estados para los filtros avanzados de fecha
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Estados para el filtro de fechas mejorado
  const [selectedPreset, setSelectedPreset] = useState("30d");
  const [hasChanges, setHasChanges] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

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

  // Estados para los filtros de ubicación alineados con la estructura
  const [filters, setFilters] = useState({
    id_estado: "",
    id_municipio: "",
    id_hospital: "",
    nombre_estado: "",
    nombre_municipio: "",
    nombre_hospital: "",
  });

  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [hospitales, setHospitales] = useState([]);

  // Cargar estados
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch(
          "https://geoapphospital.onrender.com/api/superadmin/estados"
        );
        const data = await res.json();
        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, []);

  // Cargar municipios al seleccionar estado
  useEffect(() => {
    if (!filters.id_estado) {
      setMunicipios([]);
      return;
    }

    const fetchMunicipios = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${filters.id_estado}`
        );
        const data = await res.json();
        setMunicipios(data);
      } catch (error) {
        console.error("Error al obtener municipios:", error);
        setMunicipios([]);
      }
    };
    fetchMunicipios();
  }, [filters.id_estado]);

  // Cargar hospitales al seleccionar municipio
  useEffect(() => {
    if (!filters.id_estado || !filters.id_municipio) {
      setHospitales([]);
      return;
    }

    const fetchHospitales = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${filters.id_estado}&id_municipio=${filters.id_municipio}`
        );
        const data = await res.json();
        setHospitales(data);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
        setHospitales([]);
      }
    };
    fetchHospitales();
  }, [filters.id_estado, filters.id_municipio]);

  // Manejadores de cambios para los filtros
  const handleEstadoChange = (e) => {
    const estado = estados.find(
      (estado) => estado.id_estado === Number(e.target.value)
    );
    setFilters({
      ...filters,
      id_estado: estado?.id_estado || "",
      nombre_estado: estado?.nombre_estado || "",
      id_municipio: "",
      nombre_municipio: "",
      id_hospital: "",
      nombre_hospital: "",
    });
  };

  const handleMunicipioChange = (e) => {
    const municipio = municipios.find(
      (mun) => mun.id_municipio === Number(e.target.value)
    );
    setFilters({
      ...filters,
      id_municipio: municipio?.id_municipio || "",
      nombre_municipio: municipio?.nombre_municipio || "",
      id_hospital: "",
      nombre_hospital: "",
    });
  };

  const handleHospitalChange = (e) => {
    const hospital = hospitales.find(
      (hosp) => hosp.id_hospital === Number(e.target.value)
    );
    setFilters({
      ...filters,
      id_hospital: hospital?.id_hospital || "",
      nombre_hospital: hospital?.nombre_hospital || "",
    });
  };

  // Datos dummy para las tarjetas
  const cardData = {
    totalGroups: 12,
    totalEmployees: 248,
    totalExits: 567,
    totalHours: 1920,
  };

  // Datos dummy para la gráfica de barras
  const groupDistributionData = [
    { group: "Limpieza", employees: 45, exits: 98 },
    { group: "Mantenimiento", employees: 38, exits: 76 },
    { group: "Vigilancia", employees: 52, exits: 120 },
    { group: "Camilleros", employees: 31, exits: 89 },
    { group: "Enfermería", employees: 42, exits: 95 },
  ];

  // Datos dummy para la gráfica de líneas
  const hoursData = [
    { group: "Limpieza", hours: 384 },
    { group: "Mantenimiento", hours: 320 },
    { group: "Vigilancia", hours: 456 },
    { group: "Camilleros", hours: 288 },
    { group: "Enfermería", hours: 472 },
  ];

  // Datos dummy para empleados
  const employeesData = [
    {
      id: 1,
      name: "Juan Pérez González",
      schedule: "07:00 - 15:00",
      plannedHours: 160,
      workedHours: 155,
      outsideHours: 8,
      justifiedHours: 5,
    },
    {
      id: 2,
      name: "María Rodríguez López",
      schedule: "08:00 - 16:00",
      plannedHours: 160,
      workedHours: 158,
      outsideHours: 4,
      justifiedHours: 2,
    },
    // ...más empleados
  ];

  // Datos para la gráfica de horas por empleado
  const employeeHoursData = employeesData.map((emp) => ({
    name: emp.name.split(" ")[0],
    horasTrabajadas: emp.workedHours,
    horasAfuera: emp.outsideHours,
  }));

  return (
    <>
      <style jsx global>
        {customScrollbarStyles}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-100 to-blue-50">
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-10">
          {/* Filtros Integrados */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 mb-8">
            <div className="flex flex-col gap-6">
              {/* Título principal */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mr-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Filtros de Análisis
                </h3>
              </div>

              {/* Primera fila: Período de análisis */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Selector de presets */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

                {/* Fecha inicio */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
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
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Fecha fin */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <input
                      type="date"
                      value={tempDateRange.endDate}
                      onChange={(e) =>
                        handleDateChange("endDate", e.target.value)
                      }
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Botones de fecha */}
                <div className="lg:col-span-3 flex gap-2">
                  <button
                    onClick={resetToOriginal}
                    disabled={!hasChanges}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={applyChanges}
                    disabled={!isValidRange || !hasChanges}
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center text-sm"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Segunda fila: Ubicación */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Estado */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                      <MapPin className="h-4 w-4 text-indigo-500" />
                    </div>
                    <select
                      value={filters.id_estado}
                      onChange={handleEstadoChange}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar Estado</option>
                      {estados.map((estado) => (
                        <option key={estado.id_estado} value={estado.id_estado}>
                          {estado.nombre_estado}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Municipio */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipio
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <MapPin className="h-4 w-4 text-purple-500" />
                    </div>
                    <select
                      value={filters.id_municipio}
                      onChange={handleMunicipioChange}
                      disabled={!filters.id_estado}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Seleccionar Municipio</option>
                      {municipios.map((municipio) => (
                        <option
                          key={municipio.id_municipio}
                          value={municipio.id_municipio}
                        >
                          {municipio.nombre_municipio}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hospital */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <select
                      value={filters.id_hospital}
                      onChange={handleHospitalChange}
                      disabled={!filters.id_municipio}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar Hospital</option>
                      {hospitales.map((hospital) => (
                        <option
                          key={hospital.id_hospital}
                          value={hospital.id_hospital}
                        >
                          {hospital.nombre_hospital}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botón aplicar ubicación */}
                <div className="lg:col-span-3">
                  <button className="w-full px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 flex items-center justify-center">
                    <Check className="h-4 w-4 mr-1" />
                    Aplicar Filtros
                  </button>
                </div>
              </div>

              {/* Mensajes informativos */}
              <div className="space-y-2">
                {/* Mensaje de rango seleccionado */}
                {isValidRange && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center">
                    <Check className="h-4 w-4 text-emerald-500 mr-2" />
                    <span className="text-sm text-emerald-800">
                      Rango seleccionado: {daysDifference + 1} días (
                      {format(new Date(tempDateRange.startDate), "dd/MM/yyyy")}{" "}
                      - {format(new Date(tempDateRange.endDate), "dd/MM/yyyy")})
                    </span>
                  </div>
                )}

                {/* Mensaje de error */}
                {tempDateRange.startDate &&
                  tempDateRange.endDate &&
                  !isValidRange && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center">
                      <Calendar className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-red-800">
                        La fecha de inicio debe ser anterior a la fecha final
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Tarjetas con la información */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 opacity-90" />
                <TrendingUp className="h-4 w-4 text-blue-200" />
              </div>
              <span className="text-sm text-blue-100">Total Grupos</span>
              <span className="text-2xl font-bold">{cardData.totalGroups}</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 opacity-90" />
                <TrendingUp className="h-4 w-4 text-emerald-200" />
              </div>
              <span className="text-sm text-emerald-100">Total Empleados</span>
              <span className="text-2xl font-bold">
                {cardData.totalEmployees}
              </span>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-8 w-8 opacity-90" />
                <TrendingUp className="h-4 w-4 text-red-200" />
              </div>
              <span className="text-sm text-red-100">Salidas Totales</span>
              <span className="text-2xl font-bold">{cardData.totalExits}</span>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 opacity-90" />
                <TrendingUp className="h-4 w-4 text-purple-200" />
              </div>
              <span className="text-sm text-purple-100">Horas Totales</span>
              <span className="text-2xl font-bold">{cardData.totalHours}</span>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfica de Barras */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Métricas por Grupo
                  </h3>
                  <p className="text-sm text-gray-500">
                    Comparación de empleados y salidas
                  </p>
                </div>
              </div>
              <div className="h-[500px]">
                <ResponsiveContainer>
                  <BarChart
                    data={groupDistributionData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient
                        id="employeeGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                      <linearGradient
                        id="exitGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{
                        fill: "#4B5563",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      dataKey="group"
                      type="category"
                      width={120}
                      tick={{
                        fill: "#1F2937",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      height={36}
                      iconType="square"
                      iconSize={10}
                      wrapperStyle={{
                        paddingTop: "20px",
                      }}
                    />
                    <Bar
                      dataKey="employees"
                      name="Empleados"
                      fill="#4F46E5"
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList
                        dataKey="employees"
                        position="right"
                        fill="#4f46e5"
                        fontSize={12}
                        fontWeight={600}
                      />
                    </Bar>
                    <Bar
                      dataKey="exits"
                      name="Salidas"
                      fill="#EF4444"
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList
                        dataKey="exits"
                        position="right"
                        fill="#dc2626"
                        fontSize={12}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica de Líneas */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Tendencia de Horas por Grupo
                  </h3>
                  <p className="text-sm text-gray-500">
                    Distribución de horas trabajadas
                  </p>
                </div>
              </div>
              <div className="h-[500px]">
                <ResponsiveContainer>
                  <LineChart
                    data={hoursData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <defs>
                      <linearGradient
                        id="hoursGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="lineGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="group"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{
                        fill: "#4B5563",
                        fontSize: 12,
                      }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{
                        fill: "#4B5563",
                        fontSize: 12,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                      formatter={(value) => [
                        `${value} horas`,
                        "Horas Trabajadas",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="none"
                      fillOpacity={1}
                      fill="url(#hoursGradient)"
                    />
                    <Line
                      type="linear"
                      dataKey="hours"
                      name="Horas trabajadas"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{
                        fill: "white",
                        stroke: "#8b5cf6",
                        strokeWidth: 2,
                        r: 4,
                      }}
                      activeDot={{
                        fill: "#8b5cf6",
                        stroke: "white",
                        strokeWidth: 2,
                        r: 6,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      height={36}
                      iconType="square"
                      iconSize={10}
                      wrapperStyle={{
                        paddingTop: "20px",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Nueva sección de análisis detallado */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 mb-8 mt-12">
            <div className="flex flex-col gap-6">
              {/* Título principal */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Análisis Detallado
                </h3>
              </div>

              {/* Primera fila: Período y filtros */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Selector de períodos para análisis detallado */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <select className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selección rápida</option>
                    <option value="7d">Últimos 7 días</option>
                    <option value="15d">Últimos 15 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="60d">Últimos 60 días</option>
                    <option value="90d">Últimos 90 días</option>
                    <option value="3m">Último trimestre</option>
                    <option value="6m">Últimos 6 meses</option>
                    <option value="1y">Último año</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {/* Grupo */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grupo
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <select className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Todos los grupos</option>
                      <option>Limpieza</option>
                      <option>Mantenimiento</option>
                      <option>Vigilancia</option>
                      <option>Camilleros</option>
                      <option>Enfermería</option>
                    </select>
                  </div>
                </div>

                {/* Empleado */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empleado
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                    <select className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>Todos los empleados</option>
                      {employeesData.map((emp) => (
                        <option key={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fecha inicio */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                    </div>
                    <input
                      type="date"
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Fecha fin */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin
                  </label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <input
                      type="date"
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 justify-end">
                <button className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm">
                  Limpiar Filtros
                </button>
                <button className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center text-sm">
                  <Check className="h-4 w-4 mr-1" />
                  Aplicar Filtros
                </button>
              </div>

              {/* Tarjetas de información - Ahora debajo de los filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <MapPin className="h-6 w-6 opacity-90" />
                    <TrendingUp className="h-4 w-4 text-red-200" />
                  </div>
                  <span className="text-sm text-red-100">Salidas Totales</span>
                  <span className="text-xl font-bold">24 hrs</span>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-6 w-6 opacity-90" />
                    <TrendingUp className="h-4 w-4 text-purple-200" />
                  </div>
                  <span className="text-sm text-purple-100">Horas Totales</span>
                  <span className="text-xl font-bold">1,920 hrs</span>
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center">
                  <Check className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-800">
                    Mostrando datos para todos los empleados en el período
                    seleccionado
                  </span>
                </div>
              </div>

              {/* Contenedor para tabla y gráfica */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                {/* Tabla de empleados */}
                <div className="bg-white rounded-lg shadow-sm w-full">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar w-full">
                    <table className="w-full table-fixed">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horario
                          </th>
                          <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hrs Plan
                          </th>
                          <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hrs Efec
                          </th>
                          <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hrs Fuera
                          </th>
                          <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hrs Just
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeesData.map((employee) => (
                          <tr
                            key={employee.id}
                            className="hover:bg-gray-50/50 transition-colors duration-200"
                          >
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">
                              {employee.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {employee.schedule}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {employee.plannedHours}
                            </td>
                            <td className="px-4 py-4 text-sm text-emerald-600 font-medium">
                              {employee.workedHours}
                            </td>
                            <td className="px-4 py-4 text-sm text-red-600 font-medium">
                              {employee.outsideHours}
                            </td>
                            <td className="px-4 py-4 text-sm text-blue-600 font-medium">
                              {employee.justifiedHours}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gráfica de horas por empleado */}
                <div className="h-[500px]">
                  <ResponsiveContainer>
                    <BarChart data={employeeHoursData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="horasTrabajadas"
                        name="Horas Trabajadas"
                        fill="#10B981"
                      />
                      <Bar
                        dataKey="horasAfuera"
                        name="Horas Fuera"
                        fill="#EF4444"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HospitalDashboard;
