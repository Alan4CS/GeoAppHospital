"use client"
import { ChevronRight, Hospital, Settings } from "lucide-react"

const HospitalList = ({
  hospitales,
  estadoFiltro,
  setEstadoFiltro,
  handleEditarHospital,
  paginaActual,
  setPaginaActual,
  hospitalesPorPagina = 20,
}) => {
  // Filtrar hospitales por estado
  const hospitalesFiltrados = estadoFiltro
    ? hospitales.filter((h) => h.estado.toLowerCase() === estadoFiltro.toLowerCase())
    : hospitales

  // Calcular índices para paginación
  const indexInicio = (paginaActual - 1) * hospitalesPorPagina
  const indexFin = indexInicio + hospitalesPorPagina
  const hospitalesPagina = hospitalesFiltrados.slice(indexInicio, indexFin)

  // Calcular total de páginas
  const totalPaginas = Math.ceil(hospitalesFiltrados.length / hospitalesPorPagina)

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Hospital className="h-5 w-5 mr-2 text-emerald-600" />
            Hospitales registrados
          </h3>

          {/* Filtro por estado */}
          <div className="flex items-center">
            <label className="text-gray-700 font-medium mr-2">Filtrar por estado:</label>
            <select
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value)
                setPaginaActual(1)
              }}
              className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todos</option>
              {[...new Set(hospitales.map((h) => h.estado))]
                .filter(Boolean)
                .sort()
                .map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
            </select>
          </div>
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
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hospitalesPagina.map((h, i) => {
                  // Calcular el índice real en la lista completa
                  const indiceReal = indexInicio + i
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs truncate">{h.nombre}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{h.estado}</td>
                      <td className="px-4 py-3 text-sm">{h.tipoUnidad}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs truncate">{h.region}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{h.geocerca?.radio ?? "N/A"}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleEditarHospital(h, indiceReal)}
                          className="text-emerald-600 hover:text-emerald-800 transition-colors flex items-center"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
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
                    let pageNum
                    if (totalPaginas <= 5) {
                      pageNum = i + 1
                    } else if (paginaActual <= 3) {
                      pageNum = i + 1
                    } else if (paginaActual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i
                    } else {
                      pageNum = paginaActual - 2 + i
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
                    )
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
      ) : (
        <div className="p-6 text-center text-gray-500">No hay hospitales registrados.</div>
      )}
    </div>
  )
}

export default HospitalList