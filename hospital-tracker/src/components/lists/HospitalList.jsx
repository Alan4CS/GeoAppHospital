import { ChevronRight, Hospital, Settings, MapPin, Shield } from "lucide-react"

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
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header limpio */}
      <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Hospital className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Hospitales registrados
              </h3>
              <p className="text-sm text-gray-500">
                {hospitalesFiltrados.length} hospital{hospitalesFiltrados.length !== 1 ? 'es' : ''}
                {estadoFiltro && ` en ${estadoFiltro}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <select
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value)
                setPaginaActual(1)
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
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

      {/* Tabla minimalista */}
      {hospitalesFiltrados.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Región
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Geocerca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    
                  </th>
                </tr>
              </thead>
              <tbody>
                {hospitalesPagina.map((h, i) => {
                  const indiceReal = indexInicio + i
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 truncate max-w-xs">
                          {h.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {h.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {h.tipoUnidad}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 truncate max-w-xs block">
                          {h.region}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {h.geocerca?.radio ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            Definida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            Sin definir
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEditarHospital(h, indiceReal)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación minimalista */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                disabled={paginaActual === 1}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {indexInicio + 1}–{Math.min(indexFin, hospitalesFiltrados.length)} de {hospitalesFiltrados.length}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaActual === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4 transform rotate-180" />
                </button>
                
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
                      className={`w-8 h-8 text-sm rounded transition-colors ${
                        pageNum === paginaActual
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 py-16 text-center">
          <Hospital className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {estadoFiltro 
              ? `No hay hospitales en ${estadoFiltro}`
              : 'No hay hospitales registrados'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default HospitalList