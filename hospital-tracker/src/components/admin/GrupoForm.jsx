"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Check, Save, X } from "lucide-react";
import { useLocation } from "../../context/LocationContext";

const GrupoForm = ({
  editando = false,
  grupo = null,
  onGuardar,
  onCancelar,
}) => {
  // Estados iniciales
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    hospital_id: "",
    activo: true,
    estado: "",
    municipio: "",
    hospital: "",
    id_estado: null,
    id_municipio: null,
    id_hospital: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [cargando, setCargando] = useState(false);

  const { currentLocation, locationVersion } = useLocation();

  // Solo mantenemos el efecto de ubicación inicial
  useEffect(() => {
    const fetchLocationData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        setCargando(true);
        console.log("🚀 Iniciando fetch de ubicación");

        const res = await fetch(
          `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital-ubi/${userId}`
        );

        if (!res.ok) throw new Error("Error al obtener ubicación del admin");

        const data = await res.json();
        console.log("📍 Datos de ubicación recibidos:", data);

        if (data && data.length > 0) {
          const info = data[0]; // Tomamos el primer elemento del array

          setForm((prev) => ({
            ...prev,
            estado: info.nombre_estado || "",
            municipio: info.nombre_municipio || "",
            hospital: info.nombre_hospital || "",
            id_estado: info.id_estado,
            id_municipio: info.id_municipio,
            id_hospital: info.id_hospital,
            hospital_id: info.id_hospital, // Importante para el submit
          }));
        }
      } catch (error) {
        console.error("❌ Error al obtener ubicación:", error);
        alert("Error al cargar la ubicación inicial");
      } finally {
        setCargando(false);
      }
    };

    fetchLocationData();
  }, []); // Solo se ejecuta al montar el componente

  // Efecto que escucha cambios en la ubicación
  useEffect(() => {
    if (currentLocation) {
      console.log(
        "📍 Actualizando formulario con nueva ubicación:",
        currentLocation
      );
      setForm((prev) => ({
        ...prev,
        estado: currentLocation.nombre_estado || "",
        municipio: currentLocation.nombre_municipio || "",
        hospital: currentLocation.nombre_hospital || "",
        id_estado: currentLocation.id_estado,
        id_municipio: currentLocation.id_municipio,
        id_hospital: currentLocation.id_hospital,
      }));
    }
  }, [currentLocation, locationVersion]); // Agregamos locationVersion como dependencia

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

    setForm({ ...form, [name]: val });
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, val);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Enviando formulario con datos:", form);

    // Validaciones
    if (!form.nombre?.trim() || !form.descripcion?.trim()) {
      setErrors((prev) => ({
        ...prev,
        nombre: !form.nombre?.trim() ? "El nombre es obligatorio" : "",
        descripcion: !form.descripcion?.trim()
          ? "La descripción es obligatoria"
          : "",
      }));
      return;
    }

    if (!form.id_hospital) {
      alert("Error: No hay hospital asignado");
      return;
    }

    try {
      setCargando(true);
      const payload = {
        nombre_grupo: form.nombre.trim(),
        descripcion_grupo: form.descripcion.trim(),
        id_hospital: form.id_hospital,
      };

      console.log("Enviando datos al servidor:", payload);

      const res = await fetch(
        "https://geoapphospital.onrender.com/api/groups/create-groups",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al crear el grupo");
      }

      alert("Grupo creado exitosamente");
      console.log("Grupo creado:", data);

      // Limpiar formulario
      setForm((prev) => ({
        ...prev,
        nombre: "",
        descripcion: "",
        activo: true,
      }));

      if (onGuardar) {
        onGuardar(data);
      }
    } catch (error) {
      console.error("Error en la creación del grupo:", error);
      alert(error.message || "Error al crear el grupo");
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
};

export default GrupoForm;
