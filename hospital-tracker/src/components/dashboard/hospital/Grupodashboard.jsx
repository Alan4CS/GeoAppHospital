"use client"
import React, { useEffect, useState } from "react"
import { Calendar, MapPin, Building2, Check, Users, TrendingUp, Clock, Download, Search } from "lucide-react"
import AttendanceMatrixModal from "./AttendanceMatrix";

// Componente auxiliar para el desglose por actividad
const DesglosePorActividad = ({ empleados, dataEmpleados, totalDiasPeriodo, calcularDiasTrabajados, categorizarEmpleadoPorActividad }) => {
  const activosConCategoria = empleados.map(empleado => {
    // Buscar registros de este empleado en dataEmpleados
    let registros = [];
    if (dataEmpleados && Array.isArray(dataEmpleados)) {
      const found = dataEmpleados.find(e => e.empleado.id_user === empleado.id_user);
      if (found) registros = found.registros;
    }
    
    const diasTrabajados = calcularDiasTrabajados(registros);
    const categoria = categorizarEmpleadoPorActividad(diasTrabajados, totalDiasPeriodo);
    const porcentaje = totalDiasPeriodo > 0 ? ((diasTrabajados / totalDiasPeriodo) * 100) : 0;
    
    return { ...empleado, categoria, diasTrabajados, porcentaje };
  });
  
  const muyActivos = activosConCategoria.filter(e => e.categoria === 'muy_activo');
  const activos = activosConCategoria.filter(e => e.categoria === 'activo');
  const pocoActivos = activosConCategoria.filter(e => e.categoria === 'poco_activo');
  const esporadicos = activosConCategoria.filter(e => e.categoria === 'esporadico');

  return (
    <div className="space-y-3 mb-4">
      <div className="text-xs font-semibold text-green-800 mb-2">Desglose por actividad:</div>
      
      {muyActivos.length > 0 && (
        <div className="flex items-center justify-between bg-green-200 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-green-800">Muy activos (≥80%)</span>
          <span className="font-bold text-green-900">{muyActivos.length}</span>
        </div>
      )}
      {activos.length > 0 && (
        <div className="flex items-center justify-between bg-blue-100 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-blue-800">Activos (50-79%)</span>
          <span className="font-bold text-blue-900">{activos.length}</span>
        </div>
      )}
      {pocoActivos.length > 0 && (
        <div className="flex items-center justify-between bg-yellow-100 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-yellow-800">Poco activos (20-49%)</span>
          <span className="font-bold text-yellow-900">{pocoActivos.length}</span>
        </div>
      )}
      {esporadicos.length > 0 && (
        <div className="flex items-center justify-between bg-orange-100 rounded-lg px-3 py-2">
          <span className="text-xs font-medium text-orange-800">Esporádicos (&lt;20%)</span>
          <span className="font-bold text-orange-900">{esporadicos.length}</span>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para el preview de empleados
// Función para obtener indicador visual según el nivel de actividad
const getActivityIndicator = (porcentaje) => {
  const pct = parseFloat(porcentaje);
  if (pct >= 80) return { emoji: '🟢', label: 'Muy activo', color: 'text-green-600' };
  if (pct >= 50) return { emoji: '🟡', label: 'Activo', color: 'text-yellow-600' };
  if (pct >= 20) return { emoji: '🟠', label: 'Poco activo', color: 'text-orange-600' };
  return { emoji: '🔴', label: 'Esporádico', color: 'text-red-600' };
};

const PreviewEmpleados = ({ empleados, dataEmpleados, totalDiasPeriodo, calcularDiasTrabajados, limit = 3, colorScheme = 'green', onViewAll }) => {
  const empleadosConInfo = empleados.slice(0, limit).map(empleado => {
    // Buscar registros de este empleado en dataEmpleados
    let registros = [];
    if (dataEmpleados && Array.isArray(dataEmpleados)) {
      const found = dataEmpleados.find(e => e.empleado.id_user === empleado.id_user);
      if (found) registros = found.registros;
    }
    
    const diasTrabajados = calcularDiasTrabajados(registros);
    const porcentaje = totalDiasPeriodo > 0 ? ((diasTrabajados / totalDiasPeriodo) * 100).toFixed(1) : 0;
    const indicator = getActivityIndicator(porcentaje);
    
    return { ...empleado, diasTrabajados, porcentaje, indicator };
  });

  return (
    <div className="space-y-2">
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {empleadosConInfo.map(empleado => (
          <div key={empleado.id_user} className={`flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-${colorScheme}-200`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{empleado.indicator.emoji}</span>
              <span className={`text-${colorScheme}-700 truncate font-medium`}>
                {empleado.nombre} {empleado.ap_paterno}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className={empleado.indicator.color + ' text-xs font-semibold'}>
                {empleado.indicator.label}
              </span>
              <span className={`text-xs text-${colorScheme}-600`}>
                {empleado.diasTrabajados} de {totalDiasPeriodo} días
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {empleados.length > limit && (
        <div className="text-center">
          <button
            onClick={onViewAll}
            className={`text-xs font-medium px-3 py-1 rounded-full transition-colors hover:bg-${colorScheme}-200 text-${colorScheme}-700 bg-${colorScheme}-100 flex items-center gap-1 mx-auto`}
          >
            Ver todos ({empleados.length})
          </button>
        </div>
      )}
    </div>
  );
};

// Componente Modal para mostrar lista completa de empleados
const EmployeeListModal = ({ isOpen, onClose, empleados, type, dataEmpleados, totalDiasPeriodo, calcularDiasTrabajados, searchTerm, onSearchChange, selectedGroup }) => {
  if (!isOpen) return null;

  const colorScheme = type === 'activos' ? 'green' : 'red';
  const title = type === 'activos' ? 'Empleados Activos' : 'Empleados Inactivos';
  
  // Preparar datos de empleados con información de actividad
  let empleadosConInfo = [];
  
  if (type === 'activos') {
    empleadosConInfo = empleados.map(empleado => {
      let registros = [];
      if (dataEmpleados && Array.isArray(dataEmpleados)) {
        const found = dataEmpleados.find(e => e.empleado.id_user === empleado.id_user);
        if (found) registros = found.registros;
      }
      
      const diasTrabajados = calcularDiasTrabajados(registros);
      const porcentaje = totalDiasPeriodo > 0 ? ((diasTrabajados / totalDiasPeriodo) * 100).toFixed(1) : 0;
      const indicator = getActivityIndicator(porcentaje);
      
      return { ...empleado, diasTrabajados, porcentaje, indicator };
    });
  } else {
    empleadosConInfo = empleados.map(empleado => ({
      ...empleado,
      diasTrabajados: 0,
      porcentaje: 0,
      indicator: { emoji: '🔴', label: 'Sin actividad', color: 'text-red-600' }
    }));
  }

  // Filtrar por término de búsqueda
  const empleadosFiltrados = empleadosConInfo.filter(empleado => 
    `${empleado.nombre} ${empleado.ap_paterno} ${empleado.ap_materno}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empleado.nombre_grupo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${colorScheme}-500 to-${colorScheme}-600 text-white p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm opacity-90">
                {selectedGroup ? `Grupo: ${selectedGroup}` : 'Todos los grupos'} • {empleadosFiltrados.length} empleados
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre o grupo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Lista de empleados */}
        <div className="overflow-y-auto max-h-96 p-4">
          {empleadosFiltrados.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2"><Users className="h-8 w-8 mx-auto" /></div>
              <p>No se encontraron empleados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {empleadosFiltrados.map(empleado => (
                <div key={empleado.id_user} className={`bg-${colorScheme}-50 border border-${colorScheme}-200 rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{empleado.indicator.emoji}</span>
                      <h4 className={`font-medium text-${colorScheme}-800`}>
                        {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno || ''}
                      </h4>
                    </div>
                    <span className={empleado.indicator.color + ' text-xs font-bold bg-white px-2 py-1 rounded-full border'}>
                      {empleado.indicator.label}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className={`text-${colorScheme}-600`}>
                      <strong>Grupo:</strong> {empleado.nombre_grupo}
                    </div>
                    <div className={`text-${colorScheme}-600`}>
                      <strong>Días trabajados:</strong> {empleado.diasTrabajados} de {totalDiasPeriodo} días
                    </div>
                    {type === 'activos' && (
                      <div className={`text-${colorScheme}-600`}>
                        <strong>Nivel de actividad:</strong> {empleado.porcentaje}% del período
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Leyenda de indicadores */}
          {type === 'activos' && (
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Niveles de actividad:</h4>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span>🟢</span>
                  <span className="text-green-600 font-medium">Muy activo</span>
                  <span className="text-gray-500">(80%+ del período)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🟡</span>
                  <span className="text-yellow-600 font-medium">Activo</span>
                  <span className="text-gray-500">(50-79% del período)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🟠</span>
                  <span className="text-orange-600 font-medium">Poco activo</span>
                  <span className="text-gray-500">(20-49% del período)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔴</span>
                  <span className="text-red-600 font-medium">Esporádico</span>
                  <span className="text-gray-500">(&lt;20% del período)</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total: {empleadosFiltrados.length} empleados</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
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
import { generarReporteGrupoPDF } from "./reportes/GroupReportPDF";

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
    activeGroups: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    consistentEmployees: 0, // Empleados que trabajaron más del 50% de días
    occasionalEmployees: 0, // Empleados que trabajaron menos del 50% de días
    totalExits: 0,
    totalHours: 0,
    totalDentro: 0,
    totalFuera: 0,
    averageWorkingDays: 0, // Promedio de días trabajados por empleado activo
    totalWorkingDays: 0 // Total de días del período
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
  // Estado para la generación de PDF
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Estados para mostrar listas completas de empleados
  const [showAllActiveEmployees, setShowAllActiveEmployees] = useState(false);
  const [showAllInactiveEmployees, setShowAllInactiveEmployees] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeModalType, setEmployeeModalType] = useState(''); // 'activos' o 'inactivos'
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Estados para la matriz de asistencia diaria
  const [showAttendanceMatrix, setShowAttendanceMatrix] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceFilter, setAttendanceFilter] = useState({
    grupo: '',
    estado: 'todos' // 'todos', 'activos', 'inactivos'
  });

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

  // Función para calcular días trabajados por empleado
  function calcularDiasTrabajados(registros) {
    if (!registros || registros.length === 0) return 0;
    
    const diasUnicos = new Set();
    registros.forEach(registro => {
      const fecha = new Date(registro.fecha_hora);
      const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
      diasUnicos.add(fechaStr);
    });
    
    return diasUnicos.size;
  }

  // Función para categorizar empleados por consistencia
  function categorizarEmpleadoPorActividad(diasTrabajados, totalDiasPeriodo) {
    const porcentajeActividad = (diasTrabajados / totalDiasPeriodo) * 100;
    
    if (porcentajeActividad >= 80) return 'muy_activo'; // 80% o más
    if (porcentajeActividad >= 50) return 'activo'; // 50-79%
    if (porcentajeActividad >= 20) return 'poco_activo'; // 20-49%
    return 'esporadico'; // menos del 20%
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

          // Calcular días del período
          const fechaInicio = new Date(tempDateRange.startDate);
          const fechaFin = new Date(tempDateRange.endDate);
          const totalDiasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;

          // Arrays para categorizar empleados
          const empleadosConActividad = [];
          let totalDiasTrabajados = 0;

          data.empleados.forEach(({ empleado, registros }) => {
            gruposSet.add(empleado.grupo);
            totalEmpleados++;
            if (!groupDist[empleado.grupo]) groupDist[empleado.grupo] = 0;
            groupDist[empleado.grupo]++;

            // Calcular días trabajados por este empleado
            const diasTrabajados = calcularDiasTrabajados(registros);
            totalDiasTrabajados += diasTrabajados;
            
            // Categorizar empleado
            const categoria = categorizarEmpleadoPorActividad(diasTrabajados, totalDiasPeriodo);
            empleadosConActividad.push({
              ...empleado,
              diasTrabajados,
              categoria,
              porcentajeActividad: (diasTrabajados / totalDiasPeriodo) * 100
            });

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

          // Contar empleados por categoría
          const muyActivos = empleadosConActividad.filter(e => e.categoria === 'muy_activo').length;
          const activos = empleadosConActividad.filter(e => e.categoria === 'activo').length;
          const pocoActivos = empleadosConActividad.filter(e => e.categoria === 'poco_activo').length;
          const esporadicos = empleadosConActividad.filter(e => e.categoria === 'esporadico').length;

          const promedoDiasTrabajados = totalEmpleados > 0 ? totalDiasTrabajados / totalEmpleados : 0;

          setCardData({
            totalGroups: grupos.length, // Total de grupos en el hospital
            activeGroups: gruposSet.size, // Grupos con empleados activos
            totalEmployees: empleadosHospital.length, // Total empleados del hospital
            activeEmployees: totalEmpleados, // Empleados activos en el período
            consistentEmployees: muyActivos + activos, // Empleados que trabajaron 50% o más
            occasionalEmployees: pocoActivos + esporadicos, // Empleados esporádicos
            muyActivos,
            activos,
            pocoActivos,
            esporadicos,
            totalExits,
            totalHours: Math.round(totalHours * 100) / 100,
            totalDentro: Math.round(totalDentro * 100) / 100,
            totalFuera: Math.round(totalFuera * 100) / 100,
            averageWorkingDays: Math.round(promedoDiasTrabajados * 10) / 10, // 1 decimal
            totalWorkingDays: totalDiasPeriodo
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
        setCardData({ 
          totalGroups: 0, 
          activeGroups: 0,
          totalEmployees: 0, 
          activeEmployees: 0,
          consistentEmployees: 0,
          occasionalEmployees: 0,
          muyActivos: 0,
          activos: 0,
          pocoActivos: 0,
          esporadicos: 0,
          totalExits: 0, 
          totalHours: 0, 
          totalDentro: 0, 
          totalFuera: 0,
          averageWorkingDays: 0,
          totalWorkingDays: 0
        });
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

  // Nuevo estado para métricas específicas del grupo seleccionado
  const [groupSpecificMetrics, setGroupSpecificMetrics] = useState({
    muyActivos: 0,
    activos: 0,
    pocoActivos: 0,
    esporadicos: 0,
    consistentEmployees: 0,
    occasionalEmployees: 0,
    averageWorkingDays: 0,
    totalDentro: 0,
    totalFuera: 0
  });

  // Filtrar listas de empleados activos e inactivos según el grupo seleccionado
  const filteredActivos = selectedGroupList
    ? empleadosActivos.filter(e => e.nombre_grupo === selectedGroupList)
    : empleadosActivos;
  const filteredInactivos = selectedGroupList
    ? empleadosInactivos.filter(e => e.nombre_grupo === selectedGroupList)
    : empleadosInactivos;

  // Efecto para recalcular métricas cuando cambie el grupo seleccionado
  useEffect(() => {
    if (selectedGroupList && dataEmpleados && cardData.totalWorkingDays > 0) {
      // Calcular métricas específicas del grupo seleccionado
      const empleadosGrupoConActividad = filteredActivos.map(empleado => {
        let registros = [];
        if (dataEmpleados && Array.isArray(dataEmpleados)) {
          const found = dataEmpleados.find(e => e.empleado.id_user === empleado.id_user);
          if (found) registros = found.registros;
        }
        const diasTrabajados = calcularDiasTrabajados(registros);
        const categoria = categorizarEmpleadoPorActividad(diasTrabajados, cardData.totalWorkingDays);
        return { ...empleado, diasTrabajados, categoria };
      });

      const muyActivos = empleadosGrupoConActividad.filter(e => e.categoria === 'muy_activo').length;
      const activos = empleadosGrupoConActividad.filter(e => e.categoria === 'activo').length;
      const pocoActivos = empleadosGrupoConActividad.filter(e => e.categoria === 'poco_activo').length;
      const esporadicos = empleadosGrupoConActividad.filter(e => e.categoria === 'esporadico').length;

      const totalDiasTrabajadosGrupo = empleadosGrupoConActividad.reduce((sum, e) => sum + e.diasTrabajados, 0);
      const promedioGrupo = filteredActivos.length > 0 ? totalDiasTrabajadosGrupo / filteredActivos.length : 0;

      // Calcular horas específicas del grupo seleccionado
      let totalDentroGrupo = 0;
      let totalFueraGrupo = 0;

      if (dataEmpleados && Array.isArray(dataEmpleados)) {
        // Obtener todos los empleados del grupo (activos e inactivos)
        const todosEmpleadosGrupo = [...filteredActivos, ...filteredInactivos];
        
        todosEmpleadosGrupo.forEach(empleado => {
          const found = dataEmpleados.find(e => e.empleado.id_user === empleado.id_user);
          if (found && found.registros) {
            // Usar la misma función que se usa en el cálculo general
            const stats = calcularEstadisticasEmpleadoPorDias(found.registros);
            totalDentroGrupo += stats.workedHours;
            totalFueraGrupo += stats.outsideHours;
          }
        });
      }

      setGroupSpecificMetrics({
        muyActivos,
        activos,
        pocoActivos,
        esporadicos,
        consistentEmployees: muyActivos + activos,
        occasionalEmployees: pocoActivos + esporadicos,
        averageWorkingDays: Math.round(promedioGrupo * 10) / 10,
        totalDentro: totalDentroGrupo,
        totalFuera: totalFueraGrupo
      });
    } else {
      // Si no hay grupo seleccionado, usar las métricas generales
      setGroupSpecificMetrics({
        muyActivos: cardData.muyActivos || 0,
        activos: cardData.activos || 0,
        pocoActivos: cardData.pocoActivos || 0,
        esporadicos: cardData.esporadicos || 0,
        consistentEmployees: cardData.consistentEmployees || 0,
        occasionalEmployees: cardData.occasionalEmployees || 0,
        averageWorkingDays: cardData.averageWorkingDays || 0,
        totalDentro: cardData.totalDentro || 0,
        totalFuera: cardData.totalFuera || 0
      });
    }
  }, [
    selectedGroupList, 
    filteredActivos, 
    filteredInactivos,
    dataEmpleados, 
    cardData.totalWorkingDays, 
    cardData.muyActivos, 
    cardData.activos, 
    cardData.pocoActivos, 
    cardData.esporadicos, 
    cardData.consistentEmployees, 
    cardData.occasionalEmployees, 
    cardData.averageWorkingDays,
    cardData.totalDentro,
    cardData.totalFuera
  ]);

  // Calcular días trabajados y porcentaje de asistencia
  const calculateWorkingDays = (fechaInicio, fechaFin) => {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  // Función para generar la matriz de asistencia diaria
  const generateAttendanceMatrix = () => {
    if (!empleadosHospital.length || !tempDateRange.startDate || !tempDateRange.endDate) return [];

    // Generar array de fechas del período
    const startDate = new Date(tempDateRange.startDate);
    const endDate = new Date(tempDateRange.endDate);
    const dateArray = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateArray.push(new Date(d));
    }

    // Filtrar empleados según los filtros aplicados
    let empleadosParaMatriz = empleadosHospital;
    if (attendanceFilter.estado === 'activos') {
      empleadosParaMatriz = empleadosActivos;
    } else if (attendanceFilter.estado === 'inactivos') {
      empleadosParaMatriz = empleadosInactivos;
    }
    if (attendanceFilter.grupo) {
      empleadosParaMatriz = empleadosParaMatriz.filter(emp => emp.nombre_grupo === attendanceFilter.grupo);
    }

    // Crear matriz de asistencia
    const matrix = empleadosParaMatriz.map(empleado => {
      // Buscar registros de este empleado en dataEmpleados
      let registros = [];
      if (dataEmpleados && Array.isArray(dataEmpleados)) {
        const found = dataEmpleados.find(e => e.empleado.id_user === empleado.id_user);
        if (found) registros = found.registros;
      }
      // Para cada día, ver si hay registro
      const dias = dateArray.map(day => {
        const dayString = day.toISOString().split('T')[0];
        const asistio = registros.some(r => {
          const fecha = new Date(r.fecha_hora).toISOString().split('T')[0];
          return fecha === dayString;
        });
        return {
          fecha: dayString,
          asistio,
          dia_semana: day.toLocaleDateString('es-ES', { weekday: 'short' })
        };
      });
      return {
        empleado: {
          id: empleado.id_user,
          nombre: `${empleado.nombre} ${empleado.ap_paterno} ${empleado.ap_materno}`,
          grupo: empleado.nombre_grupo,
          isActive: empleadosActivos.some(e => e.id_user === empleado.id_user)
        },
        dias
      };
    });
    return matrix;
  };

  // Generar matriz cuando cambien los filtros o datos
  useEffect(() => {
    if (showAttendanceMatrix) {
      const matrix = generateAttendanceMatrix();
      setAttendanceData(matrix);
    }
  }, [showAttendanceMatrix, attendanceFilter, empleadosHospital, empleadosActivos, empleadosInactivos, dataEmpleados, tempDateRange]);

  const totalDias = tempDateRange.startDate && tempDateRange.endDate ? 
    Math.ceil((new Date(tempDateRange.endDate) - new Date(tempDateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0;

  // Función para generar PDF
  const generatePDF = async () => {
    if (!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate) {
      alert("Para generar el reporte PDF, primero selecciona un hospital y configura un período de tiempo válido.");
      return;
    }
    
    setLoadingPDF(true);
    try {
      // Obtener nombres para el reporte
      const hospitalNombre = hospitales.find(h => h.id_hospital == filters.id_hospital)?.nombre_hospital || 'Hospital no encontrado';
      const estadoNombre = estados.find(e => e.id_estado == filters.id_estado)?.nombre_estado || 'Estado no especificado';
      const municipioNombre = municipios.find(m => m.id_municipio == filters.id_municipio)?.nombre_municipio || 'Municipio no especificado';
      
      // Filtrar datos según el grupo seleccionado
      let filteredGroupDistributionData = groupDistributionData;
      let filteredStackedGroupData = stackedGroupData;
      let filteredGroupHoursData = groupHoursData;
      let filteredEmpleadosActivos = empleadosActivos;
      let filteredEmpleadosInactivos = empleadosInactivos;
      let reportTitle = "Reporte General de Grupos";
      let reportSubtitle = "Análisis completo de todos los grupos del hospital";
      
      // Si hay un grupo específico seleccionado, filtrar los datos
      if (selectedGroupList) {
        filteredGroupDistributionData = groupDistributionData.filter(g => g.grupo === selectedGroupList);
        filteredStackedGroupData = stackedGroupData.filter(g => g.grupo === selectedGroupList);
        filteredGroupHoursData = groupHoursData.filter(g => g.grupo === selectedGroupList);
        filteredEmpleadosActivos = empleadosActivos.filter(e => e.nombre_grupo === selectedGroupList);
        filteredEmpleadosInactivos = empleadosInactivos.filter(e => e.nombre_grupo === selectedGroupList);
        reportTitle = `Reporte del Grupo: ${selectedGroupList}`;
        reportSubtitle = `Análisis específico del grupo "${selectedGroupList}"`;
      }

      // Crear cardData contextual que use métricas específicas del grupo cuando sea necesario
      const contextualCardData = selectedGroupList ? {
        ...cardData,
        totalEmployees: filteredEmpleadosActivos.length + filteredEmpleadosInactivos.length,
        activeEmployees: filteredEmpleadosActivos.length,
        muyActivos: groupSpecificMetrics.muyActivos,
        activos: groupSpecificMetrics.activos,
        pocoActivos: groupSpecificMetrics.pocoActivos,
        esporadicos: groupSpecificMetrics.esporadicos,
        consistentEmployees: groupSpecificMetrics.consistentEmployees,
        occasionalEmployees: groupSpecificMetrics.occasionalEmployees,
        averageWorkingDays: groupSpecificMetrics.averageWorkingDays,
        totalDentro: groupSpecificMetrics.totalDentro,
        totalFuera: groupSpecificMetrics.totalFuera,
        totalGroups: 1, // Solo un grupo específico
        activeGroups: 1 // Solo un grupo específico
      } : cardData;
      
      await generarReporteGrupoPDF({
        hospital: hospitalNombre,
        estado: estadoNombre,
        municipio: municipioNombre,
        startDate: tempDateRange.startDate,
        endDate: tempDateRange.endDate,
        cardData: contextualCardData,
        groupDistributionData: filteredGroupDistributionData,
        stackedGroupData: filteredStackedGroupData,
        groupHoursData: filteredGroupHoursData,
        empleadosActivos: filteredEmpleadosActivos,
        empleadosInactivos: filteredEmpleadosInactivos,
        selectedGroup: selectedGroupList, // Pasar el grupo seleccionado
        reportTitle,
        reportSubtitle
      });
    } catch (err) {
      console.error('Error al generar el PDF:', err);
      alert("Error al generar el PDF. Revisa la consola para más detalles.");
    }
    setLoadingPDF(false);
  };

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

      {/* Modal de matriz de asistencia diaria */}
      {showAttendanceMatrix && (
        <AttendanceMatrixModal
          attendanceData={attendanceData}
          onClose={() => setShowAttendanceMatrix(false)}
        />
      )}

      {/* Modal para lista completa de empleados */}
      <EmployeeListModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        empleados={employeeModalType === 'activos' ? filteredActivos : filteredInactivos}
        type={employeeModalType}
        dataEmpleados={dataEmpleados}
        totalDiasPeriodo={cardData.totalWorkingDays}
        calcularDiasTrabajados={calcularDiasTrabajados}
        searchTerm={employeeSearchTerm}
        onSearchChange={setEmployeeSearchTerm}
        selectedGroup={selectedGroupList}
      />

      {/* Texto informativo para empleados */}
      <div className={`flex items-center gap-2 mb-4 rounded-lg p-3 border ${selectedGroupList 
        ? 'bg-purple-50 border-purple-200' 
        : 'bg-blue-50 border-blue-100'
      }`}>
        <Users className={`h-4 w-4 ${selectedGroupList ? 'text-purple-500' : 'text-blue-500'}`} />
        <span className={`text-sm ${selectedGroupList ? 'text-purple-800' : 'text-blue-800'}`}>
          {selectedGroupList ? (
            <>
              Mostrando {filteredActivos.length} empleados activos de {filteredActivos.length + filteredInactivos.length} totales del grupo <strong>"{selectedGroupList}"</strong>.
              <br />
              <strong>Período:</strong> {cardData.totalWorkingDays} días | <strong>Vista:</strong> Grupo específico
            </> 
          ) : (
            <>
              Mostrando {cardData.activeEmployees} empleados activos de {cardData.totalEmployees} totales, 
              distribuidos en {cardData.activeGroups} grupos activos de {cardData.totalGroups} grupos totales del hospital.
              <br />
              <strong>Período:</strong> {cardData.totalWorkingDays} días | <strong>Promedio:</strong> {selectedGroupList ? groupSpecificMetrics.averageWorkingDays : cardData.averageWorkingDays} días trabajados por empleado activo
            </>
          )}
        </span>
      </div>

      {/* Resumen simplificado de empleados */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Resumen de Empleados
          </h3>
          {/* Botón PDF reubicado aquí con información contextual */}
          {filters.id_hospital && tempDateRange.startDate && tempDateRange.endDate && (
            <div className="flex flex-col items-end gap-2">
              {selectedGroupList && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  Reporte específico: {selectedGroupList}
                </div>
              )}
              <button
                onClick={generatePDF}
                disabled={loadingPDF}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                title={selectedGroupList 
                  ? `Generar reporte específico del grupo "${selectedGroupList}"` 
                  : "Generar reporte de todos los grupos del hospital"
                }
              >
                {loadingPDF ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {selectedGroupList ? "PDF del Grupo" : "PDF General"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Filtro de grupo */}
        <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filtrar por grupo:</label>
            <select
              value={selectedGroupList}
              onChange={e => setSelectedGroupList(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">Todos los grupos</option>
              {groupDistributionData.map(g => (
                <option key={g.grupo} value={g.grupo}>{g.grupo} ({g.cantidad})</option>
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
        </div>

        {/* Cards de resumen con información de actividad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Empleados activos */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">Empleados Activos</h4>
                  <p className="text-sm text-green-600">En el período</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-700">{filteredActivos.length}</div>
            </div>
            
            {/* Desglose por nivel de actividad para activos */}
            <DesglosePorActividad 
              empleados={filteredActivos}
              dataEmpleados={dataEmpleados}
              totalDiasPeriodo={cardData.totalWorkingDays}
              calcularDiasTrabajados={calcularDiasTrabajados}
              categorizarEmpleadoPorActividad={categorizarEmpleadoPorActividad}
            />

            {/* Leyenda de indicadores de actividad */}
            <div className="bg-green-100 rounded-lg p-3 mb-4">
              <div className="text-xs font-semibold text-green-800 mb-2">Indicadores de actividad:</div>
              <div className="grid grid-cols-2 gap-1 text-xs text-green-700">
                <div className="flex items-center gap-1">
                  <span>🟢</span>
                  <span>Muy activo (80%+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🟡</span>
                  <span>Activo (50-79%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🟠</span>
                  <span>Poco activo (20-49%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔴</span>
                  <span>Esporádico (&lt;20%)</span>
                </div>
              </div>
            </div>

            {/* Preview de empleados con información de actividad */}
            <PreviewEmpleados 
              empleados={filteredActivos}
              dataEmpleados={dataEmpleados}
              totalDiasPeriodo={cardData.totalWorkingDays}
              calcularDiasTrabajados={calcularDiasTrabajados}
              limit={3}
              colorScheme="green"
              onViewAll={() => {
                setEmployeeModalType('activos');
                setShowEmployeeModal(true);
                setEmployeeSearchTerm('');
              }}
            />
          </div>

          {/* Empleados inactivos */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800">Empleados Inactivos</h4>
                  <p className="text-sm text-red-600">Sin registros en período</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-700">{filteredInactivos.length}</div>
            </div>
            
            {/* Información adicional para inactivos */}
            <div className="bg-red-100 rounded-lg p-3 mb-4">
              <div className="text-xs font-semibold text-red-800 mb-1">Estado:</div>
              <div className="text-xs text-red-700">
                Sin actividad registrada durante el período de análisis
              </div>
            </div>

            {/* Preview de empleados inactivos */}
            <div className="space-y-2">
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredInactivos.slice(0, 3).map(empleado => (
                  <div key={empleado.id_user} className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 truncate font-medium">
                        {empleado.nombre} {empleado.ap_paterno}
                      </span>
                    </div>
                    <div className="text-xs text-red-600 font-semibold">
                      0% (0d)
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredInactivos.length > 3 && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      setEmployeeModalType('inactivos');
                      setShowEmployeeModal(true);
                      setEmployeeSearchTerm('');
                    }}
                    className="text-xs font-medium px-3 py-1 rounded-full transition-colors hover:bg-red-200 text-red-700 bg-red-100 flex items-center gap-1 mx-auto"
                  >
                    Ver todos ({filteredInactivos.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumen total con métricas avanzadas */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">Estadísticas del Período</h4>
                  <p className="text-sm text-blue-600">Análisis de {cardData.totalWorkingDays} días laborales</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {filteredActivos.length + filteredInactivos.length}
                </div>
                <div className="text-xs text-blue-600 font-medium">Total empleados</div>
              </div>
            </div>
            
            {/* Métricas del período reestructuradas */}
            <div className="space-y-4">
              {/* Participación Laboral */}
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-700">Participación Laboral</span>
                  <span className="text-lg font-bold text-blue-800">
                    {filteredActivos.length + filteredInactivos.length > 0 
                      ? Math.round((filteredActivos.length / (filteredActivos.length + filteredInactivos.length)) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{
                      width: `${filteredActivos.length + filteredInactivos.length > 0 
                        ? (filteredActivos.length / (filteredActivos.length + filteredInactivos.length)) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-blue-600">
                  {filteredActivos.length} empleados trabajaron durante el período
                </div>
              </div>
              
              {/* Métricas de rendimiento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {selectedGroupList ? groupSpecificMetrics.averageWorkingDays : cardData.averageWorkingDays}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Días promedio trabajados</div>
                  <div className="text-xs text-blue-500 mt-1">por empleado activo</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {selectedGroupList ? groupSpecificMetrics.consistentEmployees : cardData.consistentEmployees}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Empleados constantes</div>
                  <div className="text-xs text-blue-500 mt-1">trabajaron 80%+ del período</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de Horas - Integradas en el resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Horas en Geocerca */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800">Horas en Geocerca</h4>
                  <p className="text-sm text-purple-600">Tiempo en área de trabajo</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-700">
                {Math.floor((selectedGroupList ? groupSpecificMetrics.totalDentro : cardData.totalDentro) ?? 0)}h
              </div>
            </div>
            
            {/* Detalle de minutos */}
            <div className="bg-purple-100 rounded-lg p-3 mb-4">
              <div className="text-xs font-semibold text-purple-800 mb-1">Tiempo total:</div>
              <div className="text-sm text-purple-700 font-medium">
                {formatHorasMinutos((selectedGroupList ? groupSpecificMetrics.totalDentro : cardData.totalDentro) ?? 0)}
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700">Porcentaje del total:</span>
                <span className="font-semibold text-purple-800">
                  {(() => {
                    const totalDentro = selectedGroupList ? groupSpecificMetrics.totalDentro : cardData.totalDentro;
                    const totalFuera = selectedGroupList ? groupSpecificMetrics.totalFuera : cardData.totalFuera;
                    return totalDentro + totalFuera > 0 
                      ? Math.round((totalDentro / (totalDentro + totalFuera)) * 100)
                      : 0;
                  })()}%
                </span>
              </div>
              
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{
                    width: `${(() => {
                      const totalDentro = selectedGroupList ? groupSpecificMetrics.totalDentro : cardData.totalDentro;
                      const totalFuera = selectedGroupList ? groupSpecificMetrics.totalFuera : cardData.totalFuera;
                      return totalDentro + totalFuera > 0 
                        ? (totalDentro / (totalDentro + totalFuera)) * 100
                        : 0;
                    })()}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Horas Fuera de Geocerca */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-800">Horas Fuera de Geocerca</h4>
                  <p className="text-sm text-orange-600">Tiempo fuera del área</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-700">
                {Math.floor((selectedGroupList ? groupSpecificMetrics.totalFuera : cardData.totalFuera) ?? 0)}h
              </div>
            </div>
            
            {/* Detalle de minutos */}
            <div className="bg-orange-100 rounded-lg p-3 mb-4">
              <div className="text-xs font-semibold text-orange-800 mb-1">Tiempo total:</div>
              <div className="text-sm text-orange-700 font-medium">
                {formatHorasMinutos((selectedGroupList ? groupSpecificMetrics.totalFuera : cardData.totalFuera) ?? 0)}
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-orange-700">Porcentaje del total:</span>
                <span className="font-semibold text-orange-800">
                  {(() => {
                    const totalDentro = selectedGroupList ? groupSpecificMetrics.totalDentro : cardData.totalDentro;
                    const totalFuera = selectedGroupList ? groupSpecificMetrics.totalFuera : cardData.totalFuera;
                    return totalDentro + totalFuera > 0 
                      ? Math.round((totalFuera / (totalDentro + totalFuera)) * 100)
                      : 0;
                  })()}%
                </span>
              </div>
              
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{
                    width: `${(() => {
                      const totalDentro = selectedGroupList ? groupSpecificMetrics.totalDentro : cardData.totalDentro;
                      const totalFuera = selectedGroupList ? groupSpecificMetrics.totalFuera : cardData.totalFuera;
                      return totalDentro + totalFuera > 0 
                        ? (totalFuera / (totalDentro + totalFuera)) * 100
                        : 0;
                    })()}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje cuando no hay datos */}
        {(filteredActivos.length === 0 && filteredInactivos.length === 0) && (
          <div className="text-center py-8 text-gray-500 mt-6">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-600">No hay empleados registrados</p>
            <p className="text-sm text-gray-500 mt-2">Verifica que el hospital seleccionado tenga empleados asignados</p>
            <p className="text-sm text-gray-500 mt-2">
              {selectedGroupList 
                ? `No se encontraron empleados en el grupo "${selectedGroupList}" para el período seleccionado` 
                : "Configura los filtros de hospital y período para comenzar el análisis"}
            </p>
          </div>
        )}

        {/* Call to action para ver detalles */}
        {(filteredActivos.length > 0 || filteredInactivos.length > 0) && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800">¿Necesitas más detalles?</h4>
                <p className="text-sm text-blue-600">
                  Ve la matriz de asistencia diaria para analizar patrones de trabajo día por día
                </p>
              </div>
              <button
                onClick={() => setShowAttendanceMatrix(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
              >
                Abrir Matriz
              </button>
            </div>
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
            Configura los filtros de hospital y período para visualizar el análisis de grupos.
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
              Configura los filtros de hospital y período para visualizar la distribución por grupos.
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
              Configura los filtros de hospital y período para visualizar el promedio de actividad.
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
              Configura los filtros de hospital y período para visualizar el porcentaje de empleados activos.
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
        {/* 4. Top grupos con mayor actividad (Vertical Bar) */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col min-h-[420px]">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top grupos con mayor actividad</h3>
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
              Configura los filtros de hospital y período para visualizar el ranking de grupos más activos.
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
            Configura los filtros de hospital y período para visualizar las horas trabajadas por grupo.
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
  );
}