"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  MapPin,
  Search,
  User,
  Users,
  Building2,
  MapIcon,
  AlertTriangle,
  CheckCircle,
  X,
  BarChart3,
  PieChart,
  LineChart,
  Table2,
} from "lucide-react"
import { format, subDays, parseISO, differenceInDays } from "date-fns"

// Componente principal del dashboard de monitoreo
const MonitoreoDashboard = () => {
  // Estados para los filtros
  const [selectedTab, setSelectedTab] = useState("resumen")
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  })
  const [selectedState, setSelectedState] = useState("")
  const [selectedMunicipality, setSelectedMunicipality] = useState("")
  const [selectedHospital, setSelectedHospital] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Estados para los datos
  const [states, setStates] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [monitoringData, setMonitoringData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos simulados
  useEffect(() => {
    // Simular carga de datos
    setIsLoading(true)

    // Datos simulados de estados
    const statesData = ["Quintana Roo", "Yucatán", "Campeche", "Chiapas", "Tabasco"]

    // Datos simulados de municipios por estado
    const municipalitiesData = {
      "Quintana Roo": ["Cancún", "Playa del Carmen", "Chetumal", "Tulum"],
      Yucatán: ["Mérida", "Valladolid", "Progreso"],
      Campeche: ["Campeche", "Ciudad del Carmen", "Champotón"],
      Chiapas: ["Tuxtla Gutiérrez", "San Cristóbal", "Tapachula"],
      Tabasco: ["Villahermosa", "Cárdenas", "Comalcalco"],
    }

    // Datos simulados de hospitales por municipio
    const hospitalsData = {
      Cancún: ["Hospital Galenia", "Hospital Amerimed", "Hospital General"],
      "Playa del Carmen": ["Hospital General", "Hospiten", "CostaMed"],
      Chetumal: ["Hospital General", "Hospital Naval", "Clínica Carranza"],
      Mérida: ["Hospital Regional", "Star Médica", "Hospital O'Horán"],
      Villahermosa: ["Hospital Regional", "Hospital del Sureste", "Hospital ISSET"],
    }

    // Generar datos históricos simulados de monitoreo
    const generateMonitoringData = () => {
      const data = []
      const startDate = parseISO(dateRange.startDate)
      const endDate = parseISO(dateRange.endDate)
      const daysDiff = differenceInDays(endDate, startDate) + 1

      // Empleados simulados
      const employees = [
        { id: 1, name: "Ana García", position: "Médico", avatar: "AG" },
        { id: 2, name: "Carlos Mendoza", position: "Enfermero", avatar: "CM" },
        { id: 3, name: "Laura Sánchez", position: "Técnica", avatar: "LS" },
        { id: 4, name: "Roberto Díaz", position: "Médico", avatar: "RD" },
        { id: 5, name: "María López", position: "Enfermera", avatar: "ML" },
        { id: 6, name: "Juan Pérez", position: "Técnico", avatar: "JP" },
        { id: 7, name: "Sofía Ramírez", position: "Médico", avatar: "SR" },
        { id: 8, name: "Daniel Torres", position: "Enfermero", avatar: "DT" },
      ]

      // Generar registros para cada día y cada empleado
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = subDays(endDate, i)
        const formattedDate = format(currentDate, "yyyy-MM-dd")

        employees.forEach((employee) => {
          // Asignar aleatoriamente un estado, municipio y hospital
          const state = statesData[Math.floor(Math.random() * statesData.length)]
          const municipalitiesInState = municipalitiesData[state]
          const municipality = municipalitiesInState[Math.floor(Math.random() * municipalitiesInState.length)]

          let hospital = ""
          if (hospitalsData[municipality]) {
            hospital = hospitalsData[municipality][Math.floor(Math.random() * hospitalsData[municipality].length)]
          } else {
            // Si no hay hospitales definidos para este municipio, usar uno genérico
            hospital = `Hospital de ${municipality}`
          }

          // Generar horas trabajadas (entre 4 y 9 horas)
          const hoursWorked = (4 + Math.random() * 5).toFixed(1)

          // Generar salidas de geocerca (0 a 3)
          const geofenceExits = Math.floor(Math.random() * 4)

          // Generar estado (conectado/desconectado)
          const status = Math.random() > 0.2 ? "connected" : "disconnected"

          // Generar si está dentro o fuera de geocerca
          const outsideGeofence = geofenceExits > 0

          // Crear el registro
          data.push({
            id: `${formattedDate}-${employee.id}`,
            date: formattedDate,
            employeeId: employee.id,
            employeeName: employee.name,
            employeePosition: employee.position,
            employeeAvatar: employee.avatar,
            state,
            municipality,
            hospital,
            hoursWorked: Number.parseFloat(hoursWorked),
            geofenceExits,
            status,
            outsideGeofence,
            // Generar horas de inicio y fin
            startTime: `${Math.floor(Math.random() * 3) + 7}:${Math.floor(Math.random() * 60)
              .toString()
              .padStart(2, "0")}`,
            endTime: `${Math.floor(Math.random() * 4) + 14}:${Math.floor(Math.random() * 60)
              .toString()
              .padStart(2, "0")}`,
          })
        })
      }

      return data
    }

    // Establecer los datos
    setStates(statesData)
    setMunicipalities(municipalitiesData)
    setHospitals(hospitalsData)
    setMonitoringData(generateMonitoringData())
    setIsLoading(false)
  }, [dateRange])

  // Filtrar datos según los criterios seleccionados
  const filteredData = useMemo(() => {
    return monitoringData.filter((record) => {
      // Filtrar por estado
      if (selectedState && record.state !== selectedState) return false

      // Filtrar por municipio
      if (selectedMunicipality && record.municipality !== selectedMunicipality) return false

      // Filtrar por hospital
      if (selectedHospital && record.hospital !== selectedHospital) return false

      // Filtrar por término de búsqueda
      if (searchTerm && !record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) return false

      return true
    })
  }, [monitoringData, selectedState, selectedMunicipality, selectedHospital, searchTerm])

  // Calcular estadísticas para el resumen
  const stats = useMemo(() => {
    if (filteredData.length === 0)
      return {
        totalEmployees: 0,
        totalHours: 0,
        avgHoursPerDay: 0,
        totalGeofenceExits: 0,
        avgGeofenceExitsPerDay: 0,
        complianceRate: 0,
      }

    // Obtener empleados únicos
    const uniqueEmployees = [...new Set(filteredData.map((record) => record.employeeId))]

    // Calcular total de horas trabajadas
    const totalHours = filteredData.reduce((sum, record) => sum + record.hoursWorked, 0)

    // Calcular días únicos
    const uniqueDays = [...new Set(filteredData.map((record) => record.date))]

    // Calcular promedio de horas por día
    const avgHoursPerDay = totalHours / uniqueDays.length / uniqueEmployees.length

    // Calcular total de salidas de geocerca
    const totalGeofenceExits = filteredData.reduce((sum, record) => sum + record.geofenceExits, 0)

    // Calcular promedio de salidas de geocerca por día
    const avgGeofenceExitsPerDay = totalGeofenceExits / uniqueDays.length

    // Calcular tasa de cumplimiento (registros sin salidas de geocerca / total de registros)
    const recordsWithoutExits = filteredData.filter((record) => record.geofenceExits === 0).length
    const complianceRate = (recordsWithoutExits / filteredData.length) * 100

    return {
      totalEmployees: uniqueEmployees.length,
      totalHours: totalHours.toFixed(1),
      avgHoursPerDay: avgHoursPerDay.toFixed(1),
      totalGeofenceExits,
      avgGeofenceExitsPerDay: avgGeofenceExitsPerDay.toFixed(1),
      complianceRate: complianceRate.toFixed(1),
    }
  }, [filteredData])

  // Datos para gráficos
  const chartData = useMemo(() => {
    if (filteredData.length === 0)
      return {
        hoursPerDay: [],
        hoursPerEmployee: [],
        geofenceExitsPerDay: [],
        statusDistribution: { connected: 0, disconnected: 0 },
      }

    // Agrupar horas por día
    const hoursPerDayMap = filteredData.reduce((acc, record) => {
      const date = record.date
      if (!acc[date]) acc[date] = 0
      acc[date] += record.hoursWorked
      return acc
    }, {})

    // Convertir a array para el gráfico
    const hoursPerDay = Object.entries(hoursPerDayMap)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14) // Últimos 14 días

    // Agrupar horas por empleado
    const hoursPerEmployeeMap = filteredData.reduce((acc, record) => {
      const employeeId = record.employeeId
      if (!acc[employeeId]) {
        acc[employeeId] = {
          id: employeeId,
          name: record.employeeName,
          hours: 0,
        }
      }
      acc[employeeId].hours += record.hoursWorked
      return acc
    }, {})

    // Convertir a array para el gráfico
    const hoursPerEmployee = Object.values(hoursPerEmployeeMap)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10) // Top 10 empleados

    // Agrupar salidas de geocerca por día
    const geofenceExitsPerDayMap = filteredData.reduce((acc, record) => {
      const date = record.date
      if (!acc[date]) acc[date] = 0
      acc[date] += record.geofenceExits
      return acc
    }, {})

    // Convertir a array para el gráfico
    const geofenceExitsPerDay = Object.entries(geofenceExitsPerDayMap)
      .map(([date, exits]) => ({ date, exits }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14) // Últimos 14 días

    // Distribución de estados (conectado/desconectado)
    const statusDistribution = filteredData.reduce(
      (acc, record) => {
        acc[record.status]++
        return acc
      },
      { connected: 0, disconnected: 0 },
    )

    return {
      hoursPerDay,
      hoursPerEmployee,
      geofenceExitsPerDay,
      statusDistribution,
    }
  }, [filteredData])

  // Función para exportar datos a CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return

    // Crear encabezados
    const headers = [
      "Fecha",
      "Empleado",
      "Cargo",
      "Estado",
      "Municipio",
      "Hospital",
      "Horas Trabajadas",
      "Salidas de Geocerca",
      "Estado",
      "Hora Inicio",
      "Hora Fin",
    ].join(",")

    // Crear filas
    const rows = filteredData.map((record) =>
      [
        record.date,
        record.employeeName,
        record.employeePosition,
        record.state,
        record.municipality,
        record.hospital,
        record.hoursWorked,
        record.geofenceExits,
        record.status === "connected" ? "Conectado" : "Desconectado",
        record.startTime,
        record.endTime,
      ].join(","),
    )

    // Unir encabezados y filas
    const csv = [headers, ...rows].join("\n")

    // Crear blob y descargar
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_monitoreo_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para obtener municipios según el estado seleccionado
  const getMunicipalitiesByState = () => {
    if (!selectedState) return []
    return municipalities[selectedState] || []
  }

  // Función para obtener hospitales según el municipio seleccionado
  const getHospitalsByMunicipality = () => {
    if (!selectedMunicipality) return []
    return hospitals[selectedMunicipality] || []
  }

  // Función para obtener color de avatar
  const getAvatarColor = (avatar) => {
    const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"]
    const index = avatar.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado con filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">Dashboard de Monitoreo</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </button>
          </div>
        </div>

        {/* Filtros desplegables */}
        {isFilterOpen && (
          <div className="bg-gray-50 p-4 rounded-lg mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rango de fechas</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  setSelectedMunicipality("")
                  setSelectedHospital("")
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos los estados</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
              <select
                value={selectedMunicipality}
                onChange={(e) => {
                  setSelectedMunicipality(e.target.value)
                  setSelectedHospital("")
                }}
                disabled={!selectedState}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
              >
                <option value="">Todos los municipios</option>
                {getMunicipalitiesByState().map((municipality) => (
                  <option key={municipality} value={municipality}>
                    {municipality}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                disabled={!selectedMunicipality}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
              >
                <option value="">Todos los hospitales</option>
                {getHospitalsByMunicipality().map((hospital) => (
                  <option key={hospital} value={hospital}>
                    {hospital}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre de empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div className="flex border-b border-gray-200 mt-4">
          <button
            onClick={() => setSelectedTab("resumen")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "resumen"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setSelectedTab("historico")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "historico"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Histórico
          </button>
          <button
            onClick={() => setSelectedTab("distribucion")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "distribucion"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Distribución
          </button>
          <button
            onClick={() => setSelectedTab("datos")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "datos"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Datos
          </button>
        </div>
      </div>

      {/* Contenido según la pestaña seleccionada */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Pestaña de Resumen */}
          {selectedTab === "resumen" && (
            <div className="space-y-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Empleados monitoreados</h3>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalEmployees}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Total de horas trabajadas:</span>
                      <span className="font-medium">{stats.totalHours}h</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Promedio diario:</span>
                      <span className="font-medium">{stats.avgHoursPerDay}h</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <MapPin className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Salidas de geocerca</h3>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalGeofenceExits}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Promedio diario:</span>
                      <span className="font-medium">{stats.avgGeofenceExitsPerDay}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Tasa de cumplimiento:</span>
                      <span className="font-medium">{stats.complianceRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Cobertura</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {selectedHospital
                          ? 1
                          : selectedMunicipality
                            ? getHospitalsByMunicipality().length
                            : selectedState
                              ? getMunicipalitiesByState().length
                              : states.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Tipo:</span>
                      <span className="font-medium">
                        {selectedHospital
                          ? "Hospital"
                          : selectedMunicipality
                            ? "Municipio"
                            : selectedState
                              ? "Estado"
                              : "Estados"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Nombre:</span>
                      <span className="font-medium truncate max-w-[150px]">
                        {selectedHospital || selectedMunicipality || selectedState || "Todos"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de horas por día */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-800">Horas trabajadas por día</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <LineChart className="h-4 w-4 mr-1" />
                      Últimos 14 días
                    </div>
                  </div>

                  <div className="h-64">
                    {chartData.hoursPerDay.length > 0 ? (
                      <div className="h-full">
                        <div className="flex h-full items-end space-x-2">
                          {chartData.hoursPerDay.map((day) => {
                            const height = `${(day.hours / Math.max(...chartData.hoursPerDay.map((d) => d.hours))) * 100}%`
                            return (
                              <div key={day.date} className="flex-1 flex flex-col items-center group">
                                <div className="relative w-full">
                                  <div
                                    className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm transition-all duration-500 ease-in-out group-hover:bg-emerald-600"
                                    style={{ height }}
                                  ></div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
                                  {format(parseISO(day.date), "dd/MM")}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        No hay datos disponibles
                      </div>
                    )}
                  </div>
                </div>

                {/* Gráfico de salidas de geocerca */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-800">Salidas de geocerca por día</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <LineChart className="h-4 w-4 mr-1" />
                      Últimos 14 días
                    </div>
                  </div>

                  <div className="h-64">
                    {chartData.geofenceExitsPerDay.length > 0 ? (
                      <div className="h-full">
                        <div className="flex h-full items-end space-x-2">
                          {chartData.geofenceExitsPerDay.map((day) => {
                            const maxExits = Math.max(...chartData.geofenceExitsPerDay.map((d) => d.exits))
                            const height = maxExits > 0 ? `${(day.exits / maxExits) * 100}%` : "0%"
                            return (
                              <div key={day.date} className="flex-1 flex flex-col items-center group">
                                <div className="relative w-full">
                                  <div
                                    className="absolute bottom-0 w-full bg-amber-500 rounded-t-sm transition-all duration-500 ease-in-out group-hover:bg-amber-600"
                                    style={{ height }}
                                  ></div>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
                                  {format(parseISO(day.date), "dd/MM")}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        No hay datos disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top empleados */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Top empleados por horas trabajadas</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    Top 10
                  </div>
                </div>

                <div className="space-y-4">
                  {chartData.hoursPerEmployee.length > 0 ? (
                    chartData.hoursPerEmployee.map((employee) => {
                      const percentage =
                        (employee.hours / Math.max(...chartData.hoursPerEmployee.map((e) => e.hours))) * 100
                      return (
                        <div key={employee.id} className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-full ${getAvatarColor(employee.name.charAt(0))} text-white flex items-center justify-center font-medium mr-3`}
                          >
                            {employee.name
                              .split(" ")
                              .map((n) => n.charAt(0))
                              .join("")}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{employee.name}</span>
                              <span className="text-sm text-gray-500">{employee.hours.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center text-gray-400 py-8">No hay datos disponibles</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pestaña de Histórico */}
          {selectedTab === "historico" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-800">Histórico de monitoreo</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(parseISO(dateRange.startDate), "dd/MM/yyyy")} -{" "}
                  {format(parseISO(dateRange.endDate), "dd/MM/yyyy")}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Fecha
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Empleado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Hospital
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Horas
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Horario
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Geocerca
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.slice(0, 50).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(record.date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`flex-shrink-0 h-8 w-8 rounded-full ${getAvatarColor(record.employeeAvatar)} text-white flex items-center justify-center font-medium`}
                            >
                              {record.employeeAvatar}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                              <div className="text-sm text-gray-500">{record.employeePosition}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{record.hospital}</div>
                          <div className="text-xs text-gray-500">
                            {record.municipality}, {record.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.hoursWorked.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.startTime} - {record.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.geofenceExits > 0 ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                              {record.geofenceExits} salidas
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Cumplimiento
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredData.length > 50 && (
                  <div className="py-3 px-6 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center">
                    Mostrando 50 de {filteredData.length} registros. Exporta para ver todos los datos.
                  </div>
                )}

                {filteredData.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No se encontraron registros con los filtros seleccionados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pestaña de Distribución */}
          {selectedTab === "distribucion" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución por estado */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Distribución por estado</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapIcon className="h-4 w-4 mr-1" />
                    Estados
                  </div>
                </div>

                <div className="space-y-4">
                  {states.map((state) => {
                    const stateRecords = filteredData.filter((record) => record.state === state)
                    const percentage = filteredData.length > 0 ? (stateRecords.length / filteredData.length) * 100 : 0

                    return (
                      <div key={state} className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium mr-3">
                          <MapIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{state}</span>
                            <span className="text-sm text-gray-500">{stateRecords.length} registros</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Distribución por cumplimiento */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Distribución por cumplimiento</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <PieChart className="h-4 w-4 mr-1" />
                    Geocerca
                  </div>
                </div>

                <div className="flex items-center justify-center h-64">
                  {filteredData.length > 0 ? (
                    <div className="w-full max-w-md">
                      <div className="flex justify-center mb-8">
                        <div className="relative w-40 h-40">
                          {/* Gráfico circular simple */}
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#10B981"
                              strokeWidth="20"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 * (1 - Number.parseFloat(stats.complianceRate) / 100)}
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#F59E0B"
                              strokeWidth="20"
                              strokeDasharray="251.2"
                              strokeDashoffset="0"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-800">{stats.complianceRate}%</div>
                              <div className="text-xs text-gray-500">Cumplimiento</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 mr-2"></div>
                          <div>
                            <div className="text-sm font-medium">Dentro de geocerca</div>
                            <div className="text-xs text-gray-500">
                              {filteredData.filter((r) => r.geofenceExits === 0).length} registros
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
                          <div>
                            <div className="text-sm font-medium">Con salidas</div>
                            <div className="text-xs text-gray-500">
                              {filteredData.filter((r) => r.geofenceExits > 0).length} registros
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">No hay datos disponibles</div>
                  )}
                </div>
              </div>

              {/* Distribución por hospital */}
              <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-800">Distribución por hospital</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Building2 className="h-4 w-4 mr-1" />
                    Top 10 hospitales
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredData.length > 0 ? (
                    <div>
                      {/* Agrupar por hospital */}
                      {(() => {
                        const hospitalStats = {}

                        // Agrupar datos por hospital
                        filteredData.forEach((record) => {
                          if (!hospitalStats[record.hospital]) {
                            hospitalStats[record.hospital] = {
                              name: record.hospital,
                              municipality: record.municipality,
                              state: record.state,
                              records: 0,
                              hours: 0,
                              geofenceExits: 0,
                              employees: new Set(),
                            }
                          }

                          hospitalStats[record.hospital].records++
                          hospitalStats[record.hospital].hours += record.hoursWorked
                          hospitalStats[record.hospital].geofenceExits += record.geofenceExits
                          hospitalStats[record.hospital].employees.add(record.employeeId)
                        })

                        // Convertir a array y ordenar por horas
                        const sortedHospitals = Object.values(hospitalStats)
                          .sort((a, b) => b.hours - a.hours)
                          .slice(0, 10)

                        return (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Hospital
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Ubicación
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Empleados
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Horas totales
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Salidas
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sortedHospitals.map((hospital, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Building2 className="h-4 w-4" />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{hospital.municipality}</div>
                                    <div className="text-xs text-gray-500">{hospital.state}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {hospital.employees.size}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {hospital.hours.toFixed(1)}h
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {hospital.geofenceExits > 0 ? (
                                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                        {hospital.geofenceExits} salidas
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Sin salidas
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      No se encontraron registros con los filtros seleccionados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pestaña de Datos */}
          {selectedTab === "datos" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-800">Datos completos</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Table2 className="h-4 w-4 mr-1" />
                  {filteredData.length} registros
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Fecha
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Empleado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Municipio
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Hospital
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Horas
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Horario
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Geocerca
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.slice(0, 100).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(record.date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`flex-shrink-0 h-8 w-8 rounded-full ${getAvatarColor(record.employeeAvatar)} text-white flex items-center justify-center font-medium`}
                            >
                              {record.employeeAvatar}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                              <div className="text-sm text-gray-500">{record.employeePosition}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.state}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.municipality}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.hospital}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.hoursWorked.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.startTime} - {record.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.status === "connected" ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Conectado
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              <X className="h-3 w-3 mr-1" />
                              Desconectado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.geofenceExits > 0 ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {record.geofenceExits} salidas
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <MapPin className="h-3 w-3 mr-1" />
                              Dentro
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredData.length > 100 && (
                  <div className="py-3 px-6 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center">
                    Mostrando 100 de {filteredData.length} registros. Exporta para ver todos los datos.
                  </div>
                )}

                {filteredData.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No se encontraron registros con los filtros seleccionados.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MonitoreoDashboard