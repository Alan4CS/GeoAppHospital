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
  FaBuilding,
  FaHospital,
  FaLayerGroup,
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
  const mapRef = useRef(null)

  // Datos simulados de Quintana Roo
  const states = ["Quintana Roo"]
  const municipalities = {
    "Quintana Roo": ["Cancún", "Playa del Carmen", "Chetumal"],
  }
  const hospitals = {
    Cancún: ["Hospital Galenia", "Hospital Amerimed"],
    "Playa del Carmen": ["Hospiten", "Hospital Costamed"],
    Chetumal: ["Hospital General de Chetumal", "Clínica Carranza"],
  }

  // Datos simulados de empleados de Quintana Roo
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "Laura Gómez",
      position: "Médico",
      hospital: "Hospital Galenia",
      municipality: "Cancún",
      state: "Quintana Roo",
      status: "connected",
      outsideGeofence: false,
      location: [21.1216, -86.8459],
      hoursWorked: 6.5,
      lastConnection: new Date(),
      geofenceExits: 0,
      avatar: "LG",
    },
    {
      id: 2,
      name: "Mario Díaz",
      position: "Enfermero",
      hospital: "Hospiten",
      municipality: "Playa del Carmen",
      state: "Quintana Roo",
      status: "connected",
      outsideGeofence: true,
      location: [20.6274, -87.0799],
      hoursWorked: 7.1,
      lastConnection: new Date(),
      geofenceExits: 1,
      avatar: "MD",
    },
    {
      id: 3,
      name: "Carmen Ruiz",
      position: "Técnica",
      hospital: "Hospital General de Chetumal",
      municipality: "Chetumal",
      state: "Quintana Roo",
      status: "connected",
      outsideGeofence: false,
      location: [18.5001, -88.2961],
      hoursWorked: 5.3,
      lastConnection: new Date(),
      geofenceExits: 0,
      avatar: "CR",
    },
  ])

  // Filtrar empleados según los criterios seleccionados y búsqueda
  const filteredEmployees = employees.filter((emp) => {
    if (selectedState && emp.state !== selectedState) return false
    if (selectedMunicipality && emp.municipality !== selectedMunicipality) return false
    if (selectedHospital && emp.hospital !== selectedHospital) return false
    if (emp.status !== "connected") return false // Solo mostrar conectados en el mapa
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
      if (employee) {
        mapRef.current.setView(employee.location, 15)
      }
    }
  }, [selectedEmployee, employees])

  // Actualizar el mapa cuando cambian los filtros
  useEffect(() => {
    if (mapRef.current) {
      if (selectedMunicipality) {
        // Centrar en el municipio seleccionado
        const municipalityLocations = {
          Cancún: [21.1619, -86.8515],
          "Playa del Carmen": [20.6296, -87.0739],
          Chetumal: [18.5018, -88.2962],
        }
        if (municipalityLocations[selectedMunicipality]) {
          mapRef.current.setView(municipalityLocations[selectedMunicipality], 12)
        }
      } else if (selectedState) {
        // Centrar en el estado seleccionado
        mapRef.current.setView([20.5, -87.0], 7) // Centro de Quintana Roo
      }
    }
  }, [selectedState, selectedMunicipality, selectedHospital])

  // Simular geofences para hospitales (círculos en el mapa)
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
      const bounds = L.latLngBounds(filteredEmployees.map((emp) => emp.location))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    } else {
      // Si no hay empleados filtrados, mostrar todo Quintana Roo
      mapRef.current.setView([20.5, -87.0], 7)
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
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-violet-500",
      "bg-cyan-500",
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
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
      </div>

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
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                  {filteredEmployees.length} empleados
                </span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaLayerGroup className="mr-2 text-emerald-600" />
                    Nivel de visualización
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`px-3 py-2 text-sm rounded-lg flex items-center justify-center ${
                        selectedLevel === "hospital"
                          ? "bg-emerald-100 text-emerald-800 font-medium"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedLevel("hospital")}
                    >
                      <FaHospital className="mr-1" /> Hospital
                    </button>
                    <button
                      className={`px-3 py-2 text-sm rounded-lg flex items-center justify-center ${
                        selectedLevel === "municipality"
                          ? "bg-emerald-100 text-emerald-800 font-medium"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedLevel("municipality")}
                    >
                      <FaBuilding className="mr-1" /> Municipio
                    </button>
                  </div>
                </div>

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

                {selectedState && (
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
                      {municipalities[selectedState]?.map((municipality) => (
                        <option key={municipality} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedMunicipality && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                    >
                      <option value="">Todos los hospitales</option>
                      {hospitals[selectedMunicipality]?.map((hospital) => (
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
              {filteredEmployees.map((employee) => (
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
                            employee.name
                          )} text-white flex items-center justify-center font-medium mr-2`}
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
                            employee.name
                          )} text-white flex items-center justify-center text-xl font-medium mr-3`}
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

                        <div className="flex justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Tiempo de trabajo</h5>
                            <div className="flex items-center">
                              <FaClock className="mr-1 text-emerald-600" />
                              <span className="font-medium">{employee.hoursWorked.toFixed(1)} horas</span>
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Salidas</h5>
                            <div className="flex items-center">
                              <FaExclamationTriangle
                                className={`mr-1 ${employee.geofenceExits > 0 ? "text-orange-500" : "text-gray-400"}`}
                              />
                              <span className="font-medium">{employee.geofenceExits}</span>
                            </div>
                          </div>
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

                        <div className="border-t border-gray-100 pt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Historial de actividad</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-gray-600">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                <span>Inicio de sesión</span>
                              </div>
                              <span className="text-gray-800 font-medium">
                                {format(
                                  new Date(employee.lastConnection.getTime() - employee.hoursWorked * 3600000),
                                  "HH:mm",
                                  { locale: es }
                                )}
                              </span>
                            </div>

                            {employee.geofenceExits > 0 && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center text-gray-600">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                  <span>Primera salida</span>
                                </div>
                                <span className="text-gray-800 font-medium">
                                  {format(new Date(employee.lastConnection.getTime() - 5400000), "HH:mm", { locale: es })}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                <span>
                                  {employee.status === "connected" ? "Última actualización" : "Desconexión"}
                                </span>
                              </div>
                              <span className="text-gray-800 font-medium">
                                {format(employee.lastConnection, "HH:mm", { locale: es })}
                              </span>
                            </div>
                          </div>
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