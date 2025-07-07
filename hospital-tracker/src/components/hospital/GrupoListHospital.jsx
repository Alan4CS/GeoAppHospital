import React, { useState, useEffect } from "react";
import { Users, Search, Clock, Layers } from "lucide-react";
import StatsCardHospital from "./StatsCardHospital";

const GrupoListHospital = ({ hospitalId }) => {
  console.log("hospitalId recibido en GrupoListHospital:", hospitalId);
  const [grupos, setGrupos] = useState([]);
  const [pendingValue, setPendingValue] = useState("");
  const [busquedaGrupo, setBusquedaGrupo] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    const fetchGrupos = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital.onrender.com/api/hospitaladmin/grupos-by-hospital/${hospitalId}`);
        if (!res.ok) throw new Error("No se pudieron obtener los grupos del hospital");
        const data = await res.json();
        setGrupos(Array.isArray(data) ? data : []);
      } catch (err) {
        setGrupos([]);
      }
      setLoading(false);
    };
    if (hospitalId) fetchGrupos();
  }, [hospitalId]);

  // Debounce para la búsqueda
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

  // Filtrado
  const gruposFiltrados = grupos.filter((grupo) => {
    const busquedaLimpia = busquedaGrupo.toLowerCase().trim();
    if (!busquedaLimpia) return true;
    const textoCompleto = `${grupo.nombre_grupo || ""}`.toLowerCase();
    return busquedaLimpia.split(/\s+/).every((t) => textoCompleto.includes(t));
  });

  useEffect(() => {
    setStatsLoading(true);
    setStatsError(null);
    if (!hospitalId) {
      setStatsError("No se encontró el hospital asignado");
      setStatsLoading(false);
      return;
    }
    // Fetch stats del hospital
    fetch(`https://geoapphospital.onrender.com/api/hospitaladmin/stats-by-hospital/${hospitalId}`)
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

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-0">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Grupos registrados
          </h3>
          <div className="flex justify-end">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isWaiting ? (
                  <Clock className="h-4 w-4 text-orange-400 animate-pulse" />
                ) : isSearching ? (
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
      </div>
      <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
        {loading ? (
          <div className="text-center text-gray-500">Cargando grupos...</div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="text-center text-gray-500">No hay grupos registrados en este hospital.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2">Nombre del grupo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gruposFiltrados.map((g, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate">{g.nombre_grupo}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-4">
        {statsLoading ? (
          <div className="text-center text-gray-500 text-lg mb-4">Cargando estadísticas...</div>
        ) : statsError ? (
          <div className="text-center text-red-500 text-lg mb-4">{statsError}</div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatsCardHospital
              icon={<Layers />} 
              label="Grupos registrados"
              value={stats.total_grupos}
              color="blue"
              subtitle="Grupos activos en tu hospital"
              data-testid="stats-grupos"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GrupoListHospital;