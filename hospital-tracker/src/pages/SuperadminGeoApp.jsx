import { useState } from "react";
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

  const [adminForm, setAdminForm] = useState({
    nombres: "",
    apellidos: "",
    estado: "",
    curp: "", // Cambiado de rfc a curp
    correo: "",
    telefono: "",
    hospital: "",
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevoHospital = { ...form, geocerca };
    setHospitales([...hospitales, nuevoHospital]);
    setForm({ estado: "", nombre: "", tipoUnidad: "", region: "" });
    setGeocerca(null);
    setMostrarFormulario(false);
  };

  const handleMostrarFormulario = () => {
    setMostrarFormulario(true);
    setMostrarFormAdmin(false);
  };

  const handleMostrarFormAdmin = () => {
    setMostrarFormAdmin(true);
    setMostrarFormulario(false);
  };

  const handleCancelarHospital = () => {
    setForm({ estado: "", nombre: "", tipoUnidad: "", region: "" });
    setGeocerca(null);
    setMostrarFormulario(false);
  };

  const handleCancelarAdmin = () => {
    setMostrarFormAdmin(false);
    setAdminForm({
      nombres: "",
      apellidos: "",
      estado: "",
      curp: "", // Asegúrate de limpiar el valor de curp también
      correo: "",
      telefono: "",
      hospital: "",
    });
  };

  const handleInicio = () => {
    setMostrarFormulario(false);
    setMostrarFormAdmin(false);
  };

  const handleSubmitAdmin = (e) => {
    e.preventDefault();
    console.log("Administrador creado:", adminForm);
    setMostrarFormAdmin(false);
    setAdminForm({
      nombres: "",
      apellidos: "",
      curp: "", // Limpiar curp al enviar
      correo: "",
      telefono: "",
      hospital: "",
    });
  };

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
            📋 Nuevo Hospital
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
                    {estado}
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
                <option value="Clínica">Clínica</option>
                <option value="Hospital General">Hospital General</option>
                <option value="Centro de Seguridad Social">
                  Centro de Seguridad Social
                </option>
                <option value="Módulo de Atención">Módulo de Atención</option>
                <option value="Otro">Otro</option>
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
                Guardar hospital
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
              <label className="block mb-1 text-gray-700">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={adminForm.apellidos}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, apellidos: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">CURP</label>
              <input
                type="text"
                name="curp"
                value={adminForm.curp}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, curp: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700">
                Correo electrónico
              </label>
              <input
                type="email"
                name="correo"
                value={adminForm.correo}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, correo: e.target.value })
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
                onChange={(e) =>
                  setAdminForm({ ...adminForm, estado: e.target.value })
                }
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
            
            <div>
              <label className="block mb-1 text-gray-700">
                Hospital asignado
              </label>
              <select
                name="hospital"
                value={adminForm.hospital}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, hospital: e.target.value })
                }
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Selecciona un hospital</option>
                <option value="Hospital General de Cancun">
                  Hospital General de Cancún
                </option>
                <option value="Clinica General Benito Juarez">
                  Clínica General Benito Juárez
                </option>
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
                {hospitales.length > 0 ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {hospitales.map((h, i) => (
                        <tr key={i} className="hover:bg-blue-50">
                          <td className="p-2 border-b">{h.nombre}</td>
                          <td className="p-2 border-b">{h.estado}</td>
                          <td className="p-2 border-b">{h.tipoUnidad}</td>
                          <td className="p-2 border-b">{h.region}</td>
                          <td className="p-2 border-b">
                            {h.geocerca?.lat.toFixed(4)}
                          </td>
                          <td className="p-2 border-b">
                            {h.geocerca?.lng.toFixed(4)}
                          </td>
                          <td className="p-2 border-b">{h.geocerca?.radio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                {/* Aquí iría la lógica para mostrar la tabla o lista de administradores cuando la implementes */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
