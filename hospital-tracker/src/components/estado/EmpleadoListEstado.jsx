import React, { useState, useEffect, useCallback } from "react";
import {
  Hospital,
  Map,
  Search,
  User as UserIcon,
  Users,
  Clock,
  Loader2,
} from "lucide-react";
import StatsCardEstado from "./StatsCardEstado";

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
if (typeof document !== 'undefined' && !document.getElementById('empleado-list-estado-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'empleado-list-estado-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const EmpleadoList = ({ id_user }) => {
  const [empleadosLocales, setEmpleadosLocales] = useState([]);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("");
  const [mostrarTodosEmpleados, setMostrarTodosEmpleados] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  
  // Estados para debounce y animaciones
  const [busquedaLocal, setBusquedaLocal] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital-b0yr.onrender.com/api/estadoadmin/employees-by-user/${id_user}`);
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
    if (id_user) fetchEmpleados();
  }, [id_user]);

  useEffect(() => {
    let ignore = false;
    setStatsLoading(true);
    setStatsError(null);
    const id = id_user || localStorage.getItem("userId");
    if (!id) {
      setStatsError("No se encontró el usuario actual");
      setStatsLoading(false);
      return;
    }
    fetch(`https://geoapphospital-b0yr.onrender.com/api/estadoadmin/stats-by-user/${id}?source=stats`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron obtener las estadísticas de estadoadmin");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setStats(data);
          setStatsError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setStatsError(err.message);
          setStats(null);
        }
      })
      .finally(() => {
        if (!ignore) setStatsLoading(false);
      });
    return () => { ignore = true; };
  }, [id_user]);

  // Debounce para la búsqueda
  const debouncedSearch = useCallback((value) => {
    setIsWaiting(true);
    setIsSearching(false);

    const timeoutId = setTimeout(() => {
      setIsWaiting(false);
      setIsSearching(true);
      
      setTimeout(() => {
        setBusquedaEmpleado(value);
        setIsSearching(false);
      }, 200);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // Efecto para manejar el debounce
  useEffect(() => {
    const cleanup = debouncedSearch(busquedaLocal);
    return cleanup;
  }, [busquedaLocal, debouncedSearch]);

  // Manejar cambio en el input de búsqueda
  const handleBusquedaChange = (e) => {
    setBusquedaLocal(e.target.value);
  };

  // Manejar cambio en filtro de municipio
  const handleMunicipioChange = (e) => {
    const value = e.target.value;
    setIsFiltering(true);
    setMunicipioFiltro(value);
    // Pequeño delay solo para la animación visual
    setTimeout(() => {
      setIsFiltering(false);
    }, 100);
  };

  // Filtrado
  const empleadosFiltrados = empleadosLocales.filter((empleado) => {
    const busquedaLimpia = busquedaEmpleado?.toLowerCase().trim() || "";
    if (busquedaLimpia && !(`${empleado.nombre || ""} ${empleado.ap_paterno || ""} ${empleado.ap_materno || ""} ${empleado.curp_user || ""}`.toLowerCase().includes(busquedaLimpia))) {
      return false;
    }
    const coincideMunicipio = !municipioFiltro || empleado.municipio === municipioFiltro;
    return coincideMunicipio;
  });

  // Agrupar por municipio, hospital y grupo
  const empleadosPorMunicipio = empleadosFiltrados.reduce((acc, empleado) => {
    const municipio = empleado.municipio || "Sin municipio";
    const hospital = empleado.hospital || "Sin hospital";
    const grupo = empleado.nombre_grupo || "Sin grupo";
    acc[municipio] = acc[municipio] || {};
    acc[municipio][hospital] = acc[municipio][hospital] || {};
    acc[municipio][hospital][grupo] = acc[municipio][hospital][grupo] || [];
    acc[municipio][hospital][grupo].push(empleado);
    return acc;
  }, {});

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* Encabezado y filtros */}
      <div className="p-6 border-b border-gray-200">
        <div className="mt-4">
          {statsLoading ? (
            <div className="text-center text-gray-500 text-lg mb-4">Cargando estadísticas...</div>
          ) : statsError ? (
            <div className="text-center text-red-500 text-lg mb-4">{statsError}</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatsCardEstado
                icon={<Hospital />}
                label="Hospitales registrados"
                value={stats.total_hospitales}
                color="emerald"
                subtitle="Hospitales registrados en tu estado"
              />
              <StatsCardEstado
                icon={<Users />}
                label="Grupos registrados"
                value={stats.total_grupos}
                color="yellow"
                subtitle="Grupos de trabajo activos"
              />
              <StatsCardEstado
                icon={<UserIcon />}
                label="Empleados registrados"
                value={stats.total_empleados}
                color="red"
                subtitle="Empleados registrados"
                data-testid="stats-empleados"
              />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-0">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Empleados registrados
          </h3>
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isWaiting ? (
                  <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                ) : isSearching ? (
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o CURP..."
                value={busquedaLocal}
                onChange={handleBusquedaChange}
                className="pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-64"
              />
            </div>
            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-2">Municipio:</label>
              {isFiltering && <Loader2 className="h-4 w-4 text-purple-500 animate-spin mr-2" />}
              <select
                value={municipioFiltro}
                onChange={handleMunicipioChange}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Todos</option>
                {[...new Set(empleadosLocales.map((e) => e.municipio))].filter(Boolean).map((municipio) => (
                  <option key={municipio} value={municipio}>{municipio}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Lista de empleados */}
      <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
        {/* Indicador de carga durante búsqueda/filtrado */}
        {(isSearching || isFiltering) && (
          <div className="text-center text-gray-500 mb-4 fadeIn">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-2" />
            <p>{isSearching ? "Buscando empleados..." : "Aplicando filtros..."}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center text-gray-500 fadeIn">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-2" />
            <p>Cargando empleados...</p>
          </div>
        ) : !isSearching && !isFiltering && Object.keys(empleadosPorMunicipio).length === 0 ? (
          <div className="text-center text-gray-500 fadeIn">
            {busquedaLocal?.trim() 
              ? `No se encontraron empleados que coincidan con "${busquedaLocal.trim()}"`
              : municipioFiltro
                ? `No hay empleados registrados en ${municipioFiltro}`
                : "No hay empleados para mostrar."}
          </div>
        ) : !isSearching && !isFiltering ? (
          Object.entries(empleadosPorMunicipio).map(([municipio, hospitales]) => (
            <div key={municipio} className="mb-8 fadeIn">
              <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                  <Map className="h-5 w-5 mr-2 text-purple-600" />
                  Municipio: {municipio}
                </h4>
                {Object.entries(hospitales).map(([hospital, grupos]) => (
                  <div key={hospital} className="mb-4">
                    <h5 className="text-md font-medium text-slate-700 mb-2 flex items-center">
                      <Hospital className="h-4 w-4 mr-2 text-purple-600" />
                      Hospital: {hospital}
                    </h5>
                    {Object.entries(grupos).map(([grupo, empleadosGrupo]) => {
                      const key = `${municipio}-${hospital}-${grupo}`;
                      const visibles = mostrarTodosEmpleados[key]
                        ? empleadosGrupo
                        : empleadosGrupo.slice(0, 5);
                      return (
                        <div key={key} className="mb-6 border border-slate-300 rounded-lg overflow-hidden">
                          <div className="bg-slate-100 px-4 py-2 flex justify-between items-center">
                            <span className="font-medium text-slate-700">
                              Grupo: {grupo} ({empleadosGrupo.length})
                            </span>
                          </div>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ap. Paterno</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ap. Materno</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">CURP</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Teléfono</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rol</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {visibles.map((empleado) => (
                                <tr key={empleado.id_user} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm">{empleado.nombre}</td>
                                  <td className="px-4 py-2 text-sm">{empleado.ap_paterno}</td>
                                  <td className="px-4 py-2 text-sm">{empleado.ap_materno}</td>
                                  <td className="px-4 py-2 text-sm font-mono text-xs">{empleado.curp_user}</td>
                                  <td className="px-4 py-2 text-sm">{empleado.telefono || "—"}</td>
                                  <td className="px-4 py-2 text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                      {empleado.role_name || "Empleado"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {empleadosGrupo.length > 5 && (
                            <div className="px-4 py-2 bg-slate-50 text-center">
                              <button
                                onClick={() =>
                                  setMostrarTodosEmpleados((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                                className="text-purple-600 hover:text-purple-800 text-sm shrink"
                              >
                                {mostrarTodosEmpleados[key]
                                  ? "Mostrar menos"
                                  : `Ver todos (${empleadosGrupo.length})`}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
};

export default EmpleadoList;
