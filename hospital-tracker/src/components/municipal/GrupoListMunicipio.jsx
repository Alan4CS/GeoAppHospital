import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  Map,
  Hospital,
  User as UserIcon,
  Clock,
} from "lucide-react";
import StatsCardMunicipio from "./StatsCardMunicipio";

const monthsES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const GrupoList = ({ id_user }) => {
  const [grupos, setGrupos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  // Estados para búsqueda profesional
  const [pendingValue, setPendingValue] = useState("");
  const [busquedaGrupo, setBusquedaGrupo] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [cargandoFiltro, setCargandoFiltro] = useState(false);
  const [esperandoBusqueda, setEsperandoBusqueda] = useState(false);
  // Refs para evitar doble-fetch
  const fetchedGruposRef = useRef(false);
  const fetchedStatsRef = useRef(false);

  useEffect(() => {
    if (fetchedGruposRef.current) return;
    fetchedGruposRef.current = true;
    const fetchGrupos = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital.onrender.com/api/municipioadmin/grupos-by-user/${id_user}?source=groups`);
        if (!res.ok) throw new Error("No se pudieron obtener los grupos de estadoadmin");
        const data = await res.json();
        // Adaptar para aceptar tanto array plano como objeto con 'grupos'
        let grupos = [];
        let municipios = [];
        if (Array.isArray(data)) {
          grupos = data;
        } else if (data && Array.isArray(data.grupos)) {
          grupos = data.grupos;
          municipios = data.municipios || [];
        }
        setGrupos(grupos);
        setMunicipios(municipios);
      } catch (err) {
        setGrupos([]);
        setMunicipios([]);
      }
      setLoading(false);
    };
    if (id_user) fetchGrupos();
  }, [id_user]);

  useEffect(() => {
    if (fetchedStatsRef.current) return;
    fetchedStatsRef.current = true;
    const id = id_user || localStorage.getItem("userId");
    if (!id) {
      setStatsError("No se encontró el usuario actual");
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    fetch(`https://geoapphospital.onrender.com/api/municipioadmin/stats-by-user/${id}?source=stats`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron obtener las estadísticas de estadoadmin");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setStatsError(null);
      })
      .catch((err) => {
        setStatsError(err.message);
        setStats(null);
      })
      .finally(() => setStatsLoading(false));
  }, [id_user]);

  // Debounce profesionalizado para la búsqueda
  useEffect(() => {
    if (pendingValue === busquedaGrupo) return;
    setIsWaiting(true);
    setIsSearching(false);
    const debounceTimeout = setTimeout(() => {
      setIsWaiting(false);
      setIsSearching(true);
      setTimeout(() => {
        setBusquedaGrupo(pendingValue);
        setIsSearching(false);
      }, 350);
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [pendingValue, busquedaGrupo]);

  // Filtrado profesional
  const gruposFiltrados = grupos.filter((grupo) => {
    const busquedaLimpia = busquedaGrupo.toLowerCase().trim();
    if (!busquedaLimpia) return true;
    const textoCompleto = `${grupo.nombre_grupo || ""} ${grupo.descripcion_group || ""} ${grupo.nombre_hospital || ""}`.toLowerCase();
    return busquedaLimpia.split(/\s+/).every((t) => textoCompleto.includes(t));
  });

  // Agrupar por estado, municipio y hospital
  const gruposPorEstado = gruposFiltrados.reduce((acc, grupo) => {
    const estado = grupo.nombre_estado || "Sin estado";
    const municipio = grupo.nombre_municipio || "Sin municipio";
    const hospital = grupo.nombre_hospital || "Sin hospital";
    acc[estado] = acc[estado] || {};
    acc[estado][municipio] = acc[estado][municipio] || {};
    acc[estado][municipio][hospital] = acc[estado][municipio][hospital] || [];
    acc[estado][municipio][hospital].push(grupo);
    return acc;
  }, {});

  // Asegurar que todos los municipios del estado estén presentes aunque no tengan grupos
  if (municipios.length && grupos.length) {
    const estado = grupos[0].nombre_estado || "Sin estado";
    gruposPorEstado[estado] = gruposPorEstado[estado] || {};
    municipios.forEach((mun) => {
      if (!gruposPorEstado[estado][mun.nombre_municipio]) {
        gruposPorEstado[estado][mun.nombre_municipio] = {};
      }
    });
  }

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* Stats arriba */}
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
      </div>
      {/* Grupos registrados y controles */}
      <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-0">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Grupos registrados
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
                placeholder="Buscar grupo..."
                value={pendingValue}
                onChange={e => setPendingValue(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-64"
              />
            </div>
          </div>
        </div>
        {/* Lista de grupos */}
        {loading ? (
          <div className="text-center text-gray-500">Cargando grupos...</div>
        ) : cargandoFiltro ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
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
        ) : busquedaGrupo.trim().length > 0 && !isSearching && !isWaiting ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 mb-4 fadeIn">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                <span className="text-base font-semibold text-green-900">Resultados de búsqueda: "{busquedaGrupo.trim()}"</span>
                <span className="ml-2 text-green-700 text-sm">{gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? 's' : ''} encontrado{gruposFiltrados.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {/* Tabla plana de grupos */}
            {gruposFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="px-4 py-2">Nombre del Grupo</th>
                      <th className="px-4 py-2">Descripción</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2">Municipio</th>
                      <th className="px-4 py-2">Hospital</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gruposFiltrados.map((grupo) => (
                      <tr key={grupo.id_group} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{grupo.nombre_grupo}</td>
                        <td className="px-4 py-2 text-sm">{grupo.descripcion_group || "—"}</td>
                        <td className="px-4 py-2 text-sm">{grupo.nombre_estado || "-"}</td>
                        <td className="px-4 py-2 text-sm">{grupo.nombre_municipio || "-"}</td>
                        <td className="px-4 py-2 text-sm">{grupo.nombre_hospital || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-16 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron grupos que coincidan con la búsqueda</p>
                </div>
              </div>
            )}
          </>
        ) : isSearching ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-16 text-center">
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
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {Object.entries(gruposPorEstado).map(([estado, municipios]) => (
            <div key={estado} className="mb-8">
              <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                  <Map className="h-5 w-5 mr-2 text-purple-600" />
                  Estado: {estado}
                </h4>
                {Object.entries(municipios).map(([municipio, hospitales]) => (
                  <div key={municipio} className="mb-4">
                    <h5 className="text-md font-medium text-slate-700 mb-2 flex items-center">
                      <Hospital className="h-4 w-4 mr-2 text-purple-600" />
                      Municipio: {municipio}
                    </h5>
                    {Object.entries(hospitales).map(([hospital, gruposHospital]) => (
                      <div key={hospital} className="mb-4">
                        <h5 className="text-md font-medium text-slate-700 mb-2 flex items-center">
                          <Hospital className="h-4 w-4 mr-2 text-purple-600" />
                          Hospital: {hospital}
                        </h5>
                        <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Nombre del Grupo
                                </th>
                                <th className="w-1/2 px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Descripción
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {gruposHospital.map((grupo) => (
                                <tr key={grupo.id_group} className="hover:bg-gray-50">
                                  <td className="w-1/3 px-6 py-3 text-sm whitespace-normal">
                                    {grupo.nombre_grupo}
                                  </td>
                                  <td className="w-1/2 px-6 py-3 text-sm text-gray-600 whitespace-normal">
                                    {grupo.descripcion_group || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
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

export default GrupoList;