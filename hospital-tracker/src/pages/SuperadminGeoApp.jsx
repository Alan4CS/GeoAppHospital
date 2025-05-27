"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HospitalForm from "../components/admin/HospitalForm";
import AdminForm from "../components/admin/AdminForm";
import SuperadminSidebar from "../components/admin/SuperadminSidebar";
import GrupoForm from "../components/admin/GrupoForm";
import EmpleadoForm from "../components/admin/EmpleadoForm";
import { Hospital, Map, Plus, Users, UsersRound, UserPlus } from "lucide-react";
import StatsCard from "../components/admin/StatsCard";
import MonitoreoMap from "../components/admin/MonitoreoMap";
import MonitoreoConfig from "../components/admin/MonitoreoConfig";
import MonitoreoDashboard from "../components/dashboard/MonitoreoDashboard";
import HospitalList from "../components/lists/HospitalList";
import AdministradorList from "../components/lists/AdministradorList";
import GrupoList from "../components/lists/GrupoList";
import EmpleadoList from "../components/lists/EmpleadoList";

export default function SuperadminGeoApp() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [hospitales, setHospitales] = useState([]);
  const [hospitalesCompletos, setHospitalesCompletos] = useState([]); // Nueva lista para datos completos
  const [administradores, setAdministradores] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]);
  const [activeTab, setActiveTab] = useState("hospitales");
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [busquedaAdmin, setBusquedaAdmin] = useState("");
  const [estadoAdminFiltro, setEstadoAdminFiltro] = useState("");
  const [busquedaEmpleado, setBusquedaEmpleado] = useState("");
  const [estadoEmpleadoFiltro, setEstadoEmpleadoFiltro] = useState("");
  const [rolEmpleadoFiltro, setRolEmpleadoFiltro] = useState("");
  const [grupoIndexEditando, setGrupoIndexEditando] = useState(null);

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

        // Guardar datos completos para usar en GrupoList
        setHospitalesCompletos(data);

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
        "http://localhost:4000/api/superadmin/totaladmins"
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
      const res = await fetch("http://localhost:4000/api/groups/get-groups");
      const data = await res.json();
      console.log("Datos de grupos desde API:", data); // Debug

      const gruposFormateados = data.map((g) => ({
        id: g.id_group,
        nombre_grupo: g.nombre_grupo,
        descripcion_group: g.descripcion_group,
        nombre_hospital: g.nombre_hospital,
        nombre_estado: g.nombre_estado,
        nombre_municipio: g.nombre_municipio || "-",
      }));

      console.log("Grupos formateados:", gruposFormateados); // Debug
      setGrupos(gruposFormateados);

      const empleadosResponse = await fetch(
        "http://localhost:4000/api/employees/get-empleados"
      );
      const empleadosData = await empleadosResponse.json();
      setEmpleados(empleadosData);
    } catch (err) {
      console.error("❌ Error al obtener grupos:", err);
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
    setEditandoHospital(false);
    setHospitalEditando(null);
    setHospitalIndexEditando(null);
    setGrupoIndexEditando(null);
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

  const handleMostrarFormEmpleado = () => {
    resetearFormularios();
    setMostrarFormEmpleado(true);
  };

  const handleInicio = () => {
    resetearFormularios();
  };

  // Función para editar un hospital
  const handleEditarHospital = (hospital, index) => {
    resetearFormularios();
    setEditandoHospital(true);
    setHospitalEditando(hospital);
    setHospitalIndexEditando(index);
    setMostrarFormulario(true);

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
    resetearFormularios();
    setActiveTab("hospitales");
  };

  // Manejador para guardar un administrador
  const handleGuardarAdmin = async (nuevoAdmin) => {
    try {
      let endpoint = "";

      // Elegir endpoint según el rol
      switch (nuevoAdmin.role_name) {
        case "estadoadmin":
          endpoint = "http://localhost:4000/api/superadmin/create-admin";
          break;
        case "municipioadmin":
          endpoint =
            "http://localhost:4000/api/municipioadmin/create-municipioadmin";
          break;
        case "hospitaladmin":
          endpoint =
            "http://localhost:4000/api/hospitaladmin/create-hospitaladmin";
          break;
        default:
          alert("❌ Tipo de administrador no reconocido.");
          return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoAdmin),
      });

      if (!response.ok) throw new Error("Fallo al crear el administrador");

      const data = await response.json();

      alert(
        `✅ ${
          data.message || "Administrador creado correctamente"
        }\n🆔 Usuario: ${nuevoAdmin.user}\n🔑 Contraseña: ${nuevoAdmin.pass}`
      );

      // Refrescar la lista
      await fetchAdministradores();
      resetearFormularios();
      setActiveTab("administradores");
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error al crear el administrador.");
    }
  };

  // Manejador para guardar un grupo
  const handleGuardarGrupo = async () => {
    await fetchGrupos(); // Recarga los grupos reales desde el backend

    console.log("Nuevo grupo creado");

    resetearFormularios();
    setActiveTab("grupos"); // Cambia a la pestaña de grupos
  };

  // Manejador para guardar un empleado
  const handleGuardarEmpleado = async (nuevoEmpleado) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/employees/create-empleado",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nuevoEmpleado),
        }
      );

      if (!response.ok) throw new Error("Fallo al crear el empleado");

      const data = await response.json();

      alert(
        `✅ Empleado creado correctamente\n🆔 Usuario: ${nuevoEmpleado.user}\n🔑 Contraseña: ${nuevoEmpleado.pass}`
      );

      // Puedes guardar el empleado también en el estado local si lo deseas
      const nuevoId = Math.max(...empleados.map((e) => e.id), 0) + 1;
      const empleadoCompleto = {
        id: nuevoId,
        nombre: nuevoEmpleado.nombre,
        ap_paterno: nuevoEmpleado.ap_paterno,
        ap_materno: nuevoEmpleado.ap_materno,
        curp: nuevoEmpleado.CURP,
        telefono: nuevoEmpleado.telefono,
        grupo_id: nuevoEmpleado.id_grupo,
        grupo_nombre:
          grupos.find((g) => g.id_group === nuevoEmpleado.id_grupo)
            ?.nombre_grupo || "Grupo desconocido",
        hospital_id: nuevoEmpleado.id_hospital,
        hospital_nombre:
          hospitales.find((h) => h.id_hospital === nuevoEmpleado.id_hospital)
            ?.nombre_hospital || "Hospital desconocido",
        estado: nuevoEmpleado.id_estado,
        activo: true,
      };

      setEmpleados([...empleados, empleadoCompleto]);
      resetearFormularios();
      setActiveTab("empleados");
    } catch (error) {
      console.error("❌ Error al crear empleado:", error);
      alert("❌ Error al crear el empleado.");
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

  // Manejador para cambiar de pestaña
  const handleTabChange = (tab) => {
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
                !mostrarFormEmpleado && (
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
              hospitales={hospitales}
              grupos={grupos}
              onGuardar={handleGuardarEmpleado}
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
            activeTab === "dashboard" && <MonitoreoDashboard />}

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
                  />
                )}

                {activeTab === "grupos" && (
                  <GrupoList
                    grupos={grupos}
                    onGuardar={fetchGrupos}
                    hospitales={hospitalesCompletos}
                  />
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
                  />
                )}
              </>
            )}
        </main>
      </div>
    </div>
  );
}
