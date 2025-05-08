import { useState } from "react"
import { Check, Search, Star, X } from "lucide-react"

export default function HospitalGroupLeaderForm({ grupo, miembros, onAsignar, onCancelar }) {
  const [busqueda, setBusqueda] = useState("")
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null)
  const [error, setError] = useState("")

  // Filtrar miembros según la búsqueda
  const miembrosFiltrados = busqueda
    ? miembros.filter((m) => m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : miembros

  const handleSeleccionarMiembro = (miembro) => {
    setMiembroSeleccionado(miembro)
    setError("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!miembroSeleccionado) {
      setError("Debes seleccionar un miembro para asignar como líder")
      return
    }

    // Llamar a la función de asignar del componente padre
    onAsignar(grupo.id, miembroSeleccionado)
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Star className="h-5 w-5 mr-2 text-amber-500" />
          Asignar Líder de Grupo
        </h2>
        <p className="text-gray-500 mt-1">
          Selecciona un miembro para asignar como líder del grupo <strong>{grupo?.nombre}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar miembro</label>
            <div className="relative">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                placeholder="Buscar por nombre..."
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Miembros disponibles</h3>
            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              {miembrosFiltrados.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {miembrosFiltrados.map((miembro) => (
                    <li
                      key={miembro.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        miembroSeleccionado?.id === miembro.id ? "bg-indigo-50" : ""
                      }`}
                      onClick={() => handleSeleccionarMiembro(miembro)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{miembro.nombre}</p>
                          <p className="text-sm text-gray-500">{miembro.curp}</p>
                        </div>
                        {miembro.esLider && (
                          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Líder de otro grupo
                          </span>
                        )}
                        {miembroSeleccionado?.id === miembro.id && (
                          <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">No se encontraron miembros.</div>
              )}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {miembroSeleccionado && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h3 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1 text-amber-500" />
                Miembro seleccionado como líder
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{miembroSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-600">{miembroSeleccionado.curp}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMiembroSeleccionado(null)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Star className="h-4 w-4 mr-2" />
            Asignar como líder
          </button>
        </div>
      </form>
    </div>
  )
}