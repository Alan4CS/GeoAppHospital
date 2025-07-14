import React, { useState, useEffect } from "react";
import { Hospital, Map, Search, User as UserIcon, Users, Clock } from "lucide-react";
import StatsCardMunicipio from "./StatsCardMunicipio";

const EmpleadoList = ({ id_user }) => {
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

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital-b0yr.onrender.com/api/municipioadmin/empleados-by-user/${id_user}`);
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
    const id = id_user;
    if (!id) {
      setStatsError("No se encontró el usuario actual");
      setStatsLoading(false);
      return;
    }
    fetch(`https://geoapphospital-b0yr.onrender.com/api/municipioadmin/stats-by-user/${id}?source=stats`)
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

  // Debounce profesionalizado para la búsqueda
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

  // Filtrado profesional
  const empleadosFiltrados = empleadosLocales.filter((empleado) => {
    const busquedaLimpia = busquedaEmpleado?.toLowerCase().trim() || "";
    if (!busquedaLimpia) return true;
    const textoCompleto = `${empleado.nombre || ""} ${empleado.ap_paterno || ""} ${empleado.ap_materno || ""} ${empleado.curp_user || ""}`.toLowerCase();
    return busquedaLimpia.split(/\s+/).every((t) => textoCompleto.includes(t));
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
              <StatsCardMunicipio
                icon={<Hospital />}
                label="Hospitales registrados"
                value={stats.total_hospitales}
                color="emerald"
                subtitle="Hospitales registrados en tu estado"
              />
              <StatsCardMunicipio
                icon={<Users />}
                label="Grupos registrados"
                value={stats.total_grupos}
                color="yellow"
                subtitle="Grupos de trabajo activos"
              />
              <StatsCardMunicipio
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
          <div className="flex justify-end">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {esperandoBusqueda ? (
                  <Clock className="h-4 w-4 text-orange-400 animate-pulse" />
                ) : cargandoFiltro ? (
                  <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o CURP..."
                value={pendingValue}
                onChange={e => setPendingValue(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-64"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Lista de empleados */}
      <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200 relative">
        {/* Overlay de animación profesional */}
        {(cargandoFiltro || isSearching) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">Aplicando filtros...</p>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-center text-gray-500">Cargando empleados...</div>
        ) : busquedaEmpleado.trim().length > 0 && !isSearching && !isWaiting ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 mb-4 fadeIn">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                <span className="text-base font-semibold text-green-900">Resultados de búsqueda: "{busquedaEmpleado.trim()}"</span>
                <span className="ml-2 text-green-700 text-sm">{empleadosFiltrados.length} empleado{empleadosFiltrados.length !== 1 ? 's' : ''} encontrado{empleadosFiltrados.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {/* Tabla plana de empleados */}
            {empleadosFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-2">Nombre</th>
                      <th className="px-4 py-2">Ap. Paterno</th>
                      <th className="px-4 py-2">Ap. Materno</th>
                      <th className="px-4 py-2">CURP</th>
                      <th className="px-4 py-2">Teléfono</th>
                      <th className="px-4 py-2">Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {empleadosFiltrados.map((empleado) => (
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
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-16 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron empleados que coincidan con la búsqueda</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in duration-300">
            {Object.entries(empleadosPorMunicipio).map(([municipio, hospitales]) => (
            <div key={municipio} className="mb-8">
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
                                className="text-purple-600 hover:text-purple-800 text-sm"
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
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        .animate-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default EmpleadoList;