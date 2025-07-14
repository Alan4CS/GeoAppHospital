import React, { useState, useEffect } from "react";
import {
  Hospital,
  Map,
  Search,
  User as UserIcon,
  Users,
  Clock,
  Loader2,
  UserPlus,
} from "lucide-react";
import StatsCardHospital from "./StatsCardHospital";

// Estilos CSS para animaciones
const styles = `
  .fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .shrink {
    animation: shrink 0.2s ease-in-out;
  }
  
  .bounce {
    animation: bounce 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes shrink {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-5px); }
    60% { transform: translateY(-3px); }
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined' && !document.getElementById('empleado-list-hospital-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'empleado-list-hospital-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const EmpleadoListHospital = ({ hospitalId }) => {
  const [empleadosLocales, setEmpleadosLocales] = useState([]);
  const [pendingValue, setPendingValue] = useState("");
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mostrarTodosEmpleados, setMostrarTodosEmpleados] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [cargandoFiltro, setCargandoFiltro] = useState(false);
  const [esperandoBusqueda, setEsperandoBusqueda] = useState(false);
  
  // Estados adicionales para consistencia con otros componentes
  const [busquedaLocal, setBusquedaLocal] = useState(busquedaEmpleado || "");
  const [isFiltering, setIsFiltering] = useState(false);

  // Mantener sincronizado busquedaLocal con pendingValue para evitar inconsistencias
  useEffect(() => {
    setBusquedaLocal(pendingValue);
  }, [pendingValue]);

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/empleados-by-ubicacion?id_hospital=${hospitalId}`);
        const data = await res.json();
        let empleados = [];
        if (Array.isArray(data)) {
          empleados = data;
        } else if (data && Array.isArray(data.empleados)) {
          empleados = data.empleados;
        }
        setEmpleadosLocales(empleados);
      } catch (err) {
        setEmpleadosLocales([]);
      }
      setLoading(false);
    };
    if (hospitalId) fetchEmpleados();
  }, [hospitalId]);

  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);
    if (!hospitalId) {
      setStatsError("No se encontró el hospital asignado");
      setStatsLoading(false);
      return;
    }
    fetch(`https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/stats-by-hospital/${hospitalId}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setStatsLoading(false);
      })
      .catch(() => {
        setStatsError("No se pudieron obtener las estadísticas");
        setStatsLoading(false);
      });
  }, [hospitalId]);

  // Debounce mejorado para la búsqueda
  const handleBusquedaChange = (e) => {
    const value = e.target.value;
    setBusquedaLocal(value);
    setPendingValue(value);
  };

  useEffect(() => {
    if (pendingValue === busquedaEmpleado) return;
    setIsWaiting(true);
    setIsSearching(false);
    const debounceTimeout = setTimeout(() => {
      setIsWaiting(false);
      setIsSearching(true);
      setTimeout(() => {
        setBusquedaEmpleado(pendingValue);
        setIsSearching(false);
      }, 350);
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [pendingValue, busquedaEmpleado]);

  // Filtrado mejorado
  const empleadosFiltrados = empleadosLocales.filter((empleado) => {
    const busquedaLimpia = busquedaEmpleado?.toLowerCase().trim() || "";
    if (!busquedaLimpia) return true;
    const textoCompleto = `${empleado.nombre || ""} ${empleado.ap_paterno || ""} ${empleado.ap_materno || ""} ${empleado.curp_user || ""}`.toLowerCase();
    return busquedaLimpia.split(/\s+/).every((t) => textoCompleto.includes(t));
  });

  // Agrupar por grupo
  const empleadosPorGrupo = empleadosFiltrados.reduce((acc, empleado) => {
    const grupo = empleado.nombre_grupo || "Sin grupo";
    acc[grupo] = acc[grupo] || [];
    acc[grupo].push(empleado);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {statsLoading ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando estadísticas...</p>
          </div>
        </div>
      ) : statsError ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-8 text-center text-red-500">
            {statsError}
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6">
          <StatsCardHospital
            icon={<Users />}
            label="Empleados registrados"
            value={stats.total_empleados}
            color="red"
            subtitle="Empleados registrados en tu hospital"
            data-testid="stats-empleados"
          />
        </div>
      ) : null}

      {/* Header principal */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Empleados registrados</h3>
                <p className="text-sm text-gray-500">
                  {empleadosFiltrados.length} empleado{empleadosFiltrados.length !== 1 ? "s" : ""}
                  {busquedaEmpleado && " encontrados"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                {isWaiting ? (
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-500 animate-pulse" />
                ) : isSearching ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500 animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <input
                  type="text"
                  placeholder="Buscar por nombre o CURP..."
                  value={busquedaLocal}
                  onChange={handleBusquedaChange}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de carga durante búsqueda */}
      {(isSearching || isFiltering) && (
        <div className="bg-white rounded-lg border border-gray-200 fadeIn">
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {isSearching ? "Buscando empleados..." : "Aplicando filtros..."}
            </p>
          </div>
        </div>
      )}

      {/* Lista de empleados */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 fadeIn">
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando empleados...</p>
          </div>
        </div>
      ) : !isSearching && !isFiltering && Object.keys(empleadosPorGrupo).length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 fadeIn">
          <div className="px-6 py-16 text-center">
            <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {busquedaEmpleado?.trim() 
                ? `No se encontraron empleados que coincidan con "${busquedaEmpleado.trim()}"`
                : "No hay empleados registrados en este hospital."}
            </p>
          </div>
        </div>
      ) : !isSearching && !isFiltering ? (
        Object.entries(empleadosPorGrupo).map(([grupo, empleadosGrupo]) => {
          const key = `grupo-${grupo}`;
          const mostrarTodos = mostrarTodosEmpleados[key] || false;
          const empleadosVisibles = mostrarTodos ? empleadosGrupo : empleadosGrupo.slice(0, 5);

          return (
            <div key={key} className="bg-white rounded-lg border border-gray-200 fadeIn">
              <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Grupo: {grupo}</h4>
                    <p className="text-sm text-gray-500">
                      {empleadosGrupo.length} empleado{empleadosGrupo.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Nombre Completo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        CURP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Rol
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadosVisibles.map((empleado, index) => (
                      <tr
                        key={`${empleado.id_user}-${empleado.curp_user}-${index}`}
                        className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-600 font-mono">{empleado.curp_user}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{empleado.telefono || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            {empleado.role_name || "Empleado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {empleadosGrupo.length > 5 && (
                <div className="px-6 py-4 border-t border-gray-100 text-center">
                  <button
                    onClick={() =>
                      setMostrarTodosEmpleados((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors shrink"
                  >
                    {mostrarTodos
                      ? "Mostrar menos"
                      : `Ver todos (${empleadosGrupo.length})`}
                  </button>
                </div>
              )}
            </div>
          );
        })
      ) : null}
    </div>
  );
};

export default EmpleadoListHospital; 