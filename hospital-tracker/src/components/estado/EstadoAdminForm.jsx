"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  ClipboardCheck,
  Key,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";

export default function EstadoAdminForm({ hospitales, onGuardar, onCancelar }) {
  const [adminForm, setAdminForm] = useState({
    nombre: "",
    ap_paterno: "",
    ap_materno: "",
    CURP: "",
    telefono: "",
    hospital: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generatedUser, setGeneratedUser] = useState("");

  // Generar vista previa del nombre de usuario cuando cambia el nombre o apellido paterno
  useEffect(() => {
    if (adminForm.nombre && adminForm.ap_paterno) {
      const user =
        adminForm.nombre.trim().charAt(0).toLowerCase() +
        adminForm.ap_paterno.trim().toLowerCase().replace(/\s+/g, "");
      setGeneratedUser(user);
    } else {
      setGeneratedUser("");
    }
  }, [adminForm.nombre, adminForm.ap_paterno]);

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "nombre":
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
      case "hospital":
        if (!value) error = "El hospital es obligatorio";
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = name === "CURP" ? value.toUpperCase() : value;

    setAdminForm({ ...adminForm, [name]: formattedValue });
    setTouched({ ...touched, [name]: true });

    const error = validateField(name, formattedValue);
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

    const newErrors = {};
    let isValid = true;

    Object.keys(adminForm).forEach((key) => {
      const error = validateField(key, adminForm[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(adminForm).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    );

    if (!isValid) return;

    const user =
      adminForm.nombre.trim().charAt(0).toLowerCase() +
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
      nombre: adminForm.nombre,
      ap_paterno: adminForm.ap_paterno,
      ap_materno: adminForm.ap_materno,
      CURP: adminForm.CURP,
      telefono: adminForm.telefono,
      user,
      pass,
      role_name: "hospitaladmin",
      hospital: adminForm.hospital,
    };

    onGuardar(adminData);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Nuevo Administrador de Hospital
        </h2>
        <p className="text-gray-500 mt-1">
          Completa el formulario para registrar un nuevo administrador de
          hospital
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información personal */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              Información Personal
            </h3>
          </div>

          {/* Campos de texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={adminForm.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nombre && touched.nombre
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Ingrese el nombre"
              required
            />
            {errors.nombre && touched.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido paterno
            </label>
            <input
              type="text"
              name="ap_paterno"
              value={adminForm.ap_paterno}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ap_paterno && touched.ap_paterno
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Ingrese el apellido paterno"
              required
            />
            {errors.ap_paterno && touched.ap_paterno && (
              <p className="mt-1 text-sm text-red-600">{errors.ap_paterno}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido materno
            </label>
            <input
              type="text"
              name="ap_materno"
              value={adminForm.ap_materno}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ap_materno && touched.ap_materno
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Ingrese el apellido materno"
              required
            />
            {errors.ap_materno && touched.ap_materno && (
              <p className="mt-1 text-sm text-red-600">{errors.ap_materno}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <ClipboardCheck className="h-4 w-4 mr-1 text-blue-600" />
              CURP
            </label>
            <input
              type="text"
              name="CURP"
              value={adminForm.CURP}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.CURP && touched.CURP
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Ej. GOMC920101HDFLNS09"
              maxLength={18}
              required
            />
            {errors.CURP && touched.CURP ? (
              <p className="mt-1 text-sm text-red-600">{errors.CURP}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Formato: 4 letras, 6 números, H/M, 5 letras, 2 alfanuméricos
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Phone className="h-4 w-4 mr-1 text-blue-600" />
              Número de teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={adminForm.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.telefono && touched.telefono
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="10 dígitos"
              maxLength={10}
              required
            />
            {errors.telefono && touched.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
            )}
          </div>

          {/* Información del hospital */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
              Información del Hospital
            </h3>
          </div>

          {/* Select de hospitales */}
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
              {hospitales.map((hospital) => (
                <option
                  key={hospital.id_hospital || hospital.id}
                  value={hospital.nombre_hospital || hospital.nombre}
                >
                  {hospital.nombre_hospital || hospital.nombre}
                </option>
              ))}
            </select>
            {errors.hospital && touched.hospital && (
              <p className="mt-1 text-sm text-red-600">{errors.hospital}</p>
            )}
          </div>
        </div>

        {/* Info de acceso */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
            <Key className="h-4 w-4 mr-1 text-blue-600" />
            Información de acceso
          </h3>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-24 text-xs font-medium text-gray-500">
                Usuario:
              </div>
              <div className="text-sm font-medium text-gray-800">
                {generatedUser || "Se generará automáticamente"}
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-xs font-medium text-gray-500">
                Contraseña:
              </div>
              <div className="text-sm font-medium text-gray-800">
                Se generará automáticamente
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            La información de acceso se generará de la siguiente manera:
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              • Usuario: Primera letra del nombre + apellido paterno (sin
              espacios)
            </li>
            <li>• Contraseña: Generada aleatoriamente (10 caracteres)</li>
            <li>• Rol: Administrador de Hospital</li>
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
