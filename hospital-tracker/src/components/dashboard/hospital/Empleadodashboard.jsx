"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Users, Check, Download, X, MapPin, Building2, BarChart, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ResponsiveContainer, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts"
import { generarReporteEmpleadoPDF } from "./reportes/EmployeeReportPDF"
import { calcularEstadisticasEmpleado } from "./employeeStatsHelper"

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

  useEffect(() => {
    async function fetchEmpleados() {
      if (filters.id_hospital && tempDateRange.startDate && tempDateRange.endDate) {
        const body = {
          id_hospital: filters.id_hospital,
          fechaInicio: `${tempDateRange.startDate} 00:00:00`,
          fechaFin: `${tempDateRange.endDate} 23:59:59`,
        };
        const res = await fetch("http://localhost:4000/api/dashboards/grupo", {
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
  const showNavigation = daysDiff > 31
  const [currentMonth, setCurrentMonth] = useState(endMonth)
  
  // Límites para la navegación del calendario
  const minMonth = startOfMonth(new Date(startDate))
  const maxMonth = startOfMonth(new Date(endDate))
  
  // Funciones de navegación con límites
  const canNavigatePrevious = currentMonth > minMonth
  const canNavigateNext = currentMonth < maxMonth

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

  // Resetear currentMonth cuando cambien las fechas - abrir en el mes de la fecha final
  useEffect(() => {
    if (startDate && endDate) {
      const newEndMonth = startOfMonth(new Date(endDate))
      setCurrentMonth(newEndMonth)
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
            <div className={selectedEmployeeData ? "space-y-6 mt-6" : "flex flex-col gap-6 mt-6"}>
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
                          {empleadosFiltrados.map((emp, idx) => (
                            <tr key={emp.id} className={
                              `transition-colors border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`
                            }>
                              <td className="px-6 py-3 text-sm text-gray-900 font-medium">{emp.name}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-green-600 text-center">{emp.workedHours}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-center">{emp.justifiedHours ?? 0}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-red-600 text-center">{emp.outsideHours}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-indigo-600 text-center">{emp.totalExits ?? 0}</td>
                            </tr>
                          ))}
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
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#fff', 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                              />
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
                      {/* Título del mes y año */}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Calendario de actividades - {selectedEmployeeData.name}
                        </h3>
                        <div className="text-md font-medium text-gray-600 mb-2">
                          {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </div>
                        <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-2 max-w-md mx-auto">
                          💡 Haz clic en cualquier día del período para ver las actividades del empleado
                        </div>
                      </div>

                      {/* Navegación entre meses */}
                      {showNavigation && (
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                          <button
                            onClick={() => canNavigatePrevious && setCurrentMonth(subMonths(currentMonth, 1))}
                            disabled={!canNavigatePrevious}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border ${
                              canNavigatePrevious 
                                ? 'bg-white hover:bg-gray-100 border-gray-200 text-gray-600' 
                                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
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
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 border ${
                              canNavigateNext 
                                ? 'bg-white hover:bg-gray-100 border-gray-200 text-gray-600' 
                                : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-sm">Mes siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {/* Encabezados de días de la semana */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                          <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Leyenda del calendario */}
                      <div className="flex flex-wrap justify-center gap-4 text-xs bg-gray-50 rounded-lg p-3">
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

                      {/* Calendario mensual */}
                      <div className="grid grid-cols-7 gap-2">
                        {eachDayOfInterval({ 
                          start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }), 
                          end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }) 
                        }).map((date) => {
                          const isInRange = date >= new Date(startDate) && date <= new Date(endDate)
                          const isToday = isSameDay(date, new Date())
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                          const dayActivities = calendarData.find(cal => isSameDay(new Date(cal.fecha), date))?.actividades || []
                          
                          return (
                            <div
                              key={date}
                              className={`min-h-[80px] p-2 rounded-lg transition-all duration-200 border ${
                                !isCurrentMonth 
                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                  : !isInRange 
                                    ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" 
                                    : isToday 
                                      ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 cursor-pointer" 
                                      : dayActivities.length > 0
                                        ? "bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer"
                                        : "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer"
                              }`}
                              onClick={() => {
                                if (isInRange && isCurrentMonth) {
                                  setSelectedDay(date)
                                  setHourlyData(dayActivities)
                                }
                              }}
                            >
                              <div className={`text-sm font-bold mb-1 ${
                                !isCurrentMonth || !isInRange 
                                  ? "text-gray-400" 
                                  : isToday 
                                    ? "text-white" 
                                    : "text-gray-700"
                              }`}>
                                {format(date, "d")}
                              </div>
                              
                              {isCurrentMonth && isInRange && (
                                <div className="text-xs">
                                  {dayActivities.length > 0 ? (
                                    <>
                                      <div className={`font-semibold mb-1 text-center px-1 py-0.5 rounded text-xs ${
                                        isToday 
                                          ? "bg-white/20 text-white" 
                                          : "bg-green-600 text-white"
                                      }`}>
                                        {dayActivities.length} actividad{dayActivities.length > 1 ? 'es' : ''}
                                      </div>
                                      <div className={`line-clamp-2 text-xs ${
                                        isToday ? "text-white/90" : "text-gray-700"
                                      }`}>
                                        {dayActivities[0].nombre_actividad}
                                      </div>
                                    </>
                                  ) : (
                                    <div className={`text-center text-xs mt-2 ${
                                      isToday ? "text-white/80" : "text-gray-500"
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

                      {/* Detalle de actividades por hora (si se selecciona un día) */}
                      {selectedDay && (
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                          <div className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Actividades del {format(selectedDay, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                          </div>
                          <div className="bg-white rounded-lg shadow-sm p-4">
                            {hourlyData.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3">
                                {hourlyData.map((actividad, index) => (
                                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="text-sm font-semibold text-gray-800">{actividad.nombre_actividad}</div>
                                      <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                                        {format(new Date(actividad.fecha_hora), "HH:mm", { locale: es })}
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600">{actividad.descripcion}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-center text-sm py-8">
                                <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                Sin actividades programadas para este día
                              </div>
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