"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, MapPin, Clock, Check, TrendingUp, Building2, X, Download } from "lucide-react"
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
} from "recharts"
import {
  format,
  subDays,
  subMonths,
  subYears,
  isAfter,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  differenceInDays,
} from "date-fns"
import { es } from "date-fns/locale"
import "react-calendar/dist/Calendar.css"
import { generarReporteEmpleadoPDF } from "./reportes/EmployeeReportPDF"
import GrupoDashboard from './GrupoDashboard'
import EmpleadoDashboard from './Empleadodashboard'
import { useAuth } from "../../../context/AuthContext"

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

// Genera datos mejorados para el calendario basado en registros reales
const generateEmployeeCalendarData = (employeeData, startDate, endDate) => {
  const days = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  })

  const employee = employeeData
  if (!employee) {
    return days.map((day) => ({
      date: day,
      totalHours: 0,
      status: "error",
      notes: "Empleado no encontrado",
    }))
  }

  // Importar la función de cálculo de estadísticas
  const calcularEstadisticasEmpleado = (registros = []) => {
    let totalDentro = 0;
    let totalFuera = 0;
    let totalDescanso = 0;
    let totalSalidas = 0;
    let estadoGeocerca = null;
    let horaIntervalo = null;
    let inicioDescanso = null;
    
    const ordenadas = registros.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    
    for (let i = 0; i < ordenadas.length; i++) {
      const act = ordenadas[i];
      
      if (i === 0) {
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        continue;
      }
      
      if (typeof act.evento === 'number') {
        // Manejo de descansos
        if (act.evento === 2) {
          inicioDescanso = act.fecha_hora;
        } else if (act.evento === 3 && inicioDescanso) {
          totalDescanso += (new Date(act.fecha_hora) - new Date(inicioDescanso));
          inicioDescanso = null;
        }
        
        // Manejo de geocerca
        if (act.evento === 0 && estadoGeocerca === true && horaIntervalo) {
          totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          estadoGeocerca = false;
          horaIntervalo = act.fecha_hora;
          totalSalidas++;
        } else if (act.evento === 1 && estadoGeocerca === false && horaIntervalo) {
          totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          estadoGeocerca = true;
          horaIntervalo = act.fecha_hora;
        }
      }
      
      if (i === ordenadas.length - 1 && horaIntervalo && estadoGeocerca !== null) {
        if (estadoGeocerca) {
          totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        } else {
          totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        }
      }
    }
    
    return {
      workedHours: +(totalDentro / 3600000).toFixed(2),
      outsideHours: +(totalFuera / 3600000).toFixed(2),
      restHours: +(totalDescanso / 3600000).toFixed(2),
      totalExits: totalSalidas,
    };
  };

  // Agrupar registros por día si el empleado tiene registros
  const registrosPorDia = {};
  if (employee.registros && Array.isArray(employee.registros)) {
    employee.registros.forEach((registro) => {
      const fecha = registro.fecha_hora.slice(0, 10); // yyyy-MM-dd
      if (!registrosPorDia[fecha]) registrosPorDia[fecha] = [];
      registrosPorDia[fecha].push(registro);
    });
  }

  return days.map((day) => {
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const fechaStr = format(day, 'yyyy-MM-dd');

    if (isWeekend) {
      return {
        date: day,
        totalHours: 0,
        status: "weekend",
        notes: "Fin de semana",
      }
    }

    // Verificar si hay registros para este día
    const registrosDia = registrosPorDia[fechaStr] || [];
    
    if (registrosDia.length === 0) {
      return {
        date: day,
        totalHours: 0,
        status: "absence",
        notes: "Sin actividades",
        workedHours: 0,
        outsideHours: 0,
        restHours: 0,
      }
    }

    // Calcular estadísticas reales para este día
    const stats = calcularEstadisticasEmpleado(registrosDia);
    const totalHours = stats.workedHours + stats.outsideHours;

    return {
      date: day,
      totalHours: totalHours,
      status: totalHours > 0 ? "completed" : "absence",
      notes: totalHours > 0 ? "Con actividades" : "Sin actividades",
      workedHours: stats.workedHours,
      outsideHours: stats.outsideHours,
      restHours: stats.restHours,
      totalExits: stats.totalExits,
    }
  })
}

// Genera eventos realistas de geocerca para un día específico
const generateRealisticGeofenceEvents = (date, employee) => {
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    return []
  }

  // Horario ejemplo mejorado: 7:00 AM - 4:00 PM con salida de 11:00-11:30
  return [
    {
      time: "07:00",
      type: "entry",
      location: "inside",
      description: "Entrada - Inicio de jornada",
    },
    {
      time: "11:00",
      type: "exit",
      location: "outside",
      description: "Salida temporal - Gestión externa",
    },
    {
      time: "11:30",
      type: "entry",
      location: "inside",
      description: "Regreso - Continuación de labores",
    },
    {
      time: "16:00",
      type: "exit",
      location: "outside",
      description: "Salida - Fin de jornada",
    },
  ]
}

