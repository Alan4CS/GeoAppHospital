import React, { useState, useEffect } from "react";
import EstadoSidebar from "../components/estado/EstadoSidebar";
import HospitalList from "../components/estado/HospitalListEstado";
import GrupoList from "../components/estado/GrupoList";
import EmpleadoList from "../components/estado/EmpleadoList";
import DashboardEstado from "../components/estado/Dashboard";
import EstatalDashboard from "../components/dashboard/estatal/EstatalDashboard";
import MonitoreoMap from "../components/admin/MonitoreoMap";

export default function EstadoAdminDashboard() {
  const [activeTab, setActiveTab] = useState("hospitales");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [estadoNombre, setEstadoNombre] = useState("");
  const [hospitales, setHospitales] = useState([]);
  const [hospitalesLoading, setHospitalesLoading] = useState(true);
  // Obtener el id_user desde localStorage (ajusta si lo tienes en contexto)
  const id_user = localStorage.getItem("userId");

  useEffect(() => {
    const fetchHospitalesYEstado = async () => {
      try {
        setHospitalesLoading(true);
        const response = await fetch(`https://geoapphospital.onrender.com/api/estadoadmin/hospitals-by-user/${id_user}?source=hospitals`);
        const data = await response.json();
        setHospitales(data);
        // Si hay hospitales, toma el nombre_estado del primero
        if (Array.isArray(data) && data.length > 0) {
          setEstadoNombre(data[0].nombre_estado || "");
        } else {
          setEstadoNombre("");
        }
      } catch (error) {
        setEstadoNombre("");
        setHospitales([]);
      } finally {
        setHospitalesLoading(false);
      }
    };
    if (id_user) {
      fetchHospitalesYEstado();
    }
  }, [id_user]);

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
                ? `Hospitales en ${estadoNombre || "..."}`
                : activeTab === "grupos"
                ? `Grupos en ${estadoNombre || "..."}`
                : activeTab === "empleados"
                ? `Empleados en ${estadoNombre || "..."}`
                : activeTab === "monitoreo"
                ? "Monitoreo de grupos"
                : activeTab === "monitoreomap"
                ? "Monitoreo estatal"
                : activeTab === "dashboard"
                ? "Dashboard estatal"
                : "Estado Admin"}
            </h1>
          </div>
        </header>
        {/* CONTENIDO */}
        <main className="p-6">
          {activeTab === "dashboard" && <EstatalDashboard />}
          {activeTab === "hospitales" && (
            <HospitalList 
              estadoNombre={estadoNombre} 
              hospitales={hospitales} 
              loading={hospitalesLoading}
            />
          )}
          {activeTab === "grupos" && <GrupoList id_user={id_user} />}
          {activeTab === "empleados" && <EmpleadoList id_user={id_user} />}
          {activeTab === "monitoreo" && (
            <MonitoreoMap modoEstadoAdmin={true} estadoId={id_user} />
          )}
          {activeTab === "monitoreomap" && (
            <MonitoreoMap modoEstadoAdmin={true} estadoId={id_user} estadoNombre={estadoNombre} />
          )}
        </main>
      </div>
    </div>
  );
}
