import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GeocercaMap from "../components/GeocercaMap"; // Asegúrate de tener este componente

export default function AdminEstadoApp() {
  const [hospitales, setHospitales] = useState([]);
  const [mostrarFormAdminHospital, setMostrarFormAdminHospital] =
    useState(false);
  const [mostrarFormNuevoHospital, setMostrarFormNuevoHospital] =
    useState(false);
  const [adminHospitalForm, setAdminHospitalForm] = useState({
    nombres: "",
    apellidos: "",
    curp: "", // Nuevo campo
    correo: "",
    telefono: "",
    hospitalId: "", // Necesitamos el ID del hospital al que se asignará este admin
  });
  const [nuevoHospitalForm, setNuevoHospitalForm] = useState({
    nombre: "",
    tipoUnidad: "",
    region: "",
    geocerca: null,
  });
  const [mapCenter, setMapCenter] = useState([23.6345, -102.5528]); // Centro por defecto del mapa
  const [activeTab, setActiveTab] = useState("hospitales");
  const navigate = useNavigate();
  const { setIsAuthenticated, user } = useAuth(); // Asumo que 'user' contiene información del admin logueado, incluyendo su estado asignado

  useEffect(() => {
    // Aquí deberías hacer una llamada a tu backend para obtener la lista de hospitales
    // que pertenecen al estado asignado al administrador actual (user?.estadoAsignado).
    // Por ahora, usaré un array estático de ejemplo.
    const hospitalesDelEstado = [
      {
        id: 1,
        nombre: "Hospital General A",
        estado: user?.estadoAsignado || "Quintana Roo",
      },
      {
        id: 2,
        nombre: "Clínica B",
        estado: user?.estadoAsignado || "Quintana Roo",
      },
      // ... más hospitales de este estado
    ];
    setHospitales(
      hospitalesDelEstado.filter((h) => h.estado === user?.estadoAsignado)
    );
  }, [user?.estadoAsignado]);

  const handleMostrarFormAdminHospital = () => {
    setMostrarFormAdminHospital(true);
    setMostrarFormNuevoHospital(false);
  };

  const handleCancelarAdminHospital = () => {
    setMostrarFormAdminHospital(false);
    setAdminHospitalForm({
      nombres: "",
      apellidos: "",
      curp: "",
      correo: "",
      telefono: "",
      hospitalId: "",
    });
  };

  const handleAdminHospitalFormChange = (e) => {
    setAdminHospitalForm({
      ...adminHospitalForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitAdminHospital = (e) => {
    e.preventDefault();
    // Aquí deberías enviar los datos de adminHospitalForm al backend para crear el nuevo
    // administrador de hospital asignado al hospitalId seleccionado.
    console.log("Administrador de Hospital creado:", adminHospitalForm);
    setMostrarFormAdminHospital(false);
    setAdminHospitalForm({
      nombres: "",
      apellidos: "",
      curp: "",
      correo: "",
      telefono: "",
      hospitalId: "",
    });
  };

  const handleMostrarFormNuevoHospital = () => {
    setMostrarFormNuevoHospital(true);
    setMostrarFormAdminHospital(false);
  };

  const handleCancelarNuevoHospital = () => {
    setMostrarFormNuevoHospital(false);
    setNuevoHospitalForm({
      nombre: "",
      tipoUnidad: "",
      region: "",
      geocerca: null,
    });
  };

  const handleNuevoHospitalFormChange = (e) => {
    setNuevoHospitalForm({
      ...nuevoHospitalForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleGeocercaChange = (coords) => {
    setNuevoHospitalForm({ ...nuevoHospitalForm, geocerca: coords });
  };

  const handleSubmitNuevoHospital = (e) => {
    e.preventDefault();
    if (nuevoHospitalForm.geocerca) {
      const nuevoHospital = {
        ...nuevoHospitalForm,
        estado: user?.estadoAsignado, // Asignamos el estado del admin
      };
      // Aquí deberías enviar 'nuevoHospital' al backend para crear el nuevo hospital
      console.log("Nuevo Hospital a crear:", nuevoHospital);
      setHospitales([...hospitales, { id: Date.now(), ...nuevoHospital }]); // Simulación de agregar localmente
      setMostrarFormNuevoHospital(false);
      setNuevoHospitalForm({
        nombre: "",
        tipoUnidad: "",
        region: "",
        geocerca: null,
      });
    } else {
      alert("Por favor, define la geocerca para el hospital.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* NAVBAR */}
      <nav className="bg-green-700 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-white">
          🏥 Panel del Administrador de Estado (
          {user?.estadoAsignado || "Estado"})
        </h1>

        <div className="space-x-4">
          <button
            onClick={() => setActiveTab("hospitales")}
            className={`bg-white text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition ${
              activeTab === "hospitales" ? "underline" : ""
            }`}
          >
            Hospitales
          </button>
          <button
            onClick={handleMostrarFormNuevoHospital}
            className="bg-white text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Crear Hospital
          </button>
          <button
            onClick={handleMostrarFormAdminHospital}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-800 transition"
          >
            Crear Admin. de Hospital
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

      {/* FORMULARIO CREAR NUEVO HOSPITAL */}
      {mostrarFormNuevoHospital && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            🏥 Nuevo Hospital en {user?.estadoAsignado || "Este Estado"}
          </h2>
          <form
            onSubmit={handleSubmitNuevoHospital}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block mb-1 text-gray-700">
                Nombre del hospital
              </label>
              <input
                type="text"
                name="nombre"
                value={nuevoHospitalForm.nombre}
                onChange={handleNuevoHospitalFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Tipo de unidad</label>
              <select
                name="tipoUnidad"
                value={nuevoHospitalForm.tipoUnidad}
                onChange={handleNuevoHospitalFormChange}
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
                value={nuevoHospitalForm.region}
                onChange={handleNuevoHospitalFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block mb-1 text-gray-700">
                Definir Geocerca
              </label>
              <div className="rounded-lg overflow-hidden">
                <GeocercaMap
                  onCoordsChange={handleGeocercaChange}
                  centerFromOutside={mapCenter}
                />
              </div>
              {nuevoHospitalForm.geocerca && (
                <p className="mt-2 text-sm text-gray-600">
                  Geocerca definida: Lat:{" "}
                  {nuevoHospitalForm.geocerca.lat?.toFixed(4)}, Lng:{" "}
                  {nuevoHospitalForm.geocerca.lng?.toFixed(4)}, Radio:{" "}
                  {nuevoHospitalForm.geocerca.radio} metros
                </p>
              )}
            </div>
            <div className="col-span-2 flex justify-end mt-4">
              <button
                type="button"
                onClick={handleCancelarNuevoHospital}
                className="text-red-600 hover:underline px-6 py-2 mr-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Guardar Hospital
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORMULARIO CREAR ADMIN DE HOSPITAL */}
      {mostrarFormAdminHospital && (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">
            👤 Crear Administrador de Hospital
          </h2>
          <form
            onSubmit={handleSubmitAdminHospital}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block mb-1 text-gray-700">Nombres</label>
              <input
                type="text"
                name="nombres"
                value={adminHospitalForm.nombres}
                onChange={handleAdminHospitalFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Apellidos</label>
              <input
                type="text"
                name="apellidos"
                value={adminHospitalForm.apellidos}
                onChange={handleAdminHospitalFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">CURP</label>
              <input
                type="text"
                name="curp"
                value={adminHospitalForm.curp}
                onChange={handleAdminHospitalFormChange}
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
                value={adminHospitalForm.correo}
                onChange={handleAdminHospitalFormChange}
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
                value={adminHospitalForm.telefono}
                onChange={handleAdminHospitalFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-700">
                Hospital asignado
              </label>
              <select
                name="hospitalId"
                value={adminHospitalForm.hospitalId}
                onChange={handleAdminHospitalFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Selecciona un hospital</option>
                {hospitales.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex justify-end mt-4">
              <button
                type="button"
                onClick={handleCancelarAdminHospital}
                className="text-red-600 hover:underline px-6 py-2 mr-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Crear Administrador
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONTENIDO: LISTA DE HOSPITALES */}
      {!mostrarFormNuevoHospital &&
        !mostrarFormAdminHospital &&
        activeTab === "hospitales" && (
          <div className="max-w-6xl mx-auto mt-10 px-4">
            <div className="bg-white shadow-md rounded-xl p-6">
              <h3 className="text-xl font-semibold text-green-700 mb-4">
                🏥 Hospitales en {user?.estadoAsignado || "Este Estado"}
              </h3>
              {hospitales.length > 0 ? (
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-green-100 text-green-800 text-left">
                      <th className="p-2 border-b">Nombre</th>
                      {/* <th className="p-2 border-b">Estado</th> Ya sabemos que es el estado del admin */}
                      {/* Aquí podrías añadir más columnas si es necesario */}
                    </tr>
                  </thead>
                  <tbody>
                    {hospitales.map((hospital) => (
                      <tr key={hospital.id} className="hover:bg-green-50">
                        <td className="p-2 border-b">{hospital.nombre}</td>
                        {/* <td className="p-2 border-b">{hospital.estado}</td> */}
                        {/* Renderiza más datos del hospital si los tienes */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">
                  No hay hospitales registrados en este estado.
                </p>
              )}
            </div>
          </div>
        )}

      {/* Aquí podrías añadir más pestañas para ver grupos y empleados si es necesario para este rol */}
    </div>
  );
}
