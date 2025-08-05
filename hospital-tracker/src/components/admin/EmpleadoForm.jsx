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
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import sendCredentialsEmail from '../../helpers/emailHelper';
import { useAuth } from "../../context/AuthContext";

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
  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const { currentLocation, locationVersion, updateLocation } = useLocation();
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { userId } = useAuth();

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
        `https://geoapphospital-b0yr.onrender.com/api/employees/grupos-by-hospital?id_hospital=${hospitalId}`
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

  // Verificar si un usuario ya existe en la base de datos
  const checkUserExists = async (username) => {
    try {
      const response = await fetch(
        `https://geoapphospital-b0yr.onrender.com/api/superadmin/check-user-exists?username=${encodeURIComponent(username)}`
      );
      if (!response.ok) {
        throw new Error("Error al verificar el usuario");
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      throw new Error("No se pudo verificar la disponibilidad del usuario");
    }
  };

  // Generar credenciales de usuario únicas
  const generateCredentials = async () => {
    let user;
    let attempts = 0;
    const maxAttempts = 20;

    // Limpiar y preparar datos
    const nombres = form.nombres.trim().toLowerCase().replace(/\s+/g, "");
    const apPaterno = form.ap_paterno.trim().toLowerCase().replace(/\s+/g, "");
    const apMaterno = form.ap_materno.trim().toLowerCase().replace(/\s+/g, "");

    // Diferentes estrategias para generar nombres de usuario
    const generateUserStrategies = [
      // Estrategia 1: Primera letra nombre + apellido paterno
      () => nombres.charAt(0) + apPaterno,
      
      // Estrategia 2: Primeras 2 letras nombre + apellido paterno
      () => nombres.substring(0, 2) + apPaterno,
      
      // Estrategia 3: Primera letra nombre + primeras 3 letras apellido paterno
      () => nombres.charAt(0) + apPaterno.substring(0, 3),
      
      // Estrategia 4: Nombre completo + primera letra apellido paterno
      () => nombres + apPaterno.charAt(0),
      
      // Estrategia 5: Primera letra nombre + apellido paterno + primera letra apellido materno
      () => nombres.charAt(0) + apPaterno + apMaterno.charAt(0),
      
      // Estrategia 6: Primeras 3 letras nombre + primeras 3 letras apellido paterno
      () => nombres.substring(0, 3) + apPaterno.substring(0, 3),
      
      // Estrategia 7: Apellido paterno + primera letra nombre
      () => apPaterno + nombres.charAt(0),
      
      // Estrategia 8: Primeras 4 letras apellido paterno + primeras 2 letras nombre
      () => apPaterno.substring(0, 4) + nombres.substring(0, 2),
      
      // Estrategia 9: Primera letra nombre + primera letra apellido paterno + primera letra apellido materno
      () => nombres.charAt(0) + apPaterno.charAt(0) + apMaterno.charAt(0),
      
      // Estrategia 10: Nombre completo (si es corto)
      () => nombres.length <= 8 ? nombres : nombres.substring(0, 8),
    ];

    // Intentar generar un usuario único
    do {
      if (attempts < generateUserStrategies.length) {
        // Usar estrategias sin números primero
        user = generateUserStrategies[attempts]();
      } else {
        // Después usar estrategias con números aleatorios
        const strategyIndex = attempts % generateUserStrategies.length;
        const baseUser = generateUserStrategies[strategyIndex]();
        
        if (attempts < 15) {
          // Agregar números secuenciales
          const numberSuffix = attempts - generateUserStrategies.length + 1;
          user = baseUser + numberSuffix;
        } else {
          // Agregar números aleatorios de 2-3 dígitos
          const randomNumber = Math.floor(Math.random() * 999) + 1;
          user = baseUser + randomNumber;
        }
      }
      
      // Asegurar que el usuario no sea muy corto ni muy largo
      if (user.length < 3) {
        user = user + Math.floor(Math.random() * 99) + 1;
      }
      if (user.length > 15) {
        user = user.substring(0, 15);
      }
      
      console.log(`🔄 Intento ${attempts + 1}: Probando usuario "${user}"`);
      
      const exists = await checkUserExists(user);
      if (!exists) {
        console.log(`✅ Usuario disponible: "${user}"`);
        break;
      } else {
        console.log(`❌ Usuario ya existe: "${user}"`);
      }
      
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error("No se pudo generar un nombre de usuario único después de múltiples intentos. Por favor, intenta con un nombre diferente.");
    }

    // Generar contraseña más robusta
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%&*";
    
    // Asegurar que la contraseña tenga al menos un carácter de cada tipo
    let pass = "";
    pass += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
    pass += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Completar los 6 caracteres restantes
    const allChars = upperCase + lowerCase + numbers + symbols;
    for (let i = 4; i < 10; i++) {
      pass += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mezclar la contraseña
    pass = pass.split('').sort(() => Math.random() - 0.5).join('');

    console.log(`🎉 Credenciales generadas - Usuario: "${user}", Contraseña: "${pass}"`);
    return { user, pass };
  };

  // Añadir función resetForm
  const resetForm = () => {
    // Guardar la información de ubicación actual
    const ubicacionActual = {
      estado: form.estado,
      municipio: form.municipio,
      hospital: form.hospital,
      id_estado: form.id_estado,
      id_municipio: form.id_municipio,
      id_hospital: form.id_hospital,
    };

    // Resetear el formulario pero mantener la ubicación
    setForm({
      nombres: "",
      ap_paterno: "",
      ap_materno: "",
      CURP: "",
      correo_electronico: "",
      telefono: "",
      grupo: "",
      // Mantener la información de ubicación
      ...ubicacionActual
    });

    // Limpiar errores y estados touched
    setErrors({});
    setTouched({});
  };

  // Agregar componente NotificacionToast
  const NotificacionToast = ({ notificacion, onCerrar }) => {
    const [progreso, setProgreso] = useState(100);

    useEffect(() => {
      if (!notificacion) return;

      const intervalo = setInterval(() => {
        setProgreso((prev) => {
          const nuevo = prev - 100 / (notificacion.duracion / 100);
          if (nuevo <= 0) {
            clearInterval(intervalo);
            return 0;
          }
          return nuevo;
        });
      }, 100);

      return () => clearInterval(intervalo);
    }, [notificacion]);

    if (!notificacion) return null;

    const esExito = notificacion.tipo === "exito";

    return (
      <div className="fixed top-4 right-4 z-[9999] max-w-md w-full">
        <div className={`rounded-lg shadow-lg border-l-4 p-4 ${
          esExito ? "bg-white border-green-500 text-green-800" : "bg-white border-red-500 text-red-800"
        } transform transition-all duration-300 ease-in-out`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {esExito ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${esExito ? "text-green-800" : "text-red-800"}`}>
                {notificacion.titulo}
              </h3>
              <p className={`mt-1 text-sm ${esExito ? "text-green-700" : "text-red-700"}`}>
                {notificacion.mensaje}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button onClick={onCerrar} className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                esExito ? "text-green-500 hover:bg-green-100 focus:ring-green-600" : "text-red-500 hover:bg-red-100 focus:ring-red-600"
              }`}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={`mt-2 w-full bg-gray-200 rounded-full h-1 ${esExito ? "bg-green-100" : "bg-red-100"}`}>
            <div className={`h-1 rounded-full transition-all duration-100 ease-linear ${esExito ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${progreso}%` }} />
          </div>
        </div>
      </div>
    );
  };

  // Función para cerrar el modal de credenciales
  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    setGeneratedCredentials(null);
    
    // Mostrar notificación de éxito después de cerrar el modal
    setNotificacion({
      tipo: "exito",
      titulo: "¡Empleado creado exitosamente!",
      mensaje: "El empleado ha sido registrado y se han enviado sus credenciales por email. Puedes crear otro empleado.",
      duracion: 5000,
    });
  };

  // Componente Modal para mostrar credenciales
  const CredentialsModal = ({ credentials, onClose }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState({ user: false, pass: false });

    const copyToClipboard = async (text, type) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied({ ...copied, [type]: true });
        setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
      } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
      }
    };

    if (!credentials) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Key className="h-5 w-5 mr-2 text-green-600" />
                Credenciales Generadas
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                  <p className="text-sm font-medium text-green-800">
                    Empleado creado exitosamente
                  </p>
                </div>
                <p className="text-sm text-green-700">
                  {credentials.nombre} {credentials.ap_paterno} ha sido registrado en el sistema.
                </p>
              </div>

              {/* Usuario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de usuario
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={credentials.user}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.user, 'user')}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Copiar usuario"
                  >
                    {copied.user ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.pass}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm pr-10"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentials.pass, 'pass')}
                    className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Copiar contraseña"
                  >
                    {copied.pass ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Importante:</strong> Estas credenciales han sido enviadas por email a {credentials.correo_electronico}. 
                  Asegúrate de copiarlas ahora para entregarlas al empleado.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
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
        setLoading(false);
        return;
      }

      // Generar credenciales únicas
      setIsGeneratingCredentials(true);
      const { user, pass } = await generateCredentials();
      setIsGeneratingCredentials(false);

      // Preparar y enviar datos al componente padre
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

      await onGuardar(empleadoData);
      
      // Guardar las credenciales para mostrar en el modal
      setGeneratedCredentials({
        nombre: form.nombres,
        ap_paterno: form.ap_paterno,
        correo_electronico: form.correo_electronico,
        user,
        pass
      });
      
      // Mostrar el modal con las credenciales
      setShowCredentialsModal(true);
      
      // Ya no mostramos la notificación aquí, se maneja en el modal
      resetForm(); // Preservará la información de ubicación

    } catch (error) {
      console.error('❌ Error:', error);
      setIsGeneratingCredentials(false);
      setNotificacion({
        tipo: "error",
        titulo: "Error al crear empleado",
        mensaje: error.message || "Ocurrió un error inesperado",
        duracion: 5000,
      });
    } finally {
      setLoading(false);
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
    <>
      <NotificacionToast 
        notificacion={notificacion} 
        onCerrar={() => setNotificacion(null)} 
      />
      
      {/* Modal de credenciales */}
      {showCredentialsModal && (
        <CredentialsModal 
          credentials={generatedCredentials}
          onClose={handleCloseCredentialsModal}
        />
      )}
      
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
              disabled={isSubmitting || loading || isGeneratingCredentials}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isGeneratingCredentials 
                ? "Verificando usuario..." 
                : isSubmitting || loading 
                  ? "Guardando..." 
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
