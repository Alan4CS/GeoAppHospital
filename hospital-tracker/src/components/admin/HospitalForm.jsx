"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Save, X, Users } from "lucide-react";

export default function HospitalGroupForm({
  editando = false,
  grupo = null,
  onGuardar,
  onCancelar,
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
    estado: "",
    municipio: "",
    hospital: "",
    permitirEmpleados: true,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [hospitales, setHospitales] = useState([]);

  useEffect(() => {
    // Cargar datos iniciales si estamos editando
    if (editando && grupo) {
      setFormData({
        nombre: grupo.nombre || "",
        descripcion: grupo.descripcion || "",
        activo: grupo.activo !== undefined ? grupo.activo : true,
        estado: grupo.estado || "",
        municipio: grupo.municipio || "",
        hospital: grupo.hospital || "",
        permitirEmpleados:
          grupo.permitirEmpleados !== undefined
            ? grupo.permitirEmpleados
            : true,
      });
    }

    // Cargar estados
    const fetchEstados = async () => {
      try {
        // En una implementación real, esta sería una llamada a la API
        // const res = await fetch("http://localhost:4000/api/estados");
        // const data = await res.json();

        // Datos simulados
        const mockEstados = [
          { id_estado: 1, nombre_estado: "Aguascalientes" },
          { id_estado: 2, nombre_estado: "Baja California" },
          { id_estado: 3, nombre_estado: "Ciudad de México" },
          { id_estado: 4, nombre_estado: "Jalisco" },
          { id_estado: 5, nombre_estado: "Nuevo León" },
        ];
        setEstados(mockEstados);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, [editando, grupo]);

  useEffect(() => {
    // Cargar municipios cuando cambia el estado
    if (formData.estado) {
      const fetchMunicipios = async () => {
        try {
          // En una implementación real, esta sería una llamada a la API
          // const res = await fetch(`http://localhost:4000/api/municipios/${formData.estado}`);
          // const data = await res.json();

          // Datos simulados
          const mockMunicipios = [
            { id_municipio: 1, nombre_municipio: "Guadalajara", id_estado: 4 },
            { id_municipio: 2, nombre_municipio: "Zapopan", id_estado: 4 },
            { id_municipio: 3, nombre_municipio: "Monterrey", id_estado: 5 },
            { id_municipio: 4, nombre_municipio: "San Pedro", id_estado: 5 },
            {
              id_municipio: 5,
              nombre_municipio: "Benito Juárez",
              id_estado: 3,
            },
            {
              id_municipio: 6,
              nombre_municipio: "Miguel Hidalgo",
              id_estado: 3,
            },
          ];

          // Filtrar municipios por estado
          const estadoId = estados.find(
            (e) => e.nombre_estado === formData.estado
          )?.id_estado;
          const municipiosFiltrados = mockMunicipios.filter(
            (m) => m.id_estado === estadoId
          );
          setMunicipios(municipiosFiltrados);
        } catch (error) {
          console.error("Error al obtener municipios:", error);
        }
      };
      fetchMunicipios();

      // Resetear municipio y hospital al cambiar estado
      setFormData((prev) => ({
        ...prev,
        municipio: "",
        hospital: "",
      }));
    } else {
      setMunicipios([]);
    }
  }, [formData.estado, estados]);

  useEffect(() => {
    // Cargar hospitales cuando cambia el municipio
    if (formData.municipio) {
      const fetchHospitales = async () => {
        try {
          // En una implementación real, esta sería una llamada a la API
          // const res = await fetch(`http://localhost:4000/api/hospitales?estado=${formData.estado}&municipio=${formData.municipio}`);
          // const data = await res.json();

          // Datos simulados
          const mockHospitales = [
            {
              id: 1,
              nombre: "Hospital General Regional #1",
              municipio: "Guadalajara",
              estado: "Jalisco",
            },
            {
              id: 2,
              nombre: "Hospital General de Zona #48",
              municipio: "Zapopan",
              estado: "Jalisco",
            },
            {
              id: 3,
              nombre: "Hospital Regional #33",
              municipio: "Monterrey",
              estado: "Nuevo León",
            },
            {
              id: 4,
              nombre: "Hospital General #12",
              municipio: "Benito Juárez",
              estado: "Ciudad de México",
            },
          ];

          // Filtrar hospitales por estado y municipio
          const hospitalesFiltrados = mockHospitales.filter(
            (h) =>
              h.estado === formData.estado && h.municipio === formData.municipio
          );
          setHospitales(hospitalesFiltrados);
        } catch (error) {
          console.error("Error al obtener hospitales:", error);
        }
      };
      fetchHospitales();

      // Resetear hospital al cambiar municipio
      setFormData((prev) => ({
        ...prev,
        hospital: "",
      }));
    } else {
      setHospitales([]);
    }
  }, [formData.municipio, formData.estado]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "nombre":
        if (!value) error = "El nombre del grupo es obligatorio";
        break;
      case "descripcion":
        if (!value) error = "La descripción es obligatoria";
        break;
      case "estado":
        if (!value) error = "El estado es obligatorio";
        break;
      case "municipio":
        if (!value) error = "El municipio es obligatorio";
        break;
      case "hospital":
        if (!value) error = "El hospital es obligatorio";
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({ ...formData, [name]: newValue });
    setTouched({ ...touched, [name]: true });

    const error = validateField(name, newValue);
    setErrors({ ...errors, [name]: error });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar todos los campos
    const newErrors = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "activo" || key === "permitirEmpleados") return; // No validar campos booleanos

      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      nombre: true,
      descripcion: true,
      estado: true,
      municipio: true,
      hospital: true,
    });

    if (!isValid) return;

    // Enviar datos
    onGuardar(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
          {editando ? "Editar Grupo" : "Crear Nuevo Grupo"}
        </h2>
        <p className="text-gray-500 mt-1">
          {editando
            ? "Modifica la información del grupo seleccionado"
            : "Completa el formulario para crear un nuevo grupo en el hospital"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selección de ubicación */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Ubicación del Grupo
            </h3>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.estado && touched.estado
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
            >
              <option value="">Selecciona un estado</option>
              {estados.map((estado) => (
                <option key={estado.id_estado} value={estado.nombre_estado}>
                  {estado.nombre_estado}
                </option>
              ))}
            </select>
            {errors.estado && touched.estado && (
              <p className="mt-1 text-sm text-red-600">{errors.estado}</p>
            )}
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Municipio
            </label>
            <select
              name="municipio"
              value={formData.municipio}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.municipio && touched.municipio
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
              disabled={!formData.estado}
            >
              <option value="">Selecciona un municipio</option>
              {municipios.map((municipio) => (
                <option
                  key={municipio.id_municipio}
                  value={municipio.nombre_municipio}
                >
                  {municipio.nombre_municipio}
                </option>
              ))}
            </select>
            {errors.municipio && touched.municipio && (
              <p className="mt-1 text-sm text-red-600">{errors.municipio}</p>
            )}
          </div>

          {/* Hospital */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital
            </label>
            <select
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.hospital && touched.hospital
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
              disabled={!formData.municipio}
            >
              <option value="">Selecciona un hospital</option>
              {hospitales.map((hospital) => (
                <option key={hospital.id} value={hospital.nombre}>
                  {hospital.nombre}
                </option>
              ))}
            </select>
            {errors.hospital && touched.hospital && (
              <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
            )}
          </div>

          {/* Información del grupo */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <ClipboardList className="h-4 w-4 mr-2 text-blue-600" />
              Información del Grupo
            </h3>
          </div>

          {/* Nombre del grupo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del grupo
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.descripcion && touched.descripcion
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Describe el propósito y función del grupo"
              rows={3}
              required
            />
            {errors.descripcion && touched.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
          </div>

          {/* Opciones adicionales */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="permitirEmpleados"
                name="permitirEmpleados"
                checked={formData.permitirEmpleados}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="permitirEmpleados"
                className="text-sm text-gray-700"
              >
                Permitir agregar empleados a este grupo
              </label>
            </div>
          </div>

          {editando && (
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">
                  Grupo activo
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {editando ? "Guardar Cambios" : "Crear Grupo"}
          </button>
        </div>
      </form>
    </div>
  );
}
