import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  Building2,
  ChevronRight,
  ClipboardList,
  Cog,
  Hospital,
  LogOut,
  Map,
  User,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react"

export default function SuperadminSidebar({
  activeTab,
  setActiveTab,
  handleInicio,
  mostrarFormulario,
  mostrarFormAdmin,
  handleMostrarFormulario,
  handleMostrarFormAdmin,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate()
  const { setIsAuthenticated } = useAuth()

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-emerald-800 to-teal-900 text-white transition-all duration-300 ease-in-out flex flex-col h-screen fixed`}
    >
      <div className="p-4 flex items-center justify-between">
        <div className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}>
          <Hospital className="h-8 w-8" />
          <h1 className={`ml-2 font-bold text-xl ${!sidebarOpen && "hidden"}`}>MediGestión</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-1 rounded-full hover:bg-emerald-700"
        >
          <ChevronRight className={`h-5 w-5 transform ${sidebarOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Perfil de usuario */}
      <div className={`mt-2 px-4 py-3 ${!sidebarOpen ? "flex justify-center" : ""}`}>
        <div className={`flex items-center ${!sidebarOpen ? "flex-col" : ""}`}>
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
        {/* Sección de Gestión */}
        {sidebarOpen && (
          <div className="px-4 py-2">
            <h2 className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Gestión</h2>
          </div>
        )}

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("hospitales")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "hospitales" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <Hospital className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Hospitales</span>}
        </button>

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("administradores")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "administradores" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <Users className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Administradores</span>}
        </button>

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("grupos")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "grupos" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <UsersRound className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Grupos</span>}
        </button>

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("empleados")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "empleados" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <UserPlus className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Empleados</span>}
        </button>

        {/* Sección de Creación */}
        {sidebarOpen && (
          <div className="px-4 py-2 mt-4">
            <h2 className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Creación</h2>
          </div>
        )}

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

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("crearGrupo")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "crearGrupo" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <ClipboardList className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Crear Grupo</span>}
        </button>

        {/* Sección de Configuración */}
        {sidebarOpen && (
          <div className="px-4 py-2 mt-4">
            <h2 className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Configuración</h2>
          </div>
        )}

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("monitoreo")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "monitoreo" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <Map className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Monitoreo</span>}
        </button>

        <button
          onClick={() => {
            handleInicio()
            setActiveTab("configuracion")
          }}
          className={`flex items-center py-3 px-4 hover:bg-emerald-700 ${
            !mostrarFormulario && !mostrarFormAdmin && activeTab === "configuracion" ? "bg-emerald-700" : ""
          } ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <Cog className="h-5 w-5" />
          {sidebarOpen && <span className="ml-3">Configuración</span>}
        </button>

        <div className="mt-auto">
          <button
            onClick={() => {
              localStorage.removeItem("isAuthenticated")
              localStorage.removeItem("userRole")
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
  )
}