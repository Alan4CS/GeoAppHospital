"use client"

import { useState, useMemo } from "react"
import {
  Users,
  Search,
  Edit3,
  User,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  MapPin,
  Settings,
  Trash2,
} from "lucide-react"

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
  const [mostrarTodosSuperAdmins, setMostrarTodosSuperAdmins] = useState(false)
  const [mostrarTodosEstados, setMostrarTodosEstados] = useState({})
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [adminEditando, setAdminEditando] = useState(null)
  const [adminEliminar, setAdminEliminar] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState(5)
  const [botonEliminarHabilitado, setBotonEliminarHabilitado] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)
  const [notificacion, setNotificacion] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    ap_paterno: "",
    ap_materno: "",
    curp_user: "",
  })

  const abrirModal = (admin) => {
    setAdminEditando(admin)
    setFormData({
      nombre: admin.nombre || "",
      ap_paterno: admin.ap_paterno || "",
      ap_materno: admin.ap_materno || "",
      curp_user: admin.curp_user || "",
    })
    setModalAbierto(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const dataToSend = {
        id_user: adminEditando.id_user,
        nombre: formData.nombre,
        ap_paterno: formData.ap_paterno,
        ap_materno: formData.ap_materno,
        curp_user: formData.curp_user,
      }

      const response = await fetch("https://geoapphospital.onrender.com/api/superadmin/update-admins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar administrador")
      }

      setModalAbierto(false)
      if (onEditar) {
        onEditar(adminEditando)
      }
    } catch (error) {
      console.error("Error al actualizar:", error)
      alert("Error al actualizar el administrador")
    }
  }

  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotificacion({ tipo, titulo, mensaje })
    setTimeout(() => setNotificacion(null), tipo === "exito" ? 4000 : 5000)
  }

  const handleEliminar = (admin) => {
    setAdminEliminar(admin)
    setModalEliminarAbierto(true)
    setBotonEliminarHabilitado(false)
    setTiempoRestante(5)

    const intervalo = setInterval(() => {
      setTiempoRestante((prevTiempo) => {
        if (prevTiempo <= 1) {
          clearInterval(intervalo)
          setBotonEliminarHabilitado(true)
          return 0
        }
        return prevTiempo - 1
      })
    }, 1000)
  }

  const handleCerrarModalEliminar = () => {
    setModalEliminarAbierto(false)
    setAdminEliminar(null)
    setBotonEliminarHabilitado(false)
    setTiempoRestante(5)
  }

  const handleConfirmarEliminar = async () => {
    setLoadingEliminar(true)

    try {
      const response = await fetch(
        `https://geoapphospital.onrender.com/api/superadmin/delete-admin/${adminEliminar.id_user}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Respuesta del servidor:", data)

      mostrarNotificacion(
        "exito",
        "¡Administrador eliminado!",
        `${adminEliminar.nombre} ${adminEliminar.ap_paterno} ha sido eliminado del sistema.`,
      )

      handleCerrarModalEliminar()

      if (onEliminar) {
        onEliminar(adminEliminar)
      }
    } catch (error) {
      console.error("Error al eliminar administrador:", error)
      mostrarNotificacion(
        "error",
        "Error al eliminar administrador",
        `No se pudo eliminar el administrador: ${error.message}`,
      )
    } finally {
      setLoadingEliminar(false)
    }
  }

  const administradoresFiltrados = useMemo(() => {
    return administradores.filter((admin) => {
      const busquedaLimpia = busquedaAdmin.toLowerCase().trim()

      // Filtro de búsqueda (nombre o curp)
      let coincideBusqueda = true
      if (busquedaLimpia) {
        const nombreCompleto = `${admin.nombre || ""} ${admin.ap_paterno || ""} ${admin.ap_materno || ""}`
          .toLowerCase()
          .trim()
        const terminosBusqueda = busquedaLimpia.split(/\s+/)
        coincideBusqueda = terminosBusqueda.every(
          (termino) => nombreCompleto.includes(termino) || admin.curp_user?.toLowerCase().includes(termino),
        )
      }

      // Filtro por tipo de admin (rol)
      let coincideTipo = true
      if (tipoAdminFiltro && tipoAdminFiltro !== "") {
        coincideTipo = admin.role_name === tipoAdminFiltro
      }

      // Filtro por estado
      let coincideEstado = true
      if (estadoAdminFiltro && estadoAdminFiltro !== "") {
        coincideEstado = admin.estado === estadoAdminFiltro
      }

      return coincideBusqueda && coincideTipo && coincideEstado
    })
  }, [administradores, busquedaAdmin, tipoAdminFiltro, estadoAdminFiltro])

  const superAdmins = administradoresFiltrados.filter((a) => a.role_name === "superadmin")

  const adminsPorEstado = useMemo(() => {
    const estados = {}
    administradoresFiltrados
      .filter((a) => a.role_name !== "superadmin")
      .forEach((admin) => {
        const estado = admin.estado || "Sin estado"
        if (!estados[estado]) {
          estados[estado] = []
        }
        estados[estado].push(admin)
      })
    return estados
  }, [administradoresFiltrados])

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Administradores registrados</h3>
                <p className="text-sm text-gray-500">
                  {administradoresFiltrados.length} administrador{administradoresFiltrados.length !== 1 ? "es" : ""}
                  {(tipoAdminFiltro || estadoAdminFiltro) && " filtrados"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o CURP..."
                  value={busquedaAdmin}
                  onChange={(e) => setBusquedaAdmin(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <select
                  value={estadoAdminFiltro}
                  onChange={(e) => setEstadoAdminFiltro(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  {[...new Set(administradores.map((a) => a.estado))]
                    .filter(Boolean)
                    .sort()
                    .map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                </select>
              </div>

              <select
                value={tipoAdminFiltro}
                onChange={(e) => setTipoAdminFiltro(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="superadmin">Super Admin</option>
                <option value="estadoadmin">Admin Estatal</option>
                <option value="municipioadmin">Admin Municipal</option>
                <option value="hospitaladmin">Admin Hospital</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {administradoresFiltrados.length > 0 ? (
        <>
          {/* Sección Super Administradores */}
          {superAdmins.length > 0 && (
            <div className="bg-white rounded-lg border border-red-200">
              <div className="px-6 py-4 border-b border-red-100 bg-red-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Super Administradores</h4>
                      <p className="text-sm text-gray-500">
                        {superAdmins.length} super administrador{superAdmins.length !== 1 ? "es" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Apellido Paterno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Apellido Materno
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        CURP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-48">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mostrarTodosSuperAdmins ? superAdmins : superAdmins.slice(0, 5)).map((admin) => (
                      <tr key={admin.id_user} className="border-b border-red-50 hover:bg-red-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 truncate max-w-xs">{admin.nombre}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{admin.ap_paterno}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{admin.ap_materno}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 font-mono">{admin.curp_user}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                            Super Admin
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => abrirModal(admin)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md"
                              title="Editar administrador"
                            >
                              <Settings className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(admin)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-md"
                              title="Eliminar administrador"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {superAdmins.length > 5 && (
                <div className="px-6 py-4 border-t border-red-100 text-center">
                  <button
                    onClick={() => setMostrarTodosSuperAdmins(!mostrarTodosSuperAdmins)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    {mostrarTodosSuperAdmins ? "Mostrar menos" : `Ver todos (${superAdmins.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Secciones por Estado */}
          {Object.keys(adminsPorEstado)
            .sort()
            .map((estadoNombre) => {
              const adminsDelEstado = adminsPorEstado[estadoNombre]
              const mostrarTodos = mostrarTodosEstados[estadoNombre] || false
              const adminsVisibles = mostrarTodos ? adminsDelEstado : adminsDelEstado.slice(0, 5)

              return (
                <div key={estadoNombre} className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Estado: {estadoNombre}</h4>
                        <p className="text-sm text-gray-500">
                          {adminsDelEstado.length} administrador{adminsDelEstado.length !== 1 ? "es" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Apellido Paterno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Apellido Materno
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            CURP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Municipio
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Hospital
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-48">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminsVisibles.map((admin) => (
                          <tr
                            key={admin.id_user}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900 truncate max-w-xs">{admin.nombre}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{admin.ap_paterno}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">{admin.ap_materno}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 font-mono">{admin.curp_user}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 truncate max-w-xs block">
                                {admin.municipio || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 truncate max-w-xs block">
                                {admin.hospital || "—"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  admin.role_name === "estadoadmin"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : admin.role_name === "municipioadmin"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    admin.role_name === "estadoadmin"
                                      ? "bg-blue-500"
                                      : admin.role_name === "municipioadmin"
                                        ? "bg-purple-500"
                                        : "bg-emerald-500"
                                  }`}
                                ></div>
                                {admin.role_name === "estadoadmin"
                                  ? "Admin Estatal"
                                  : admin.role_name === "municipioadmin"
                                    ? "Admin Municipal"
                                    : "Admin Hospital"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => abrirModal(admin)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md"
                                  title="Editar administrador"
                                >
                                  <Settings className="h-4 w-4" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleEliminar(admin)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-md"
                                  title="Eliminar administrador"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {adminsDelEstado.length > 5 && (
                    <div className="px-6 py-4 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          setMostrarTodosEstados({
                            ...mostrarTodosEstados,
                            [estadoNombre]: !mostrarTodos,
                          })
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        {mostrarTodos ? "Mostrar menos" : `Ver todos (${adminsDelEstado.length})`}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-16 text-center">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No se encontraron administradores que coincidan con los criterios de búsqueda.
            </p>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-4xl mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Edit3 className="h-5 w-5 mr-2 text-blue-600" />
                Editar Administrador
              </h2>
              <p className="text-gray-500 mt-1">Actualiza la información del administrador seleccionado</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
                    <input
                      type="text"
                      value={formData.ap_paterno}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ap_paterno: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                    <input
                      type="text"
                      value={formData.ap_materno}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ap_materno: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CURP</label>
                    <input
                      type="text"
                      value={formData.curp_user}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          curp_user: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {modalEliminarAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <X className="h-6 w-6 mr-2 text-red-600" />
                Eliminar Administrador
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <p className="text-sm text-gray-600">
                      {adminEliminar?.nombre} {adminEliminar?.ap_paterno} {adminEliminar?.ap_materno}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CURP</label>
                    <p className="text-sm text-gray-600 font-mono">{adminEliminar?.curp_user}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <p className="text-sm text-gray-600">{adminEliminar?.estado || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <p className="text-sm text-gray-600">
                      {adminEliminar?.role_name === "estadoadmin"
                        ? "Admin Estatal"
                        : adminEliminar?.role_name === "municipioadmin"
                          ? "Admin Municipal"
                          : "Admin Hospital"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente al administrador del sistema y
                  no podrá ser recuperado.
                </p>
                {!botonEliminarHabilitado && (
                  <p className="text-sm text-red-800 mt-2">
                    Por seguridad, el botón de eliminar se habilitará en {tiempoRestante} segundos.
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
                  botonEliminarHabilitado ? "bg-red-600 hover:bg-red-700" : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <X className="h-4 w-4 mr-2" />
                {loadingEliminar
                  ? "Eliminando..."
                  : botonEliminarHabilitado
                    ? "Eliminar Administrador"
                    : `Espere ${tiempoRestante}s...`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Toast */}
      {notificacion && (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 duration-300">
          <div
            className={`
              w-full min-w-[320px] max-w-lg sm:max-w-xl md:max-w-2xl bg-white rounded-lg shadow-lg border-l-4 p-5
              ${notificacion.tipo === "exito" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notificacion.tipo === "exito" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="ml-4 flex-grow break-words">
                <p
                  className={`text-base font-medium ${
                    notificacion.tipo === "exito" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {notificacion.titulo}
                </p>
                <p className={`mt-2 text-sm ${notificacion.tipo === "exito" ? "text-green-700" : "text-red-700"}`}>
                  {notificacion.mensaje}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => setNotificacion(null)}
                  className={`rounded-md inline-flex ${
                    notificacion.tipo === "exito"
                      ? "text-green-400 hover:text-green-600"
                      : "text-red-400 hover:text-red-600"
                  } focus:outline-none`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              className={`mt-3 w-full bg-gray-200 rounded-full h-2 ${
                notificacion.tipo === "exito" ? "bg-green-200" : "bg-red-200"
              }`}
            >
              <div
                className={`h-2 rounded-full ${notificacion.tipo === "exito" ? "bg-green-500" : "bg-red-500"}`}
                style={{
                  width: "100%",
                  animation: `shrink ${notificacion.tipo === "exito" ? "4s" : "5s"} linear forwards`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

export default AdministradorList
