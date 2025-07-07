import React, { useState, useEffect } from "react";
import {
  Hospital,
  Map,
  Search,
  User as UserIcon,
  Users,
  Clock,
} from "lucide-react";
import StatsCardHospital from "./StatsCardHospital";

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

  useEffect(() => {
    const fetchEmpleados = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://geoapphospital.onrender.com/api/hospitaladmin/empleados-by-ubicacion?id_hospital=${hospitalId}`);
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
        ) : empleadosFiltrados.length === 0 ? (
          <div className="text-center text-gray-500">No hay empleados registrados en este hospital.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">CURP</th>
                  <th className="px-4 py-2">Grupo</th>
                  <th className="px-4 py-2">Teléfono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empleadosFiltrados.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate">{e.nombre} {e.ap_paterno} {e.ap_materno}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{e.curp_user}</td>
                    <td className="px-4 py-3 text-sm">{e.nombre_grupo || '-'}</td>
                    <td className="px-4 py-3 text-sm">{e.telefono || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpleadoListHospital; 