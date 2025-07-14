import React, { useState, useEffect } from "react";
import { Users, Search, Clock, Layers, Loader2, UserPlus } from "lucide-react";
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
if (typeof document !== 'undefined' && !document.getElementById('grupo-list-hospital-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'grupo-list-hospital-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

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
  
  // Estados adicionales para consistencia
  const [busquedaLocal, setBusquedaLocal] = useState(busquedaGrupo || "");
  const [isFiltering, setIsFiltering] = useState(false);

  // Mantener sincronizado busquedaLocal con pendingValue
  useEffect(() => {
    setBusquedaLocal(pendingValue);
  }, [pendingValue]);

  useEffect(() => {
    const fetchGrupos = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/grupos-by-hospital/${hospitalId}`);
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

  // Debounce mejorado para la búsqueda
  const handleBusquedaChange = (e) => {
    const value = e.target.value;
    setBusquedaLocal(value);
    setPendingValue(value);
  };

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
            icon={<Layers />} 
            label="Grupos registrados"
            value={stats.total_grupos}
            color="blue"
            subtitle="Grupos activos en tu hospital"
            data-testid="stats-grupos"
          />
        </div>
      ) : null}

      {/* Header principal */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Layers className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Grupos registrados</h3>
                <p className="text-sm text-gray-500">
                  {gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? "s" : ""}
                  {busquedaGrupo && " encontrados"}
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
                  placeholder="Buscar grupo..."
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
              {isSearching ? "Buscando grupos..." : "Aplicando filtros..."}
            </p>
          </div>
        </div>
      )}

      {/* Lista de grupos */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 fadeIn">
          <div className="px-6 py-8 text-center">
            <Loader2 className="h-6 w-6 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Cargando grupos...</p>
          </div>
        </div>
      ) : !isSearching && !isFiltering && gruposFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 fadeIn">
          <div className="px-6 py-16 text-center">
            <Layers className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {busquedaGrupo?.trim() 
                ? `No se encontraron grupos que coincidan con "${busquedaGrupo.trim()}"`
                : "No hay grupos registrados en este hospital."}
            </p>
          </div>
        </div>
      ) : !isSearching && !isFiltering ? (
        <div className="bg-white rounded-lg border border-gray-200 fadeIn">
          <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Layers className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Grupos del hospital</h4>
                <p className="text-sm text-gray-500">
                  {gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? "s" : ""} registrado{gruposFiltrados.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Nombre del grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {gruposFiltrados.map((grupo, index) => (
                  <tr
                    key={`${grupo.id_group}-${index}`}
                    className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {grupo.nombre_grupo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GrupoListHospital;