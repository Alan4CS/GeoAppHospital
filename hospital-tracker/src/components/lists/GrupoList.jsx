"use client"

import { useState, useEffect } from "react"
import {
  X,
  Save,
  Building2,
  FileText,
  MapPin,
  Trash2,
  Edit3,
  Hospital,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react"

const GrupoList = ({ grupos, onGuardar, hospitales = [] }) => {
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [grupoEditando, setGrupoEditando] = useState(null)
  const [grupoEliminar, setGrupoEliminar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(5)
  const [timerActivo, setTimerActivo] = useState(false)
  const [formData, setFormData] = useState({
    nombre_grupo: "",
    descripcion_grupo: "",
  })
  const [busquedaGrupo, setBusquedaGrupo] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const [mostrarTodosEstados, setMostrarTodosEstados] = useState({})
  const [notificacion, setNotificacion] = useState(null)

  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotificacion({ tipo, titulo, mensaje })
    setTimeout(() => setNotificacion(null), tipo === "exito" ? 4000 : 5000)
  }

  const handleEditar = (grupo) => {
    console.log("Grupo seleccionado para editar:", grupo)
    setGrupoEditando(grupo)
    setFormData({
      nombre_grupo: grupo.nombre_grupo || "",
      descripcion_grupo: grupo.descripcion_group || "",
    })
    setMostrarModal(true)
  }

  const handleEliminar = (grupo) => {
    setGrupoEliminar(grupo)
    setMostrarModalEliminar(true)
    setTiempoRestante(5)
    setTimerActivo(true)
  }

  const handleCerrarModal = () => {
    setMostrarModal(false)
    setGrupoEditando(null)
    setFormData({
      nombre_grupo: "",
      descripcion_grupo: "",
    })
  }

  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false)
    setGrupoEliminar(null)
    setTimerActivo(false)
    setTiempoRestante(5)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let id_hospital = null

      if (hospitales && hospitales.length > 0) {
        const hospitalEncontrado = hospitales.find(
          (h) => h.nombre_hospital === grupoEditando.nombre_hospital || h.nombre === grupoEditando.nombre_hospital,
        )
        id_hospital = hospitalEncontrado?.id_hospital
        console.log("Hospital encontrado:", hospitalEncontrado)
      }

      if (!id_hospital) {
        try {
          const hospitalResponse = await fetch("https://geoapphospital.onrender.com/api/superadmin/hospitals")
          const hospitalData = await hospitalResponse.json()
          const hospitalEncontrado = hospitalData.find((h) => h.nombre_hospital === grupoEditando.nombre_hospital)
          id_hospital = hospitalEncontrado?.id_hospital
          console.log("Hospital encontrado en consulta adicional:", hospitalEncontrado)
        } catch (error) {
          console.error("Error al buscar hospital:", error)
        }
      }

      if (!id_hospital) {
        throw new Error("No se pudo encontrar el ID del hospital")
      }

      const body = {
        id_group: grupoEditando.id_group,
        nombre_grupo: formData.nombre_grupo,
        id_hospital: id_hospital,
        descripcion_grupo: formData.descripcion_grupo,
      }

      console.log("Enviando datos:", body)

      const response = await fetch(`https://geoapphospital.onrender.com/api/groups/update-groups`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Respuesta del servidor:", data)

      mostrarNotificacion(
        "exito",
        "¡Grupo actualizado!",
        `El grupo "${formData.nombre_grupo}" ha sido actualizado correctamente.`,
      )

      handleCerrarModal()

      if (onGuardar) {
        onGuardar()
      }
    } catch (error) {
      console.error("Error al actualizar grupo:", error)
      mostrarNotificacion("error", "Error al actualizar", `No se pudo actualizar el grupo: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    setLoadingEliminar(true)

    try {
      const response = await fetch(
        `https://geoapphospital.onrender.com/api/groups/delete-groups/${grupoEliminar.id_group}`,
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
        "¡Grupo eliminado!",
        `El grupo "${grupoEliminar?.nombre_grupo}" ha sido eliminado correctamente.`,
      )

      handleCerrarModalEliminar()

      if (onGuardar) {
        onGuardar()
      }
    } catch (error) {
      console.error("Error al eliminar grupo:", error)
      mostrarNotificacion("error", "Error al eliminar", `No se pudo eliminar el grupo: ${error.message}`)
    } finally {
      setLoadingEliminar(false)
    }
  }

  useEffect(() => {
    let intervalo
    if (timerActivo && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => prev - 1)
      }, 1000)
    } else if (tiempoRestante === 0) {
      setTimerActivo(false)
    }
    return () => clearInterval(intervalo)
  }, [timerActivo, tiempoRestante])

  const gruposFiltrados = grupos.filter((grupo) => {
    const busquedaLimpia = busquedaGrupo.toLowerCase().trim()

    if (!busquedaLimpia) return true

    const textoCompleto = `${grupo.nombre_grupo || ""} ${grupo.descripcion_group || ""} ${grupo.nombre_hospital || ""}`
      .toLowerCase()
      .trim()

    const terminosBusqueda = busquedaLimpia.split(/\s+/)

    const coincideBusqueda = terminosBusqueda.every((termino) => textoCompleto.includes(termino))

    const coincideEstado = !estadoFiltro || grupo.nombre_estado === estadoFiltro

    return coincideBusqueda && coincideEstado
  })

  const gruposPorEstado = gruposFiltrados.reduce((acc, grupo) => {
    const estado = grupo.nombre_estado || "Sin estado"
    const municipio = grupo.nombre_municipio || "Sin municipio"
    const hospital = grupo.nombre_hospital || "Sin hospital"

    acc[estado] = acc[estado] || {}
    acc[estado][municipio] = acc[estado][municipio] || {}
    acc[estado][municipio][hospital] = acc[estado][municipio][hospital] || []
    acc[estado][municipio][hospital].push(grupo)

    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Grupos registrados</h3>
                <p className="text-sm text-gray-500">
                  {gruposFiltrados.length} grupo{gruposFiltrados.length !== 1 ? "s" : ""}
                  {estadoFiltro && ` en ${estadoFiltro}`}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar grupo..."
                  value={busquedaGrupo}
                  onChange={(e) => setBusquedaGrupo(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  {[...new Set(grupos.map((g) => g.nombre_estado))]
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
        </div>
      </div>

      {gruposFiltrados.length > 0 ? (
        <>
          {/* Secciones por Estado */}
          {Object.entries(gruposPorEstado)
            .sort()
            .map(([estado, municipios]) => {
              const totalGruposEstado = Object.values(municipios).reduce(
                (acc, hospitales) => acc + Object.values(hospitales).reduce((acc2, grupos) => acc2 + grupos.length, 0),
                0,
              )
              const mostrarTodos = mostrarTodosEstados[estado] || false
              const municipiosEntries = Object.entries(municipios).sort()
              const municipiosVisibles = mostrarTodos ? municipiosEntries : municipiosEntries.slice(0, 2)

              return (
                <div key={estado} className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Estado: {estado}</h4>
                        <p className="text-sm text-gray-500">
                          {totalGruposEstado} grupo{totalGruposEstado !== 1 ? "s" : ""} en{" "}
                          {Object.keys(municipios).length} municipio{Object.keys(municipios).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {municipiosVisibles.map(([municipio, hospitales]) => (
                      <div key={municipio} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                          <Building2 className="h-4 w-4 text-purple-600" />
                          <h5 className="text-md font-medium text-gray-700">Municipio: {municipio}</h5>
                        </div>

                        {Object.entries(hospitales)
                          .sort()
                          .map(([hospital, gruposHospital]) => (
                            <div key={hospital} className="ml-6">
                              <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                                  <Hospital className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                  <h6 className="text-base font-semibold text-emerald-800">Hospital: {hospital}</h6>
                                  <span className="text-sm text-emerald-600 font-medium">
                                    {gruposHospital.length} grupo{gruposHospital.length !== 1 ? "s" : ""} registrado
                                    {gruposHospital.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {gruposHospital.map((grupo) => (
                                  <div
                                    key={grupo.id_group}
                                    className="bg-gradient-to-r from-white to-gray-50/50 border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-purple-200 transition-all duration-200 group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-colors">
                                            <Users className="h-5 w-5 text-purple-600" />
                                          </div>
                                          <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
                                              {grupo.nombre_grupo}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                                Activo
                                              </span>
                                              <span className="text-xs text-gray-400 font-mono">#{grupo.id_group}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="ml-13">
                                          <p className="text-gray-600 text-sm leading-relaxed">
                                            {grupo.descripcion_group || "Sin descripción disponible"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => handleEditar(grupo)}
                                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Editar grupo"
                                        >
                                          <Settings className="h-4 w-4" />
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleEliminar(grupo)}
                                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-md"
                                          title="Eliminar grupo"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>

                  {municipiosEntries.length > 2 && (
                    <div className="px-6 py-4 border-t border-gray-100 text-center">
                      <button
                        onClick={() => {
                          setMostrarTodosEstados({
                            ...mostrarTodosEstados,
                            [estado]: !mostrarTodos,
                          })
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      >
                        {mostrarTodos ? "Mostrar menos" : `Ver todos los municipios (${municipiosEntries.length})`}
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
              {estadoFiltro
                ? `No hay grupos en ${estadoFiltro}`
                : busquedaGrupo
                  ? "No se encontraron grupos que coincidan con la búsqueda"
                  : "No hay grupos registrados"}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Edit3 className="h-5 w-5 mr-2 text-purple-600" />
                Editar Grupo
              </h2>
              <p className="text-gray-500 mt-1">Actualiza la información del grupo seleccionado</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Hospital Asignado
                </label>
                <p className="text-sm text-gray-600">
                  {grupoEditando?.nombre_hospital} - {grupoEditando?.nombre_estado}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    name="nombre_grupo"
                    value={formData.nombre_grupo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Limpieza turno matutino"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Descripción del Grupo *
                  </label>
                  <textarea
                    name="descripcion_grupo"
                    value={formData.descripcion_grupo}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Encargados del área de limpieza en turno matutino"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCerrarModal}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Guardando..." : "Actualizar Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Trash2 className="h-6 w-6 mr-2 text-red-600" />
                Eliminar Grupo
              </h2>
              <button
                onClick={handleCerrarModalEliminar}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar el grupo{" "}
                <span className="font-semibold text-gray-800">"{grupoEliminar?.nombre_grupo}"</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará el grupo y actualizará todos los usuarios
                  asociados. Esta acción no se puede deshacer.
                </p>
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
                disabled={loadingEliminar || tiempoRestante > 0}
                className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors ${
                  tiempoRestante > 0 || loadingEliminar
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loadingEliminar
                  ? "Eliminando..."
                  : tiempoRestante > 0
                    ? `Espere ${tiempoRestante}s...`
                    : "Eliminar Grupo"}
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

export default GrupoList
