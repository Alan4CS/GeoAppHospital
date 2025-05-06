import { useState, useEffect } from "react"
import { ClipboardCheck, Key, Save, User, X } from "lucide-react"

export default function AdminForm({ hospitales, onGuardar, onCancelar, setHospitalesFiltradosPorEstado }) {
  const [adminForm, setAdminForm] = useState({
    nombres: "",
    ap_paterno: "",
    ap_materno: "",
    CURP: "",
    telefono: "",
    estado: "",
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [estados, setEstados] = useState([])

  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/superadmin/estados")
        const data = await res.json()
        setEstados(data)
      } catch (error) {
        console.error("Error al obtener estados:", error)
      }
    }
    fetchEstados()
  }, [])

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
      case "CURP":
        if (!value) error = "El CURP es obligatorio"
        else if (!/^[A-Z&Ñ]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(value))
          error = "El CURP debe tener el formato correcto (AAAA######AAA)"
        break
      case "telefono":
        if (!value) error = "El teléfono es obligatorio"
        else if (!/^\d{10}$/.test(value)) error = "El teléfono debe tener 10 dígitos"
        break
      case "estado":
        if (!value) error = "El estado es obligatorio"
        break
    }
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const formattedValue = name === "CURP" ? value.toUpperCase() : value

    setAdminForm({ ...adminForm, [name]: formattedValue })
    setTouched({ ...touched, [name]: true })

    const error = validateField(name, formattedValue)
    setErrors({ ...errors, [name]: error })

    if (name === "estado") {
      const hospitalesDelEstado = hospitales.filter(
        (h) => h.estado.toLowerCase() === value.toLowerCase()
      )
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

    const user =
      adminForm.nombres.trim().charAt(0).toLowerCase() +
      adminForm.ap_paterno.trim().toLowerCase().replace(/\s+/g, "")

    const generarPassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      let password = ""
      for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return password
    }

    const pass = generarPassword()

    const adminData = {
      nombre: adminForm.nombres,
      ap_paterno: adminForm.ap_paterno,
      ap_materno: adminForm.ap_materno,
      CURP: adminForm.CURP,
      telefono: adminForm.telefono,
      user,
      pass,
      role_name: "estadoadmin",
      estado: adminForm.estado,
    }

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
          {/* Campos de texto */}
          {[
            { name: "nombres", label: "Nombres", placeholder: "Ingrese los nombres" },
            { name: "ap_paterno", label: "Apellido paterno", placeholder: "Ingrese el apellido paterno" },
            { name: "ap_materno", label: "Apellido materno", placeholder: "Ingrese el apellido materno" },
            {
              name: "CURP",
              label: "CURP",
              placeholder: "Ej. GOMC920101HDFLNS09",
              icon: <ClipboardCheck className="h-4 w-4 mr-1 text-blue-600" />,
              extraInfo: "Formato: 4 letras, 6 números, 3 caracteres alfanuméricos",
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
                  errors[name] && touched[name] ? "border-red-500" : "border-gray-300"
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

          {/* Select de estados */}
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
        </div>

        {/* Info de acceso */}
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
  )
}