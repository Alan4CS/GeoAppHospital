import React, { useEffect, useState } from "react";
import { ChevronRight, Hospital, Users, User } from "lucide-react";
import StatsCardEstado from "./StatsCardEstado";
import { useAuth } from "../../context/AuthContext";

export default function HospitalList({ estadoNombre = "Nombre del Estado", hospitales = [], loading = false, municipioNombre }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const hospitalesPorPagina = 20;
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) {
      setStatsError("No se encontró el usuario actual");
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    fetch(`https://geoapphospital.onrender.com/api/estadoadmin/stats-by-user/${userId}?source=stats`)
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
  }, []);

  const hospitalesFiltrados = hospitales;
  const indexInicio = (paginaActual - 1) * hospitalesPorPagina;
  const indexFin = indexInicio + hospitalesPorPagina;
  const hospitalesPagina = hospitalesFiltrados.slice(indexInicio, indexFin);
  const totalPaginas = Math.ceil(hospitalesFiltrados.length / hospitalesPorPagina);

  if (loading) return <div className="text-center text-gray-500">Cargando hospitales...</div>;
  if (!hospitales.length) return <div className="text-center text-gray-500">No hay hospitales registrados en {municipioNombre ? 'tu municipio' : 'tu estado'}.</div>;

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      {/* STATS CARDS */}
      <div className="p-6 border-b border-gray-200">
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
              icon={<User />}
              label="Empleados registrados"
              value={stats.total_empleados}
              color="red"
              subtitle="Empleados registrados"
              data-testid="stats-empleados"
            />
          </div>
        ) : null}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Hospital className="h-5 w-5 mr-2 text-emerald-600" />
            {`Hospitales registrados`}
          </h3>
        </div>
      </div>

      {/* Tabla de hospitales */}
      {hospitalesFiltrados.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Región</th>
                  <th className="px-4 py-2">Radio Cerca (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hospitalesPagina.map((h, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate">{h.nombre_hospital || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{h.nombre_estado || "-"}</td>
                    <td className="px-4 py-3 text-sm">{h.tipo_hospital || "-"}</td>
                    <td className="px-4 py-3 text-sm">{h.region || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      {h.radio_geo ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 whitespace-nowrap">
                          Geocerca definida
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-500 whitespace-nowrap">
                          Sin geocerca
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indexInicio + 1}</span> a{" "}
                  <span className="font-medium">{Math.min(indexFin, hospitalesFiltrados.length)}</span> de{" "}
                  <span className="font-medium">{hospitalesFiltrados.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                    disabled={paginaActual === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronRight className="h-5 w-5 transform rotate-180" />
                  </button>
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginaActual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaActual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginaActual - 2 + i;
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPaginaActual(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === paginaActual
                            ? "z-10 bg-emerald-50 border-emerald-500 text-emerald-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
