import { Settings, UsersRound } from "lucide-react"

const GrupoList = ({ grupos }) => {
  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <UsersRound className="h-5 w-5 mr-2 text-purple-600" />
          Grupos registrados
        </h3>
      </div>

      {grupos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2">Hospital</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Fecha Creación</th>
                <th className="px-4 py-2">Miembros</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grupos.map((grupo) => (
                <tr key={grupo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="max-w-xs truncate font-medium">{grupo.nombre}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="max-w-xs truncate">{grupo.descripcion}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{grupo.hospital_nombre}</td>
                  <td className="px-4 py-3 text-sm">{grupo.estado}</td>
                  <td className="px-4 py-3 text-sm">{grupo.fechaCreacion}</td>
                  <td className="px-4 py-3 text-sm">{grupo.totalMiembros}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        grupo.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {grupo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-purple-600 hover:text-purple-800 transition-colors flex items-center">
                      <Settings className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">No hay grupos registrados todavía.</div>
      )}
    </div>
  )
}

export default GrupoList