"use client";

import { useState } from "react";
import { Hospital, Map, Search, Settings, UserPlus } from "lucide-react";

const EmpleadoList = ({
  empleados,
  busquedaEmpleado,
  setBusquedaEmpleado,
  estadoEmpleadoFiltro,
  setEstadoEmpleadoFiltro,
  rolEmpleadoFiltro,
  setRolEmpleadoFiltro,
}) => {
  const [mostrarTodosEmpleados, setMostrarTodosEmpleados] = useState({});

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
            Empleados registrados
          </h3>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o CURP..."
                value={busquedaEmpleado || ""}
                onChange={(e) => setBusquedaEmpleado(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 w-full md:w-64"
              />
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-2">Estado:</label>
              <select
                value={estadoEmpleadoFiltro || ""}
                onChange={(e) => setEstadoEmpleadoFiltro(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Todos</option>
                {[...new Set(empleados.map((e) => e.estado))].filter(Boolean).sort().map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-gray-700 font-medium mr-2">Rol:</label>
              <select
                value={rolEmpleadoFiltro || ""}
                onChange={(e) => setRolEmpleadoFiltro(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Todos</option>
                {[...new Set(empleados.map((e) => e.role_name))].filter(Boolean).sort().map((rol) => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const empleadosFiltrados = empleados.filter((empleado) => {
          const coincideBusqueda =
            !busquedaEmpleado ||
            empleado.nombre?.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
            empleado.ap_paterno?.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
            empleado.ap_materno?.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
            empleado.curp_user?.toLowerCase().includes(busquedaEmpleado.toLowerCase());

          const coincideEstado = !estadoEmpleadoFiltro || empleado.estado === estadoEmpleadoFiltro;
          const coincideRol = !rolEmpleadoFiltro || empleado.role_name === rolEmpleadoFiltro;

          return coincideBusqueda && coincideEstado && coincideRol;
        });

        if (empleadosFiltrados.length === 0) {
          return (
            <div className="p-6 text-center text-gray-500">
              {empleados.length === 0
                ? "No hay empleados registrados todavía."
                : "No hay empleados que coincidan con los filtros seleccionados."}
            </div>
          );
        }

        const empleadosPorEstado = empleadosFiltrados.reduce((acc, empleado) => {
          const estado = empleado.estado || "Sin estado";
          const municipio = empleado.municipio || "Sin municipio";
          const hospital = empleado.hospital || "Sin hospital";
          const grupo = empleado.nombre_grupo || "Sin grupo";

          acc[estado] = acc[estado] || {};
          acc[estado][municipio] = acc[estado][municipio] || {};
          acc[estado][municipio][hospital] = acc[estado][municipio][hospital] || {};
          acc[estado][municipio][hospital][grupo] = acc[estado][municipio][hospital][grupo] || [];

          acc[estado][municipio][hospital][grupo].push(empleado);
          return acc;
        }, {});

        return (
          <div className="p-6 space-y-6">
            {Object.entries(empleadosPorEstado).map(([estado, municipios]) => (
              <div key={estado} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                  <Map className="h-5 w-5 mr-2 text-amber-600" />
                  Estado: {estado}
                </h4>

                <div className="space-y-4">
                  {Object.entries(municipios).map(([municipio, hospitales]) => (
                    <div key={`${estado}-${municipio}`} className="bg-white p-3 rounded-lg border border-slate-300">
                      <h5 className="text-md font-medium text-slate-600 mb-3 flex items-center">
                        <Map className="h-4 w-4 mr-2 text-amber-500" />
                        Municipio: {municipio}
                      </h5>

                      <div className="space-y-4">
                        {Object.entries(hospitales).map(([hospital, grupos]) => (
                          <div key={`${estado}-${municipio}-${hospital}`}>
                            <h6 className="text-sm font-medium text-slate-700 mb-2 flex items-center bg-slate-100 px-3 py-2 rounded-md">
                              <Hospital className="h-4 w-4 mr-2 text-amber-600" />
                              Hospital: {hospital}
                            </h6>

                            <div className="space-y-4">
                              {Object.entries(grupos).map(([grupo, empleadosGrupo]) => {
                                const key = `${estado}-${municipio}-${hospital}-${grupo}`;
                                const empleadosVisibles = mostrarTodosEmpleados[key]
                                  ? empleadosGrupo
                                  : empleadosGrupo.slice(0, 5);

                                return (
                                  <div key={key} className="border rounded-lg shadow-sm">
                                    <div className="bg-slate-50 px-4 py-2 border-b">
                                      <span className="text-sm font-semibold text-slate-700">
                                        Grupo: {grupo}
                                      </span>
                                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                        {empleadosGrupo.length} empleado
                                        {empleadosGrupo.length !== 1 ? "s" : ""}
                                      </span>
                                    </div>

                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                          <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Nombre</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Apellido Paterno</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Apellido Materno</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">CURP</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Rol</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                          {empleadosVisibles.map((empleado, index) => (
                                            <tr key={empleado.id_user || index} className="hover:bg-slate-50">
                                              <td className="px-4 py-3 text-sm">{empleado.nombre}</td>
                                              <td className="px-4 py-3 text-sm">{empleado.ap_paterno}</td>
                                              <td className="px-4 py-3 text-sm">{empleado.ap_materno}</td>
                                              <td className="px-4 py-3 text-sm font-mono text-xs">{empleado.curp_user}</td>
                                              <td className="px-4 py-3 text-sm">{empleado.telefono || "—"}</td>
                                              <td className="px-4 py-3 text-sm">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                  {empleado.role_name || "empleado"}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-sm">
                                                <button className="text-amber-600 hover:text-amber-800 flex items-center">
                                                  <Settings className="h-4 w-4 mr-1" />
                                                  Editar
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {empleadosGrupo.length > 5 && (
                                      <div className="px-4 py-2 text-center bg-slate-50 border-t">
                                        <button
                                          onClick={() =>
                                            setMostrarTodosEmpleados((prev) => ({
                                              ...prev,
                                              [key]: !prev[key],
                                            }))
                                          }
                                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                                        >
                                          {mostrarTodosEmpleados[key]
                                            ? "Mostrar menos"
                                            : `Ver todos (${empleadosGrupo.length})`}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

export default EmpleadoList;