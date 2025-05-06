"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Hospital,
  LogOut,
  Plus,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import EstadoStatsCard from "../components/estado/EstadoStatsCard";
import EstadoHospitalAdminForm from "../components/estado/EstadoHospitalAdminForm";

export default function EstadoAdminDashboard() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [hospitales, setHospitales] = useState([]);
  const [administradores, setAdministradores] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]);
  const [activeTab, setActiveTab] = useState("hospitales");
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [paginaActual, setPaginaActual] = useState(1);
  const hospitalesPorPagina = 20;
  const adminsPorPagina = 10;
  const [hospitalFiltro, setHospitalFiltro] = useState("");
  const [hospitalesFiltradosPorHospital, setHospitalesFiltradosPorHospital] =
    useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [estadoActual, setEstadoActual] = useState("Ciudad de México"); // Esto vendría de la autenticación

  // Cambiar los colores de verde a azul en todo el dashboard
  // Cambiar el gradiente del sidebar
  const sidebarClass = `${
    sidebarOpen ? "w-64" : "w-20"
  } bg-gradient-to-b from-blue-800 to-blue-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen fixed`;

  // Cambiar los colores de los botones hover en el sidebar
  const sidebarButtonClass = `flex items-center py-3 px-4 hover:bg-blue-700 ${
    !mostrarFormulario && !mostrarFormAdmin && activeTab === "hospitales"
      ? "bg-blue-700"
      : ""
  } ${!sidebarOpen ? "justify-center" : ""}`;

  // Cambiar el color del botón de cerrar sesión
  const logoutButtonClass = `flex items-center py-3 px-4 hover:bg-red-700 text-red-100 ${
    !sidebarOpen ? "justify-center" : ""
  }`;

  // Cambiar el color de los botones de acción
  const actionButtonClass =
    "flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors";

  // Cambiar el color de los botones de guardar
  const saveButtonClass =
    "flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700";

  // Cambiar el color de los iconos
  const iconClass = "h-5 w-5 mr-2 text-blue-600";

  // Cambiar el color de los botones de paginación activos
  const activePageButtonClass = "z-10 bg-blue-50 border-blue-500 text-blue-600";

  // Simular carga de datos
  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        // En una implementación real, esto vendría de tu API
        const mockHospitales = [
          {
            id: 1,
            nombre: "Hospital General Regional",
            tipoUnidad: "HOSPITAL",
            region: "Norte",
            geocerca: { lat: 19.4326, lng: -99.1332, radio: 200 },
            empleadosActivos: 24,
            empleadosInactivos: 3,
          },
          {
            id: 2,
            nombre: "Clínica Familiar #42",
            tipoUnidad: "CLINICA",
            region: "Centro",
            geocerca: { lat: 19.4361, lng: -99.1478, radio: 150 },
            empleadosActivos: 12,
            empleadosInactivos: 1,
          },
          {
            id: 3,
            nombre: "IMSS Bienestar Zona Rural",
            tipoUnidad: "IMMS BIENESTAR",
            region: "Sur",
            geocerca: { lat: 19.42, lng: -99.1509, radio: 180 },
            empleadosActivos: 18,
            empleadosInactivos: 2,
          },
        ];

        setHospitales(mockHospitales);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
      }
    };

    const fetchAdministradores = async () => {
      try {
        // En una implementación real, esto vendría de tu API
        const mockAdmins = [
          {
            id: 1,
            nombre: "Juan Pérez",
            ap_paterno: "Pérez",
            ap_materno: "García",
            curp_user: "PEGJ901231HDFRRN09",
            hospital: "Hospital General Regional",
            role_name: "hospitaladmin",
          },
          {
            id: 2,
            nombre: "María",
            ap_paterno: "López",
            ap_materno: "Sánchez",
            curp_user: "LOSM850617MDFPNR03",
            hospital: "Clínica Familiar #42",
            role_name: "hospitaladmin",
          },
        ];

        setAdministradores(mockAdmins);
      } catch (error) {
        console.error("Error al obtener administradores:", error);
      }
    };

    const fetchEmpleados = async () => {
      try {
        // En una implementación real, esto vendría de tu API
        const mockEmpleados = [
          {
            id: 1,
            nombre: "Ana García",
            curp: "GARA900517MDFNRN09",
            telefono: "5512345678",
            hospital: "Hospital General Regional",
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
            hospital: "Clínica Familiar #42",
            estado: "Activo",
            ultimaUbicacion: { lat: 19.4361, lng: -99.1478 },
            horaEntrada: "09:00",
            horaSalida: "17:00",
            enGeocerca: true,
          },
          {
            id: 3,
            nombre: "Laura Sánchez",
            curp: "SARL910823MDFNCR07",
            telefono: "5523456789",
            hospital: "IMSS Bienestar Zona Rural",
            estado: "Inactivo",
            ultimaUbicacion: { lat: 19.415, lng: -99.16 },
            horaEntrada: "08:30",
            horaSalida: "16:45",
            enGeocerca: false,
          },
        ];

        setEmpleados(mockEmpleados);
      } catch (error) {
        console.error("Error al obtener empleados:", error);
      }
    };

    fetchHospitales();
    fetchAdministradores();
    fetchEmpleados();
  }, []);

  const handleMostrarFormulario = () => {
    setMostrarFormulario(true);
    setMostrarFormAdmin(false);
  };

  const handleMostrarFormAdmin = () => {
    setMostrarFormAdmin(true);
    setMostrarFormulario(false);
  };

  const handleInicio = () => {
    setMostrarFormulario(false);
    setMostrarFormAdmin(false);
    setActiveTab("hospitales");
  };

  // Manejador para guardar un administrador de hospital
  const handleGuardarAdmin = async (nuevoAdmin) => {
    try {
      // En una implementación real, esto sería una llamada a tu API
      // const response = await fetch("http://localhost:4000/api/estadoadmin/create-hospitaladmin", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(nuevoAdmin),
      // })

      // Simulamos una respuesta exitosa
      const data = { message: "Administrador creado con éxito" };

      alert(
        `✅ ${data.message}\n🆔 Usuario: ${nuevoAdmin.user}\n🔑 Contraseña: ${nuevoAdmin.pass}`
      );

      // Actualizar la lista de administradores
      setAdministradores([
        ...administradores,
        {
          id: administradores.length + 1,
          nombre: nuevoAdmin.nombre,
          ap_paterno: nuevoAdmin.ap_paterno,
          ap_materno: nuevoAdmin.ap_materno,
          curp_user: nuevoAdmin.CURP,
          hospital: nuevoAdmin.hospital,
          role_name: "hospitaladmin",
        },
      ]);

      setMostrarFormAdmin(false);
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error al crear el administrador.");
    }
  };

  // FILTRO y PAGINADO para hospitales
  const hospitalesFiltrados = hospitalFiltro
    ? hospitales.filter((h) =>
        h.nombre.toLowerCase().includes(hospitalFiltro.toLowerCase())
      )
    : hospitales;

  const indexInicioHospitales = (paginaActual - 1) * hospitalesPorPagina;
  const indexFinHospitales = indexInicioHospitales + hospitalesPorPagina;
  const hospitalesPagina = hospitalesFiltrados.slice(
    indexInicioHospitales,
    indexFinHospitales
  );

  const totalPaginasHospitales = Math.ceil(
    hospitalesFiltrados.length / hospitalesPorPagina
  );

  // FILTRO y PAGINADO para administradores
  const indexInicioAdmins = (paginaActual - 1) * adminsPorPagina;
  const indexFinAdmins = indexInicioAdmins + adminsPorPagina;
  const adminsPagina = administradores.slice(indexInicioAdmins, indexFinAdmins);

  const totalPaginasAdmins = Math.ceil(
    administradores.length / adminsPorPagina
  );

  // Estadísticas para las tarjetas
  const estadisticas = {
    totalHospitales: hospitales.length,
    totalAdministradores: administradores.length,
    totalEmpleados: empleados.length,
    empleadosActivos: empleados.filter((e) => e.estado === "Activo").length,
    empleadosFueraGeocerca: empleados.filter(
      (e) => !e.enGeocerca && e.estado === "Activo"
    ).length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className={sidebarClass}>
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
            className="text-white p-1 rounded-full hover:bg-blue-700"
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
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="font-medium text-sm">Administrador</p>
                <p className="text-xs text-blue-200">{estadoActual}</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <div className="mt-6 flex flex-col flex-1">
          <button
            onClick={() => {
              handleInicio();
              setActiveTab("hospitales");
            }}
            className={`flex items-center py-3 px-4 hover:bg-blue-700 ${
              !mostrarFormulario &&
              !mostrarFormAdmin &&
              activeTab === "hospitales"
                ? "bg-blue-700"
                : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Hospital className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Hospitales</span>}
          </button>

          <button
            onClick={() => {
              handleInicio();
              setActiveTab("administradores");
            }}
            className={`flex items-center py-3 px-4 hover:bg-blue-700 ${
              !mostrarFormulario &&
              !mostrarFormAdmin &&
              activeTab === "administradores"
                ? "bg-blue-700"
                : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Users className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Administradores</span>}
          </button>

          <button
            onClick={handleMostrarFormAdmin}
            className={`flex items-center py-3 px-4 hover:bg-blue-700 ${
              mostrarFormAdmin ? "bg-blue-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Building2 className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Crear Admin</span>}
          </button>

          <div className="mt-auto">
            <button
              onClick={() => {
                localStorage.removeItem("isAuthenticated");
                localStorage.removeItem("userRole");
                setIsAuthenticated(false);
                navigate("/");
              }}
              className={logoutButtonClass}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="ml-3">Cerrar sesión</span>}
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
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
              {mostrarFormAdmin
                ? "Crear Administrador de Hospital"
                : activeTab === "hospitales"
                ? "Hospitales del Estado"
                : "Administradores de Hospital"}
            </h1>
            <div className="flex space-x-2">
              {!mostrarFormulario && !mostrarFormAdmin && (
                <>
                  {activeTab === "hospitales" && (
                    <div className="relative">
                      <input
                        type="search"
                        placeholder="Buscar hospital..."
                        className="px-4 py-2 border rounded-lg"
                        value={hospitalFiltro}
                        onChange={(e) => setHospitalFiltro(e.target.value)}
                      />
                    </div>
                  )}
                  {activeTab === "administradores" && (
                    <button
                      onClick={handleMostrarFormAdmin}
                      className={actionButtonClass}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Admin
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
          {!mostrarFormulario && !mostrarFormAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <EstadoStatsCard
                title="Total Hospitales"
                value={estadisticas.totalHospitales}
                icon={<Hospital className="h-8 w-8 text-blue-600" />}
                description={`Hospitales en ${estadoActual}`}
                color="blue"
              />
              <EstadoStatsCard
                title="Administradores"
                value={estadisticas.totalAdministradores}
                icon={<Users className="h-8 w-8 text-purple-600" />}
                description="Administradores de hospital"
                color="purple"
              />
            </div>
          )}

          {/* FORMULARIO ADMINISTRADOR DE HOSPITAL */}
          {mostrarFormAdmin && (
            <EstadoHospitalAdminForm
              hospitales={hospitales}
              onGuardar={handleGuardarAdmin}
              onCancelar={() => setMostrarFormAdmin(false)}
            />
          )}

          {/* CONTENIDO SEGÚN TAB */}
          {!mostrarFormulario && !mostrarFormAdmin && (
            <>
              {activeTab === "hospitales" && (
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <Hospital className={iconClass} />
                        Hospitales en {estadoActual}
                      </h3>
                    </div>
                  </div>

                  {/* Tabla de hospitales */}
                  {hospitalesFiltrados.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wide">
                              <th className="w-1/4 px-6 py-3">Nombre</th>
                              <th className="w-1/6 px-6 py-3">Tipo</th>
                              <th className="w-1/6 px-6 py-3">Región</th>
                              <th className="w-1/6 px-6 py-3">
                                Empleados Activos
                              </th>
                              <th className="w-1/6 px-6 py-3">
                                Empleados Inactivos
                              </th>
                              <th className="w-1/6 px-6 py-3">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {hospitalesPagina.map((h, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-4 truncate">
                                  {h.nombre}
                                </td>
                                <td className="px-6 py-4">{h.tipoUnidad}</td>
                                <td className="px-6 py-4">{h.region}</td>
                                <td className="px-6 py-4">
                                  {h.empleadosActivos}
                                </td>
                                <td className="px-6 py-4">
                                  {h.empleadosInactivos}
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => {
                                      // Aquí iría la lógica para ver detalles del hospital
                                    }}
                                    className="text-blue-600 hover:text-blue-800 transition-colors flex items-center text-sm"
                                  >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Ver Detalles
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Controles de paginación */}
                      {totalPaginasHospitales > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
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
                                  Math.min(p + 1, totalPaginasHospitales)
                                )
                              }
                              disabled={paginaActual === totalPaginasHospitales}
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
                                  {indexInicioHospitales + 1}
                                </span>{" "}
                                a{" "}
                                <span className="font-medium">
                                  {Math.min(
                                    indexFinHospitales,
                                    hospitalesFiltrados.length
                                  )}
                                </span>{" "}
                                de{" "}
                                <span className="font-medium">
                                  {hospitalesFiltrados.length}
                                </span>{" "}
                                resultados
                              </p>
                            </div>
                            <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                  onClick={() =>
                                    setPaginaActual((p) => Math.max(p - 1, 1))
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
                                    length: Math.min(5, totalPaginasHospitales),
                                  },
                                  (_, i) => {
                                    let pageNum;
                                    if (totalPaginasHospitales <= 5) {
                                      pageNum = i + 1;
                                    } else if (paginaActual <= 3) {
                                      pageNum = i + 1;
                                    } else if (
                                      paginaActual >=
                                      totalPaginasHospitales - 2
                                    ) {
                                      pageNum = totalPaginasHospitales - 4 + i;
                                    } else {
                                      pageNum = paginaActual - 2 + i;
                                    }
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => setPaginaActual(pageNum)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                          pageNum === paginaActual
                                            ? activePageButtonClass
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
                                      Math.min(p + 1, totalPaginasHospitales)
                                    )
                                  }
                                  disabled={
                                    paginaActual === totalPaginasHospitales
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
                    </>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No hay hospitales que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "administradores" && (
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Users className={iconClass} />
                      Administradores de Hospital
                    </h3>
                  </div>

                  {administradores.length > 0 ? (
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Apellido paterno
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Apellido materno
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                CURP
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Hospital
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rol
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {adminsPagina.map((admin, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {admin.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {admin.ap_paterno}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {admin.ap_materno}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {admin.curp_user}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {admin.hospital}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                    {admin.role_name}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Paginación para administradores */}
                      {totalPaginasAdmins > 1 && (
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
                                  Math.min(p + 1, totalPaginasAdmins)
                                )
                              }
                              disabled={paginaActual === totalPaginasAdmins}
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
                                  {indexInicioAdmins + 1}
                                </span>{" "}
                                a{" "}
                                <span className="font-medium">
                                  {Math.min(
                                    indexFinAdmins,
                                    administradores.length
                                  )}
                                </span>{" "}
                                de{" "}
                                <span className="font-medium">
                                  {administradores.length}
                                </span>{" "}
                                resultados
                              </p>
                            </div>
                            <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                  onClick={() =>
                                    setPaginaActual((p) => Math.max(p - 1, 1))
                                  }
                                  disabled={paginaActual === 1}
                                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="sr-only">Anterior</span>
                                  <ChevronRight className="h-5 w-5 transform rotate-180" />
                                </button>
                                {Array.from(
                                  { length: Math.min(5, totalPaginasAdmins) },
                                  (_, i) => {
                                    let pageNum;
                                    if (totalPaginasAdmins <= 5) {
                                      pageNum = i + 1;
                                    } else if (paginaActual <= 3) {
                                      pageNum = i + 1;
                                    } else if (
                                      paginaActual >=
                                      totalPaginasAdmins - 2
                                    ) {
                                      pageNum = totalPaginasAdmins - 4 + i;
                                    } else {
                                      pageNum = paginaActual - 2 + i;
                                    }
                                    return (
                                      <button
                                        key={i}
                                        onClick={() => setPaginaActual(pageNum)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                          pageNum === paginaActual
                                            ? activePageButtonClass
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
                                      Math.min(p + 1, totalPaginasAdmins)
                                    )
                                  }
                                  disabled={paginaActual === totalPaginasAdmins}
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
                      No hay administradores registrados todavía.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
