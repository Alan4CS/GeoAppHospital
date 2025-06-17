import { useState, useEffect, useRef, useMemo, memo } from "react";
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
import { FaUserCheck, FaUserTimes, FaExclamationTriangle, FaChevronLeft, FaChevronRight,
  FaInfoCircle, FaClock, FaMapMarkerAlt, FaFilter, FaSearch, FaMapMarkedAlt, FaSpinner,
  FaSync, FaHospital, FaLayerGroup, FaBuilding, FaChevronUp, FaUser,
} from "react-icons/fa";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { debounce } from "lodash";

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

// Icono de cluster personalizado para empleados
const createEmployeeClusterIcon = cluster => {
  const count = cluster.getChildCount();
  let size;
  if (count < 10) size = 30;
  else if (count < 100) size = 35;
  else size = 40;

  return L.divIcon({
    html: `
      <div style="background-color: rgba(16, 185, 129, 0.92); width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; position: relative;">
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='${size/2}px' height='${size/2}px'>
          <circle cx='12' cy='8' r='4' />
          <rect x='6' y='14' width='12' height='6' rx='3' />
        </svg>
        <span style="position: absolute; bottom: -6px; right: -6px; background-color: #059669; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white;">
          ${count}
        </span>
      </div>
    `,
    className: 'employee-cluster-icon',
    iconSize: L.point(size, size),
    iconAnchor: [size/2, size/2]
  });
};

const connectedIcon = createCustomIcon("#4CAF50"); // Verde para conectados
const outsideGeofenceIcon = createCustomIcon("#FF5722", "#FFF"); // Naranja para fuera de geocerca
const inactiveIcon = createCustomIcon("#DC2626", "#FFF"); // Rojo para inactivos

