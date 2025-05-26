import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaClock,
  FaMapMarkerAlt,
  FaFilter,
  FaSearch,
  FaMapMarkedAlt,
  FaSpinner,
  FaSync,
} from "react-icons/fa"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Corregir el problema de los íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Iconos personalizados
const createCustomIcon = (color, borderColor = "white") => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid ${borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

const connectedIcon = createCustomIcon("#4CAF50") // Verde
const outsideGeofenceIcon = createCustomIcon("#FF5722", "#FFF") // Naranja con borde blanco

const MonitoreoMap = () => {
  const [showFilters, setShowFilters] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState("hospital")
  const [selectedState, setSelectedState] = useState("")
  const [selectedMunicipality, setSelectedMunicipality] = useState("")
  const [selectedHospital, setSelectedHospital] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [mapCenter, setMapCenter] = useState([20.5, -87.0]) // Centro de Quintana Roo
  const [mapZoom, setMapZoom] = useState(7)
  const [searchTerm, setSearchTerm] = useState("")
  const [showGeofences, setShowGeofences] = useState(true)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const mapRef = useRef(null)

  // Estados y municipios dinámicos basados en los datos reales
  const [states, setStates] = useState([])
  const [municipalities, setMunicipalities] = useState({})
  const [hospitals, setHospitals] = useState({})

  // Función para obtener datos de monitoreo desde la API
  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("http://localhost:4000/api/employees/monitoreo")

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Transformar los datos de la API al formato esperado por el componente
      const transformedEmployees = data.map((emp) => {
        // Crear avatar con iniciales
        const avatar = `${emp.nombre?.charAt(0) || ""}${emp.ap_paterno?.charAt(0) || ""}`

        return {
          id: emp.id_user,
          name: `${emp.nombre} ${emp.ap_paterno} ${emp.ap_materno}`.trim(),
          firstName: emp.nombre,
          lastName: `${emp.ap_paterno} ${emp.ap_materno}`.trim(),
          position: "Empleado", // Valor por defecto, se puede obtener de otra API si está disponible
          hospital: "Hospital Asignado", // Valor por defecto, se puede obtener de otra API
          municipality: "Municipio", // Valor por defecto, se puede obtener de otra API
          state: "Estado", // Valor por defecto, se puede obtener de otra API
          status: emp.tipo_registro === 1 ? "connected" : "disconnected",
          outsideGeofence: !emp.dentro_geocerca,
          location: [emp.latitud, emp.longitud],
          lastConnection: new Date(emp.fecha_hora),
          avatar: avatar,
          // Datos adicionales calculados
          hoursWorked: calculateHoursWorked(new Date(emp.fecha_hora)),
          geofenceExits: emp.dentro_geocerca ? 0 : 1,
        }
      })

      setEmployees(transformedEmployees)
      setLastUpdate(new Date())

      // Extraer estados, municipios y hospitales únicos de los datos
      updateLocationFilters(transformedEmployees)
    } catch (err) {
      console.error("Error al obtener datos de monitoreo:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para calcular horas trabajadas (simplificada)
  const calculateHoursWorked = (lastConnection) => {
    const now = new Date()
    const diffMs = now - lastConnection
    const diffHours = diffMs / (1000 * 60 * 60)
    return Math.max(0, Math.min(24, diffHours)) // Máximo 24 horas
  }

  // Función para actualizar filtros de ubicación basados en datos reales
  const updateLocationFilters = (employeeData) => {
    const uniqueStates = [...new Set(employeeData.map((emp) => emp.state))].filter(Boolean)
    const uniqueMunicipalities = {}
    const uniqueHospitals = {}

    employeeData.forEach((emp) => {
      if (emp.state && emp.municipality) {
        if (!uniqueMunicipalities[emp.state]) {
          uniqueMunicipalities[emp.state] = new Set()
        }
        uniqueMunicipalities[emp.state].add(emp.municipality)
      }

      if (emp.municipality && emp.hospital) {
        if (!uniqueHospitals[emp.municipality]) {
          uniqueHospitals[emp.municipality] = new Set()
        }
        uniqueHospitals[emp.municipality].add(emp.hospital)
      }
    })

    // Convertir Sets a arrays
    Object.keys(uniqueMunicipalities).forEach((state) => {
      uniqueMunicipalities[state] = Array.from(uniqueMunicipalities[state])
    })

    Object.keys(uniqueHospitals).forEach((municipality) => {
      uniqueHospitals[municipality] = Array.from(uniqueHospitals[municipality])
    })

    setStates(uniqueStates)
    setMunicipalities(uniqueMunicipalities)
    setHospitals(uniqueHospitals)
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchMonitoringData()

    // Configurar actualización automática cada 30 segundos
    const interval = setInterval(fetchMonitoringData, 30000)

    return () => clearInterval(interval)
  }, [])

  // Filtrar empleados según los criterios seleccionados y búsqueda
  const filteredEmployees = employees.filter((emp) => {
    if (selectedState && emp.state !== selectedState) return false
    if (selectedMunicipality && emp.municipality !== selectedMunicipality) return false
    if (selectedHospital && emp.hospital !== selectedHospital) return false
    if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Calcular KPIs
  const connectedCount = employees.filter((emp) => emp.status === "connected").length
  const disconnectedCount = employees.filter((emp) => emp.status === "disconnected").length
  const outsideGeofenceCount = employees.filter((emp) => emp.outsideGeofence).length

  // Centrar el mapa en el empleado seleccionado
  useEffect(() => {
    if (selectedEmployee && mapRef.current) {
      const employee = employees.find((emp) => emp.id === selectedEmployee)
      if (employee && employee.location) {
        mapRef.current.setView(employee.location, 15)
      }
    }
  }, [selectedEmployee, employees])

  // Simular geofences para hospitales (círculos en el mapa)
  // En una implementación real, estos también vendrían de la API
  const geofences = [
    { id: 1, name: "Hospital Galenia", center: [21.1216, -86.8459], radius: 200 },
    { id: 2, name: "Hospital Amerimed", center: [21.1419, -86.82], radius: 180 },
    { id: 3, name: "Hospiten", center: [20.6274, -87.0799], radius: 150 },
    { id: 4, name: "Hospital Costamed", center: [20.635, -87.068], radius: 170 },
    { id: 5, name: "Hospital General de Chetumal", center: [18.5001, -88.2961], radius: 220 },
    { id: 6, name: "Clínica Carranza", center: [18.508, -88.305], radius: 120 },
  ]

  // Función para actualizar la vista del mapa
  const updateMapView = () => {
    if (!mapRef.current) return

    if (filteredEmployees.length > 0) {
      // Si hay empleados filtrados, ajustar la vista para mostrarlos a todos
      const validLocations = filteredEmployees
        .filter((emp) => emp.location && emp.location[0] && emp.location[1])
        .map((emp) => emp.location)

      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(validLocations)
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    } else {
      // Si no hay empleados filtrados, mostrar todo México
      mapRef.current.setView([23.6345, -102.5528], 5)
    }
  }

  // Actualizar la vista del mapa cuando cambian los empleados filtrados
  useEffect(() => {
    updateMapView()
  }, [filteredEmployees])

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedState("")
    setSelectedMunicipality("")
    setSelectedHospital("")
    setSearchTerm("")
    setTimeout(updateMapView, 100)
  }

  // Generar color de avatar basado en el nombre
  const getAvatarColor = (name) => {
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500", "bg-cyan-500"]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Función para refrescar datos manualmente
  const handleRefresh = () => {
    fetchMonitoringData()
  }

  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-emerald-600 mb-4" />
        <p className="text-gray-600">Cargando datos de monitoreo...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 bg-emerald-50 rounded-full mr-4">
            <FaUserCheck className="text-emerald-600 text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Conectados</h3>
            <p className="text-2xl font-bold text-gray-800">{connectedCount}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 bg-gray-50 rounded-full mr-4">
            <FaUserTimes className="text-gray-600 text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Desconectados</h3>
            <p className="text-2xl font-bold text-gray-800">{disconnectedCount}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 bg-orange-50 rounded-full mr-4">
            <FaExclamationTriangle className="text-orange-600 text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Fuera de Geocerca</h3>
            <p className="text-2xl font-bold text-gray-800">{outsideGeofenceCount}</p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 bg-blue-50 rounded-full mr-4">
            <FaSync className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Última actualización</h3>
            <p className="text-sm font-medium text-gray-800">
              {lastUpdate ? format(lastUpdate, "HH:mm:ss", { locale: es }) : "---"}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-2" />
            <span className="text-red-800">Error al cargar datos: {error}</span>
            <button onClick={handleRefresh} className="ml-auto text-red-600 hover:text-red-800 underline">
              Reintentar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden p-4 pt-0">
        <div className="flex flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filtros colapsables */}
          <div
            className={`bg-white border-r border-gray-100 transition-all duration-300 ${
              showFilters ? "w-72" : "w-0"
            } overflow-hidden`}
          >
            <div className="p-5 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-gray-800">Filtros</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                    {filteredEmployees.length} empleados
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Actualizar datos"
                  >
                    <FaSync className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Buscador */}
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setSelectedMunicipality("")
                      setSelectedHospital("")
                    }}
                  >
                    <option value="">Todos los estados</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedState && municipalities[selectedState] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Municipio</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedMunicipality}
                      onChange={(e) => {
                        setSelectedMunicipality(e.target.value)
                        setSelectedHospital("")
                      }}
                    >
                      <option value="">Todos los municipios</option>
                      {municipalities[selectedState].map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedMunicipality && hospitals[selectedMunicipality] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                    >
                      <option value="">Todos los hospitales</option>
                      {hospitals[selectedMunicipality].map((hospital) => (
                        <option key={hospital} value={hospital}>
                          {hospital}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaMapMarkedAlt className="mr-2 text-emerald-600" />
                    Capas del mapa
                  </label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="showGeofences"
                        checked={showGeofences}
                        onChange={(e) => setShowGeofences(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="showGeofences" className="ml-2 block text-sm text-gray-700">
                        Mostrar geocercas
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 space-y-3">
                <button
                  onClick={updateMapView}
                  className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                >
                  <FaFilter className="mr-2" />
                  Aplicar filtros
                </button>

                <button
                  onClick={clearFilters}
                  className="w-full border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Contenedor principal del mapa */}
          <div className="flex-1 relative">
            {/* Botón para mostrar/ocultar filtros */}
            <button
              className="absolute top-4 left-4 z-[1000] bg-white text-emerald-600 p-3 rounded-full shadow-md hover:bg-emerald-50 transition-colors border border-gray-200"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <FaChevronLeft /> : <FaChevronRight />}
            </button>

            {/* Mapa */}
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
              whenCreated={(map) => {
                mapRef.current = map
              }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Geocercas (círculos) */}
              {showGeofences &&
                geofences.map((geofence) => (
                  <Circle
                    key={geofence.id}
                    center={geofence.center}
                    radius={geofence.radius}
                    pathOptions={{
                      color: "#10b981",
                      fillColor: "#10b981",
                      fillOpacity: 0.1,
                      weight: 2,
                      dashArray: "5, 5",
                    }}
                  />
                ))}

              {/* Marcadores de empleados */}
              {filteredEmployees
                .filter((employee) => employee.location && employee.location[0] && employee.location[1])
                .map((employee) => (
                  <Marker
                    key={employee.id}
                    position={employee.location}
                    icon={employee.outsideGeofence ? outsideGeofenceIcon : connectedIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedEmployee(employee.id)
                      },
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="text-sm p-1">
                        <div className="flex items-center mb-2">
                          <div
                            className={`w-8 h-8 rounded-full ${getAvatarColor(
                              employee.name,
                            )} text-white flex items-center justify-center font-medium mr-2 text-xs`}
                          >
                            {employee.avatar}
                          </div>
                          <div>
                            <h3 className="font-medium text-base">{employee.name}</h3>
                            <p className="text-gray-600 text-xs">{employee.position}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{employee.hospital}</p>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center text-gray-600">
                            <FaClock className="mr-1" />
                            <span>{employee.hoursWorked.toFixed(1)} hrs</span>
                          </div>
                          {employee.outsideGeofence ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center">
                              <FaExclamationTriangle className="mr-1" />
                              Fuera de geocerca
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full flex items-center">
                              <FaMapMarkerAlt className="mr-1" />
                              En geocerca
                            </span>
                          )}
                        </div>
                        <button
                          className="w-full mt-2 text-emerald-600 text-xs flex items-center justify-center border border-emerald-200 rounded-lg py-1 px-2 hover:bg-emerald-50"
                          onClick={() => setSelectedEmployee(employee.id)}
                        >
                          <FaInfoCircle className="mr-1" /> Ver detalles
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          {/* Panel de detalles del empleado seleccionado */}
          {selectedEmployee && (
            <div className="w-80 bg-white border-l border-gray-100 overflow-y-auto">
              <div className="p-5">
                {(() => {
                  const employee = employees.find((emp) => emp.id === selectedEmployee)
                  if (!employee) return null

                  return (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="font-semibold text-lg text-gray-800">Detalles del Empleado</h3>
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={() => setSelectedEmployee(null)}
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center mb-6">
                        <div
                          className={`w-12 h-12 rounded-full ${getAvatarColor(
                            employee.name,
                          )} text-white flex items-center justify-center text-lg font-medium mr-3`}
                        >
                          {employee.avatar}
                        </div>
                        <div>
                          <h4 className="text-xl font-medium text-gray-800">{employee.name}</h4>
                          <p className="text-gray-600">{employee.position}</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-emerald-600" />
                            Ubicación
                          </h5>
                          <p className="text-gray-800 font-medium">{employee.hospital}</p>
                          <p className="text-gray-600 text-sm">
                            {employee.municipality}, {employee.state}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Lat: {employee.location[0]?.toFixed(6)}, Lng: {employee.location[1]?.toFixed(6)}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Estado</h5>
                          <div
                            className={`flex items-center ${
                              employee.status === "connected" ? "text-emerald-600" : "text-gray-600"
                            }`}
                          >
                            {employee.status === "connected" ? (
                              <>
                                <FaUserCheck className="mr-2" />
                                <span className="font-medium">Conectado</span>
                              </>
                            ) : (
                              <>
                                <FaUserTimes className="mr-2" />
                                <span className="font-medium">Desconectado</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Última conexión: {format(employee.lastConnection, "d 'de' MMMM, HH:mm", { locale: es })}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Geocerca</h5>
                          {employee.outsideGeofence ? (
                            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg flex items-center">
                              <FaExclamationTriangle className="mr-2" />
                              <div>
                                <span className="font-medium">Fuera de geocerca</span>
                                <p className="text-xs text-orange-700 mt-1">
                                  El empleado se encuentra fuera del área designada.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg flex items-center">
                              <FaMapMarkerAlt className="mr-2" />
                              <div>
                                <span className="font-medium">Dentro de geocerca</span>
                                <p className="text-xs text-emerald-700 mt-1">
                                  El empleado se encuentra en el área designada.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={() => setSelectedEmployee(null)}
                          className="w-full border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cerrar detalles
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonitoreoMap