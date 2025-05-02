import { useEffect, useState } from "react";
import GeocercaMap from "../components/GeocercaMap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SuperadminGeoApp() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [hospitales, setHospitales] = useState([]);
  const [geocerca, setGeocerca] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]);
  const [activeTab, setActiveTab] = useState("hospitales");
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const [paginaActual, setPaginaActual] = useState(1);
  const hospitalesPorPagina = 20;
  const [estadoFiltro, setEstadoFiltro] = useState(""); // Para el filtro por estado
  const [hospitalesFiltradosPorEstado, setHospitalesFiltradosPorEstado] =
    useState([]);
  // Estado para el modo de edición
  const [editandoHospital, setEditandoHospital] = useState(false);
  const [hospitalEditando, setHospitalEditando] = useState(null);
  const [hospitalIndexEditando, setHospitalIndexEditando] = useState(null);
  const [adminForm, setAdminForm] = useState({
    nombres: "",
    ap_paterno: "",
    ap_materno: "",
    RFC: "",
    telefono: "",
    estado: "",
  });
  const [form, setForm] = useState({
    estado: "",
    nombre: "",
    tipoUnidad: "",
    region: "",
  });

  const buscarCoordenadasEstado = async (estado) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?country=Mexico&state=${estado}&format=json`
    );
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      setMapCenter([parseFloat(lat), parseFloat(lon)]);
    }
  };

  useEffect(() => {
    const fetchHospitales = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/superadmin/hospitals"
        );
        const data = await response.json();
        console.log("Hospitales desde la API:", data);

        const hospitalesFormateados = data.map((h) => ({
          nombre: (h.nombre_hospital || "").replace(/\s+/g, " ").trim(),
          estado: (h.estado || "").trim(),
          tipoUnidad: (h.tipo_hospital || "").replace(/\s+/g, " ").trim(),
          region: (h.direccion_hospital || "").replace(/\s+/g, " ").trim(),
          geocerca: {
            lat: parseFloat(h.latitud_hospital) || 0,
            lng: parseFloat(h.longitud_hospital) || 0,
            radio: h.radio_geo ?? 0,
          },
        }));

        setHospitales(hospitalesFormateados);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
      }
    };

    fetchHospitales();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Asegurar que geocerca tenga un valor adecuado
    const geocercaFinal = geocerca || { lat: 0, lng: 0, radio: 0 };

    if (editandoHospital && hospitalIndexEditando !== null) {
      // Actualizar el hospital existente
      const nuevosHospitales = [...hospitales];
      nuevosHospitales[hospitalIndexEditando] = {
        ...form,
        geocerca: geocercaFinal,
      };
      setHospitales(nuevosHospitales);

      console.log(
        "Hospital actualizado:",
        nuevosHospitales[hospitalIndexEditando]
      );

      // Aquí se podría enviar la actualización al backend
      // const actualizarHospitalEnBackend = async () => {
      //   try {
      //     await fetch(`http://localhost:4000/api/superadmin/hospitals/${id}`, {
      //       method: 'PUT',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify(nuevosHospitales[hospitalIndexEditando])
      //     });
      //   } catch (error) {
      //     console.error("Error al actualizar hospital:", error);
      //   }
      // };
      // actualizarHospitalEnBackend();

      // Resetear el estado de edición
      setEditandoHospital(false);
      setHospitalEditando(null);
      setHospitalIndexEditando(null);
    } else {
      // Crear un nuevo hospital
      const nuevoHospital = { ...form, geocerca: geocercaFinal };
      setHospitales([...hospitales, nuevoHospital]);

      console.log("Nuevo hospital creado:", nuevoHospital);

      // Aquí se podría enviar el nuevo hospital al backend
      // const enviarHospitalABackend = async () => {
      //   try {
      //     await fetch('http://localhost:4000/api/superadmin/hospitals', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify(nuevoHospital)
      //     });
      //   } catch (error) {
      //     console.error("Error al crear hospital:", error);
      //   }
      // };
      // enviarHospitalABackend();
    }

    // Resetear el formulario
    setForm({ estado: "", nombre: "", tipoUnidad: "", region: "" });
    setGeocerca(null);
    setMostrarFormulario(false);
  };

  const handleMostrarFormulario = () => {
    setMostrarFormulario(true);
    setMostrarFormAdmin(false);
    setEditandoHospital(false); // Asegurarse de que no estamos en modo edición
    setForm({ estado: "", nombre: "", tipoUnidad: "", region: "" }); // Limpiar el formulario
    setGeocerca(null);
  };

  const handleMostrarFormAdmin = () => {
    setMostrarFormAdmin(true);
    setMostrarFormulario(false);
  };

  const handleCancelarHospital = () => {
    setForm({ estado: "", nombre: "", tipoUnidad: "", region: "" });
    setGeocerca(null);
    setMostrarFormulario(false);
    setEditandoHospital(false);
    setHospitalEditando(null);
    setHospitalIndexEditando(null);
  };

  const handleCancelarAdmin = () => {
    setMostrarFormAdmin(false);
    setAdminForm({
      nombres: "",
      ap_paterno: "",
      ap_materno: "",
      RFC: "",
      telefono: "",
      estado: "",
    });
  };

  const handleInicio = () => {
    setMostrarFormulario(false);
    setMostrarFormAdmin(false);
    setEditandoHospital(false);
    setHospitalEditando(null);
    setHospitalIndexEditando(null);
  };

  const handleSubmitAdmin = async (e) => {
    e.preventDefault();

    // Generar usuario: primera letra del nombre + apellido paterno
    const user =
      adminForm.nombres.trim().charAt(0).toLowerCase() +
      adminForm.ap_paterno.trim().toLowerCase().replace(/\s+/g, "");

    // Generar contraseña aleatoria simple
    const generarPassword = () => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let password = "";
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const pass = generarPassword();

    try {
      const response = await fetch(
        "http://localhost:4000/api/superadmin/create-admin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: adminForm.nombres,
            ap_paterno: adminForm.ap_paterno,
            ap_materno: adminForm.ap_materno,
            RFC: adminForm.RFC,
            user,
            pass,
            role_name: "estadoadmin", // fijo según tu ejemplo
          }),
        }
      );

      if (!response.ok) throw new Error("Fallo al crear el administrador");

      const data = await response.json();
      alert(`✅ ${data.message}\n🆔 Usuario: ${user}\n🔑 Contraseña: ${pass}`);

      setMostrarFormAdmin(false);
      setAdminForm({
        nombres: "",
        ap_paterno: "",
        ap_materno: "",
        RFC: "",
        telefono: "",
        estado: "",
      });
    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error al crear el administrador.");
    }
  };

  // Función para editar un hospital
  // Modify the handleEditarHospital function to normalize the state name
  const handleEditarHospital = (hospital, index) => {
    setEditandoHospital(true);
    setHospitalEditando(hospital);
    setHospitalIndexEditando(index);
    setMostrarFormulario(true);
    setMostrarFormAdmin(false);

    // Function to normalize state names (convert to title case)
    const normalizeStateName = (stateName) => {
      if (!stateName) return "";
      // Convert state name to title case (first letter uppercase, rest lowercase)
      return stateName
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // Normalize the state name to match the format in the dropdown
    const estadoNormalizado = normalizeStateName(hospital.estado);

    // Verificar que todos los campos tengan valores válidos
    const hospitalProcesado = {
      estado: estadoNormalizado,
      nombre: hospital.nombre || "",
      tipoUnidad: hospital.tipoUnidad || "",
      region: hospital.region || "",
    };

    // Llenar el formulario con los datos del hospital
    setForm(hospitalProcesado);

    // Establecer la geocerca
    const geocercaValida =
      hospital.geocerca &&
      typeof hospital.geocerca === "object" &&
      (hospital.geocerca.lat !== undefined ||
        hospital.geocerca.lng !== undefined);

    if (geocercaValida) {
      setGeocerca(hospital.geocerca);
    } else {
      setGeocerca({
        lat: 0,
        lng: 0,
        radio: 0,
      });
    }

    // Ajustar el centro del mapa
    if (geocercaValida && hospital.geocerca.lat && hospital.geocerca.lng) {
      setMapCenter([hospital.geocerca.lat, hospital.geocerca.lng]);
    } else if (hospital.estado) {
      buscarCoordenadasEstado(estadoNormalizado);
    }

    console.log("Editando hospital:", hospitalProcesado);
  };
  // FILTRO y PAGINADO
  const hospitalesFiltrados = estadoFiltro
    ? hospitales.filter(
        (h) => h.estado.toLowerCase() === estadoFiltro.toLowerCase()
      )
    : hospitales;

  const indexInicio = (paginaActual - 1) * hospitalesPorPagina;
  const indexFin = indexInicio + hospitalesPorPagina;
  const hospitalesPagina = hospitalesFiltrados.slice(indexInicio, indexFin);

  const totalPaginas = Math.ceil(
    hospitalesFiltrados.length / hospitalesPorPagina
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* NAVBAR */}
      <nav className="bg-blue-700 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-white">
          🏥 Panel del Superadmin
        </h1>

        <div className="space-x-4">
          <button
            onClick={handleInicio}
            className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Inicio
          </button>
          <button
            onClick={handleMostrarFormulario}
            className="bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Crear Hospital
          </button>

          <button
            onClick={handleMostrarFormAdmin}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            Crear Administrador
          </button>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              navigate("/");
            }}
            className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* TABS */}
      {!mostrarFormulario && !mostrarFormAdmin && (
        <div className="flex justify-center space-x-8 mt-6">
          <button
            className={`text-lg font-medium ${
              activeTab === "hospitales"
                ? "text-blue-700 border-b-2 border-blue-700"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("hospitales")}
          >
            Hospitales
          </button>
          <button
            className={`text-lg font-medium ${
              activeTab === "administradores"
                ? "text-blue-700 border-b-2 border-blue-700"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("administradores")}
          >
            Administradores
          </button>
        </div>
      )}

      {/* FORMULARIO HOSPITAL */}
      {mostrarFormulario && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            {editandoHospital ? "✏️ Editar Hospital" : "📋 Nuevo Hospital"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block mb-1 text-gray-700">Estado</label>
              <select
                name="estado"
                value={form.estado}
                onChange={(e) => {
                  handleChange(e);
                  buscarCoordenadasEstado(e.target.value);
                }}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Selecciona un estado</option>
                {[
                  "Aguascalientes",
                  "Baja California",
                  "Baja California Sur",
                  "Campeche",
                  "Chiapas",
                  "Chihuahua",
                  "Ciudad de México",
                  "Coahuila",
                  "Colima",
                  "Durango",
                  "Estado de México",
                  "Guanajuato",
                  "Guerrero",
                  "Hidalgo",
                  "Jalisco",
                  "Michoacán",
                  "Morelos",
                  "Nayarit",
                  "Nuevo León",
                  "Oaxaca",
                  "Puebla",
                  "Querétaro",
                  "Quintana Roo",
                  "San Luis Potosí",
                  "Sinaloa",
                  "Sonora",
                  "Tabasco",
                  "Tamaulipas",
                  "Tlaxcala",
                  "Veracruz",
                  "Yucatán",
                  "Zacatecas",
                ].map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.toUpperCase()} {/* Esta línea fue modificada */}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-700">
                Nombre del hospital
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">Tipo de unidad</label>
              <select
                name="tipoUnidad"
                value={form.tipoUnidad}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Selecciona una opción</option>
                <option value="CLINICA">CLINICA</option>
                <option value="HOSPITAL">HOSPITAL</option>
                <option value="IMMS BIENESTAR">IMMS BIENESTAR</option>
                <option value="UNIDADES MEDICAS">UNIDADES MEDICAS</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-700">Región</label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <GeocercaMap
              onCoordsChange={setGeocerca}
              centerFromOutside={mapCenter}
              initialGeocerca={geocerca}
            />

            <div className="col-span-2 flex justify-between mt-4">
              <button
                type="button"
                onClick={handleCancelarHospital}
                className="text-red-600 hover:underline px-6 py-2"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editandoHospital ? "Actualizar hospital" : "Guardar hospital"}
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarFormAdmin && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">
            👤 Crear Administrador
          </h2>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmitAdmin}
          >
            <div>
              <label className="block mb-1 text-gray-700">Nombres</label>
              <input
                type="text"
                name="nombres"
                value={adminForm.nombres}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, nombres: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">
                Apellido paterno
              </label>
              <input
                type="text"
                name="ap_paterno"
                value={adminForm.ap_paterno}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, ap_paterno: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">
                Apellido materno
              </label>
              <input
                type="text"
                name="ap_materno"
                value={adminForm.ap_materno}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, ap_materno: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">RFC</label>
              <input
                type="text"
                name="RFC"
                value={adminForm.RFC}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, RFC: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">
                Número de teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={adminForm.telefono}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, telefono: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">Estado</label>
              <select
                name="estado"
                value={adminForm.estado}
                onChange={(e) => {
                  const estadoSeleccionado = e.target.value;
                  setAdminForm({ ...adminForm, estado: estadoSeleccionado });

                  const hospitalesDelEstado = hospitales.filter(
                    (h) =>
                      h.estado.toLowerCase() ===
                      estadoSeleccionado.toLowerCase()
                  );
                  setHospitalesFiltradosPorEstado(hospitalesDelEstado);
                }}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Selecciona un estado</option>
                {[
                  "Aguascalientes",
                  "Baja California",
                  "Baja California Sur",
                  "Campeche",
                  "Chiapas",
                  "Chihuahua",
                  "Ciudad de México",
                  "Coahuila",
                  "Colima",
                  "Durango",
                  "Estado de México",
                  "Guanajuato",
                  "Guerrero",
                  "Hidalgo",
                  "Jalisco",
                  "Michoacán",
                  "Morelos",
                  "Nayarit",
                  "Nuevo León",
                  "Oaxaca",
                  "Puebla",
                  "Querétaro",
                  "Quintana Roo",
                  "San Luis Potosí",
                  "Sinaloa",
                  "Sonora",
                  "Tabasco",
                  "Tamaulipas",
                  "Tlaxcala",
                  "Veracruz",
                  "Yucatán",
                  "Zacatecas",
                ].map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex justify-between mt-4">
              <button
                type="button"
                onClick={handleCancelarAdmin}
                className="text-red-600 hover:underline px-6 py-2"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Guardar Administrador
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTENIDO SEGÚN TAB */}
      <div className="max-w-6xl mx-auto mt-10 px-4">
        {!mostrarFormulario && !mostrarFormAdmin && (
          <>
            {activeTab === "hospitales" && (
              <div className="bg-white shadow-md rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-700 mb-4">
                  🏥 Hospitales registrados
                </h3>

                {/* Filtro por estado */}
                <div className="mb-4 flex justify-between items-center">
                  <label className="text-gray-700 font-medium">
                    Filtrar por estado:
                  </label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => {
                      setEstadoFiltro(e.target.value);
                      setPaginaActual(1);
                    }}
                    className="ml-2 px-4 py-2 border rounded-lg"
                  >
                    <option value="">Todos</option>
                    {[...new Set(hospitales.map((h) => h.estado))]
                      .filter(Boolean)
                      .sort()
                      .map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tabla de hospitales */}
                {hospitalesFiltrados.length > 0 ? (
                  <>
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr className="bg-blue-100 text-blue-800 text-left">
                          <th className="p-2 border-b">Nombre</th>
                          <th className="p-2 border-b">Estado</th>
                          <th className="p-2 border-b">Tipo</th>
                          <th className="p-2 border-b">Región</th>
                          <th className="p-2 border-b">Lat</th>
                          <th className="p-2 border-b">Lng</th>
                          <th className="p-2 border-b">Radio (m)</th>
                          <th className="p-2 border-b">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hospitalesPagina.map((h, i) => {
                          // Calcular el índice real en la lista completa
                          const indiceReal = indexInicio + i;
                          return (
                            <tr key={i} className="hover:bg-blue-50">
                              <td className="p-2 border-b">{h.nombre}</td>
                              <td className="p-2 border-b">{h.estado}</td>
                              <td className="p-2 border-b">{h.tipoUnidad}</td>
                              <td className="p-2 border-b">{h.region}</td>
                              <td className="p-2 border-b">
                                {h.geocerca?.lat?.toFixed(4) ?? "N/A"}
                              </td>
                              <td className="p-2 border-b">
                                {h.geocerca?.lng?.toFixed(4) ?? "N/A"}
                              </td>
                              <td className="p-2 border-b">
                                {h.geocerca?.radio ?? "N/A"}
                              </td>
                              <td className="p-2 border-b">
                                <button
                                  onClick={() =>
                                    handleEditarHospital(h, indiceReal)
                                  }
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  ✏️ Editar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Controles de paginación */}
                    <div className="mt-4 flex justify-center space-x-2">
                      <button
                        onClick={() =>
                          setPaginaActual((p) => Math.max(p - 1, 1))
                        }
                        disabled={paginaActual === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="text-gray-700 px-4 py-2">
                        Página {paginaActual} de {totalPaginas}
                      </span>
                      <button
                        onClick={() =>
                          setPaginaActual((p) => Math.min(p + 1, totalPaginas))
                        }
                        disabled={paginaActual === totalPaginas}
                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">
                    No hay hospitales registrados.
                  </p>
                )}
              </div>
            )}

            {activeTab === "administradores" && (
              <div className="bg-white shadow-md rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-700 mb-4">
                  👤 Administradores registrados
                </h3>
                <p className="text-gray-500">
                  No hay administradores registrados todavía.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
