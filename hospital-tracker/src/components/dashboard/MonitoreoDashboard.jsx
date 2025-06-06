import { useState } from "react";
import { MapPin, Globe, Building2, Building, ChevronRight } from "lucide-react";
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

  // Configuración de las pestañas
  const tabs = [
    {
      id: "nacional",
      label: "Nacional",
      icon: Globe,
      description: "Vista general del país",
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: "estatal",
      label: "Estatal",
      icon: MapPin,
      description: "Análisis por estado",
      color: "from-emerald-500 to-green-600"
    },
    {
      id: "municipal",
      label: "Municipal",
      icon: Building2,
      description: "Detalle municipal",
      color: "from-violet-500 to-purple-600"
    },
    {
      id: "hospital",
      label: "Hospital",
      icon: Building,
      description: "Información hospitalaria",
      color: "from-amber-500 to-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-white">
      {/* Header con navegación - más ancho que el contenido */}
      <div className="w-full px-4 pt-6">
        <div className="max-w-[90rem] mx-auto">
          <div className="bg-gray-100 rounded-3xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Dashboards de monitoreo</h1>
                <p className="text-sm text-gray-600">Selecciona el nivel de análisis</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`relative group ${
                    selectedTab === tab.id 
                      ? "bg-white border-b-2 border-emerald-500" 
                      : "bg-gray-50 border-b-2 border-transparent"
                  } rounded-xl p-4 transition-all duration-200 hover:bg-white min-h-[140px] flex flex-col shadow-sm`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center`}>
                      <tab.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-800 text-base">{tab.label}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {tab.id === "nacional" && "Vista Nacional"}
                      {tab.id === "estatal" && "Vista por Estado"}
                      {tab.id === "municipal" && "Vista Municipal"}
                      {tab.id === "hospital" && "Vista Hospitalaria"}
                    </div>
                    <ChevronRight className={`h-4 w-4 ${
                      selectedTab === tab.id 
                        ? "text-emerald-500" 
                        : "text-gray-400"
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del dashboard - más estrecho */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {selectedTab === "nacional" && <NacionalDashboard />}
        {selectedTab === "estatal" && <EstatalDashboard />}
        {selectedTab === "municipal" && (
          <MunicipalDashboard municipio={municipio} estado={estado} />
        )}
        {selectedTab === "hospital" && <HospitalDashboard />}
      </div>
    </div>
  );
};

export default MonitoreoDashboard;
