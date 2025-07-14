import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HospitalForm from "../components/admin/HospitalForm";
import AdminForm from "../components/admin/AdminForm";
import SuperadminSidebar from "../components/admin/SuperadminSidebar";
import GrupoForm from "../components/admin/GrupoForm";
import SubidaMasivaEmpleados from "../components/admin/SubidaMasivaEmpleados";
import EmpleadoForm from "../components/admin/EmpleadoForm";
import {
  Hospital,
  Map,
  Plus,
  Users,
  UsersRound,
  UserPlus,
  X,
} from "lucide-react";
import StatsCard from "../components/admin/StatsCard";
import MonitoreoMap from "../components/admin/MonitoreoMap";
import MonitoreoConfig from "../components/admin/MonitoreoConfig";
import MonitoreoDashboard from "../components/dashboard/MonitoreoDashboard";
import HospitalList from "../components/lists/HospitalList";
import AdministradorList from "../components/lists/AdministradorList";
import GrupoList from "../components/lists/GrupoList";
import EmpleadoList from "../components/lists/EmpleadoList";
import { set } from "lodash";
import sendCredentialsEmail from '../helpers/emailHelper';

export default function SuperadminGeoApp() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [hospitales, setHospitales] = useState([]);
  const [administradores, setAdministradores] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]);
  const [activeTab, setActiveTab] = useState("hospitales");
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false);
  const [mostrarSubidaMasivaEmpleados, setMostrarSubidaMasivaEmpleados] = useState(false);
  const [mostrarCredenciales, setMostrarCredenciales] = useState(false);
  const [credencialesGeneradas, setCredencialesGeneradas] = useState(null);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [paginaActual, setPaginaActual] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tipoAdminFiltro, setTipoAdminFiltro] = useState("");
  const [hospitalesFiltradosPorEstado, setHospitalesFiltradosPorEstado] =
    useState([]);
  const [editandoHospital, setEditandoHospital] = useState(false);
  const [hospitalEditando, setHospitalEditando] = useState(null);
  const [hospitalIndexEditando, setHospitalIndexEditando] = useState(null);
  const [geocerca, setGeocerca] = useState(null);
  const [estados, setEstados] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [busquedaAdmin, setBusquedaAdmin] = useState("");
  const [estadoAdminFiltro, setEstadoAdminFiltro] = useState("");
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [estadoEmpleadoFiltro, setEstadoEmpleadoFiltro] = useState("");
  const [rolEmpleadoFiltro, setRolEmpleadoFiltro] = useState("");

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
          "https://geoapphospital-b0yr.onrender.com/api/superadmin/hospitals"
        );
        const data = await response.json();
        const hospitalesFormateados = data.map((h) => ({
          nombre: (h.nombre_hospital || "").replace(/\s+/g, " ").trim(),
          estado: (h.estado || "").trim(),
          municipio: (h.municipio || h.nombre_municipio || "").trim(),
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

    const fetchEstados = async () => {
      try {
        const response = await fetch(
          "https://geoapphospital-b0yr.onrender.com/api/superadmin/estados"
        );
        const data = await response.json();
        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };

    fetchHospitales();
    fetchEstados();
  }, []);

  const fetchAdministradores = async () => {
    try {
      const response = await fetch(
        "https://geoapphospital-b0yr.onrender.com/api/superadmin/totaladmins"
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

  const fetchGrupos = async () => {
    try {
      const response = await fetch(
        "https://geoapphospital-b0yr.onrender.com/api/groups/get-groups"
      );
      if (!response.ok) {
        throw new Error("Error al obtener grupos");
      }

      const data = await response.json();

      const gruposFormateados = data.map((g) => ({
        id_group: g.id_group,
        nombre_grupo: g.nombre_grupo,
        descripcion_group: g.descripcion_group,
        id_hospital: g.id_hospital,
        nombre_hospital: g.nombre_hospital,
        nombre_estado: g.nombre_estado,
        nombre_municipio: g.nombre_municipio || "-",
      }));

      setGrupos(gruposFormateados);

      // Actualizar también la lista de empleados
      try {
        const empleadosResponse = await fetch(
          "https://geoapphospital-b0yr.onrender.com/api/employees/get-empleados"
        );
        if (empleadosResponse.ok) {
          const empleadosData = await empleadosResponse.json();
          setEmpleados(empleadosData);
        }
      } catch (empleadosError) {
        console.error("Error al obtener empleados:", empleadosError);
      }
    } catch (err) {
      console.error("❌ Error al obtener grupos:", err);
      alert("Error al obtener la lista de grupos");
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  // Función para resetear todos los estados de formularios
  const resetearFormularios = () => {
    setMostrarFormulario(false);
    setMostrarFormAdmin(false);
    setMostrarFormGrupo(false);
    setMostrarFormEmpleado(false);
    setMostrarSubidaMasivaEmpleados(false);
    setEditandoHospital(false);
    setHospitalEditando(null);
    setHospitalIndexEditando(null);
  };

  const handleMostrarFormulario = () => {
    resetearFormularios();
    setMostrarFormulario(true);
    setGeocerca(null);
  };

  const handleMostrarFormAdmin = () => {
    resetearFormularios();
    setMostrarFormAdmin(true);
  };

  const handleMostrarFormGrupo = () => {
    resetearFormularios();
    setMostrarFormGrupo(true);
  };

  const handleMostrarSubidaMasivaEmpleados = () => {
    resetearFormularios();
    setMostrarSubidaMasivaEmpleados(true);
  };

  const handleMostrarFormEmpleado = () => {
    resetearFormularios();
    setMostrarFormEmpleado(true);
  };

  const handleInicio = () => {
    resetearFormularios();
  };

  // Función para editar un hospital
  const handleEditarHospital = (hospital, index) => {
    // Solo cerrar otros formularios, no resetear el estado de edición de hospital
    setMostrarFormAdmin(false);
    setMostrarFormGrupo(false);
    setMostrarFormEmpleado(false);
    setMostrarSubidaMasivaEmpleados(false);
    
    // Buscar el ID del estado basándose en el nombre
    const estadoEncontrado = estados.find(estado => 
      estado.nombre_estado.toLowerCase().trim() === hospital.estado.toLowerCase().trim()
    );
    
    // Crear el objeto hospital con el ID del estado correcto
    const hospitalConIdEstado = {
      ...hospital,
      estado: estadoEncontrado ? estadoEncontrado.id_estado : hospital.estado,
      municipio: hospital.municipio || ""
    };
    
    // Configurar el estado para editar hospital
    setEditandoHospital(true);
    setHospitalEditando(hospitalConIdEstado);
    setHospitalIndexEditando(index);
    setMostrarFormulario(true);

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
      // Usar el nombre original del estado para buscar coordenadas
      buscarCoordenadasEstado(hospital.estado);
    }
  };

  // Manejador para guardar un hospital (nuevo o editado)
  const handleGuardarHospital = (nuevoHospital) => {
    if (editandoHospital && hospitalIndexEditando !== null) {
      // Actualizar el hospital existente
      const nuevosHospitales = [...hospitales];
      nuevosHospitales[hospitalIndexEditando] = nuevoHospital;
      setHospitales(nuevosHospitales);
    } else {
      // Crear un nuevo hospital
      setHospitales([...hospitales, nuevoHospital]);
    }

    // Resetear el estado de edición
    resetearFormularios();
    setActiveTab("hospitales");
  };

  // Función para copiar al portapapeles
  const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto).then(
      () => {
        // Crear un elemento de notificación
        const notificacion = document.createElement("div");
        notificacion.className =
          "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
        notificacion.textContent = "✓ Copiado al portapapeles";
        document.body.appendChild(notificacion);

        // Eliminar la notificación después de 2 segundos
        setTimeout(() => {
          notificacion.remove();
        }, 2000);
      },
      (err) => {
        console.error("Error al copiar: ", err);
        // Mostrar error de manera sutil
        const notificacion = document.createElement("div");
        notificacion.className =
          "fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out";
        notificacion.textContent = "❌ Error al copiar";
        document.body.appendChild(notificacion);

        setTimeout(() => {
          notificacion.remove();
        }, 2000);
      }
    );
  };

  // Agregar los estilos de animación al inicio del archivo
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
      .animate-fade-in-out {
        animation: fadeInOut 2s ease-in-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Manejador para guardar un administrador
  const handleGuardarAdmin = async (nuevoAdmin) => {
    try {
      let endpoint =
        "https://geoapphospital-b0yr.onrender.com/api/superadmin/create-admin";

      // Seleccionar endpoint según el tipo de admin
      if (nuevoAdmin.role_name === "superadmin") {
        endpoint =
          "https://geoapphospital-b0yr.onrender.com/api/superadmin/create-superadmin";
      } else if (nuevoAdmin.role_name === "municipioadmin") {
        endpoint =
          "https://geoapphospital-b0yr.onrender.com/api/municipioadmin/create-municipioadmin";
      } else if (nuevoAdmin.role_name === "hospitaladmin") {
        endpoint =
          "https://geoapphospital-b0yr.onrender.com/api/hospitaladmin/create-hospitaladmin";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoAdmin),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el administrador");
      }

      // Actualizar la lista de administradores
      await fetchAdministradores();

      // Mostrar las credenciales generadas
      setCredencialesGeneradas({
        titulo: `${
          nuevoAdmin.role_name === "superadmin"
            ? "Super Administrador"
            : nuevoAdmin.role_name === "estadoadmin"
            ? "Administrador de Estado"
            : nuevoAdmin.role_name === "municipioadmin"
            ? "Administrador de Municipio"
            : "Administrador de Hospital"
        } creado con éxito`,
        usuario: nuevoAdmin.user,
        contraseña: nuevoAdmin.pass,
        tipo:
          nuevoAdmin.role_name === "superadmin"
            ? "Super Administrador"
            : nuevoAdmin.role_name === "estadoadmin"
            ? "Administrador de Estado"
            : nuevoAdmin.role_name === "municipioadmin"
            ? "Administrador de Municipio"
            : "Administrador de Hospital",
      });
      setMostrarCredenciales(true);

      // Ocultar el formulario
      setMostrarFormAdmin(false);
    } catch (error) {
      console.error("Error al crear administrador:", error);
      alert(error.message);
    }
  };

  // Manejador para guardar un grupo
  const handleGuardarGrupo = async () => {
    await fetchGrupos(); // Recarga los grupos reales desde el backend
    resetearFormularios();
    setActiveTab("grupos"); // Cambia a la pestaña de grupos
  };

  // Función para obtener empleados
  const fetchEmpleados = async () => {
    try {
      const empleadosResponse = await fetch(
        "https://geoapphospital-b0yr.onrender.com/api/employees/get-empleados"
      );
      if (empleadosResponse.ok) {
        const empleadosData = await empleadosResponse.json();
        setEmpleados(empleadosData);
      }
    } catch (empleadosError) {
      console.error("Error al obtener empleados:", empleadosError);
    }
  };

  // Manejador para cambiar de pestaña
  const handleTabChange = async (tab) => {
    resetearFormularios();
    setActiveTab(tab);
    // Resetear la paginación cuando se cambia de pestaña
    setPaginaActual(1);
    setBusquedaAdmin("");
    setEstadoAdminFiltro("");
    setTipoAdminFiltro("");

    // Resetear filtros de empleados
    setBusquedaEmpleado("");
    setEstadoEmpleadoFiltro("");
    setRolEmpleadoFiltro("");

    // Si cambiamos a la pestaña de empleados, actualizamos la lista
    if (tab === "empleados") {
      await fetchEmpleados();
    }
  };

  // Modificar handleGuardarEmpleado para usar fetchEmpleados
  const handleGuardarEmpleado = async (empleadoData) => {
    try {
      console.log('📝 Creando empleado...');
      const response = await fetch("https://geoapphospital-b0yr.onrender.com/api/employees/create-empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empleadoData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear empleado");
      }

      console.log('✉️ Enviando credenciales por email...');
      await sendCredentialsEmail({
        nombre: empleadoData.nombre,
        ap_paterno: empleadoData.ap_paterno,
        correo_electronico: empleadoData.correo_electronico,
        user: empleadoData.user,
        pass: empleadoData.pass
      });

      // Solo actualizamos la lista sin cerrar el formulario
      fetchEmpleados();
      // Removemos esta línea:
      // setMostrarFormEmpleado(false);

    } catch (error) {
      console.error('❌ Error al crear empleado:', error);
      throw error;
    }
  };

  // Estadísticas para las tarjetas
  const estadisticas = {
    totalHospitales: hospitales.length,
    totalAdministradores: administradores.length,
    totalEstados: [...new Set(hospitales.map((h) => h.estado))].filter(Boolean)
      .length,
    totalGrupos: grupos.length,
    totalEmpleados: empleados.length,
  };

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
        handleMostrarSubidaMasivaEmpleados={handleMostrarSubidaMasivaEmpleados}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* CONTENIDO PRINCIPAL */}
      <div
        className={`flex-1 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } transition-all duration-300 ease-in-out overflow-auto`}
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
                : activeTab === "dashboard"
                ? "Dashboard Analítico"
                : activeTab === "empleados"
                ? "Gestión de Empleados"
                : activeTab === "monitoreo"
                ? "Monitoreo de Empleados"
                : activeTab === "configuracion"
                ? "Configuración del Sistema"
                : "Panel de Control"}
            </h1>
            <div className="flex space-x-2">
              {!mostrarFormulario &&
                !mostrarFormAdmin &&
                !mostrarFormGrupo &&
                !mostrarFormEmpleado && 
                !mostrarSubidaMasivaEmpleados &&(
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleMostrarSubidaMasivaEmpleados}
                          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Empleados por CSV
                        </button>

                        <button
                          onClick={handleMostrarFormEmpleado}
                          className="flex items-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nuevo Empleado
                        </button>
                      </div>
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
            !mostrarSubidaMasivaEmpleados &&
            activeTab !== "monitoreo" &&
            activeTab !== "configuracion" &&
            activeTab !== "dashboard" && (
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
                resetearFormularios();
                setActiveTab("hospitales");
              }}
            />
          )}

          {/* FORMULARIO ADMINISTRADOR */}
          {mostrarFormAdmin && (
            <AdminForm
              hospitales={hospitales}
              onGuardar={handleGuardarAdmin}
              onCancelar={() => {
                resetearFormularios();
                setActiveTab("administradores");
              }}
              setHospitalesFiltradosPorEstado={setHospitalesFiltradosPorEstado}
            />
          )}

          {/* FORMULARIO GRUPO */}
          {mostrarFormGrupo && (
            <GrupoForm
              onGuardar={handleGuardarGrupo}
              onCancelar={() => {
                resetearFormularios();
                setActiveTab("grupos");
              }}
            />
          )}

          {/* FORMULARIO EMPLEADO */}
          {mostrarFormEmpleado && (
            <EmpleadoForm 
              onGuardar={handleGuardarEmpleado}
              onCancelar={() => setMostrarFormEmpleado(false)} 
            />
          )}

          {/* FORMULARIO SUBIDA MASIVA EMPLEADOS */}
          {mostrarSubidaMasivaEmpleados && (
            <SubidaMasivaEmpleados
              onCancelar={() => {
                resetearFormularios();
                setActiveTab("empleados");
              }}
            />
          )}

          {/* DASHBOARD */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            !mostrarSubidaMasivaEmpleados &&
            activeTab === "dashboard" && <MonitoreoDashboard />}

          {/* MONITOREO */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            !mostrarSubidaMasivaEmpleados &&
            activeTab === "monitoreo" && <MonitoreoMap />}

          {/* CONFIGURACIÓN DEL SISTEMA */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            !mostrarSubidaMasivaEmpleados &&
            activeTab === "configuracion" && <MonitoreoConfig />}

          {/* CONTENIDO SEGÚN TAB */}
          {!mostrarFormulario &&
            !mostrarFormAdmin &&
            !mostrarFormGrupo &&
            !mostrarFormEmpleado &&
            !mostrarSubidaMasivaEmpleados &&
            activeTab !== "monitoreo" &&
            activeTab !== "configuracion" &&
            activeTab !== "dashboard" && (
              <>
                {activeTab === "hospitales" && (
                  <HospitalList
                    hospitales={hospitales}
                    estadoFiltro={estadoFiltro}
                    setEstadoFiltro={setEstadoFiltro}
                    handleEditarHospital={handleEditarHospital}
                    paginaActual={paginaActual}
                    setPaginaActual={setPaginaActual}
                  />
                )}

                {activeTab === "administradores" && (
                  <AdministradorList
                    administradores={administradores}
                    tipoAdminFiltro={tipoAdminFiltro}
                    setTipoAdminFiltro={setTipoAdminFiltro}
                    busquedaAdmin={busquedaAdmin}
                    setBusquedaAdmin={setBusquedaAdmin}
                    estadoAdminFiltro={estadoAdminFiltro}
                    setEstadoAdminFiltro={setEstadoAdminFiltro}
                    onEditar={fetchAdministradores}
                    onEliminar={fetchAdministradores}
                  />
                )}

                {activeTab === "grupos" && (
                  <GrupoList grupos={grupos} onGuardar={fetchGrupos} />
                )}

                {activeTab === "empleados" && (
                  <EmpleadoList
                    empleados={empleados}
                    busquedaEmpleado={busquedaEmpleado}
                    setBusquedaEmpleado={setBusquedaEmpleado}
                    estadoEmpleadoFiltro={estadoEmpleadoFiltro}
                    setEstadoEmpleadoFiltro={setEstadoEmpleadoFiltro}
                    rolEmpleadoFiltro={rolEmpleadoFiltro}
                    setRolEmpleadoFiltro={setRolEmpleadoFiltro}
                    onEmpleadosUpdate={fetchEmpleados}
                  />
                )}
              </>
            )}
        </main>
      </div>

      {/* Modal de Credenciales */}
      {mostrarCredenciales && credencialesGeneradas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                {credencialesGeneradas.titulo}
              </h2>
              <button
                onClick={() => setMostrarCredenciales(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Usuario:
                  </label>
                  <button
                    onClick={() =>
                      copiarAlPortapapeles(credencialesGeneradas.usuario)
                    }
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-lg font-mono bg-white p-2 rounded border border-gray-200">
                  {credencialesGeneradas.usuario}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Contraseña:
                  </label>
                  <button
                    onClick={() =>
                      copiarAlPortapapeles(credencialesGeneradas.contraseña)
                    }
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-lg font-mono bg-white p-2 rounded border border-gray-200">
                  {credencialesGeneradas.contraseña}
                </p>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Por favor, guarde estas
                  credenciales en un lugar seguro. No se mostrarán nuevamente.
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setMostrarCredenciales(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
