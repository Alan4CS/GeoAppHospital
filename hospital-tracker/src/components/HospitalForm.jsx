"use client"

import { useState, useEffect } from "react"
import GeocercaMap from "./GeocercaMap"
import { Building2, Check, MapPin, Save, X } from "lucide-react"

export default function HospitalForm({
  editandoHospital = false,
  hospitalEditando = null,
  mapCenter,
  geocerca,
  onCoordsChange,
  onBuscarCoordenadasEstado,
  onGuardar,
  onCancelar,
}) {
  const [form, setForm] = useState({
    estado: "",
    nombre: "",
    tipoUnidad: "",
    region: "",
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Inicializar el formulario con los datos del hospital si estamos editando
  useEffect(() => {
    if (editandoHospital && hospitalEditando) {
      setForm({
        estado: hospitalEditando.estado || "",
        nombre: hospitalEditando.nombre || "",
        tipoUnidad: hospitalEditando.tipoUnidad || "",
        region: hospitalEditando.region || "",
      })
    }
  }, [editandoHospital, hospitalEditando])

  const validateField = (name, value) => {
    let error = ""

    switch (name) {
      case "estado":
        if (!value) error = "El estado es obligatorio"
        break
      case "nombre":
        if (!value) error = "El nombre es obligatorio"
        else if (value.length < 3) error = "El nombre debe tener al menos 3 caracteres"
        break
      case "tipoUnidad":
        if (!value) error = "El tipo de unidad es obligatorio"
        break
      case "region":
        if (!value) error = "La región es obligatoria"
        break
      default:
        break
    }

    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })

    // Marcar el campo como tocado
    setTouched({ ...touched, [name]: true })

    // Validar el campo
    const error = validateField(name, value)
    setErrors({ ...errors, [name]: error })

    if (name === "estado") {
      onBuscarCoordenadasEstado(value)
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

    // Asegurar que geocerca tenga un valor adecuado
    const geocercaFinal = geocerca || { lat: 0, lng: 0, radio: 0 }

    // Crear el objeto hospital con los datos del formulario
    const hospitalData = {
      ...form,
      geocerca: geocercaFinal,
    }

    // Llamar a la función de guardar del componente padre
    onGuardar(hospitalData)

    // Limpiar el formulario
    setForm({
      estado: "",
      nombre: "",
      tipoUnidad: "",
      region: "",
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-emerald-600" />
          {editandoHospital ? "Editar Hospital" : "Nuevo Hospital"}
        </h2>
        <p className="text-gray-500 mt-1">
          {editandoHospital
            ? "Actualiza la información del hospital seleccionado"
            : "Completa el formulario para registrar un nuevo hospital"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del hospital</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.nombre && touched.nombre ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ingrese el nombre del hospital"
                required
              />
              {errors.nombre && touched.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de unidad</label>
              <select
                name="tipoUnidad"
                value={form.tipoUnidad}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.tipoUnidad && touched.tipoUnidad ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">Selecciona una opción</option>
                <option value="CLINICA">CLINICA</option>
                <option value="HOSPITAL">HOSPITAL</option>
                <option value="IMMS BIENESTAR">IMMS BIENESTAR</option>
                <option value="UNIDADES MEDICAS">UNIDADES MEDICAS</option>
              </select>
              {errors.tipoUnidad && touched.tipoUnidad && (
                <p className="mt-1 text-sm text-red-600">{errors.tipoUnidad}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  errors.region && touched.region ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ingrese la región o dirección"
                required
              />
              {errors.region && touched.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-emerald-600" />
                Ubicación y Geocerca
              </label>
              <div className="border rounded-lg overflow-hidden h-[300px]">
                <GeocercaMap onCoordsChange={onCoordsChange} centerFromOutside={mapCenter} initialGeocerca={geocerca} />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Selecciona la ubicación del hospital y define el radio de la geocerca
              </p>
            </div>

            {geocerca && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Información de la geocerca</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="block text-gray-500">Latitud</span>
                    <span className="font-medium">{geocerca.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Longitud</span>
                    <span className="font-medium">{geocerca.lng.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">Radio (m)</span>
                    <span className="font-medium">{geocerca.radio}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>

          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            {editandoHospital ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Actualizar hospital
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Guardar hospital
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}