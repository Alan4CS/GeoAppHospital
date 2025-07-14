import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  Map,
  Hospital,
  User as UserIcon,
  MapPin,
  Clock,
} from "lucide-react";
import StatsCardEstado from "./StatsCardEstado";

const monthsES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const GrupoList = ({ id_user }) => {
  const [grupos, setGrupos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [busquedaGrupo, setBusquedaGrupo] = useState("");
  const [busquedaInput, setBusquedaInput] = useState(""); // Nuevo estado para el input
  const [municipioFiltro, setMunicipioFiltro] = useState("");
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
        const res = await fetch(`https://geoapphospital-b0yr.onrender.com/api/estadoadmin/groups-by-user/${id_user}?source=groups`);
        if (!res.ok) throw new Error("No se pudieron obtener los grupos de estadoadmin");
        const data = await res.json();
        setGrupos(data.grupos || []);
        setMunicipios(data.municipios || []);
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
    const id = id_user;
    if (!id) {
      setStatsError("No se encontró el usuario actual");
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    fetch(`https://geoapphospital-b0yr.onrender.com/api/estadoadmin/stats-by-user/${id}?source=stats`)
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

  // Efecto de debounce para la búsqueda
  useEffect(() => {
    // Si hay texto diferente, activar el estado de espera
    if (busquedaInput.trim() !== busquedaGrupo.trim()) {
      setEsperandoBusqueda(true);
    }

    const timer = setTimeout(() => {
      if (busquedaInput.trim() !== busquedaGrupo.trim()) {
        setCargandoFiltro(true);
        setEsperandoBusqueda(false);
        setTimeout(() => {
          setBusquedaGrupo(busquedaInput);
          setCargandoFiltro(false);
        }, 200);
      } else {
        setEsperandoBusqueda(false);
      }
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    return () => {
      clearTimeout(timer);
      if (busquedaInput.trim() === busquedaGrupo.trim()) {
        setEsperandoBusqueda(false);
      }
    };
  }, [busquedaInput, busquedaGrupo]);

  const handleCambioMunicipio = (nuevoMunicipio) => {
    setCargandoFiltro(true)
    
    // Pequeña pausa para mostrar la animación de carga
    setTimeout(() => {
      setMunicipioFiltro(nuevoMunicipio)
      setCargandoFiltro(false)
    }, 300)
  }

  const handleCambioBusqueda = (nuevaBusqueda) => {
    setBusquedaInput(nuevaBusqueda); // Solo actualiza el input, el debounce se maneja en useEffect
  }

  // Filtrar grupos basado en búsqueda y municipio
  const gruposFiltrados = grupos.filter((grupo) => {
    const busquedaLimpia = busquedaGrupo.toLowerCase().trim();
    
    // Verificar coincidencia con filtro de municipio
    const coincideMunicipio = !municipioFiltro || grupo.nombre_municipio === municipioFiltro;
    
    // Si no hay texto de búsqueda, solo aplicar filtro de municipio
    if (!busquedaLimpia) return coincideMunicipio;
    
    // Si hay texto de búsqueda, verificar tanto búsqueda como municipio
    const textoCompleto = `${grupo.nombre_grupo || ""} ${grupo.descripcion_group || ""} ${grupo.nombre_hospital || ""}`.toLowerCase();
    const coincideBusqueda = busquedaLimpia.split(/\s+/).every((t) => textoCompleto.includes(t));
    
    return coincideBusqueda && coincideMunicipio;
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
      </div>
      {/* Grupos registrados y controles */}
      <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-0">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Grupos registrados
          </h3>
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
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
                value={busquedaInput}
                onChange={(e) => handleCambioBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-64"
              />
            </div>
            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-2 flex items-center gap-2">
                {cargandoFiltro ? (
                  <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                ) : (
                  <MapPin className="h-4 w-4 text-gray-400" />
                )}
                Municipio:
              </label>
              <select
                value={municipioFiltro}
                onChange={(e) => handleCambioMunicipio(e.target.value)}
                disabled={cargandoFiltro}
                className={`px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${
                  cargandoFiltro ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Todos</option>
                {municipios.map((mun) => (
                  <option key={mun.id_municipio} value={mun.nombre_municipio}>{mun.nombre_municipio}</option>
                ))}
              </select>
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
        ) : Object.keys(gruposPorEstado).length === 0 ? (
          <div className="text-center text-gray-500">
            {municipioFiltro
              ? `No hay grupos en ${municipioFiltro}`
              : busquedaInput.trim()
                ? "No se encontraron grupos que coincidan con la búsqueda"
                : "No hay grupos para mostrar."}
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