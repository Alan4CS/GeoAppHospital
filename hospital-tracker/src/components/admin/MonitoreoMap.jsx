import { useState, useEffect, useRef, useMemo, memo, createRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon,
} from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaUserCheck, FaUserTimes, FaExclamationTriangle, FaChevronLeft, FaChevronRight,
  FaInfoCircle, FaClock, FaMapMarkerAlt, FaFilter, FaSearch, FaMapMarkedAlt, FaSpinner,
  FaSync, FaHospital, FaLayerGroup, FaBuilding, FaChevronUp, FaUser, FaExpandAlt, FaMobileAlt,
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

const MonitoreoMap = ({ modoEstadoAdmin = false, estadoId = null, estadoNombre = "" }) => {
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

  // Función para obtener el estado del administrador estatal
  const fetchEstadoAdmin = async () => {
    if (!modoEstadoAdmin || !estadoId) return;
    
    try {
      const response = await fetch(
        `https://geoapphospital.onrender.com/api/estadoadmin/hospitals-by-user/${estadoId}?source=hospitals`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Si hay hospitales, tomar el nombre_estado del primero
      if (Array.isArray(data) && data.length > 0) {
        const nombreEstado = data[0].nombre_estado || "";
        if (nombreEstado) {
          setSelectedState(nombreEstado);
          console.log("Estado del administrador estatal detectado:", nombreEstado);
        }
      }
    } catch (err) {
      console.error("Error al obtener estado del administrador:", err);
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
    
    // Si es modo administrador estatal, obtener el estado automáticamente
    if (modoEstadoAdmin) {
      if (estadoNombre) {
        // Si ya tenemos el nombre del estado, usarlo directamente
        setSelectedState(estadoNombre);
        console.log("Estado del administrador estatal establecido:", estadoNombre);
      } else if (estadoId) {
        // Si no tenemos el nombre pero sí el ID, obtenerlo de la API
        fetchEstadoAdmin();
      }
    }
    
    const hospitalsInterval = setInterval(fetchHospitalsData, 3600000); // Actualizar hospitales cada hora
    if (mapRef.current) {
      mapRef.current.setView([23.6345, -102.5528], 5);
    }
    return () => {
      clearInterval(hospitalsInterval);
    };
  }, [modoEstadoAdmin, estadoId, estadoNombre]);

  // Efecto para manejar el cambio automático de estado en modo administrador estatal
  useEffect(() => {
    if (modoEstadoAdmin && selectedState && mapRef.current) {
      // Esperar un poco para que los hospitales se carguen
      setTimeout(() => {
        const stateHospitals = hospitalsByState[selectedState] || [];
        if (stateHospitals.length > 0) {
          const bounds = L.latLngBounds(
            stateHospitals.map(h => [h.latitud, h.longitud])
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }, 1000);
    }
  }, [modoEstadoAdmin, selectedState, hospitalsByState]);

  // Efecto para establecer el estado cuando estadoNombre cambia
  useEffect(() => {
    if (modoEstadoAdmin && estadoNombre && !selectedState) {
      setSelectedState(estadoNombre);
      console.log("Estado del administrador estatal establecido desde prop:", estadoNombre);
    }
  }, [modoEstadoAdmin, estadoNombre, selectedState]);

  // Filtrar empleados según los criterios seleccionados y búsqueda
  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      return [];
    }
    
    return employees.filter((emp) => {
      // Solo aplicar filtro de búsqueda por nombre, no filtros de ubicación
      if (
        searchTerm &&
        !emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      
      // Filtro por estado si está seleccionado
      if (selectedState && emp.hospital) {
        // Buscar el hospital del empleado en la lista de hospitales del estado seleccionado
        const hospitalInState = hospitals.find(h => 
          h.id_hospital === emp.hospitalId && 
          h.estado === selectedState
        );
        if (!hospitalInState) {
          return false;
        }
        
        // Filtro adicional por hospital específico si está seleccionado
        if (selectedHospital && emp.hospitalId.toString() !== selectedHospital) {
          return false;
        }
      }
      
      return true;
    });
  }, [employees, searchTerm, selectedState, selectedHospital, hospitals]);

  // Filtrar hospitales según los criterios seleccionados
  const filteredHospitals = useMemo(() => {
    if (!selectedState) return [];
    
    return hospitals.filter(hospital => 
      hospital.estado === selectedState && 
      (!selectedHospital || hospital.id_hospital.toString() === selectedHospital)
    );
  }, [hospitals, selectedState, selectedHospital]);

  // Calcular KPIs
  const connectedCount = useMemo(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees)) return 0;
    return filteredEmployees.filter((emp) => emp.tipo_registro === 1).length;
  }, [filteredEmployees]);
  
  const disconnectedCount = useMemo(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees)) return 0;
    return filteredEmployees.filter((emp) => emp.tipo_registro === 0).length;
  }, [filteredEmployees]);
  
  const outsideGeofenceCount = useMemo(() => {
    if (!filteredEmployees || !Array.isArray(filteredEmployees)) return 0;
    return filteredEmployees.filter((emp) => !emp.dentro_geocerca).length;
  }, [filteredEmployees]);

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

  // Refs para markers de empleados y cluster group
  const employeeMarkerRefs = useRef({});
  const employeeClusterGroupRef = useRef(null);

  // Función para manejar el clic en un empleado
  const handleEmployeeClick = (employeeId) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (employee && employee.location && mapRef.current) {
      mapRef.current.setView(employee.location, 18);
      // Abrir popup incluso si está en cluster
      const markerRef = employeeMarkerRefs.current[employeeId];
      const clusterGroup = employeeClusterGroupRef.current;
      const marker = markerRef?.leafletElement || markerRef?.current || markerRef;
      const cluster = clusterGroup?.leafletElement || clusterGroup?.current || clusterGroup;
      if (marker && cluster && typeof cluster.zoomToShowLayer === 'function') {
        cluster.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      }
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
    // No limpiar el estado si estamos en modo administrador estatal
    if (!modoEstadoAdmin) {
      setSelectedState("");
    }
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
        message: `No hay hospitales registrados en ${selectedState}`,
        hospitals: []
      };
    }

    const hospitalsWithCoords = stateHospitals.filter(
      h => h.latitud_hospital && h.longitud_hospital
    );

    if (hospitalsWithCoords.length === 0) {
      return { 
        status: 'no_coordinates',
        message: `Los hospitales en ${selectedState} no tienen coordenadas registradas`,
        hospitals: []
      };
    }

    return { 
      status: 'ok',
      hospitals: hospitalsWithCoords
    };
  }, [selectedState, hospitals]);

  // Memoizar los datos filtrados para evitar recálculos innecesarios
  const filteredEmployeesData = useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      return [];
    }
    
    return employees.filter((emp) => {
      // Filtro de búsqueda por nombre
      if (searchTerm && !emp.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro por estado si está seleccionado
      if (selectedState && emp.hospital) {
        // Buscar el hospital del empleado en la lista de hospitales del estado seleccionado
        const hospitalInState = hospitals.find(h => 
          h.id_hospital === emp.hospitalId && 
          h.estado === selectedState
        );
        if (!hospitalInState) {
          return false;
        }
        
        // Filtro adicional por hospital específico si está seleccionado
        if (selectedHospital && emp.hospitalId.toString() !== selectedHospital) {
          return false;
        }
      }
      
      return true;
    }).filter(
      (employee) =>
        employee.location &&
        employee.location[0] &&
        employee.location[1]
    );
  }, [employees, searchTerm, selectedState, selectedHospital, hospitals]);

  // Memoizar los hospitales filtrados y sus geocercas
  const hospitalAndGeofenceData = useMemo(() => {
    if (!showHospitals || !getHospitalsStatus.hospitals || !Array.isArray(getHospitalsStatus.hospitals)) {
      return [];
    }
    
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
  const EmployeeMarkers = memo(({ employees, markerRefs, clusterGroupRef }) => {
    // Validar que employees sea un array válido
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return null;
    }

    return (
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={10}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        iconCreateFunction={createEmployeeClusterIcon}
        maxZoom={18}
        animate={false}
        ref={clusterGroupRef}
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

          // Crear ref si no existe
          if (!markerRefs.current[employee.id]) {
            markerRefs.current[employee.id] = createRef();
          }

          return (
            <Marker
              key={employee.id}
              position={employee.location}
              icon={icon}
              ref={markerRefs.current[employee.id]}
              eventHandlers={{
                click: () => handleEmployeeClick(employee.id)
              }}
            >
              <Popup className="custom-popup">
                <div className="popup-hospital-card popup-employee-card">
                  {/* Botón cerrar arriba a la derecha */}
                  <button
                    className="popup-close"
                    onClick={e => {
                      e.stopPropagation();
                      const popup = e.target.closest('.leaflet-popup');
                      if (popup) {
                        const closeBtn = popup.querySelector('.leaflet-popup-close-button');
                        if (closeBtn) closeBtn.click();
                      }
                    }}
                    title="Cerrar"
                  >
                    ×
                  </button>
                  {/* Header */}
                  <div className="popup-header popup-employee-header">
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(employee.name)} text-white flex items-center justify-center font-medium mr-2 text-xs`}>
                      {employee.avatar}
                    </div>
                    <div>
                      <h3 className="popup-title">{employee.name}</h3>
                      <p className="popup-type">{employee.position}</p>
                    </div>
                  </div>
                  {/* Info general */}
                  <div className="popup-info">
                    <span className="popup-state"><FaHospital className="mr-1 text-blue-600 inline" />{employee.hospital}</span>
                    <span className="popup-address"><FaClock className="mr-1 inline" />Última conexión: {format(employee.lastConnection, "d 'de' MMMM, HH:mm", { locale: es })}</span>
                  </div>
                  {/* Estado de registro y geocerca */}
                  <div className="popup-stats">
                    {employee.tipo_registro === 1 && (
                      <div className="popup-stats-row text-emerald-700">
                        <FaUserCheck className="popup-icon" /> Usuario activo
                      </div>
                    )}
                    {employee.tipo_registro === 0 && (
                      <div className="popup-stats-row text-red-700">
                        <FaExclamationTriangle className="popup-icon" /> Usuario inactivo
                      </div>
                    )}
                    {employee.dentro_geocerca === true && (
                      <div className="popup-stats-row text-emerald-700">
                        <FaMapMarkerAlt className="popup-icon" />
                        <span>Dentro de geocerca</span>
                      </div>
                    )}
                    {employee.dentro_geocerca === false && (
                      <div className="popup-stats-row text-orange-700">
                        <FaExclamationTriangle className="popup-icon" />
                        <span>Fuera de geocerca</span>
                      </div>
                    )}
                  </div>
                  {/* Coordenadas */}
                  <div className="popup-coords">
                    <span>Coordenadas:</span>
                    <span>Lat: {employee.location[0]?.toFixed(6)}</span>
                    <span>Lng: {employee.location[1]?.toFixed(6)}</span>
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
    // Validar que hospitals sea un array válido
    if (!hospitals || !Array.isArray(hospitals) || hospitals.length === 0) {
      return null;
    }

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
              <div className="popup-hospital-card">
                {/* Botón cerrar arriba a la derecha */}
                <button
                  className="popup-close"
                  onClick={e => {
                    e.stopPropagation();
                    const popup = e.target.closest('.leaflet-popup');
                    if (popup) {
                      const closeBtn = popup.querySelector('.leaflet-popup-close-button');
                      if (closeBtn) closeBtn.click();
                    }
                  }}
                  title="Cerrar"
                >
                  ×
                </button>
                {/* Header */}
                <div className="popup-header">
                  <div>
                    <h3 className="popup-title">{hospital.nombre_hospital}</h3>
                    <p className="popup-type">{hospital.tipo_hospital || "Hospital"}</p>
                  </div>
                </div>
                {/* Info general */}
                <div className="popup-info">
                  <span className="popup-state">{hospital.estado}</span>
                  <span className="popup-address">{hospital.direccion_hospital}</span>
                </div>
                {/* Estadísticas */}
                <div className="popup-stats">
                  <div className="popup-stats-row">
                    <FaUser className="popup-icon" />
                    <span>Total asignados:</span>
                    <span className="popup-bold">{employeesByHospital[hospital.id_hospital] || 0}</span>
                  </div>
                  <div className="popup-stats-row">
                    <FaMobileAlt className="popup-icon" />
                    <span>Con app:</span>
                    <span>{hospitalStats[hospital.id_hospital]?.activos + hospitalStats[hospital.id_hospital]?.inactivos || 0}</span>
                  </div>
                  <div className="popup-stats-subrow">
                    <span className="popup-dot popup-dot-green" /> Activos: {hospitalStats[hospital.id_hospital]?.activos || 0}
                  </div>
                  <div className="popup-stats-subrow">
                    <span className="popup-dot popup-dot-red" /> Inactivos: {hospitalStats[hospital.id_hospital]?.inactivos || 0}
                  </div>
                </div>
                {/* Ubicación */}
                <div className="popup-location">
                  <div className="popup-stats-row">
                    <FaMapMarkerAlt className="popup-icon" />
                    <span>Ubicación actual:</span>
                  </div>
                  <div className="popup-stats-subrow">
                    <span className="popup-dot popup-dot-green" /> Dentro de geocerca: {hospitalStats[hospital.id_hospital]?.dentroGeocerca || 0}
                  </div>
                  <div className="popup-stats-subrow">
                    <span className="popup-dot popup-dot-red" /> Fuera de geocerca: {hospitalStats[hospital.id_hospital]?.fueraGeocerca || 0}
                  </div>
                </div>
                {/* Geocerca */}
                {hospital.radio_geo && (
                  <div className="popup-geofence">
                    <FaLayerGroup className="popup-icon" /> Geocerca activa
                  </div>
                )}
                {/* Coordenadas */}
                <div className="popup-coords">
                  <span>Coordenadas:</span>
                  <span>Lat: {hospital.latitud_hospital?.toFixed(6)}</span>
                  <span>Lng: {hospital.longitud_hospital?.toFixed(6)}</span>
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
    if (!showGeofences || !data || !Array.isArray(data) || data.length === 0) return null;

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
        {/* Empleados Activos */}
        <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="flex items-center">
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
          {/* Lista desplegable de empleados activos */}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-emerald-700 hover:underline select-none">Ver empleados</summary>
            <div className="mt-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {employees.filter(emp => emp.tipo_registro === 1).length === 0 ? (
                <div className="text-xs text-gray-400 px-2 py-2">No hay empleados activos</div>
              ) : (
                employees.filter(emp => emp.tipo_registro === 1).map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-emerald-50 rounded cursor-pointer"
                    onClick={() => handleEmployeeClick(emp.id)}
                  >
                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(emp.name)} text-white flex items-center justify-center font-medium text-xs`}>
                      {emp.avatar}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="text-xs">{emp.name}</span>
                      <span className="ml-2 text-[10px] text-gray-500">{emp.hospital}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>

        {/* Empleados Inactivos */}
        <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="flex items-center">
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
          {/* Lista desplegable de empleados inactivos */}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-700 hover:underline select-none">Ver empleados</summary>
            <div className="mt-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {employees.filter(emp => emp.tipo_registro === 0).length === 0 ? (
                <div className="text-xs text-gray-400 px-2 py-2">No hay empleados inactivos</div>
              ) : (
                employees.filter(emp => emp.tipo_registro === 0).map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => handleEmployeeClick(emp.id)}
                  >
                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(emp.name)} text-white flex items-center justify-center font-medium text-xs`}>
                      {emp.avatar}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="text-xs">{emp.name}</span>
                      <span className="ml-2 text-[10px] text-gray-500">{emp.hospital}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>

        {/* Fuera de Geocerca */}
        <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="flex items-center">
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
          {/* Lista desplegable de empleados fuera de geocerca */}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-orange-700 hover:underline select-none">Ver empleados</summary>
            <div className="mt-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {employees.filter(emp => emp.dentro_geocerca === false).length === 0 ? (
                <div className="text-xs text-gray-400 px-2 py-2">No hay empleados fuera de geocerca</div>
              ) : (
                employees.filter(emp => emp.dentro_geocerca === false).map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-orange-50 rounded cursor-pointer"
                    onClick={() => handleEmployeeClick(emp.id)}
                  >
                    <div className={`w-6 h-6 rounded-full ${getAvatarColor(emp.name)} text-white flex items-center justify-center font-medium text-xs`}>
                      {emp.avatar}
                    </div>
                    <div className="flex-1 truncate">
                      <span className="text-xs">{emp.name}</span>
                      <span className="ml-2 text-[10px] text-gray-500">{emp.hospital}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>

        {/* Hospitales */}
        <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="flex items-center">
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
        </div>

        {/* Total Empleados */}
        <div className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-gray-100" style={kpiCardStyle}>
          <div className="flex items-center">
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

      {/* Mensaje informativo cuando se aplica filtro por estado */}
      {selectedState && (
        <div className="mx-4 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-blue-600 mr-1 text-xs" />
            <span className="text-blue-800 text-sm">
              Mostrando solo empleados y hospitales del estado: <strong>{selectedState}</strong>
              {selectedHospital && (
                <>
                  {" "}• Hospital: <strong>{hospitals.find(h => h.id_hospital.toString() === selectedHospital)?.nombre_hospital || selectedHospital}</strong>
                </>
              )}
            </span>
            <button
              onClick={clearFilters}
              className="ml-auto text-blue-600 hover:text-blue-800 underline text-xs"
              disabled={modoEstadoAdmin}
            >
              Limpiar filtro
            </button>
          </div>
        </div>
      )}

      {/* Contenedor principal optimizado */}
      <div className="flex-1 px-4 pt-2 pb-4 overflow-hidden flex justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative" style={mapContainerStyle}>
          {/* Barra de herramientas flotante con posición fija */}
          <div
            className="absolute bottom-3 left-14 z-[10] bg-white rounded-lg shadow-lg border border-gray-200 transform-gpu"
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
                  className={`w-48 border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    modoEstadoAdmin ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={modoEstadoAdmin}
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
                  {selectedState && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-md flex items-center gap-1">
                      <FaMapMarkerAlt className="text-xs" />
                      {selectedState}
                    </span>
                  )}
                  {modoEstadoAdmin && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center gap-1">
                      <FaUser className="text-xs" />
                      Admin Estatal
                    </span>
                  )}
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
                    className={`border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm ${
                      modoEstadoAdmin ? 'cursor-not-allowed opacity-50' : ''
                    }`}
                    title={modoEstadoAdmin ? "El estado no se puede limpiar en modo administrador estatal" : "Limpiar todos los filtros"}
                    disabled={modoEstadoAdmin}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botón para mostrar/ocultar filtros */}
          <button
            className="absolute bottom-4 left-4 z-[11] bg-white text-emerald-600 p-3 rounded-full shadow-md hover:bg-emerald-50 transition-transform duration-200 transform-gpu"
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
              <HospitalMarkers hospitals={getHospitalsStatus.hospitals} />
            )}

            {/* Optimizar renderizado de empleados */}
            {(!selectedState || getHospitalsStatus.status === 'ok') && (
              <>
                <GeofenceOverlays 
                  data={hospitalAndGeofenceData} 
                  showGeofences={showGeofences && showHospitals} 
                />
                <EmployeeMarkers employees={filteredEmployeesData} markerRefs={employeeMarkerRefs} clusterGroupRef={employeeClusterGroupRef} />
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default memo(MonitoreoMap);

