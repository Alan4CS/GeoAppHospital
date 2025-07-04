"use client"

import { useState, useEffect } from "react"
import {
  Hospital,
  MapPin,
  Search,
  Users,
  Settings,
  Trash2,
  X,
  Save,
  User,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Building2,
  UserPlus,
} from "lucide-react"

const EmpleadoList = ({
  empleados: empleadosIniciales,
  busquedaEmpleado,
  setBusquedaEmpleado,
  estadoEmpleadoFiltro,
  setEstadoEmpleadoFiltro,
  onEmpleadosUpdate,
}) => {
  const [empleadosLocales, setEmpleadosLocales] = useState(empleadosIniciales)
  const [mostrarTodosEmpleados, setMostrarTodosEmpleados] = useState({})
  const [mostrarTodosEstados, setMostrarTodosEstados] = useState({})
  const [empleadoEditando, setEmpleadoEditando] = useState(null)
  const [empleadoEliminar, setEmpleadoEliminar] = useState(null)
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(5)
  const [botonEliminarHabilitado, setBotonEliminarHabilitado] = useState(false)
  const [notificacion, setNotificacion] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    ap_paterno: "",
    ap_materno: "",
    telefono: "",
    grupo: "",
    hospital: "",
  })
  const [grupos, setGrupos] = useState([])
  const [hospitales, setHospitales] = useState([])

  // Sincronizar con empleadosIniciales cuando cambien
  useEffect(() => {
    setEmpleadosLocales(empleadosIniciales)
  }, [empleadosIniciales])

  // Función para obtener empleados actualizados del servidor
  const obtenerEmpleadosActualizados = async () => {
    try {
      if (onEmpleadosUpdate) {
        await onEmpleadosUpdate()
      }
      return true
    } catch (error) {
      console.error("Error al obtener empleados:", error)
      return false
    }
  }

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo, titulo, mensaje, duracion = 4000) => {
    setNotificacion({ tipo, titulo, mensaje, duracion })
    setTimeout(() => setNotificacion(null), duracion)
  }

  // Eliminar filtro de roles del renderizado (no mostrar el select de roles)
  // y corregir el filtro de estados para que funcione aunque la búsqueda esté vacía

  const empleadosFiltrados = empleadosLocales.filter((empleado) => {
    const busquedaLimpia = busquedaEmpleado?.toLowerCase().trim() || ""

    // Filtro de búsqueda (nombre o curp)
    let coincideBusqueda = true
    if (busquedaLimpia) {
      const textoCompleto = `${empleado.nombre || ""} ${empleado.ap_paterno || ""} ${empleado.ap_materno || ""} ${empleado.curp_user || ""}`.toLowerCase().trim()
      const terminosBusqueda = busquedaLimpia.split(/\s+/)
      coincideBusqueda = terminosBusqueda.every((termino) => textoCompleto.includes(termino))
    }

    // Filtro por estado (debe funcionar siempre)
    let coincideEstado = true
    if (estadoEmpleadoFiltro && estadoEmpleadoFiltro !== "") {
      coincideEstado = empleado.estado === estadoEmpleadoFiltro
    }

    return coincideBusqueda && coincideEstado
  })

  // Determinar si estamos en modo búsqueda
  const enModoBusqueda = busquedaEmpleado && busquedaEmpleado.trim().length > 0

  // Vista simplificada para búsquedas
  const resultadosBusqueda = enModoBusqueda ? empleadosFiltrados : []

  const empleadosPorEstado = empleadosFiltrados.reduce((acc, empleado) => {
    const estado = empleado.estado || "Sin estado"
    const municipio = empleado.municipio || "Sin municipio"
    const hospital = empleado.hospital || "Sin hospital"
    const grupo = empleado.nombre_grupo || "Sin grupo"

    acc[estado] = acc[estado] || {}
    acc[estado][municipio] = acc[estado][municipio] || {}
    acc[estado][municipio][hospital] = acc[estado][municipio][hospital] || {}
    acc[estado][municipio][hospital][grupo] = acc[estado][municipio][hospital][grupo] || []

    acc[estado][municipio][hospital][grupo].push(empleado)
    return acc
  }, {})

  const handleEditar = async (empleado) => {
    setEmpleadoEditando(empleado)
    setFormData({
      nombre: empleado.nombre || "",
      ap_paterno: empleado.ap_paterno || "",
      ap_materno: empleado.ap_materno || "",
      telefono: empleado.telefono || "",
      grupo: empleado.nombre_grupo || "",
      hospital: empleado.hospital || "",
    })

    // Cargar hospitales SOLO del municipio del empleado
    try {
      if (empleado.id_municipio) {
        const url = `https://geoapphospital.onrender.com/api/superadmin/hospitales-by-municipio?id_municipio=${empleado.id_municipio}`
        const hospitalesResponse = await fetch(url)
        if (hospitalesResponse.ok) {
          const hospitalesData = await hospitalesResponse.json()
          setHospitales(hospitalesData)
        } else {
          setHospitales([])
        }
      } else {
        setHospitales([])
      }
    } catch (error) {
      setHospitales([])
    }

    // Cargar grupos disponibles para el hospital actual
    try {
      if (empleado.id_hospital) {
        const gruposResponse = await fetch(
          `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${empleado.id_hospital}`,
        )
        if (gruposResponse.ok) {
          const gruposData = await gruposResponse.json()
          setGrupos(gruposData)
        }
      }
    } catch (error) {
      setGrupos([])
    }

    setMostrarModalEditar(true)
  }

  const handleHospitalChange = async (e) => {
    const hospitalSeleccionado = e.target.value
    setFormData((prev) => ({ ...prev, hospital: hospitalSeleccionado, grupo: "" }))
    const hospitalObj = hospitales.find((h) => h.nombre_hospital === hospitalSeleccionado)
    if (hospitalObj) {
      try {
        const gruposResponse = await fetch(
          `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${hospitalObj.id_hospital}`,
        )
        if (gruposResponse.ok) {
          const gruposData = await gruposResponse.json()
          setGrupos(gruposData)
        } else {
          setGrupos([])
        }
      } catch (error) {
        setGrupos([])
      }
    } else {
      setGrupos([])
    }
  }

  const handleEliminar = (empleado) => {
    setEmpleadoEliminar(empleado)
    setMostrarModalEliminar(true)
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

  const handleCerrarModalEditar = () => {
    setMostrarModalEditar(false)
    setEmpleadoEditando(null)
    setFormData({
      nombre: "",
      ap_paterno: "",
      ap_materno: "",
      telefono: "",
      grupo: "",
      hospital: "",
    })
  }

  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false)
    setEmpleadoEliminar(null)
    setBotonEliminarHabilitado(false)
    setTiempoRestante(5)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitEditar = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const hospitalSeleccionado = hospitales.find((h) => h.nombre_hospital === formData.hospital)
      const id_hospital = hospitalSeleccionado?.id_hospital || empleadoEditando.id_hospital
      const grupoSeleccionado = grupos.find((g) => g.nombre_grupo === formData.grupo)
      const id_group = grupoSeleccionado?.id_group || empleadoEditando.id_group

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
      }

      const response = await fetch(`https://geoapphospital.onrender.com/api/employees/update-employee`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      await response.json()
      await obtenerEmpleadosActualizados()

      mostrarNotificacion(
        "exito",
        "¡Empleado actualizado!",
        `Los datos de ${formData.nombre} ${formData.ap_paterno} han sido actualizados correctamente.`,
      )

      handleCerrarModalEditar()
    } catch (error) {
      mostrarNotificacion(
        "error",
        "Error al actualizar empleado",
        `No se pudo actualizar el empleado: ${error.message}`,
        5000,
      )
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    setLoadingEliminar(true)

    try {
      const response = await fetch(
        `https://geoapphospital.onrender.com/api/employees/delete-employee/${empleadoEliminar.id_user}`,
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

      await response.json()
      await obtenerEmpleadosActualizados()

      mostrarNotificacion(
        "exito",
        "¡Empleado eliminado!",
        `${empleadoEliminar.nombre} ${empleadoEliminar.ap_paterno} ha sido eliminado del sistema.`,
      )

      handleCerrarModalEliminar()
    } catch (error) {
      console.error("Error al eliminar empleado:", error)
      mostrarNotificacion(
        "error",
        "Error al eliminar empleado",
        `No se pudo eliminar el empleado: ${error.message}`,
        5000,
      )
    } finally {
      setLoadingEliminar(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Empleados registrados</h3>
                <p className="text-sm text-gray-500">
                  {empleadosFiltrados.length} empleado{empleadosFiltrados.length !== 1 ? "s" : ""}
                  {(estadoEmpleadoFiltro) && " filtrados"}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o CURP..."
                  value={busquedaEmpleado || ""}
                  onChange={(e) => setBusquedaEmpleado(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <select
                  value={estadoEmpleadoFiltro || ""}
                  onChange={(e) => setEstadoEmpleadoFiltro(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  {[...new Set(empleadosLocales.map((e) => e.estado))]
                    .filter(Boolean)
                    .sort()
                    .map((estado) => (
                      <option key={`estado-${estado}`} value={estado}>
                        {estado}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {empleadosFiltrados.length > 0 ? (
        <>
          {/* Vista de búsqueda directa */}
          {enModoBusqueda ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Search className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Resultados de búsqueda: "{busquedaEmpleado}"
                    </h4>
                    <p className="text-sm text-gray-500">
                      {resultadosBusqueda.length} empleado{resultadosBusqueda.length !== 1 ? "s" : ""} encontrado
                      {resultadosBusqueda.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Nombre Completo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        CURP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Estado/Municipio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Hospital
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Grupo
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
                    {resultadosBusqueda.map((empleado) => (
                      <tr
                        key={`search-${empleado.id_user}-${empleado.curp_user}`}
                        className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-600 font-mono">{empleado.curp_user}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{empleado.telefono || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">{empleado.estado}</div>
                            <div className="text-xs text-gray-500">{empleado.municipio}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 truncate max-w-xs block">{empleado.hospital}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 truncate max-w-xs block">{empleado.nombre_grupo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            {empleado.role_name || "Empleado"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditar(empleado)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md"
                              title="Editar empleado"
                            >
                              <Settings className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(empleado)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-md"
                              title="Eliminar empleado"
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
            </div>
          ) : (
            /* Vista jerárquica original cuando no hay búsqueda */
            <>
              {/* Secciones por Estado */}
              {Object.entries(empleadosPorEstado)
                .sort()
                .map(([estado, municipios]) => {
                  const totalEmpleadosEstado = Object.values(municipios).reduce(
                    (acc, hospitales) =>
                      acc +
                      Object.values(hospitales).reduce(
                        (acc2, grupos) =>
                          acc2 + Object.values(grupos).reduce((acc3, empleados) => acc3 + empleados.length, 0),
                        0,
                      ),
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
                              {totalEmpleadosEstado} empleado{totalEmpleadosEstado !== 1 ? "s" : ""} en{" "}
                              {Object.keys(municipios).length} municipio
                              {Object.keys(municipios).length !== 1 ? "s" : ""}
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
                              .map(([hospital, grupos]) => (
                                <div key={hospital} className="ml-6">
                                  <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200">
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                                      <Hospital className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h6 className="text-base font-semibold text-emerald-800">Hospital: {hospital}</h6>
                                      <span className="text-sm text-emerald-600 font-medium">
                                        {Object.values(grupos).reduce((acc, empleados) => acc + empleados.length, 0)}{" "}
                                        empleado
                                        {Object.values(grupos).reduce((acc, empleados) => acc + empleados.length, 0) !==
                                        1
                                          ? "s"
                                          : ""}{" "}
                                        en {Object.keys(grupos).length} grupo
                                        {Object.keys(grupos).length !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    {Object.entries(grupos)
                                      .sort()
                                      .map(([grupo, empleadosGrupo]) => {
                                        const key = `${estado}-${municipio}-${hospital}-${grupo}`
                                        const mostrarTodosEmpleadosGrupo = mostrarTodosEmpleados[key] || false
                                        const empleadosVisibles = mostrarTodosEmpleadosGrupo
                                          ? empleadosGrupo
                                          : empleadosGrupo.slice(0, 5)

                                        return (
                                          <div
                                            key={key}
                                            className="bg-gradient-to-r from-white to-gray-50/50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-200"
                                          >
                                            <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                              <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                                                  <Users className="h-3 w-3 text-emerald-600" />
                                                </div>
                                                <div className="flex-1">
                                                  <h3 className="font-semibold text-gray-900">Grupo: {grupo}</h3>
                                                  <span className="text-xs text-gray-500">
                                                    {empleadosGrupo.length} empleado
                                                    {empleadosGrupo.length !== 1 ? "s" : ""}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="overflow-x-auto">
                                              <table className="w-full">
                                                <thead>
                                                  <tr className="border-b border-gray-100">
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                      Nombre
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                      Ap. Paterno
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                      Ap. Materno
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                      CURP
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                      Teléfono
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                      Rol
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-48">
                                                      Acciones
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {empleadosVisibles.map((empleado) => (
                                                    <tr
                                                      key={`${empleado.id_user}-${empleado.curp_user}`}
                                                      className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors"
                                                    >
                                                      <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900 truncate max-w-xs">
                                                          {empleado.nombre}
                                                        </div>
                                                      </td>
                                                      <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-600">
                                                          {empleado.ap_paterno}
                                                        </span>
                                                      </td>
                                                      <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-600">
                                                          {empleado.ap_materno}
                                                        </span>
                                                      </td>
                                                      <td className="px-4 py-3">
                                                        <span className="text-xs text-gray-600 font-mono">
                                                          {empleado.curp_user}
                                                        </span>
                                                      </td>
                                                      <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-600">
                                                          {empleado.telefono || "—"}
                                                        </span>
                                                      </td>
                                                      <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                          {empleado.role_name || "Empleado"}
                                                        </span>
                                                      </td>
                                                      <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                          <button
                                                            onClick={() => handleEditar(empleado)}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all duration-200 hover:shadow-md"
                                                            title="Editar empleado"
                                                          >
                                                            <Settings className="h-4 w-4" />
                                                            Editar
                                                          </button>
                                                          <button
                                                            onClick={() => handleEliminar(empleado)}
                                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-md"
                                                            title="Eliminar empleado"
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

                                            {empleadosGrupo.length > 5 && (
                                              <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-center">
                                                <button
                                                  onClick={() =>
                                                    setMostrarTodosEmpleados((prev) => ({
                                                      ...prev,
                                                      [key]: !prev[key],
                                                    }))
                                                  }
                                                  className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                                                >
                                                  {mostrarTodosEmpleadosGrupo
                                                    ? "Mostrar menos"
                                                    : `Ver todos (${empleadosGrupo.length})`}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
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
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-16 text-center">
            <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {estadoEmpleadoFiltro
                ? "No se encontraron empleados que coincidan con los filtros aplicados"
                : busquedaEmpleado
                  ? "No se encontraron empleados que coincidan con la búsqueda"
                  : "No hay empleados registrados"}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-emerald-600" />
                Editar Empleado
              </h2>
              <p className="text-gray-500 mt-1">Actualiza la información del empleado seleccionado</p>
            </div>

            <form onSubmit={handleSubmitEditar} className="p-6 space-y-6">
              {/* Información no editable */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Información de referencia (No editable)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CURP</label>
                    <p className="text-sm text-gray-800 font-mono bg-white px-2 py-1 rounded border">
                      {empleadoEditando?.curp_user}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <p className="text-sm text-gray-800 bg-white px-2 py-1 rounded border">
                      {empleadoEditando?.estado}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Municipio</label>
                    <p className="text-sm text-gray-800 bg-white px-2 py-1 rounded border">
                      {empleadoEditando?.municipio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Campos editables - Asignación */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-emerald-800 mb-4 flex items-center">
                  <Hospital className="h-4 w-4 mr-2" />
                  Asignación de Hospital y Grupo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      <Hospital className="h-4 w-4 inline mr-1" />
                      Hospital *
                    </label>
                    <select
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleHospitalChange}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                    <label className="block text-sm font-medium text-emerald-800 mb-2">
                      <Users className="h-4 w-4 inline mr-1" />
                      Grupo
                    </label>
                    <select
                      name="grupo"
                      value={formData.grupo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nombre del empleado"
                    required
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Apellido paterno"
                    required
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Apellido materno"
                    required
                  />
                </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCerrarModalEditar}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Guardando..." : "Actualizar Empleado"}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <p className="text-sm text-gray-600">
                      {empleadoEliminar?.nombre} {empleadoEliminar?.ap_paterno} {empleadoEliminar?.ap_materno}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CURP</label>
                    <p className="text-sm text-gray-600 font-mono">{empleadoEliminar?.curp_user}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <p className="text-sm text-gray-600">{empleadoEliminar?.hospital}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                    <p className="text-sm text-gray-600">{empleadoEliminar?.nombre_grupo}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente al empleado del sistema y no
                  podrá ser recuperado.
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

export default EmpleadoList
