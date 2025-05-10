"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChevronRight,
  ClipboardList,
  Hospital,
  LogOut,
  Plus,
  Search,
  Settings,
  Star,
  User,
  UserPlus,
  Users,
  UsersRound,
  FileText,
  Calendar,
  Shield,
} from "lucide-react";
import HospitalStatsCard from "../components/hospital/HospitalStatsCard";
import HospitalGroupForm from "../components/hospital/HospitalGroupForm";
import HospitalGroupLeaderForm from "../components/hospital/HospitalGroupLeaderForm";

export default function HospitalAdminDashboard() {
  const [activeTab, setActiveTab] = useState("grupos");
  const [mostrarFormularioGrupo, setMostrarFormularioGrupo] = useState(false);
  const [mostrarFormularioLider, setMostrarFormularioLider] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [editandoGrupo, setEditandoGrupo] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const gruposPorPagina = 10;
  const miembrosPorPagina = 15;

  // Obtener información del hospital y grupos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Obtener el ID del usuario del localStorage
        const userId = localStorage.getItem("userId");

        if (!userId) {
          console.error("No se encontró ID de usuario en localStorage");
          setIsLoading(false);
          return;
        }

        // En una implementación real, estas serían llamadas a tu API
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
        };
        setHospitalInfo(mockHospital);

        // Simulación de datos de grupos
        const mockGrupos = [
          {
            id: 1,
            nombre: "Grupo A - Urgencias",
            descripcion: "Personal de atención en urgencias",
            fechaCreacion: "2023-05-15",
            totalMiembros: 12,
            lider: {
              id: 3,
              nombre: "Carlos Mendoza",
              curp: "MERC880612HDFNRL03",
            },
            activo: true,
          },
          {
            id: 2,
            nombre: "Grupo B - Pediatría",
            descripcion: "Equipo de atención pediátrica",
            fechaCreacion: "2023-06-20",
            totalMiembros: 8,
            lider: {
              id: 5,
              nombre: "Laura Sánchez",
              curp: "SARL910823MDFNCR07",
            },
            activo: true,
          },
          {
            id: 3,
            nombre: "Grupo C - Cirugía",
            descripcion: "Personal de quirófano y cirugía",
            fechaCreacion: "2023-07-10",
            totalMiembros: 15,
            lider: {
              id: 7,
              nombre: "Roberto Gómez",
              curp: "GORB850415HDFMRB09",
            },
            activo: true,
          },
          {
            id: 4,
            nombre: "Grupo D - Administración",
            descripcion: "Personal administrativo",
            fechaCreacion: "2023-08-05",
            totalMiembros: 6,
            lider: null,
            activo: false,
          },
        ];
        setGrupos(mockGrupos);

        // Simulación de datos de miembros
        const mockMiembros = [
          {
            id: 1,
            nombre: "Ana García",
            curp: "GARA900517MDFNRN09",
            telefono: "5512345678",
            grupos: ["Grupo A - Urgencias"],
            estado: "Activo",
            ultimaUbicacion: { lat: 19.4326, lng: -99.1332 },
            horaEntrada: "08:15",
            horaSalida: "16:30",
            enGeocerca: true,
          },
          {
            id: 2,
            nombre: "Carlos Mendoza",
            curp: "MERC880612HDFNRL03",
            telefono: "5587654321",
            grupos: ["Grupo A - Urgencias"],
            estado: "Activo",
            ultimaUbicacion: { lat: 19.4361, lng: -99.1478 },
            horaEntrada: "09:00",
            horaSalida: "17:00",
            enGeocerca: true,
            esLider: true,
          },
          {
            id: 3,
            nombre: "Laura Sánchez",
            curp: "SARL910823MDFNCR07",
            telefono: "5523456789",
            grupos: ["Grupo B - Pediatría"],
            estado: "Activo",
            ultimaUbicacion: { lat: 19.415, lng: -99.16 },
            horaEntrada: "08:30",
            horaSalida: "16:45",
            enGeocerca: true,
            esLider: true,
          },
          {
            id: 4,
            nombre: "Roberto Gómez",
            curp: "GORB850415HDFMRB09",
            telefono: "5534567890",
            grupos: ["Grupo C - Cirugía"],
            estado: "Activo",
            ultimaUbicacion: { lat: 19.428, lng: -99.145 },
            horaEntrada: "07:45",
            horaSalida: "15:30",
            enGeocerca: true,
            esLider: true,
          },
          {
            id: 5,
            nombre: "María López",
            curp: "LOMA870623MDFPRR05",
            telefono: "5545678901",
            grupos: ["Grupo A - Urgencias", "Grupo B - Pediatría"],
            estado: "Activo",
            ultimaUbicacion: { lat: 19.422, lng: -99.138 },
            horaEntrada: "08:00",
            horaSalida: "16:00",
            enGeocerca: true,
          },
          {
            id: 6,
            nombre: "Juan Pérez",
            curp: "PERJ900112HDFRRN01",
            telefono: "5556789012",
            grupos: ["Grupo C - Cirugía"],
            estado: "Inactivo",
            ultimaUbicacion: { lat: 19.435, lng: -99.155 },
            horaEntrada: "09:15",
            horaSalida: "17:15",
            enGeocerca: false,
          },
        ];
        setMiembros(mockMiembros);

        setIsLoading(false);
      } catch (error) {
        console.error("Error al obtener datos:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMostrarFormularioGrupo = (grupo = null) => {
    if (grupo) {
      setEditandoGrupo(true);
      setGrupoSeleccionado(grupo);
    } else {
      setEditandoGrupo(false);
      setGrupoSeleccionado(null);
    }
    setMostrarFormularioGrupo(true);
    setMostrarFormularioLider(false);
  };

  const handleMostrarFormularioLider = (grupo) => {
    setGrupoSeleccionado(grupo);
    setMostrarFormularioLider(true);
    setMostrarFormularioGrupo(false);
  };

  const handleInicio = () => {
    setMostrarFormularioGrupo(false);
    setMostrarFormularioLider(false);
    setGrupoSeleccionado(null);
    setEditandoGrupo(false);
  };

  // Manejador para guardar un grupo
  const handleGuardarGrupo = (nuevoGrupo) => {
    if (editandoGrupo && grupoSeleccionado) {
      // Actualizar grupo existente
      const gruposActualizados = grupos.map((g) =>
        g.id === grupoSeleccionado.id ? { ...g, ...nuevoGrupo } : g
      );
      setGrupos(gruposActualizados);
    } else {
      // Crear nuevo grupo
      const nuevoId = Math.max(...grupos.map((g) => g.id), 0) + 1;
      setGrupos([
        ...grupos,
        {
          id: nuevoId,
          ...nuevoGrupo,
          fechaCreacion: new Date().toISOString().split("T")[0],
          totalMiembros: 0,
          lider: null,
          activo: true,
        },
      ]);
    }
    setMostrarFormularioGrupo(false);
    setEditandoGrupo(false);
    setGrupoSeleccionado(null);
  };

  // Manejador para asignar un líder a un grupo
  const handleAsignarLider = (grupoId, lider) => {
    // Actualizar el grupo con el nuevo líder
    const gruposActualizados = grupos.map((g) =>
      g.id === grupoId
        ? {
            ...g,
            lider: {
              id: lider.id,
              nombre: lider.nombre,
              curp: lider.curp,
            },
          }
        : g
    );
    setGrupos(gruposActualizados);

    // Actualizar el estado de los miembros
    const miembrosActualizados = miembros.map((m) =>
      m.id === lider.id
        ? {
            ...m,
            esLider: true,
            grupos: m.grupos.includes(grupoSeleccionado.nombre)
              ? m.grupos
              : [...m.grupos, grupoSeleccionado.nombre],
          }
        : m
    );
    setMiembros(miembrosActualizados);

    setMostrarFormularioLider(false);
    setGrupoSeleccionado(null);
  };

  // FILTRO y PAGINADO para grupos
  const gruposFiltrados = grupoFiltro
    ? grupos.filter((g) =>
        g.nombre.toLowerCase().includes(grupoFiltro.toLowerCase())
      )
    : grupos;

  const indexInicioGrupos = (paginaActual - 1) * gruposPorPagina;
  const indexFinGrupos = indexInicioGrupos + gruposPorPagina;
  const gruposPagina = gruposFiltrados.slice(indexInicioGrupos, indexFinGrupos);

  const totalPaginasGrupos = Math.ceil(
    gruposFiltrados.length / gruposPorPagina
  );

  // FILTRO y PAGINADO para miembros
  const indexInicioMiembros = (paginaActual - 1) * miembrosPorPagina;
  const indexFinMiembros = indexInicioMiembros + miembrosPorPagina;
  const miembrosPagina = miembros.slice(indexInicioMiembros, indexFinMiembros);

  const totalPaginasMiembros = Math.ceil(miembros.length / miembrosPorPagina);

  // Estadísticas para las tarjetas
  const estadisticas = {
    totalGrupos: grupos.length,
    gruposActivos: grupos.filter((g) => g.activo).length,
    totalMiembros: miembros.length,
    miembrosActivos: miembros.filter((m) => m.estado === "Activo").length,
    miembrosFueraGeocerca: miembros.filter(
      (m) => !m.enGeocerca && m.estado === "Activo"
    ).length,
  };

  // Función para obtener el ícono según el nombre del grupo
  const getGrupoIcon = (nombreGrupo) => {
    if (nombreGrupo.includes("Urgencias"))
      return <FileText className="h-6 w-6 text-red-600" />;
    if (nombreGrupo.includes("Pediatría"))
      return <Users className="h-6 w-6 text-blue-600" />;
    if (nombreGrupo.includes("Cirugía"))
      return <ClipboardList className="h-6 w-6 text-purple-600" />;
    if (nombreGrupo.includes("Administración"))
      return <Shield className="h-6 w-6 text-green-600" />;
    return <ClipboardList className="h-6 w-6 text-indigo-600" />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-indigo-800 to-purple-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen fixed`}
      >
        <div className="p-4 flex items-center justify-between">
          <div
            className={`flex items-center ${
              !sidebarOpen && "justify-center w-full"
            }`}
          >
            <Hospital className="h-8 w-8" />
            <h1
              className={`ml-2 font-bold text-xl ${!sidebarOpen && "hidden"}`}
            >
              MediGestión
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white p-1 rounded-full hover:bg-indigo-700"
          >
            <ChevronRight
              className={`h-5 w-5 transform ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Perfil de usuario */}
        <div
          className={`mt-2 px-4 py-3 ${
            !sidebarOpen ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex items-center ${!sidebarOpen ? "flex-col" : ""}`}
          >
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="font-medium text-sm">Administrador</p>
                <p className="text-xs text-indigo-200">
                  {hospitalInfo?.nombre || "Cargando..."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col flex-1">
          <button
            onClick={() => {
              handleInicio();
              setActiveTab("grupos");
            }}
            className={`flex items-center py-3 px-4 hover:bg-indigo-700 ${
              !mostrarFormularioGrupo &&
              !mostrarFormularioLider &&
              activeTab === "grupos"
                ? "bg-indigo-700"
                : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <UsersRound className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Grupos</span>}
          </button>

          <button
            onClick={() => {
              handleInicio();
              setActiveTab("miembros");
            }}
            className={`flex items-center py-3 px-4 hover:bg-indigo-700 ${
              !mostrarFormularioGrupo &&
              !mostrarFormularioLider &&
              activeTab === "miembros"
                ? "bg-indigo-700"
                : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Users className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Miembros</span>}
          </button>

          <button
            onClick={() => handleMostrarFormularioGrupo()}
            className={`flex items-center py-3 px-4 hover:bg-indigo-700 ${
              mostrarFormularioGrupo ? "bg-indigo-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <UserPlus className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Crear Grupo</span>}
          </button>

          <div className="mt-auto">
            <button
              onClick={() => {
                localStorage.removeItem("isAuthenticated");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userId");
                setIsAuthenticated(false);
                navigate("/");
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
      <div
        className={`flex-1 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out`}
      >
        {/* HEADER */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {mostrarFormularioGrupo
                ? editandoGrupo
                  ? "Editar Grupo"
                  : "Crear Grupo"
                : mostrarFormularioLider
                ? "Asignar Líder de Grupo"
                : activeTab === "grupos"
                ? "Gestión de Grupos"
                : "Miembros del Hospital"}
            </h1>
            <div className="flex space-x-2">
              {!mostrarFormularioGrupo && !mostrarFormularioLider && (
                <>
                  {activeTab === "grupos" && (
                    <>
                      <div className="relative">
                        <input
                          type="search"
                          placeholder="Buscar grupo..."
                          className="px-4 py-2 border rounded-lg"
                          value={grupoFiltro}
                          onChange={(e) => setGrupoFiltro(e.target.value)}
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      <button
                        onClick={() => handleMostrarFormularioGrupo()}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Grupo
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
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* TARJETAS DE ESTADÍSTICAS */}
              {!mostrarFormularioGrupo && !mostrarFormularioLider && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <HospitalStatsCard
                    title="Grupos Activos"
                    value={estadisticas.gruposActivos}
                    icon={<UsersRound className="h-8 w-8 text-indigo-600" />}
                    description="Grupos de trabajo activos"
                    color="indigo"
                  />
                  <HospitalStatsCard
                    title="Miembros"
                    value={estadisticas.miembrosActivos}
                    icon={<Users className="h-8 w-8 text-purple-600" />}
                    description="Miembros activos en el hospital"
                    color="purple"
                  />
                  <HospitalStatsCard
                    title="Fuera de Geocerca"
                    value={estadisticas.miembrosFueraGeocerca}
                    icon={<ClipboardList className="h-8 w-8 text-amber-600" />}
                    description="Miembros fuera del área designada"
                    color="amber"
                  />
                </div>
              )}

              {/* FORMULARIO GRUPO */}
              {mostrarFormularioGrupo && (
                <HospitalGroupForm
                  editando={editandoGrupo}
                  grupo={grupoSeleccionado}
                  onGuardar={handleGuardarGrupo}
                  onCancelar={() => {
                    setMostrarFormularioGrupo(false);
                    setEditandoGrupo(false);
                    setGrupoSeleccionado(null);
                  }}
                />
              )}

              {/* FORMULARIO LÍDER DE GRUPO */}
              {mostrarFormularioLider && (
                <HospitalGroupLeaderForm
                  grupo={grupoSeleccionado}
                  miembros={miembros.filter((m) => m.estado === "Activo")}
                  onAsignar={handleAsignarLider}
                  onCancelar={() => {
                    setMostrarFormularioLider(false);
                    setGrupoSeleccionado(null);
                  }}
                />
              )}

              {/* CONTENIDO SEGÚN TAB */}
              {!mostrarFormularioGrupo && !mostrarFormularioLider && (
                <>
                  {activeTab === "grupos" && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                            <UsersRound className="h-5 w-5 mr-2 text-indigo-600" />
                            Grupos de {hospitalInfo?.nombre || "..."}
                          </h3>
                        </div>
                      </div>

                      {/* Vista de grupos en formato de tarjetas */}
                      {gruposFiltrados.length > 0 ? (
                        <div className="p-4">
                          <div className="grid grid-cols-1 gap-4">
                            {gruposPagina.map((grupo) => (
                              <div
                                key={grupo.id}
                                className="border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
                              >
                                <div className="p-5 border-b">
                                  <div className="flex items-center">
                                    <div className="p-3 bg-indigo-50 rounded-lg mr-4 shadow-sm">
                                      {getGrupoIcon(grupo.nombre)}
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="text-xl font-semibold text-gray-800">
                                        {grupo.nombre}
                                      </h3>
                                      <div
                                        className={`flex items-center mt-2 px-4 py-2 rounded-md shadow-sm transition-all duration-300 ${
                                          grupo.lider
                                            ? "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
                                            : "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                                        }`}
                                      >
                                        <span
                                          className={`text-sm font-medium mr-2 ${
                                            grupo.lider
                                              ? "text-amber-700"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          Líder
                                        </span>
                                        {grupo.lider ? (
                                          <div className="flex items-center">
                                            <Star className="h-5 w-5 text-amber-500 mr-2" />
                                            <span className="font-semibold text-amber-800">
                                              {grupo.lider.nombre}
                                            </span>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              handleMostrarFormularioLider(
                                                grupo
                                              )
                                            }
                                            className="flex items-center bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-md hover:from-orange-500 hover:to-orange-600 transition-all duration-300 shadow-sm"
                                          >
                                            <Star className="h-4 w-4 mr-1" />
                                            <span className="font-medium">
                                              Asignar Líder
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <span
                                        className={`px-3 py-1.5 inline-flex items-center text-sm font-semibold rounded-full shadow-sm ${
                                          grupo.activo
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-gray-100 text-gray-800 border border-gray-200"
                                        }`}
                                      >
                                        {grupo.activo ? "Activo" : "Inactivo"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
                                  <div className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                      DESCRIPCIÓN
                                    </div>
                                    <div className="mt-2 text-gray-700">
                                      {grupo.descripcion}
                                    </div>
                                  </div>
                                  <div className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                      MIEMBROS
                                    </div>
                                    <div className="mt-2 font-semibold text-indigo-700 text-lg">
                                      {grupo.totalMiembros}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      <Calendar className="h-3 w-3 inline mr-1" />
                                      Creado: {grupo.fechaCreacion}
                                    </div>
                                  </div>
                                  <div className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                      ESTADO
                                    </div>
                                    <div className="mt-2">
                                      <span
                                        className={`px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${
                                          grupo.activo
                                            ? "bg-green-100 text-green-800 border border-green-200"
                                            : "bg-gray-100 text-gray-800 border border-gray-200"
                                        }`}
                                      >
                                        {grupo.activo ? "Activo" : "Inactivo"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                                      ACCIONES
                                    </div>
                                    <div className="mt-2 flex space-x-3">
                                      <button
                                        onClick={() =>
                                          handleMostrarFormularioGrupo(grupo)
                                        }
                                        className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100"
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Editar
                                      </button>
                                      {!grupo.lider && (
                                        <button
                                          onClick={() =>
                                            handleMostrarFormularioLider(grupo)
                                          }
                                          className="text-amber-600 hover:text-amber-800 transition-colors flex items-center bg-amber-50 px-3 py-1.5 rounded-md hover:bg-amber-100"
                                        >
                                          <Star className="h-4 w-4 mr-1" />
                                          Asignar Líder
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Controles de paginación */}
                          {totalPaginasGrupos > 1 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between mt-4 rounded-b-lg">
                              <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                  onClick={() =>
                                    setPaginaActual((p) => Math.max(p - 1, 1))
                                  }
                                  disabled={paginaActual === 1}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Anterior
                                </button>
                                <button
                                  onClick={() =>
                                    setPaginaActual((p) =>
                                      Math.min(p + 1, totalPaginasGrupos)
                                    )
                                  }
                                  disabled={paginaActual === totalPaginasGrupos}
                                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Siguiente
                                </button>
                              </div>
                              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    Mostrando{" "}
                                    <span className="font-medium">
                                      {indexInicioGrupos + 1}
                                    </span>{" "}
                                    a{" "}
                                    <span className="font-medium">
                                      {Math.min(
                                        indexFinGrupos,
                                        gruposFiltrados.length
                                      )}
                                    </span>{" "}
                                    de{" "}
                                    <span className="font-medium">
                                      {gruposFiltrados.length}
                                    </span>{" "}
                                    resultados
                                  </p>
                                </div>
                                <div>
                                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                      onClick={() =>
                                        setPaginaActual((p) =>
                                          Math.max(p - 1, 1)
                                        )
                                      }
                                      disabled={paginaActual === 1}
                                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span className="sr-only">Anterior</span>
                                      <ChevronRight className="h-5 w-5 transform rotate-180" />
                                    </button>
                                    {/* Números de página */}
                                    {Array.from(
                                      {
                                        length: Math.min(5, totalPaginasGrupos),
                                      },
                                      (_, i) => {
                                        let pageNum;
                                        if (totalPaginasGrupos <= 5) {
                                          pageNum = i + 1;
                                        } else if (paginaActual <= 3) {
                                          pageNum = i + 1;
                                        } else if (
                                          paginaActual >=
                                          totalPaginasGrupos - 2
                                        ) {
                                          pageNum = totalPaginasGrupos - 4 + i;
                                        } else {
                                          pageNum = paginaActual - 2 + i;
                                        }
                                        return (
                                          <button
                                            key={i}
                                            onClick={() =>
                                              setPaginaActual(pageNum)
                                            }
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                              pageNum === paginaActual
                                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                            }`}
                                          >
                                            {pageNum}
                                          </button>
                                        );
                                      }
                                    )}
                                    <button
                                      onClick={() =>
                                        setPaginaActual((p) =>
                                          Math.min(p + 1, totalPaginasGrupos)
                                        )
                                      }
                                      disabled={
                                        paginaActual === totalPaginasGrupos
                                      }
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
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No hay grupos que coincidan con la búsqueda.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "miembros" && (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-indigo-600" />
                          Miembros de {hospitalInfo?.nombre || "..."}
                        </h3>
                      </div>

                      {miembros.length > 0 ? (
                        <div className="p-6">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CURP
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Teléfono
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grupos
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rol
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {miembrosPagina.map((miembro) => (
                                  <tr
                                    key={miembro.id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {miembro.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {miembro.curp}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {miembro.telefono}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-wrap gap-1">
                                        {miembro.grupos.map((grupo, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800"
                                          >
                                            {grupo}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {miembro.esLider ? (
                                        <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                          <Star className="h-3 w-3 mr-1" />
                                          Líder
                                        </span>
                                      ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                          Miembro
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Paginación para miembros */}
                          {totalPaginasMiembros > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                  onClick={() =>
                                    setPaginaActual((p) => Math.max(p - 1, 1))
                                  }
                                  disabled={paginaActual === 1}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Anterior
                                </button>
                                <button
                                  onClick={() =>
                                    setPaginaActual((p) =>
                                      Math.min(p + 1, totalPaginasMiembros)
                                    )
                                  }
                                  disabled={
                                    paginaActual === totalPaginasMiembros
                                  }
                                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Siguiente
                                </button>
                              </div>
                              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    Mostrando{" "}
                                    <span className="font-medium">
                                      {indexInicioMiembros + 1}
                                    </span>{" "}
                                    a{" "}
                                    <span className="font-medium">
                                      {Math.min(
                                        indexFinMiembros,
                                        miembros.length
                                      )}
                                    </span>{" "}
                                    de{" "}
                                    <span className="font-medium">
                                      {miembros.length}
                                    </span>{" "}
                                    resultados
                                  </p>
                                </div>
                                <div>
                                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                      onClick={() =>
                                        setPaginaActual((p) =>
                                          Math.max(p - 1, 1)
                                        )
                                      }
                                      disabled={paginaActual === 1}
                                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span className="sr-only">Anterior</span>
                                      <ChevronRight className="h-5 w-5 transform rotate-180" />
                                    </button>
                                    {Array.from(
                                      {
                                        length: Math.min(
                                          5,
                                          totalPaginasMiembros
                                        ),
                                      },
                                      (_, i) => {
                                        let pageNum;
                                        if (totalPaginasMiembros <= 5) {
                                          pageNum = i + 1;
                                        } else if (paginaActual <= 3) {
                                          pageNum = i + 1;
                                        } else if (
                                          paginaActual >=
                                          totalPaginasMiembros - 2
                                        ) {
                                          pageNum =
                                            totalPaginasMiembros - 4 + i;
                                        } else {
                                          pageNum = paginaActual - 2 + i;
                                        }
                                        return (
                                          <button
                                            key={i}
                                            onClick={() =>
                                              setPaginaActual(pageNum)
                                            }
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                              pageNum === paginaActual
                                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                            }`}
                                          >
                                            {pageNum}
                                          </button>
                                        );
                                      }
                                    )}
                                    <button
                                      onClick={() =>
                                        setPaginaActual((p) =>
                                          Math.min(p + 1, totalPaginasMiembros)
                                        )
                                      }
                                      disabled={
                                        paginaActual === totalPaginasMiembros
                                      }
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
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          No hay miembros registrados todavía.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
