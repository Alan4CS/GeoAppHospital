import React from "react";

/**
 * StatsCardEstado - displays a single stat (count) with icon and label, with colored background
 * @param { icon: ReactNode, label: string, value: number, color: string, subtitle?: string }
 */
export default function StatsCardEstado({ icon, label, value, color = "emerald", subtitle }) {
  const colorClasses = {
    emerald: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700 border-emerald-200/60",
    blue: "bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700 border-blue-200/60",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 border-purple-200/60",
    yellow: "bg-gradient-to-br from-yellow-50 to-yellow-100/50 text-yellow-700 border-yellow-200/60",
    red: "bg-gradient-to-br from-red-50 to-red-100/50 text-red-700 border-red-200/60",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-700 border-orange-200/60"
  }

  const iconColors = {
    emerald: "bg-emerald-500 text-emerald-800 bg-opacity-50 ",
    yellow: "bg-yellow-500 text-yellow-800 bg-opacity-50",
    red: "bg-red-500 text-red-800 bg-opacity-50",
  }

  const accentColors = {
    emerald: "bg-emerald-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    }

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm 
      transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group
      ${colorClasses[color]}
    `}>
      {/* Accent line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColors[color]}`}></div>
      
      {/* Background decoration */}
      <div className={`
        absolute top-4 right-4 w-16 h-16 ${accentColors[color]} 
        rounded-full opacity-5 group-hover:opacity-8 transition-opacity duration-300
      `}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide uppercase">{label}</h3>
          <div className={`
            rounded-xl p-3 shadow-lg group-hover:scale-110 
            transition-transform duration-300 ${iconColors[color]}
          `}>
            {icon}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-4xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-sm mt-2 text-gray-600 leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}