// Genera datos mejorados por hora para un día específico usando datos reales
const generateEnhancedHourlyData = (dayData, employee) => {
  if (!dayData || dayData.status !== "completed") {
    return {
      hours: [],
      events: [],
      metrics: { workedHours: 0, outsideHours: 0, totalHours: 0 },
    }
  }

  // Usar los datos reales calculados del día
  const metrics = {
    workedHours: dayData.workedHours || 0,
    outsideHours: dayData.outsideHours || 0,
    totalHours: (dayData.workedHours || 0) + (dayData.outsideHours || 0),
  };

  // Si no hay datos reales, usar datos de ejemplo
  if (metrics.totalHours === 0) {
    const events = generateRealisticGeofenceEvents(dayData.date, employee)
    const hours = []

    // Horario de 7:00 a 16:00
    const startHour = 7
    const endHour = 16

    for (let i = 0; i < endHour - startHour; i++) {
      const hour = startHour + i
      const hourLabel = `${hour.toString().padStart(2, "0")}:00`

      // Lógica de ejemplo cuando no hay datos reales
      let isInside = false
      let hasEntry = false
      let hasExit = false

      if (hour >= 7 && hour < 11) {
        isInside = true
      } else if (hour >= 11 && hour < 12) {
        isInside = false
      } else if (hour >= 12 && hour < 16) {
        isInside = true
      }

      // Verificar eventos en esta hora
      for (const event of events) {
        const eventHour = Number.parseInt(event.time.split(":")[0])
        if (eventHour === hour) {
          if (event.type === "entry") hasEntry = true
          if (event.type === "exit") hasExit = true
        }
      }

      hours.push({
        hour: hourLabel,
        status: isInside ? "inside" : "outside",
        hasEntry,
        hasExit,
        events: events.filter((e) => {
          const eventHour = Number.parseInt(e.time.split(":")[0])
          return eventHour === hour
        }),
      })
    }

    return {
      hours,
      events,
      metrics: { workedHours: 8.5, outsideHours: 0.5, totalHours: 9 },
    }
  }

  // Obtener registros reales para este día específico
  const fechaStr = format(dayData.date, 'yyyy-MM-dd');
  const registrosDia = [];
  
  if (employee.registros && Array.isArray(employee.registros)) {
    employee.registros.forEach((registro) => {
      const fechaRegistro = registro.fecha_hora.slice(0, 10);
      if (fechaRegistro === fechaStr) {
        registrosDia.push(registro);
      }
    });
  }

  // Generar eventos basados en los registros reales
  const events = [];
  registrosDia.forEach((registro) => {
    const fecha = new Date(registro.fecha_hora);
    const time = format(fecha, 'HH:mm');
    
    if (typeof registro.evento === 'number') {
      if (registro.evento === 0) { // Salida de geocerca
        events.push({
          time,
          type: "exit",
          location: "outside",
          description: "Salida de geocerca",
        });
      } else if (registro.evento === 1) { // Entrada a geocerca
        events.push({
          time,
          type: "entry", 
          location: "inside",
          description: "Entrada a geocerca",
        });
      } else if (registro.evento === 2) { // Inicio descanso
        events.push({
          time,
          type: "break_start",
          location: "rest",
          description: "Inicio de descanso",
        });
      } else if (registro.evento === 3) { // Fin descanso
        events.push({
          time,
          type: "break_end",
          location: "rest", 
          description: "Fin de descanso",
        });
      }
    }
  });

  // Generar vista por horas basada en actividad real
  const hours = [];
  const startHour = 6; // Ampliar rango para captar más actividad
  const endHour = 18;

  for (let i = 0; i < endHour - startHour; i++) {
    const hour = startHour + i;
    const hourLabel = `${hour.toString().padStart(2, "0")}:00`;
    
    // Verificar eventos en esta hora
    const eventsInHour = events.filter((e) => {
      const eventHour = Number.parseInt(e.time.split(":")[0]);
      return eventHour === hour;
    });

    const hasEntry = eventsInHour.some(e => e.type === "entry");
    const hasExit = eventsInHour.some(e => e.type === "exit");

    // Determinar estado basado en actividad (simplificado)
    let status = "outside"; // Por defecto fuera
    if (hour >= 7 && hour < 17) { // Horario laboral probable
      status = "inside"; // Asumir dentro durante horario laboral
    }

    hours.push({
      hour: hourLabel,
      status,
      hasEntry,
      hasExit,
      events: eventsInHour,
    });
  }

  return {
    hours,
    events,
    metrics,
  }
}

