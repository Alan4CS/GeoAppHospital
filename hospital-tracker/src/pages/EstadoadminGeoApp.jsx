import React, { useState } from "react";
import EstadoSidebar from "../components/estado/EstadoSidebar";
import HospitalList from "../components/estado/HospitalList";
import GrupoList from "../components/estado/GrupoList";
import EmpleadoList from "../components/estado/EmpleadoList";
import Monitoreo from "../components/estado/Monitoreo";
import DashboardEstado from "../components/estado/Dashboard";

export default function EstadoAdminDashboard() {
  const [activeTab, setActiveTab] = useState("hospitales");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // TODO: Reemplaza esto por tu lógica real para obtener el nombre del estado
  const estadoNombre = "QUINTANA ROO";
  // Obtener el id_user desde localStorage (ajusta si lo tienes en contexto)
  const id_user = localStorage.getItem("userId");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <EstadoSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      {/* CONTENIDO PRINCIPAL */}
      <div
        className={`flex-1 ${sidebarOpen ? "ml-56" : "ml-20"} transition-all duration-300 ease-in-out`}
      >
        {/* HEADER */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === "hospitales"
                ? `Hospitales en ${estadoNombre}`
                : activeTab === "grupos"
                ? `Grupos en ${estadoNombre}`
                : activeTab === "empleados"
                ? `Hospitales en ${estadoNombre}`
                : activeTab === "monitoreo"
                ? "Monitoreo de grupos"
                : activeTab === "dashboard"
                ? "Dashboard estatal"
                : "Estado Admin"}
            </h1>
          </div>
        </header>
        {/* CONTENIDO */}
        <main className="p-6">
          {activeTab === "dashboard" && <DashboardEstado />}
          {activeTab === "hospitales" && <HospitalList />}
          {activeTab === "grupos" && <GrupoList id_user={id_user} />}
          {activeTab === "empleados" && <EmpleadoList id_user={id_user} />}
          {activeTab === "monitoreo" && <Monitoreo id_user={id_user} />}
        </main>
      </div>
    </div>
  );
}
