import { useState, useEffect } from "react";
import { useLocation } from "../../context/LocationContext";
import {
  ClipboardCheck,
  Key,
  Save,
  User,
  X,
  Building2,
  MapPin,
  Hospital,
  Phone,
  Mail,
} from "lucide-react";

export default function EmpleadoForm({ onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombres: "",
    ap_paterno: "",
    ap_materno: "",
    CURP: "",
    correo_electronico: "",
    telefono: "",
    estado: "",
    municipio: "",
    hospital: "",
    grupo: "",
    id_estado: null,
    id_municipio: null,
    id_hospital: null,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [grupos, setGrupos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentLocation, locationVersion, updateLocation } = useLocation();
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Configuración de campos del formulario
  const formFields = [
    {
      name: "nombres",
      label: "Nombres",
      placeholder: "Ingrese los nombres",
      type: "text",
    },
    {
      name: "ap_paterno",
      label: "Apellido paterno",
      placeholder: "Ingrese el apellido paterno",
      type: "text",
    },
    {
      name: "ap_materno",
      label: "Apellido materno",
      placeholder: "Ingrese el apellido materno",
      type: "text",
    },
    {
      name: "CURP",
      label: "CURP",
      placeholder: "Ej. GOMC920101HDFLNS09",
      icon: <ClipboardCheck className="h-4 w-4 mr-1 text-blue-600" />,
      extraInfo: "Formato: 4 letras, 6 números, H/M, 5 letras, 2 alfanuméricos",
      maxLength: 18,
      type: "text",
    },
    {
      name: "correo_electronico",
      label: "Correo electrónico",
      placeholder: "Ej. ejemplo@gmail.com",
      icon: <Mail className="h-4 w-4 mr-1 text-blue-600" />,
      extraInfo: "Formato: usuario@gmail.com",
      maxLength: 100,
      type: "email",
    },
    {
      name: "telefono",
      label: "Número de teléfono",
      placeholder: "10 dígitos",
      icon: <Phone className="h-4 w-4 mr-1 text-blue-600" />,
      maxLength: 10,
      type: "tel",
    },
  ];

  // Reglas de validación
  const validationRules = {
    nombres: (value) => (!value ? "El nombre es obligatorio" : ""),
    ap_paterno: (value) => (!value ? "El apellido paterno es obligatorio" : ""),
    ap_materno: (value) => (!value ? "El apellido materno es obligatorio" : ""),
    CURP: (value) => {
      if (!value) return "El CURP es obligatorio";
      if (!/^[A-Z&Ñ]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(value))
        return "El CURP debe tener el formato correcto";
      return "";
    },
    correo_electronico: (value) => {
      if (!value) return "El correo electrónico es obligatorio";
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value))
        return "El correo electrónico debe tener el formato correcto";
      return "";
    },
    telefono: (value) => {
      if (!value) return "El teléfono es obligatorio";
      if (!/^\d{10}$/.test(value)) return "El teléfono debe tener 10 dígitos";
      return "";
    },
    estado: (value) => (!value ? "El estado es obligatorio" : ""),
    municipio: (value) => (!value ? "El municipio es obligatorio" : ""),
    hospital: (value) => (!value ? "El hospital es obligatorio" : ""),
    grupo: (value) => (!value ? "El grupo es obligatorio" : ""),
  };

  // Inicializar ubicación
  useEffect(() => {
    const initializeLocation = async () => {
      setIsLoadingLocation(true);
      if (currentLocation) {
        console.log("📍 Usando ubicación de contexto:", currentLocation);
        updateFormLocation(currentLocation);
      } else {
        const userId = localStorage.getItem("userId");
        if (userId) {
          console.log("🚀 Solicitando ubicación para el usuario:", userId);
          await updateLocation(userId);
        }
      }
      setIsLoadingLocation(false);
    };

    initializeLocation();
  }, [currentLocation, locationVersion, updateLocation]);

  // Cargar grupos cuando cambia el hospital
  useEffect(() => {
    if (form.id_hospital) {
      fetchGrupos(form.id_hospital);
    } else {
      setGrupos([]);
    }
  }, [form.id_hospital]);

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
    }));
  };

  // Cargar grupos del hospital
  const fetchGrupos = async (hospitalId) => {
    try {
      const res = await fetch(
        `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${hospitalId}`
      );
      if (!res.ok) throw new Error("Error al obtener grupos");
      const data = await res.json();
      setGrupos(data);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      setGrupos([]);
    }
  };

  // Validar campo individual
  const validateField = (name, value) => {
    const rule = validationRules[name];
    return rule ? rule(value) : "";
  };

  // Formatear valor según el tipo de campo
  const formatValue = (name, value) => {
    if (name === "CURP") return value.toUpperCase();
    if (["municipio", "hospital", "grupo"].includes(name)) {
      return value ? parseInt(value, 10) : "";
    }
    return value;
  };

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatValue(name, value);

    setForm((prev) => ({ ...prev, [name]: formattedValue }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, formattedValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Manejar pérdida de foco
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Generar credenciales de usuario
  const generateCredentials = () => {
    const user =
      form.nombres.trim().charAt(0).toLowerCase() +
      form.ap_paterno.trim().toLowerCase().replace(/\s+/g, "");

    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const pass = Array.from({ length: 10 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");

    return { user, pass };
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validar todos los campos
    const requiredFields = Object.keys(validationRules);
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

    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      const { user, pass } = generateCredentials();

      const empleadoData = {
        nombre: form.nombres,
        ap_paterno: form.ap_paterno,
        ap_materno: form.ap_materno,
        CURP: form.CURP,
        correo_electronico: form.correo_electronico,
        telefono: parseInt(form.telefono, 10),
        user,
        pass,
        role_name: "empleado",
        id_estado: form.id_estado,
        id_municipio: form.id_municipio,
        id_hospital: form.id_hospital,
        id_grupo: parseInt(form.grupo),
      };

      if (onGuardar) {
        await onGuardar(empleadoData);
      }
    } catch (error) {
      console.error("Error al crear empleado:", error);
      alert("Error al crear el empleado");
    } finally {
      setIsSubmitting(false);
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
            <Icon className="h-4 w-4 mr-2 text-blue-600" />
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
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Nuevo Empleado
        </h2>
        <p className="text-gray-500 mt-1">
          Completa el formulario para registrar un nuevo empleado en el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ubicación e institución */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
              Ubicación e Institución
            </h3>
            {renderLocationInfo()}
          </div>

          {/* Select de grupos */}
          {form.hospital && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo
              </label>
              <select
                name="grupo"
                value={form.grupo}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.grupo && touched.grupo
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona un grupo</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id_group} value={grupo.id_group}>
                    {grupo.nombre_grupo}
                  </option>
                ))}
              </select>
              {errors.grupo && touched.grupo && (
                <p className="mt-1 text-sm text-red-600">{errors.grupo}</p>
              )}
            </div>
          )}

          {/* Información personal */}
          <div className="md:col-span-2 mt-6">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              Información Personal
            </h3>
          </div>

          {/* Campos de información personal */}
          {formFields.map(
            ({
              name,
              label,
              placeholder,
              icon,
              extraInfo,
              maxLength,
              type,
            }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  {icon}
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors[name] && touched[name]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  required
                />
                {extraInfo && (
                  <p className="mt-1 text-xs text-gray-500">{extraInfo}</p>
                )}
                {errors[name] && touched[name] && (
                  <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
                )}
              </div>
            )
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
