"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
} from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  FaHospital,
  FaLayerGroup,
  FaBuilding,
} from "react-icons/fa";
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
const createCustomIcon = (color, borderColor = "white") => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid ${borderColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

// Icono personalizado para hospitales
const hospitalIcon = L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="12" height="12">
            <path d="M19 8h-4V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v4H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1zm-3 6h-3v3h-2v-3H8v-2h3V9h2v3h3v2z"/>
          </svg>
        </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Función para crear icono de cluster personalizado
const createClusterCustomIcon = cluster => {
  const count = cluster.getChildCount();
  let size;
  if (count < 10) size = 30;
  else if (count < 100) size = 35;
  else size = 40;
  
  return L.divIcon({
    html: `
      <div style="background-color: rgba(59, 130, 246, 0.9); width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="${size/2}px" height="${size/2}px">
          <path d="M19 8h-4V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v4H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h4v4a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4h4a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1z"/>
        </svg>
        <span style="position: absolute; bottom: -6px; right: -6px; background-color: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">
          ${count}
        </span>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: [size/2, size/2]
  });
};

const connectedIcon = createCustomIcon("#4CAF50"); // Verde
const outsideGeofenceIcon = createCustomIcon("#FF5722", "#FFF"); // Naranja con borde blanco

const MonitoreoMap = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("hospital");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedHospitalDetail, setSelectedHospitalDetail] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]); // Centro de México
  const [mapZoom, setMapZoom] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGeofences, setShowGeofences] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [error, setError] = useState(null);
  const [hospitalError, setHospitalError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const mapRef = useRef(null);

  // Estados y hospitales por estado
  const [states, setStates] = useState([]);
  const [hospitalsByState, setHospitalsByState] = useState({});

  // Función para obtener estados desde la API
  const fetchStates = async () => {
    try {
      const response = await fetch(
        "https://geoapphospital.onrender.com/api/superadmin/estados"
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // Filtrar "SIN ESTADO" y ordenar por nombre
      const filteredStates = data
        .filter(state => state.nombre_estado !== "SIN ESTADO")
        .sort((a, b) => a.nombre_estado.localeCompare(b.nombre_estado));
      
      setStates(filteredStates);
    } catch (err) {
      console.error("Error al obtener estados:", err);
    }
  };

  // Función para obtener datos de hospitales desde la API
  const fetchHospitalsData = async () => {
    try {
      setLoadingHospitals(true);
      setHospitalError(null);

      const response = await fetch(
        "https://geoapphospital.onrender.com/api/superadmin/hospitals"
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Hospitales cargados:", data.length);
      setHospitals(data);

      // Actualizar hospitales por estado
      updateHospitalsByState(data);
    } catch (err) {
      console.error("Error al obtener datos de hospitales:", err);
      setHospitalError(err.message);
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Función para actualizar hospitales por estado
  const updateHospitalsByState = (hospitalData) => {
    const hospitalsByStateMap = {};

    hospitalData.forEach((hospital) => {
      const state = hospital.estado;
      if (state) {
        if (!hospitalsByStateMap[state]) {
          hospitalsByStateMap[state] = [];
        }
        hospitalsByStateMap[state].push({
          id: hospital.id_hospital,
          nombre: hospital.nombre_hospital,
          latitud: hospital.latitud_hospital,
          longitud: hospital.longitud_hospital
        });
      }
    });

    setHospitalsByState(hospitalsByStateMap);
  };

  // Función para obtener datos de monitoreo desde la API
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://geoapphospital.onrender.com/api/employees/monitoreo"
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transformar los datos de la API al formato esperado por el componente
      const transformedEmployees = data.map((emp) => {
        // Crear avatar con iniciales
        const avatar = `${emp.nombre?.charAt(0) || ""}${
          emp.ap_paterno?.charAt(0) || ""
        }`;

        return {
          id: emp.id_user,
          name: `${emp.nombre} ${emp.ap_paterno} ${emp.ap_materno}`.trim(),
          firstName: emp.nombre,
          lastName: `${emp.ap_paterno} ${emp.ap_materno}`.trim(),
          position: "Empleado", // Valor por defecto
          hospital: "Hospital Asignado", // Valor por defecto
          status: emp.tipo_registro === 1 ? "connected" : "disconnected",
          outsideGeofence: !emp.dentro_geocerca,
          location: [emp.latitud, emp.longitud],
          lastConnection: new Date(emp.fecha_hora),
          avatar: avatar,
          // Datos adicionales calculados
          hoursWorked: calculateHoursWorked(new Date(emp.fecha_hora)),
          geofenceExits: emp.dentro_geocerca ? 0 : 1,
        };
      });

      setEmployees(transformedEmployees);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error al obtener datos de monitoreo:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular horas trabajadas (simplificada)
  const calculateHoursWorked = (lastConnection) => {
    const now = new Date();
    const diffMs = now - lastConnection;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.min(24, diffHours)); // Máximo 24 horas
  };

  // Función para actualizar la vista del mapa
  const updateMapView = () => {
    if (!mapRef.current) return;

    // Solo hacer zoom si hay un estado o hospital seleccionado
    if (selectedState && getHospitalsStatus.status === 'ok') {
      const validHospitalLocations = filteredHospitals
        .filter((h) => h.latitud_hospital && h.longitud_hospital)
        .map((h) => [h.latitud_hospital, h.longitud_hospital]);

      if (validHospitalLocations.length > 0) {
        const bounds = L.latLngBounds(validHospitalLocations);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Si no hay filtros aplicados, mostrar todo México
      mapRef.current.setView([23.6345, -102.5528], 5);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchStates();
    fetchHospitalsData();
    fetchMonitoringData();

    // Configurar actualización automática cada 10 minutos
    const monitoringInterval = setInterval(fetchMonitoringData, 600000);
    const hospitalsInterval = setInterval(fetchHospitalsData, 3600000); // Actualizar hospitales cada hora

    // Establecer la vista inicial de México
    if (mapRef.current) {
      mapRef.current.setView([23.6345, -102.5528], 5);
    }

    return () => {
      clearInterval(monitoringInterval);
      clearInterval(hospitalsInterval);
    };
  }, []);

  // Filtrar empleados según los criterios seleccionados y búsqueda
  const filteredEmployees = employees.filter((emp) => {
    // Solo aplicar filtro de búsqueda por nombre, no filtros de ubicación
    if (
      searchTerm &&
      !emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Filtrar hospitales según los criterios seleccionados
  const filteredHospitals = useMemo(() => {
    if (!selectedState) return [];
    
    return hospitals.filter(hospital => 
      hospital.estado === selectedState && 
      (!selectedHospital || hospital.id_hospital.toString() === selectedHospital)
    );
  }, [hospitals, selectedState, selectedHospital]);

  // Calcular KPIs
  const connectedCount = employees.filter(
    (emp) => emp.status === "connected"
  ).length;
  const disconnectedCount = employees.filter(
    (emp) => emp.status === "disconnected"
  ).length;
  const outsideGeofenceCount = employees.filter(
    (emp) => emp.outsideGeofence
  ).length;

  // Función para manejar el cambio de estado
  const handleStateChange = (selectedState) => {
    setSelectedState(selectedState);
    setSelectedHospital("");
    
    if (selectedState && mapRef.current) {
      const stateHospitals = hospitalsByState[selectedState] || [];
      if (stateHospitals.length > 0) {
        const bounds = L.latLngBounds(
          stateHospitals.map(h => [h.latitud, h.longitud])
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (mapRef.current) {
      // Si no hay estado seleccionado, volver a la vista de México
      mapRef.current.setView([23.6345, -102.5528], 5);
    }
  };

  // Función para manejar el cambio de hospital
  const handleHospitalChange = (hospitalId) => {
    setSelectedHospital(hospitalId);
    
    if (hospitalId && mapRef.current) {
      const selectedStateHospitals = hospitalsByState[selectedState] || [];
      const hospital = selectedStateHospitals.find(h => h.id.toString() === hospitalId);
      if (hospital) {
        mapRef.current.setView([hospital.latitud, hospital.longitud], 15);
      }
    }
  };

  // Función para manejar el clic en un empleado
  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployee(employeeId);
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee && employee.location && mapRef.current) {
      mapRef.current.setView(employee.location, 15);
    }
  };

  // Función para parsear el polígono de geocerca
  const parseGeofencePolygon = (radioGeoString) => {
    try {
      if (!radioGeoString) return null;

      // Limpiar la cadena para convertirla en JSON válido
      const cleanedString = radioGeoString
        .replace(/'/g, '"') // Reemplazar comillas simples por dobles
        .replace(/(\w+):/g, '"$1":'); // Añadir comillas a las claves

      const geoJson = JSON.parse(cleanedString);

      if (
        geoJson.type === "Polygon" &&
        Array.isArray(geoJson.coordinates) &&
        geoJson.coordinates.length > 0
      ) {
        // Invertir lat/lng para Leaflet (GeoJSON usa [lng, lat], Leaflet usa [lat, lng])
        return geoJson.coordinates[0].map((coord) => [coord[1], coord[0]]);
      }
      return null;
    } catch (error) {
      console.error("Error al parsear polígono de geocerca:", error);
      return null;
    }
  };

  // Actualizar la vista del mapa cuando cambian los filtros
  // useEffect(() => {
  //   if (
  //     mapRef.current &&
  //     (filteredEmployees.length > 0 || filteredHospitals.length > 0)
  //   ) {
  //     updateMapView();
  //   }
  // }, [filteredEmployees, filteredHospitals]);

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedState("");
    setSelectedMunicipality("");
    setSelectedHospital("");
    setSearchTerm("");
    setTimeout(updateMapView, 100);
  };

  // Generar color de avatar basado en el nombre
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-violet-500",
      "bg-cyan-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Función para refrescar datos manualmente
  const handleRefresh = () => {
    fetchMonitoringData();
    fetchHospitalsData();
  };

  // Modificar el comportamiento al cerrar detalles
  const handleCloseHospitalDetails = () => {
    setSelectedHospitalDetail(null);
    // No hacer nada con el mapa, mantener la vista actual
  };

  const handleCloseEmployeeDetails = () => {
    setSelectedEmployee(null);
    // No hacer nada con el mapa, mantener la vista actual
  };

  // Función para manejar el clic en un hospital
  const handleHospitalClick = (hospitalId) => {
    setSelectedHospitalDetail(hospitalId);
    const hospital = hospitals.find((h) => h.id_hospital === hospitalId);
    if (hospital && hospital.latitud_hospital && hospital.longitud_hospital) {
      mapRef.current.setView(
        [hospital.latitud_hospital, hospital.longitud_hospital],
        16
      );
    }
  };

  // Validar hospitales por estado
  const getHospitalsStatus = useMemo(() => {
    if (!selectedState) {
      return { 
        status: 'ok',
        hospitals: hospitals.filter(h => h.latitud_hospital && h.longitud_hospital)
      };
    }
    
    const stateHospitals = hospitals.filter(h => h.estado === selectedState);
    
    if (stateHospitals.length === 0) {
      return { 
        status: 'no_hospitals',
        message: `No hay hospitales registrados en ${selectedState}`
      };
    }

    const hospitalsWithCoords = stateHospitals.filter(
      h => h.latitud_hospital && h.longitud_hospital
    );

    if (hospitalsWithCoords.length === 0) {
      return { 
        status: 'no_coordinates',
        message: `Los hospitales en ${selectedState} no tienen coordenadas registradas`
      };
    }

    return { 
      status: 'ok',
      hospitals: hospitalsWithCoords
    };
  }, [selectedState, hospitals]);

  if (
    loading &&
    loadingHospitals &&
    employees.length === 0 &&
    hospitals.length === 0
  ) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-emerald-600 mb-4" />
        <p className="text-gray-600">
          Cargando datos de monitoreo y hospitales...
        </p>
      </div>
    );
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
            <p className="text-2xl font-bold text-gray-800">
              {disconnectedCount}
            </p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 bg-orange-50 rounded-full mr-4">
            <FaExclamationTriangle className="text-orange-600 text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Fuera de Geocerca
            </h3>
            <p className="text-2xl font-bold text-gray-800">
              {outsideGeofenceCount}
            </p>
          </div>
        </div>

        <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 bg-blue-50 rounded-full mr-4">
            <FaHospital className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              {filteredHospitals.length > 0 ? "Hospitales filtrados" : "Hospitales (aplicar filtro)"}
            </h3>
            <p className="text-2xl font-bold text-gray-800">
              {filteredHospitals.length}
            </p>
          </div>
        </div>
      </div>

      {/* Error messages */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-2" />
            <span className="text-red-800">
              Error al cargar datos de empleados: {error}
            </span>
            <button
              onClick={handleRefresh}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {hospitalError && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-600 mr-2" />
            <span className="text-red-800">
              Error al cargar datos de hospitales: {hospitalError}
            </span>
            <button
              onClick={fetchHospitalsData}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
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
                  {filteredHospitals.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {filteredHospitals.length} hospitales
                    </span>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={loading || loadingHospitals}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Actualizar datos"
                  >
                    <FaSync
                      className={
                        loading || loadingHospitals ? "animate-spin" : ""
                      }
                    />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    {states.map((state) => (
                      <option key={state.id_estado} value={state.nombre_estado}>
                        {state.nombre_estado}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedState && hospitalsByState[selectedState] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedHospital}
                      onChange={(e) => handleHospitalChange(e.target.value)}
                    >
                      <option value="">Todos los hospitales</option>
                      {hospitalsByState[selectedState].map((hospital) => (
                        <option key={hospital.id} value={hospital.id}>
                          {hospital.nombre}
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
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showGeofences"
                        checked={showGeofences}
                        onChange={(e) => setShowGeofences(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="showGeofences"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Mostrar geocercas
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showHospitals"
                        checked={showHospitals}
                        onChange={(e) => setShowHospitals(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="showHospitals"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Mostrar hospitales
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Visualización del mapa
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Los empleados siempre se muestran en el mapa. Los
                        hospitales aparecen solo cuando apliques un filtro de
                        ubicación (estado, municipio o hospital específico).
                      </p>
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

            {selectedState && getHospitalsStatus.status !== 'ok' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 max-w-md">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <FaExclamationTriangle className="text-4xl text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se pueden mostrar los hospitales
                    </h3>
                    <p className="text-gray-600">
                      {getHospitalsStatus.message}
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Volver a la vista general
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
                whenCreated={(map) => {
                  mapRef.current = map;
                }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Hospitales y geocercas */}
                {showHospitals && (
                  <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={60}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    iconCreateFunction={createClusterCustomIcon}
                  >
                    {getHospitalsStatus.hospitals.map((hospital) => (
                      <Marker
                        key={hospital.id_hospital}
                        position={[hospital.latitud_hospital, hospital.longitud_hospital]}
                        icon={hospitalIcon}
                        eventHandlers={{
                          click: () => handleHospitalClick(hospital.id_hospital)
                        }}
                      >
                        <Popup className="custom-popup">
                          <div className="text-sm p-1">
                            <h3 className="font-medium text-base text-blue-700">
                              {hospital.nombre_hospital}
                            </h3>
                            <p className="text-gray-600 text-xs mt-1">
                              {hospital.tipo_hospital || "Hospital"}
                            </p>
                            <p className="text-gray-700 mt-2 text-xs">
                              {hospital.direccion_hospital}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {hospital.estado}
                            </p>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                Coordenadas: {hospital.latitud_hospital?.toFixed(6)}, {hospital.longitud_hospital?.toFixed(6)}
                              </p>
                            </div>
                            <button
                              className="w-full mt-2 text-blue-600 text-xs flex items-center justify-center border border-blue-200 rounded-lg py-1 px-2 hover:bg-blue-50"
                              onClick={() => handleHospitalClick(hospital.id_hospital)}
                            >
                              <FaInfoCircle className="mr-1" /> Ver detalles
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                )}

                {/* Mostrar empleados solo si no hay estado seleccionado o si hay hospitales válidos */}
                {(!selectedState || getHospitalsStatus.status === 'ok') && (
                  <>
                    {/* Geocercas de hospitales */}
                    {showHospitals && showGeofences && getHospitalsStatus.hospitals?.map((hospital) => {
                      const hospitalPosition = [
                        hospital.latitud_hospital,
                        hospital.longitud_hospital,
                      ];
                      const geofencePolygon = parseGeofencePolygon(hospital.radio_geo);

                      return (
                        <div key={`geofence-${hospital.id_hospital}`}>
                          {/* Geocerca del hospital (si existe y está habilitada) */}
                          {geofencePolygon && (
                            <Polygon
                              positions={geofencePolygon}
                              pathOptions={{
                                color: "#3b82f6",
                                fillColor: "#3b82f6",
                                fillOpacity: 0.1,
                                weight: 2,
                                dashArray: "5, 5",
                              }}
                            />
                          )}

                          {/* Círculo de radio si no hay polígono pero sí radio */}
                          {!geofencePolygon &&
                            hospital.radio_geo &&
                            hospitalPosition[0] &&
                            hospitalPosition[1] && (
                              <Circle
                                center={hospitalPosition}
                                radius={hospital.radio_geo ? 200 : 100}
                                pathOptions={{
                                  color: "#3b82f6",
                                  fillColor: "#3b82f6",
                                  fillOpacity: 0.1,
                                  weight: 2,
                                  dashArray: "5, 5",
                                }}
                              />
                            )}
                        </div>
                      );
                    })}

                    {/* Marcadores de empleados */}
                    {filteredEmployees
                      .filter(
                        (employee) =>
                          employee.location &&
                          employee.location[0] &&
                          employee.location[1]
                      )
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
                            click: () => handleEmployeeClick(employee.id)
                          }}
                        >
                          <Popup className="custom-popup">
                            <div className="text-sm p-1">
                              <div className="flex items-center mb-2">
                                <div
                                  className={`w-8 h-8 rounded-full ${getAvatarColor(
                                    employee.name
                                  )} text-white flex items-center justify-center font-medium mr-2 text-xs`}
                                >
                                  {employee.avatar}
                                </div>
                                <div>
                                  <h3 className="font-medium text-base">
                                    {employee.name}
                                  </h3>
                                  <p className="text-gray-600 text-xs">
                                    {employee.position}
                                  </p>
                                </div>
                              </div>
                              <p className="text-gray-700 mb-2">
                                {employee.hospital}
                              </p>
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
                                onClick={() => handleEmployeeClick(employee.id)}
                              >
                                <FaInfoCircle className="mr-1" /> Ver detalles
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </>
                )}
              </MapContainer>
            )}
          </div>

          {/* Panel de detalles del empleado seleccionado */}
          {selectedEmployee && (
            <div className="w-80 bg-white border-l border-gray-100 overflow-y-auto">
              <div className="p-5">
                {(() => {
                  const employee = employees.find(
                    (emp) => emp.id === selectedEmployee
                  );
                  if (!employee) return null;

                  return (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="font-semibold text-lg text-gray-800">
                          Detalles del Empleado
                        </h3>
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={handleCloseEmployeeDetails}
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center mb-6">
                        <div
                          className={`w-12 h-12 rounded-full ${getAvatarColor(
                            employee.name
                          )} text-white flex items-center justify-center text-lg font-medium mr-3`}
                        >
                          {employee.avatar}
                        </div>
                        <div>
                          <h4 className="text-xl font-medium text-gray-800">
                            {employee.name}
                          </h4>
                          <p className="text-gray-600">{employee.position}</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-emerald-600" />
                            Ubicación
                          </h5>
                          <p className="text-gray-800 font-medium">
                            {employee.hospital}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {employee.municipality}, {employee.state}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Lat: {employee.location[0]?.toFixed(6)}, Lng:{" "}
                            {employee.location[1]?.toFixed(6)}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Estado
                          </h5>
                          <div
                            className={`flex items-center ${
                              employee.status === "connected"
                                ? "text-emerald-600"
                                : "text-gray-600"
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
                                <span className="font-medium">
                                  Desconectado
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Última conexión:{" "}
                            {format(
                              employee.lastConnection,
                              "d 'de' MMMM, HH:mm",
                              { locale: es }
                            )}
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Geocerca
                          </h5>
                          {employee.outsideGeofence ? (
                            <div className="bg-orange-50 text-orange-800 p-3 rounded-lg flex items-center">
                              <FaExclamationTriangle className="mr-2" />
                              <div>
                                <span className="font-medium">
                                  Fuera de geocerca
                                </span>
                                <p className="text-xs text-orange-700 mt-1">
                                  El empleado se encuentra fuera del área
                                  designada.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg flex items-center">
                              <FaMapMarkerAlt className="mr-2" />
                              <div>
                                <span className="font-medium">
                                  Dentro de geocerca
                                </span>
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
                          onClick={handleCloseEmployeeDetails}
                          className="w-full border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cerrar detalles
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Panel de detalles del hospital seleccionado */}
          {selectedHospitalDetail && (
            <div className="w-80 bg-white border-l border-gray-100 overflow-y-auto">
              <div className="p-5">
                {(() => {
                  const hospital = hospitals.find(
                    (h) => h.id_hospital === selectedHospitalDetail
                  );
                  if (!hospital) return null;

                  return (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="font-semibold text-lg text-gray-800">
                          Detalles del Hospital
                        </h3>
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={handleCloseHospitalDetails}
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-medium mr-3">
                          <FaHospital />
                        </div>
                        <div>
                          <h4 className="text-xl font-medium text-gray-800">
                            {hospital.nombre_hospital}
                          </h4>
                          <p className="text-gray-600">
                            {hospital.tipo_hospital || "Hospital"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-blue-600" />
                            Ubicación
                          </h5>
                          <p className="text-gray-800 font-medium">
                            {hospital.estado}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {hospital.direccion_hospital}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Lat: {hospital.latitud_hospital?.toFixed(6)}, Lng:{" "}
                            {hospital.longitud_hospital?.toFixed(6)}
                          </p>
                        </div>

                        {hospital.radio_geo && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Geocerca
                            </h5>
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg">
                              <p className="text-xs">
                                Este hospital tiene una geocerca definida que se
                                muestra en el mapa.
                              </p>
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Información adicional
                          </h5>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">ID:</span>{" "}
                              {hospital.id_hospital}
                            </p>
                            {hospital.coordenadas_hospital && (
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="font-medium">
                                  Coordenadas:
                                </span>{" "}
                                {hospital.coordenadas_hospital}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={handleCloseHospitalDetails}
                          className="w-full border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cerrar detalles
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoreoMap;

