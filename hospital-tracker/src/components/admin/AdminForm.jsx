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
} from "lucide-react";

export default function AdminForm({
  hospitales,
  onGuardar,
  onCancelar,
  setHospitalesFiltradosPorEstado,
}) {
  const [adminForm, setAdminForm] = useState({
    nombres: "",
    ap_paterno: "",
    ap_materno: "",
    CURP: "",
    telefono: "",
    tipoAdmin: "",
    estado: "",
    municipio: "",
    hospital: "",
    grupos: [],
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [estados, setEstados] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [hospitalesFiltrados, setHospitalesFiltrados] = useState([]);
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/superadmin/estados");
        const data = await res.json();

        setEstados(data);
      } catch (error) {
        console.error("Error al obtener estados:", error);
      }
    };
    fetchEstados();
  }, []);

  useEffect(() => {
    if (adminForm.estado) {
      const fetchMunicipios = async () => {
        try {
          // Primero necesitamos obtener el ID del estado seleccionado
          const estadoSeleccionado = estados.find(
            (e) => e.nombre_estado === adminForm.estado
          );

          if (!estadoSeleccionado) {
            setMunicipios([]);
            return;
          }

          const res = await fetch(
            `http://localhost:4000/api/municipioadmin/municipios-by-estado/${estadoSeleccionado.id_estado}`
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

      // Filtrar hospitales por estado
      if (hospitales && hospitales.length > 0) {
        const hospitalesDelEstado = hospitales.filter(
          (h) => h.estado.toLowerCase() === adminForm.estado.toLowerCase()
        );
        setHospitalesFiltrados(hospitalesDelEstado);
        setHospitalesFiltradosPorEstado(hospitalesDelEstado);
      }
    } else {
      setMunicipios([]);
      setHospitalesFiltrados([]);
    }
  }, [adminForm.estado, hospitales, setHospitalesFiltradosPorEstado]);

  useEffect(() => {
    if (adminForm.municipio && hospitalesFiltrados.length > 0) {
      // Filtrar hospitales por municipio
      const hospitalesDelMunicipio = hospitalesFiltrados.filter(
        (h) =>
          h.municipio &&
          h.municipio.toLowerCase() === adminForm.municipio.toLowerCase()
      );
      setHospitalesFiltrados(hospitalesDelMunicipio);
    }
  }, [adminForm.municipio, hospitalesFiltrados]);

  useEffect(() => {
    if (adminForm.hospital) {
      const fetchGrupos = async () => {
        try {
          // En una implementación real, esta sería una llamada a la API
          // Simulamos la respuesta para este ejemplo
          // const res = await fetch(`http://localhost:4000/api/superadmin/grupos/${adminForm.hospital}`);
          // const data = await res.json();

          // Datos simulados de grupos
          const mockGrupos = [
            { id: 1, nombre: "Grupo A - Urgencias", hospital_id: 1 },
            { id: 2, nombre: "Grupo B - Pediatría", hospital_id: 1 },
            { id: 3, nombre: "Grupo C - Cirugía", hospital_id: 2 },
            { id: 4, nombre: "Grupo D - Administración", hospital_id: 2 },
          ];

          setGrupos(mockGrupos);
        } catch (error) {
          console.error("Error al obtener grupos:", error);
        }
      };
      fetchGrupos();
    } else {
      setGrupos([]);
    }
  }, [adminForm.hospital]);

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
      case "tipoAdmin":
        if (!value) error = "El tipo de administrador es obligatorio";
        break;
      case "estado":
        if (adminForm.tipoAdmin && !value) error = "El estado es obligatorio";
        break;
      case "municipio":
        if (adminForm.tipoAdmin === "municipioadmin" && !value)
          error = "El municipio es obligatorio";
        break;
      case "hospital":
        if (adminForm.tipoAdmin === "hospitaladmin" && !value)
          error = "El hospital es obligatorio";
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const formattedValue = name === "estado" ? value.toUpperCase() : value;

    if (type === "checkbox") {
      if (name.startsWith("grupo-")) {
        const grupoId = Number.parseInt(name.replace("grupo-", ""));
        const nuevosGrupos = checked
          ? [...adminForm.grupos, grupoId]
          : adminForm.grupos.filter((id) => id !== grupoId);

        setAdminForm({
          ...adminForm,
          grupos: nuevosGrupos,
        });
      }
    } else {
      const formattedValue = name === "CURP" ? value.toUpperCase() : value;

      // Resetear campos dependientes cuando cambia un campo superior
      if (name === "tipoAdmin") {
        if (
          value !== "estadoadmin" &&
          value !== "adminmunicipio" &&
          value !== "hospitaladmin"
        ) {
          setAdminForm({
            ...adminForm,
            [name]: formattedValue,
            estado: "",
            municipio: "",
            hospital: "",
            grupos: [],
          });
        } else {
          setAdminForm({
            ...adminForm,
            [name]: formattedValue,
          });
        }
      } else if (name === "estado") {
        setAdminForm({
          ...adminForm,
          [name]: formattedValue,
          municipio: "",
          hospital: "",
          grupos: [],
        });
      } else if (name === "municipio") {
        setAdminForm({
          ...adminForm,
          [name]: formattedValue,
          hospital: "",
          grupos: [],
        });
      } else if (name === "hospital") {
        setAdminForm({
          ...adminForm,
          [name]: formattedValue,
          grupos: [],
        });
      } else {
        setAdminForm({ ...adminForm, [name]: formattedValue });
      }

      setTouched({ ...touched, [name]: true });
      const error = validateField(name, formattedValue);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    let isValid = true;

    // Validar campos básicos
    const basicFields = [
      "nombres",
      "ap_paterno",
      "ap_materno",
      "CURP",
      "telefono",
      "tipoAdmin",
    ];
    basicFields.forEach((field) => {
      const error = validateField(field, adminForm[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    // Validar campos específicos según el tipo de administrador
    if (adminForm.tipoAdmin === "estadoadmin") {
      const error = validateField("estado", adminForm.estado);
      if (error) {
        newErrors.estado = error;
        isValid = false;
      }
    } else if (adminForm.tipoAdmin === "municipioadmin") {
      const estadoError = validateField("estado", adminForm.estado);
      const municipioError = validateField("municipio", adminForm.municipio);
      if (estadoError) {
        newErrors.estado = estadoError;
        isValid = false;
      }
      if (municipioError) {
        newErrors.municipio = municipioError;
        isValid = false;
      }
    } else if (adminForm.tipoAdmin === "hospitaladmin") {
      const estadoError = validateField("estado", adminForm.estado);
      const hospitalError = validateField("hospital", adminForm.hospital);
      if (estadoError) {
        newErrors.estado = estadoError;
        isValid = false;
      }
      if (hospitalError) {
        newErrors.hospital = hospitalError;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(basicFields.reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (!isValid) return;

    const user =
      adminForm.nombres.trim().charAt(0).toLowerCase() +
      adminForm.ap_paterno.trim().toLowerCase().replace(/\s+/g, "");

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

    const adminData = {
      nombre: adminForm.nombres,
      ap_paterno: adminForm.ap_paterno,
      ap_materno: adminForm.ap_materno,
      CURP: adminForm.CURP,
      telefono: adminForm.telefono,
      user,
      pass,
      role_name: adminForm.tipoAdmin,
      estado: adminForm.estado,
      municipio: adminForm.municipio,
      hospital: adminForm.hospital,
      grupos: adminForm.grupos,
    };
    if (adminForm.tipoAdmin === "adminmunicipio") {
      try {
        const response = await fetch(
          "http://localhost:4000/api/municipioadmin/create-municipioadmin",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: adminForm.nombres,
              ap_paterno: adminForm.ap_paterno,
              ap_materno: adminForm.ap_materno,
              curp: adminForm.CURP,
              telefono: adminForm.telefono,
              id_estado: adminForm.estado,
              id_municipio: adminForm.municipio,
              role_name: adminForm.role_name,
              user,
              pass,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Error al registrar el municipioadmin");
        }
      } catch (error) {
        console.error("Error al crear municipioadmin:", error);
        alert("Hubo un error al crear el administrador municipal.");
        return;
      }
    }

    // En todos los casos, continúa con onGuardar
    onGuardar(adminData);
  };

  const getTipoAdminLabel = () => {
    switch (adminForm.tipoAdmin) {
      case "estadoadmin":
        return "Administrador Estatal";
      case "adminmunicipio":
        return "Administrador Municipal";
      case "hospitaladmin":
        return "Administrador de Hospital";
      default:
        return "Administrador";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Nuevo Administrador
        </h2>
        <p className="text-gray-500 mt-1">
          Completa el formulario para registrar un nuevo administrador en el
          sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información personal */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb0 pb-0 border-b">
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
                value={adminForm[name]}
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

          {/* Tipo de administrador */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-0 pb-0 border-b">
              <Building2 className="h-4 w-4 mr-0 text-blue-600" />
              Tipo de Administrador
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selecciona el tipo de administrador
            </label>
            <select
              name="tipoAdmin"
              value={adminForm.tipoAdmin}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.tipoAdmin && touched.tipoAdmin
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              required
            >
              <option value="">Selecciona un tipo</option>
              <option value="estadoadmin">Administrador de Estado</option>
              <option value="municipioadmin">Administrador de Municipio</option>
              <option value="hospitaladmin">Administrador de Hospital</option>
            </select>
            {errors.tipoAdmin && touched.tipoAdmin && (
              <p className="mt-1 text-sm text-red-600">{errors.tipoAdmin}</p>
            )}
          </div>

          {/* Campos específicos según el tipo de administrador */}
          {adminForm.tipoAdmin && (
            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center mb-0 pb-0 border-b">
                {adminForm.tipoAdmin === "estadoadmin" ? (
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                ) : adminForm.tipoAdmin === "adminmunicipio" ? (
                  <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                ) : (
                  <Hospital className="h-4 w-4 mr-2 text-blue-600" />
                )}
                {adminForm.tipoAdmin === "estadoadmin"
                  ? "Información del Estado"
                  : adminForm.tipoAdmin === "municipioadmino"
                  ? "Información del Municipio"
                  : "Información del Hospital"}
              </h3>
            </div>
          )}

          {/* Select de estados (para todos los tipos) */}
          {adminForm.tipoAdmin && (
            <div
              className={
                adminForm.tipoAdmin === "adminmunicipio" ? "" : "md:col-span-2"
              }
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={adminForm.estado}
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
          )}

          {/* Select de municipios (solo para adminmunicipio) */}
          {["municipioadmin", "hospitaladmin"].includes(adminForm.tipoAdmin) &&
            adminForm.estado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipio
                </label>
                <select
                  name="municipio"
                  value={adminForm.municipio}
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
                      value={municipio.nombre_municipio}
                    >
                      {municipio.nombre_municipio.toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors.municipio && touched.municipio && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.municipio}
                  </p>
                )}
              </div>
            )}

          {/* Select de hospitales (solo para hospitaladmin) */}
          {adminForm.tipoAdmin === "hospitaladmin" && adminForm.estado && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital
              </label>
              <select
                name="hospital"
                value={adminForm.hospital}
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
                {hospitalesFiltrados.map((hospital) => (
                  <option key={hospital.id} value={hospital.nombre}>
                    {hospital.nombre}
                  </option>
                ))}
              </select>
              {errors.hospital && touched.hospital && (
                <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
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
            el administrador.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              • Usuario: Primera letra del nombre + apellido paterno (sin
              espacios)
            </li>
            <li>• Contraseña: Generada aleatoriamente (10 caracteres)</li>
            <li>• Rol: {getTipoAdminLabel()}</li>
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
            className="flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Administrador
          </button>
        </div>
      </form>
    </div>
  );
}
