"use client"

import { useState, useEffect } from "react"
import { Filter, Layers, MapPin, Users, Building2, MapIcon, Home } from "lucide-react"

export default function MonitoreoMap() {
  const [nivelVisualizacion, setNivelVisualizacion] = useState("pais")
  const [usuariosConectados, setUsuariosConectados] = useState([])
  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroMunicipio, setFiltroMunicipio] = useState("")
  const [filtroHospital, setFiltroHospital] = useState("")
  const [filtroGrupo, setFiltroGrupo] = useState("")
  const [estados, setEstados] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [hospitales, setHospitales] = useState([])
  const [grupos, setGrupos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Simular carga de datos
  useEffect(() => {
    // En una implementación real, estos datos vendrían de una API
    const cargarDatos = () => {
      setCargando(true)

      // Simular estados
      const estadosEjemplo = ["Aguascalientes", "Baja California", "Ciudad de México", "Jalisco", "Nuevo León"]

      // Simular municipios
      const municipiosEjemplo = [
        { id: 1, nombre: "Guadalajara", estado: "Jalisco" },
        { id: 2, nombre: "Zapopan", estado: "Jalisco" },
        { id: 3, nombre: "Monterrey", estado: "Nuevo León" },
        { id: 4, nombre: "San Pedro", estado: "Nuevo León" },
        { id: 5, nombre: "Benito Juárez", estado: "Ciudad de México" },
        { id: 6, nombre: "Miguel Hidalgo", estado: "Ciudad de México" },
      ]

      // Simular hospitales
      const hospitalesEjemplo = [
        { id: 1, nombre: "Hospital General Regional #1", estado: "Ciudad de México", municipio: "Benito Juárez" },
        { id: 2, nombre: "Hospital General de Zona #48", estado: "Jalisco", municipio: "Guadalajara" },
        { id: 3, nombre: "Hospital Regional #33", estado: "Nuevo León", municipio: "Monterrey" },
      ]

      // Simular grupos
      const gruposEjemplo = [
        { id: 1, nombre: "Grupo A - Urgencias", hospital_id: 1 },
        { id: 2, nombre: "Grupo B - Pediatría", hospital_id: 1 },
        { id: 3, nombre: "Grupo C - Cirugía", hospital_id: 2 },
      ]

      // Simular usuarios conectados
      const usuariosEjemplo = [
        {
          id: 1,
          nombre: "Ana García",
          estado: "Ciudad de México",
          municipio: "Benito Juárez",
          hospital: "Hospital General Regional #1",
          grupo: "Grupo A - Urgencias",
          lat: 19.4326,
          lng: -99.1332,
          ultimaConexion: "2023-10-15T14:30:00",
        },
        {
          id: 2,
          nombre: "Carlos Mendoza",
          estado: "Ciudad de México",
          municipio: "Benito Juárez",
          hospital: "Hospital General Regional #1",
          grupo: "Grupo A - Urgencias",
          lat: 19.4361,
          lng: -99.1478,
          ultimaConexion: "2023-10-15T15:45:00",
        },
        {
          id: 3,
          nombre: "Laura Sánchez",
          estado: "Jalisco",
          municipio: "Guadalajara",
          hospital: "Hospital General de Zona #48",
          grupo: "Grupo C - Cirugía",
          lat: 20.6597,
          lng: -103.3496,
          ultimaConexion: "2023-10-15T12:10:00",
        },
        {
          id: 4,
          nombre: "Roberto Gómez",
          estado: "Nuevo León",
          municipio: "Monterrey",
          hospital: "Hospital Regional #33",
          grupo: null,
          lat: 25.6866,
          lng: -100.3161,
          ultimaConexion: "2023-10-15T10:30:00",
        },
      ]

      setEstados(estadosEjemplo)
      setMunicipios(municipiosEjemplo)
      setHospitales(hospitalesEjemplo)
      setGrupos(gruposEjemplo)
      setUsuariosConectados(usuariosEjemplo)

      setCargando(false)
    }

    cargarDatos()
  }, [])

  // Filtrar municipios según el estado seleccionado
  const municipiosFiltrados = filtroEstado ? municipios.filter((m) => m.estado === filtroEstado) : municipios

  // Filtrar hospitales según el estado y municipio seleccionados
  const hospitalesFiltrados = hospitales.filter((h) => {
    if (filtroEstado && h.estado !== filtroEstado) return false
    if (filtroMunicipio && h.municipio !== filtroMunicipio) return false
    return true
  })

  // Filtrar grupos según el hospital seleccionado
  const gruposFiltrados = filtroHospital
    ? grupos.filter((g) => {
        const hospital = hospitales.find((h) => h.nombre === filtroHospital)
        return hospital && g.hospital_id === hospital.id
      })
    : grupos

  // Filtrar usuarios según los criterios seleccionados
  const usuariosFiltrados = usuariosConectados.filter((u) => {
    if (filtroEstado && u.estado !== filtroEstado) return false
    if (filtroMunicipio && u.municipio !== filtroMunicipio) return false
    if (filtroHospital && u.hospital !== filtroHospital) return false
    if (filtroGrupo && u.grupo !== filtroGrupo) return false
    return true
  })

  // Función para formatear la fecha de última conexión
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "N/A"
    const fecha = new Date(fechaStr)
    return fecha.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroEstado("")
    setFiltroMunicipio("")
    setFiltroHospital("")
    setFiltroGrupo("")
  }

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <MapIcon className="h-5 w-5 mr-2 text-emerald-600" />
          Monitoreo de Usuarios
        </h3>
        <p className="text-gray-500 mt-1">Visualiza la ubicación de los usuarios conectados en diferentes niveles</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de filtros */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                <Filter className="h-4 w-4 mr-1 text-emerald-600" />
                Filtros de visualización
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de visualización</label>
                  <select
                    value={nivelVisualizacion}
                    onChange={(e) => setNivelVisualizacion(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 text-sm"
                  >
                    <option value="pais">País</option>
                    <option value="estado">Estado</option>
                    <option value="municipio">Municipio</option>
                    <option value="hospital">Hospital</option>
                    <option value="grupo">Grupo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value)
                      setFiltroMunicipio("")
                      setFiltroHospital("")
                      setFiltroGrupo("")
                    }}
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 text-sm"
                  >
                    <option value="">Todos los estados</option>
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                {filtroEstado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                    <select
                      value={filtroMunicipio}
                      onChange={(e) => {
                        setFiltroMunicipio(e.target.value)
                        setFiltroHospital("")
                        setFiltroGrupo("")
                      }}
                      className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 text-sm"
                    >
                      <option value="">Todos los municipios</option>
                      {municipiosFiltrados.map((municipio) => (
                        <option key={municipio.id} value={municipio.nombre}>
                          {municipio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(filtroEstado || filtroMunicipio) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <select
                      value={filtroHospital}
                      onChange={(e) => {
                        setFiltroHospital(e.target.value)
                        setFiltroGrupo("")
                      }}
                      className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 text-sm"
                    >
                      <option value="">Todos los hospitales</option>
                      {hospitalesFiltrados.map((hospital) => (
                        <option key={hospital.id} value={hospital.nombre}>
                          {hospital.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filtroHospital && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                    <select
                      value={filtroGrupo}
                      onChange={(e) => setFiltroGrupo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300 text-sm"
                    >
                      <option value="">Todos los grupos</option>
                      {gruposFiltrados.map((grupo) => (
                        <option key={grupo.id} value={grupo.nombre}>
                          {grupo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                <Layers className="h-4 w-4 mr-1 text-emerald-600" />
                Capas del mapa
              </h4>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mostrarEstados"
                    checked={true}
                    readOnly
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mostrarEstados" className="ml-2 block text-sm text-gray-700">
                    Mostrar límites de estados
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mostrarMunicipios"
                    checked={nivelVisualizacion !== "pais"}
                    readOnly
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mostrarMunicipios" className="ml-2 block text-sm text-gray-700">
                    Mostrar límites de municipios
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mostrarHospitales"
                    checked={nivelVisualizacion !== "pais" && nivelVisualizacion !== "estado"}
                    readOnly
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mostrarHospitales" className="ml-2 block text-sm text-gray-700">
                    Mostrar hospitales
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="mostrarUsuarios"
                    checked={true}
                    readOnly
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="mostrarUsuarios" className="ml-2 block text-sm text-gray-700">
                    Mostrar usuarios conectados
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="text-sm font-medium text-emerald-800 mb-2">Resumen</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Usuarios conectados:
                  </span>
                  <span className="font-medium">{usuariosFiltrados.length}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    Hospitales:
                  </span>
                  <span className="font-medium">{hospitalesFiltrados.length}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-700 flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    Estados:
                  </span>
                  <span className="font-medium">{filtroEstado ? 1 : estados.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa y lista de usuarios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa */}
            <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-96 relative">
                {cargando ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Mapa interactivo</p>
                      <p className="text-xs text-gray-400 mt-1">
                        (En una implementación real, aquí se mostraría un mapa con la ubicación de los usuarios)
                      </p>
                    </div>
                  </div>
                )}

                {/* Marcadores de ejemplo */}
                {!cargando &&
                  usuariosFiltrados.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${Math.random() * 80 + 10}%`,
                        top: `${Math.random() * 80 + 10}%`,
                      }}
                    >
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">
                        {usuario.nombre.charAt(0)}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>
                    Nivel: <span className="font-medium text-gray-700 capitalize">{nivelVisualizacion}</span>
                  </div>
                  <div>
                    {filtroEstado && (
                      <span className="ml-2">
                        Estado: <span className="font-medium text-gray-700">{filtroEstado}</span>
                      </span>
                    )}
                    {filtroMunicipio && (
                      <span className="ml-2">
                        Municipio: <span className="font-medium text-gray-700">{filtroMunicipio}</span>
                      </span>
                    )}
                    {filtroHospital && (
                      <span className="ml-2">
                        Hospital: <span className="font-medium text-gray-700">{filtroHospital}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-emerald-600" />
                  Usuarios conectados ({usuariosFiltrados.length})
                </h4>
              </div>

              <div className="overflow-x-auto" style={{ maxHeight: "300px" }}>
                {usuariosFiltrados.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hospital
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grupo
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Última conexión
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50 text-sm">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                                {usuario.nombre.charAt(0)}
                              </div>
                              <div className="font-medium text-gray-900">{usuario.nombre}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span>
                                {usuario.municipio}, {usuario.estado}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{usuario.hospital}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {usuario.grupo ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">
                                {usuario.grupo}
                              </span>
                            ) : (
                              <span className="text-gray-400">Sin grupo</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {formatearFecha(usuario.ultimaConexion)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No hay usuarios conectados que coincidan con los filtros seleccionados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}