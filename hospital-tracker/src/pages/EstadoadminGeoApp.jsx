import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Hospital,
  LogOut,
  MapPin,
  User,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapIcon,
  List,
  X,
  ChevronLeft,
  Calendar,
  Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import EstadoStatsCard from "../components/estado/EstadoStatsCard";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Corregir el problema de los íconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Iconos personalizados
const createCustomIcon = (color) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15],
    iconAnchor: [7, 7],
  });
};

const connectedIcon = createCustomIcon("#4CAF50"); // Verde
const outsideGeofenceIcon = createCustomIcon("#FF5722"); // Naranja

// Componente para ajustar el mapa cuando cambia el tamaño del contenedor
const MapResizer = ({ showDetails }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidar el tamaño del mapa cuando cambia la visibilidad del panel de detalles
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [showDetails, map]);

  return null;
};

// Componente para hacer zoom al municipio seleccionado
const MunicipioZoom = ({ selectedMunicipio, municipioCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedMunicipio && municipioCoordinates[selectedMunicipio]) {
      const [lat, lng, zoom] = municipioCoordinates[selectedMunicipio];
      map.setView([lat, lng], zoom);
    }
  }, [selectedMunicipio, municipioCoordinates, map]);

  return null;
};

export default function EstadoAdminDashboard() {
  const [activeTab, setActiveTab] = useState("monitoreo");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [estadoActual, setEstadoActual] = useState(""); // Nombre del estado del administrador
  const [isLoading, setIsLoading] = useState(true);
  const [hospitales, setHospitales] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5, -87.0]); // Centro de Quintana Roo por defecto
  const [mapZoom, setMapZoom] = useState(7);
  const [viewMode, setViewMode] = useState("map"); // "map" o "list"
  const [detailsPosition, setDetailsPosition] = useState("right"); // "right" o "bottom"
  const mapRef = useRef(null);
  const detailsRef = useRef(null);

  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  // Coordenadas y nivel de zoom para cada municipio
  const municipioCoordinates = {
    Cancún: [21.1619, -86.8515, 12],
    "Playa del Carmen": [20.6296, -87.0739, 12],
    Chetumal: [18.5018, -88.2962, 12],
    // Añadir más municipios según sea necesario
  };

  // Cambiar los colores de verde a azul en todo el dashboard
  // Cambiar el gradiente del sidebar
  const sidebarClass = `${
    sidebarOpen ? "w-64" : "w-20"
  } bg-gradient-to-b from-blue-800 to-blue-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen fixed z-30`;

  // Cambiar los colores de los botones hover en el sidebar
  const sidebarButtonClass = `flex items-center py-3 px-4 hover:bg-blue-700 ${
    activeTab === "monitoreo" ? "bg-blue-700" : ""
  } ${!sidebarOpen ? "justify-center" : ""}`;

  // Cambiar el color del botón de cerrar sesión
  const logoutButtonClass = `flex items-center py-3 px-4 hover:bg-red-700 text-red-100 ${
    !sidebarOpen ? "justify-center" : ""
  }`;

  // Obtener datos del estado asignado
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Obtener el ID del usuario del localStorage
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("No se encontró ID de usuario en localStorage");
          setIsLoading(false);
          return;
        }

        // Obtener los hospitales asociados a este administrador
        const hospitalesResponse = await fetch(
          `https://geoapphospital.onrender.com/api/estadoadmin/hospitals-by-user/${userId}`
        );

        if (!hospitalesResponse.ok) {
          throw new Error(`Error HTTP: ${hospitalesResponse.status}`);
        }

        const hospitalesData = await hospitalesResponse.json();
        setHospitales(hospitalesData);

        // Extraer el estado del primer hospital (asumiendo que todos los hospitales son del mismo estado)
        if (hospitalesData.length > 0) {
          // Check if nombre_estado exists in the response (from the JOIN in the backend)
          if (hospitalesData[0].nombre_estado) {
            setEstadoActual(hospitalesData[0].nombre_estado);
          } else if (hospitalesData[0].estado_id) {
            // Fallback to estado_id if nombre_estado is not available
            setEstadoActual(`Estado ${hospitalesData[0].estado_id}`);
          }
        }

        // Simular datos de empleados para el monitoreo
        // En una implementación real, estos datos vendrían de una API
        const empleadosSimulados = [
          {
            id: 1,
            nombre: "Laura Gómez",
            apellidoPaterno: "Gómez",
            apellidoMaterno: "Rodríguez",
            puesto: "Médico",
            hospital: hospitalesData[0]?.nombre_hospital || "Hospital Galenia",
            municipio: hospitalesData[0]?.municipio || "Cancún",
            estado: estadoActual || "Quintana Roo",
            status: "connected",
            outsideGeofence: false,
            location: [21.1216, -86.8459],
            horasConectado: 6.5,
            ultimaConexion: new Date(),
            salidasGeocerca: 0,
          },
          {
            id: 2,
            nombre: "Mario",
            apellidoPaterno: "Díaz",
            apellidoMaterno: "López",
            puesto: "Enfermero",
            hospital: hospitalesData[1]?.nombre_hospital || "Hospiten",
            municipio: hospitalesData[1]?.municipio || "Playa del Carmen",
            estado: estadoActual || "Quintana Roo",
            status: "connected",
            outsideGeofence: true,
            location: [20.6274, -87.0799],
            horasConectado: 7.1,
            ultimaConexion: new Date(),
            salidasGeocerca: 1,
          },
          {
            id: 3,
            nombre: "Carmen",
            apellidoPaterno: "Ruiz",
            apellidoMaterno: "Sánchez",
            puesto: "Técnica",
            hospital:
              hospitalesData[2]?.nombre_hospital ||
              "Hospital General de Chetumal",
            municipio: hospitalesData[2]?.municipio || "Chetumal",
            estado: estadoActual || "Quintana Roo",
            status: "connected",
            outsideGeofence: false,
            location: [18.5001, -88.2961],
            horasConectado: 5.3,
            ultimaConexion: new Date(),
            salidasGeocerca: 0,
          },
          {
            id: 4,
            nombre: "Roberto",
            apellidoPaterno: "Mendoza",
            apellidoMaterno: "García",
            puesto: "Médico",
            hospital: hospitalesData[0]?.nombre_hospital || "Hospital Galenia",
            municipio: hospitalesData[0]?.municipio || "Cancún",
            estado: estadoActual || "Quintana Roo",
            status: "disconnected",
            outsideGeofence: false,
            location: [21.122, -86.847],
            horasConectado: 4.2,
            ultimaConexion: new Date(Date.now() - 3600000), // 1 hora atrás
            salidasGeocerca: 0,
          },
        ];

        setEmpleados(empleadosSimulados);

        // Extraer solo los municipios que tienen empleados
        const municipiosConEmpleados = [
          ...new Set(empleadosSimulados.map((emp) => emp.municipio)),
        ].filter(Boolean);
        setMunicipios(municipiosConEmpleados);

        setIsLoading(false);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Detectar el tamaño de la pantalla para ajustar la posición del panel de detalles
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setDetailsPosition("bottom");
      } else {
        setDetailsPosition("right");
      }
    };

    // Ejecutar al montar el componente
    handleResize();

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", handleResize);

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Filtrar empleados según los criterios seleccionados
  const filteredEmpleados = empleados.filter((emp) => {
    if (selectedMunicipio && emp.municipio !== selectedMunicipio) return false;
    if (selectedHospital && emp.hospital !== selectedHospital) return false;
    return true;
  });

  // Calcular KPIs
  const conectadosCount = empleados.filter(
    (emp) => emp.status === "connected"
  ).length;
  const desconectadosCount = empleados.filter(
    (emp) => emp.status === "disconnected"
  ).length;
  const fueraGeocercaCount = empleados.filter(
    (emp) => emp.outsideGeofence
  ).length;

  // Centrar el mapa en el empleado seleccionado
  useEffect(() => {
    if (selectedEmployee && mapRef.current) {
      const employee = empleados.find((emp) => emp.id === selectedEmployee);
      if (employee) {
        mapRef.current.setView(employee.location, 15);
      }
    }
  }, [selectedEmployee, empleados]);

  // Simular geofences para hospitales (círculos en el mapa)
  const geofences = hospitales.map((hospital, index) => ({
    id: hospital.id_hospital || index,
    name: hospital.nombre_hospital,
    center:
      hospital.latitud && hospital.longitud
        ? [hospital.latitud, hospital.longitud]
        : index === 0
        ? [21.1216, -86.8459]
        : index === 1
        ? [20.6274, -87.0799]
        : [18.5001, -88.2961],
    radius: hospital.radio_geo || 200,
  }));

  // Manejar clic fuera del panel de detalles para cerrarlo (solo en dispositivos móviles)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target) &&
        window.innerWidth < 768
      ) {
        setSelectedEmployee(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className={sidebarClass}>
        <div className="p-4 flex items-center justify-between">
          <div
            className={`flex items-center ${
              !sidebarOpen && "justify-center w-full"
            }`}
          >
            <Hospital className="h-8 w-8" />
            <h1
              className={`ml-2 font-bold text-xl ${!sidebarOpen && "hidden"}`}
            >
              Geo App
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1 rounded-full hover:bg-blue-700"
          >
            <ChevronRight
              className={`h-5 w-5 transform ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Perfil de usuario */}
        <div
          className={`mt-2 px-4 py-3 ${
            !sidebarOpen ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex items-center ${!sidebarOpen ? "flex-col" : ""}`}
          >
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="font-medium text-sm">Administrador</p>
                <p className="text-xs text-blue-200">
                  {estadoActual || "Cargando..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <div className="mt-6 flex flex-col flex-1">
          <button
            onClick={() => setActiveTab("monitoreo")}
            className={sidebarButtonClass}
          >
            <MapIcon className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Monitoreo</span>}
          </button>

          <button
            onClick={() => setActiveTab("hospitales")}
            className={`flex items-center py-3 px-4 hover:bg-blue-700 ${
              activeTab === "hospitales" ? "bg-blue-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Hospital className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Hospitales</span>}
          </button>

          <div className="mt-auto">
            <button
              onClick={() => {
                localStorage.removeItem("isAuthenticated");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userId");
                setIsAuthenticated(false);
                navigate("/");
              }}
              className={logoutButtonClass}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div
        className={`flex-1 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* HEADER */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === "monitoreo"
                ? `Monitoreo de Empleados - ${estadoActual || "..."}`
                : `Hospitales de ${estadoActual || "..."}`}
            </h1>
            <div className="flex space-x-2">
              {activeTab === "monitoreo" && (
                <>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-3 py-2 rounded-md flex items-center ${
                      viewMode === "map"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    <MapIcon className="h-4 w-4 mr-1" />
                    Mapa
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-2 rounded-md flex items-center ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    <List className="h-4 w-4 mr-1" />
                    Lista
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* TARJETAS DE ESTADÍSTICAS */}
              {activeTab === "monitoreo" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <EstadoStatsCard
                    title="Conectados"
                    value={conectadosCount}
                    icon={<CheckCircle className="h-8 w-8 text-green-600" />}
                    description="Empleados activos"
                    color="green"
                  />
                  <EstadoStatsCard
                    title="Desconectados"
                    value={desconectadosCount}
                    icon={<Clock className="h-8 w-8 text-gray-600" />}
                    description="Empleados inactivos"
                    color="gray"
                  />
                  <EstadoStatsCard
                    title="Fuera de Geocerca"
                    value={fueraGeocercaCount}
                    icon={<AlertTriangle className="h-8 w-8 text-orange-600" />}
                    description="Empleados fuera de su área"
                    color="orange"
                  />
                </div>
              )}

              {/* CONTENIDO SEGÚN TAB */}
              {activeTab === "monitoreo" && (
                <div
                  className={`relative bg-white rounded-xl shadow-md overflow-hidden ${
                    selectedEmployee && detailsPosition === "bottom"
                      ? "pb-96"
                      : ""
                  }`}
                >
                  <div className="flex h-[calc(100vh-250px)]">
                    {/* Filtros */}
                    <div
                      className={`bg-white border-r transition-all duration-300 ${
                        showFilters ? "w-64" : "w-0"
                      } overflow-hidden`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-lg">Filtros</h3>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {filteredEmpleados.length} empleados
                          </span>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Municipio
                          </label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={selectedMunicipio}
                            onChange={(e) => {
                              setSelectedMunicipio(e.target.value);
                              setSelectedHospital("");
                            }}
                          >
                            <option value="">Todos</option>
                            {municipios.map((municipio) => (
                              <option key={municipio} value={municipio}>
                                {municipio} (
                                {
                                  empleados.filter(
                                    (emp) => emp.municipio === municipio
                                  ).length
                                }
                                )
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedMunicipio && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hospital
                            </label>
                            <select
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              value={selectedHospital}
                              onChange={(e) =>
                                setSelectedHospital(e.target.value)
                              }
                            >
                              <option value="">Todos</option>
                              {/* Filtrar hospitales por municipio seleccionado y que tengan empleados */}
                              {hospitales
                                .filter(
                                  (h) => h.municipio === selectedMunicipio
                                )
                                .filter((h) =>
                                  empleados.some(
                                    (emp) => emp.hospital === h.nombre_hospital
                                  )
                                )
                                .map((hospital) => (
                                  <option
                                    key={hospital.id_hospital}
                                    value={hospital.nombre_hospital}
                                  >
                                    {hospital.nombre_hospital} (
                                    {
                                      empleados.filter(
                                        (emp) =>
                                          emp.hospital ===
                                          hospital.nombre_hospital
                                      ).length
                                    }
                                    )
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div className="mt-6">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">
                            Empleados conectados
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {filteredEmpleados
                              .filter((emp) => emp.status === "connected")
                              .map((emp) => (
                                <div
                                  key={emp.id}
                                  className={`p-2 rounded-md cursor-pointer flex items-center ${
                                    selectedEmployee === emp.id
                                      ? "bg-blue-100"
                                      : "hover:bg-gray-100"
                                  }`}
                                  onClick={() => setSelectedEmployee(emp.id)}
                                >
                                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                                    {emp.nombre.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                      {emp.nombre} {emp.apellidoPaterno}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {emp.hospital}
                                    </p>
                                  </div>
                                  {emp.outsideGeofence && (
                                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenedor principal del mapa o lista */}
                    <div
                      className={`flex-1 relative ${
                        selectedEmployee && detailsPosition === "right"
                          ? "pr-80"
                          : ""
                      }`}
                    >
                      {/* Botón para mostrar/ocultar filtros */}
                      <button
                        className="absolute top-4 left-4 z-[1000] bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        {showFilters ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <Filter className="h-4 w-4" />
                        )}
                      </button>

                      {viewMode === "map" ? (
                        /* Mapa */
                        <MapContainer
                          center={mapCenter}
                          zoom={mapZoom}
                          style={{ height: "100%", width: "100%" }}
                          ref={mapRef}
                          whenCreated={(map) => {
                            mapRef.current = map;
                          }}
                          className="z-0"
                          zoomControl={false} // Primero, desactiva el control por defecto
                        >
                          <MapResizer showDetails={selectedEmployee !== null} />

                          {/* Componente para hacer zoom al municipio seleccionado */}
                          <MunicipioZoom
                            selectedMunicipio={selectedMunicipio}
                            municipioCoordinates={municipioCoordinates}
                          />

                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />

                          {/* Geocercas (círculos) */}
                          {geofences.map((geofence) => (
                            <Circle
                              key={geofence.id}
                              center={geofence.center}
                              radius={geofence.radius}
                              pathOptions={{
                                color: "#3388ff",
                                fillColor: "#3388ff",
                                fillOpacity: 0.1,
                                dashArray: "5, 10",
                              }}
                            />
                          ))}

                          {/* Marcadores de empleados */}
                          {filteredEmpleados
                            .filter((emp) => emp.status === "connected")
                            .map((employee) => (
                              <Marker
                                key={employee.id}
                                position={employee.location}
                                icon={
                                  employee.outsideGeofence
                                    ? outsideGeofenceIcon
                                    : connectedIcon
                                }
                                eventHandlers={{
                                  click: () => {
                                    setSelectedEmployee(employee.id);
                                  },
                                }}
                              >
                                <Popup>
                                  <div className="text-sm">
                                    <h3 className="font-medium text-base">
                                      {employee.nombre}{" "}
                                      {employee.apellidoPaterno}
                                    </h3>
                                    <p className="text-gray-600">
                                      {employee.puesto}
                                    </p>
                                    <p className="text-gray-600">
                                      {employee.hospital}
                                    </p>
                                    <div className="mt-2 flex items-center">
                                      <Clock className="mr-1 text-gray-500 h-4 w-4" />
                                      <span>
                                        {employee.horasConectado.toFixed(1)}{" "}
                                        horas trabajadas
                                      </span>
                                    </div>
                                    {employee.outsideGeofence && (
                                      <div className="mt-1 text-orange-600 flex items-center">
                                        <AlertTriangle className="mr-1 h-4 w-4" />
                                        <span>
                                          Fuera de geocerca (
                                          {employee.salidasGeocerca} salidas)
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      onClick={() =>
                                        setSelectedEmployee(employee.id)
                                      }
                                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md flex items-center w-full justify-center"
                                    >
                                      <Info className="mr-1 h-3 w-3" /> Ver
                                      detalles completos
                                    </button>
                                  </div>
                                </Popup>
                              </Marker>
                            ))}
                        </MapContainer>
                      ) : (
                        /* Vista de lista */
                        <div className="h-full overflow-auto p-4">
                          <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
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
                                    Municipio
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
                                    Horas
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
                                {filteredEmpleados.map((employee) => (
                                  <tr
                                    key={employee.id}
                                    className={`hover:bg-gray-50 cursor-pointer ${
                                      selectedEmployee === employee.id
                                        ? "bg-blue-50"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      setSelectedEmployee(employee.id)
                                    }
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                          {employee.nombre.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {employee.nombre}{" "}
                                            {employee.apellidoPaterno}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {employee.puesto}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {employee.hospital}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {employee.municipio}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {employee.estado}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {employee.horasConectado.toFixed(1)}h
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {employee.outsideGeofence ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                          Fuera
                                        </span>
                                      ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          Dentro
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Panel de detalles del empleado seleccionado */}
                      {selectedEmployee && (
                        <div
                          ref={detailsRef}
                          className={`bg-white shadow-lg overflow-y-auto z-10 ${
                            detailsPosition === "right"
                              ? "absolute top-0 right-0 w-80 h-full"
                              : "absolute bottom-0 left-0 w-full h-96 border-t border-gray-200"
                          }`}
                        >
                          {(() => {
                            const employee = empleados.find(
                              (emp) => emp.id === selectedEmployee
                            );
                            if (!employee) return null;

                            return (
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                  <h3 className="font-medium text-lg">
                                    Detalles del Empleado
                                  </h3>
                                  <button
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                                    onClick={() => setSelectedEmployee(null)}
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>

                                {detailsPosition === "bottom" ? (
                                  // Diseño horizontal para vista inferior
                                  <div className="flex flex-col md:flex-row md:space-x-6">
                                    <div className="flex items-center mb-4 md:mb-0">
                                      <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium mr-4">
                                        {employee.nombre.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="text-xl font-medium">
                                          {employee.nombre}{" "}
                                          {employee.apellidoPaterno}
                                        </h4>
                                        <p className="text-gray-600">
                                          {employee.puesto}
                                        </p>
                                        <p className="text-gray-600">
                                          {employee.hospital}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Estado
                                        </h5>
                                        <div
                                          className={`flex items-center ${
                                            employee.status === "connected"
                                              ? "text-green-600"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {employee.status === "connected" ? (
                                            <>
                                              <CheckCircle className="mr-1 h-4 w-4" />
                                              <span>Conectado</span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="mr-1 h-4 w-4" />
                                              <span>Desconectado</span>
                                            </>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {format(
                                            employee.ultimaConexion,
                                            "HH:mm",
                                            { locale: es }
                                          )}
                                        </p>
                                      </div>

                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Tiempo
                                        </h5>
                                        <div className="flex items-center">
                                          <Clock className="mr-1 text-gray-600 h-4 w-4" />
                                          <span>
                                            {employee.horasConectado.toFixed(1)}{" "}
                                            horas
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className={`p-3 rounded-lg ${
                                          employee.outsideGeofence
                                            ? "bg-orange-50"
                                            : "bg-green-50"
                                        }`}
                                      >
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Geocerca
                                        </h5>
                                        {employee.outsideGeofence ? (
                                          <div className="text-orange-600 flex items-center">
                                            <AlertTriangle className="mr-1 h-4 w-4" />
                                            <span>
                                              Fuera ({employee.salidasGeocerca})
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="text-green-600 flex items-center">
                                            <MapPin className="mr-1 h-4 w-4" />
                                            <span>Dentro</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-4 md:mt-0">
                                      <h5 className="text-sm font-medium text-gray-500 mb-2">
                                        Historial de actividad
                                      </h5>
                                      <div className="flex space-x-4">
                                        <div className="flex flex-col items-center">
                                          <div className="p-2 bg-blue-100 rounded-full">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div className="text-xs mt-1">
                                            {format(
                                              new Date(
                                                employee.ultimaConexion.getTime() -
                                                  employee.horasConectado *
                                                    3600000
                                              ),
                                              "HH:mm",
                                              { locale: es }
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Inicio
                                          </div>
                                        </div>

                                        {employee.salidasGeocerca > 0 && (
                                          <div className="flex flex-col items-center">
                                            <div className="p-2 bg-orange-100 rounded-full">
                                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <div className="text-xs mt-1">
                                              {format(
                                                new Date(
                                                  employee.ultimaConexion.getTime() -
                                                    5400000
                                                ),
                                                "HH:mm",
                                                {
                                                  locale: es,
                                                }
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Salida
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex flex-col items-center">
                                          <div className="p-2 bg-green-100 rounded-full">
                                            <Clock className="h-4 w-4 text-green-600" />
                                          </div>
                                          <div className="text-xs mt-1">
                                            {format(
                                              employee.ultimaConexion,
                                              "HH:mm",
                                              { locale: es }
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {employee.status === "connected"
                                              ? "Actual"
                                              : "Fin"}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  // Diseño vertical para vista lateral
                                  <>
                                    <div className="mb-6 flex items-center">
                                      <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-medium mr-4">
                                        {employee.nombre.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="text-xl font-medium">
                                          {employee.nombre}{" "}
                                          {employee.apellidoPaterno}
                                        </h4>
                                        <p className="text-gray-600">
                                          {employee.puesto}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Ubicación
                                        </h5>
                                        <p className="text-gray-800">
                                          {employee.hospital}
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                          {employee.municipio},{" "}
                                          {employee.estado}
                                        </p>
                                      </div>

                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Estado
                                        </h5>
                                        <div
                                          className={`flex items-center ${
                                            employee.status === "connected"
                                              ? "text-green-600"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {employee.status === "connected" ? (
                                            <>
                                              <CheckCircle className="mr-1 h-4 w-4" />
                                              <span>Conectado</span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="mr-1 h-4 w-4" />
                                              <span>Desconectado</span>
                                            </>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                          Última conexión:{" "}
                                          {format(
                                            employee.ultimaConexion,
                                            "d 'de' MMMM, HH:mm",
                                            { locale: es }
                                          )}
                                        </p>
                                      </div>

                                      <div className="bg-gray-50 p-3 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Tiempo de trabajo
                                        </h5>
                                        <div className="flex items-center">
                                          <Clock className="mr-1 text-gray-600 h-4 w-4" />
                                          <span>
                                            {employee.horasConectado.toFixed(1)}{" "}
                                            horas
                                          </span>
                                        </div>
                                      </div>

                                      <div
                                        className={`p-3 rounded-lg ${
                                          employee.outsideGeofence
                                            ? "bg-orange-50"
                                            : "bg-green-50"
                                        }`}
                                      >
                                        <h5 className="text-sm font-medium text-gray-500 mb-1">
                                          Geocerca
                                        </h5>
                                        {employee.outsideGeofence ? (
                                          <div className="text-orange-600 flex items-center">
                                            <AlertTriangle className="mr-1 h-4 w-4" />
                                            <span>Fuera de geocerca</span>
                                          </div>
                                        ) : (
                                          <div className="text-green-600 flex items-center">
                                            <MapPin className="mr-1 h-4 w-4" />
                                            <span>Dentro de geocerca</span>
                                          </div>
                                        )}
                                        <p className="text-sm text-gray-500 mt-1">
                                          Salidas registradas:{" "}
                                          {employee.salidasGeocerca}
                                        </p>
                                      </div>

                                      <div className="pt-2">
                                        <h5 className="text-sm font-medium text-gray-500 mb-2">
                                          Historial de actividad
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between pb-2 border-b border-gray-100">
                                            <span className="text-gray-600">
                                              Inicio de sesión
                                            </span>
                                            <span className="text-gray-800">
                                              {format(
                                                new Date(
                                                  employee.ultimaConexion.getTime() -
                                                    employee.horasConectado *
                                                      3600000
                                                ),
                                                "HH:mm",
                                                { locale: es }
                                              )}
                                            </span>
                                          </div>
                                          {employee.salidasGeocerca > 0 && (
                                            <div className="flex justify-between pb-2 border-b border-gray-100">
                                              <span className="text-gray-600">
                                                Primera salida
                                              </span>
                                              <span className="text-gray-800">
                                                {format(
                                                  new Date(
                                                    employee.ultimaConexion.getTime() -
                                                      5400000
                                                  ),
                                                  "HH:mm",
                                                  {
                                                    locale: es,
                                                  }
                                                )}
                                              </span>
                                            </div>
                                          )}
                                          {employee.status === "connected" ? (
                                            <div className="flex justify-between pb-2 border-b border-gray-100">
                                              <span className="text-gray-600">
                                                Última actualización
                                              </span>
                                              <span className="text-gray-800">
                                                {format(
                                                  employee.ultimaConexion,
                                                  "HH:mm",
                                                  { locale: es }
                                                )}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex justify-between pb-2 border-b border-gray-100">
                                              <span className="text-gray-600">
                                                Desconexión
                                              </span>
                                              <span className="text-gray-800">
                                                {format(
                                                  employee.ultimaConexion,
                                                  "HH:mm",
                                                  { locale: es }
                                                )}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "hospitales" && (
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Hospital className="h-5 w-5 mr-2 text-blue-600" />
                        Hospitales en {estadoActual || "tu estado"}
                      </h3>
                      <div className="relative">
                        <input
                          type="search"
                          placeholder="Buscar hospital..."
                          className="px-4 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabla de hospitales */}
                  {hospitales.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wide">
                            <th className="w-1/3 px-6 py-3">Nombre</th>
                            <th className="w-1/6 px-6 py-3">Tipo</th>
                            <th className="w-1/6 px-6 py-3">Municipio</th>
                            <th className="w-1/3 px-6 py-3">Dirección</th>
                            <th className="w-1/6 px-6 py-3">Radio Geo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {hospitales.map((h, i) => (
                            <tr
                              key={h.id_hospital || i}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 truncate">
                                {h.nombre_hospital}
                              </td>
                              <td className="px-6 py-4">{h.tipo_hospital}</td>
                              <td className="px-6 py-4">{h.municipio}</td>
                              <td className="px-6 py-4 truncate">
                                {h.direccion_hospital}
                              </td>
                              <td className="px-6 py-4">
                                {h.radio_geo ?? 0} m
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No hay hospitales disponibles.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
