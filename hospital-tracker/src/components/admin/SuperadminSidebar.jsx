"use client";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Building2,
  ChevronRight,
  ClipboardList,
  Hospital,
  LogOut,
  Map,
  User,
  UserPlus,
  Users,
  UsersRound,
  BarChart3,
} from "lucide-react";

export default function SuperadminSidebar({
  activeTab,
  setActiveTab,
  handleInicio,
  mostrarFormulario,
  mostrarFormAdmin,
  mostrarFormGrupo,
  mostrarFormEmpleado,
  handleMostrarFormulario,
  handleMostrarFormAdmin,
  handleMostrarFormGrupo,
  handleMostrarFormEmpleado,
  sidebarOpen,
  setSidebarOpen,
}) {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  // Tamaño de íconos dinámico
  const iconSize = "h-5 w-5"; // Tamaño fijo para evitar desalineación al expandir/comprimir
  const buttonPadding = "py-3 px-4"; // Aumentado el padding vertical
  const buttonSpacing = "my-1.5"; // Aumentado el espaciado entre botones

  // Lista de opciones generales
  const mainOptions = [
    {
      label: "Hospitales",
      icon: <Hospital className={iconSize} />,
      tab: "hospitales",
    },
    {
      label: "Administradores",
      icon: <Users className={iconSize} />,
      tab: "administradores",
    },
    {
      label: "Grupos",
      icon: <UsersRound className={iconSize} />,
      tab: "grupos",
    },
    {
      label: "Empleados",
      icon: <UserPlus className={iconSize} />,
      tab: "empleados",
    },
    {
      label: "Monitoreo",
      icon: <Map className={iconSize} />,
      tab: "monitoreo",
    },
    {
      label: "Dashboard",
      icon: <BarChart3 className={iconSize} />,
      tab: "dashboard",
    },
  ];

  // Lista de opciones de creación
  const createOptions = [
    {
      handler: handleMostrarFormulario,
      icon: <Building2 className={iconSize} />,
      label: "Crear Hospital",
      isActive: mostrarFormulario,
    },
    {
      handler: handleMostrarFormAdmin,
      icon: <User className={iconSize} />,
      label: "Crear Admin",
      isActive: mostrarFormAdmin,
    },
    {
      handler: handleMostrarFormGrupo,
      icon: <ClipboardList className={iconSize} />,
      label: "Crear Grupo",
      isActive: mostrarFormGrupo,
    },
  ];

  return (
    <div
      onMouseEnter={() => setSidebarOpen(true)}
      onMouseLeave={() => setSidebarOpen(false)}
      className={`${
        sidebarOpen ? "w-56" : "w-20"
      } bg-gradient-to-b from-emerald-800 to-teal-900 text-white will-change-transform transition-[width] duration-200 ease-in-out flex flex-col h-screen fixed`}
    >
      {/* Header */}
      <div className="p-6 flex items-center">
        <div className="w-full flex items-center">
          <div className="w-12 flex justify-center flex-shrink-0">
            <Hospital className="h-7 w-7" />
          </div>
          <h1 
            className={`transition-[width,opacity] duration-200 ease-in-out overflow-hidden ${
              !sidebarOpen ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            MediGestión
          </h1>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 mb-4">
        <div className="flex items-center">
          <div className="w-12 flex justify-center flex-shrink-0">
            <div className="h-11 w-11 rounded-full bg-emerald-600 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
          </div>
          <div 
            className={`transition-[width,opacity] duration-200 ease-in-out overflow-hidden ${
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            }`}
          >
            <p className="font-medium text-sm whitespace-nowrap">Administrador</p>
            <p className="text-xs text-emerald-200 whitespace-nowrap">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="px-6 mb-4">
        <div className="h-px bg-emerald-700/50"></div>
      </div>

      {/* Opciones principales */}
      <div className="flex-1 px-2 flex flex-col">
        <div className="space-y-1">
          {mainOptions.map(({ label, icon, tab }) => (
            <button
              key={tab}
              onClick={() => {
                handleInicio();
                setActiveTab(tab);
              }}
              className={`flex items-center ${buttonPadding} ${buttonSpacing} hover:bg-emerald-700 transition-colors duration-200 w-full rounded-md ${
                !mostrarFormulario &&
                !mostrarFormAdmin &&
                !mostrarFormGrupo &&
                !mostrarFormEmpleado &&
                activeTab === tab
                  ? "bg-emerald-700"
                  : ""
              }`}
            >
              <div className="w-12 flex justify-center flex-shrink-0">
                {icon}
              </div>
              <span 
                className={`transition-[width,opacity] duration-200 ease-in-out overflow-hidden whitespace-nowrap ${
                  sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Separador antes de las opciones de creación */}
        <div className="px-4 my-4">
          <div className="h-px bg-emerald-700/50"></div>
        </div>

        {/* Opciones de creación */}
        <div className="space-y-1">
          {createOptions.map(({ handler, icon, label, isActive }) => (
            <button
              key={label}
              onClick={handler}
              className={`flex items-center ${buttonPadding} ${buttonSpacing} hover:bg-emerald-700 transition-colors duration-200 w-full rounded-md ${
                isActive ? "bg-emerald-700" : ""
              }`}
            >
              <div className="w-12 flex justify-center flex-shrink-0">
                {icon}
              </div>
              <span 
                className={`transition-[width,opacity] duration-200 ease-in-out overflow-hidden whitespace-nowrap ${
                  sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Separador antes del botón de cerrar sesión */}
      <div className="px-6 mt-auto mb-4">
        <div className="h-px bg-emerald-700/50"></div>
      </div>

      {/* Cerrar sesión */}
      <div className="px-2 pb-4">
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("userRole");
            setIsAuthenticated(false);
            navigate("/");
          }}
          className={`flex items-center ${buttonPadding} ${buttonSpacing} hover:bg-red-700 text-red-100 transition-colors duration-200 w-full rounded-md`}
        >
          <div className="w-12 flex justify-center flex-shrink-0">
            <LogOut className={iconSize} />
          </div>
          <span 
            className={`transition-[width,opacity] duration-200 ease-in-out overflow-hidden whitespace-nowrap ${
              sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
            }`}
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
}
