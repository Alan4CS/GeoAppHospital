"use client"
import React, { useEffect, useState } from "react"
import { Calendar, MapPin, Building2, Check, Users, TrendingUp, Clock } from "lucide-react"
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { calcularEstadisticasEmpleado, calcularEstadisticasEmpleadoPorDias } from "./employeeStatsHelper";

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
  isValidRange
}) {
  // Estado local para KPIs y gráficos
  const [cardData, setCardData] = useState({
    totalGroups: 0,
    totalEmployees: 0,
    totalExits: 0,
    totalHours: 0
  });
  const [groupDistributionData, setGroupDistributionData] = useState([]);
  const [hoursData, setHoursData] = useState([]);
  const [stackedGroupData, setStackedGroupData] = useState([]);
  const [empleadosHospital, setEmpleadosHospital] = useState([]);
  const [empleadosActivos, setEmpleadosActivos] = useState([]);
  const [empleadosInactivos, setEmpleadosInactivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataEmpleados, setDataEmpleados] = useState(null);
  const [selectedGroupList, setSelectedGroupList] = useState("");
  // Nuevo estado para gráfica de horas por grupo
  const [groupHoursData, setGroupHoursData] = useState([]);

  // Colores para PieChart - paleta más variada y moderna
  const pieColors = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#84cc16", // Lime
    "#f97316", // Orange
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#14b8a6"  // Teal
  ];

  // Tooltips explicativos para cada gráfico
  const chartTooltips = {
    distribucion: "Muestra la cantidad total de empleados que pertenecen a cada grupo del hospital",
    promedio: "Calcula el promedio de actividad laboral registrada por cada grupo durante el período seleccionado",
    porcentaje: "Indica qué porcentaje de empleados de cada grupo estuvo activo durante el período",
    top: "Ranking de los grupos con mayor número de empleados activos en el período",
    comparacion: "Compara la cantidad de empleados activos vs inactivos por grupo en forma apilada"
  };

  // Función para crear índices de grupos (A, B, C, etc.)
  const createGroupIndex = (grupos) => {
    const indexMap = {};
    grupos.forEach((grupo, index) => {
      indexMap[grupo] = String.fromCharCode(65 + index); // A, B, C, D...
    });
    return indexMap;
  };

  // Utilidad para mostrar horas en formato "X horas Y min"
  function formatHorasMinutos(decimalHours) {
    const horas = Math.floor(decimalHours);
    const minutos = Math.round((decimalHours - horas) * 60);
    return `${horas} horas${minutos > 0 ? ` ${minutos} min` : ''}`;
  }

  // Fetch grupos del hospital seleccionado
  useEffect(() => {
    async function fetchGrupos() {
      setLoading(true);
      setError(null);
      if (filters.id_hospital && tempDateRange.startDate && tempDateRange.endDate) {
        const body = {
          id_hospital: filters.id_hospital,
          fechaInicio: `${tempDateRange.startDate} 00:00:00`,
          fechaFin: `${tempDateRange.endDate} 23:59:59`,
        };
        try {
          // 1. Fetch empleados con registros (activos)
          const res = await fetch("https://geoapphospital.onrender.com/api/dashboards/grupo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          setDataEmpleados(data.empleados); // Guardar para listas
          // 2. Fetch todos los empleados del hospital
          const allRes = await fetch("https://geoapphospital.onrender.com/api/employees/get-empleados");
          const allEmpleados = await allRes.json();
          // Filtrar solo los del hospital seleccionado
          const empleadosHospital = allEmpleados.filter(e => e.id_hospital == filters.id_hospital);
          setEmpleadosHospital(empleadosHospital);
          // IDs de empleados activos en el periodo
          const idsActivos = new Set(data.empleados.map(e => e.empleado.id_user));
          setEmpleadosActivos(empleadosHospital.filter(e => idsActivos.has(e.id_user)));
          setEmpleadosInactivos(empleadosHospital.filter(e => !idsActivos.has(e.id_user)));
          // Agrupar todos los empleados por grupo
          const empleadosPorGrupo = {};
          empleadosHospital.forEach(e => {
            if (!empleadosPorGrupo[e.nombre_grupo]) empleadosPorGrupo[e.nombre_grupo] = [];
            empleadosPorGrupo[e.nombre_grupo].push(e);
          });
          // Agrupar empleados activos por grupo
          const activosPorGrupo = {};
          data.empleados.forEach(({ empleado, registros }) => {
            if (!activosPorGrupo[empleado.grupo]) activosPorGrupo[empleado.grupo] = [];
            activosPorGrupo[empleado.grupo].push({ ...empleado, registros });
          });
          // Calcular apilado activos/inactivos por grupo
          const grupos = Object.keys(empleadosPorGrupo);
          const stacked = grupos.map(grupo => {
            const total = empleadosPorGrupo[grupo].length;
            const activos = activosPorGrupo[grupo] ? activosPorGrupo[grupo].length : 0;
            const inactivos = total - activos;
            return {
              grupo,
              Activos: activos,
              Inactivos: inactivos,
              Total: total
            };
          });
          setStackedGroupData(stacked);
          // KPIs y horas geocerca
          const gruposSet = new Set();
          let totalEmpleados = 0;
          let totalExits = 0;
          let totalHours = 0;
          let totalDentro = 0;
          let totalFuera = 0;
          const groupDist = {};
          const hoursTrend = {};
          const groupHours = {};
          const groupHoursFuera = {};
          data.empleados.forEach(({ empleado, registros }) => {
            gruposSet.add(empleado.grupo);
            totalEmpleados++;
            if (!groupDist[empleado.grupo]) groupDist[empleado.grupo] = 0;
            groupDist[empleado.grupo]++;
            // Usar helper por días para horas dentro/fuera
            const stats = calcularEstadisticasEmpleadoPorDias(registros);
            totalDentro += stats.workedHours;
            totalFuera += stats.outsideHours;
            // totalExits se puede mantener igual (por eventos)
            if (!groupHours[empleado.grupo]) groupHours[empleado.grupo] = 0;
            if (!groupHoursFuera[empleado.grupo]) groupHoursFuera[empleado.grupo] = 0;
            groupHours[empleado.grupo] += stats.workedHours;
            groupHoursFuera[empleado.grupo] += stats.outsideHours;
            registros.forEach(reg => {
              if (reg.horas) totalHours += Number(reg.horas);
              const hora = reg.hora ? reg.hora.slice(0, 5) : null;
              if (hora) {
                if (!hoursTrend[hora]) hoursTrend[hora] = 0;
                hoursTrend[hora] += Number(reg.horas) || 0;
              }
            });
          });
          setCardData({
            totalGroups: gruposSet.size,
            totalEmployees: totalEmpleados,
            totalExits,
            totalHours: Math.round(totalHours * 100) / 100,
            totalDentro: Math.round(totalDentro * 100) / 100,
            totalFuera: Math.round(totalFuera * 100) / 100
          });
          setGroupDistributionData(
            Object.entries(empleadosPorGrupo).map(([grupo, lista]) => ({ grupo, cantidad: lista.length }))
          );
          setHoursData(
            Object.entries(hoursTrend).map(([hora, valor]) => ({ hora, valor: Math.round(valor * 100) / 100 }))
          );
          // Guardar horas por grupo para gráfica
          setGroupHoursData(
            Object.entries(groupHours).map(([grupo, horas]) => ({
              grupo,
              horas,
              horasFuera: groupHoursFuera[grupo] || 0
            }))
          );
        } catch (err) {
          setError("Error al obtener datos de grupos");
        }
      } else {
        setCardData({ totalGroups: 0, totalEmployees: 0, totalExits: 0, totalHours: 0, totalDentro: 0, totalFuera: 0 });
        setGroupDistributionData([]);
        setHoursData([]);
        setStackedGroupData([]);
        setEmpleadosHospital([]);
        setEmpleadosActivos([]);
        setEmpleadosInactivos([]);
        setDataEmpleados(null);
        setGroupHoursData([]);
      }
      setLoading(false);
    }
    fetchGrupos();
  }, [filters.id_hospital, tempDateRange.startDate, tempDateRange.endDate]);

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

  // Filtrar listas de empleados activos e inactivos según el grupo seleccionado
  const filteredActivos = selectedGroupList
    ? empleadosActivos.filter(e => e.nombre_grupo === selectedGroupList)
    : empleadosActivos;
  const filteredInactivos = selectedGroupList
    ? empleadosInactivos.filter(e => e.nombre_grupo === selectedGroupList)
    : empleadosInactivos;

  return (
    <div className="p-8 bg-white rounded-3xl shadow-2xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" />Panel de Grupos</h2>
      {/* Filtros de Análisis */}
      <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200 mb-8">
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
            <button
              onClick={handleLimpiarFiltros}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
      {/* Tarjetas de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white flex flex-col shadow-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-blue-200" />
          </div>
          <span className="text-sm text-blue-100">Total Grupos</span>
          <span className="text-2xl font-bold">{cardData.totalGroups}</span>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white flex flex-col shadow-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-emerald-200" />
          </div>
          <span className="text-sm text-emerald-100">Total Empleados</span>
          <span className="text-2xl font-bold">{cardData.totalEmployees}</span>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-8 text-white flex flex-col shadow-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-purple-200" />
          </div>
          <span className="text-sm text-purple-100">Horas en geocerca</span>
          <span className="text-2xl font-bold">{formatHorasMinutos(cardData.totalDentro ?? 0)}</span>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-3xl p-8 text-white flex flex-col shadow-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-6 w-6 opacity-90" />
            <TrendingUp className="h-4 w-4 text-red-200" />
          </div>
          <span className="text-sm text-red-100">Horas fuera de geocerca</span>
          <span className="text-2xl font-bold">{formatHorasMinutos(cardData.totalFuera ?? 0)}</span>
        </div>
      </div>

      {/* Texto informativo para empleados */}
      <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <Users className="h-4 w-4 text-blue-500" />
        <span className="text-sm text-blue-800">Mostrando empleados agrupados por grupo y hospital en el periodo seleccionado.</span>
      </div>

      {/* Tabla unificada de empleados */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Lista de Empleados por Estado
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">Activos: {filteredActivos.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-700 font-medium">Inactivos: {filteredInactivos.length}</span>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Total: {filteredActivos.length + filteredInactivos.length}
            </div>
          </div>
        </div>

        {/* Filtros adicionales para la tabla */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
            <select
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const table = document.getElementById('empleados-table');
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                  if (e.target.value === 'todos') {
                    row.style.display = '';
                  } else if (e.target.value === 'activos') {
                    row.style.display = row.classList.contains('empleado-activo') ? '' : 'none';
                  } else if (e.target.value === 'inactivos') {
                    row.style.display = row.classList.contains('empleado-inactivo') ? '' : 'none';
                  }
                });
              }}
            >
              <option value="todos">📊 Todos</option>
              <option value="activos">✅ Solo activos</option>
              <option value="inactivos">⏰ Solo inactivos</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por grupo:</label>
            <select
              value={selectedGroupList}
              onChange={e => setSelectedGroupList(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            >
              <option value="">👥 Todos los grupos</option>
              {groupDistributionData.map(g => (
                <option key={g.grupo} value={g.grupo}>📋 {g.grupo} ({g.cantidad})</option>
              ))}
            </select>
            {selectedGroupList && (
              <button
                onClick={() => setSelectedGroupList("")}
                className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded-full text-red-600 transition-colors ml-1"
                title="Limpiar filtro de grupo"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Buscar:</label>
            <input
              type="text"
              placeholder="Nombre del empleado..."
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                const table = document.getElementById('empleados-table');
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                  const nombre = row.querySelector('.empleado-nombre').textContent.toLowerCase();
                  row.style.display = nombre.includes(searchTerm) ? '' : 'none';
                });
              }}
            />
          </div>
        </div>

        {/* Tabla de empleados */}
        <div className="overflow-x-auto">
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table id="empleados-table" className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                    Nombre Completo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                    Grupo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">
                    ID Usuario
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Empleados activos */}
                {filteredActivos.map(empleado => (
                  <tr 
                    key={`activo-${empleado.id_user}`} 
                    className="empleado-activo hover:bg-green-50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-green-700 font-semibold text-sm bg-green-100 px-2 py-1 rounded-full">
                          ✅ Activo
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="empleado-nombre font-medium text-gray-900">
                        {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        📋 {empleado.nombre_grupo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 font-mono">
                        #{empleado.id_user}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Empleados inactivos */}
                {filteredInactivos.map(empleado => (
                  <tr 
                    key={`inactivo-${empleado.id_user}`} 
                    className="empleado-inactivo hover:bg-red-50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                        <span className="text-red-700 font-semibold text-sm bg-red-100 px-2 py-1 rounded-full">
                          ⏰ Inactivo
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="empleado-nombre font-medium text-gray-900">
                        {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        📋 {empleado.nombre_grupo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 font-mono">
                        #{empleado.id_user}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mensaje cuando no hay datos */}
        {(filteredActivos.length === 0 && filteredInactivos.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No hay empleados para mostrar</p>
            <p className="text-sm">
              {selectedGroupList 
                ? `No se encontraron empleados en el grupo "${selectedGroupList}"` 
                : "Selecciona un hospital y período para ver los empleados"}
            </p>
          </div>
        )}
      </div>

      {/* Gráfica comparativa activos/inactivos por grupo */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Comparación Activos vs Inactivos por Grupo</h3>
          <div className="relative group">
            <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center cursor-help">
              <span className="text-white text-xs font-bold">?</span>
            </div>
            <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 pointer-events-none">
              {chartTooltips.comparacion}
            </div>
          </div>
        </div>
        {(!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) ? (
          <div className="text-center text-gray-500 py-16 text-lg">
            Selecciona un hospital y un período para ver la información de grupos.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stackedGroupData} margin={{ top: 20, right: 30, left: 0, bottom: 0}}> 
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="grupo" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fefefe', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="Activos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Inactivos" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráficas de análisis de grupos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* 1. Distribución de empleados por grupo (Pie) */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center min-h-[420px]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Distribución de empleados por grupo</h3>
            <div className="relative group">
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center cursor-help">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 pointer-events-none">
                {chartTooltips.distribucion}
              </div>
            </div>
          </div>
          {(!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) ? (
            <div className="text-center text-gray-500 py-16 text-lg w-full">
              Selecciona un hospital y un período para ver la información de grupos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280} minWidth={200} minHeight={200}>
              <PieChart>
                <Pie
                  data={groupDistributionData}
                  dataKey="cantidad"
                  nameKey="grupo"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={40}
                  label={({ grupo, cantidad, percent }) => `${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {groupDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} empleados`, name]}
                  contentStyle={{ 
                    backgroundColor: '#fefefe', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle" 
                  wrapperStyle={{ 
                    maxHeight: 200, 
                    overflowY: 'auto',
                    fontSize: '11px',
                    paddingLeft: '15px'
                  }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Tooltip explicativo */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Distribución total:</span>
              <span>{groupDistributionData.reduce((sum, g) => sum + g.cantidad, 0)} empleados</span>
            </div>
          </div>
        </div>
        {/* 2. Promedio de actividad por grupo (Line) */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 min-h-[420px]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Promedio de actividad por grupo</h3>
            <div className="relative group">
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center cursor-help">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 pointer-events-none">
                {chartTooltips.promedio}
              </div>
            </div>
          </div>
          {(!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) ? (
            <div className="text-center text-gray-500 py-16 text-lg w-full">
              Selecciona un hospital y un período para ver la información de grupos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={stackedGroupData.map((g, index) => {
                  // Buscar el grupo en groupHoursData para obtener horas dentro y fuera
                  const groupHours = groupHoursData.find(gh => gh.grupo === g.grupo);
                  const totalHoras = groupHours ? (groupHours.horas + groupHours.horasFuera) : 0;
                  const promedioHoras = g.Activos ? totalHoras / g.Activos : 0;
                  return {
                    ...g,
                    grupoIndex: String.fromCharCode(65 + index),
                    Promedio: promedioHoras
                  };
                })}
                margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="grupoIndex" 
                  interval={0} 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis tick={{ fontSize: 12 }} axisLine={{ stroke: '#e0e0e0' }} tickFormatter={v => formatHorasMinutos(v)} />
                <Tooltip 
                  labelFormatter={(label) => {
                    const item = stackedGroupData[label.charCodeAt(0) - 65];
                    return item ? item.grupo : label;
                  }}
                  formatter={(value) => formatHorasMinutos(value)}
                  contentStyle={{ 
                    backgroundColor: '#f8fafc', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Promedio" 
                  stroke="#f59e42" 
                  strokeWidth={3} 
                  activeDot={{ r: 6, fill: '#f59e42', strokeWidth: 2, stroke: '#fff' }}
                  dot={{ r: 4, fill: '#f59e42' }}
                  label={({ value }) => formatHorasMinutos(value)}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {/* Leyenda de grupos mejorada */}
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Referencias de grupos:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {stackedGroupData.map((grupo, index) => (
                <div key={grupo.grupo} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                  <span className="font-bold text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-700 font-medium truncate">{grupo.grupo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* 3. % de empleados activos por grupo (Area) */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 min-h-[420px]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">% de empleados activos por grupo</h3>
            <div className="relative group">
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center cursor-help">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 pointer-events-none">
                {chartTooltips.porcentaje}
              </div>
            </div>
          </div>
          {(!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) ? (
            <div className="text-center text-gray-500 py-16 text-lg w-full">
              Selecciona un hospital y un período para ver la información de grupos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart
                data={stackedGroupData.map((g, index) => ({ 
                  ...g, 
                  grupoIndex: String.fromCharCode(65 + index),
                  Porcentaje: g.Total ? ((g.Activos / g.Total) * 100).toFixed(1) : 0 
                }))}
                margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
              >
                <defs>
                  <linearGradient id="colorPorc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="grupoIndex" 
                  interval={0} 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickFormatter={v => `${v}%`} 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  formatter={v => [`${v}%`, 'Porcentaje activo']}
                  labelFormatter={(label) => {
                    const item = stackedGroupData[label.charCodeAt(0) - 65];
                    return item ? item.grupo : label;
                  }}
                  contentStyle={{ 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Porcentaje" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPorc)"
                  activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {/* Leyenda de grupos mejorada */}
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Referencias de grupos:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {stackedGroupData.map((grupo, index) => (
                <div key={grupo.grupo} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-green-200 transition-colors">
                  <span className="font-bold text-green-600 bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-700 font-medium truncate">{grupo.grupo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* 4. Top grupos con más actividad (Vertical Bar) */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col min-h-[420px]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top grupos con más actividad</h3>
            <div className="relative group">
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center cursor-help">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              <div className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-64 pointer-events-none">
                {chartTooltips.top}
              </div>
            </div>
          </div>
          {(!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) ? (
            <div className="text-center text-gray-500 py-16 text-lg w-full">
              Selecciona un hospital y un período para ver la información de grupos.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={[...stackedGroupData].sort((a, b) => b.Activos - a.Activos).slice(0, 8)}
                margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  dataKey="grupo" 
                  type="category" 
                  width={140} 
                  tick={{ fontSize: 11 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fefbff', 
                    border: '1px solid #e0e7ff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [`${value} empleados`, 'Empleados activos']}
                />
                <Bar 
                  dataKey="Activos" 
                  fill="url(#gradientBar)" 
                  barSize={20}
                  radius={[0, 4, 4, 0]}
                />
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      {/* Nueva gráfica: Grupos con más horas trabajadas */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Top grupos con más horas trabajadas (en geocerca y fuera)</h3>
        </div>
        {(!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) ? (
          <div className="text-center text-gray-500 py-16 text-lg w-full">
            Selecciona un hospital y un período para ver la información de grupos.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...groupHoursData].sort((a, b) => (b.horas + b.horasFuera) - (a.horas + a.horasFuera)).slice(0, 8)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="grupo" tick={{ fontSize: 11 }} axisLine={{ stroke: '#e0e0e0' }} tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={v => formatHorasMinutos(v)}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                        <div style={{ color: '#6366f1', fontWeight: 500 }}>
                          Horas en geocerca: {formatHorasMinutos(payload[0].payload.horas)}
                        </div>
                        <div style={{ color: '#ef4444', fontWeight: 500 }}>
                          Horas fuera de geocerca: {formatHorasMinutos(payload[0].payload.horasFuera)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend formatter={(value) => value === 'horas' ? 'En geocerca' : 'Fuera de geocerca'} />
              <Bar dataKey="horas" fill="#6366f1" radius={[4, 4, 0, 0]} name="horas" label={({ value }) => formatHorasMinutos(value)} />
              <Bar dataKey="horasFuera" fill="#ef4444" radius={[4, 4, 0, 0]} name="horasFuera" label={({ value }) => formatHorasMinutos(value)} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
