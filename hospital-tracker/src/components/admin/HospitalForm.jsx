// HospitalForm.jsx
import { useState, useEffect } from "react";
import GeocercaMap from "../GeocercaMap";
import { Building2, Check, MapPin, Save, X } from "lucide-react";

export default function HospitalForm({
  editandoHospital = false,
  hospitalEditando = null,
  mapCenter,
  geocerca,
  onCoordsChange,
  onBuscarCoordenadasEstado,
  onGuardar,
  onCancelar,
}) {
  const [form, setForm] = useState({
    estado: "",
    nombre: "",
    tipoUnidad: "",
    region: "",
    lat: "",
    lng: "",
  });

  const [estados, setEstados] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (editandoHospital && hospitalEditando) {
      setForm({
        estado: hospitalEditando.estado || "",
        nombre: hospitalEditando.nombre || "",
        tipoUnidad: hospitalEditando.tipoUnidad || "",
        region: hospitalEditando.region || "",
        lat: hospitalEditando.geocerca?.lat?.toString() || "",
        lng: hospitalEditando.geocerca?.lng?.toString() || "",
      });
    }
  }, [editandoHospital, hospitalEditando]);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/superadmin/estados"
        );
        const data = await response.json();
        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setTouched({ ...touched, [name]: true });
    if (name === "estado") onBuscarCoordenadasEstado(value);
  };

  const handleCoordsManually = (e) => {
    const { name, value } = e.target;
    const newCoords = { ...form, [name]: value };
    setForm(newCoords);
    if (name === "lat" || name === "lng") {
      const lat = parseFloat(newCoords.lat);
      const lng = parseFloat(newCoords.lng);
      if (!isNaN(lat) && !isNaN(lng)) handleHospitalCoordsChange({ lat, lng });
    }
  };

  const handleHospitalCoordsChange = (coords) => {
    setForm((prev) => ({
      ...prev,
      lat: coords.lat.toString(),
      lng: coords.lng.toString(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editandoHospital && (!form.lat || !form.lng)) {
      alert("Debes ingresar coordenadas válidas para el hospital.");
      return;
    }

    const geocercaFinal = geocerca || { lat: 0, lng: 0, radio: 0 };

    const hospitalData = {
      ...form,
      geocerca: geocercaFinal,
    };

    onGuardar(hospitalData);
  };

  const lat = parseFloat(form.lat);
  const lng = parseFloat(form.lng);
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-emerald-600" />
          {editandoHospital ? "Editar Hospital" : "Nuevo Hospital"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-lg"
              required
            >
              <option value="">Selecciona un estado</option>
              {estados.map((estado) => (
                <option key={estado.id_estado} value={estado.nombre_estado}>
                  {estado.nombre_estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de unidad
            </label>
            <select
              name="tipoUnidad"
              value={form.tipoUnidad}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-lg"
              required
            >
              <option value="">Selecciona una opción</option>
              <option value="CLINICA">CLÍNICA</option>
              <option value="HOSPITAL">HOSPITAL</option>
              <option value="IMMS BIENESTAR">IMSS BIENESTAR</option>
              <option value="UNIDADES MEDICAS">UNIDADES MÉDICAS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Región
            </label>
            <input
              type="text"
              name="region"
              value={form.region}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitud
            </label>
            <input
              type="number"
              name="lat"
              step="any"
              value={form.lat}
              onChange={handleCoordsManually}
              className="w-full border px-4 py-2 rounded-lg"
              required={!editandoHospital}
              disabled={editandoHospital}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitud
            </label>
            <input
              type="number"
              name="lng"
              step="any"
              value={form.lng}
              onChange={handleCoordsManually}
              className="w-full border px-4 py-2 rounded-lg"
              required={!editandoHospital}
              disabled={editandoHospital}
            />
          </div>
        </div>

        <GeocercaMap
          editableHospitalCoords={!editandoHospital}
          editableGeocerca={editandoHospital || (!!form.lat && !!form.lng)}
          centerFromOutside={mapCenter}
          initialHospitalCoords={hasCoords ? { lat, lng } : null}
          initialGeocerca={geocerca}
          onCoordsChange={onCoordsChange}
          onHospitalCoordsChange={handleHospitalCoordsChange}
          editando={editandoHospital}
        />


        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="border px-4 py-2 rounded-md bg-white hover:bg-gray-100"
          >
            <X className="h-4 w-4 inline-block mr-1" /> Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            {editandoHospital ? (
              <>
                <Save className="h-4 w-4 inline-block mr-1" /> Actualizar
              </>
            ) : (
              <>
                <Check className="h-4 w-4 inline-block mr-1" /> Guardar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
