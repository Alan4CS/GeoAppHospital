import { useState, useEffect } from "react";
import {
  X,
  Activity,
  Building2,
  CircleDot,
  Edit2,
  MapPin,
  Hospital,
  Save,
} from "lucide-react";

// Datos estáticos simulados con información completa
const staticActivities = [
  {
    id: 1,
    admin: "Usuario Actual", // Este será tu registro
    adminId: "1", // Mismo ID que currentUser
    status: "active",
    estado: "Quintana Roo",
    municipio: "Benito Juárez",
    location: "Hospital General de Cancún",
    startTime: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 2,
    admin: "Alan Cano",
    adminId: "2",
    status: "active",
    estado: "Baja California",
    municipio: "Tijuana",
    location: "Hospital General de Tijuana",
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: 3,
    admin: "Angel Jiménez",
    adminId: "3",
    status: "active",
    estado: "Nuevo León",
    municipio: "Monterrey",
    location: "Hospital Regional IMSS 20",
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
  },
];

export default function ActivityLog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState(staticActivities);
  const [activeAdmins, setActiveAdmins] = useState(0);
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [hospitales, setHospitales] = useState([]);
  const [updateForm, setUpdateForm] = useState({
    estado: "",
    municipio: "",
    hospital: "",
    status: "active",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Simular usuario actual (esto debería venir de tu sistema de autenticación)
  const currentUser = {
    id: "1",
    name: "Usuario Actual",
  };

  // Cargar estados al iniciar
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch(
          "https://geoapphospital.onrender.com/api/superadmin/estados"
        );
        if (!res.ok) throw new Error("Error al obtener estados");
        const data = await res.json();
        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, []);

  // Cargar municipios cuando cambia el estado
  useEffect(() => {
    if (updateForm.estado) {
      const fetchMunicipios = async () => {
        try {
          const estadoSeleccionado = estados.find(
            (e) => e.nombre_estado === updateForm.estado
          );

          if (!estadoSeleccionado) {
            setMunicipios([]);
            return;
          }

          const res = await fetch(
            `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${estadoSeleccionado.id_estado}`
          );

          if (!res.ok) throw new Error("Error al obtener municipios");
          const data = await res.json();
          setMunicipios(data);
        } catch (error) {
          console.error("Error al obtener municipios:", error);
          setMunicipios([]);
        }
      };

      fetchMunicipios();
      setUpdateForm((prev) => ({
        ...prev,
        municipio: "",
        hospital: "",
      }));
    } else {
      setMunicipios([]);
    }
  }, [updateForm.estado, estados]);

  // Cargar hospitales cuando cambia el municipio
  useEffect(() => {
    const fetchHospitales = async () => {
      if (!updateForm.estado || !updateForm.municipio) {
        setHospitales([]);
        return;
      }

      try {
        const estadoSeleccionado = estados.find(
          (e) => e.nombre_estado === updateForm.estado
        );

        if (!estadoSeleccionado) {
          setHospitales([]);
          return;
        }

        const res = await fetch(
          `https://geoapphospital.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${estadoSeleccionado.id_estado}&id_municipio=${updateForm.municipio}`
        );

        if (!res.ok) throw new Error("Error al obtener hospitales");
        const data = await res.json();
        setHospitales(data);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
        setHospitales([]);
      }
    };

    fetchHospitales();
    if (updateForm.municipio !== "") {
      setUpdateForm((prev) => ({
        ...prev,
        hospital: "",
      }));
    }
  }, [updateForm.estado, updateForm.municipio, estados]);

  // Contar administradores activos
  useEffect(() => {
    const active = activities.filter((a) => a.status === "active").length;
    setActiveAdmins(active);
  }, [activities]);

  const handleUpdateSubmit = (e) => {
    e.preventDefault();

    // Obtener el nombre del hospital seleccionado
    const selectedHospital = hospitales.find(
      (h) => h.id_hospital === updateForm.hospital
    );
    const hospitalName = selectedHospital
      ? selectedHospital.nombre_hospital
      : "";

    // Obtener el nombre del municipio seleccionado
    const selectedMunicipio = municipios.find(
      (m) => m.id_municipio === updateForm.municipio
    );
    const municipioName = selectedMunicipio
      ? selectedMunicipio.nombre_municipio
      : "";

    const newActivity = {
      id: Date.now(),
      admin: currentUser.name,
      adminId: currentUser.id,
      status: updateForm.status,
      estado: updateForm.estado,
      municipio: municipioName,
      location: hospitalName,
      startTime: new Date().toISOString(),
      ...(updateForm.status === "finished" && {
        endTime: new Date().toISOString(),
      }),
    };

    setActivities((prev) => {
      // Filtrar actividades anteriores del mismo usuario
      const filteredActivities = prev.filter(
        (a) => a.adminId !== currentUser.id
      );
      return [...filteredActivities, newActivity];
    });

    setIsEditing(false);
    setUpdateForm({
      estado: "",
      municipio: "",
      hospital: "",
      status: "active",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startEditing = (activity) => {
    if (activity.adminId === currentUser.id) {
      setUpdateForm({
        estado: activity.estado,
        municipio: activity.municipio,
        hospital: activity.location,
        status: activity.status,
      });
      setIsEditing(true);
    }
  };

  // Función para formatear la duración
  const formatDuration = (startTime, endTime = null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffInMinutes = Math.floor((end - start) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  // Función para obtener el color según el estado
  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return "text-emerald-600 bg-emerald-50";
      case "finished":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-amber-600 bg-amber-50";
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (activity) => {
    const location = `${activity.estado}, ${activity.municipio} - ${activity.location}`;

    if (activity.status === "active") {
      return (
        <span className="text-gray-500">
          Trabajando en: <span className="text-gray-900">{location}</span>
        </span>
      );
    } else if (activity.status === "finished") {
      return (
        <span className="text-gray-500">
          Dejó de trabajar en: <span className="text-gray-900">{location}</span>
        </span>
      );
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 z-40 flex items-center gap-2 group"
      >
        <Building2 className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {activeAdmins}
        </span>
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Ver administradores activos
        </span>
      </button>

      {/* Panel deslizante */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 z-50 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Administradores
                </h2>
                <p className="text-sm text-gray-500">
                  {activeAdmins} administradores trabajando
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Lista de actividades */}
          <div className="overflow-y-auto h-[calc(100vh-4rem)]">
            <div className="p-4 space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                >
                  {activity.adminId === currentUser.id && (
                    <button
                      onClick={() => startEditing(activity)}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${getStatusStyle(
                        activity.status
                      )}`}
                    >
                      <CircleDot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {activity.admin}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {activity.status === "finished" ? "Trabajó: " : ""}
                          {formatDuration(activity.startTime, activity.endTime)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{getStatusText(activity)}</p>
                      {activity.status === "finished" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Hace {formatDuration(activity.endTime)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de actualización (solo visible al editar) */}
          {isEditing && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="h-4 w-4 inline mr-1 text-emerald-600" />
                      Ubicación
                    </label>
                    <select
                      name="estado"
                      value={updateForm.estado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Selecciona un estado</option>
                      {estados.map((estado) => (
                        <option
                          key={estado.id_estado}
                          value={estado.nombre_estado}
                        >
                          {estado.nombre_estado}
                        </option>
                      ))}
                    </select>
                  </div>

                  {updateForm.estado && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Building2 className="h-4 w-4 inline mr-1 text-emerald-600" />
                        Municipio
                      </label>
                      <select
                        name="municipio"
                        value={updateForm.municipio}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      >
                        <option value="">Selecciona un municipio</option>
                        {municipios.map((municipio) => (
                          <option
                            key={municipio.id_municipio}
                            value={municipio.id_municipio}
                          >
                            {municipio.nombre_municipio}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {updateForm.municipio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Hospital className="h-4 w-4 inline mr-1 text-emerald-600" />
                      Hospital
                    </label>
                    <select
                      name="hospital"
                      value={updateForm.hospital}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Selecciona un hospital</option>
                      {hospitales.map((hospital) => (
                        <option
                          key={hospital.id_hospital}
                          value={hospital.id_hospital}
                        >
                          {hospital.nombre_hospital}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Activity className="h-4 w-4 inline mr-1 text-emerald-600" />
                      Situación
                    </label>
                    <select
                      name="status"
                      value={updateForm.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="active">Trabajando</option>
                      <option value="finished">Terminado</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setUpdateForm({
                          estado: "",
                          municipio: "",
                          hospital: "",
                          status: "active",
                        });
                      }}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
