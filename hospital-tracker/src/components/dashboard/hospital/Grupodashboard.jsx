"use client"

import React, { useState } from "react"
import { Calendar, MapPin, Building2, Check, Users, TrendingUp, Clock } from "lucide-react"
import { format } from "date-fns"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
} from "recharts"

export default function GrupoDashboard({
  datePresets,
  selectedPreset,
  handlePresetChange,
  tempDateRange,
  handleDateChange,
  filters,
  estados,
  municipios,
  hospitales,
  handleEstadoChange,
  handleMunicipioChange,
  handleHospitalChange,
  limpiarFiltros,
  applyChanges,
  isValidRange,
  daysDifference,
  cardData,
  groupDistributionData,
  hoursData,
}) {
  // --- Calendar and PDF state/logic ---
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [calendarData, setCalendarData] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [hourlyData, setHourlyData] = useState([])

  // Función para limpiar filtros localmente y notificar al padre
  const handleLimpiarFiltros = () => {
    // Llama a la función limpiarFiltros del padre (si existe)
    if (typeof limpiarFiltros === 'function') limpiarFiltros();
    // Además, resetea selects controlados si los handlers existen
    if (typeof handleGrupoChange === 'function') handleGrupoChange("");
    if (typeof handleEmpleadoChange === 'function') handleEmpleadoChange("");
    if (typeof handleEstadoChange === 'function') handleEstadoChange({ target: { value: "" } });
    if (typeof handleMunicipioChange === 'function') handleMunicipioChange({ target: { value: "" } });
    if (typeof handleHospitalChange === 'function') handleHospitalChange({ target: { value: "" } });
    if (typeof handlePresetChange === 'function') handlePresetChange("");
    if (typeof handleDateChange === 'function') {
      handleDateChange('startDate', "");
      handleDateChange('endDate', "");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" />Panel de Grupos</h2>
      {/* Filtros de Análisis */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 mb-8">
        <div className="flex flex-col gap-6">
          {/* Período y fechas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4 text-emerald-500" /> Período</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" /> Fecha inicio</label>
              <input
                type="date"
                value={tempDateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" /> Fecha fin</label>
              <input
                type="date"
                value={tempDateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {/* Estado-Municipio-Hospital */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4 text-indigo-500" /> Estado</label>
              <select
                value={filters.id_estado}
                onChange={handleEstadoChange}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccionar Estado</option>
                {estados.map((e) => (
                  <option key={e.id_estado} value={e.id_estado}>
                    {e.nombre_estado}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4 text-purple-500" /> Municipio</label>
              <select
                value={filters.id_municipio}
                onChange={handleMunicipioChange}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!filters.id_estado}
              >
                <option value="">Seleccionar Municipio</option>
                {municipios.map((m) => (
                  <option key={m.id_municipio} value={m.id_municipio}>
                    {m.nombre_municipio}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Building2 className="w-4 h-4 text-blue-500" /> Hospital</label>
              <select
                value={filters.id_hospital}
                onChange={handleHospitalChange}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!filters.id_municipio}
              >
                <option value="">Seleccionar Hospital</option>
                {hospitales.map((h) => (
                  <option key={h.id_hospital} value={h.id_hospital}>
                    {h.nombre_hospital}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Botones para filtros */}
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={handleLimpiarFiltros} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">Limpiar filtros</button>
            <button
              onClick={applyChanges}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center text-sm"
              disabled={!isValidRange}
            >
              <Check className="h-4 w-4 mr-1" />Aplicar filtros
            </button>
          </div>
        </div>
      </div>
      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-blue-200" />
          </div>
          <span className="text-sm text-blue-100">Total Grupos</span>
          <span className="text-2xl font-bold">{cardData.totalGroups}</span>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-emerald-200" />
          </div>
          <span className="text-sm text-emerald-100">Total Empleados</span>
          <span className="text-2xl font-bold">{cardData.totalEmployees}</span>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-red-200" />
          </div>
          <span className="text-sm text-red-100">Salidas Totales</span>
          <span className="text-2xl font-bold">{cardData.totalExits}</span>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white flex flex-col shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-purple-200" />
          </div>
          <span className="text-sm text-purple-100">Horas Totales</span>
          <span className="text-2xl font-bold">{cardData.totalHours}</span>
        </div>
      </div>

      {/* Texto informativo para empleados */}
      <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <Users className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-blue-800">Mostrando empleados agrupados por grupo y hospital en el periodo seleccionado.</span>
      </div>

      {/* Gráficos de distribución y tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Distribución por grupo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grupo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Tendencia a lo largo del tiempo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="valor" stroke="#2196f3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