const MonitoreoMap = () => {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("hospital");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedHospitalDetail, setSelectedHospitalDetail] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]); // Centro de México
  const [mapZoom, setMapZoom] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGeofences, setShowGeofences] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
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

  // Dimensiones optimizadas para mejor rendimiento
  const mapContainerStyle = useMemo(() => ({
    height: "calc(100vh - 64px - 10rem)", // Reducir altura considerando header, KPIs y padding
    width: "95%", // Dejar un pequeño margen en los lados
    position: "relative",
    margin: "0 auto", // Centrar el mapa
    maxWidth: "1800px", // Limitar el ancho máximo
  }), []);

  const kpiCardStyle = {
    minHeight: "84px",
    display: "flex",
    alignItems: "center"
  };

  // Optimizar actualizaciones de estado
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  // Manejar cambios de búsqueda de forma optimizada
  const handleSearchChange = (e) => {
    debouncedSetSearchTerm(e.target.value);
  };

  // Precalcular dimensiones del contenedor de filtros
  const filterContainerStyle = useMemo(() => ({
    transform: showFilters ? 'translateX(0)' : 'translateX(-100%)',
    opacity: showFilters ? 1 : 0,
    transition: 'transform 200ms ease-in-out, opacity 200ms ease-in-out'
  }), [showFilters]);

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
          position: "Empleado",
          hospital: emp.nombre_hospital || "Sin hospital asignado",
          hospitalId: emp.id_hospital,
          tipo_registro: emp.tipo_registro,
          dentro_geocerca: emp.dentro_geocerca,
          location: [emp.latitud, emp.longitud],
          lastConnection: new Date(emp.fecha_hora),
          avatar: avatar,
          hoursWorked: calculateHoursWorked(new Date(emp.fecha_hora)),
          geofenceExits: emp.dentro_geocerca ? 0 : 1,
        };
      });

      setEmployees(transformedEmployees);
      setLastUpdate(new Date());

      // Calcular estadísticas por hospital
      const statsByHospital = transformedEmployees.reduce((acc, emp) => {
        const hospitalId = emp.hospitalId;
        if (!acc[hospitalId]) {
          acc[hospitalId] = {
            nombre: emp.hospital,
            total: 0,
            activos: 0,
            inactivos: 0,
            dentroGeocerca: 0,
            fueraGeocerca: 0
          };
        }
        
        acc[hospitalId].total++;
        if (emp.tipo_registro === 1) acc[hospitalId].activos++;
        if (emp.tipo_registro === 0) acc[hospitalId].inactivos++;
        if (emp.dentro_geocerca) acc[hospitalId].dentroGeocerca++;
        if (!emp.dentro_geocerca) acc[hospitalId].fueraGeocerca++;
        
        return acc;
      }, {});

      setHospitalStats(statsByHospital);
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

  // Función para obtener el total de empleados registrados y contar por hospital
  const fetchTotalEmployees = async () => {
    try {
      const response = await fetch(
        "https://geoapphospital.onrender.com/api/employees/get-empleados"
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTotalEmployees(data.length);

      // Contar empleados por hospital
      const employeesByHospital = data.reduce((acc, emp) => {
        const hospitalId = emp.id_hospital;
        if (!acc[hospitalId]) {
          acc[hospitalId] = 0;
        }
        acc[hospitalId]++;
        return acc;
      }, {});

      // Actualizar el estado de empleados por hospital
      setEmployeesByHospital(employeesByHospital);
    } catch (err) {
      console.error("Error al obtener total de empleados:", err);
    }
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

  // Controlar actualización solo si la pantalla está visible
  const monitoringIntervalRef = useRef(null);

  // Función para iniciar el intervalo de monitoreo
  const startMonitoringInterval = () => {
    if (monitoringIntervalRef.current) return;
    monitoringIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMonitoringData();
      }
    }, 300000); // 5 minutos
  };

  // Función para detener el intervalo de monitoreo
  const stopMonitoringInterval = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  };

  // Efecto para manejar visibilidad de la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMonitoringData();
        startMonitoringInterval();
      } else {
        stopMonitoringInterval();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Iniciar si la pestaña ya está visible
    if (document.visibilityState === 'visible') {
      startMonitoringInterval();
    }
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopMonitoringInterval();
    };
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchStates();
    fetchHospitalsData();
    fetchMonitoringData();
    fetchTotalEmployees();
    const hospitalsInterval = setInterval(fetchHospitalsData, 3600000); // Actualizar hospitales cada hora
    if (mapRef.current) {
      mapRef.current.setView([23.6345, -102.5528], 5);
    }
    return () => {
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
    (emp) => emp.tipo_registro === 1
  ).length;
  const disconnectedCount = employees.filter(
    (emp) => emp.tipo_registro === 0
  ).length;
  const outsideGeofenceCount = employees.filter(
    (emp) => !emp.dentro_geocerca
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
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee && employee.location && mapRef.current) {
      mapRef.current.setView(employee.location, 18);
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

  // Función para manejar el clic en un hospital
  const handleHospitalClick = (hospitalId) => {
    const hospital = hospitals.find((h) => h.id_hospital === hospitalId);
    if (hospital && hospital.latitud_hospital && hospital.longitud_hospital) {
      mapRef.current.setView(
        [hospital.latitud_hospital, hospital.longitud_hospital],
        18
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

  // Memoizar los datos filtrados para evitar recálculos innecesarios
  const filteredEmployeesData = useMemo(() => {
    return employees.filter((emp) => {
      if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
        return false;
      return true;
    }).filter(
      (employee) =>
        employee.location &&
        employee.location[0] &&
        employee.location[1]
    );
  }, [employees, searchTerm]);

  // Memoizar los hospitales filtrados y sus geocercas
  const hospitalAndGeofenceData = useMemo(() => {
    if (!showHospitals || !getHospitalsStatus.hospitals) return [];
    
    return getHospitalsStatus.hospitals.map(hospital => ({
      hospital,
      geofencePolygon: parseGeofencePolygon(hospital.radio_geo),
      position: [hospital.latitud_hospital, hospital.longitud_hospital]
    }));
  }, [showHospitals, getHospitalsStatus.hospitals]);

  // Agregar estado para empleados por hospital
  const [employeesByHospital, setEmployeesByHospital] = useState({});

  // Agregar estado para estadísticas por hospital
  const [hospitalStats, setHospitalStats] = useState({});

  // Componente separado para los marcadores de empleados
  const EmployeeMarkers = memo(({ employees }) => {
    return (
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={10} // Puedes ajustar este valor para controlar la distancia de agrupamiento
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        iconCreateFunction={createEmployeeClusterIcon}
        maxZoom={18}
        animate={false}
      >
        {employees.map((employee) => {
          // Determinar qué icono usar basado en el estado
          let icon;
          if (employee.tipo_registro === 0) {
            icon = inactiveIcon;
          } else if (!employee.dentro_geocerca) {
            icon = outsideGeofenceIcon;
          } else {
            icon = connectedIcon;
          }

          return (
            <Marker
              key={employee.id}
              position={employee.location}
              icon={icon}
              eventHandlers={{
                click: () => handleEmployeeClick(employee.id)
              }}
            >
              <Popup className="custom-popup">
                <div className="text-sm p-1">
                  <div className="flex items-center mb-2">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(employee.name)} text-white flex items-center justify-center font-medium mr-2 text-xs`}>
                      {employee.avatar}
                    </div>
                    <div>
                      <h3 className="font-medium text-base">{employee.name}</h3>
                      <p className="text-gray-600 text-xs">{employee.position}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-700">
                      <FaHospital className="mr-1 text-blue-600" />
                      <span className="text-sm">{employee.hospital}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-600 text-xs">
                        <FaClock className="mr-1" />
                        <span>Última conexión: {format(employee.lastConnection, "d 'de' MMMM, HH:mm", { locale: es })}</span>
                      </div>
                    </div>
                    {employee.tipo_registro === 0 ? (
                      <div className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-lg flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        <span>Usuario inactivo</span>
                      </div>
                    ) : !employee.dentro_geocerca ? (
                      <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-lg flex items-center">
                        <FaExclamationTriangle className="mr-1" />
                        <span>Fuera de geocerca de {employee.hospital}</span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>Dentro de geocerca de {employee.hospital}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      <p>Coordenadas:</p>
                      <p>Lat: {employee.location[0]?.toFixed(6)}</p>
                      <p>Lng: {employee.location[1]?.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    );
  });
  EmployeeMarkers.displayName = 'EmployeeMarkers';

  // Componente separado para los marcadores de hospitales
  const HospitalMarkers = memo(({ hospitals }) => {
    return (
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        iconCreateFunction={createClusterCustomIcon}
      >
        {hospitals.map((hospital) => (
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
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2">
                    <FaHospital className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base text-blue-700">
                      {hospital.nombre_hospital}
                    </h3>
                    <p className="text-gray-600 text-xs">
                      {hospital.tipo_hospital || "Hospital"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-gray-700 text-sm">
                    <p className="font-medium">{hospital.estado}</p>
                    <p className="text-xs mt-1">{hospital.direccion_hospital}</p>
                  </div>
                  <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded-lg text-xs flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUser className="mr-1" />
                      <span>Empleados asignados:</span>
                    </div>
                    <span className="font-semibold">{employeesByHospital[hospital.id_hospital] || 0}</span>
                  </div>
                  {hospital.radio_geo && (
                    <div className="bg-blue-50 text-blue-800 px-2 py-1 rounded-lg text-xs flex items-center">
                      <FaLayerGroup className="mr-1" />
                      <span>Geocerca activa</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    <p>Coordenadas:</p>
                    <p>Lat: {hospital.latitud_hospital?.toFixed(6)}</p>
                    <p>Lng: {hospital.longitud_hospital?.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    );
  });
  HospitalMarkers.displayName = 'HospitalMarkers';

  // Componente separado para las geocercas
  const GeofenceOverlays = memo(({ data, showGeofences }) => {
    if (!showGeofences) return null;

    return data.map(({ hospital, geofencePolygon, position }) => (
      <div key={`geofence-${hospital.id_hospital}`}>
        {geofencePolygon ? (
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
        ) : (
          hospital.radio_geo && position[0] && position[1] && (
            <Circle
              center={position}
              radius={hospital.radio_geo ? 200 : 100}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
                weight: 2,
                dashArray: "5, 5",
              }}
            />
          )
        )}
      </div>
    ));
  });
  GeofenceOverlays.displayName = 'GeofenceOverlays';

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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* KPIs con espaciado reducido */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 px-4 pt-2 pb-3 max-w-[1800px] mx-auto w-[95%]">
        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="p-2.5 bg-emerald-50 rounded-full mr-3">
            <FaUserCheck className="text-emerald-600 text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Empleados Activos</h3>
            <p className="text-xl font-bold text-gray-800">{connectedCount}</p>
            {selectedHospital && hospitalStats[selectedHospital] && (
              <p className="text-xs text-emerald-600 mt-0.5">
                {hospitalStats[selectedHospital].activos} en {hospitalStats[selectedHospital].nombre}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="p-2.5 bg-gray-50 rounded-full mr-3">
            <FaUserTimes className="text-gray-600 text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Empleados Inactivos</h3>
            <p className="text-xl font-bold text-gray-800">{disconnectedCount}</p>
            {selectedHospital && hospitalStats[selectedHospital] && (
              <p className="text-xs text-gray-600 mt-0.5">
                {hospitalStats[selectedHospital].inactivos} en {hospitalStats[selectedHospital].nombre}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="p-2.5 bg-orange-50 rounded-full mr-3">
            <FaExclamationTriangle className="text-orange-600 text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Fuera de Geocerca</h3>
            <p className="text-xl font-bold text-gray-800">{outsideGeofenceCount}</p>
            {selectedHospital && hospitalStats[selectedHospital] && (
              <p className="text-xs text-orange-600 mt-0.5">
                {hospitalStats[selectedHospital].fueraGeocerca} en {hospitalStats[selectedHospital].nombre}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="p-2.5 bg-blue-50 rounded-full mr-3">
            <FaHospital className="text-blue-600 text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Hospitales</h3>
            <p className="text-xl font-bold text-gray-800">{hospitals.length}</p>
            {selectedState ? (
              <p className="text-xs text-blue-600 mt-0.5">
                {filteredHospitals.length} filtrados en {selectedState}
              </p>
            ) : (
              <p className="text-xs text-blue-600 mt-0.5">
                Promedio: {hospitals.length > 0 ? Math.round(totalEmployees / hospitals.length) : 0} emp/hospital
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="p-2.5 bg-purple-50 rounded-full mr-3">
            <FaUser className="text-purple-600 text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Empleados</h3>
            <p className="text-xl font-bold text-gray-800">{totalEmployees}</p>
            {selectedHospital && hospitalStats[selectedHospital] && (
              <p className="text-xs text-purple-600 mt-0.5">
                {hospitalStats[selectedHospital].total} en {hospitalStats[selectedHospital].nombre}
              </p>
            )}
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

      {/* Contenedor principal optimizado */}
      <div className="flex-1 px-4 pt-2 pb-4 overflow-hidden flex justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative" style={mapContainerStyle}>
          {/* Barra de herramientas flotante con posición fija */}
          <div
            className="absolute top-3 left-14 z-[10] bg-white rounded-lg shadow-lg border border-gray-200 transform-gpu"
            style={filterContainerStyle}
          >
            <div className="px-3 py-2">
              <div className="flex items-center gap-3">
                {/* Buscador optimizado */}
                <div className="relative w-48">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400 text-sm" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar empleado..."
                    onChange={handleSearchChange}
                    className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>

                {/* Estado */}
                <select
                  className="w-48 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

                {/* Hospital */}
                {selectedState && hospitalsByState[selectedState] && (
                  <select
                    className="w-48 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                )}

                {/* Capas */}
                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-md">
                  <label className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={showGeofences}
                      onChange={(e) => setShowGeofences(e.target.checked)}
                      className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    Geocercas
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={showHospitals}
                      onChange={(e) => setShowHospitals(e.target.checked)}
                      className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    Hospitales
                  </label>
                </div>

                <div className="h-5 border-l border-gray-200 mx-1"></div>

                {/* Contadores */}
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">
                    {filteredEmployees.length} emp.
                  </span>
                </div>

                {/* Botones */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={updateMapView}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 text-sm"
                  >
                    <FaFilter className="text-xs" />
                    <span>Aplicar</span>
                  </button>
                  <button
                    onClick={clearFilters}
                    className="border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botón para mostrar/ocultar filtros */}
          <button
            className="absolute top-4 left-4 z-[11] bg-white text-emerald-600 p-3 rounded-full shadow-md hover:bg-emerald-50 transition-transform duration-200 transform-gpu"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter 
              className={`transform transition-transform duration-200 ${
                showFilters ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>

          {/* MapContainer con configuración optimizada */}
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: "1" }}
            ref={mapRef}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
            zoomControl={false}
            maxZoom={18}
            preferCanvas={true}
            renderer={L.canvas()}
            updateWhenZooming={false}
            updateWhenIdle={true}
            // Agregar más optimizaciones
            minZoom={5}
            maxBounds={[
              [14.5321, -119.2827], // Esquina suroeste de México
              [32.7187, -86.5932]   // Esquina noreste de México
            ]}
            maxBoundsViscosity={1.0}
            bounceAtZoomLimits={false}
          >
            {/* Optimizar el TileLayer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              tileSize={256}
              minZoom={5}
              maxZoom={18}
              keepBuffer={2}
              updateWhenIdle={true}
              updateWhenZooming={false}
            />

            {/* Optimizar clusters */}
            {showHospitals && (
              <MarkerClusterGroup
                chunkedLoading={true}
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                iconCreateFunction={createClusterCustomIcon}
                maxZoom={18}
                animate={false}
              >
                <HospitalMarkers hospitals={getHospitalsStatus.hospitals} />
              </MarkerClusterGroup>
            )}

            {/* Optimizar renderizado de empleados */}
            {(!selectedState || getHospitalsStatus.status === 'ok') && (
              <>
                <GeofenceOverlays 
                  data={hospitalAndGeofenceData} 
                  showGeofences={showGeofences && showHospitals} 
                />
                <EmployeeMarkers employees={filteredEmployeesData} />
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default memo(MonitoreoMap);

