import React, { useState, useEffect } from "react";
import MunicipalDashboard from "../components/dashboard/municipal/MunicipalDashboard";
// TODO: Crear este componente similar a EstadoSidebar
import MunicipalSidebar from "../components/municipal/MunicipalSidebar";
import HospitalList from "../components/estado/HospitalList";
import GrupoList from "../components/estado/GrupoList";
import EmpleadoList from "../components/estado/EmpleadoList";

export default function MunicipioAdminDashboard() {
  const [activeTab, setActiveTab] = useState("hospitales");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [municipioNombre, setMunicipioNombre] = useState("");
  const [hospitales, setHospitales] = useState([]);
  const [hospitalesLoading, setHospitalesLoading] = useState(true);
  // Obtener el id_user desde localStorage
  const id_user = localStorage.getItem("userId");

  useEffect(() => {
    const fetchHospitalesYMunicipio = async () => {
      try {
        setHospitalesLoading(true);
        // Endpoint para hospitales por municipioadmin
        const response = await fetch(`https://geoapphospital.onrender.com/api/municipioadmin/hospitals-by-user/${id_user}`);
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
    if (id_user) {
      fetchHospitalesYMunicipio();
    }
  }, [id_user]);

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
        <header className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === "hospitales"
                ? `Hospitales en ${municipioNombre || "..."}`
                : activeTab === "grupos"
                ? `Grupos en ${municipioNombre || "..."}`
                : activeTab === "empleados"
                ? `Empleados en ${municipioNombre || "..."}`
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
          {activeTab === "grupos" && <GrupoList id_user={id_user} />}
          {activeTab === "empleados" && <EmpleadoList id_user={id_user} />}
        </main>
      </div>
    </div>
  );
} 