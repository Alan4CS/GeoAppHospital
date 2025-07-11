import { useEffect, useState } from "react";
import {
  ClipboardList,
  Check,
  Save,
  X,
  Building2,
  MapPin,
  Hospital,
  User,
} from "lucide-react";
import { useLocation } from "../../context/LocationContext";
import { useAuth } from "../../context/AuthContext";

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
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { userId } = useAuth();

  const { currentLocation, locationVersion, updateLocation } = useLocation();

  // Efecto para cargar y sincronizar la ubicación
  useEffect(() => {
    const initializeLocation = async () => {
      setIsLoadingLocation(true);
      if (currentLocation) {
        console.log("📍 Usando ubicación de contexto:", currentLocation);
        updateFormLocation(currentLocation);
      } else {
        if (userId) {
          console.log("🚀 Solicitando ubicación para el usuario:", userId);
          await updateLocation(userId);
        }
      }
      setIsLoadingLocation(false);
    };

    initializeLocation();
  }, [currentLocation, locationVersion, updateLocation]);

  // Actualizar formulario con información de ubicación
  const updateFormLocation = (info) => {
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
  };

  // Reglas de validación
  const validationRules = {
    nombre: (value) => {
      if (!value?.trim()) return "El nombre es obligatorio";
      if (value.length < 3) return "El nombre debe tener al menos 3 caracteres";
      return "";
    },
    descripcion: (value) =>
      !value?.trim() ? "La descripción es obligatoria" : "",
  };

  // Validar campo individual
  const validateField = (name, value) => {
    const rule = validationRules[name];
    return rule ? rule(value) : "";
  };

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setForm((prev) => ({ ...prev, [name]: val }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, val);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Enviando formulario con datos:", form);

    // Validar todos los campos
    const requiredFields = ["nombre", "descripcion"];
    const newErrors = {};
    let isValid = true;

    requiredFields.forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    if (!isValid) return;

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

  // Renderizar información de ubicación
  const renderLocationInfo = () => {
    if (isLoadingLocation) {
      return (
        <div className="animate-pulse space-y-3 p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      );
    }

    if (!form.id_hospital) {
      return (
        <p className="text-sm text-red-600 p-4">
          No se pudo obtener la información de ubicación. Asegúrate de que el
          administrador tenga una ubicación asignada.
        </p>
      );
    }

    const locationItems = [
      { icon: MapPin, label: "Estado", value: form.estado },
      { icon: Building2, label: "Municipio", value: form.municipio },
      { icon: Hospital, label: "Hospital", value: form.hospital },
    ];

    return (
      <div className="space-y-3">
        {locationItems.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center">
            <Icon className="h-4 w-4 mr-2 text-emerald-600" />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>
    );
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
            ? "Modifica la información del grupo existente"
            : "Completa el formulario para crear un nuevo grupo en el sistema"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ubicación e institución */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <Building2 className="h-4 w-4 mr-2 text-emerald-600" />
              Ubicación e Institución
            </h3>
            {renderLocationInfo()}
          </div>

          {/* Información del grupo */}
          <div className="md:col-span-2 mt-6">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <ClipboardList className="h-4 w-4 mr-2 text-emerald-600" />
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
              value={form.nombre}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.nombre && touched.nombre
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Ingrese el nombre del grupo"
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
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.descripcion && touched.descripcion
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Describe las funciones o características del grupo"
              required
            />
            {errors.descripcion && touched.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            disabled={cargando}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {cargando
              ? "Guardando..."
              : editando
              ? "Actualizar Grupo"
              : "Crear Grupo"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GrupoForm;
