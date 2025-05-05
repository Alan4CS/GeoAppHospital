import { useState } from "react"
import { ClipboardCheck, Key, Save, User, X } from "lucide-react"

export default function AdminForm({ hospitales, onGuardar, onCancelar, setHospitalesFiltradosPorEstado }) {
  const [adminForm, setAdminForm] = useState({
    nombres: "",
    ap_paterno: "",
    ap_materno: "",
    RFC: "",
    telefono: "",
    estado: "",
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (name, value) => {
    let error = ""

    switch (name) {
      case "nombres":
        if (!value) error = "El nombre es obligatorio"
        break
      case "ap_paterno":
        if (!value) error = "El apellido paterno es obligatorio"
        break
      case "ap_materno":
        if (!value) error = "El apellido materno es obligatorio"
        break
      case "RFC":
        if (!value) error = "El RFC es obligatorio"
        else if (!/^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/.test(value))
          error = "El RFC debe tener el formato correcto (AAAA######AAA)"
        break
      case "telefono":
        if (!value) error = "El teléfono es obligatorio"
        else if (!/^\d{10}$/.test(value)) error = "El teléfono debe tener 10 dígitos"
        break
      case "estado":
        if (!value) error = "El estado es obligatorio"
        break
      default:
        break
    }

    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Para el RFC, convertir a mayúsculas automáticamente
    const formattedValue = name === "RFC" ? value.toUpperCase() : value

    setAdminForm({ ...adminForm, [name]: formattedValue })

    // Marcar el campo como tocado
    setTouched({ ...touched, [name]: true })

    // Validar el campo
    const error = validateField(name, formattedValue)
    setErrors({ ...errors, [name]: error })

    // Si cambia el estado, filtrar los hospitales para ese estado
    if (name === "estado") {
      const hospitalesDelEstado = hospitales.filter((h) => h.estado.toLowerCase() === value.toLowerCase())
      setHospitalesFiltradosPorEstado(hospitalesDelEstado)
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched({ ...touched, [name]: true })
    const error = validateField(name, value)
    setErrors({ ...errors, [name]: error })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validar todos los campos antes de enviar
    const newErrors = {}
    let isValid = true

    Object.keys(adminForm).forEach((key) => {
      const error = validateField(key, adminForm[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(adminForm).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    if (!isValid) return

    // Generar nombre de usuario: primera letra del nombre + apellido paterno (todo en minúsculas, sin espacios)
    const user =
      adminForm.nombres.trim().charAt(0).toLowerCase() + adminForm.ap_paterno.trim().toLowerCase().replace(/\s+/g, "")

    // Generar contraseña aleatoria de 10 caracteres
    const generarPassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      let password = ""
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return password
    }

    const pass = generarPassword()

    // Crear el objeto administrador con los datos del formulario
    const adminData = {
      nombre: adminForm.nombres,
      ap_paterno: adminForm.ap_paterno,
      ap_materno: adminForm.ap_materno,
      RFC: adminForm.RFC,
      telefono: adminForm.telefono,
      user,
      pass,
      role_name: "estadoadmin",
      estado: adminForm.estado,
    }

    // Llamar a la función de guardar del componente padre
    onGuardar(adminData)
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Nuevo Administrador
        </h2>
        <p className="text-gray-500 mt-1">Completa el formulario para registrar un nuevo administrador estatal</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
            <input
              type="text"
              name="nombres"
              value={adminForm.nombres}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nombres && touched.nombres ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ingrese los nombres"
              required
            />
            {errors.nombres && touched.nombres && <p className="mt-1 text-sm text-red-600">{errors.nombres}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido paterno</label>
            <input
              type="text"
              name="ap_paterno"
              value={adminForm.ap_paterno}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ap_paterno && touched.ap_paterno ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ingrese el apellido paterno"
              required
            />
            {errors.ap_paterno && touched.ap_paterno && (
              <p className="mt-1 text-sm text-red-600">{errors.ap_paterno}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido materno</label>
            <input
              type="text"
              name="ap_materno"
              value={adminForm.ap_materno}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ap_materno && touched.ap_materno ? "border-red-500" : "border-gray-300"
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
              RFC
            </label>
            <input
              type="text"
              name="RFC"
              value={adminForm.RFC}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.RFC && touched.RFC ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej. AAAA######AAA"
              maxLength={13}
              required
            />
            {errors.RFC && touched.RFC ? (
              <p className="mt-1 text-sm text-red-600">{errors.RFC}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Formato: 4 letras, 6 números, 3 caracteres alfanuméricos</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de teléfono</label>
            <input
              type="tel"
              name="telefono"
              value={adminForm.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.telefono && touched.telefono ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="10 dígitos"
              maxLength={10}
              required
            />
            {errors.telefono && touched.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              value={adminForm.estado}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.estado && touched.estado ? "border-red-500" : "border-gray-300"
              }`}
              required
            >
              <option value="">Selecciona un estado</option>
              {[
                "Aguascalientes",
                "Baja California",
                "Baja California Sur",
                "Campeche",
                "Chiapas",
                "Chihuahua",
                "Ciudad de México",
                "Coahuila",
                "Colima",
                "Durango",
                "Estado de México",
                "Guanajuato",
                "Guerrero",
                "Hidalgo",
                "Jalisco",
                "Michoacán",
                "Morelos",
                "Nayarit",
                "Nuevo León",
                "Oaxaca",
                "Puebla",
                "Querétaro",
                "Quintana Roo",
                "San Luis Potosí",
                "Sinaloa",
                "Sonora",
                "Tabasco",
                "Tamaulipas",
                "Tlaxcala",
                "Veracruz",
                "Yucatán",
                "Zacatecas",
              ].map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            {errors.estado && touched.estado && <p className="mt-1 text-sm text-red-600">{errors.estado}</p>}
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
            <Key className="h-4 w-4 mr-1 text-blue-600" />
            Información de acceso
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Se generará automáticamente un nombre de usuario y contraseña para el administrador.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Usuario: Primera letra del nombre + apellido paterno (sin espacios)</li>
            <li>• Contraseña: Generada aleatoriamente (10 caracteres)</li>
            <li>• Rol: Administrador Estatal</li>
          </ul>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Administrador
          </button>
        </div>
      </form>
    </div>
  )
}