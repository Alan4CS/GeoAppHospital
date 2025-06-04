"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Check, Save, X } from "lucide-react";

export default function GrupoForm({
  editando = false,
  grupo = null,
  onGuardar,
  onCancelar,
}) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    hospital_id: "",
    activo: true,
  });

  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [hospitales, setHospitales] = useState([]);

  const [estadoId, setEstadoId] = useState("");
  const [municipioId, setMunicipioId] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [cargando, setCargando] = useState(false);

  // Cargar estados al iniciar
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch(
          "https://geoapphospital.onrender.com/api/superadmin/estados"
        );
        const data = await res.json();
        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, []);

  // Cargar municipios al seleccionar estado
  useEffect(() => {
    const fetchMunicipios = async () => {
      if (!estadoId) {
        setMunicipios([]);
        return;
      }

      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado-hospital/${estadoId}`
        );
        const data = await res.json();
        setMunicipios(data);
      } catch (error) {
        console.error("Error al obtener municipios:", error);
        setMunicipios([]);
      }
    };
    fetchMunicipios();
  }, [estadoId]);

  // Cargar hospitales al seleccionar municipio
  useEffect(() => {
    const fetchHospitales = async () => {
      if (!estadoId || !municipioId) {
        setHospitales([]);
        return;
      }

      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${estadoId}&id_municipio=${municipioId}`
        );
        const data = await res.json();
        const normalizados = data.map((h) => ({
          id: h.id_hospital,
          nombre: h.nombre_hospital,
        }));
        setHospitales(normalizados);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
        setHospitales([]);
      }
    };
    fetchHospitales();
  }, [estadoId, municipioId]);

  // Autorrellenar estado, municipio y hospital SOLO con el endpoint de ubicacion
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const fetchUbicacion = async () => {
      try {
        const res = await fetch(
          `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital-ubi/${userId}`
        );
        if (!res.ok) throw new Error("Error al obtener ubicación del admin");
        const data = await res.json();
        if (data && data.length > 0) {
          const info = data[0];
          setForm((prev) => ({
            ...prev,
            estado: info.nombre_estado || "",
            municipio: info.nombre_municipio || "",
            hospital: info.nombre_hospital || "",
            id_estado: info.id_estado,
            id_municipio: info.id_municipio,
            id_hospital: info.id_hospital,
          }));
          setEstados([
            { id_estado: info.id_estado, nombre_estado: info.nombre_estado },
          ]);
          setMunicipios([
            {
              id_municipio: info.id_municipio,
              nombre_municipio: info.nombre_municipio,
            },
          ]);
          setHospitales([
            {
              id_hospital: info.id_hospital,
              nombre_hospital: info.nombre_hospital,
            },
          ]);
        }
      } catch (error) {
        console.error("Error al obtener ubicación del admin:", error);
      }
    };
    fetchUbicacion();
  }, []);

  const validateField = (name, value) => {
    let error = "";
    if (!value) {
      error = "Este campo es obligatorio";
    } else if (name === "nombre" && value.length < 3) {
      error = "El nombre debe tener al menos 3 caracteres";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name === "estado") {
      setEstadoId(val);
      setMunicipioId("");
      setHospitales([]);
      setForm((prev) => ({ ...prev, hospital_id: "" }));
    } else if (name === "municipio") {
      setMunicipioId(val);
      setForm((prev) => ({ ...prev, hospital_id: "" }));
    } else {
      setForm({ ...form, [name]: val });
      setTouched({ ...touched, [name]: true });
      const error = validateField(name, val);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    let isValid = true;

    ["nombre", "descripcion", "hospital_id"].forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      nombre: true,
      descripcion: true,
      hospital_id: true,
    });

    if (!isValid) return;

    const payload = {
      nombre_grupo: form.nombre,
      descripcion_grupo: form.descripcion,
      id_hospital: form.hospital_id,
    };

    try {
      setCargando(true);
      const res = await fetch(
        "https://geoapphospital.onrender.com/api/groups/create-groups",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al guardar grupo");

      console.log("Grupo guardado:", data);

      setForm({ nombre: "", descripcion: "", hospital_id: "", activo: true });
      setEstadoId("");
      setMunicipioId("");
      setHospitales([]);

      if (onGuardar) onGuardar(data);
    } catch (err) {
      console.error("Error al guardar:", err);
      alert(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-emerald-600" />
          {editando ? "Editar Grupo" : "Nuevo Grupo"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <input
            type="text"
            value={form.estado}
            readOnly
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-gray-400">
            Estado asignado automáticamente desde la ubicación del administrador
          </p>
          {errors.estado && touched.estado && (
            <p className="mt-1 text-sm text-red-600">{errors.estado}</p>
          )}
        </div>

        {/* Municipio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Municipio
          </label>
          <input
            type="text"
            value={form.municipio}
            readOnly
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-gray-400">
            Municipio asignado automáticamente desde la ubicación del
            administrador
          </p>
          {errors.municipio && touched.municipio && (
            <p className="mt-1 text-sm text-red-600">{errors.municipio}</p>
          )}
        </div>

        {/* Hospital */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital
          </label>
          <input
            type="text"
            value={form.hospital}
            readOnly
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            tabIndex={-1}
          />
          <p className="mt-1 text-xs text-gray-400">
            Hospital asignado automáticamente desde la ubicación del
            administrador
          </p>
          {errors.hospital && touched.hospital && (
            <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
          )}
        </div>

        {/* Nombre del grupo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del grupo
          </label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className={`w-full border rounded px-4 py-2 ${
              errors.nombre && touched.nombre ? "border-red-500" : ""
            }`}
          />
          {errors.nombre && touched.nombre && (
            <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={3}
            className={`w-full border rounded px-4 py-2 ${
              errors.descripcion && touched.descripcion ? "border-red-500" : ""
            }`}
          ></textarea>
          {errors.descripcion && touched.descripcion && (
            <p className="text-red-600 text-sm mt-1">{errors.descripcion}</p>
          )}
        </div>

        {/* Activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">Grupo activo</label>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
            disabled={cargando}
          >
            <X className="h-4 w-4 inline mr-1" /> Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            {cargando
              ? "Guardando..."
              : editando
              ? "Actualizar grupo"
              : "Crear grupo"}
          </button>
        </div>
      </form>
    </div>
  );
}
