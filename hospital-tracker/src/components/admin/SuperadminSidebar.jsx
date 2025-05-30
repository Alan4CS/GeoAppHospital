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
  const buttonPadding = sidebarOpen ? "py-2 px-3" : "py-3 px-4";
  const textClass = sidebarOpen ? "ml-2 text-sm" : "";
  const buttonAlign = sidebarOpen ? "justify-start" : "justify-center";
  const buttonSpacing = sidebarOpen ? "my-1.5" : "my-0.5"; // Espaciado reducido entre íconos

  // Lista de opciones generales
  const mainOptions = [
    {
      label: "Hospitales",
      icon: (
        <span className="w-6 flex justify-center">
          <Hospital className={iconSize} />
        </span>
      ),
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
        sidebarOpen ? "w-56 overflow-y-auto" : "w-20 overflow-hidden"
      } bg-gradient-to-b from-emerald-800 to-teal-900 text-white transition-all duration-500 ease-in-out flex flex-col h-screen fixed`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div
          className={`flex items-center ${
            !sidebarOpen && "justify-center w-full"
          }`}
        >
          <Hospital className="h-6 w-6" />
          <h1 className={`ml-2 font-bold text-lg ${!sidebarOpen && "hidden"}`}>
            MediGestión
          </h1>
        </div>
      </div>

      {/* User Profile */}
      <div
        className={`mt-2 px-4 py-3 ${
          !sidebarOpen ? "flex justify-center" : ""
        }`}
      >
        <div className={`flex items-center ${!sidebarOpen ? "flex-col" : ""}`}>
          <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <div className="ml-3">
              <p className="font-medium text-sm">Administrador</p>
              <p className="text-xs text-emerald-200">Super Admin</p>
            </div>
          )}
        </div>
      </div>

      {/* Opciones principales */}
      <div className="mt-6 flex flex-col flex-1 gap-1 px-2">
        {" "}
        {/* 'gap-1' separa bloques, 'px-2' alinea mejor íconos */}
        {mainOptions.map(({ label, icon, tab }) => (
          <button
            key={tab}
            onClick={() => {
              handleInicio();
              setActiveTab(tab);
            }}
            className={`flex items-center ${buttonPadding} ${buttonSpacing} ${buttonAlign} hover:bg-emerald-700 ${
              !mostrarFormulario &&
              !mostrarFormAdmin &&
              !mostrarFormGrupo &&
              !mostrarFormEmpleado &&
              activeTab === tab
                ? "bg-emerald-700"
                : ""
            }`}
          >
            {icon}
            {sidebarOpen && <span className={textClass}>{label}</span>}
          </button>
        ))}
        {/* Crear botones */}
        {createOptions.map(({ handler, icon, label, isActive }) => (
          <button
            key={label}
            onClick={handler}
            className={`flex items-center ${buttonPadding} ${buttonSpacing} ${buttonAlign} hover:bg-emerald-700 ${
              isActive ? "bg-emerald-700" : ""
            }`}
          >
            {icon}
            {sidebarOpen && <span className={textClass}>{label}</span>}
          </button>
        ))}
      </div>

      {/* Cerrar sesión */}
      <div className={`px-2 pb-6 pt-4`}>
        {" "}
        {/* Mayor separación para el botón de cerrar sesión */}
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("userRole");
            setIsAuthenticated(false);
            navigate("/");
          }}
          className={`flex items-center ${buttonPadding} ${buttonSpacing} ${buttonAlign} hover:bg-red-700 text-red-100`}
        >
          <LogOut className={iconSize} />
          {sidebarOpen && <span className={textClass}>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}
