"use client";

import { useState } from "react";
import { Map, Search, Users, Edit3, Trash2, Building2 } from "lucide-react";

const AdministradorList = ({
  administradores,
  tipoAdminFiltro,
  setTipoAdminFiltro,
  busquedaAdmin,
  setBusquedaAdmin,
  estadoAdminFiltro,
  setEstadoAdminFiltro,
  onEditar,
  onEliminar,
}) => {
  const [mostrarTodosSuperAdmins, setMostrarTodosSuperAdmins] = useState(false);
  const [mostrarTodosEstados, setMostrarTodosEstados] = useState({});

  // Filtrado de administradores
  const administradoresFiltrados = administradores
    .filter((a) => (tipoAdminFiltro ? a.role_name === tipoAdminFiltro : true))
    .filter((a) =>
      estadoAdminFiltro
        ? (a.estado || "Sin estado") === estadoAdminFiltro
        : true
    )
    .filter((a) => {
      if (!busquedaAdmin) return true;
      const searchTerm = busquedaAdmin.toLowerCase();
      return (
        a.nombre?.toLowerCase().includes(searchTerm) ||
        a.ap_paterno?.toLowerCase().includes(searchTerm) ||
        a.ap_materno?.toLowerCase().includes(searchTerm) ||
        a.curp_user?.toLowerCase().includes(searchTerm)
      );
    });

  // Obtener estados únicos
  const estadosAdministradores = [
    ...new Set(administradores.map((a) => a.estado || "Sin estado")),
  ].sort();

  const renderSuperAdminTable = (admins) => (
    <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
      <table className="min-w-full divide-y divide-red-100">
        <thead className="bg-red-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Apellido Paterno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Apellido Materno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              CURP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Rol
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-red-100">
          {admins.map((admin) => (
            <tr key={admin.id_user} className="hover:bg-red-50">
              <td className="px-6 py-3 text-sm whitespace-normal">
                {admin.nombre}
              </td>
              <td className="px-6 py-3 text-sm whitespace-normal">
                {admin.ap_paterno}
              </td>
              <td className="px-6 py-3 text-sm whitespace-normal">
                {admin.ap_materno}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 whitespace-normal">
                {admin.curp_user}
              </td>
              <td className="px-6 py-3">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  Super Admin
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAdminTable = (admins) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Apellido Paterno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Apellido Materno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              CURP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Municipio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Hospital
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {admins.map((admin) => (
            <tr key={admin.id_user} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-sm whitespace-normal">
                {admin.nombre}
              </td>
              <td className="px-6 py-3 text-sm whitespace-normal">
                {admin.ap_paterno}
              </td>
              <td className="px-6 py-3 text-sm whitespace-normal">
                {admin.ap_materno}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 whitespace-normal">
                {admin.curp_user}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 whitespace-normal">
                {admin.municipio || "—"}
              </td>
              <td className="px-6 py-3 text-sm text-gray-600 whitespace-normal">
                {admin.hospital || "—"}
              </td>
              <td className="px-6 py-3">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    admin.role_name === "estadoadmin"
                      ? "bg-blue-100 text-blue-800"
                      : admin.role_name === "municipioadmin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {admin.role_name === "estadoadmin"
                    ? "Admin Estatal"
                    : admin.role_name === "municipioadmin"
                    ? "Admin Municipal"
                    : "Admin Hospital"}
                </span>
              </td>
              <td className="px-6 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onEditar?.(admin)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Editar administrador"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEliminar?.(admin)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Eliminar administrador"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Administradores registrados
          </h3>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o CURP..."
                value={busquedaAdmin}
                onChange={(e) => setBusquedaAdmin(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-2">Estado:</label>
              <select
                value={estadoAdminFiltro}
                onChange={(e) => setEstadoAdminFiltro(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {estadosAdministradores.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-2">Tipo:</label>
              <select
                value={tipoAdminFiltro}
                onChange={(e) => setTipoAdminFiltro(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="superadmin">Super Admin</option>
                <option value="estadoadmin">Administrador Estatal</option>
                <option value="municipioadmin">Administrador Municipal</option>
                <option value="hospitaladmin">Administrador de Hospital</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {administradoresFiltrados.length > 0 ? (
        <div className="p-6 space-y-8">
          {/* Sección Super Admins */}
          {(() => {
            const superAdmins = administradoresFiltrados.filter(
              (a) => a.role_name === "superadmin"
            );
            if (superAdmins.length > 0) {
              const superAdminsVisibles = mostrarTodosSuperAdmins
                ? superAdmins
                : superAdmins.slice(0, 5);

              return (
                <div className="mb-8 bg-red-50 p-4 rounded-lg border border-red-100">
                  <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-red-600" />
                    Super Administradores
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-red-200">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Apellido Paterno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Apellido Materno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            CURP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                            Rol
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-200">
                        {superAdminsVisibles.map((admin) => (
                          <tr key={admin.id_user} className="hover:bg-red-50">
                            <td className="px-6 py-3 text-sm whitespace-normal">
                              {admin.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm whitespace-normal">
                              {admin.ap_paterno}
                            </td>
                            <td className="px-6 py-3 text-sm whitespace-normal">
                              {admin.ap_materno}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600 whitespace-normal">
                              {admin.curp_user}
                            </td>
                            <td className="px-6 py-3">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Super Admin
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {superAdmins.length > 5 && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() =>
                          setMostrarTodosSuperAdmins(!mostrarTodosSuperAdmins)
                        }
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {mostrarTodosSuperAdmins
                          ? "Mostrar menos"
                          : `Ver todos (${superAdmins.length})`}
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Sección de administradores por estado */}
          {(() => {
            const estados = [
              ...new Set(
                administradoresFiltrados
                  .filter((a) => a.role_name !== "superadmin")
                  .map((a) => a.estado || "Sin estado")
              ),
            ].sort();

            if (
              estados.length === 0 &&
              administradoresFiltrados.filter(
                (a) => a.role_name !== "superadmin"
              ).length > 0
            ) {
              return (
                <div className="text-center text-gray-500 my-8">
                  No hay administradores que coincidan con los filtros
                  seleccionados.
                </div>
              );
            }

            return estados.map((estadoNombre) => {
              const adminsDelEstado = administradoresFiltrados.filter(
                (a) =>
                  a.role_name !== "superadmin" &&
                  (a.estado || "Sin estado") === estadoNombre
              );

              const mostrarTodos = mostrarTodosEstados[estadoNombre] || false;
              const adminsVisibles = mostrarTodos
                ? adminsDelEstado
                : adminsDelEstado.slice(0, 5);

              return (
                <div key={estadoNombre} className="mb-8">
                  <div className="flex items-center mb-4">
                    <Map className="h-5 w-5 mr-2 text-blue-600" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      Estado: {estadoNombre}
                    </h4>
                  </div>
                  {renderAdminTable(adminsVisibles)}
                  {adminsDelEstado.length > 5 && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => {
                          setMostrarTodosEstados({
                            ...mostrarTodosEstados,
                            [estadoNombre]: !mostrarTodos,
                          });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {mostrarTodos
                          ? "Mostrar menos"
                          : `Ver todos (${adminsDelEstado.length})`}
                      </button>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          No hay administradores registrados todavía.
        </div>
      )}
    </div>
  );
};

export default AdministradorList;
