import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HospitalForm from "../components/admin/HospitalForm";
import AdminForm from "../components/admin/AdminForm";
import SuperadminSidebar from "../components/admin/SuperadminSidebar";
import GrupoForm from "../components/admin/GrupoForm";
import EmpleadoForm from "../components/admin/EmpleadoForm";
import {
  ChevronRight,
  Hospital,
  Map,
  Plus,
  Settings,
  Users,
  UsersRound,
  UserPlus,
} from "lucide-react";
import StatsCard from "../components/admin/StatsCard";
import MonitoreoMap from "../components/admin/MonitoreoMap";

export default function SuperadminGeoApp() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [hospitales, setHospitales] = useState([])
  const [administradores, setAdministradores] = useState([])
  const [grupos, setGrupos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528])
  const [activeTab, setActiveTab] = useState("hospitales")
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false)
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false)
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false)
  const navigate = useNavigate()
  const { setIsAuthenticated } = useAuth()
  const [paginaActual, setPaginaActual] = useState(1)
  const hospitalesPorPagina = 20
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const [tipoAdminFiltro, setTipoAdminFiltro] = useState("")
  const [hospitalesFiltradosPorEstado, setHospitalesFiltradosPorEstado] = useState([])
  const [editandoHospital, setEditandoHospital] = useState(false)
  const [hospitalEditando, setHospitalEditando] = useState(null)
  const [hospitalIndexEditando, setHospitalIndexEditando] = useState(null)
  const [geocerca, setGeocerca] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const buscarCoordenadasEstado = async (estado) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?country=Mexico&state=${estado}&format=json`,
    )
    const data = await response.json()
    if (data.length > 0) {
      const { lat, lon } = data[0]
      setMapCenter([Number.parseFloat(lat), Number.parseFloat(lon)])
    }
  }

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/superadmin/hospitals")
        const data = await response.json()
        console.log("Hospitales desde la API:", data)

        const hospitalesFormateados = data.map((h) => ({
          nombre: (h.nombre_hospital || "").replace(/\s+/g, " ").trim(),
          estado: (h.estado || "").trim(),
          tipoUnidad: (h.tipo_hospital || "").replace(/\s+/g, " ").trim(),
          region: (h.direccion_hospital || "").replace(/\s+/g, " ").trim(),
          geocerca: {
            lat: Number.parseFloat(h.latitud_hospital) || 0,
            lng: Number.parseFloat(h.longitud_hospital) || 0,
            radio: h.radio_geo ?? 0,
          },
        }))

        setHospitales(hospitalesFormateados)
      } catch (error) {
        console.error("Error al obtener hospitales:", error)
      }
    }

    fetchHospitales()
  }, [])

  const fetchAdministradores = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/superadmin/estadoadmins")
      const data = await response.json()
      setAdministradores(data)
    } catch (error) {
      console.error("Error al obtener administradores:", error)
    }
  }

  useEffect(() => {
    fetchAdministradores()
  }, [])

  // Datos de ejemplo para grupos y empleados
  useEffect(() => {
    // Simulación de datos de grupos
    const gruposEjemplo = [
      {
        id: 1,
        nombre: "Grupo A - Urgencias",
        descripcion: "Personal de atención en urgencias",
        hospital_id: 0,
        hospital_nombre: "Hospital General Regional #1",
        estado: "Ciudad de México",
        fechaCreacion: "2023-05-15",
        totalMiembros: 12,
        activo: true,
      },
      {
        id: 2,
        nombre: "Grupo B - Pediatría",
        descripcion: "Equipo de atención pediátrica",
        hospital_id: 0,
        hospital_nombre: "Hospital General Regional #1",
        estado: "Ciudad de México",
        fechaCreacion: "2023-06-20",
        totalMiembros: 8,
        activo: true,
      },
      {
        id: 3,
        nombre: "Grupo C - Cirugía",
        descripcion: "Personal de quirófano y cirugía",
        hospital_id: 1,
        hospital_nombre: "Hospital General de Zona #48",
        estado: "Jalisco",
        fechaCreacion: "2023-07-10",
        totalMiembros: 15,
        activo: true,
      },
    ]
    setGrupos(gruposEjemplo)

    // Simulación de datos de empleados
    const empleadosEjemplo = [
      {
        id: 1,
        nombre: "Ana",
        ap_paterno: "García",
        ap_materno: "Ramírez",
        curp: "GARA900517MDFNRN09",
        telefono: "5512345678",
        grupo_id: 1,
        grupo_nombre: "Grupo A - Urgencias",
        hospital_id: 0,
        hospital_nombre: "Hospital General Regional #1",
        estado: "Ciudad de México",
        activo: true,
      },
      {
        id: 2,
        nombre: "Carlos",
        ap_paterno: "Mendoza",
        ap_materno: "López",
        curp: "MERC880612HDFNRL03",
        telefono: "5587654321",
        grupo_id: 1,
        grupo_nombre: "Grupo A - Urgencias",
        hospital_id: 0,
        hospital_nombre: "Hospital General Regional #1",
        estado: "Ciudad de México",
        activo: true,
      },
      {
        id: 3,
        nombre: "Laura",
        ap_paterno: "Sánchez",
        ap_materno: "Cruz",
        curp: "SARL910823MDFNCR07",
        telefono: "5523456789",
        grupo_id: 2,
        grupo_nombre: "Grupo B - Pediatría",
        hospital_id: 0,
        hospital_nombre: "Hospital General Regional #1",
        estado: "Ciudad de México",
        activo: true,
      },
    ]
    setEmpleados(empleadosEjemplo)
  }, [])

  // Función para resetear todos los estados de formularios
  const resetearFormularios = () => {
    setMostrarFormulario(false)
    setMostrarFormAdmin(false)
    setMostrarFormGrupo(false)
    setMostrarFormEmpleado(false)
    setEditandoHospital(false)
    setHospitalEditando(null)
    setHospitalIndexEditando(null)
  }

  const handleMostrarFormulario = () => {
    resetearFormularios()
    setMostrarFormulario(true)
    setGeocerca(null)
  }

  const handleMostrarFormAdmin = () => {
    resetearFormularios()
    setMostrarFormAdmin(true)
  }

  const handleMostrarFormGrupo = () => {
    resetearFormularios()
    setMostrarFormGrupo(true)
  }

  const handleMostrarFormEmpleado = () => {
    resetearFormularios()
    setMostrarFormEmpleado(true)
  }

  const handleInicio = () => {
    resetearFormularios()
  }

  // Función para editar un hospital
  const handleEditarHospital = (hospital, index) => {
    resetearFormularios()
    setEditandoHospital(true)
    setHospitalEditando(hospital)
    setHospitalIndexEditando(index)
    setMostrarFormulario(true)

    // Function to normalize state names (convert to title case)
    const normalizeStateName = (stateName) => {
      if (!stateName) return ""
      // Convert state name to title case (first letter uppercase, rest lowercase)
      return stateName
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }

    // Normalize the state name to match the format in the dropdown
    const estadoNormalizado = normalizeStateName(hospital.estado)

    // Verificar que todos los campos tengan valores válidos
    const hospitalProcesado = {
      estado: estadoNormalizado,
      nombre: hospital.nombre || "",
      tipoUnidad: hospital.tipoUnidad || "",
      region: hospital.region || "",
    }

    // Establecer la geocerca
    const geocercaValida =
      hospital.geocerca &&
      typeof hospital.geocerca === "object" &&
      (hospital.geocerca.lat !== undefined || hospital.geocerca.lng !== undefined)

    if (geocercaValida) {
      setGeocerca(hospital.geocerca)
    } else {
      setGeocerca({
        lat: 0,
        lng: 0,
        radio: 0,
      })
    }

    // Ajustar el centro del mapa
    if (geocercaValida && hospital.geocerca.lat && hospital.geocerca.lng) {
      setMapCenter([hospital.geocerca.lat, hospital.geocerca.lng])
    } else if (hospital.estado) {
      buscarCoordenadasEstado(estadoNormalizado)
    }

    console.log("Editando hospital:", hospitalProcesado)
  }

  // Manejador para guardar un hospital (nuevo o editado)
  const handleGuardarHospital = (nuevoHospital) => {
    if (editandoHospital && hospitalIndexEditando !== null) {
      // Actualizar el hospital existente
      const nuevosHospitales = [...hospitales]
      nuevosHospitales[hospitalIndexEditando] = nuevoHospital
      setHospitales(nuevosHospitales)
      console.log("Hospital actualizado:", nuevosHospitales[hospitalIndexEditando])
    } else {
      // Crear un nuevo hospital
      setHospitales([...hospitales, nuevoHospital])
      console.log("Nuevo hospital creado:", nuevoHospital)
    }

    // Resetear el estado de edición
    resetearFormularios()
    setActiveTab("hospitales")
  }

  // Manejador para guardar un administrador
  const handleGuardarAdmin = async (nuevoAdmin) => {
    try {
      const response = await fetch("http://localhost:4000/api/superadmin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoAdmin),
      })

      if (!response.ok) throw new Error("Fallo al crear el administrador")

      const data = await response.json()
      alert(`✅ ${data.message}\n🆔 Usuario: ${nuevoAdmin.user}\n🔑 Contraseña: ${nuevoAdmin.pass}`)

      // Actualizar la lista de administradores desde la base de datos
      await fetchAdministradores()
      resetearFormularios()
      setActiveTab("administradores")
    } catch (error) {
      console.error("❌ Error:", error)
      alert("❌ Error al crear el administrador.")
    }
  }

  // Manejador para guardar un grupo
  const handleGuardarGrupo = (nuevoGrupo) => {
    // Crear un nuevo grupo
    const nuevoId = Math.max(...grupos.map((g) => g.id), 0) + 1

    // Obtener el nombre del hospital
    const hospital = hospitales[nuevoGrupo.hospital_id]

    const grupoCompleto = {
      id: nuevoId,
      nombre: nuevoGrupo.nombre,
      descripcion: nuevoGrupo.descripcion,
      hospital_id: nuevoGrupo.hospital_id,
      hospital_nombre: hospital ? hospital.nombre : "Hospital desconocido",
      estado: hospital ? hospital.estado : "",
      fechaCreacion: new Date().toISOString().split("T")[0],
      totalMiembros: 0,
      activo: nuevoGrupo.activo,
    }

    setGrupos([...grupos, grupoCompleto])
    console.log("Nuevo grupo creado:", grupoCompleto)

    resetearFormularios()
    setActiveTab("grupos")
  }

  // Manejador para guardar un empleado
  const handleGuardarEmpleado = (nuevoEmpleado) => {
    // Crear un nuevo empleado
    const nuevoId = Math.max(...empleados.map((e) => e.id), 0) + 1

    // Obtener el nombre del hospital y grupo
    const hospital = hospitales[nuevoEmpleado.hospital_id]
    const grupo = grupos.find((g) => g.id.toString() === nuevoEmpleado.grupo_id)

    const empleadoCompleto = {
      id: nuevoId,
      nombre: nuevoEmpleado.nombre,
      ap_paterno: nuevoEmpleado.ap_paterno,
      ap_materno: nuevoEmpleado.ap_materno,
      curp: nuevoEmpleado.curp,
      telefono: nuevoEmpleado.telefono,
      grupo_id: nuevoEmpleado.grupo_id,
      grupo_nombre: grupo ? grupo.nombre : "Grupo desconocido",
      hospital_id: nuevoEmpleado.hospital_id,
      hospital_nombre: hospital ? hospital.nombre : "Hospital desconocido",
      estado: nuevoEmpleado.estado,
      activo: true,
    }

    setEmpleados([...empleados, empleadoCompleto])
    console.log("Nuevo empleado creado:", empleadoCompleto)

    resetearFormularios()
    setActiveTab("empleados")
  }

  // FILTRO y PAGINADO
  const hospitalesFiltrados = estadoFiltro
    ? hospitales.filter((h) => h.estado.toLowerCase() === estadoFiltro.toLowerCase())
    : hospitales

  const administradoresFiltrados = tipoAdminFiltro
    ? administradores.filter((a) => a.role_name === tipoAdminFiltro)
    : administradores

  const indexInicio = (paginaActual - 1) * hospitalesPorPagina
  const indexFin = indexInicio + hospitalesPorPagina
  const hospitalesPagina = hospitalesFiltrados.slice(indexInicio, indexFin)

  const totalPaginas = Math.ceil(hospitalesFiltrados.length / hospitalesPorPagina)

  // Estadísticas para las tarjetas
  const estadisticas = {
    totalHospitales: hospitales.length,
    totalAdministradores: administradores.length,
    totalEstados: [...new Set(hospitales.map((h) => h.estado))].filter(Boolean).length,
    totalGrupos: grupos.length,
    totalEmpleados: empleados.length,
  }

  // Manejador para cambiar de pestaña
  const handleTabChange = (tab) => {
    resetearFormularios()
    setActiveTab(tab)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SuperadminSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        handleInicio={handleInicio}
        mostrarFormulario={mostrarFormulario}
        mostrarFormAdmin={mostrarFormAdmin}
        mostrarFormGrupo={mostrarFormGrupo}
        handleMostrarFormulario={handleMostrarFormulario}
        handleMostrarFormAdmin={handleMostrarFormAdmin}
        handleMostrarFormGrupo={handleMostrarFormGrupo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300 ease-in-out`}>
        {/* HEADER */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {mostrarFormulario
                ? editandoHospital
                  ? "Editar Hospital"
                  : "Crear Hospital"
                : mostrarFormAdmin
                  ? "Crear Administrador"
                  : mostrarFormGrupo
                    ? "Crear Grupo"
                    : mostrarFormEmpleado
                      ? "Crear Empleado"
                      : activeTab === "hospitales"
                        ? "Gestión de Hospitales"
                        : activeTab === "administradores"
                          ? "Gestión de Administradores"
                          : activeTab === "grupos"
                            ? "Gestión de Grupos"
                            : activeTab === "empleados"
                              ? "Gestión de Empleados"
                              : activeTab === "monitoreo"
                                ? "Monitoreo de Empleados"
                                : activeTab === "configuracion"
                                  ? "Configuración del Sistema"
                                  : "Panel de Control"}
            </h1>
            <div className="flex space-x-2">
              {!mostrarFormulario && !mostrarFormAdmin && !mostrarFormGrupo && !mostrarFormEmpleado && (
                <>
                  {activeTab === "hospitales" && (
                    <button
                      onClick={handleMostrarFormulario}
                      className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Hospital
                    </button>
                  )}

                  {activeTab === "administradores" && (
                    <button
                      onClick={handleMostrarFormAdmin}
                      className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Admin
                    </button>
                  )}

                  {activeTab === "grupos" && (
                    <button
                      onClick={handleMostrarFormGrupo}
                      className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Grupo
                    </button>
                  )}

                  {activeTab === "empleados" && (
                    <button
                      onClick={handleMostrarFormEmpleado}
                      className="flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Empleado
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="p-6">
          {/* TARJETAS DE ESTADÍSTICAS */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            activeTab !== "monitoreo" &&
            activeTab !== "configuracion" && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <StatsCard
                  title="Total Hospitales"
                  value={estadisticas.totalHospitales}
                  icon={<Hospital className="h-8 w-8 text-emerald-600" />}
                  description="Hospitales registrados en el sistema"
                  color="emerald"
                />
                <StatsCard
                  title="Administradores"
                  value={estadisticas.totalAdministradores}
                  icon={<Users className="h-8 w-8 text-blue-600" />}
                  description="Administradores activos"
                  color="blue"
                />
                <StatsCard
                  title="Estados Cubiertos"
                  value={estadisticas.totalEstados}
                  icon={<Map className="h-8 w-8 text-purple-600" />}
                  description="Estados con presencia hospitalaria"
                  color="purple"
                />
                <StatsCard
                  title="Grupos"
                  value={estadisticas.totalGrupos}
                  icon={<UsersRound className="h-8 w-8 text-amber-600" />}
                  description="Grupos de trabajo activos"
                  color="amber"
                />
                <StatsCard
                  title="Empleados"
                  value={estadisticas.totalEmpleados}
                  icon={<UserPlus className="h-8 w-8 text-rose-600" />}
                  description="Empleados registrados"
                  color="rose"
                />
              </div>
            )}

          {/* FORMULARIO HOSPITAL */}
          {mostrarFormulario && (
            <HospitalForm
              editandoHospital={editandoHospital}
              hospitalEditando={hospitalEditando}
              mapCenter={mapCenter}
              geocerca={geocerca}
              onCoordsChange={setGeocerca}
              onBuscarCoordenadasEstado={buscarCoordenadasEstado}
              onGuardar={handleGuardarHospital}
              onCancelar={() => {
                resetearFormularios()
                setActiveTab("hospitales")
              }}
            />
          )}

          {/* FORMULARIO ADMINISTRADOR */}
          {mostrarFormAdmin && (
            <AdminForm
              hospitales={hospitales}
              onGuardar={handleGuardarAdmin}
              onCancelar={() => {
                resetearFormularios()
                setActiveTab("administradores")
              }}
              setHospitalesFiltradosPorEstado={setHospitalesFiltradosPorEstado}
            />
          )}

          {/* FORMULARIO GRUPO */}
          {mostrarFormGrupo && (
            <GrupoForm
              hospitales={hospitales}
              onGuardar={handleGuardarGrupo}
              onCancelar={() => {
                resetearFormularios()
                setActiveTab("grupos")
              }}
            />
          )}

          {/* FORMULARIO EMPLEADO */}
          {mostrarFormEmpleado && (
            <EmpleadoForm
              hospitales={hospitales}
              grupos={grupos}
              onGuardar={handleGuardarEmpleado}
              onCancelar={() => {
                resetearFormularios()
                setActiveTab("empleados")
              }}
            />
          )}

          {/* MONITOREO */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            activeTab === "monitoreo" && <MonitoreoMap />}

          {/* CONFIGURACIÓN DEL SISTEMA */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            activeTab === "configuracion" && <MonitoreoConfig />}

          {/* CONTENIDO SEGÚN TAB */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            activeTab !== "monitoreo" &&
            activeTab !== "configuracion" && (
              <>
                {activeTab === "hospitales" && (
                  <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Hospital className="h-5 w-5 mr-2 text-emerald-600" />
                          Hospitales registrados
                        </h3>

                        {/* Filtro por estado */}
                        <div className="flex items-center">
                          <label className="text-gray-700 font-medium mr-2">Filtrar por estado:</label>
                          <select
                            value={estadoFiltro}
                            onChange={(e) => {
                              setEstadoFiltro(e.target.value)
                              setPaginaActual(1)
                            }}
                            className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Todos</option>
                            {[...new Set(hospitales.map((h) => h.estado))]
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

                    {/* Tabla de hospitales */}
                    {hospitalesFiltrados.length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full table-auto">
                            <thead>
                              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                <th className="px-4 py-2">Nombre</th>
                                <th className="px-4 py-2">Estado</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Región</th>
                                <th className="px-4 py-2">Lat</th>
                                <th className="px-4 py-2">Lng</th>
                                <th className="px-4 py-2">Radio (m)</th>
                                <th className="px-4 py-2">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {hospitalesPagina.map((h, i) => {
                                // Calcular el índice real en la lista completa
                                const indiceReal = indexInicio + i
                                return (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm">
                                      <div className="max-w-xs truncate">{h.nombre}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{h.estado}</td>
                                    <td className="px-4 py-3 text-sm">{h.tipoUnidad}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <div className="max-w-xs truncate">{h.region}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{h.geocerca?.lat?.toFixed(4) ?? "N/A"}</td>
                                    <td className="px-4 py-3 text-sm">{h.geocerca?.lng?.toFixed(4) ?? "N/A"}</td>
                                    <td className="px-4 py-3 text-sm">{h.geocerca?.radio ?? "N/A"}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <button
                                        onClick={() => handleEditarHospital(h, indiceReal)}
                                        className="text-emerald-600 hover:text-emerald-800 transition-colors flex items-center"
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Editar
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Controles de paginación */}
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
                              onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                              disabled={paginaActual === totalPaginas}
                              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Siguiente
                            </button>
                          </div>
                          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{indexInicio + 1}</span> a{" "}
                                <span className="font-medium">{Math.min(indexFin, hospitalesFiltrados.length)}</span> de{" "}
                                <span className="font-medium">{hospitalesFiltrados.length}</span> resultados
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
                                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                  let pageNum
                                  if (totalPaginas <= 5) {
                                    pageNum = i + 1
                                  } else if (paginaActual <= 3) {
                                    pageNum = i + 1
                                  } else if (paginaActual >= totalPaginas - 2) {
                                    pageNum = totalPaginas - 4 + i
                                  } else {
                                    pageNum = paginaActual - 2 + i
                                  }
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => setPaginaActual(pageNum)}
                                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        pageNum === paginaActual
                                          ? "z-10 bg-emerald-50 border-emerald-500 text-emerald-600"
                                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                })}
                                <button
                                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                                  disabled={paginaActual === totalPaginas}
                                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="sr-only">Siguiente</span>
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-gray-500">No hay hospitales registrados.</div>
                    )}
                  </div>
                )}

                {activeTab === "administradores" && (
                  <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-blue-600" />
                          Administradores registrados
                        </h3>

                        {/* Filtro por tipo de administrador */}
                        <div className="flex items-center">
                          <label className="text-gray-700 font-medium mr-2">Filtrar por tipo:</label>
                          <select
                            value={tipoAdminFiltro}
                            onChange={(e) => {
                              setTipoAdminFiltro(e.target.value)
                              setPaginaActual(1)
                            }}
                            className="px-4 py-2 border rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Todos</option>
                            <option value="estadoadmin">Administrador Estatal</option>
                            <option value="adminmunicipio">Administrador Municipal</option>
                            <option value="hospitaladmin">Administrador de Hospital</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {administradoresFiltrados.length > 0 ? (
                      <div className="p-6 space-y-8">
                        {[...new Set(administradoresFiltrados.map((a) => a.estado || "Sin estado"))]
                          .sort()
                          .map((estadoNombre) => {
                            const adminsDelEstado = administradoresFiltrados.filter(
                              (a) => (a.estado || "Sin estado") === estadoNombre,
                            )
                            return (
                              <div key={estadoNombre} className="mb-6">
                                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                                  <Map className="h-4 w-4 mr-2 text-blue-500" />
                                  Estado: {estadoNombre}
                                </h4>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Nombre
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Apellido paterno
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Apellido materno
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          RFC
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Rol
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {adminsDelEstado.map((admin, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">{admin.nombre}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">{admin.ap_paterno}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">{admin.ap_materno}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">{admin.RFC}</td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span
                                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                          ${
                                            admin.role_name === "estadoadmin"
                                              ? "bg-blue-100 text-blue-800"
                                              : admin.role_name === "adminmunicipio"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-emerald-100 text-emerald-800"
                                          }`}
                                            >
                                              {admin.role_name === "estadoadmin"
                                                ? "Admin Estatal"
                                                : admin.role_name === "adminmunicipio"
                                                  ? "Admin Municipal"
                                                  : "Admin Hospital"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">No hay administradores registrados todavía.</div>
                    )}
                  </div>
                )}

                {activeTab === "grupos" && (
                  <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <UsersRound className="h-5 w-5 mr-2 text-purple-600" />
                        Grupos registrados
                      </h3>
                    </div>

                    {grupos.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                          <thead>
                            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-4 py-2">Nombre</th>
                              <th className="px-4 py-2">Descripción</th>
                              <th className="px-4 py-2">Hospital</th>
                              <th className="px-4 py-2">Estado</th>
                              <th className="px-4 py-2">Fecha Creación</th>
                              <th className="px-4 py-2">Miembros</th>
                              <th className="px-4 py-2">Estado</th>
                              <th className="px-4 py-2">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {grupos.map((grupo) => (
                              <tr key={grupo.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">
                                  <div className="max-w-xs truncate font-medium">{grupo.nombre}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="max-w-xs truncate">{grupo.descripcion}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{grupo.hospital_nombre}</td>
                                <td className="px-4 py-3 text-sm">{grupo.estado}</td>
                                <td className="px-4 py-3 text-sm">{grupo.fechaCreacion}</td>
                                <td className="px-4 py-3 text-sm">{grupo.totalMiembros}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      grupo.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {grupo.activo ? "Activo" : "Inactivo"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <button className="text-purple-600 hover:text-purple-800 transition-colors flex items-center">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Editar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">No hay grupos registrados todavía.</div>
                    )}
                  </div>
                )}

                {activeTab === "empleados" && (
                  <div className="bg-white shadow-md rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
                        Empleados registrados
                      </h3>
                    </div>

                    {empleados.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                          <thead>
                            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <th className="px-4 py-2">Nombre</th>
                              <th className="px-4 py-2">Apellidos</th>
                              <th className="px-4 py-2">CURP</th>
                              <th className="px-4 py-2">Teléfono</th>
                              <th className="px-4 py-2">Grupo</th>
                              <th className="px-4 py-2">Hospital</th>
                              <th className="px-4 py-2">Estado</th>
                              <th className="px-4 py-2">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {empleados.map((empleado) => (
                              <tr key={empleado.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">{empleado.nombre}</td>
                                <td className="px-4 py-3 text-sm">{`${empleado.ap_paterno} ${empleado.ap_materno}`}</td>
                                <td className="px-4 py-3 text-sm">{empleado.curp}</td>
                                <td className="px-4 py-3 text-sm">{empleado.telefono}</td>
                                <td className="px-4 py-3 text-sm">{empleado.grupo_nombre}</td>
                                <td className="px-4 py-3 text-sm">{empleado.hospital_nombre}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      empleado.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {empleado.activo ? "Activo" : "Inactivo"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <button className="text-amber-600 hover:text-amber-800 transition-colors flex items-center">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Editar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">No hay empleados registrados todavía.</div>
                    )}
                  </div>
                )}
              </>
            )}
        </main>
      </div>
    </div>
  )
}
