import { useState, useEffect } from "react";
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
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const EmpleadoList = ({
  empleados: empleadosIniciales,
  busquedaEmpleado,
  setBusquedaEmpleado,
  estadoEmpleadoFiltro,
  setEstadoEmpleadoFiltro,
  rolEmpleadoFiltro,
  setRolEmpleadoFiltro,
  onEmpleadosUpdate,
}) => {
  const [empleadosLocales, setEmpleadosLocales] = useState(empleadosIniciales);
  const [mostrarTodosEmpleados, setMostrarTodosEmpleados] = useState({});
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [empleadoEliminar, setEmpleadoEliminar] = useState(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(5);
  const [botonEliminarHabilitado, setBotonEliminarHabilitado] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    ap_paterno: "",
    ap_materno: "",
    telefono: "",
    grupo: "",
    hospital: "",
    
  });
  const [grupos, setGrupos] = useState([]);
  const [hospitales, setHospitales] = useState([]); // Nuevo estado para hospitales

  // Sincronizar con empleadosIniciales cuando cambien
  useEffect(() => {
    setEmpleadosLocales(empleadosIniciales);
  }, [empleadosIniciales]);

  // Función para obtener empleados actualizados del servidor
  const obtenerEmpleadosActualizados = async () => {
    try {
      // Llamar a la función de actualización del padre
      if (onEmpleadosUpdate) {
        await onEmpleadosUpdate();
      }
      return true;
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      return false;
    }
  };

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, titulo, mensaje, duracion = 4000) => {
    setNotificacion({ tipo, titulo, mensaje, duracion });
    setTimeout(() => setNotificacion(null), duracion);
  };

  const empleadosFiltrados = empleadosLocales.filter((empleado) => {
    // Limpiamos y normalizamos el término de búsqueda
    const busquedaLimpia = busquedaEmpleado?.toLowerCase().trim() || "";

    if (!busquedaLimpia) return true;

    // Construimos el texto completo del empleado para búsqueda
    const textoCompleto = `${empleado.nombre || ""} ${
      empleado.ap_paterno || ""
    } ${empleado.ap_materno || ""} ${empleado.curp_user || ""}`
      .toLowerCase()
      .trim();

    // Términos individuales de búsqueda
    const terminosBusqueda = busquedaLimpia.split(/\s+/);

    // Verifica si todos los términos de búsqueda están presentes
    const coincideBusqueda = terminosBusqueda.every((termino) =>
      textoCompleto.includes(termino)
    );

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
      // Obtener ID del estado
      let id_estado = null;
      try {
        const estadosResponse = await fetch(
          "https://geoapphospital.onrender.com/api/superadmin/estados"
        );
        const estados = await estadosResponse.json();

        const estadoEncontrado = estados.find(
          (e) =>
            e.nombre_estado?.toLowerCase() === empleado.estado?.toLowerCase()
        );
        id_estado = estadoEncontrado?.id_estado;
      } catch (error) {
        console.error("❌ Error al obtener estados:", error);
      }

      // Obtener ID del municipio
      let id_municipio = null;
      if (id_estado) {
        try {
          const municipiosResponse = await fetch(
            `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado/${id_estado}`
          );
          const municipios = await municipiosResponse.json();

          const municipioEncontrado = municipios.find(
            (m) =>
              m.nombre_municipio?.toLowerCase() ===
              empleado.municipio?.toLowerCase()
          );
          id_municipio = municipioEncontrado?.id_municipio;
        } catch (error) {
          console.error("❌ Error al obtener municipios:", error);
        }
      }

      // Obtener ID del hospital
      let id_hospital = null;
      try {
        const hospitalesResponse = await fetch(
          "https://geoapphospital.onrender.com/api/superadmin/hospitals"
        );
        const hospitales = await hospitalesResponse.json();

        const hospitalEncontrado = hospitales.find(
          (h) =>
            h.nombre_hospital?.toLowerCase() ===
            empleado.hospital?.toLowerCase()
        );
        id_hospital = hospitalEncontrado?.id_hospital;
      } catch (error) {
        console.error("❌ Error al obtener hospitales:", error);
      }

      // Obtener ID del grupo
      let id_group = null;
      try {
        const gruposResponse = await fetch(
          "https://geoapphospital.onrender.com/api/groups/get-groups"
        );
        const grupos = await gruposResponse.json();

        const grupoEncontrado = grupos.find(
          (g) =>
            g.nombre_grupo?.toLowerCase().trim() ===
            empleado.nombre_grupo?.toLowerCase().trim()
        );
        id_group = grupoEncontrado?.id_group;
      } catch (error) {
        console.error("❌ Error al obtener grupos:", error);
      }

      const resultado = {
        id_estado,
        id_municipio,
        id_hospital,
        id_group,
      };

      return resultado;
    } catch (error) {
      console.error("❌ Error general al obtener IDs:", error);
      return {
        id_estado: null,
        id_municipio: null,
        id_hospital: null,
        id_group: null,
      };
    }
  };

  const handleEditar = async (empleado) => {
    setEmpleadoEditando(empleado);
    setFormData({
      nombre: empleado.nombre || "",
      ap_paterno: empleado.ap_paterno || "",
      ap_materno: empleado.ap_materno || "",
      telefono: empleado.telefono || "",
      grupo: empleado.nombre_grupo || "",
      hospital: empleado.hospital || "",
    });

    // Cargar hospitales SOLO del municipio del empleado usando el nuevo endpoint
    try {
      if (empleado.id_municipio) {
        const url = `https://geoapphospital.onrender.com/api/superadmin/hospitales-by-municipio?id_municipio=${empleado.id_municipio}`;
        const hospitalesResponse = await fetch(url);
        if (hospitalesResponse.ok) {
          const hospitalesData = await hospitalesResponse.json();
          setHospitales(hospitalesData);
        } else {
          setHospitales([]);
        }
      } else {
        setHospitales([]);
      }
    } catch (error) {
      setHospitales([]);
    }

    // Cargar grupos disponibles para el hospital actual
    try {
      if (empleado.id_hospital) {
        const gruposResponse = await fetch(
          `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${empleado.id_hospital}`
        );
        if (gruposResponse.ok) {
          const gruposData = await gruposResponse.json();
          setGrupos(gruposData);
        }
      }
    } catch (error) {
      setGrupos([]);
    }

    setMostrarModalEditar(true);
  };

  // Cuando cambia el hospital en el formulario, recargar grupos
  const handleHospitalChange = async (e) => {
    const hospitalSeleccionado = e.target.value;
    setFormData((prev) => ({ ...prev, hospital: hospitalSeleccionado, grupo: "" }));
    // Buscar el id_hospital
    const hospitalObj = hospitales.find(
      (h) => h.nombre_hospital === hospitalSeleccionado
    );
    if (hospitalObj) {
      try {
        const gruposResponse = await fetch(
          `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${hospitalObj.id_hospital}`
        );
        if (gruposResponse.ok) {
          const gruposData = await gruposResponse.json();
          setGrupos(gruposData);
        } else {
          setGrupos([]);
        }
      } catch (error) {
        setGrupos([]);
      }
    } else {
      setGrupos([]);
    }
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
      grupo: "",
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
      // Buscar el hospital y grupo seleccionados
      const hospitalSeleccionado = hospitales.find(
        (h) => h.nombre_hospital === formData.hospital
      );
      const id_hospital = hospitalSeleccionado?.id_hospital || empleadoEditando.id_hospital;
      const grupoSeleccionado = grupos.find(
        (g) => g.nombre_grupo === formData.grupo
      );
      const id_group = grupoSeleccionado?.id_group || empleadoEditando.id_group;

      const body = {
        id_user: empleadoEditando.id_user,
        nombre: formData.nombre.trim(),
        ap_paterno: formData.ap_paterno.trim(),
        ap_materno: formData.ap_materno.trim(),
        curp_user: empleadoEditando.curp_user,
        telefono: formData.telefono.trim(),
        id_estado: empleadoEditando.id_estado,
        id_municipio: empleadoEditando.id_municipio,
        id_hospital: id_hospital,
        id_group: id_group,
      };

      const response = await fetch(
        `https://geoapphospital.onrender.com/api/employees/update-employee`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      await response.json();

      // Obtener datos actualizados del servidor
      await obtenerEmpleadosActualizados();

      mostrarNotificacion(
        "exito",
        "¡Empleado actualizado!",
        `Los datos de ${formData.nombre} ${formData.ap_paterno} han sido actualizados correctamente.`
      );

      handleCerrarModalEditar();
    } catch (error) {
      mostrarNotificacion(
        "error",
        "Error al actualizar empleado",
        `No se pudo actualizar el empleado: ${error.message}`,
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    setLoadingEliminar(true);

    try {
      const response = await fetch(
        `https://geoapphospital.onrender.com/api/employees/delete-employee/${empleadoEliminar.id_user}`,
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

      await response.json();

      // Obtener datos actualizados del servidor
      await obtenerEmpleadosActualizados();

      mostrarNotificacion(
        "exito",
        "¡Empleado eliminado!",
        `${empleadoEliminar.nombre} ${empleadoEliminar.ap_paterno} ha sido eliminado del sistema.`
      );

      handleCerrarModalEliminar();
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      mostrarNotificacion(
        "error",
        "Error al eliminar empleado",
        `No se pudo eliminar el empleado: ${error.message}`,
        5000
      );
    } finally {
      setLoadingEliminar(false);
    }
  };

  // Componente de notificación toast
  const NotificacionToast = ({ notificacion, onCerrar }) => {
    const [progreso, setProgreso] = useState(100);

    useEffect(() => {
      if (!notificacion) return;

      const intervalo = setInterval(() => {
        setProgreso((prev) => {
          const nuevo = prev - 100 / (notificacion.duracion / 100);
          if (nuevo <= 0) {
            clearInterval(intervalo);
            return 0;
          }
          return nuevo;
        });
      }, 100);

      return () => clearInterval(intervalo);
    }, [notificacion]);

    if (!notificacion) return null;

    const esExito = notificacion.tipo === "exito";

    return (
      <div className="fixed top-4 right-4 z-[9999] max-w-md w-full">
        <div
          className={`rounded-lg shadow-lg border-l-4 p-4 ${
            esExito
              ? "bg-white border-green-500 text-green-800"
              : "bg-white border-red-500 text-red-800"
          } transform transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {esExito ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3
                className={`text-sm font-medium ${
                  esExito ? "text-green-800" : "text-red-800"
                }`}
              >
                {notificacion.titulo}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  esExito ? "text-green-700" : "text-red-700"
                }`}
              >
                {notificacion.mensaje}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onCerrar}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  esExito
                    ? "text-green-500 hover:bg-green-100 focus:ring-green-600"
                    : "text-red-500 hover:bg-red-100 focus:ring-red-600"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Barra de progreso */}
          <div
            className={`mt-2 w-full bg-gray-200 rounded-full h-1 ${
              esExito ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-100 ease-linear ${
                esExito ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Notificación Toast */}
      <NotificacionToast
        notificacion={notificacion}
        onCerrar={() => setNotificacion(null)}
      />

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
                  {[...new Set(empleadosLocales.map((e) => e.estado))].map(
                    (estado) => (
                      <option key={`estado-${estado}`} value={estado}>
                        {estado}
                      </option>
                    )
                  )}
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
                  {[...new Set(empleadosLocales.map((e) => e.role_name))].map(
                    (role) => (
                      <option key={`rol-${role}`} value={role}>
                        {role}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        {Object.entries(empleadosPorEstado).map(([estado, municipios]) => (
          <div key={`estado-${estado}`} className="p-6 space-y-6">
            {Object.entries(municipios).map(([municipio, hospitales]) => (
              <div
                key={`${estado}-${municipio}`}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200"
              >
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                  <Map className="h-5 w-5 mr-2 text-amber-600" />
                  Estado: {estado} / Municipio: {municipio}
                </h4>
                {Object.entries(hospitales).map(([hospital, grupos]) => (
                  <div key={`${estado}-${municipio}-${hospital}`}>
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
                                  key={`${empleado.id_user}-${empleado.curp_user}`}
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
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Información de referencia (No editable)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      CURP
                    </label>
                    <p className="text-sm text-slate-800 font-mono bg-white px-2 py-1 rounded border">
                      {empleadoEditando?.curp_user}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Estado
                    </label>
                    <p className="text-sm text-slate-800 bg-white px-2 py-1 rounded border">
                      {empleadoEditando?.estado}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Municipio
                    </label>
                    <p className="text-sm text-slate-800 bg-white px-2 py-1 rounded border">
                      {empleadoEditando?.municipio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Campos editables - Asignación */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-4 flex items-center">
                  <Hospital className="h-4 w-4 mr-2" />
                  Asignación de Hospital y Grupo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      <Hospital className="h-4 w-4 inline mr-1" />
                      Hospital *
                    </label>
                    <select
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleHospitalChange}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                      required
                    >
                      <option value="">Selecciona un hospital</option>
                      {hospitales.map((h) => (
                        <option key={h.id_hospital} value={h.nombre_hospital}>
                          {h.nombre_hospital}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-800 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Grupo
                    </label>
                    <select
                      name="grupo"
                      value={formData.grupo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                    >
                      <option value="">Selecciona un grupo</option>
                      {grupos.map((grupo) => (
                        <option key={grupo.id_group} value={grupo.nombre_grupo}>
                          {grupo.nombre_grupo}
                        </option>
                      ))}
                    </select>
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