const EmployeeCalendarView = ({ employee, startDate, endDate, filters }) => {
  const [calendarData, setCalendarData] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [hourlyData, setHourlyData] = useState([])
  const [loadingPDF, setLoadingPDF] = useState(false)

  // Calcular si debe mostrar navegación
  const daysDiff = differenceInDays(new Date(endDate), new Date(startDate))
  const showNavigation = daysDiff > 7

  // Calcular las semanas a mostrar basado en el rango de fechas
  const startWeek = startOfWeek(new Date(startDate), { weekStartsOn: 1 })
  const endWeek = endOfWeek(new Date(endDate), { weekStartsOn: 1 })
  const totalWeeks = Math.ceil(differenceInDays(endWeek, startWeek) / 7)

  const [currentWeekStart, setCurrentWeekStart] = useState(startWeek)

  useEffect(() => {
    const data = generateEmployeeCalendarData(employee, startDate, endDate)
    setCalendarData(data)
    setSelectedDay(null)
    setHourlyData([])
  }, [employee, startDate, endDate])

  // Mostrar solo las semanas dentro del rango
  const weeksToShow = Math.min(totalWeeks, 4) // Máximo 4 semanas
  const allWeeks = []

  for (let i = 0; i < weeksToShow; i++) {
    const weekStart = addWeeks(currentWeekStart, i)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    allWeeks.push({ weekStart, weekEnd, weekDays })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
      case "absence":
        return "bg-red-100 border-red-300 text-red-800"
      case "weekend":
        return "bg-gray-100 border-gray-300 text-gray-600"
      default:
        return "bg-gray-100 border-gray-300 text-gray-600"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓"
      case "absence":
        return "✗"
      case "weekend":
        return "🏠"
      default:
        return ""
    }
  }

  const getDayData = (day) => {
    return calendarData.find((data) => isSameDay(data.date, day))
  }

  const handleDayClick = (dayData) => {
    if (dayData && dayData.status === "completed") {
      setSelectedDay(dayData)
      const hourlyInfo = generateEnhancedHourlyData(dayData, employee)
      setHourlyData(hourlyInfo)
    }
  }

  const goToPreviousWeek = () => {
    const newStart = subWeeks(currentWeekStart, 1)
    if (newStart >= startWeek) {
      setCurrentWeekStart(newStart)
    }
  }

  const goToNextWeek = () => {
    const newStart = addWeeks(currentWeekStart, 1)
    const maxStart = subWeeks(endWeek, weeksToShow - 1)
    if (newStart <= maxStart) {
      setCurrentWeekStart(newStart)
    }
  }

  // Calcular totales solo para días laborales
  const workDays = calendarData.filter((day) => day.status !== "weekend")
  const totalHours = workDays.reduce((total, day) => total + (day.totalHours || 0), 0)
  const completedDays = workDays.filter((day) => day.status === "completed").length
  const absenceDays = workDays.filter((day) => day.status === "absence").length

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 w-full">
      {/* Botón de descarga de PDF mejorado */}
      <div className="flex justify-end mb-4">
        <button
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60"
          disabled={loadingPDF}
          onClick={async () => {
            setLoadingPDF(true)
            const eventsByDay = {}
            try {
              // Usar solo un fetch para todo el rango
              const fechaInicio = `${startDate} 00:00:00`
              const fechaFin = `${endDate} 23:59:59`
              const res = await fetch("https://geoapphospital-b0yr.onrender.com/api/reportes/empleado", {
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
              // Debug: Mostrar datos antes de generar el PDF
              console.log('Intentando generar PDF con:', {
                empleado: empleadoPDF,
                calendarData,
                startDate,
                endDate,
                eventsByDay
              });
              await generarReporteEmpleadoPDF({
                empleado: empleadoPDF,
                calendarData,
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Calendario de {employee.name}</h3>
          <p className="text-sm text-gray-600">
            Horario: {employee.schedule} | Grupo: {employee.grupo}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            💡 Ejemplo: Entrada 7:00, Salida temporal 11:00-11:30, Salida final 16:00
          </p>
        </div>
        {showNavigation && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Período:</span> {format(new Date(startDate), "dd MMM", { locale: es })} -{" "}
              {format(new Date(endDate), "dd MMM yyyy", { locale: es })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousWeek}
                disabled={currentWeekStart <= startWeek}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <button
                onClick={goToNextWeek}
                disabled={addWeeks(currentWeekStart, weeksToShow) >= endWeek}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumen mejorado */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 text-center border border-emerald-200">
          <div className="text-3xl font-bold text-emerald-600">{Math.round(totalHours)}h</div>
          <div className="text-sm text-emerald-700">Total Horas</div>
          <div className="text-xs text-emerald-600 mt-1">
            {completedDays > 0 ? `${(totalHours / completedDays).toFixed(1)}h promedio` : ""}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{completedDays}</div>
          <div className="text-sm text-blue-700">Días Cumplidos</div>
          <div className="text-xs text-blue-600 mt-1">
            {workDays.length > 0 ? `${((completedDays / workDays.length) * 100).toFixed(0)}% asistencia` : ""}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 text-center border border-red-200">
          <div className="text-3xl font-bold text-red-600">{absenceDays}</div>
          <div className="text-sm text-red-700">Ausencias</div>
          <div className="text-xs text-red-600 mt-1">
            {completedDays > 0 ? `${(completedDays * 0.5).toFixed(1)}h fuera total` : ""}
          </div>
        </div>
      </div>

      {/* Resto del componente calendario... */}
      <div className="space-y-6">
        {allWeeks.map((week, weekIndex) => {
          const validDays = week.weekDays.filter((day) => day >= new Date(startDate) && day <= new Date(endDate))

          if (validDays.length === 0) return null

          const selectedDayInWeek = selectedDay && week.weekDays.some((day) => isSameDay(selectedDay.date, day))

          return (
            <div key={weekIndex} className="border rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">
                {format(week.weekStart, "dd MMM", { locale: es })} -{" "}
                {format(week.weekEnd, "dd MMM yyyy", { locale: es })}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {week.weekDays.map((day) => {
                  const dayData = getDayData(day)
                  const isInRange = day >= new Date(startDate) && day <= new Date(endDate)
                  const isSelected = selectedDay && isSameDay(selectedDay.date, day)

                  if (!isInRange) {
                    return <div key={day.toISOString()} className="min-h-[100px]"></div>
                  }

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(dayData)}
                      className={`min-h-[100px] border-2 rounded-lg p-3 transition-all duration-200 ${
                        dayData ? getStatusColor(dayData.status) : "bg-gray-50 border-gray-200"
                      } ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{format(day, "d")}</span>
                        <span className="text-lg">{dayData ? getStatusIcon(dayData.status) : ""}</span>
                      </div>

                      {dayData && dayData.status === "completed" && (
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-600">{dayData.totalHours.toFixed(1)}h</div>
                          <div className="text-xs text-emerald-700">Click para detalles</div>
                          <div className="text-xs text-orange-600 mt-1">
                            {dayData.outsideHours > 0 ? `${dayData.outsideHours.toFixed(1)}h fuera` : 'Sin salidas'}
                          </div>
                        </div>
                      )}

                      {dayData && dayData.status === "absence" && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-red-600">Ausencia</div>
                        </div>
                      )}

                      {dayData && dayData.status === "weekend" && (
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Fin de semana</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Vista detallada del día seleccionado mejorada */}
              {selectedDayInWeek && selectedDay && hourlyData.hours && hourlyData.hours.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">
                          📅{" "}
                          {format(selectedDay.date, "dd 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Seguimiento detallado de geocerca - Horario realista
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span>Dentro</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Fuera</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Evento</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDay(null)
                            setHourlyData([])
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Estadísticas del día mejoradas */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-emerald-100 rounded-lg p-3 text-center border border-emerald-200">
                        <div className="text-xl font-bold text-emerald-600">{hourlyData.metrics.workedHours.toFixed(1)}h</div>
                        <div className="text-xs text-emerald-700">Trabajadas</div>
                        <div className="text-xs text-emerald-600 mt-1">Tiempo en geocerca</div>
                      </div>
                      <div className="bg-red-100 rounded-lg p-3 text-center border border-red-200">
                        <div className="text-xl font-bold text-red-600">{hourlyData.metrics.outsideHours.toFixed(1)}h</div>
                        <div className="text-xs text-red-700">Fuera</div>
                        <div className="text-xs text-red-600 mt-1">Tiempo fuera de geocerca</div>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">{hourlyData.metrics.totalHours.toFixed(1)}h</div>
                        <div className="text-xs text-blue-700">Total</div>
                        <div className="text-xs text-blue-600 mt-1">Tiempo total registrado</div>
                      </div>
                    </div>

                    {/* Timeline mejorado */}
                    <div className="relative bg-white rounded-lg p-4 border border-gray-200">
                      <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-300 rounded-full transform -translate-y-1/2"></div>

                      <div className="relative flex justify-between items-center py-6">
                        {hourlyData.hours.map((hourData, index) => {
                          const isInside = hourData.status === "inside"

                          return (
                            <div key={hourData.hour} className="flex flex-col items-center relative">
                              <div
                                className={`w-6 h-6 rounded-full border-2 border-white shadow-md z-10 flex items-center justify-center ${
                                  isInside ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              >
                                {(hourData.hasEntry || hourData.hasExit) && (
                                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-white flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 text-xs font-medium text-gray-700">{hourData.hour}</div>

                              {(hourData.hasEntry || hourData.hasExit) && (
                                <div className="mt-1 text-xs text-center space-y-0.5">
                                  {hourData.hasEntry && (
                                    <div className="text-emerald-600 font-medium bg-emerald-50 px-1 py-0.5 rounded text-xs">
                                      ↓ Entrada
                                    </div>
                                  )}
                                  {hourData.hasExit && (
                                    <div className="text-red-600 font-medium bg-red-50 px-1 py-0.5 rounded text-xs">
                                      ↑ Salida
                                    </div>
                                  )}
                                </div>
                              )}

                              {index < hourlyData.hours.length - 1 && (
                                <div
                                  className={`absolute top-1/2 left-3 h-1 rounded-full transform -translate-y-1/2 z-5 ${
                                    isInside ? "bg-emerald-400" : "bg-red-400"
                                  }`}
                                  style={{
                                    width: `calc(100% - 1.5rem)`,
                                  }}
                                ></div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Resumen de eventos mejorado */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                      <h5 className="font-semibold text-gray-800 mb-2 text-sm">Eventos del día</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {hourlyData.events.map((event, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1 p-2 rounded border ${
                              event.type === "entry"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-800 border-red-200"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                event.type === "entry" ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            ></div>
                            <div>
                              <div className="font-medium">{event.time}</div>
                              <div className="text-xs opacity-75">{event.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-3 text-xs text-gray-600 text-center bg-blue-50 rounded-lg p-2">
                      <strong>Horario programado:</strong> {employee.schedule} | <strong>Tiempo fuera:</strong> 30
                      minutos (11:00-11:30) | <strong>Eficiencia:</strong> 94.4% (8.5h de 9h)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda mejorada */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded"></div>
          <span>Horas cumplidas (8.5h trabajadas)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Ausencia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Fin de semana</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span>30min fuera de geocerca por día</span>
        </div>
      </div>
    </div>
  )
}

// Resto del componente HospitalDashboard permanece igual...
const HospitalDashboard = () => {
  // --- HOOKS DE AUTENTICACIÓN ---
  const { userRole, userId } = useAuth()
  
  // --- ESTADOS PARA CONTROL DE SELECCIÓN AUTOMÁTICA ---
  const [userStateCode, setUserStateCode] = useState("") // Estado del administrador
  const [userMunicipalityCode, setUserMunicipalityCode] = useState("") // Municipio del administrador
  const [userHospitalCode, setUserHospitalCode] = useState("") // Hospital del administrador
  const [isStateDisabled, setIsStateDisabled] = useState(false) // Controla si el selector de estado está deshabilitado
  const [isMunicipalityDisabled, setIsMunicipalityDisabled] = useState(false) // Controla si el selector de municipio está deshabilitado
  const [isHospitalDisabled, setIsHospitalDisabled] = useState(false) // Controla si el selector de hospital está deshabilitado
  const [isLoadingUserLocation, setIsLoadingUserLocation] = useState(false) // Indica si está cargando la ubicación del usuario

  // Estados para los filtros avanzados de fecha
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })

  // Estados para el filtro de fechas mejorado
  const [selectedPreset, setSelectedPreset] = useState("30d")
  const [hasChanges, setHasChanges] = useState(false)
  const [tempDateRange, setTempDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })

  // Estados para filtros detallados
  const [selectedGrupo, setSelectedGrupo] = useState("")
  const [selectedEmpleado, setSelectedEmpleado] = useState("")
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
  const [fechaFin, setFechaFin] = useState(format(new Date(), "yyyy-MM-dd"))
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([])
  const [empleadosBaseCargados, setEmpleadosBaseCargados] = useState(false)

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
          (new Date(tempDateRange.endDate).getTime() - new Date(tempDateRange.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0

  // Estados para los filtros de ubicación alineados con la estructura
  const [filters, setFilters] = useState({
    id_estado: "",
    id_municipio: "",
    id_hospital: "",
    nombre_estado: "",
    nombre_municipio: "",
    nombre_hospital: "",
  })

  const [estados, setEstados] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [hospitales, setHospitales] = useState([])
  const [grupos, setGrupos] = useState([
    { id: 1, nombre: "Limpieza" },
    { id: 2, nombre: "Mantenimiento" },
    { id: 3, nombre: "Vigilancia" },
    { id: 4, nombre: "Camilleros" },
    { id: 5, nombre: "Enfermería" },
  ])

  // Estados para los datos
  const [empleados, setEmpleados] = useState([])

  // Cargar estados
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch("https://geoapphospital-b0yr.onrender.com/api/superadmin/estados")
        const data = await res.json()
        setEstados(data)
      } catch (error) {
        console.error("Error al obtener estados:", error)
      }
    }
    fetchEstados()
  }, [])

  // --- FUNCIONES PARA OBTENER DATOS DEL USUARIO SEGÚN ROL ---
  
  // Función para obtener el hospital del administrador hospitalario
  const fetchUserHospital = async () => {
    console.log('[Debug] fetchUserHospital called - userRole:', userRole, 'userId:', userId);
    
    if (userRole !== "hospitaladmin" || !userId) {
      console.log('[Debug] No es hospitaladmin o no hay userId, saltando...');
      return;
    }
    
    setIsLoadingUserLocation(true);
    
    try {
      console.log('[Debug] Fetching hospital for hospitaladmin with userId:', userId);
      const response = await fetch(`https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/hospital-by-user/${userId}`);
      console.log('[Debug] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Debug] Response error:', errorText);
        throw new Error(`Error al obtener el hospital del usuario: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Debug] Response data:', data);
      
      // Manejar tanto respuestas de array como objetos individuales
      const hospitalData = Array.isArray(data) ? data[0] : data;
      
      if (hospitalData && hospitalData.nombre_hospital && hospitalData.nombre_municipio && hospitalData.nombre_estado) {
        const hospitalFromAPI = hospitalData.nombre_hospital.toLowerCase().trim();
        const municipioFromAPI = hospitalData.nombre_municipio.toLowerCase().trim();
        const estadoFromAPI = hospitalData.nombre_estado.toLowerCase().trim();
        console.log('[Debug] Hospital encontrado:', hospitalFromAPI, 'Municipio:', municipioFromAPI, 'Estado:', estadoFromAPI);
        
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
                  
                  // Después de configurar el municipio, cargar hospitales y seleccionar el del usuario
                  setTimeout(async () => {
                    try {
                      const hospitalesResponse = await fetch(`https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${estadoEncontrado.id_estado}&id_municipio=${municipioEncontrado.id_municipio}`);
                      if (hospitalesResponse.ok) {
                        const hospitalesData = await hospitalesResponse.json();
                        setHospitales(hospitalesData);
                        
                        // Buscar el hospital específico
                        const hospitalEncontrado = hospitalesData.find(hospital => 
                          hospital.nombre_hospital.toLowerCase().trim() === hospitalFromAPI
                        );
                        
                        if (hospitalEncontrado) {
                          setUserHospitalCode(hospitalEncontrado.id_hospital);
                          setFilters(prev => ({
                            ...prev,
                            id_hospital: hospitalEncontrado.id_hospital,
                            nombre_hospital: hospitalEncontrado.nombre_hospital
                          }));
                          setIsHospitalDisabled(true);
                          console.log(`[HospitalDashboard] ✅ Hospital del administrador hospitalario configurado: ${hospitalEncontrado.nombre_hospital} (${hospitalEncontrado.id_hospital})`);
                        } else {
                          console.error('[Debug] ❌ No se encontró hospital en la lista:', hospitalFromAPI);
                        }
                      }
                    } catch (error) {
                      console.error('[Debug] ❌ Error al cargar hospitales para hospitaladmin:', error);
                    }
                  }, 500);
                  
                } else {
                  console.error('[Debug] ❌ No se encontró municipio en la lista:', municipioFromAPI);
                }
              }
            } catch (error) {
              console.error('[Debug] ❌ Error al cargar municipios para hospitaladmin:', error);
            }
          }, 500);
          
        } else {
          console.error('[Debug] ❌ No se encontró estado en la lista:', estadoFromAPI);
        }
      } else {
        console.log('[Debug] ❌ No se encontraron datos válidos en la respuesta');
      }
    } catch (error) {
      console.error('[Debug] ❌ Error al obtener el hospital del usuario:', error);
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
      
      // Configurar automáticamente la ubicación según el rol
      if (userRole === "hospitaladmin") {
        fetchUserHospital();
      }
      // Aquí se pueden agregar otros casos para municipaladmin, estadoadmin, etc.
    } else {
      console.log('[Debug] Esperando userRole, userId y estados...');
    }
  }, [userRole, userId, estados]);

  // Efecto para configurar los selectores según el rol del usuario
  useEffect(() => {
    console.log('[Debug] Role effect - userRole:', userRole);
    
    if (userRole === "municipaladmin") {
      setIsStateDisabled(true);
      setIsMunicipalityDisabled(true);
      setIsHospitalDisabled(false); // Permitir seleccionar hospital en municipaladmin
      console.log('[Debug] Estado y municipio deshabilitados para municipaladmin');
    } else if (userRole === "hospitaladmin") {
      // Para hospitaladmin, inicialmente permitir cambios hasta que se configure automáticamente
      setIsStateDisabled(false);
      setIsMunicipalityDisabled(false);
      setIsHospitalDisabled(false);
      console.log('[Debug] Selectores habilitados temporalmente para hospitaladmin');
    } else {
      setIsStateDisabled(false);
      setIsMunicipalityDisabled(false);
      setIsHospitalDisabled(false);
      setUserStateCode("");
      setUserMunicipalityCode("");
      setUserHospitalCode("");
      console.log('[Debug] Selectores habilitados para otros roles');
    }
  }, [userRole]);

  // Cargar municipios al seleccionar estado
  useEffect(() => {
    if (!filters.id_estado) {
      setMunicipios([])
      return
    }

    const fetchMunicipios = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital-b0yr.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${filters.id_estado}`,
        )
        const data = await res.json()
        setMunicipios(data)
      } catch (error) {
        console.error("Error al obtener municipios:", error)
        setMunicipios([])
      }
    }
    fetchMunicipios()
  }, [filters.id_estado])

  // Cargar hospitales al seleccionar municipio
  useEffect(() => {
    if (!filters.id_estado || !filters.id_municipio) {
      setHospitales([])
      return
    }

    const fetchHospitales = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${filters.id_estado}&id_municipio=${filters.id_municipio}`,
        )
        const data = await res.json()
        setHospitales(data)
      } catch (error) {
        console.error("Error al obtener hospitales:", error)
        setHospitales([])
      }
    }
    fetchHospitales()
  }, [filters.id_estado, filters.id_municipio])

  // Cargar empleados al seleccionar hospital
  useEffect(() => {
    if (!filters.id_hospital) {
      setEmpleados([])
      setEmpleadosFiltrados([])
      setGrupos([]) // Limpiar grupos si no hay hospital
      setEmpleadosBaseCargados(false)
      return
    }

    const fetchEmpleados = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/empleados-by-ubicacion?id_hospital=${filters.id_hospital}`
        )
        const data = await res.json()
        // Mapear empleados y construir nombre completo
        const empleadosBackend = data.map(emp => ({
          id: emp.id_user || emp.id_empleado || emp.id, // Ajusta según tu backend
          name: [emp.nombre, emp.ap_paterno, emp.ap_materno].filter(Boolean).join(' '),
          schedule: emp.horario || "07:00 - 16:00",
          plannedHours: emp.horas_planeadas || 160,
          workedHours: emp.horas_trabajadas || 0,
          outsideHours: emp.horas_fuera || 0,
          justifiedHours: emp.horas_justificadas || 0,
          grupo: emp.nombre_grupo || emp.grupo || "",
        }))
        setEmpleados(empleadosBackend)
        setEmpleadosFiltrados(empleadosBackend)
        setEmpleadosBaseCargados(true) // Marcar como cargados
        // Extraer grupos únicos de los empleados
        const gruposUnicos = Array.from(new Set(empleadosBackend.map(emp => emp.grupo).filter(Boolean))).map((nombre, idx) => ({ id: idx + 1, nombre }))
        setGrupos(gruposUnicos)
      } catch (error) {
        console.error("Error al obtener empleados reales:", error)
        setEmpleados([])
        setEmpleadosFiltrados([])
        setGrupos([])
        setEmpleadosBaseCargados(false)
      }
    }

    fetchEmpleados()
  }, [filters.id_hospital])

  // Obtener actividades de empleados cuando se tengan hospital y fechas
  useEffect(() => {
    const obtenerActividadesEmpleados = async () => {
      // Solo proceder si tenemos hospital, fechas válidas y empleados base cargados
      if (!filters.id_hospital || !tempDateRange.startDate || !tempDateRange.endDate || !isValidRange || !empleadosBaseCargados) {
        return;
      }

      try {
        console.log('[Debug] Obteniendo actividades para empleados...', {
          hospital: filters.id_hospital,
          fechas: tempDateRange,
          empleados: empleados.length
        });

        // Obtener actividades para cada empleado
        const empleadosConActividades = await Promise.all(
          empleados.map(async (empleado) => {
            try {
              const fechaInicio = `${tempDateRange.startDate} 00:00:00`;
              const fechaFin = `${tempDateRange.endDate} 23:59:59`;
              
              const res = await fetch("https://geoapphospital-b0yr.onrender.com/api/reportes/empleado", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  empleadoId: empleado.id,
                  fechaInicio,
                  fechaFin,
                }),
              });

              if (!res.ok) {
                console.warn(`Error al obtener actividades para empleado ${empleado.id}:`, res.status);
                return { ...empleado, registros: [] };
              }

              const data = await res.json();
              const actividades = Array.isArray(data.actividades) ? data.actividades : [];
              
              console.log(`[Debug] Empleado ${empleado.name}: ${actividades.length} actividades`);
              
              return {
                ...empleado,
                registros: actividades
              };
            } catch (error) {
              console.error(`Error al obtener actividades para empleado ${empleado.id}:`, error);
              return { ...empleado, registros: [] };
            }
          })
        );

        console.log('[Debug] Empleados con actividades obtenidos:', empleadosConActividades.length);
        
        // Actualizar tanto empleados como empleadosFiltrados
        setEmpleados(empleadosConActividades);
        setEmpleadosFiltrados(empleadosConActividades);

      } catch (error) {
        console.error("Error al obtener actividades de empleados:", error);
      }
    };

    obtenerActividadesEmpleados();
  }, [filters.id_hospital, tempDateRange.startDate, tempDateRange.endDate, isValidRange, empleadosBaseCargados]);

  // Manejadores de cambios para los filtros
  const handleEstadoChange = (e) => {
    // No permitir cambios si está deshabilitado para municipaladmin o hospitaladmin
    if (isStateDisabled && (userRole === "municipaladmin" || userRole === "hospitaladmin")) {
      console.log('[Debug] Estado deshabilitado para', userRole, ', cambio ignorado');
      return;
    }
    
    const estado = estados.find((estado) => estado.id_estado === Number(e.target.value))
    setFilters({
      ...filters,
      id_estado: estado?.id_estado || "",
      nombre_estado: estado?.nombre_estado || "",
      id_municipio: "",
      nombre_municipio: "",
      id_hospital: "",
      nombre_hospital: "",
    })
  }

  const handleMunicipioChange = (e) => {
    // No permitir cambios si está deshabilitado para municipaladmin o hospitaladmin
    if (isMunicipalityDisabled && (userRole === "municipaladmin" || userRole === "hospitaladmin")) {
      console.log('[Debug] Municipio deshabilitado para', userRole, ', cambio ignorado');
      return;
    }
    
    const municipio = municipios.find((mun) => mun.id_municipio === Number(e.target.value))
    setFilters({
      ...filters,
      id_municipio: municipio?.id_municipio || "",
      nombre_municipio: municipio?.nombre_municipio || "",
      id_hospital: "",
      nombre_hospital: "",
    })
  }

  const handleHospitalChange = (e) => {
    // No permitir cambios si está deshabilitado para hospitaladmin
    if (isHospitalDisabled && userRole === "hospitaladmin") {
      console.log('[Debug] Hospital deshabilitado para hospitaladmin, cambio ignorado');
      return;
    }
    
    const hospital = hospitales.find((hosp) => hosp.id_hospital === Number(e.target.value))
    setFilters({
      ...filters,
      id_hospital: hospital?.id_hospital || "",
      nombre_hospital: hospital?.nombre_hospital || "",
    })
  }

  // Manejadores para los filtros detallados
  const handleGrupoChange = (e) => {
    setSelectedGrupo(e.target.value)
    filtrarEmpleados(e.target.value, selectedEmpleado, fechaInicio, fechaFin)
  }

  const handleEmpleadoChange = (e) => {
    setSelectedEmpleado(e.target.value)
    filtrarEmpleados(selectedGrupo, e.target.value, fechaInicio, fechaFin)
  }

  const handleFechaInicioChange = (e) => {
    setFechaInicio(e.target.value)
    filtrarEmpleados(selectedGrupo, selectedEmpleado, e.target.value, fechaFin)
  }

  const handleFechaFinChange = (e) => {
    setFechaFin(e.target.value)
    filtrarEmpleados(selectedGrupo, selectedEmpleado, fechaInicio, e.target.value)
  }

  const filtrarEmpleados = (grupo, empleado, inicio, fin) => {
    // Usar siempre empleados como fuente (que ya tiene registros después del useEffect)
    let filtrados = [...empleados]

    if (grupo) {
      filtrados = filtrados.filter((emp) => emp.grupo === grupo)
    }

    if (empleado) {
      filtrados = filtrados.filter((emp) => emp.id === Number(empleado))
    }

    setEmpleadosFiltrados(filtrados)
  }

  const limpiarFiltros = () => {
    // No permitir limpiar filtros si es hospitaladmin con selectores deshabilitados
    if (userRole === "hospitaladmin" && (isStateDisabled || isMunicipalityDisabled || isHospitalDisabled)) {
      console.log('[Debug] Limpiar filtros bloqueado para hospitaladmin con selectores deshabilitados');
      return;
    }
    
    setSelectedGrupo("");
    setSelectedEmpleado("");
    setSelectedPreset(""); // Limpiar periodo rápido
    setTempDateRange({
      startDate: "",
      endDate: "",
    });
    setFechaInicio("");
    setFechaFin("");
    setFilters({
      id_estado: "",
      id_municipio: "",
      id_hospital: "",
      nombre_estado: "",
      nombre_municipio: "",
      nombre_hospital: "",
    });
    // Restaurar todos los empleados con sus registros
    setEmpleadosFiltrados(empleados); // Mostrar todos de nuevo
  }

  // Datos dummy para las tarjetas
  const cardData = {
    totalGroups: 12,
    totalEmployees: 248,
    totalExits: 567,
    totalHours: 1920,
  }

  // Datos dummy para la gráfica de barras
  const groupDistributionData = [
    { group: "Limpieza", employees: 45, exits: 98 },
    { group: "Mantenimiento", employees: 38, exits: 76 },
    { group: "Vigilancia", employees: 52, exits: 120 },
    { group: "Camilleros", employees: 31, exits: 89 },
    { group: "Enfermería", employees: 42, exits: 95 },
  ]

  // Datos dummy para la gráfica de líneas
  const hoursData = [
    { group: "Limpieza", hours: 384 },
    { group: "Mantenimiento", hours: 320 },
    { group: "Vigilancia", hours: 456 },
    { group: "Camilleros", hours: 288 },
    { group: "Enfermería", hours: 472 },
  ]

  // Datos para la gráfica de horas por empleado (usando datos reales filtrados)
  const employeeHoursData = empleadosFiltrados.map((emp) => ({
    name: emp.name?.split(" ")[0] || emp.name,
    horasTrabajadas: emp.workedHours,
    horasAfuera: emp.outsideHours,
  }))

  // Obtener el empleado seleccionado para mostrar el calendario
  const selectedEmployeeData = selectedEmpleado ? empleados.find((emp) => emp.id === Number(selectedEmpleado)) : null

  const [view, setView] = useState('grupos')

  return (
    <>
      <style>
        {customScrollbarStyles}
      </style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-100 to-blue-50">
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-10">
          {/* Header principal */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {userRole === "hospitaladmin" ? "Panel de Administración Hospitalaria" : "Dashboard de Gestión Hospitalaria"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {userRole === "municipaladmin" 
                      ? `Dashboard específico para ${filters.nombre_municipio || 'su municipio asignado'}`
                      : "Gestión de grupos y empleados hospitalarios"
                    }
                  </p>
                  {/* Debug info - solo en desarrollo */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Debug: Role={userRole}, UserId={userId}, StateDisabled={isStateDisabled ? 'Si' : 'No'}, MunicipalityDisabled={isMunicipalityDisabled ? 'Si' : 'No'}, HospitalDisabled={isHospitalDisabled ? 'Si' : 'No'}
                    </p>
                  )}
                </div>
              </div>
              {filters.nombre_municipio && userRole === "municipaladmin" && (
                <div className="text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    <Building2 className="w-4 h-4 mr-1" />
                    Municipio asignado
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{filters.nombre_municipio}</p>
                </div>
              )}
            </div>
          </div>

          {/* View Selector */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setView('grupos')}
              className={`px-4 py-2 rounded-lg ${view === 'grupos' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Grupos
            </button>
            <button
              onClick={() => setView('empleados')}
              className={`px-4 py-2 rounded-lg ${view === 'empleados' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Empleados
            </button>
          </div>

          {/* Conditional Dashboards */}
          {view === 'grupos' ? (
            <GrupoDashboard
              datePresets={datePresets}
              selectedPreset={selectedPreset}
              handlePresetChange={handlePresetChange}
              tempDateRange={tempDateRange}
              handleDateChange={handleDateChange}
              filters={filters}
              estados={estados}
              municipios={municipios}
              hospitales={hospitales}
              handleEstadoChange={handleEstadoChange}
              handleMunicipioChange={handleMunicipioChange}
              handleHospitalChange={handleHospitalChange}
              limpiarFiltros={limpiarFiltros}
              applyChanges={applyChanges}
              isValidRange={isValidRange}
              daysDifference={daysDifference}
              cardData={cardData}
              groupDistributionData={groupDistributionData}
              hoursData={hoursData}
              // Props de autenticación
              userRole={userRole}
              userId={userId}
              isStateDisabled={isStateDisabled}
              isMunicipalityDisabled={isMunicipalityDisabled}
              isHospitalDisabled={isHospitalDisabled}
              isLoadingUserLocation={isLoadingUserLocation}
            />
          ) : (
            <EmpleadoDashboard
              datePresets={datePresets}
              selectedPreset={selectedPreset}
              handlePresetChange={handlePresetChange}
              tempDateRange={tempDateRange}
              handleDateChange={handleDateChange}
              filters={filters}
              estados={estados}
              municipios={municipios}
              hospitales={hospitales}
              handleEstadoChange={handleEstadoChange}
              handleMunicipioChange={handleMunicipioChange}
              handleHospitalChange={handleHospitalChange}
              limpiarFiltros={limpiarFiltros}
              applyChanges={applyChanges}
              isValidRange={isValidRange}
              daysDifference={daysDifference}
              grupos={grupos}
              empleados={empleados}
              empleadosFiltrados={empleadosFiltrados}
              selectedGrupo={selectedGrupo}
              selectedEmpleado={selectedEmpleado}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              handleGrupoChange={handleGrupoChange}
              handleEmpleadoChange={handleEmpleadoChange}
              handleFechaInicioChange={handleFechaInicioChange}
              handleFechaFinChange={handleFechaFinChange}
              filtrarEmpleados={filtrarEmpleados}
              // Props de autenticación
              userRole={userRole}
              userId={userId}
              isStateDisabled={isStateDisabled}
              isMunicipalityDisabled={isMunicipalityDisabled}
              isHospitalDisabled={isHospitalDisabled}
              isLoadingUserLocation={isLoadingUserLocation}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default HospitalDashboard
