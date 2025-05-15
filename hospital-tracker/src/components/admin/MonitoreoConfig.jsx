import { useState } from "react"
import { Info, Save, X } from "lucide-react"
import MonitoreoMap from "./MonitoreoMap"

export default function MonitoreoConfig() {
  const [config, setConfig] = useState({
    monitorearEstado: true,
    monitorearMunicipio: true,
    monitorearHospital: true,
    monitorearGrupo: true,
    frecuenciaActualizacion: 5,
    alertasEmail: true,
    alertasSMS: false,
    radioPredeterminado: 500,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setConfig({
      ...config,
      [name]: type === "checkbox" ? checked : type === "number" ? Number.parseInt(value) : value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí iría la lógica para guardar la configuración
    alert("Configuración guardada correctamente")
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Info className="h-5 w-5 mr-2 text-emerald-600" />
            Configuración de Monitoreo
          </h3>
          <p className="text-gray-500 mt-1">Configura los niveles de monitoreo y las preferencias del sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-700">Niveles de Monitoreo</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="monitorearEstado"
                    name="monitorearEstado"
                    checked={config.monitorearEstado}
                    onChange={handleChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="monitorearEstado" className="ml-2 block text-sm text-gray-700">
                    Monitorear a nivel Estado
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="monitorearMunicipio"
                    name="monitorearMunicipio"
                    checked={config.monitorearMunicipio}
                    onChange={handleChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="monitorearMunicipio" className="ml-2 block text-sm text-gray-700">
                    Monitorear a nivel Municipio
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="monitorearHospital"
                    name="monitorearHospital"
                    checked={config.monitorearHospital}
                    onChange={handleChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="monitorearHospital" className="ml-2 block text-sm text-gray-700">
                    Monitorear a nivel Hospital
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="monitorearGrupo"
                    name="monitorearGrupo"
                    checked={config.monitorearGrupo}
                    onChange={handleChange}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="monitorearGrupo" className="ml-2 block text-sm text-gray-700">
                    Monitorear a nivel Grupo
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-700 mb-4">Configuración de Geocerca</h4>
                <div>
                  <label htmlFor="radioPredeterminado" className="block text-sm font-medium text-gray-700 mb-1">
                    Radio predeterminado para nuevas geocercas (metros)
                  </label>
                  <input
                    type="number"
                    id="radioPredeterminado"
                    name="radioPredeterminado"
                    value={config.radioPredeterminado}
                    onChange={handleChange}
                    min="100"
                    max="5000"
                    className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-700">Preferencias de Actualización</h4>
              <div>
                <label htmlFor="frecuenciaActualizacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia de actualización (minutos)
                </label>
                <select
                  id="frecuenciaActualizacion"
                  name="frecuenciaActualizacion"
                  value={config.frecuenciaActualizacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 border-gray-300"
                >
                  <option value="1">1 minuto</option>
                  <option value="5">5 minutos</option>
                  <option value="10">10 minutos</option>
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-700 mb-4">Notificaciones</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="alertasEmail"
                      name="alertasEmail"
                      checked={config.alertasEmail}
                      onChange={handleChange}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="alertasEmail" className="ml-2 block text-sm text-gray-700">
                      Recibir alertas por correo electrónico
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="alertasSMS"
                      name="alertasSMS"
                      checked={config.alertasSMS}
                      onChange={handleChange}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="alertasSMS" className="ml-2 block text-sm text-gray-700">
                      Recibir alertas por SMS
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mt-6">
                <h4 className="text-sm font-medium text-emerald-800 flex items-center mb-2">
                  <Info className="h-4 w-4 mr-1 text-emerald-600" />
                  Información sobre el monitoreo
                </h4>
                <p className="text-xs text-emerald-700">
                  El sistema permite monitorear la ubicación de los empleados en diferentes niveles jerárquicos. Cada
                  nivel superior puede ver la información de los niveles inferiores. La frecuencia de actualización
                  determina cada cuánto tiempo se registra la ubicación de los empleados.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar configuración
            </button>
          </div>
        </form>
      </div>

      <MonitoreoMap />
    </div>
  )
}