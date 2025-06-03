import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { format, subDays, parseISO, differenceInDays } from "date-fns";

// Componente principal del dashboard de monitoreo
const MonitoreoDashboard = () => {
  // Estados para los filtros
  const [selectedTab, setSelectedTab] = useState("nacional");
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedState, setSelectedState] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estados para los datos
  const [states, setStates] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [monitoringData, setMonitoringData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos simulados
  useEffect(() => {
    // Simular carga de datos
    setIsLoading(true);

    // Datos simulados de estados
    const statesData = [
      "Quintana Roo",
      "Yucatán",
      "Campeche",
      "Chiapas",
      "Tabasco",
    ];

    // Datos simulados de municipios por estado
    const municipalitiesData = {
      "Quintana Roo": ["Cancún", "Playa del Carmen", "Chetumal", "Tulum"],
      Yucatán: ["Mérida", "Valladolid", "Progreso"],
      Campeche: ["Campeche", "Ciudad del Carmen", "Champotón"],
      Chiapas: ["Tuxtla Gutiérrez", "San Cristóbal", "Tapachula"],
      Tabasco: ["Villahermosa", "Cárdenas", "Comalcalco"],
    };

    // Datos simulados de hospitales por municipio
    const hospitalsData = {
      Cancún: ["Hospital Galenia", "Hospital Amerimed", "Hospital General"],
      "Playa del Carmen": ["Hospital General", "Hospiten", "CostaMed"],
      Chetumal: ["Hospital General", "Hospital Naval", "Clínica Carranza"],
      Mérida: ["Hospital Regional", "Star Médica", "Hospital O'Horán"],
      Villahermosa: [
        "Hospital Regional",
        "Hospital del Sureste",
        "Hospital ISSET",
      ],
    };

    // Generar datos históricos simulados de monitoreo
    const generateMonitoringData = () => {
      const data = [];
      const startDate = parseISO(dateRange.startDate);
      const endDate = parseISO(dateRange.endDate);
      const daysDiff = differenceInDays(endDate, startDate) + 1;

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
      ];

      // Generar registros para cada día y cada empleado
      for (let i = 0; i < daysDiff; i++) {
        const currentDate = subDays(endDate, i);
        const formattedDate = format(currentDate, "yyyy-MM-dd");

        employees.forEach((employee) => {
          // Asignar aleatoriamente un estado, municipio y hospital
          const state =
            statesData[Math.floor(Math.random() * statesData.length)];
          const municipalitiesInState = municipalitiesData[state];
          const municipality =
            municipalitiesInState[
              Math.floor(Math.random() * municipalitiesInState.length)
            ];

          let hospital = "";
          if (hospitalsData[municipality]) {
            hospital =
              hospitalsData[municipality][
                Math.floor(Math.random() * hospitalsData[municipality].length)
              ];
          } else {
            // Si no hay hospitales definidos para este municipio, usar uno genérico
            hospital = `Hospital de ${municipality}`;
          }

          // Generar horas trabajadas (entre 4 y 9 horas)
          const hoursWorked = (4 + Math.random() * 5).toFixed(1);

          // Generar salidas de geocerca (0 a 3)
          const geofenceExits = Math.floor(Math.random() * 4);

          // Generar estado (conectado/desconectado)
          const status = Math.random() > 0.2 ? "connected" : "disconnected";

          // Generar si está dentro o fuera de geocerca
          const outsideGeofence = geofenceExits > 0;

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
            startTime: `${Math.floor(Math.random() * 3) + 7}:${Math.floor(
              Math.random() * 60
            )
              .toString()
              .padStart(2, "0")}`,
            endTime: `${Math.floor(Math.random() * 4) + 14}:${Math.floor(
              Math.random() * 60
            )
              .toString()
              .padStart(2, "0")}`,
          });
        });
      }

      return data;
    };

    // Establecer los datos
    setStates(statesData);
    setMunicipalities(municipalitiesData);
    setHospitals(hospitalsData);
    setMonitoringData(generateMonitoringData());
    setIsLoading(false);
  }, [dateRange]);

  // Filtrar datos según los criterios seleccionados
  const filteredData = useMemo(() => {
    return monitoringData.filter((record) => {
      // Filtrar por estado
      if (selectedState && record.state !== selectedState) return false;

      // Filtrar por municipio
      if (selectedMunicipality && record.municipality !== selectedMunicipality)
        return false;

      // Filtrar por hospital
      if (selectedHospital && record.hospital !== selectedHospital)
        return false;

      // Filtrar por término de búsqueda
      if (
        searchTerm &&
        !record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;

      return true;
    });
  }, [
    monitoringData,
    selectedState,
    selectedMunicipality,
    selectedHospital,
    searchTerm,
  ]);

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
      };

    // Obtener empleados únicos
    const uniqueEmployees = [
      ...new Set(filteredData.map((record) => record.employeeId)),
    ];

    // Calcular total de horas trabajadas
    const totalHours = filteredData.reduce(
      (sum, record) => sum + record.hoursWorked,
      0
    );

    // Calcular días únicos
    const uniqueDays = [...new Set(filteredData.map((record) => record.date))];

    // Calcular promedio de horas por día
    const avgHoursPerDay =
      totalHours / uniqueDays.length / uniqueEmployees.length;

    // Calcular total de salidas de geocerca
    const totalGeofenceExits = filteredData.reduce(
      (sum, record) => sum + record.geofenceExits,
      0
    );

    // Calcular promedio de salidas de geocerca por día
    const avgGeofenceExitsPerDay = totalGeofenceExits / uniqueDays.length;

    // Calcular tasa de cumplimiento (registros sin salidas de geocerca / total de registros)
    const recordsWithoutExits = filteredData.filter(
      (record) => record.geofenceExits === 0
    ).length;
    const complianceRate = (recordsWithoutExits / filteredData.length) * 100;

    return {
      totalEmployees: uniqueEmployees.length,
      totalHours: totalHours.toFixed(1),
      avgHoursPerDay: avgHoursPerDay.toFixed(1),
      totalGeofenceExits,
      avgGeofenceExitsPerDay: avgGeofenceExitsPerDay.toFixed(1),
      complianceRate: complianceRate.toFixed(1),
    };
  }, [filteredData]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    if (filteredData.length === 0)
      return {
        hoursPerDay: [],
        hoursPerEmployee: [],
        geofenceExitsPerDay: [],
        statusDistribution: { connected: 0, disconnected: 0 },
      };

    // Agrupar horas por día
    const hoursPerDayMap = filteredData.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += record.hoursWorked;
      return acc;
    }, {});

    // Convertir a array para el gráfico
    const hoursPerDay = Object.entries(hoursPerDayMap)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Últimos 14 días

    // Agrupar horas por empleado
    const hoursPerEmployeeMap = filteredData.reduce((acc, record) => {
      const employeeId = record.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          id: employeeId,
          name: record.employeeName,
          hours: 0,
        };
      }
      acc[employeeId].hours += record.hoursWorked;
      return acc;
    }, {});

    // Convertir a array para el gráfico
    const hoursPerEmployee = Object.values(hoursPerEmployeeMap)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Top 10 empleados

    // Agrupar salidas de geocerca por día
    const geofenceExitsPerDayMap = filteredData.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += record.geofenceExits;
      return acc;
    }, {});

    // Convertir a array para el gráfico
    const geofenceExitsPerDay = Object.entries(geofenceExitsPerDayMap)
      .map(([date, exits]) => ({ date, exits }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Últimos 14 días

    // Distribución de estados (conectado/desconectado)
    const statusDistribution = filteredData.reduce(
      (acc, record) => {
        acc[record.status]++;
        return acc;
      },
      { connected: 0, disconnected: 0 }
    );

    return {
      hoursPerDay,
      hoursPerEmployee,
      geofenceExitsPerDay,
      statusDistribution,
    };
  }, [filteredData]);

  // Función para exportar datos a CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return;

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
    ].join(",");

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
      ].join(",")
    );

    // Unir encabezados y filas
    const csv = [headers, ...rows].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_monitoreo_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para obtener municipios según el estado seleccionado
  const getMunicipalitiesByState = () => {
    if (!selectedState) return [];
    return municipalities[selectedState] || [];
  };

  // Función para obtener hospitales según el municipio seleccionado
  const getHospitalsByMunicipality = () => {
    if (!selectedMunicipality) return [];
    return hospitals[selectedMunicipality] || [];
  };

  // Función para obtener color de avatar
  const getAvatarColor = (avatar) => {
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-cyan-500",
    ];
    const index = avatar.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado con filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">
              Dashboard de Monitoreo
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              <ChevronDown
                className={`h-4 w-4 ml-1 transition-transform ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rango de fechas
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedMunicipality("");
                  setSelectedHospital("");
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Municipio
              </label>
              <select
                value={selectedMunicipality}
                onChange={(e) => {
                  setSelectedMunicipality(e.target.value);
                  setSelectedHospital("");
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
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
            onClick={() => setSelectedTab("nacional")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "nacional"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Nacional
          </button>
          <button
            onClick={() => setSelectedTab("estatal")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "estatal"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Estatal
          </button>
          <button
            onClick={() => setSelectedTab("municipal")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "municipal"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Municipal
          </button>
          <button
            onClick={() => setSelectedTab("hospital")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "hospital"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Hospital
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
          {/* Pestaña Nacional */}
          {selectedTab === "nacional" && (
            <div className="space-y-6">
              {/* Tarjetas de estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">
                        Total Nacional
                      </h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.totalEmployees}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Total de horas trabajadas:</span>
                      <span className="font-medium">{stats.totalHours}h</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Promedio diario:</span>
                      <span className="font-medium">
                        {stats.avgHoursPerDay}h
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-amber-100 rounded-full">
                      <MapPin className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">
                        Salidas de geocerca
                      </h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.totalGeofenceExits}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Promedio diario:</span>
                      <span className="font-medium">
                        {stats.avgGeofenceExitsPerDay}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Tasa de cumplimiento:</span>
                      <span className="font-medium">
                        {stats.complianceRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">
                        Cobertura Nacional
                      </h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {states.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span>Estados activos:</span>
                      <span className="font-medium">{states.length}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>Total hospitales:</span>
                      <span className="font-medium">
                        {hospitals ? hospitals.length : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mantener los gráficos y otras secciones aquí */}
            </div>
          )}

          {/* Pestaña Estatal */}
          {selectedTab === "estatal" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Vista por Estado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aquí irán los componentes específicos de la vista estatal */}
                </div>
              </div>
            </div>
          )}

          {/* Pestaña Municipal */}
          {selectedTab === "municipal" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Vista por Municipio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aquí irán los componentes específicos de la vista municipal */}
                </div>
              </div>
            </div>
          )}

          {/* Pestaña Hospital */}
          {selectedTab === "hospital" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Vista por Hospital
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aquí irán los componentes específicos de la vista de hospital */}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MonitoreoDashboard;
