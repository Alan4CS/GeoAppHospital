import React from "react"

const EstadoStatsCard = ({ title, value, icon, description, color = "blue" }) => {
  // Configuración de colores según el parámetro
  const colorConfig = {
    blue: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      border: "border-blue-200",
    },
    green: {
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      border: "border-green-200",
    },
    orange: {
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      border: "border-orange-200",
    },
    purple: {
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      border: "border-purple-200",
    },
    gray: {
      bg: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      border: "border-gray-200",
    },
  }

  const colors = colorConfig[color] || colorConfig.blue

  return (
    <div className={`${colors.bg} rounded-xl p-6 border ${colors.border} shadow-sm`}>
      <div className="flex items-center">
        <div className={`p-3 ${colors.iconBg} rounded-lg mr-4`}>
          {React.cloneElement(icon, { className: `h-6 w-6 ${colors.iconColor}` })}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}

export default EstadoStatsCard