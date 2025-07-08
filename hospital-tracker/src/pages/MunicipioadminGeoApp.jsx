import React, { useState, useEffect } from "react";
import MunicipalDashboard from "../components/dashboard/municipal/MunicipalDashboard";
import MunicipalSidebar from "../components/municipal/MunicipalSidebar";
import HospitalList from "../components/municipal/HospitalListMunicipio";
import GrupoList from "../components/municipal/GrupoListMunicipio";
import EmpleadoList from "../components/municipal/EmpleadoListMunicipio";
import MonitoreoMap from "../components/admin/MonitoreoMap";
import { useAuth } from "../context/AuthContext";

export default function MunicipioAdminDashboard() {
  const [activeTab, setActiveTab] = useState("hospitales");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [municipioNombre, setMunicipioNombre] = useState("");
  const [hospitales, setHospitales] = useState([]);
  const [hospitalesLoading, setHospitalesLoading] = useState(true);
  const { userId } = useAuth();

  useEffect(() => {
    const fetchHospitalesYMunicipio = async () => {
      try {
        setHospitalesLoading(true);
        // Endpoint para hospitales por municipioadmin
        const response = await fetch(`https://geoapphospital.onrender.com/api/municipioadmin/hospitals-by-user/${userId}`);
        const data = await response.json();
        setHospitales(data);
        // Si hay hospitales, toma el nombre_municipio del primero
        if (Array.isArray(data) && data.length > 0) {
          setMunicipioNombre(data[0].nombre_municipio || "");
        } else {
          setMunicipioNombre("");
        }
      } catch (error) {
        setMunicipioNombre("");
        setHospitales([]);
      } finally {
        setHospitalesLoading(false);
      }
    };
    if (userId) {
      fetchHospitalesYMunicipio();
    }
  }, [userId]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <MunicipalSidebar
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
        <header className="bg-white shadow-sm py-4 pr-4 pl-8 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === "hospitales"
                ? `Hospitales en ${municipioNombre || "..."}`
                : activeTab === "grupos"
                ? `Grupos en ${municipioNombre || "..."}`
                : activeTab === "empleados"
                ? `Empleados en ${municipioNombre || "..."}`
                : activeTab === "monitoreo"
                ? "Monitoreo municipal"
                : activeTab === "dashboard"
                ? "Dashboard municipal"
                : "Municipio Admin"}
            </h1>
          </div>
        </header>
        {/* CONTENIDO */}
        <main className="p-6">
          {activeTab === "dashboard" && <MunicipalDashboard municipio={municipioNombre} />}
          {activeTab === "hospitales" && (
            <HospitalList 
              municipioNombre={municipioNombre} 
              hospitales={hospitales} 
              loading={hospitalesLoading}
            />
          )}
          {activeTab === "grupos" && <GrupoList id_user={userId} />}
          {activeTab === "empleados" && <EmpleadoList id_user={userId} />}
          {activeTab === "monitoreo" && (
            <MonitoreoMap 
              modoMunicipioAdmin={true} 
              municipioId={userId} 
              municipioNombre={municipioNombre} 
            />
          )}
        </main>
      </div>
    </div>
  );
} 