"use client";

import { useState } from "react";
import {
  Hospital,
  Map,
  Search,
  UserPlus,
  Edit3,
  Trash2,
  X,
  Save,
  User,
  Phone,
  FileText,
} from "lucide-react";

const EmpleadoList = ({
  empleados,
  busquedaEmpleado,
  setBusquedaEmpleado,
  estadoEmpleadoFiltro,
  setEstadoEmpleadoFiltro,
  rolEmpleadoFiltro,
  setRolEmpleadoFiltro,
  onActualizarEmpleados,
}) => {
  const [mostrarTodosEmpleados, setMostrarTodosEmpleados] = useState({});
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [empleadoEliminar, setEmpleadoEliminar] = useState(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(5);
  const [botonEliminarHabilitado, setBotonEliminarHabilitado] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    ap_paterno: "",
    ap_materno: "",
    telefono: "",
  });

  const empleadosFiltrados = empleados.filter((empleado) => {
    const coincideBusqueda =
      !busquedaEmpleado ||
      empleado.nombre?.toLowerCase().includes(busquedaEmpleado.toLowerCase()) ||
      empleado.ap_paterno
        ?.toLowerCase()
        .includes(busquedaEmpleado.toLowerCase()) ||
      empleado.ap_materno
        ?.toLowerCase()
        .includes(busquedaEmpleado.toLowerCase()) ||
      empleado.curp_user
        ?.toLowerCase()
        .includes(busquedaEmpleado.toLowerCase());

    const coincideEstado =
      !estadoEmpleadoFiltro || empleado.estado === estadoEmpleadoFiltro;
    const coincideRol =
      !rolEmpleadoFiltro || empleado.role_name === rolEmpleadoFiltro;

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
    acc[estado][municipio][hospital][grupo] =
      acc[estado][municipio][hospital][grupo] || [];

    acc[estado][municipio][hospital][grupo].push(empleado);
    return acc;
  }, {});

  // Función para obtener IDs basándose en los nombres
  const obtenerIDs = async (empleado) => {
    try {
      console.log("🔍 Obteniendo IDs para:", {
        estado: empleado.estado,
        municipio: empleado.municipio,
        hospital: empleado.hospital,
        grupo: empleado.nombre_grupo,
      });

      // Obtener ID del estado
      let id_estado = null;
      try {
        const estadosResponse = await fetch(
          "http://localhost:4000/api/superadmin/estados"
        );
        const estados = await estadosResponse.json();
        console.log("📍 Estados disponibles:", estados);

        const estadoEncontrado = estados.find(
          (e) =>
            e.nombre_estado?.toLowerCase() === empleado.estado?.toLowerCase()
        );
        id_estado = estadoEncontrado?.id_estado;
        console.log("📍 Estado encontrado:", estadoEncontrado);
      } catch (error) {
        console.error("❌ Error al obtener estados:", error);
      }

      // Obtener ID del municipio
      let id_municipio = null;
      if (id_estado) {
        try {
          const municipiosResponse = await fetch(
            `http://localhost:4000/api/municipioadmin/municipios-by-estado/${id_estado}`
          );
          const municipios = await municipiosResponse.json();
          console.log("🏘️ Municipios disponibles:", municipios);

          const municipioEncontrado = municipios.find(
            (m) =>
              m.nombre_municipio?.toLowerCase() ===
              empleado.municipio?.toLowerCase()
          );
          id_municipio = municipioEncontrado?.id_municipio;
          console.log("🏘️ Municipio encontrado:", municipioEncontrado);
        } catch (error) {
          console.error("❌ Error al obtener municipios:", error);
        }
      }

      // Obtener ID del hospital
      let id_hospital = null;
      try {
        const hospitalesResponse = await fetch(
          "http://localhost:4000/api/superadmin/hospitals"
        );
        const hospitales = await hospitalesResponse.json();
        console.log("🏥 Hospitales disponibles:", hospitales);

        const hospitalEncontrado = hospitales.find(
          (h) =>
            h.nombre_hospital?.toLowerCase() ===
            empleado.hospital?.toLowerCase()
        );
        id_hospital = hospitalEncontrado?.id_hospital;
        console.log("🏥 Hospital encontrado:", hospitalEncontrado);
      } catch (error) {
        console.error("❌ Error al obtener hospitales:", error);
      }

      // Obtener ID del grupo
      let id_group = null;
      try {
        const gruposResponse = await fetch(
          "http://localhost:4000/api/groups/get-groups"
        );
        const grupos = await gruposResponse.json();
        console.log("👥 Grupos disponibles:", grupos);

        const grupoEncontrado = grupos.find(
          (g) =>
            g.nombre_grupo?.toLowerCase().trim() ===
            empleado.nombre_grupo?.toLowerCase().trim()
        );
        id_group = grupoEncontrado?.id_group;
        console.log("👥 Grupo encontrado:", grupoEncontrado);
      } catch (error) {
        console.error("❌ Error al obtener grupos:", error);
      }

      const resultado = {
        id_estado,
        id_municipio,
        id_hospital,
        id_group,
      };

      console.log("✅ IDs obtenidos:", resultado);
      return resultado;
    } catch (error) {
      console.error("💥 Error general al obtener IDs:", error);
      return {
        id_estado: null,
        id_municipio: null,
        id_hospital: null,
        id_group: null,
      };
    }
  };

  const handleEditar = (empleado) => {
    console.log("🎯 Empleado seleccionado para editar:", empleado);
    setEmpleadoEditando(empleado);
    setFormData({
      nombre: empleado.nombre || "",
      ap_paterno: empleado.ap_paterno || "",
      ap_materno: empleado.ap_materno || "",
      telefono: empleado.telefono || "",
    });
    setMostrarModalEditar(true);
  };

  const handleEliminar = (empleado) => {
    setEmpleadoEliminar(empleado);
    setMostrarModalEliminar(true);
    setBotonEliminarHabilitado(false);
    setTiempoRestante(5);

    // Iniciar el temporizador
    const intervalo = setInterval(() => {
      setTiempoRestante((prevTiempo) => {
        if (prevTiempo <= 1) {
          clearInterval(intervalo);
          setBotonEliminarHabilitado(true);
          return 0;
        }
        return prevTiempo - 1;
      });
    }, 1000);
  };

  const handleCerrarModalEditar = () => {
    setMostrarModalEditar(false);
    setEmpleadoEditando(null);
    setFormData({
      nombre: "",
      ap_paterno: "",
      ap_materno: "",
      telefono: "",
    });
  };

  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setEmpleadoEliminar(null);
    setBotonEliminarHabilitado(false);
    setTiempoRestante(5);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("🔍 Iniciando actualización de empleado...");
      console.log("📝 Datos del formulario:", formData);
      console.log("👤 Empleado original:", empleadoEditando);

      // Obtener los IDs necesarios
      console.log("🔄 Obteniendo IDs...");
      const ids = await obtenerIDs(empleadoEditando);

      // Verificar que todos los IDs requeridos estén presentes
      if (!ids.id_estado || !ids.id_hospital || !ids.id_group) {
        console.error("❌ IDs faltantes:");
        console.error("  - id_estado:", ids.id_estado);
        console.error("  - id_municipio:", ids.id_municipio);
        console.error("  - id_hospital:", ids.id_hospital);
        console.error("  - id_group:", ids.id_group);

        const faltantes = [];
        if (!ids.id_estado) faltantes.push("estado");
        if (!ids.id_hospital) faltantes.push("hospital");
        if (!ids.id_group) faltantes.push("grupo");

        throw new Error(
          `No se pudieron obtener los IDs de: ${faltantes.join(
            ", "
          )}. Verifica que existan en el sistema.`
        );
      }

      const body = {
        id_user: empleadoEditando.id_user,
        nombre: formData.nombre.trim(),
        ap_paterno: formData.ap_paterno.trim(),
        ap_materno: formData.ap_materno.trim(),
        curp_user: empleadoEditando.curp_user,
        telefono: formData.telefono.trim(),
        id_estado: ids.id_estado,
        id_municipio: ids.id_municipio,
        id_hospital: ids.id_hospital,
        id_group: ids.id_group,
      };

      console.log("📤 Datos que se enviarán al servidor:", body);

      const response = await fetch(
        `http://localhost:4000/api/employees/update-employee`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      console.log("📡 Status de respuesta:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error del servidor:", errorText);
        throw new Error(
          `Error ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Respuesta exitosa del servidor:", data);

      alert("✅ Empleado actualizado con éxito");
      handleCerrarModalEditar();

      if (onActualizarEmpleados) {
        console.log("🔄 Actualizando lista de empleados...");
        onActualizarEmpleados();
      }
    } catch (error) {
      console.error("💥 Error completo al actualizar empleado:", error);
      alert(`❌ Error al actualizar el empleado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    setLoadingEliminar(true);

    try {
      const response = await fetch(
        `http://localhost:4000/api/employees/delete-employee/${empleadoEliminar.id_user}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      alert("✅ Empleado eliminado con éxito");
      handleCerrarModalEliminar();

      if (onActualizarEmpleados) {
        onActualizarEmpleados();
      }
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      alert(`❌ Error al eliminar el empleado: ${error.message}`);
    } finally {
      setLoadingEliminar(false);
    }
  };

  return (
    <>
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
                <label className="text-gray-700 font-medium mr-2">
                  Estado:
                </label>
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
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
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
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {Object.entries(empleadosPorEstado).map(([estado, municipios]) => (
          <div key={estado} className="p-6 space-y-6">
            {Object.entries(municipios).map(([municipio, hospitales]) => (
              <div
                key={municipio}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200"
              >
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
                      const visibles = mostrarTodosEmpleados[key]
                        ? empleadosGrupo
                        : empleadosGrupo.slice(0, 5);
                      return (
                        <div
                          key={key}
                          className="mb-6 border border-slate-300 rounded-lg overflow-hidden"
                        >
                          <div className="bg-slate-100 px-4 py-2 flex justify-between items-center">
                            <span className="font-medium text-slate-700">
                              Grupo: {grupo} ({empleadosGrupo.length})
                            </span>
                          </div>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Nombre
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Ap. Paterno
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Ap. Materno
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  CURP
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Teléfono
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Rol
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {visibles.map((empleado) => (
                                <tr
                                  key={empleado.id_user}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-2 text-sm">
                                    {empleado.nombre}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {empleado.ap_paterno}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {empleado.ap_materno}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-mono text-xs">
                                    {empleado.curp_user}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    {empleado.telefono || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                      {empleado.role_name || "Empleado"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleEditar(empleado)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors flex items-center p-1 rounded hover:bg-blue-50"
                                        title="Editar empleado"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEliminar(empleado)}
                                        className="text-red-600 hover:text-red-800 transition-colors flex items-center p-1 rounded hover:bg-red-50"
                                        title="Eliminar empleado"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {empleadosGrupo.length > 5 && (
                            <div className="px-4 py-2 bg-slate-50 text-center">
                              <button
                                onClick={() =>
                                  setMostrarTodosEmpleados((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                                className="text-amber-600 hover:text-amber-800 text-sm"
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
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* MODAL DE EDICIÓN DE EMPLEADO */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <User className="h-6 w-6 mr-2 text-amber-600" />
                Editar Empleado
              </h2>
              <button
                onClick={handleCerrarModalEditar}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditar} className="space-y-6">
              {/* Información no editable */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CURP (No editable)
                    </label>
                    <p className="text-sm text-gray-600 font-mono">
                      {empleadoEditando?.curp_user}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hospital
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEditando?.hospital}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupo
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEditando?.nombre_grupo}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEditando?.estado}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Municipio
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEditando?.municipio}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nombre del empleado"
                    required
                  />
                </div>

                {/* Apellido Paterno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    name="ap_paterno"
                    value={formData.ap_paterno}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Apellido paterno"
                    required
                  />
                </div>

                {/* Apellido Materno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Apellido Materno *
                  </label>
                  <input
                    type="text"
                    name="ap_materno"
                    value={formData.ap_materno}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Apellido materno"
                    required
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCerrarModalEditar}
                  className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Guardando..." : "Actualizar Empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Trash2 className="h-6 w-6 mr-2 text-red-600" />
                Eliminar Empleado
              </h2>
              <button
                onClick={handleCerrarModalEliminar}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEliminar?.nombre} {empleadoEliminar?.ap_paterno}{" "}
                      {empleadoEliminar?.ap_materno}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CURP
                    </label>
                    <p className="text-sm text-gray-600 font-mono">
                      {empleadoEliminar?.curp_user}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hospital
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEliminar?.hospital}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupo
                    </label>
                    <p className="text-sm text-gray-600">
                      {empleadoEliminar?.nombre_grupo}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará
                  permanentemente al empleado del sistema y no podrá ser
                  recuperado.
                </p>
                {!botonEliminarHabilitado && (
                  <p className="text-sm text-red-800 mt-2">
                    Por seguridad, el botón de eliminar se habilitará en{" "}
                    {tiempoRestante} segundos.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCerrarModalEliminar}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                disabled={loadingEliminar || !botonEliminarHabilitado}
                className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors ${
                  botonEliminarHabilitado
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loadingEliminar
                  ? "Eliminando..."
                  : botonEliminarHabilitado
                  ? "Eliminar Empleado"
                  : `Espere ${tiempoRestante}s...`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmpleadoList;
