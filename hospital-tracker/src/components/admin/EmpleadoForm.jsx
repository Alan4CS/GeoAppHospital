"use client"

import { useState } from "react"
import { ClipboardCheck, Phone, User, Save, X } from "lucide-react"

export default function EmpleadoForm({ hospitales, grupos, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: "",
    ap_paterno: "",
    ap_materno: "",
    curp: "",
    telefono: "",
    estado: "",
    hospital_id: "",
    grupo_id: "",
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [hospitalesFiltrados, setHospitalesFiltrados] = useState([])
  const [gruposFiltrados, setGruposFiltrados] = useState([])

  // Obtener estados únicos de los hospitales
  const estados = [...new Set(hospitales.map((h) => h.estado))].filter(Boolean).sort()

  const validateField = (name, value) => {
    let error = ""

    switch (name) {
      case "nombre":
        if (!value) error = "El nombre es obligatorio"
        break
      case "ap_paterno":
        if (!value) error = "El apellido paterno es obligatorio"
        break
      case "ap_materno":
        if (!value) error = "El apellido materno es obligatorio"
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
      case "estado":
        if (!value) error = "El estado es obligatorio"
        break
      case "hospital_id":
        if (!value) error = "El hospital es obligatorio"
        break
      case "grupo_id":
        if (!value) error = "El grupo es obligatorio"
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

    // Si cambia el estado, filtrar los hospitales
    if (name === "estado") {
      const filtrados = hospitales.filter((h) => h.estado === value)
      setHospitalesFiltrados(filtrados)
      // Resetear el hospital y grupo seleccionados
      setForm((prev) => ({ ...prev, hospital_id: "", grupo_id: "" }))
      setGruposFiltrados([])
    }

    // Si cambia el hospital, filtrar los grupos
    if (name === "hospital_id") {
      const filtrados = grupos.filter((g) => g.hospital_id === value)
      setGruposFiltrados(filtrados)
      // Resetear el grupo seleccionado
      setForm((prev) => ({ ...prev, grupo_id: "" }))
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

    // Generar nombre de usuario: primera letra del nombre + apellido paterno (todo en minúsculas, sin espacios)
    const user = form.nombre.trim().charAt(0).toLowerCase() + form.ap_paterno.trim().toLowerCase().replace(/\s+/g, "")

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

    // Crear el objeto empleado con los datos del formulario
    const empleadoData = {
      nombre: form.nombre,
      ap_paterno: form.ap_paterno,
      ap_materno: form.ap_materno,
      curp: form.curp,
      telefono: form.telefono,
      user,
      pass,
      estado: form.estado,
      hospital_id: form.hospital_id,
      grupo_id: form.grupo_id,
    }

    // Llamar a la función de guardar del componente padre
    onGuardar(empleadoData)

    // Limpiar el formulario
    setForm({
      nombre: "",
      ap_paterno: "",
      ap_materno: "",
      curp: "",
      telefono: "",
      estado: "",
      hospital_id: "",
      grupo_id: "",
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <User className="h-5 w-5 mr-2 text-emerald-600" />
          Nuevo Empleado
        </h2>
        <p className="text-gray-500 mt-1">Completa el formulario para registrar un nuevo empleado</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.nombre && touched.nombre ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ingrese el nombre"
              required
            />
            {errors.nombre && touched.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido paterno</label>
            <input
              type="text"
              name="ap_paterno"
              value={form.ap_paterno}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
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
              value={form.ap_materno}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
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
              <ClipboardCheck className="h-4 w-4 mr-1 text-emerald-600" />
              CURP
            </label>
            <input
              type="text"
              name="curp"
              value={form.curp}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
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
              <Phone className="h-4 w-4 mr-1 text-emerald-600" />
              Número de teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
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
              value={form.estado}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.estado && touched.estado ? "border-red-500" : "border-gray-300"
              }`}
              required
            >
              <option value="">Selecciona un estado</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            {errors.estado && touched.estado && <p className="mt-1 text-sm text-red-600">{errors.estado}</p>}
          </div>

          {form.estado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select
                name="hospital_id"
                value={form.hospital_id}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.hospital_id && touched.hospital_id ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona un hospital</option>
                {hospitalesFiltrados.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.nombre}
                  </option>
                ))}
              </select>
              {errors.hospital_id && touched.hospital_id && (
                <p className="mt-1 text-sm text-red-600">{errors.hospital_id}</p>
              )}
            </div>
          )}

          {form.hospital_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
              <select
                name="grupo_id"
                value={form.grupo_id}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.grupo_id && touched.grupo_id ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona un grupo</option>
                {gruposFiltrados.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
              {errors.grupo_id && touched.grupo_id && <p className="mt-1 text-sm text-red-600">{errors.grupo_id}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}