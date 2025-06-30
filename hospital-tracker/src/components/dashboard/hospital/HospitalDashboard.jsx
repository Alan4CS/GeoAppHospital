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

// Genera datos mejorados para el calendario
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

  return days.map((day) => {
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (isWeekend) {
      return {
        date: day,
        totalHours: 0,
        status: "weekend",
        notes: "Fin de semana",
      }
    }

    // Horario realista: 7:00-16:00 con 30min fuera
    const totalHours = 8.5 // 9 horas menos 30 min fuera
    const outsideHours = 0.5 // 30 minutos fuera

    return {
      date: day,
      totalHours: totalHours,
      status: "completed",
      notes: "Jornada completa",
      workedHours: totalHours,
      outsideHours: outsideHours,
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

// Genera datos mejorados por hora para un día específico
const generateEnhancedHourlyData = (dayData, employee) => {
  if (!dayData || dayData.status !== "completed") {
    return {
      hours: [],
      events: [],
      metrics: { workedHours: 0, outsideHours: 0, totalHours: 0 },
    }
  }

  const events = generateRealisticGeofenceEvents(dayData.date, employee)
  const hours = []

  // Horario de 7:00 a 16:00
  const startHour = 7
  const endHour = 16

  let workedHours = 0
  let outsideHours = 0

  for (let i = 0; i < endHour - startHour; i++) {
    const hour = startHour + i
    const hourLabel = `${hour.toString().padStart(2, "0")}:00`
    const nextHourLabel = `${(hour + 1).toString().padStart(2, "0")}:00`

    // Determinar el estado durante esta hora
    let isInside = false
    let hasEntry = false
    let hasExit = false

    // Lógica mejorada basada en el horario realista
    if (hour >= 7 && hour < 11) {
      isInside = true // Trabajando
    } else if (hour >= 11 && hour < 12) {
      isInside = false // Fuera de 11:00-11:30, dentro de 11:30-12:00
      if (hour === 11) {
        // En la hora 11:00-12:00, está fuera solo los primeros 30 min
        isInside = false // Simplificado para la visualización
      }
    } else if (hour >= 12 && hour < 16) {
      isInside = true // Trabajando
    } else {
      isInside = false // Fuera del horario
    }

    // Verificar eventos en esta hora
    for (const event of events) {
      const eventHour = Number.parseInt(event.time.split(":")[0])
      if (eventHour === hour) {
        if (event.type === "entry") hasEntry = true
        if (event.type === "exit") hasExit = true
      }
    }

    if (isInside) {
      workedHours += 1
    } else if (hour >= 7 && hour < 16) {
      outsideHours += 1
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
    metrics: {
      workedHours: 8.5, // 8.5 horas trabajadas (9 horas menos 30 min fuera)
      outsideHours: 0.5, // 30 minutos fuera
      totalHours: 9, // Total de 9 horas de jornada
    },
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
                          <div className="text-lg font-bold text-emerald-600">{dayData.totalHours}h</div>
                          <div className="text-xs text-emerald-700">Click para detalles</div>
                          <div className="text-xs text-orange-600 mt-1">30min fuera</div>
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
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
                        <div className="text-xl font-bold text-emerald-600">{hourlyData.metrics.workedHours}h</div>
                        <div className="text-xs text-emerald-700">Trabajadas</div>
                        <div className="text-xs text-emerald-600 mt-1">7:00-11:00 + 11:30-16:00</div>
                      </div>
                      <div className="bg-red-100 rounded-lg p-3 text-center border border-red-200">
                        <div className="text-xl font-bold text-red-600">{hourlyData.metrics.outsideHours}h</div>
                        <div className="text-xs text-red-700">Fuera</div>
                        <div className="text-xs text-red-600 mt-1">11:00-11:30</div>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3 text-center border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">{hourlyData.metrics.totalHours}h</div>
                        <div className="text-xs text-blue-700">Total</div>
                        <div className="text-xs text-blue-600 mt-1">Jornada completa</div>
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
        const res = await fetch("https://geoapphospital.onrender.com/api/superadmin/estados")
        const data = await res.json()
        setEstados(data)
      } catch (error) {
        console.error("Error al obtener estados:", error)
      }
    }
    fetchEstados()
  }, [])

  // Cargar municipios al seleccionar estado
  useEffect(() => {
    if (!filters.id_estado) {
      setMunicipios([])
      return
    }

    const fetchMunicipios = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${filters.id_estado}`,
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
          `https://geoapphospital.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${filters.id_estado}&id_municipio=${filters.id_municipio}`,
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
      return
    }

    const fetchEmpleados = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/hospitaladmin/empleados-by-ubicacion?id_hospital=${filters.id_hospital}`
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
        // Extraer grupos únicos de los empleados
        const gruposUnicos = Array.from(new Set(empleadosBackend.map(emp => emp.grupo).filter(Boolean))).map((nombre, idx) => ({ id: idx + 1, nombre }))
        setGrupos(gruposUnicos)
      } catch (error) {
        console.error("Error al obtener empleados reales:", error)
        setEmpleados([])
        setEmpleadosFiltrados([])
        setGrupos([])
      }
    }

    fetchEmpleados()
  }, [filters.id_hospital])

  // Manejadores de cambios para los filtros
  const handleEstadoChange = (e) => {
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
    setSelectedGrupo("")
    setSelectedEmpleado("")
    setFechaInicio(format(subDays(new Date(), 30), "yyyy-MM-dd"))
    setFechaFin(format(new Date(), "yyyy-MM-dd"))
    setEmpleadosFiltrados(empleados)
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
                <h3 className="text-lg font-bold text-gray-800">Filtros de Análisis</h3>
              </div>

              {/* Primera fila: Período, Fecha inicio, Fecha fin */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                {/* Selector de presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                    </div>
                    <input
                      type="date"
                      value={tempDateRange.startDate}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                {/* Fecha fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <input
                      type="date"
                      value={tempDateRange.endDate}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Segunda fila: Estado, Municipio, Hospital y botones */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end mt-4">
                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
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
                        <option key={municipio.id_municipio} value={municipio.id_municipio}>
                          {municipio.nombre_municipio}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Hospital */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
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
                        <option key={hospital.id_hospital} value={hospital.id_hospital}>
                          {hospital.nombre_hospital}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Botones */}
                <div className="flex gap-2 justify-end mt-6 lg:mt-0">
                  <button
                    onClick={limpiarFiltros}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    Limpiar Filtros
                  </button>
                  <button
                    onClick={() => {
                      applyChanges();
                    }}
                    className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center text-sm"
                    style={{ minHeight: '44px' }}
                  >
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
                      {format(new Date(tempDateRange.startDate), "dd/MM/yyyy")} -{" "}
                      {format(new Date(tempDateRange.endDate), "dd/MM/yyyy")})
                    </span>
                  </div>
                )}

                {/* Mensaje de error */}
                {tempDateRange.startDate && tempDateRange.endDate && !isValidRange && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center">
                    <Calendar className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-800">La fecha de inicio debe ser anterior a la fecha final</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
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
              <span className="text-2xl font-bold">{cardData.totalEmployees}</span>
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
                  <p className="text-sm text-gray-500">Comparación de empleados y salidas</p>
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
                      <linearGradient id="employeeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                      <linearGradient id="exitGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
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
                    <Bar dataKey="employees" name="Empleados" fill="#4F46E5" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="employees" position="right" fill="#4f46e5" fontSize={12} fontWeight={600} />
                    </Bar>
                    <Bar dataKey="exits" name="Salidas" fill="#EF4444" radius={[0, 4, 4, 0]}>
                      <LabelList dataKey="exits" position="right" fill="#dc2626" fontSize={12} fontWeight={600} />
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
                  <p className="text-sm text-gray-500">Distribución de horas trabajadas</p>
                </div>
              </div>
              <div className="h-[500px]">
                <ResponsiveContainer>
                  <LineChart data={hoursData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <defs>
                      <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
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
                      formatter={(value) => [`${value} horas`, "Horas Trabajadas"]}
                    />
                    <Area type="monotone" dataKey="hours" stroke="none" fillOpacity={1} fill="url(#hoursGradient)" />
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
                <h3 className="text-lg font-bold text-gray-800">Análisis Detallado</h3>
              </div>

              {/* Filtros */}
              {/* Primera fila: Fechas */}
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-end">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select
                    className={`w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!filters.id_hospital ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    disabled={!filters.id_hospital}
                  >
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
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                    </div>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={handleFechaInicioChange}
                      disabled={!filters.id_hospital}
                      className={`flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${!filters.id_hospital ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    />
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={handleFechaFinChange}
                      disabled={!filters.id_hospital}
                      className={`flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!filters.id_hospital ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Segunda fila: Grupo y Empleado */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end mt-2">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <select
                      value={selectedGrupo}
                      onChange={handleGrupoChange}
                      disabled={!filters.id_hospital}
                      className={`flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!filters.id_hospital ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    >
                      <option value="">Todos los grupos</option>
                      {grupos.map((grupo) => (
                        <option key={grupo.nombre} value={grupo.nombre}>
                          {grupo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                    <select
                      value={selectedEmpleado}
                      onChange={handleEmpleadoChange}
                      disabled={!filters.id_hospital}
                      className={`flex-1 h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${!filters.id_hospital ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    >
                      <option value="">Todos los empleados</option>
                      {empleados
                        .filter((emp) => !selectedGrupo || emp.grupo === selectedGrupo)
                        .map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  Limpiar Filtros
                </button>
                <button
                  onClick={() => filtrarEmpleados(selectedGrupo, selectedEmpleado, fechaInicio, fechaFin)}
                  className="px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center text-sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aplicar Filtros
                </button>
              </div>

              {/* Tarjetas de información */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <MapPin className="h-6 w-6 opacity-90" />
                    <TrendingUp className="h-4 w-4 text-red-200" />
                  </div>
                  <span className="text-sm text-red-100">Tiempo Fuera</span>
                  <span className="text-xl font-bold">8 hrs</span>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white flex flex-col shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-6 w-6 opacity-90" />
                    <TrendingUp className="h-4 w-4 text-purple-200" />
                  </div>
                  <span className="text-sm text-purple-100">Horas Trabajadas</span>
                  <span className="text-xl font-bold">136 hrs</span>
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center">
                  <Check className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-800">
                    Mostrando {empleadosFiltrados.length} empleado(s)
                    {selectedGrupo ? ` del grupo ${selectedGrupo}` : ""}
                    {selectedEmpleado ? ` (filtrado por empleado específico)` : ""}
                    en el período del {format(new Date(fechaInicio), "dd/MM/yyyy")}
                    al {format(new Date(fechaFin), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>

              {/* Contenedor para tabla y gráfica o calendario */}
              <div className={selectedEmployeeData ? "space-y-6 mt-6" : "grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6"}>
                {/* Tabla de empleados - solo mostrar si no hay empleado seleccionado */}
                {!selectedEmployeeData && (
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
                          {empleadosFiltrados.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                              <td className="px-4 py-4 text-sm font-medium text-gray-900 truncate">{employee.name}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{employee.schedule}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{employee.plannedHours}</td>
                              <td className="px-4 py-4 text-sm text-emerald-600 font-medium">{employee.workedHours}</td>
                              <td className="px-4 py-4 text-sm text-red-600 font-medium">{employee.outsideHours}</td>
                              <td className="px-4 py-4 text-sm text-blue-600 font-medium">{employee.justifiedHours}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Vista condicional: Calendario para empleado individual o gráfica para múltiples */}
                {selectedEmployeeData ? (
                  <EmployeeCalendarView employee={selectedEmployeeData} startDate={fechaInicio} endDate={fechaFin} filters={filters} />
                ) : (

                  <div className="h-[500px]">
                    <ResponsiveContainer>
                      <BarChart data={employeeHoursData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="horasTrabajadas" name="Horas Trabajadas" fill="#10B981" />
                        <Bar dataKey="horasAfuera" name="Horas Fuera" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HospitalDashboard
