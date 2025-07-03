"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Edit2,
  MapPin,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "../context/LocationContext";

export default function ActivityLog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
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
  const [editingUserId, setEditingUserId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const isInitialMount = useRef(true);
  const pollingInterval = useRef(null);
  const { updateLocation } = useLocation();

  // Obtener el ID del usuario actual
  const currentUserId =
    Number.parseInt(localStorage.getItem("userId"), 10) || 1;

  // Función para generar iniciales del nombre
  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Función para generar color de avatar basado en el nombre
  const getAvatarColor = (name) => {
    if (!name) return "bg-purple-500";
    const colors = [
      "bg-purple-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Obtener la información del superadmin logueado
  const fetchSuperadminWork = async () => {
    console.log("🔍 Intentando obtener información del superadmin...");
    try {
      // Primero obtenemos la información específica del superadmin
      const superadminResponse = await fetch(
        `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital-ubi/${currentUserId}`
      );

      if (!superadminResponse.ok)
        throw new Error("Error al obtener datos del superadmin");
      const superadminData = await superadminResponse.json();

      // Luego obtenemos la lista completa para mostrar otros administradores
      const allAdminsResponse = await fetch(
        "https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital-work"
      );

      if (!allAdminsResponse.ok)
        throw new Error("Error al obtener datos de trabajo");
      const allAdminsData = await allAdminsResponse.json();

      // Combinamos los datos
      const formattedActivities = allAdminsData
        .filter(
          (activity) => activity.id_user && activity.id_user !== currentUserId
        )
        .map((activity) => ({
          ...activity,
          id_user: Number.parseInt(activity.id_user, 10),
          status:
            activity.id_estado && activity.id_municipio && activity.id_hospital
              ? "active"
              : "inactive",
          nombre_completo:
            activity.nombre_completo ||
            `${activity.nombre || ""} ${activity.ap_paterno || ""} ${
              activity.ap_materno || ""
            }`
              .trim()
              .replace(/\s+/g, " "),
          ubicacion:
            activity.nombre_estado &&
            activity.nombre_municipio &&
            activity.nombre_hospital
              ? `${activity.nombre_estado}, ${activity.nombre_municipio} - ${activity.nombre_hospital}`
              : "Sin ubicación asignada",
        }))
        // Ordenar: activos primero, inactivos al final
        .sort((a, b) => {
          if (a.status === "active" && b.status === "inactive") return -1;
          if (a.status === "inactive" && b.status === "active") return 1;
          return 0;
        });

      // Agregamos la información del superadmin actual
      if (superadminData && superadminData.length > 0) {
        const currentUserData = {
          ...superadminData[0],
          id_user: currentUserId,
          status:
            superadminData[0].id_estado &&
            superadminData[0].id_municipio &&
            superadminData[0].id_hospital
              ? "active"
              : "inactive",
          nombre_completo:
            superadminData[0].nombre_completo ||
            `${superadminData[0].nombre || ""} ${
              superadminData[0].ap_paterno || ""
            } ${superadminData[0].ap_materno || ""}`
              .trim()
              .replace(/\s+/g, " "),
          ubicacion:
            superadminData[0].nombre_estado &&
            superadminData[0].nombre_municipio &&
            superadminData[0].nombre_hospital
              ? `${superadminData[0].nombre_estado}, ${superadminData[0].nombre_municipio} - ${superadminData[0].nombre_hospital}`
              : "Sin ubicación asignada",
        };
        formattedActivities.unshift(currentUserData);
      }

      setActivities(formattedActivities);
      const activeCount = formattedActivities.filter(
        (a) => a.status === "active"
      ).length;
      setActiveAdmins(activeCount);
    } catch (error) {
      console.error("❌ Error al obtener trabajo:", error);
      setActivities([]);
      setActiveAdmins(0);
    }
  };

  // Actualizar el trabajo del superadmin
  const updateSuperadminWork = async () => {
    let payload;
    if (updateForm.status === "finished") {
      payload = {
        id_user: currentUserId,
        id_estado: null,
        id_municipio: null,
        id_hospital: null,
      };
    } else {
      const estadoSeleccionado = estados.find(
        (e) => e.nombre_estado === updateForm.estado
      );
      // Verifica que el hospital seleccionado esté disponible
      const hospitalDisponible = hospitales.some(
        (h) => h.id_hospital?.toString() === updateForm.hospital
      );
      if (!hospitalDisponible) {
        alert(
          "El hospital seleccionado ya no está disponible. Por favor, selecciona otro hospital."
        );
        return;
      }
      payload = {
        id_user: currentUserId,
        id_estado: estadoSeleccionado?.id_estado,
        id_municipio: Number.parseInt(updateForm.municipio, 10),
        id_hospital: Number.parseInt(updateForm.hospital, 10),
      };
    }

    try {
      const response = await fetch(
        "https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el trabajo");
      }

      // Actualizar la ubicación en el contexto
      await updateLocation(currentUserId);

      await fetchSuperadminWork();
      setIsEditing(false);
      setEditingUserId(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (error) {
      console.error("❌ Error al actualizar trabajo:", error);
      alert("Error al actualizar el trabajo. Por favor, intente nuevamente.");
    }
  };

  // Función para iniciar el polling
  const startPolling = () => {
    // Detener el polling anterior si existe
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Iniciar nuevo polling cada 5 segundos
    pollingInterval.current = setInterval(() => {
      if (isOpen && !isEditing) {
        // Solo actualizar si el panel está abierto y no se está editando
        fetchSuperadminWork();
      }
    }, 5000); // 5 segundos
  };

  // Detener el polling cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Iniciar/detener polling cuando el panel se abre/cierra
  useEffect(() => {
    if (isOpen) {
      fetchSuperadminWork(); // Actualizar inmediatamente al abrir
      startPolling();
    } else {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    }
  }, [isOpen]);

  // El efecto inicial ahora solo se ejecuta una vez
  useEffect(() => {
    if (isInitialMount.current) {
      fetchSuperadminWork();
      isInitialMount.current = false;
    }
  }, [currentUserId]);

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
    } else {
      setMunicipios([]);
      setUpdateForm((prev) => ({
        ...prev,
        municipio: "",
        hospital: "",
      }));
    }
  }, [updateForm.estado, estados]);

  // Cargar hospitales libres cuando cambia municipio y estado
  useEffect(() => {
    if (
      updateForm.estado &&
      updateForm.municipio &&
      updateForm.status === "active"
    ) {
      const fetchHospitalesLibres = async () => {
        try {
          const estadoSeleccionado = estados.find(
            (e) => e.nombre_estado === updateForm.estado
          );
          if (!estadoSeleccionado) {
            setHospitales([]);
            return;
          }
          const res = await fetch(
            `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospitals-by-municipio?id_estado=${estadoSeleccionado.id_estado}&id_municipio=${updateForm.municipio}`
          );
          if (!res.ok) throw new Error("Error al obtener hospitales libres");
          const data = await res.json();
          setHospitales(data);
        } catch (error) {
          console.error("Error al obtener hospitales libres:", error);
          setHospitales([]);
        }
      };
      fetchHospitalesLibres();
    }
  }, [updateForm.estado, updateForm.municipio, updateForm.status, estados]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateSuperadminWork();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si el usuario cambia de "Terminado" a "Trabajando", limpia los campos de ubicación
    if (
      name === "status" &&
      value === "active" &&
      updateForm.status === "finished"
    ) {
      setUpdateForm((prev) => ({
        ...prev,
        status: value,
        estado: "",
        municipio: "",
        hospital: "",
      }));
      setMunicipios([]);
      setHospitales([]);
      return;
    }

    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startEditing = async (activity) => {
    if (activity.id_user === currentUserId) {
      setIsEditing(true);
      setEditingUserId(activity.id_user);

      // Si el usuario está en estado "inactivo" (terminado), inicia el formulario en "finished" y limpia los campos
      if (
        !activity.id_estado ||
        !activity.id_municipio ||
        !activity.id_hospital ||
        activity.status === "inactive"
      ) {
        setUpdateForm({
          estado: "",
          municipio: "",
          hospital: "",
          status: "finished",
        });
        setMunicipios([]);
        setHospitales([]);
        return;
      }

      const estado =
        estados.find((e) => e.id_estado === activity.id_estado)
          ?.nombre_estado || "";

      try {
        const estadoSeleccionado = estados.find(
          (e) => e.nombre_estado === estado
        );
        if (estadoSeleccionado) {
          // Cargar municipios
          const resMunicipios = await fetch(
            `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${estadoSeleccionado.id_estado}`
          );
          if (!resMunicipios.ok) throw new Error("Error al obtener municipios");
          const municipiosData = await resMunicipios.json();
          setMunicipios(municipiosData);

          // Si hay un municipio seleccionado, cargar hospitales LIBRES usando el endpoint correcto
          let hospitalesData = [];
          if (activity.id_municipio) {
            const resHospitales = await fetch(
              `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospitals-by-municipio?id_estado=${estadoSeleccionado.id_estado}&id_municipio=${activity.id_municipio}`
            );
            if (!resHospitales.ok)
              throw new Error("Error al obtener hospitales");
            hospitalesData = await resHospitales.json();

            // Si el hospital actual no está en la lista, agrégalo manualmente
            if (
              activity.id_hospital &&
              !hospitalesData.some(
                (h) => h.id_hospital === activity.id_hospital
              )
            ) {
              hospitalesData.push({
                id_hospital: activity.id_hospital,
                nombre_hospital:
                  activity.nombre_hospital || "Hospital asignado",
              });
            }

            setHospitales(hospitalesData);
          } else {
            setHospitales([]);
          }

          // Actualizar el formulario después de cargar los datos
          setUpdateForm({
            estado: estado,
            municipio: activity.id_municipio?.toString() || "",
            hospital:
              activity.id_hospital &&
              hospitalesData.some((h) => h.id_hospital === activity.id_hospital)
                ? activity.id_hospital.toString()
                : "",
            status: activity.status,
          });
        }
      } catch (error) {
        console.error("Error al cargar datos para edición:", error);
      }
    }
  };

  return (
    <>
      {/* Mensaje flotante de éxito */}
      {showSuccess && (
        <div className="fixed top-6 right-6 z-[9999] bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
          <CheckCircle2 className="h-5 w-5" />
          <span>¡Guardado correctamente!</span>
        </div>
      )}
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 z-[9999] flex items-center justify-center group p-3"
        style={{ width: '50px', height: '50px' }}
      >
        <Users className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold text-[10px]">
          {activeAdmins}
        </span>
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg">
          {isOpen ? 'Cerrar panel' : 'Ver administradores activos'}
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
              <Users className="h-5 w-5 text-emerald-600" />
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
            <div className="p-4 space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay actividades registradas
                </div>
              ) : (
                activities.map((activity) => {
                  const isCurrentUser = activity.id_user === currentUserId;
                  const isEditingThis =
                    isEditing && editingUserId === activity.id_user;
                  const userName =
                    activity.nombre_completo || "Usuario sin nombre";

                  return (
                    <div key={activity.id_user}>
                      {/* Tarjeta de actividad */}
                      <div
                        className={`border rounded-lg p-4 transition-all duration-200 relative ${
                          isCurrentUser
                            ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-lg shadow-emerald-200/30 ring-1 ring-emerald-300"
                            : activity.status === "inactive"
                            ? "bg-gray-50 border-gray-200 opacity-75"
                            : "bg-white border-gray-200 hover:shadow-sm"
                        } ${isEditingThis ? "mb-0" : "mb-3"}`}
                      >
                        {isCurrentUser && (
                          <div className="absolute -right-2 -top-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md border-2 border-white">
                            ✨ Tú
                          </div>
                        )}
                        <div
                          className={`flex items-center gap-3 ${
                            isCurrentUser ? "bg-emerald-50" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-lg ${getAvatarColor(
                                userName
                              )} flex items-center justify-center text-white font-bold text-lg ${
                                isCurrentUser
                                  ? "ring-2 ring-emerald-400 ring-offset-2"
                                  : ""
                              }`}
                            >
                              {getInitials(userName)}
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3
                                className={`text-base font-medium ${
                                  isCurrentUser
                                    ? "text-emerald-900"
                                    : "text-gray-900"
                                }`}
                              >
                                {userName}
                              </h3>
                              <div className="flex items-center gap-2">
                                {activity.status === "active" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Activo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full mr-1.5"></div>
                                    Sin asignar
                                  </span>
                                )}
                                {isCurrentUser && !isEditingThis && (
                                  <button
                                    onClick={() => startEditing(activity)}
                                    className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                    title="Editar mi ubicación"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="mt-1">
                              {activity.status === "active" ? (
                                <div className="flex items-start">
                                  <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0 mr-1" />
                                  <div>
                                    <p
                                      className={`text-xs ${
                                        isCurrentUser
                                          ? "text-emerald-600"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Trabajando en:
                                    </p>
                                    <p
                                      className={`text-sm ${
                                        isCurrentUser
                                          ? "text-emerald-700"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {activity.ubicacion}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                                  <div className="h-3 w-3 bg-gray-300 rounded-full mr-2 flex-shrink-0"></div>
                                  <span className="text-gray-500 text-sm font-medium">
                                    Fuera de servicio
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Formulario de edición inline */}
                      {isEditingThis && (
                        <div className="border border-emerald-200 border-t-0 rounded-b-lg bg-white p-4 mb-3">
                          <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Estado
                                </label>
                                <select
                                  name="estado"
                                  value={updateForm.estado}
                                  onChange={handleChange}
                                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                  required={updateForm.status === "active"}
                                  disabled={updateForm.status === "finished"}
                                >
                                  <option value="">Seleccionar</option>
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

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Municipio
                                </label>
                                <select
                                  name="municipio"
                                  value={updateForm.municipio}
                                  onChange={handleChange}
                                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                  required={updateForm.status === "active"}
                                  disabled={
                                    !updateForm.estado ||
                                    updateForm.status === "finished"
                                  }
                                >
                                  <option value="">Seleccionar</option>
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
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Hospital
                                </label>
                                <select
                                  name="hospital"
                                  value={updateForm.hospital}
                                  onChange={handleChange}
                                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                  required={updateForm.status === "active"}
                                  disabled={
                                    !updateForm.municipio ||
                                    updateForm.status === "finished"
                                  }
                                >
                                  {/* Si no hay hospital seleccionado, muestra "Seleccionar" */}
                                  {!updateForm.hospital && (
                                    <option value="">Seleccionar</option>
                                  )}
                                  {/* Mostrar el hospital seleccionado si existe en la lista actual */}
                                  {updateForm.hospital &&
                                    hospitales.some(
                                      (h) =>
                                        h.id_hospital?.toString() ===
                                        updateForm.hospital
                                    ) && (
                                      <option value={updateForm.hospital}>
                                        {hospitales.find(
                                          (h) =>
                                            h.id_hospital?.toString() ===
                                            updateForm.hospital
                                        )?.nombre_hospital ||
                                          activities.find(
                                            (a) => a.id_user === currentUserId
                                          )?.nombre_hospital ||
                                          "Hospital asignado"}
                                      </option>
                                    )}
                                  {/* Si el hospital seleccionado NO está en la lista, pero hay un hospital en activities, mostrarlo como opción seleccionada */}
                                  {updateForm.hospital &&
                                    !hospitales.some(
                                      (h) =>
                                        h.id_hospital?.toString() ===
                                        updateForm.hospital
                                    ) &&
                                    activities.find(
                                      (a) =>
                                        a.id_user === currentUserId &&
                                        a.id_hospital?.toString() ===
                                          updateForm.hospital
                                    ) && (
                                      <option value={updateForm.hospital}>
                                        {activities.find(
                                          (a) =>
                                            a.id_user === currentUserId &&
                                            a.id_hospital?.toString() ===
                                              updateForm.hospital
                                        )?.nombre_hospital ||
                                          "Hospital asignado"}
                                      </option>
                                    )}
                                  {hospitales
                                    .filter(
                                      (hospital) =>
                                        hospital.id_hospital?.toString() !==
                                        updateForm.hospital
                                    )
                                    .map((hospital) => (
                                      <option
                                        key={hospital.id_hospital}
                                        value={hospital.id_hospital}
                                      >
                                        {hospital.nombre_hospital}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Estatus de trabajo
                                </label>
                                <select
                                  name="status"
                                  value={updateForm.status}
                                  onChange={handleChange}
                                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                  required
                                >
                                  <option value="active">Trabajando</option>
                                  <option value="finished">Terminado</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditingUserId(null);
                                }}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-300"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center gap-1"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Guardar
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
