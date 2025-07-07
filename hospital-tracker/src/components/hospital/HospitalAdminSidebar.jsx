import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Users, Hospital, Layers, LogOut, BarChart3, Map } from "lucide-react";

export default function HospitalAdminSidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const options = [
    {
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      tab: "dashboard",
    },
    {
      label: "Empleados",
      icon: <Users className="h-5 w-5" />,
      tab: "empleados",
    },
    {
      label: "Grupos",
      icon: <Layers className="h-5 w-5" />,
      tab: "grupos",
    },
    {
      label: "Monitoreo",
      icon: <Map className="h-5 w-5" />,
      tab: "monitoreo",
    },
  ];

  return (
    <div
      className={`${sidebarOpen ? "w-56" : "w-20"} bg-gradient-to-b from-blue-800 to-blue-900 text-white transition-all duration-200 flex flex-col h-screen fixed z-30`}
      onMouseEnter={() => setSidebarOpen(true)}
      onMouseLeave={() => setSidebarOpen(false)}
    >
      {/* Header */}
      <div className="p-6 flex items-center">
        <div className="w-full flex items-center">
          <div className="w-12 flex justify-center flex-shrink-0">
            <Hospital className="h-7 w-7" />
          </div>
          <h1
            className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            Hospital Admin
          </h1>
        </div>
      </div>
      {/* Opciones */}
      <div className="flex-1 px-2 flex flex-col">
        <div className="space-y-1">
          {options.map(({ label, icon, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center py-3 px-4 hover:bg-blue-700 transition-colors duration-200 w-full rounded-md ${activeTab === tab ? "bg-blue-700" : ""}`}
            >
              <div className="w-12 flex justify-center flex-shrink-0">
                {icon}
              </div>
              <span
                className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Cerrar sesión */}
      <div className="px-2 pb-4 mt-auto">
        <button
          onClick={() => {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userId");
            setIsAuthenticated(false);
            navigate("/");
          }}
          className="flex items-center py-3 px-4 hover:bg-red-700 text-red-100 transition-colors duration-200 w-full rounded-md"
        >
          <div className="w-12 flex justify-center flex-shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          <span
            className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </div>
  );
} 