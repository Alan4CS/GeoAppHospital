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
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [nuevoNombreGrupo, setNuevoNombreGrupo] = useState("");
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [datosEmpleado, setDatosEmpleado] = useState({});

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
                {[...new Set(empleados.map((e) => e.estado))]
                  .filter(Boolean)
                  .sort()
                  .map((estado) => (
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
                {[...new Set(empleados.map((e) => e.role_name))]
                  .filter(Boolean)
                  .sort()
                  .map((rol) => (
                    <option key={rol} value={rol}>{rol}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(empleadosPorEstado).map(([estado, municipios]) => (
        <div key={estado} className="p-6 space-y-6">
          {Object.entries(municipios).map(([municipio, hospitales]) => (
            <div key={municipio} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                <Map className="h-5 w-5 mr-2 text-amber-600" />
                Estado: {estado} / Municipio: {municipio}
              </h4>
              {Object.entries(hospitales).map(([hospital, grupos]) => (
                <div key={hospital}>
                  <h5 className="text-md font-medium text-slate-700 mb-2 flex items-center">
                    <Hospital className="h-4 w-4 mr-2 text-amber-600" />
                    Hospital: {hospital}
                  </h5>
                  {Object.entries(grupos).map(([grupo, empleadosGrupo]) => {
                    const key = `${estado}-${municipio}-${hospital}-${grupo}`;
                    const visibles = mostrarTodosEmpleados[key] ? empleadosGrupo : empleadosGrupo.slice(0, 5);
                    return (
                      <div key={key} className="mb-6 border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 flex justify-between items-center">
                          <span className="font-medium text-slate-700">
                            Grupo: {grupo} ({empleadosGrupo.length})
                          </span>
                          <button
                            onClick={() => {
                              setGrupoSeleccionado({ nombre: grupo });
                              setNuevoNombreGrupo(grupo);
                            }}
                            className="text-sm text-amber-600 hover:underline"
                          >
                            Editar grupo
                          </button>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ap. Paterno</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ap. Materno</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">CURP</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Teléfono</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Rol</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {visibles.map((empleado) => (
                              <tr key={empleado.id_user} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm">{empleado.nombre}</td>
                                <td className="px-4 py-2 text-sm">{empleado.ap_paterno}</td>
                                <td className="px-4 py-2 text-sm">{empleado.ap_materno}</td>
                                <td className="px-4 py-2 text-sm font-mono text-xs">{empleado.curp_user}</td>
                                <td className="px-4 py-2 text-sm">{empleado.telefono || "—"}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                    {empleado.role_name || "Empleado"}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <button
                                    onClick={() => {
                                      setEmpleadoEditando(empleado);
                                      setDatosEmpleado(empleado);
                                    }}
                                    className="text-amber-600 hover:text-amber-800 flex items-center"
                                  >
                                    <Settings className="h-4 w-4 mr-1" /> Editar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {empleadosGrupo.length > 5 && (
                          <div className="px-4 py-2 bg-slate-50 text-center">
                            <button
                              onClick={() => setMostrarTodosEmpleados(prev => ({ ...prev, [key]: !prev[key] }))}
                              className="text-amber-600 hover:text-amber-800 text-sm"
                            >
                              {mostrarTodosEmpleados[key] ? "Mostrar menos" : `Ver todos (${empleadosGrupo.length})`}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {grupoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar Grupo</h2>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del grupo</label>
            <input
              type="text"
              value={nuevoNombreGrupo}
              onChange={(e) => setNuevoNombreGrupo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  alert("Eliminar grupo: " + grupoSeleccionado.nombre);
                  setGrupoSeleccionado(null);
                }}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  alert(`Renombrar grupo: "${grupoSeleccionado.nombre}" a "${nuevoNombreGrupo}"`);
                  setGrupoSeleccionado(null);
                }}
                className="px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                Guardar
              </button>
              <button
                onClick={() => setGrupoSeleccionado(null)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {empleadoEditando && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar Empleado</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre"
                value={datosEmpleado.nombre || ""}
                onChange={(e) => setDatosEmpleado({ ...datosEmpleado, nombre: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Apellido paterno"
                value={datosEmpleado.ap_paterno || ""}
                onChange={(e) => setDatosEmpleado({ ...datosEmpleado, ap_paterno: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Apellido materno"
                value={datosEmpleado.ap_materno || ""}
                onChange={(e) => setDatosEmpleado({ ...datosEmpleado, ap_materno: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={datosEmpleado.telefono || ""}
                onChange={(e) => setDatosEmpleado({ ...datosEmpleado, telefono: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  alert(`Guardar cambios del empleado: ${datosEmpleado.nombre}`);
                  setEmpleadoEditando(null);
                }}
                className="px-4 py-2 text-sm text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
              >
                Guardar
              </button>
              <button
                onClick={() => setEmpleadoEditando(null)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpleadoList;