"use client";

import { useState, useEffect } from "react";
import { Check, ClipboardList, Save, X } from "lucide-react";

export default function GrupoForm({
  hospitales,
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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hospitalesFiltrados, setHospitalesFiltrados] = useState([]);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");

  // Inicializar el formulario con los datos del grupo si estamos editando
  useEffect(() => {
    if (editando && grupo) {
      setForm({
        nombre: grupo.nombre || "",
        descripcion: grupo.descripcion || "",
        hospital_id: grupo.hospital_id || "",
        activo: grupo.activo !== undefined ? grupo.activo : true,
      });
    }
  }, [editando, grupo]);

  // Obtener estados únicos de los hospitales
  const estados = [...new Set(hospitales.map((h) => h.estado))]
    .filter(Boolean)
    .sort();

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "nombre":
        if (!value) error = "El nombre es obligatorio";
        else if (value.length < 3)
          error = "El nombre debe tener al menos 3 caracteres";
        break;
      case "descripcion":
        if (!value) error = "La descripción es obligatoria";
        break;
      case "hospital_id":
        if (!value) error = "El hospital es obligatorio";
        break;
      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setForm({ ...form, [name]: val });

    // Marcar el campo como tocado
    setTouched({ ...touched, [name]: true });

    // Validar el campo
    const error = validateField(name, val);
    setErrors({ ...errors, [name]: error });

    // Si cambia el estado, filtrar los hospitales
    if (name === "estado") {
      setEstadoSeleccionado(value);
      const filtrados = hospitales.filter((h) => h.estado === value);
      setHospitalesFiltrados(filtrados);
      // Resetear el hospital seleccionado
      setForm((prev) => ({ ...prev, hospital_id: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, val);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar todos los campos antes de enviar
    const newErrors = {};
    let isValid = true;

    Object.keys(form).forEach((key) => {
      if (key !== "activo") {
        // No validamos el checkbox
        const error = validateField(key, form[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    if (!isValid) return;

    // Llamar a la función de guardar del componente padre
    onGuardar(form);

    // Limpiar el formulario
    setForm({
      nombre: "",
      descripcion: "",
      hospital_id: "",
      activo: true,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-emerald-600" />
          {editando ? "Editar Grupo" : "Nuevo Grupo"}
        </h2>
        <p className="text-gray-500 mt-1">
          {editando
            ? "Actualiza la información del grupo seleccionado"
            : "Completa el formulario para crear un nuevo grupo"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={estadoSeleccionado}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300"
            >
              <option value="">Selecciona un estado</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {estadoSeleccionado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
              <select
                name="hospital_id"
                value={form.hospital_id}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.hospital_id && touched.hospital_id
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona un hospital</option>
                {hospitalesFiltrados.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.nombre}
                  </option>
                ))}
              </select>
              {errors.hospital_id && touched.hospital_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.hospital_id}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.nombre && touched.nombre
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Ej. Grupo A - Urgencias"
              required
            />
            {errors.nombre && touched.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.descripcion && touched.descripcion
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Describe el propósito y función del grupo"
              required
            ></textarea>
            {errors.descripcion && touched.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            />
            <label
              htmlFor="activo"
              className="ml-2 block text-sm text-gray-700"
            >
              Grupo activo
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            {editando ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Actualizar grupo
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Crear grupo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
