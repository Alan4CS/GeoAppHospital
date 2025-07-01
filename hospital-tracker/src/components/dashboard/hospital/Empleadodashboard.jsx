"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Users, Check, Download, X, MapPin, Building2, BarChart } from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns"
import { ResponsiveContainer, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts"
import { generarReporteEmpleadoPDF } from "./reportes/EmployeeReportPDF"

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
  empleados,
  empleadosFiltrados,
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
  const selectedEmployeeData = selectedEmpleado ? empleados.find(emp => emp.id === Number(selectedEmpleado)) : null

  const employeeHoursData = empleadosFiltrados.map(emp => ({
    name: emp.name?.split(" ")[0] || emp.name,
    horasTrabajadas: emp.workedHours,
    horasAfuera: emp.outsideHours,
  }))

  // --- Calendar and PDF state/logic ---
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [calendarData, setCalendarData] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [hourlyData, setHourlyData] = useState([])

  // Solo llamar a limpiarFiltros del padre
  const handleLimpiarFiltros = () => {
    if (typeof limpiarFiltros === 'function') limpiarFiltros();
  }

  // Dates for calendar navigation
  const startDate = tempDateRange.startDate
  const endDate = tempDateRange.endDate
  const employee = selectedEmployeeData

  // Week navigation
  const startWeek = startOfWeek(new Date(startDate), { weekStartsOn: 1 })
  const endWeek = endOfWeek(new Date(endDate), { weekStartsOn: 1 })
  const daysDiff = differenceInDays(new Date(endDate), new Date(startDate))
  const showNavigation = daysDiff > 7
  const [currentWeekStart, setCurrentWeekStart] = useState(startWeek)

  // Update calendar data when employee or date range changes
  useEffect(() => {
    if (employee) {
      // Placeholder: fetch or generate calendar data for the employee
      // For now, just clear selection
      setCalendarData([])
      setSelectedDay(null)
      setHourlyData([])
    }
  }, [employee, startDate, endDate])

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
            <button onClick={() => filtrarEmpleados(selectedGrupo, selectedEmpleado, fechaInicio, fechaFin)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center text-sm" disabled={!isValidRange}>
              <Check className="h-4 w-4 mr-1" />Aplicar filtros
            </button>
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
            <div className={selectedEmployeeData ? "space-y-6 mt-6" : "flex flex-col gap-6 mt-6"}>
              {!selectedEmployeeData ? (
                <>
                  <div className="bg-white rounded-lg shadow-sm w-full max-h-[500px] overflow-y-auto mb-6">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Nombre</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Hrs Efec</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Hrs Justif.</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Hrs Fuera</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Total Salidas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empleadosFiltrados.map(emp => (
                          <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{emp.name}</td>
                            <td className="px-4 py-2 text-sm text-green-600">{emp.workedHours}</td>
                            <td className="px-4 py-2 text-sm text-blue-600">{emp.justifiedHours ?? 0}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{emp.outsideHours}</td>
                            <td className="px-4 py-2 text-sm text-indigo-600">{emp.totalExits ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Gráfica de barras de horas trabajadas y fuera */}
                  {employeeHoursData.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4 w-full max-w-3xl mx-auto">
                      <h3 className="text-base font-semibold mb-2 flex items-center gap-2"><BarChart className="w-5 h-5 text-blue-500" />Comparativo de horas</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={employeeHoursData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="horasTrabajadas" fill="#10b981" name="Hrs Efec" />
                          <Bar dataKey="horasAfuera" fill="#ef4444" name="Hrs Fuera" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* --- EmployeeCalendarView (inline) --- */}
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
                    {/* Calendario visual y lógica correspondiente */}
                    <div className="flex flex-col gap-4">
                      {/* Navegación entre semanas */}
                      {showNavigation && (
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200"
                          >
                            <X className="h-5 w-5 text-gray-700" />
                          </button>
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-700">
                              Semana del {format(currentWeekStart, "dd MMM yyyy")}
                            </span>
                          </div>
                          <button
                            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all duration-200"
                          >
                            <X className="h-5 w-5 text-gray-700 transform rotate-180" />
                          </button>
                        </div>
                      )}

                      {/* Días de la semana */}
                      <div className="grid grid-cols-7 gap-2">
                        {eachDayOfInterval({ start: currentWeekStart, end: endWeek }).map((date) => (
                          <div
                            key={date}
                            className={`p-2 rounded-lg text-center text-sm font-medium ${
                              isSameDay(date, new Date()) ? "bg-blue-100 text-blue-700" : "text-gray-700"
                            }`}
                          >
                            {format(date, "EEE dd")}
                          </div>
                        ))}
                      </div>

                      {/* Horarios por día */}
                      <div className="grid grid-cols-7 gap-2">
                        {eachDayOfInterval({ start: currentWeekStart, end: endWeek }).map((date) => {
                          const dayActivities = calendarData.find(cal => isSameDay(new Date(cal.fecha), date))?.actividades || []
                          return (
                            <div
                              key={date}
                              className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200"
                              onClick={() => {
                                setSelectedDay(date)
                                setHourlyData(dayActivities)
                              }}
                            >
                              {dayActivities.length > 0 ? (
                                <>
                                  <div className="text-xs text-gray-500">{dayActivities.length} actividad{dayActivities.length > 1 ? 'es' : ''}</div>
                                  <div className="text-sm font-medium">{dayActivities[0].nombre_actividad}</div>
                                </>
                              ) : (
                                <div className="text-gray-400 text-center text-sm">Sin actividades</div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Detalle de actividades por hora (si se selecciona un día) */}
                      {selectedDay && (
                        <div className="mt-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Actividades del {format(selectedDay, "dd MMM yyyy")}
                          </div>
                          <div className="bg-gray-50 rounded-lg shadow-sm p-4">
                            {hourlyData.length > 0 ? (
                              <div className="grid grid-cols-1 gap-4">
                                {hourlyData.map((actividad, index) => (
                                  <div key={index} className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <div className="text-sm font-medium text-gray-800">{actividad.nombre_actividad}</div>
                                      <div className="text-xs text-gray-500">{format(new Date(actividad.fecha_hora), "HH:mm")}</div>
                                    </div>
                                    <div className="text-sm text-gray-700">{actividad.descripcion}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-center text-sm py-4">Sin actividades programadas para este día.</div>
                            )}
                          </div>
                        </div>
                      )}
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