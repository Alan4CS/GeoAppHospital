"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Users, Check, Download, X, MapPin, Building2, BarChart, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ResponsiveContainer, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts"
import { generarReporteEmpleadoPDF } from "./reportes/EmployeeReportPDF"
import { calcularEstadisticasEmpleado } from "./employeeStatsHelper"
import WebTimelineComponent from "./WebTimelineComponent"

export default function EmpleadoDashboard({
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
  grupos,

  selectedGrupo,
  selectedEmpleado,
  fechaInicio,
  fechaFin,
  handleGrupoChange,
  handleEmpleadoChange,
  handleFechaInicioChange,
  handleFechaFinChange,
  filtrarEmpleados,
}) {
  // --- Fetch empleados y calcular estadísticas ---
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const selectedEmployeeData = selectedEmpleado ? empleados.find(emp => emp.id === Number(selectedEmpleado)) : null

  // --- Calendar and PDF state/logic ---
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [calendarData, setCalendarData] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [hourlyData, setHourlyData] = useState([])

  useEffect(() => {
    async function fetchEmpleados() {
      if (filters.id_hospital && tempDateRange.startDate && tempDateRange.endDate) {
        const body = {
          id_hospital: filters.id_hospital,
          fechaInicio: `${tempDateRange.startDate} 00:00:00`,
          fechaFin: `${tempDateRange.endDate} 23:59:59`,
        };
        const res = await fetch("https://geoapphospital.onrender.com/api/dashboards/grupo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (Array.isArray(data.empleados)) {
          const empleadosConStats = data.empleados.map(({ empleado, registros }) => {
            const stats = calcularEstadisticasEmpleado(registros);
            return {
              id: empleado.id_user,
              name: `${empleado.nombre} ${empleado.ap_paterno} ${empleado.ap_materno}`.replace(/ +/g, ' ').trim(),
              grupo: empleado.grupo,
              registros: registros, // 👈 Guardar los registros completos para el calendario
              ...stats,
            };
          });
          setEmpleados(empleadosConStats);
          setEmpleadosFiltrados(empleadosConStats);
        }
      } else {
        setEmpleados([]);
        setEmpleadosFiltrados([]);
      }
    }
    fetchEmpleados();
  }, [filters.id_hospital, tempDateRange.startDate, tempDateRange.endDate])

  // Solo llamar a limpiarFiltros del padre
  const handleLimpiarFiltros = () => {
    if (typeof limpiarFiltros === 'function') limpiarFiltros();
  }

  // Dates for calendar navigation
  const startDate = tempDateRange.startDate
  const endDate = tempDateRange.endDate
  const employee = selectedEmployeeData

  // Month navigation - limitado al rango seleccionado
  const startMonth = startOfMonth(new Date(startDate))
  const endMonth = startOfMonth(new Date(endDate)) // Mes que contiene la fecha final
  const daysDiff = differenceInDays(new Date(endDate), new Date(startDate))
  
  // Mostrar navegación si el rango abarca más de un mes
  const showNavigation = startMonth.getTime() !== endMonth.getTime()
  const [currentMonth, setCurrentMonth] = useState(startMonth) // Iniciar en el primer mes
  
  // Límites para la navegación del calendario
  const minMonth = startOfMonth(new Date(startDate))
  const maxMonth = startOfMonth(new Date(endDate))
  
  // Funciones de navegación con límites
  const canNavigatePrevious = currentMonth > minMonth
  const canNavigateNext = currentMonth < maxMonth

  // Función helper para extraer fecha local de un timestamp - usando el mismo método que MonitoreoMap
  const getLocalDateString = (fechaHora) => {
    // Crear fecha usando el mismo método que MonitoreoMap
    const fecha = new Date(fechaHora)
    // Usar date-fns para formatear de manera consistente
    return format(fecha, "yyyy-MM-dd", { locale: es })
  }

  // Fetch calendar data when employee or date range changes
  useEffect(() => {
    if (employee && empleados.length > 0) {
      // Usar los registros del empleado seleccionado que ya tenemos
      const empleadoCompleto = empleados.find(emp => emp.id === employee.id)
      
      if (empleadoCompleto && empleadoCompleto.registros) {
        // Agrupar registros por día usando fecha local
        const actividadesPorDia = {}
        
        empleadoCompleto.registros.forEach((registro) => {
          const fechaStr = getLocalDateString(registro.fecha_hora) // Usar función corregida
          if (!actividadesPorDia[fechaStr]) {
            actividadesPorDia[fechaStr] = []
          }
          actividadesPorDia[fechaStr].push({
            ...registro,
            nombre_actividad: getActivityDescription(registro),
            descripcion: getActivityDescription(registro)
          })
        })
        
        // Convertir a formato de calendario con estadísticas por día
        const calendarDataFormatted = Object.keys(actividadesPorDia).map(fecha => {
          const actividadesDia = actividadesPorDia[fecha].sort((a, b) => 
            new Date(a.fecha_hora) - new Date(b.fecha_hora)
          )
          const estadisticas = calcularEstadisticasDia(actividadesDia)
          
          return {
            fecha,
            actividades: actividadesDia,
            ...estadisticas
          }
        })
        
        setCalendarData(calendarDataFormatted)
      } else {
        setCalendarData([])
      }
    } else {
      setCalendarData([])
    }
    
    // Limpiar selección cuando cambie el empleado
    setSelectedDay(null)
    setHourlyData([])
  }, [employee, empleados])

  // Función helper para describir actividades basándose en el tipo
  const getActivityDescription = (registro) => {
    if (registro.tipo_registro === 1) return 'Entrada al trabajo'
    if (registro.tipo_registro === 0) return 'Salida del trabajo'
    if (registro.evento === 0) return 'Salió de geocerca'
    if (registro.evento === 1) return 'Entró a geocerca'
    if (registro.evento === 2) return 'Inicio de descanso'
    if (registro.evento === 3) return 'Fin de descanso'
    return 'Actividad registrada'
  }

  // Función para formatear hora - usando el mismo método que MonitoreoMap
  const formatHora = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return format(fecha, "HH:mm", { locale: es });
  }

  // Función para formatear horas decimales a 'Xh Ymin'
  function formatHorasMinutos(horasDecimales) {
    // Verificar si el valor es válido
    if (typeof horasDecimales !== 'number' || isNaN(horasDecimales) || horasDecimales < 0) {
      return '0h 0min';
    }
    
    const horas = Math.floor(horasDecimales);
    const minutos = Math.round((horasDecimales - horas) * 60);
    return `${horas}h ${minutos}min`;
  }

  // Función mejorada para generar resumen del día (igual que en PDF)
  const generarResumenDiaMejorado = (actividades) => {
    if (!actividades || actividades.length === 0) return [];
    
    const eventos = [];
    let estadoGeocerca = null;
    let horaIntervalo = null;

    const formatIntervalo = (inicio, fin) => {
      const diffMs = new Date(fin) - new Date(inicio);
      const min = Math.floor(diffMs / 60000) % 60;
      const hrs = Math.floor(diffMs / 3600000);
      return `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
    };

    const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

    for (let i = 0; i < ordenadas.length; i++) {
      const act = ordenadas[i];
      const hora = formatHora(act.fecha_hora);
      
      // Entrada laboral
      if (i === 0 && act.tipo_registro === 1) {
        eventos.push({
          hora,
          descripcion: 'Marcó entrada laboral',
          tipo: 'entrada',
          duracion: ''
        });
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        continue;
      }
      
      // Eventos de geocerca
      if (typeof act.evento === 'number') {
        if (act.evento === 0) {
          // Salió de geocerca
          if (estadoGeocerca === true && horaIntervalo) {
            const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
            eventos.push({
              hora: `${formatHora(horaIntervalo)} - ${hora}`,
              descripcion: `Tiempo dentro de geocerca`,
              tipo: 'tiempo_dentro',
              duracion: `(${duracion})`
            });
          }
          eventos.push({
            hora,
            descripcion: 'Salió de geocerca',
            tipo: 'geocerca_salida',
            duracion: ''
          });
          estadoGeocerca = false;
          horaIntervalo = act.fecha_hora;
        } else if (act.evento === 1) {
          // Entró a la geocerca
          if (estadoGeocerca === false && horaIntervalo) {
            const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
            eventos.push({
              hora: `${formatHora(horaIntervalo)} - ${hora}`,
              descripcion: `Tiempo fuera de geocerca`,
              tipo: 'tiempo_fuera',
              duracion: `(${duracion})`
            });
          }
          eventos.push({
            hora,
            descripcion: 'Entró a geocerca',
            tipo: 'geocerca_entrada',
            duracion: ''
          });
          estadoGeocerca = true;
          horaIntervalo = act.fecha_hora;
        } else if (act.evento === 2) {
          eventos.push({
            hora,
            descripcion: 'Inicio de descanso',
            tipo: 'descanso_inicio',
            duracion: ''
          });
        } else if (act.evento === 3) {
          eventos.push({
            hora,
            descripcion: 'Fin de descanso',
            tipo: 'descanso_fin',
            duracion: ''
          });
        }
      }
      
      // Salida laboral
      if (i === ordenadas.length - 1 && act.tipo_registro === 0) {
        if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null) {
          const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: `Tiempo ${estadoGeocerca ? 'dentro' : 'fuera'} de geocerca`,
            tipo: estadoGeocerca ? 'tiempo_dentro' : 'tiempo_fuera',
            duracion: `(${duracion})`
          });
        }
        eventos.push({
          hora,
          descripcion: 'Marcó salida laboral',
          tipo: 'salida',
          duracion: ''
        });
      }
    }
    
    return eventos;
  }

  // Componente para mostrar el resumen del día en web
  const DaySummaryWeb = ({ eventos }) => {
    if (!eventos || eventos.length === 0) return null;

    const getEventColorClass = (tipo) => {
      switch (tipo) {
        case 'entrada':
        case 'geocerca_entrada':
          return 'text-green-700';
        case 'salida':
        case 'geocerca_salida':
          return 'text-red-700';
        case 'descanso_inicio':
        case 'descanso_fin':
          return 'text-yellow-600';
        case 'tiempo_dentro':
        case 'tiempo_fuera':
          return 'text-blue-700';
        default:
          return 'text-gray-700';
      }
    };

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2">
        <h4 className="text-md font-semibold text-green-700 mb-3 pb-2 border-b border-gray-300">
          📋 Resumen del día
        </h4>
        <div className="space-y-2">
          {eventos.map((evento, idx) => (
            <div key={idx} className={`flex items-center py-2 px-3 rounded ${
              idx % 2 === 1 ? 'bg-gray-100' : 'bg-white'
            }`}>
              <div className={`text-sm font-bold min-w-[80px] ${getEventColorClass(evento.tipo)}`}>
                {evento.hora}
              </div>
              <div className="text-sm text-gray-800 flex-1 ml-3">
                {evento.descripcion}
              </div>
              {evento.duracion && (
                <div className="text-xs text-gray-500 italic">
                  {evento.duracion}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Función para calcular estadísticas de un día específico (igual que WebTimelineComponent)
  const calcularEstadisticasDia = (actividades) => {
    if (!actividades || actividades.length === 0) {
      return { horasTrabajadas: 0, horasFuera: 0, horasDescanso: 0 }
    }

    // Usar la misma lógica que WebTimelineComponent para generar intervalos
    const intervalos = [];
    let estadoGeocerca = null;
    let horaIntervalo = null;

    const formatIntervalo = (inicio, fin) => {
      const diffMs = new Date(fin) - new Date(inicio);
      return diffMs / (1000 * 60 * 60); // Convertir a horas
    };

    const pushIntervalo = (inicio, fin, tipo) => {
      if (inicio && fin && inicio !== fin) {
        intervalos.push({
          inicio: new Date(inicio),
          fin: new Date(fin),
          dentro: tipo === 'dentro',
          duracion: formatIntervalo(inicio, fin)
        });
      }
    };

    const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

    // Calcular horas de descanso
    let horasDescanso = 0;
    let inicioDescanso = null;

    for (let i = 0; i < ordenadas.length; i++) {
      const act = ordenadas[i];
      
      // Entrada laboral
      if (i === 0 && act.tipo_registro === 1) {
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        continue;
      }
      
      // Manejar descansos
      if (act.evento === 2) {
        // Inicio de descanso
        inicioDescanso = act.fecha_hora;
      } else if (act.evento === 3 && inicioDescanso) {
        // Fin de descanso
        horasDescanso += formatIntervalo(inicioDescanso, act.fecha_hora);
        inicioDescanso = null;
      }
      
      // Evento de geocerca
      if (typeof act.evento === 'number') {
        if (act.evento === 0) {
          // Salió de geocerca
          if (estadoGeocerca === true && horaIntervalo) {
            pushIntervalo(horaIntervalo, act.fecha_hora, 'dentro');
            estadoGeocerca = false;
            horaIntervalo = act.fecha_hora;
          }
        } else if (act.evento === 1) {
          // Entró a la geocerca
          if (estadoGeocerca === false && horaIntervalo) {
            pushIntervalo(horaIntervalo, act.fecha_hora, 'fuera');
            estadoGeocerca = true;
            horaIntervalo = act.fecha_hora;
          }
        }
      }
      
      // Si cambia el estado de geocerca sin evento explícito
      if (i > 0 && act.dentro_geocerca !== undefined && act.dentro_geocerca !== estadoGeocerca) {
        if (estadoGeocerca !== null && horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
        }
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
      }
      
      // Salida laboral
      if (i === ordenadas.length - 1 && act.tipo_registro === 0) {
        if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null) {
          pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
        }
      }
    }

    // Calcular totales de horas
    const horasTrabajadas = intervalos.filter(i => i.dentro).reduce((total, i) => total + i.duracion, 0);
    const horasFuera = intervalos.filter(i => !i.dentro).reduce((total, i) => total + i.duracion, 0);

    return {
      horasTrabajadas: Math.round(horasTrabajadas * 100) / 100, // Redondear a 2 decimales
      horasFuera: Math.round(horasFuera * 100) / 100,
      horasDescanso: Math.round(horasDescanso * 100) / 100
    }
  }

  // Nueva función: sumar estadísticas por empleado usando lógica diaria
  function calcularEstadisticasEmpleadoPorDias(registros = []) {
    // Agrupar registros por día local
    const actividadesPorDia = {};
    registros.forEach((registro) => {
      const fecha = getLocalDateString(registro.fecha_hora);
      if (!actividadesPorDia[fecha]) actividadesPorDia[fecha] = [];
      actividadesPorDia[fecha].push(registro);
    });
    let totalTrabajadas = 0;
    let totalFuera = 0;
    let totalDescanso = 0;
    Object.values(actividadesPorDia).forEach(acts => {
      const stats = calcularEstadisticasDia(acts);
      totalTrabajadas += stats.horasTrabajadas || 0;
      totalFuera += stats.horasFuera || 0;
      totalDescanso += stats.horasDescanso || 0;
    });
    return {
      workedHours: totalTrabajadas,
      outsideHours: totalFuera,
      restHours: totalDescanso,
    };
  }

  // Resetear currentMonth cuando cambien las fechas - abrir en el mes de la fecha inicial
  useEffect(() => {
    if (startDate && endDate) {
      const newStartMonth = startOfMonth(new Date(startDate))
      setCurrentMonth(newStartMonth)
    }
  }, [startDate, endDate])

  // --- Filtro de empleados por grupo ---
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState("");

  // Cuando cambia el grupo, resetea el filtro de empleados si el empleado no pertenece al grupo
  useEffect(() => {
    if (!selectedGrupo) {
      // Si es "Todos los grupos", no hacer nada especial
      return;
    }
    const empleadosDelGrupo = empleados.filter(emp => emp.grupo === selectedGrupo);
    const existeEmpleado = empleadosDelGrupo.some(emp => emp.id === Number(selectedEmpleado));
    if (!existeEmpleado) {
      handleEmpleadoChange({ target: { value: "" } });
    }
  }, [selectedGrupo, empleados]);

  // --- Actualiza empleadosFiltrados según grupo/empleado seleccionados ---
  useEffect(() => {
    let filtrados = empleados;
    if (selectedGrupo) {
      filtrados = filtrados.filter(emp => emp.grupo === selectedGrupo);
    }
    if (selectedEmpleado) {
      filtrados = filtrados.filter(emp => emp.id === Number(selectedEmpleado));
    }
    setEmpleadosFiltrados(filtrados);
  }, [empleados, selectedGrupo, selectedEmpleado]);

  const employeeHoursData = empleadosFiltrados.map(emp => {
    // Usar la nueva función para sumar correctamente por días
    const stats = calcularEstadisticasEmpleadoPorDias(emp.registros || []);
    return {
      name: emp.name?.split(" ")[0] || emp.name,
      horasTrabajadas: stats.workedHours,
      horasAfuera: stats.outsideHours,
      horasDescanso: stats.restHours,
    };
  })

  // Componente Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatHorasMinutos(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl transition-all duration-300 mb-8">
        {/* Título Panel de Empleados */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="h-6 w-6 text-blue-600" />Panel de Empleados</h2>
        <div className="flex flex-col gap-6">
          {/* Periodo y Fechas */}
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
          {/* Ubicación y acciones */}
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
                  <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-4 h-4 text-purple-500" /> Municipio</label>
              <select
                value={filters.id_municipio}
                onChange={handleMunicipioChange}
                disabled={!filters.id_estado}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar Municipio</option>
                {municipios.map((m) => (
                  <option key={m.id_municipio} value={m.id_municipio}>{m.nombre_municipio}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Building2 className="w-4 h-4 text-blue-500" /> Hospital</label>
              <select
                value={filters.id_hospital}
                onChange={handleHospitalChange}
                disabled={!filters.id_municipio}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar Hospital</option>
                {hospitales.map((h) => (
                  <option key={h.id_hospital} value={h.id_hospital}>{h.nombre_hospital}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Grupo y Empleado */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end mt-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Users className="w-4 h-4 text-blue-500" /> Grupo</label>
              <select value={selectedGrupo} onChange={handleGrupoChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los grupos</option>
                {grupos.map(gr => <option key={gr.nombre} value={gr.nombre}>{gr.nombre}</option>)}
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Users className="w-4 h-4 text-purple-500" /> Empleado</label>
              <select value={selectedEmpleado} onChange={handleEmpleadoChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Todos los empleados</option>
                {empleados.filter(emp => !selectedGrupo || emp.grupo === selectedGrupo).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Botones para grupo/empleado */}
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={handleLimpiarFiltros} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">Limpiar filtros</button>
          </div>
          {/* Rango válido/error */}
          {isValidRange && tempDateRange.startDate && tempDateRange.endDate ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center">
              <Check className="h-4 w-4 text-emerald-500 mr-2" />
              Mostrando {daysDifference + 1} días ({format(new Date(tempDateRange.startDate), "dd/MM/yyyy")} - {format(new Date(tempDateRange.endDate), "dd/MM/yyyy")})
            </div>
          ) : !isValidRange && tempDateRange.startDate && tempDateRange.endDate ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center">
              <Calendar className="h-4 w-4 text-red-500 mr-2" />
              La fecha de inicio debe ser anterior a la fecha final
            </div>
          ) : null}

          {/* Mensaje informativo y vista de datos */}
          <div className="flex flex-col gap-6">
            {/* Vista tabla o calendario */}
            <div className={selectedEmployeeData ? "space-y-6 mt-2" : "flex flex-col gap-6 mt-6"}>
              {!selectedEmployeeData ? (
                <>
                  <div className="bg-white rounded-lg shadow-sm w-full max-h-[500px] overflow-y-auto mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-separate border-spacing-0">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase border-b border-gray-200 w-2/5">Nombre</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase border-b border-gray-200 w-1/6">Hrs Efec</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase border-b border-gray-200 w-1/6">Hrs Justif.</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase border-b border-gray-200 w-1/6">Hrs Fuera</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase border-b border-gray-200 w-1/6">Total Salidas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empleadosFiltrados.map((emp, idx) => {
                            // Calcular estadísticas correctas para cada empleado
                            const stats = calcularEstadisticasEmpleadoPorDias(emp.registros || []);
                            return (
                              <tr key={emp.id} className={
                                `transition-colors border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`
                              }>
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">{emp.name}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-600 text-center">{formatHorasMinutos(stats.workedHours || 0)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-center">{formatHorasMinutos(stats.restHours || 0)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-red-600 text-center">{formatHorasMinutos(stats.outsideHours || 0)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-indigo-600 text-center">{emp.totalExits ?? 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Gráfica de barras de horas trabajadas y fuera */}
                  {employeeHoursData.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4 w-full">
                      <h3 className="text-base font-semibold mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-blue-500" />Comparativo de horas</h3>
                      <div className={`${employeeHoursData.length > 8 ? 'overflow-x-auto' : ''}`}>
                        <div style={{ 
                          minWidth: employeeHoursData.length > 8 ? Math.max(800, employeeHoursData.length * 120) : '100%',
                          width: employeeHoursData.length <= 8 ? '100%' : 'auto'
                        }}>
                          <ResponsiveContainer width="100%" height={350}>
                            <RechartsBarChart 
                              data={employeeHoursData} 
                              margin={{ top: 20, right: 30, left: 20, bottom: employeeHoursData.length > 6 ? 60 : 30 }}
                              barCategoryGap={employeeHoursData.length > 6 ? '8%' : '15%'}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 12 }} 
                                interval={0} 
                                angle={employeeHoursData.length > 6 ? -30 : 0} 
                                textAnchor={employeeHoursData.length > 6 ? "end" : "middle"}
                                height={employeeHoursData.length > 6 ? 60 : 30}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Bar dataKey="horasTrabajadas" fill="#10b981" name="Hrs Efec" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="horasAfuera" fill="#ef4444" name="Hrs Fuera" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* --- EmployeeCalendarView (inline) --- */}
                  <div className="bg-white rounded-lg shadow-sm p-6 w-full">
                    {/* Calendario visual y lógica correspondiente */}
                    <div className="flex flex-col gap-2">
                      {/* Encabezado con título y botón */}
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Calendario de actividades - {selectedEmployeeData.name}
                        </h3>
                        <button
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 text-sm"
                          disabled={loadingPDF}
                          onClick={async () => {
                            setLoadingPDF(true)
                            const eventsByDay = {}
                            try {
                              // Usar solo un fetch para todo el rango
                              const fechaInicio = `${startDate} 00:00:00`
                              const fechaFin = `${endDate} 23:59:59`
                              const res = await fetch("https://geoapphospital.onrender.com/api/reportes/empleado", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  empleadoId: employee.id,
                                  fechaInicio,
                                  fechaFin,
                                }),
                              })
                              const data = await res.json()
                              // Agrupar actividades por día (yyyy-MM-dd)
                              if (Array.isArray(data.actividades)) {
                                data.actividades.forEach((act) => {
                                  const dateStr = act.fecha_hora.slice(0, 10)
                                  if (!eventsByDay[dateStr]) eventsByDay[dateStr] = []
                                  eventsByDay[dateStr].push(act)
                                })
                              }
                              // Mapear empleado a formato PDF
                              const empleadoPDF = {
                                name: `${employee.nombre || employee.name || ''} ${employee.ap_paterno || ''} ${employee.ap_materno || ''}`.trim(),
                                schedule: '45 horas semanales a cumplir',
                                grupo: employee.grupo || employee.nombre_grupo || '',
                                hospital: filters.nombre_hospital || employee.hospital || employee.nombre_hospital || '',
                                estado: filters.nombre_estado || employee.estado || employee.nombre_estado || '',
                                municipio: filters.nombre_municipio || employee.municipio || employee.nombre_municipio || '',
                              }
                              await generarReporteEmpleadoPDF({
                                empleado: empleadoPDF,
                                startDate,
                                endDate,
                                eventsByDay,
                              })
                            } catch (err) {
                              console.error('Error real al generar el PDF:', err);
                              alert("Error al generar el PDF con datos reales. Revisa la consola para más detalles.");
                            }
                            setLoadingPDF(false)
                          }}
                        >
                          {loadingPDF ? (
                            <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-blue-400 rounded-full"></span> Generando PDF...</span>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Descargar Reporte PDF
                            </>
                          )}
                        </button>
                      </div>

                      {/* Información adicional centrada */}
                      <div className="text-center mb-3">
                        <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
                          💡 Haz clic en cualquier día del período para ver las actividades del empleado
                        </div>
                      </div>

                      {/* Navegación entre meses */}
                      {showNavigation && (
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2 mb-3">
                          <button
                            onClick={() => canNavigatePrevious && setCurrentMonth(subMonths(currentMonth, 1))}
                            disabled={!canNavigatePrevious}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border shadow-sm ${
                              canNavigatePrevious 
                                ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white hover:shadow-md' 
                                : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="text-sm">Mes anterior</span>
                          </button>
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-700">
                              {format(currentMonth, "MMMM yyyy", { locale: es })}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Período: {format(new Date(startDate), "dd/MM/yyyy", { locale: es })} - {format(new Date(endDate), "dd/MM/yyyy", { locale: es })}
                            </div>
                          </div>
                          <button
                            onClick={() => canNavigateNext && setCurrentMonth(addMonths(currentMonth, 1))}
                            disabled={!canNavigateNext}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border shadow-sm ${
                              canNavigateNext 
                                ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white hover:shadow-md' 
                                : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <span className="text-sm">Mes siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {/* Encabezados de días de la semana */}
                      <div className="grid grid-cols-7 gap-2 mb-1 mt-2">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Leyenda del calendario */}
                      <div className="flex flex-wrap justify-center gap-4 text-xs bg-gray-50 rounded-lg p-2 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded border"></div>
                          <span className="text-gray-600">Hoy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                          <span className="text-gray-600">Con actividades</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                          <span className="text-gray-600">Sin actividades</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                          <span className="text-gray-600">Fuera del período</span>
                        </div>
                      </div>

                      {/* Calendario mensual - renderizado por filas */}
                      <div className="space-y-1 mt-2">
                        {(() => {
                          // Obtener todas las fechas del mes
                          const monthDates = eachDayOfInterval({ 
                            start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), 
                            end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }) 
                          })
                          
                          // Agrupar por semanas (filas de 7 días)
                          const weeks = []
                          for (let i = 0; i < monthDates.length; i += 7) {
                            weeks.push(monthDates.slice(i, i + 7))
                          }
                          
                          return weeks.map((week, weekIndex) => {
                            // Verificar si algún día de esta semana está seleccionado
                            const selectedDayInWeek = selectedDay ? week.find(date => isSameDay(date, selectedDay)) : null
                            
                            return (
                              <div key={weekIndex} className="space-y-2">
                                {/* Fila de días de la semana */}
                                <div className="grid grid-cols-7 gap-2">
                                  {week.map((date) => {
                                    const isInRange = date >= new Date(startDate) && date <= new Date(endDate)
                                    const isToday = isSameDay(date, new Date())
                                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                                    const dayActivities = calendarData.find(cal => {
                                      const calendarDateStr = cal.fecha // YYYY-MM-DD
                                      const currentDateStr = getLocalDateString(date.toISOString())
                                      return calendarDateStr === currentDateStr
                                    })?.actividades || []
                                    const isSelected = selectedDay && isSameDay(date, selectedDay)
                                    
                                    return (
                                      <div
                                        key={date}
                                        className={`min-h-[80px] p-2 rounded-lg transition-all duration-200 border ${
                                          !isCurrentMonth 
                                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                            : isSelected
                                              ? "bg-orange-100 border-orange-400 text-orange-800 ring-2 ring-orange-300"
                                              : isToday 
                                                ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 cursor-pointer" 
                                                : !isInRange 
                                                  ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" 
                                                  : dayActivities.length > 0
                                                    ? "bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer"
                                                    : "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer"
                                        }`}
                                        onClick={() => {
                                          if (isCurrentMonth && (isInRange || isToday)) {
                                            const isCurrentlySelected = selectedDay && isSameDay(date, selectedDay)
                                            if (isCurrentlySelected) {
                                              // Deseleccionar si ya está seleccionado
                                              setSelectedDay(null)
                                              setHourlyData([])
                                            } else {
                                              // Seleccionar nuevo día
                                              setSelectedDay(date)
                                              setHourlyData(dayActivities)
                                            }
                                          }
                                        }}
                                      >
                                        <div className={`text-sm font-bold mb-1 ${
                                          !isCurrentMonth 
                                            ? "text-gray-400" 
                                            : isSelected
                                              ? "text-orange-800"
                                              : isToday 
                                                ? "text-white" 
                                                : !isInRange
                                                  ? "text-gray-400"
                                                  : "text-gray-700"
                                        }`}>
                                          {format(date, "d")}
                                        </div>
                                        
                                        {/* Indicador de "HOY" */}
                                        {isToday && (
                                          <div className="text-center mb-1">
                                            <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                                              HOY
                                            </span>
                                          </div>
                                        )}
                                        
                                        {isCurrentMonth && (isInRange || isToday) && (
                                          <div className="text-xs">
                                            {dayActivities.length > 0 ? (
                                              <>
                                                {(() => {
                                                  const dayStats = calcularEstadisticasDia(dayActivities)
                                                  return (
                                                    <>
                                                      <div className={`text-center px-1 py-0.5 rounded text-xs mb-1 ${
                                                        isSelected
                                                          ? "bg-orange-200 text-orange-800"
                                                          : isToday 
                                                            ? "bg-white/20 text-white" 
                                                            : "bg-green-600 text-white"
                                                      }`}>
                                                        <div className="font-semibold">
                                                          {formatHorasMinutos(dayStats.horasTrabajadas)} trabajadas
                                                        </div>
                                                      </div>
                                                      {dayStats.horasFuera > 0 && (
                                                        <div className={`text-center px-1 py-0.5 rounded text-xs ${
                                                          isSelected
                                                            ? "bg-red-100 text-red-700"
                                                            : isToday 
                                                              ? "bg-white/20 text-white" 
                                                              : "bg-red-500 text-white"
                                                        }`}>
                                                          {formatHorasMinutos(dayStats.horasFuera)} fuera
                                                        </div>
                                                      )}
                                                    </>
                                                  )
                                                })()}
                                              </>
                                            ) : (
                                              <div className={`text-center text-xs mt-2 ${
                                                isSelected 
                                                  ? "text-orange-600" 
                                                  : isToday ? "text-white/80" : "text-gray-500"
                                              }`}>
                                                Sin actividades
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                
                                {/* Tarjeta de actividades si hay un día seleccionado en esta fila */}
                                {selectedDayInWeek && (
                                  <div className="bg-white rounded-lg p-2 border border-orange-200 shadow-sm">
                                    <div className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                      <Calendar className="h-5 w-5 text-orange-500" />
                                      Resumen del {format(selectedDayInWeek, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                                    </div>
                                    
                                    {hourlyData.length > 0 ? (
                                      <>
                                        {/* Estadísticas rápidas */}
                                        <div className="grid grid-cols-3 gap-4 mb-2">
                                          {(() => {
                                            const dayStats = calcularEstadisticasDia(hourlyData);
                                            return (
                                              <>
                                                <div className="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-200">
                                                  <div className="text-lg font-bold text-yellow-700">{formatHorasMinutos(dayStats.horasDescanso)}</div>
                                                  <div className="text-sm text-yellow-600">Hrs Descanso</div>
                                                </div>
                                                <div className="bg-green-50 rounded-lg p-2 text-center border border-green-200">
                                                  <div className="text-lg font-bold text-green-700">{formatHorasMinutos(dayStats.horasTrabajadas)}</div>
                                                  <div className="text-sm text-green-600">Hrs Trabajadas</div>
                                                </div>
                                                <div className="bg-red-50 rounded-lg p-2 text-center border border-red-200">
                                                  <div className="text-lg font-bold text-red-700">{formatHorasMinutos(dayStats.horasFuera)}</div>
                                                  <div className="text-sm text-red-600">Hrs Fuera</div>
                                                </div>
                                              </>
                                            )
                                          })()}
                                        </div>
                                        
                                        {/* Cronología del día */}
                                        <div>
                                          <WebTimelineComponent 
                                            actividades={hourlyData} 
                                            titulo="Cronología del día"
                                          />
                                        </div>
                                        
                                        {/* Resumen del día - Más pegado a la cronología */}
                                        <div>
                                          <DaySummaryWeb eventos={generarResumenDiaMejorado(hourlyData)} />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="bg-white rounded-lg shadow-sm p-4">
                                        <div className="text-gray-500 text-center text-sm py-8">
                                          <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                          Sin actividades registradas para este día
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                  {/* --- Fin EmployeeCalendarView --- */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}