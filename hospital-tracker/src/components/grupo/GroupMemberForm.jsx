import { useState } from "react"
import { Check, ClipboardCheck, Phone, User, X } from "lucide-react"

export default function GroupMemberForm({ grupoInfo, hospitalInfo, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: "",
    curp: "",
    telefono: "",
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = (name, value) => {
    let error = ""

    switch (name) {
      case "nombre":
        if (!value) error = "El nombre es obligatorio"
        else if (value.length < 3) error = "El nombre debe tener al menos 3 caracteres"
        break
      case "curp":
        if (!value) error = "La CURP es obligatoria"
        else if (!/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(value))
          error = "La CURP debe tener el formato correcto"
        break
      case "telefono":
        if (!value) error = "El teléfono es obligatorio"
        else if (!/^\d{10}$/.test(value)) error = "El teléfono debe tener 10 dígitos"
        break
      default:
        break
    }

    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Para la CURP, convertir a mayúsculas automáticamente
    const formattedValue = name === "curp" ? value.toUpperCase() : value

    setForm({ ...form, [name]: formattedValue })

    // Marcar el campo como tocado
    setTouched({ ...touched, [name]: true })

    // Validar el campo
    const error = validateField(name, formattedValue)
    setErrors({ ...errors, [name]: error })
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

    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {}))

    if (!isValid) return

    // Llamar a la función de guardar del componente padre
    onGuardar(form)

    // Limpiar el formulario
    setForm({
      nombre: "",
      curp: "",
      telefono: "",
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <User className="h-5 w-5 mr-2 text-teal-600" />
          Agregar Nuevo Miembro
        </h2>
        <p className="text-gray-500 mt-1">
          Completa el formulario para agregar un nuevo miembro al grupo {grupoInfo?.nombre || "..."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.nombre && touched.nombre ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nombre y apellidos"
                required
              />
              {errors.nombre && touched.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <ClipboardCheck className="h-4 w-4 mr-1 text-teal-600" />
                CURP
              </label>
              <input
                type="text"
                name="curp"
                value={form.curp}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.curp && touched.curp ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ej. GORA901231HDFNZN09"
                maxLength={18}
                required
              />
              {errors.curp && touched.curp ? (
                <p className="mt-1 text-sm text-red-600">{errors.curp}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Formato: 18 caracteres alfanuméricos</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Phone className="h-4 w-4 mr-1 text-teal-600" />
                Número de teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors.telefono && touched.telefono ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="10 dígitos"
                maxLength={10}
                required
              />
              {errors.telefono && touched.telefono && <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Información del Grupo</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Grupo</p>
                  <p className="font-medium">{grupoInfo?.nombre || "..."}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hospital</p>
                  <p className="font-medium">{hospitalInfo?.nombre || "..."}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="font-medium">{hospitalInfo?.direccion || "..."}</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 p-6 rounded-lg border border-teal-100">
              <h3 className="text-sm font-medium text-teal-800 mb-4">Información Importante</h3>
              <ul className="space-y-2 text-sm text-teal-700">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-teal-600" />
                  El miembro será agregado automáticamente al grupo actual.
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-teal-600" />
                  Se generará un usuario y contraseña para acceso al sistema.
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-teal-600" />
                  El miembro recibirá instrucciones para activar su cuenta.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Check className="h-4 w-4 mr-2" />
            Agregar Miembro
          </button>
        </div>
      </form>
    </div>
  )
}