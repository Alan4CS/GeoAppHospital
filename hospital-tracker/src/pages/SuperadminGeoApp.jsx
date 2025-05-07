import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HospitalForm from "../components/admin/HospitalForm";
import AdminForm from "../components/admin/AdminForm";
import {
  Building2,
  ChevronRight,
  Hospital,
  LogOut,
  Map,
  Plus,
  Settings,
  User,
  Users,
} from "lucide-react";
import StatsCard from "../components/admin/StatsCard";

export default function SuperadminGeoApp() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [hospitales, setHospitales] = useState([]);
  const [administradores, setAdministradores] = useState([]);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]);
  const [activeTab, setActiveTab] = useState("hospitales");
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [paginaActual, setPaginaActual] = useState(1);
  const hospitalesPorPagina = 20;
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [hospitalesFiltradosPorEstado, setHospitalesFiltradosPorEstado] =
    useState([]);
  const [editandoHospital, setEditandoHospital] = useState(false);
  const [hospitalEditando, setHospitalEditando] = useState(null);
  const [hospitalIndexEditando, setHospitalIndexEditando] = useState(null);
  const [geocerca, setGeocerca] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const buscarCoordenadasEstado = async (estado) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?country=Mexico&state=${estado}&format=json`
    );
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      setMapCenter([Number.parseFloat(lat), Number.parseFloat(lon)]);
    }
  };

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/superadmin/hospitals"
        );
        const data = await response.json();
        console.log("Hospitales desde la API:", data);

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
        }));

        setHospitales(hospitalesFormateados);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
      }
    };

    fetchHospitales();
  }, []);

  const fetchAdministradores = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/superadmin/estadoadmins"
      );
      const data = await response.json();
      setAdministradores(data);
    } catch (error) {
      console.error("Error al obtener administradores:", error);
    }
  };

  useEffect(() => {
    fetchAdministradores();
  }, []);

  const handleMostrarFormulario = () => {
    setMostrarFormulario(true);
    setMostrarFormAdmin(false);
    setEditandoHospital(false);
    setGeocerca(null);
  };

  const handleMostrarFormAdmin = () => {
    setMostrarFormAdmin(true);
    setMostrarFormulario(false);
  };

  const handleInicio = () => {
    setMostrarFormulario(false);
    setMostrarFormAdmin(false);
    setEditandoHospital(false);
    setHospitalEditando(null);
    setHospitalIndexEditando(null);
    setActiveTab("hospitales");
  };

  // Función para editar un hospital
  const handleEditarHospital = (hospital, index) => {
    setEditandoHospital(true);
    setHospitalEditando(hospital);
    setHospitalIndexEditando(index);
    setMostrarFormulario(true);
    setMostrarFormAdmin(false);

    // Function to normalize state names (convert to title case)
    const normalizeStateName = (stateName) => {
      if (!stateName) return "";
      // Convert state name to title case (first letter uppercase, rest lowercase)
      return stateName
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // Normalize the state name to match the format in the dropdown
    const estadoNormalizado = normalizeStateName(hospital.estado);

    // Verificar que todos los campos tengan valores válidos
    const hospitalProcesado = {
      estado: estadoNormalizado,
      nombre: hospital.nombre || "",
      tipoUnidad: hospital.tipoUnidad || "",
      region: hospital.region || "",
    };

    // Establecer la geocerca
    const geocercaValida =
      hospital.geocerca &&
      typeof hospital.geocerca === "object" &&
      (hospital.geocerca.lat !== undefined ||
        hospital.geocerca.lng !== undefined);

    if (geocercaValida) {
      setGeocerca(hospital.geocerca);
    } else {
      setGeocerca({
        lat: 0,
        lng: 0,
        radio: 0,
      });
    }

    // Ajustar el centro del mapa
    if (geocercaValida && hospital.geocerca.lat && hospital.geocerca.lng) {
      setMapCenter([hospital.geocerca.lat, hospital.geocerca.lng]);
    } else if (hospital.estado) {
      buscarCoordenadasEstado(estadoNormalizado);
    }

    console.log("Editando hospital:", hospitalProcesado);
  };

  // Manejador para guardar un hospital (nuevo o editado)
  const handleGuardarHospital = (nuevoHospital) => {
    if (editandoHospital && hospitalIndexEditando !== null) {
      // Actualizar el hospital existente
      const nuevosHospitales = [...hospitales];
      nuevosHospitales[hospitalIndexEditando] = nuevoHospital;
      setHospitales(nuevosHospitales);
      console.log(
        "Hospital actualizado:",
        nuevosHospitales[hospitalIndexEditando]
      );
    } else {
      // Crear un nuevo hospital
      setHospitales([...hospitales, nuevoHospital]);
      console.log("Nuevo hospital creado:", nuevoHospital);
    }

    // Resetear el estado de edición
    setEditandoHospital(false);
    setHospitalEditando(null);
    setHospitalIndexEditando(null);
    setMostrarFormulario(false);
  };

  // Manejador para guardar un administrador
  const handleGuardarAdmin = async (nuevoAdmin) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/superadmin/create-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nuevoAdmin),
        }
      );

      if (!response.ok) throw new Error("Fallo al crear el administrador");

      const data = await response.json();
      alert(
        `✅ ${data.message}\n🆔 Usuario: ${nuevoAdmin.user}\n🔑 Contraseña: ${nuevoAdmin.pass}`
      );

      // Actualizar la lista de administradores desde la base de datos
      await fetchAdministradores();
      setMostrarFormAdmin(false);
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error al crear el administrador.");
    }
  };

  // FILTRO y PAGINADO
  const hospitalesFiltrados = estadoFiltro
    ? hospitales.filter(
        (h) => h.estado.toLowerCase() === estadoFiltro.toLowerCase()
      )
    : hospitales;

  const indexInicio = (paginaActual - 1) * hospitalesPorPagina;
  const indexFin = indexInicio + hospitalesPorPagina;
  const hospitalesPagina = hospitalesFiltrados.slice(indexInicio, indexFin);

  const totalPaginas = Math.ceil(
    hospitalesFiltrados.length / hospitalesPorPagina
  );

  // Estadísticas para las tarjetas
  const estadisticas = {
    totalHospitales: hospitales.length,
    totalAdministradores: administradores.length,
    totalEstados: [...new Set(hospitales.map((h) => h.estado))].filter(Boolean)
      .length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-emerald-800 to-teal-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen fixed`}
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
            className="text-white p-1 rounded-full hover:bg-emerald-700"
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
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="font-medium text-sm">Administrador</p>
                <p className="text-xs text-emerald-200">Super Admin</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col flex-1">
          <button
            onClick={() => {
              handleInicio();
              setActiveTab("hospitales");
            }}
            className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
              !mostrarFormulario &&
              !mostrarFormAdmin &&
              activeTab === "hospitales"
                ? "bg-emerald-700"
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
            className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
              !mostrarFormulario &&
              !mostrarFormAdmin &&
              activeTab === "administradores"
                ? "bg-emerald-700"
                : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Users className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Administradores</span>}
          </button>

          <button
            onClick={handleMostrarFormulario}
            className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
              mostrarFormulario ? "bg-emerald-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <Building2 className="h-5 w-5" />
            {sidebarOpen && <span className="ml-3">Crear Hospital</span>}
          </button>

          <button
            onClick={handleMostrarFormAdmin}
            className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
              mostrarFormAdmin ? "bg-emerald-700" : ""
            } ${!sidebarOpen ? "justify-center" : ""}`}
          >
            <User className="h-5 w-5" />
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
              {mostrarFormulario
                ? editandoHospital
                  ? "Editar Hospital"
                  : "Crear Hospital"
                : mostrarFormAdmin
                ? "Crear Administrador"
                : activeTab === "hospitales"
                ? "Gestión de Hospitales"
                : "Gestión de Administradores"}
            </h1>
            <div className="flex space-x-2"></div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="p-6">
          {/* TARJETAS DE ESTADÍSTICAS */}
          {!mostrarFormulario && !mostrarFormAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                description="Administradores estatales activos"
                color="blue"
              />
              <StatsCard
                title="Estados Cubiertos"
                value={estadisticas.totalEstados}
                icon={<Map className="h-8 w-8 text-purple-600" />}
                description="Estados con presencia hospitalaria"
                color="purple"
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
                setMostrarFormulario(false);
                setEditandoHospital(false);
                setHospitalEditando(null);
                setHospitalIndexEditando(null);
              }}
            />
          )}

          {/* FORMULARIO ADMINISTRADOR */}
          {mostrarFormAdmin && (
            <AdminForm
              hospitales={hospitales}
              onGuardar={handleGuardarAdmin}
              onCancelar={() => setMostrarFormAdmin(false)}
              setHospitalesFiltradosPorEstado={setHospitalesFiltradosPorEstado}
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
                        <Hospital className="h-5 w-5 mr-2 text-emerald-600" />
                        Hospitales registrados
                      </h3>

                      {/* Filtro por estado */}
                      <div className="flex items-center">
                        <label className="text-gray-700 font-medium mr-2">
                          Filtrar por estado:
                        </label>
                        <select
                          value={estadoFiltro}
                          onChange={(e) => {
                            setEstadoFiltro(e.target.value);
                            setPaginaActual(1);
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
                        <table className="w-full table-fixed text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-left font-semibold text-gray-600 uppercase tracking-wide">
                              <th className="w-1/5 px-2 py-2">Nombre</th>
                              <th className="w-1/12 px-2 py-2">Estado</th>
                              <th className="w-1/12 px-2 py-2">Tipo</th>
                              <th className="w-1/5 px-2 py-2">Región</th>
                              <th className="w-1/12 px-2 py-2">Lat</th>
                              <th className="w-1/12 px-2 py-2">Lng</th>
                              <th className="w-1/12 px-2 py-2">Radio</th>
                              <th className="w-1/12 px-2 py-2">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {hospitalesPagina.map((h, i) => {
                              const indiceReal = indexInicio + i;
                              return (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-2 py-2 truncate">
                                    {h.nombre}
                                  </td>
                                  <td className="px-2 py-2">{h.estado}</td>
                                  <td className="px-2 py-2">{h.tipoUnidad}</td>
                                  <td className="px-2 py-2 truncate">
                                    {h.region}
                                  </td>
                                  <td className="px-2 py-2">
                                    {h.geocerca?.lat?.toFixed(4) ?? "N/A"}
                                  </td>
                                  <td className="px-2 py-2">
                                    {h.geocerca?.lng?.toFixed(4) ?? "N/A"}
                                  </td>
                                  <td className="px-2 py-2">
                                    {h.geocerca?.radio ?? "N/A"}
                                  </td>
                                  <td className="px-2 py-2">
                                    <button
                                      onClick={() =>
                                        handleEditarHospital(h, indiceReal)
                                      }
                                      className="text-emerald-600 hover:text-emerald-800 transition-colors flex items-center text-xs"
                                    >
                                      <Settings className="h-3 w-3 mr-1" />
                                      Editar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Controles de paginación */}
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
                                Math.min(p + 1, totalPaginas)
                              )
                            }
                            disabled={paginaActual === totalPaginas}
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
                                {indexInicio + 1}
                              </span>{" "}
                              a{" "}
                              <span className="font-medium">
                                {Math.min(indexFin, hospitalesFiltrados.length)}
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
                                { length: Math.min(5, totalPaginas) },
                                (_, i) => {
                                  let pageNum;
                                  if (totalPaginas <= 5) {
                                    pageNum = i + 1;
                                  } else if (paginaActual <= 3) {
                                    pageNum = i + 1;
                                  } else if (paginaActual >= totalPaginas - 2) {
                                    pageNum = totalPaginas - 4 + i;
                                  } else {
                                    pageNum = paginaActual - 2 + i;
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
                                  );
                                }
                              )}
                              <button
                                onClick={() =>
                                  setPaginaActual((p) =>
                                    Math.min(p + 1, totalPaginas)
                                  )
                                }
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
                    <div className="p-6 text-center text-gray-500">
                      No hay hospitales registrados.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "administradores" && (
                <div className="bg-white shadow-md rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Administradores registrados
                    </h3>
                  </div>

                  {administradores.length > 0 ? (
                    <div className="p-6 space-y-8">
                      {[
                        ...new Set(
                          administradores.map((a) => a.estado || "Sin estado")
                        ),
                      ]
                        .sort()
                        .map((estadoNombre) => {
                          const adminsDelEstado = administradores.filter(
                            (a) => (a.estado || "Sin estado") === estadoNombre
                          );
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
                                        Rol
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {adminsDelEstado.map((admin, i) => (
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
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {admin.role_name}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
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
