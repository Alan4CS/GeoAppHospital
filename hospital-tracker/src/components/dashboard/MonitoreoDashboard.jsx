import { useState } from "react";
import NacionalDashboard from "./nacional/NacionalDashboard";
import EstatalDashboard from "./estatal/EstatalDashboard";
import MunicipalDashboard from "./municipal/MunicipalDashboard";
import HospitalDashboard from "./hospital/HospitalDashboard";

// Componente principal del dashboard de monitoreo
const MonitoreoDashboard = () => {
  // Estado para la pestaña seleccionada
  const [selectedTab, setSelectedTab] = useState("nacional");
  // Estado para municipio y estado seleccionados (demo)
  const [municipio, setMunicipio] = useState("Benito Juárez");
  const [estado, setEstado] = useState("Quintana Roo");

  return (
    <div className="flex flex-col h-full">
      {/* Navegación entre dashboards */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex border-b border-gray-200 mt-4">
          <button
            onClick={() => setSelectedTab("nacional")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "nacional"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Nacional
          </button>
          <button
            onClick={() => setSelectedTab("estatal")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "estatal"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Estatal
          </button>
          <button
            onClick={() => setSelectedTab("municipal")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "municipal"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Municipal
          </button>
          <button
            onClick={() => setSelectedTab("hospital")}
            className={`px-4 py-2 text-sm font-medium ${
              selectedTab === "hospital"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Hospital
          </button>
          {/* Aquí puedes agregar más botones para otros dashboards en el futuro */}
        </div>
      </div>

      {/* Renderizado del dashboard seleccionado */}
      {selectedTab === "nacional" && <NacionalDashboard />}
      {selectedTab === "estatal" && <EstatalDashboard />}
      {selectedTab === "municipal" && (
        <MunicipalDashboard municipio={municipio} estado={estado} />
      )}
      {selectedTab === "hospital" && <HospitalDashboard />}
      {/* Aquí puedes agregar más renderizados condicionales para otros dashboards */}
    </div>
  );
};

export default MonitoreoDashboard;
