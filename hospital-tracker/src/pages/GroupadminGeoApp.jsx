import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Hospital,
  LogOut,
  MapPin,
  Plus,
  Search,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import GroupLeaderStatsCard from "../components/grupo/GroupLeaderStatsCard"
import GroupMemberForm from "../components/grupo/GroupMemberForm"

export default function GroupLeaderDashboard() {
  const [activeTab, setActiveTab] = useState("miembros")
  const [mostrarFormularioMiembro, setMostrarFormularioMiembro] = useState(false)
  const [miembros, setMiembros] = useState([])
  const [grupoInfo, setGrupoInfo] = useState(null)
  const [hospitalInfo, setHospitalInfo] = useState(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [nombreFiltro, setNombreFiltro] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [vistaDetalle, setVistaDetalle] = useState(false)
  const [miembroDetalle, setMiembroDetalle] = useState(null)
  const navigate = useNavigate()
  const { setIsAuthenticated } = useAuth()

  const miembrosPorPagina = 10

  // Obtener información del grupo y miembros
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Obtener el ID del usuario del localStorage
        const userId = localStorage.getItem("userId")

        if (!userId) {
          console.error("No se encontró ID de usuario en localStorage")
          setIsLoading(false)
          return
        }

        // En una implementación real, estas serían llamadas a tu API
        // Simulación de datos del grupo
        const mockGrupo = {
          id: 1,
          nombre: "Grupo A - Urgencias",
          descripcion: "Personal de atención en urgencias",
          fechaCreacion: "2023-05-15",
          totalMiembros: 12,
          hospital: {
            id: 1,
            nombre: "Hospital General Regional #42",
          },
        }
        setGrupoInfo(mockGrupo)

        // Simulación de datos del hospital
        const mockHospital = {
          id: 1,
          nombre: "Hospital General Regional #42",
          direccion: "Av. Insurgentes Sur 1234, Ciudad de México",
          tipo: "HOSPITAL",
          estado: "Ciudad de México",
          geocerca: {
            lat: 19.4326,
            lng: -99.1332,
            radio: 500,
          },
        }
        setHospitalInfo(mockHospital)

        // Simulación de datos de miembros
        const mockMiembros = [
          {
            id: 1,
            nombre: "Ana García",
            curp: "GARA900517MDFNRN09",
            telefono: "5512345678",
            estado: "Activo",
            ultimaUbicacion: { lat: 19.4326, lng: -99.1332 },
            horaEntrada: "08:15",
            horaSalida: "16:30",
            enGeocerca: true,
            fechaRegistro: "2023-05-20",
            ultimaActividad: "2023-10-15T14:30:00",
          },
          {
            id: 2,
            nombre: "Pedro Martínez",
            curp: "MARP880612HDFNRL03",
            telefono: "5587654321",
            estado: "Activo",
            ultimaUbicacion: { lat: 19.4361, lng: -99.1478 },
            horaEntrada: "09:00",
            horaSalida: "17:00",
            enGeocerca: true,
            fechaRegistro: "2023-06-10",
            ultimaActividad: "2023-10-15T15:45:00",
          },
          {
            id: 3,
            nombre: "Laura Sánchez",
            curp: "SARL910823MDFNCR07",
            telefono: "5523456789",
            estado: "Inactivo",
            ultimaUbicacion: { lat: 19.415, lng: -99.16 },
            horaEntrada: "08:30",
            horaSalida: "16:45",
            enGeocerca: false,
            fechaRegistro: "2023-05-25",
            ultimaActividad: "2023-10-10T09:20:00",
          },
          {
            id: 4,
            nombre: "Roberto Gómez",
            curp: "GORB850415HDFMRB09",
            telefono: "5534567890",
            estado: "Activo",
            ultimaUbicacion: { lat: 19.428, lng: -99.145 },
            horaEntrada: "07:45",
            horaSalida: "15:30",
            enGeocerca: true,
            fechaRegistro: "2023-07-05",
            ultimaActividad: "2023-10-15T12:10:00",
          },
          {
            id: 5,
            nombre: "María López",
            curp: "LOMA870623MDFPRR05",
            telefono: "5545678901",
            estado: "Activo",
            ultimaUbicacion: { lat: 19.422, lng: -99.138 },
            horaEntrada: "08:00",
            horaSalida: "16:00",
            enGeocerca: true,
            fechaRegistro: "2023-06-15",
            ultimaActividad: "2023-10-15T10:30:00",
          },
          {
            id: 6,
            nombre: "Juan Pérez",
            curp: "PERJ900112HDFRRN01",
            telefono: "5556789012",
            estado: "Inactivo",
            ultimaUbicacion: { lat: 19.435, lng: -99.155 },
            horaEntrada: "09:15",
            horaSalida: "17:15",
            enGeocerca: false,
            fechaRegistro: "2023-05-30",
            ultimaActividad: "2023-10-05T14:20:00",
          },
        ]
        setMiembros(mockMiembros)

        setIsLoading(false)
      } catch (error) {
        console.error("Error al obtener datos:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleMostrarFormularioMiembro = () => {
    setMostrarFormularioMiembro(true)
  }

  const handleInicio = () => {
    setMostrarFormularioMiembro(false)
    setVistaDetalle(false)
    setMiembroDetalle(null)
  }

  // Manejador para guardar un nuevo miembro
  const handleGuardarMiembro = (nuevoMiembro) => {
    // Crear nuevo miembro
    const nuevoId = Math.max(...miembros.map((m) => m.id), 0) + 1
    const fechaActual = new Date().toISOString().split("T")[0]

    setMiembros([
      ...miembros,
      {
        id: nuevoId,
        ...nuevoMiembro,
        estado: "Activo",
        ultimaUbicacion: { lat: 0, lng: 0 },
        horaEntrada: "00:00",
        horaSalida: "00:00",
        enGeocerca: false,
        fechaRegistro: fechaActual,
        ultimaActividad: new Date().toISOString(),
      },
    ])

    // Actualizar el contador de miembros en el grupo
    if (grupoInfo) {
      setGrupoInfo({
        ...grupoInfo,
        totalMiembros: grupoInfo.totalMiembros + 1,
      })
    }

    setMostrarFormularioMiembro(false)
  }

  const handleVerDetalle = (miembro) => {
    setMiembroDetalle(miembro)
    setVistaDetalle(true)
  }

  // FILTRO y PAGINADO para miembros
  const miembrosFiltrados = nombreFiltro
    ? miembros.filter((m) => m.nombre.toLowerCase().includes(nombreFiltro.toLowerCase()))
    : miembros

  const indexInicioMiembros = (paginaActual - 1) * miembrosPorPagina
  const indexFinMiembros = indexInicioMiembros + miembrosPorPagina
  const miembrosPagina = miembrosFiltrados.slice(indexInicioMiembros, indexFinMiembros)

  const totalPaginasMiembros = Math.ceil(miembrosFiltrados.length / miembrosPorPagina)

  // Estadísticas para las tarjetas
  const estadisticas = {
    totalMiembros: miembros.length,
    miembrosActivos: miembros.filter((m) => m.estado === "Activo").length,
    miembrosFueraGeocerca: miembros.filter((m) => !m.enGeocerca && m.estado === "Activo").length,
    porcentajeAsistencia:
      Math.round((miembros.filter((m) => m.estado === "Activo").length / miembros.length) * 100) || 0,
  }

  // Formatear fecha para mostrar
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

  // Calcular tiempo transcurrido desde la última actividad
  const tiempoTranscurrido = (fechaStr) => {
    if (!fechaStr) return "N/A"

    const fecha = new Date(fechaStr)
    const ahora = new Date()
    const diferencia = ahora - fecha

    const minutos = Math.floor(diferencia / (1000 * 60))
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (dias > 0) return `${dias} día${dias > 1 ? "s" : ""}`
    if (horas > 0) return `${horas} hora${horas > 1 ? "s" : ""}`
    return `${minutos} minuto${minutos > 1 ? "s" : ""}`
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-teal-800 to-teal-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen fixed`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}>
            <Hospital className="h-8 w-8" />
            <h1 className={`ml-2 font-bold text-xl ${!sidebarOpen && "hidden"}`}>MediGestión</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1 rounded-full hover:bg-teal-700"
          >
            <ChevronRight className={`h-5 w-5 transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Perfil de usuario */}
        <div className={`mt-2 px-4 py-3 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <div className={`flex items-center ${!sidebarOpen ? "flex-col" : ""}`}>
            <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="font-medium text-sm">Líder de Grupo</p>
                <p className="text-xs text-teal-200">{grupoInfo?.nombre || "Cargando..."}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col flex-1">
          <button
            onClick={() => {
              handleInicio()
              setActiveTab("miembros")
            }}
            className={`flex items-center py-3 px-4 hover:bg-teal-700 ${
              !mostrarFormularioMiembro && !vistaDetalle && activeTab === "miembros" ? "bg-teal-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Users className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Miembros</span>}
          </button>

          <button
            onClick={() => {
              handleInicio()
              setActiveTab("monitoreo")
            }}
            className={`flex items-center py-3 px-4 hover:bg-teal-700 ${
              !mostrarFormularioMiembro && !vistaDetalle && activeTab === "monitoreo" ? "bg-teal-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Activity className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Monitoreo</span>}
          </button>

          <button
            onClick={handleMostrarFormularioMiembro}
            className={`flex items-center py-3 px-4 hover:bg-teal-700 ${
              mostrarFormularioMiembro ? "bg-teal-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <UserPlus className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Agregar Miembro</span>}
          </button>

          <div className="mt-auto">
            <button
              onClick={() => {
                localStorage.removeItem("isAuthenticated")
                localStorage.removeItem("userRole")
                localStorage.removeItem("userId")
                setIsAuthenticated(false)
                navigate("/")
              }}
              className={`flex items-center py-3 px-4 hover:bg-red-700 text-red-100 ${
                !sidebarOpen ? "justify-center" : ""
              }`}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300 ease-in-out`}>
        {/* HEADER */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {mostrarFormularioMiembro
                ? "Agregar Nuevo Miembro"
                : vistaDetalle
                  ? "Detalle de Miembro"
                  : activeTab === "miembros"
                    ? `Miembros de ${grupoInfo?.nombre || "..."}`
                    : "Monitoreo de Actividad"}
            </h1>
            <div className="flex space-x-2">
              {!mostrarFormularioMiembro && !vistaDetalle && (
                <>
                  {activeTab === "miembros" && (
                    <>
                      <div className="relative">
                        <input
                          type="search"
                          placeholder="Buscar miembro..."
                          className="px-4 py-2 border rounded-lg"
                          value={nombreFiltro}
                          onChange={(e) => setNombreFiltro(e.target.value)}
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      <button
                        onClick={handleMostrarFormularioMiembro}
                        className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Miembro
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            <>
              {/* TARJETAS DE ESTADÍSTICAS */}
              {!mostrarFormularioMiembro && !vistaDetalle && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <GroupLeaderStatsCard
                    title="Total Miembros"
                    value={estadisticas.totalMiembros}
                    icon={<Users className="h-8 w-8 text-teal-600" />}
                    description="Miembros en el grupo"
                    color="teal"
                  />
                  <GroupLeaderStatsCard
                    title="Miembros Activos"
                    value={estadisticas.miembrosActivos}
                    icon={<CheckCircle2 className="h-8 w-8 text-green-600" />}
                    description="Miembros con estado activo"
                    color="green"
                  />
                  <GroupLeaderStatsCard
                    title="Fuera de Geocerca"
                    value={estadisticas.miembrosFueraGeocerca}
                    icon={<AlertCircle className="h-8 w-8 text-amber-600" />}
                    description="Miembros fuera del área designada"
                    color="amber"
                  />
                  <GroupLeaderStatsCard
                    title="Asistencia"
                    value={`${estadisticas.porcentajeAsistencia}%`}
                    icon={<Activity className="h-8 w-8 text-blue-600" />}
                    description="Porcentaje de asistencia"
                    color="blue"
                  />
                </div>
              )}

              {/* FORMULARIO MIEMBRO */}
              {mostrarFormularioMiembro && (
                <GroupMemberForm
                  grupoInfo={grupoInfo}
                  hospitalInfo={hospitalInfo}
                  onGuardar={handleGuardarMiembro}
                  onCancelar={() => setMostrarFormularioMiembro(false)}
                />
              )}

              {/* VISTA DETALLE DE MIEMBRO */}
              {vistaDetalle && miembroDetalle && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                        <User className="h-5 w-5 mr-2 text-teal-600" />
                        Detalle del Miembro
                      </h2>
                      <button onClick={handleInicio} className="text-gray-500 hover:text-gray-700">
                        <ChevronRight className="h-5 w-5 transform rotate-180" />
                        <span className="sr-only">Volver</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="flex items-center mb-6">
                          <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
                            <User className="h-8 w-8 text-teal-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-xl font-bold text-gray-800">{miembroDetalle.nombre}</h3>
                            <p className="text-gray-500">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  miembroDetalle.estado === "Activo"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {miembroDetalle.estado}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Información Personal</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">CURP</p>
                                <p className="font-medium">{miembroDetalle.curp}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Teléfono</p>
                                <p className="font-medium">{miembroDetalle.telefono}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Fecha de Registro</p>
                                <p className="font-medium">{miembroDetalle.fechaRegistro}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Grupo</p>
                                <p className="font-medium">{grupoInfo?.nombre}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Horario</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Hora de Entrada</p>
                                <p className="font-medium">{miembroDetalle.horaEntrada}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Hora de Salida</p>
                                <p className="font-medium">{miembroDetalle.horaSalida}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Activity className="h-4 w-4 mr-1 text-teal-600" />
                            Actividad Reciente
                          </h4>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <Clock className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm">Última actividad registrada</p>
                                <p className="text-xs text-gray-500">
                                  {formatearFecha(miembroDetalle.ultimaActividad)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Hace {tiempoTranscurrido(miembroDetalle.ultimaActividad)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-teal-600" />
                            Ubicación
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm">Estado de Geocerca</p>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    miembroDetalle.enGeocerca
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {miembroDetalle.enGeocerca ? "Dentro" : "Fuera"}
                                </span>
                              </div>
                              <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500 text-sm">Mapa de ubicación</p>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                <p>
                                  Lat: {miembroDetalle.ultimaUbicacion?.lat.toFixed(6)}, Lng:{" "}
                                  {miembroDetalle.ultimaUbicacion?.lng.toFixed(6)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={handleInicio}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Volver a la lista
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENIDO SEGÚN TAB */}
              {!mostrarFormularioMiembro && !vistaDetalle && (
                <>
                  {activeTab === "miembros" && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                            <Users className="h-5 w-5 mr-2 text-teal-600" />
                            Miembros de {grupoInfo?.nombre || "..."}
                          </h3>
                          <div className="text-sm text-gray-500">Hospital: {hospitalInfo?.nombre || "..."}</div>
                        </div>
                      </div>

                      {/* Tabla de miembros */}
                      {miembrosFiltrados.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                              <thead>
                                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  <th className="px-6 py-3">Nombre</th>
                                  <th className="px-6 py-3">CURP</th>
                                  <th className="px-6 py-3">Teléfono</th>
                                  <th className="px-6 py-3">Estado</th>
                                  <th className="px-6 py-3">Geocerca</th>
                                  <th className="px-6 py-3">Última Actividad</th>
                                  <th className="px-6 py-3">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {miembrosPagina.map((miembro) => (
                                  <tr key={miembro.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                      <div className="font-medium text-gray-900">{miembro.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4">{miembro.curp}</td>
                                    <td className="px-6 py-4">{miembro.telefono}</td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          miembro.estado === "Activo"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {miembro.estado}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          miembro.enGeocerca ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {miembro.enGeocerca ? "Dentro" : "Fuera"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      Hace {tiempoTranscurrido(miembro.ultimaActividad)}
                                    </td>
                                    <td className="px-6 py-4">
                                      <button
                                        onClick={() => handleVerDetalle(miembro)}
                                        className="text-teal-600 hover:text-teal-900"
                                      >
                                        Ver detalle
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Controles de paginación */}
                          {totalPaginasMiembros > 1 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                              <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                                  disabled={paginaActual === 1}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Anterior
                                </button>
                                <button
                                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginasMiembros))}
                                  disabled={paginaActual === totalPaginasMiembros}
                                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Siguiente
                                </button>
                              </div>
                              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{indexInicioMiembros + 1}</span> a{" "}
                                    <span className="font-medium">
                                      {Math.min(indexFinMiembros, miembrosFiltrados.length)}
                                    </span>{" "}
                                    de <span className="font-medium">{miembrosFiltrados.length}</span> resultados
                                  </p>
                                </div>
                                <div>
                                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                      onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                                      disabled={paginaActual === 1}
                                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span className="sr-only">Anterior</span>
                                      <ChevronRight className="h-5 w-5 transform rotate-180" />
                                    </button>
                                    {/* Números de página */}
                                    {Array.from({ length: Math.min(5, totalPaginasMiembros) }, (_, i) => {
                                      let pageNum
                                      if (totalPaginasMiembros <= 5) {
                                        pageNum = i + 1
                                      } else if (paginaActual <= 3) {
                                        pageNum = i + 1
                                      } else if (paginaActual >= totalPaginasMiembros - 2) {
                                        pageNum = totalPaginasMiembros - 4 + i
                                      } else {
                                        pageNum = paginaActual - 2 + i
                                      }
                                      return (
                                        <button
                                          key={i}
                                          onClick={() => setPaginaActual(pageNum)}
                                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            pageNum === paginaActual
                                              ? "z-10 bg-teal-50 border-teal-500 text-teal-600"
                                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                          }`}
                                        >
                                          {pageNum}
                                        </button>
                                      )
                                    })}
                                    <button
                                      onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginasMiembros))}
                                      disabled={paginaActual === totalPaginasMiembros}
                                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span className="sr-only">Siguiente</span>
                                      <ChevronRight className="h-5 w-5" />
                                    </button>
                                  </nav>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No hay miembros que coincidan con la búsqueda.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "monitoreo" && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-teal-600" />
                          Monitoreo de Actividad
                        </h3>
                      </div>

                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Gráfico de Asistencia */}
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Asistencia del Grupo</h4>
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                              <p className="text-gray-500">Gráfico de asistencia</p>
                            </div>
                          </div>

                          {/* Mapa de Ubicaciones */}
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Ubicación de Miembros</h4>
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                              <p className="text-gray-500">Mapa de ubicaciones</p>
                            </div>
                          </div>
                        </div>

                        {/* Actividad Reciente */}
                        <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h4>
                          <div className="space-y-4">
                            {miembros.slice(0, 5).map((miembro) => (
                              <div key={miembro.id} className="flex items-start p-3 border-b border-gray-100">
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    miembro.enGeocerca ? "bg-green-100" : "bg-red-100"
                                  }`}
                                >
                                  <User
                                    className={`h-5 w-5 ${miembro.enGeocerca ? "text-green-600" : "text-red-600"}`}
                                  />
                                </div>
                                <div className="ml-4">
                                  <p className="font-medium">{miembro.nombre}</p>
                                  <p className="text-sm text-gray-500">
                                    Última actividad: hace {tiempoTranscurrido(miembro.ultimaActividad)}
                                  </p>
                                  <div className="mt-1 flex items-center">
                                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                    <span
                                      className={`text-xs ${miembro.enGeocerca ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {miembro.enGeocerca ? "Dentro de la geocerca" : "Fuera de la geocerca"}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-auto">
                                  <button
                                    onClick={() => handleVerDetalle(miembro)}
                                    className="text-teal-600 hover:text-teal-900 text-sm"
                                  >
                                    Ver detalle
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}