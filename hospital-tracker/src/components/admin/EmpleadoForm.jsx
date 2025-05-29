import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function EmpleadoForm({ onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombres: "",
    ap_paterno: "",
    ap_materno: "",
    CURP: "",
    telefono: "",
    estado: "",
    municipio: "",
    hospital: "",
    grupo: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [hospitales, setHospitales] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar estados al iniciar
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch(
          "https://geoapphospital.onrender.com/api/superadmin/estados"
        );
        if (!res.ok) {
          throw new Error("Error al obtener estados");
        }
        const data = await res.json();
        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, []);

  // Cargar municipios cuando cambia el estado
  useEffect(() => {
    if (form.estado) {
      const fetchMunicipios = async () => {
        try {
          const estadoSeleccionado = estados.find(
            (e) => e.nombre_estado === form.estado
          );

          if (!estadoSeleccionado) {
            setMunicipios([]);
            return;
          }

          const res = await fetch(
            `https://geoapphospital.onrender.com/api/municipioadmin/municipios-by-estado/${estadoSeleccionado.id_estado}`
          );

          if (!res.ok) {
            throw new Error("Error al obtener municipios");
          }

          const data = await res.json();
          setMunicipios(data);
        } catch (error) {
          console.error("Error al obtener municipios:", error);
          setMunicipios([]);
        }
      };

      fetchMunicipios();
      // Resetear municipio, hospital y grupo cuando cambia el estado
      setForm((prev) => ({
        ...prev,
        municipio: "",
        hospital: "",
        grupo: "",
      }));
    } else {
      setMunicipios([]);
    }
  }, [form.estado, estados]);

  // Cargar hospitales cuando cambia el municipio
  useEffect(() => {
    const fetchHospitales = async () => {
      if (!form.estado || !form.municipio) {
        setHospitales([]);
        return;
      }

      try {
        const estadoSeleccionado = estados.find(
          (e) => e.nombre_estado === form.estado
        );

        if (!estadoSeleccionado) {
          setHospitales([]);
          return;
        }

        const res = await fetch(
          `https://geoapphospital.onrender.com/api/hospitaladmin/hospitals-by-municipio?id_estado=${estadoSeleccionado.id_estado}&id_municipio=${form.municipio}`
        );

        if (!res.ok) {
          throw new Error("Error al obtener hospitales por municipio");
        }

        const data = await res.json();
        setHospitales(data);
      } catch (error) {
        console.error("Error al obtener hospitales:", error);
        setHospitales([]);
      }
    };

    fetchHospitales();

    // Resetear hospital y grupo cuando cambia el municipio
    if (form.municipio !== "") {
      setForm((prev) => ({
        ...prev,
        hospital: "",
        grupo: "",
      }));
    }
  }, [form.estado, form.municipio, estados]);

  // Cargar grupos cuando cambia el hospital
  useEffect(() => {
    if (form.hospital) {
      const fetchGrupos = async () => {
        try {
          const res = await fetch(
            `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${form.hospital}`
          );

          if (!res.ok) {
            throw new Error("Error al obtener grupos");
          }

          const data = await res.json();
          setGrupos(data);
        } catch (error) {
          console.error("Error al obtener grupos:", error);
          setGrupos([]);
        }
      };

      fetchGrupos();
      // Resetear grupo cuando cambia el hospital
      setForm((prev) => ({
        ...prev,
        grupo: "",
      }));
    } else {
      setGrupos([]);
    }
  }, [form.hospital]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "nombres":
        if (!value) error = "El nombre es obligatorio";
        break;
      case "ap_paterno":
        if (!value) error = "El apellido paterno es obligatorio";
        break;
      case "ap_materno":
        if (!value) error = "El apellido materno es obligatorio";
        break;
      case "CURP":
        if (!value) error = "El CURP es obligatorio";
        else if (!/^[A-Z&Ñ]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(value))
          error = "El CURP debe tener el formato correcto (AAAA######AAA)";
        break;
      case "telefono":
        if (!value) error = "El teléfono es obligatorio";
        else if (!/^\d{10}$/.test(value))
          error = "El teléfono debe tener 10 dígitos";
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
      case "grupo":
        if (!value) error = "El grupo es obligatorio";
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Para la CURP, convertir a mayúsculas automáticamente
    let formattedValue;
    if (name === "CURP") {
      formattedValue = value.toUpperCase();
    } else if (
      name === "municipio" ||
      name === "hospital" ||
      name === "grupo"
    ) {
      // Convertir a número entero para IDs
      formattedValue = value ? parseInt(value, 10) : "";
    } else {
      formattedValue = value;
    }

    setForm({ ...form, [name]: formattedValue });

    // Marcar el campo como tocado
    setTouched({ ...touched, [name]: true });

    // Validar el campo
    const error = validateField(name, formattedValue);
    setErrors({ ...errors, [name]: error });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validar todos los campos antes de enviar
    const newErrors = {};
    let isValid = true;

    // Validar campos obligatorios
    const requiredFields = [
      "nombres",
      "ap_paterno",
      "ap_materno",
      "CURP",
      "telefono",
      "estado",
      "municipio",
      "hospital",
      "grupo",
    ];

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

    // Generar nombre de usuario: primera letra del nombre + apellido paterno (sin espacios, en minúsculas)
    const user =
      form.nombres.trim().charAt(0).toLowerCase() +
      form.ap_paterno.trim().toLowerCase().replace(/\s+/g, "");

    // Generar contraseña aleatoria
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
      // Obtener el ID del estado seleccionado
      const estadoSeleccionado = estados.find(
        (e) => e.nombre_estado === form.estado
      );

      if (!estadoSeleccionado) {
        throw new Error("Estado no encontrado");
      }

      // Crear el objeto empleado con los datos del formulario
      const empleadoData = {
        nombre: form.nombres,
        ap_paterno: form.ap_paterno,
        ap_materno: form.ap_materno,
        CURP: form.CURP,
        telefono: form.telefono,
        user,
        pass,
        role_name: "empleado",
        id_estado: parseInt(estadoSeleccionado.id_estado),
        id_municipio: parseInt(form.municipio),
        id_hospital: parseInt(form.hospital),
        id_grupo: parseInt(form.grupo),
      };
      console.log("Datos del empleado:", empleadoData);

      // Llamar a la función de guardar del componente padre
      if (onGuardar) {
        await onGuardar(empleadoData);
      }
    } catch (error) {
      console.error("Error al crear empleado:", error);
      alert("Hubo un error al crear el empleado.");
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Información personal */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-0 pb-0 border-b">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              Información Personal
            </h3>
          </div>

          {/* Campos de texto */}
          {[
            {
              name: "nombres",
              label: "Nombres",
              placeholder: "Ingrese los nombres",
            },
            {
              name: "ap_paterno",
              label: "Apellido paterno",
              placeholder: "Ingrese el apellido paterno",
            },
            {
              name: "ap_materno",
              label: "Apellido materno",
              placeholder: "Ingrese el apellido materno",
            },
            {
              name: "CURP",
              label: "CURP",
              placeholder: "Ej. GOMC920101HDFLNS09",
              icon: <ClipboardCheck className="h-4 w-4 mr-1 text-blue-600" />,
              extraInfo:
                "Formato: 4 letras, 6 números, H/M, 5 letras, 2 alfanuméricos",
              maxLength: 18,
            },
            {
              name: "telefono",
              label: "Número de teléfono",
              placeholder: "10 dígitos",
              icon: <Phone className="h-4 w-4 mr-1 text-blue-600" />,
              maxLength: 10,
            },
          ].map(({ name, label, placeholder, icon, extraInfo, maxLength }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                {icon}
                {label}
              </label>
              <input
                type={name === "telefono" ? "tel" : "text"}
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
                maxLength={maxLength || undefined}
                required
              />
              {errors[name] && touched[name] && (
                <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
              )}
              {!errors[name] && extraInfo && (
                <p className="mt-1 text-xs text-gray-500">{extraInfo}</p>
              )}
            </div>
          ))}

          {/* Ubicación e institución */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-0 pb-0 border-b">
              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
              Ubicación e Institución
            </h3>
          </div>

          {/* Select de estados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 mr-1 inline text-blue-600" />
              Estado
            </label>
            <select
              name="estado"
              value={form.estado}
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

          {/* Select de municipios */}
          {form.estado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="h-4 w-4 mr-1 inline text-blue-600" />
                Municipio
              </label>
              <select
                name="municipio"
                value={form.municipio}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.municipio && touched.municipio
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona un municipio</option>
                {municipios.map((municipio) => (
                  <option
                    key={municipio.id_municipio}
                    value={municipio.id_municipio}
                  >
                    {municipio.nombre_municipio.toUpperCase()}
                  </option>
                ))}
              </select>
              {errors.municipio && touched.municipio && (
                <p className="mt-1 text-sm text-red-600">{errors.municipio}</p>
              )}
            </div>
          )}

          {/* Select de hospitales */}
          {form.municipio && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Hospital className="h-4 w-4 mr-1 inline text-blue-600" />
                Hospital
              </label>
              <select
                name="hospital"
                value={form.hospital}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.hospital && touched.hospital
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona un hospital</option>
                {hospitales.map((hospital) => (
                  <option
                    key={hospital.id_hospital}
                    value={hospital.id_hospital}
                  >
                    {hospital.nombre_hospital}
                  </option>
                ))}
              </select>
              {errors.hospital && touched.hospital && (
                <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
              )}
            </div>
          )}

          {/* Select de grupos */}
          {form.hospital && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
        </div>

        {/* Info de acceso */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
            <Key className="h-4 w-4 mr-1 text-blue-600" />
            Información de acceso
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Se generará automáticamente un nombre de usuario y contraseña para
            el empleado.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              • Usuario: Primera letra del nombre + apellido paterno (sin
              espacios)
            </li>
            <li>• Contraseña: Generada aleatoriamente (10 caracteres)</li>
            <li>• Rol: Empleado</li>
          </ul>
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
            disabled={isSubmitting}
            className={`flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Empleado
          </button>
        </div>
      </form>
    </div>
  );
}
