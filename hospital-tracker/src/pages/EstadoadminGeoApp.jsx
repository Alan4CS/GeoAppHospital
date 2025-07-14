import React, { useState, useEffect } from "react";
import EstadoSidebar from "../components/estado/EstadoSidebar";
import HospitalList from "../components/estado/HospitalListEstado";
import GrupoList from "../components/estado/GrupoListEstado";
import EmpleadoList from "../components/estado/EmpleadoListEstado";
import EstatalDashboard from "../components/dashboard/estatal/EstatalDashboard";
import MonitoreoMap from "../components/admin/MonitoreoMap";
import { useAuth } from "../context/AuthContext";

export default function EstadoAdminDashboard() {
  const [activeTab, setActiveTab] = useState("hospitales");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [estadoNombre, setEstadoNombre] = useState("");
  const [hospitales, setHospitales] = useState([]);
  const [hospitalesLoading, setHospitalesLoading] = useState(true);
  const { userId } = useAuth();
  console.log("userId desde contexto:", userId);

  useEffect(() => {
    const fetchHospitalesYEstado = async () => {
      try {
        setHospitalesLoading(true);
        const response = await fetch(`https://geoapphospital-b0yr.onrender.com/api/estadoadmin/hospitals-by-user/${userId}?source=hospitals`);
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
    if (userId) {
      fetchHospitalesYEstado();
    }
  }, [userId]);

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
          {activeTab === "grupos" && <GrupoList id_user={userId} />}
          {activeTab === "empleados" && <EmpleadoList id_user={userId} />}
          {activeTab === "monitoreo" && (
            <MonitoreoMap modoEstadoAdmin={true} estadoId={userId} />
          )}
          {activeTab === "monitoreomap" && (
            <MonitoreoMap modoEstadoAdmin={true} estadoId={userId} estadoNombre={estadoNombre} />
          )}
        </main>
      </div>
    </div>
  );
}
