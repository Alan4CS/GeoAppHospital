import React, { useState, useEffect } from "react";
import HospitalAdminSidebar from "../components/hospital/HospitalAdminSidebar";
import HospitalDashboard from "../components/dashboard/hospital/HospitalDashboard";
import EmpleadoListHospital from "../components/hospital/EmpleadoListHospital";
import MonitoreoMap from "../components/admin/MonitoreoMap";
import GrupoListHospital from "../components/hospital/GrupoListHospital";

export default function HospitalAdminGeoApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const id_user = localStorage.getItem("userId");

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true);
        // Cambia la URL por la de tu backend real
        const response = await fetch(`https://geoapphospital.onrender.com/api/hospitaladmin/hospital-by-user/${id_user}`);
        const data = await response.json();
        setHospital(data);
      } catch (error) {
        setHospital(null);
      } finally {
        setLoading(false);
      }
    };
    if (id_user) fetchHospital();
  }, [id_user]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <HospitalAdminSidebar
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
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {(() => {
                  const nombre = hospital?.nombre_hospital || "Hospital";
                  switch (activeTab) {
                    case "dashboard":
                      return `Dashboard · ${nombre}`;
                    case "empleados":
                      return `Empleados · ${nombre}`;
                    case "grupos":
                      return `Grupos · ${nombre}`;
                    case "monitoreo":
                      return `Monitoreo · ${nombre}`;
                    default:
                      return nombre;
                  }
                })()}
              </h1>
            </div>
          </div>
        </header>
        {/* CONTENIDO */}
        <main className="p-6">
          {loading && <div>Cargando...</div>}
          {!loading && !hospital && <div>No se encontró hospital asignado.</div>}
          {!loading && hospital && (
            <>
              {activeTab === "dashboard" && <HospitalDashboard hospital={hospital} />}
              {activeTab === "empleados" && <EmpleadoListHospital hospitalId={hospital.id_hospital} />}
              {activeTab === "grupos" && hospital && hospital.id_hospital && (
                <GrupoListHospital hospitalId={hospital.id_hospital} />
              )}
              {activeTab === "monitoreo" && <MonitoreoMap modoHospitalAdmin={true} hospitalId={hospital.id} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
} 