import { Settings, UsersRound } from "lucide-react";

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
                <th className="px-4 py-2">Municipio</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grupos.map((grupo, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">{grupo.nombre_grupo}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{grupo.descripcion_group}</td>
                  <td className="px-4 py-3 text-sm">{grupo.nombre_hospital}</td>
                  <td className="px-4 py-3 text-sm">{grupo.nombre_estado}</td>
                  <td className="px-4 py-3 text-sm">{grupo.nombre_municipio || "—"}</td>
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
  );
};

export default GrupoList;