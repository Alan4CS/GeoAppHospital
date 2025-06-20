import React from "react";

/**
 * StatsCardEstado - displays a single stat (count) with icon and label, with colored background
 * @param { icon: ReactNode, label: string, value: number, color: string, subtitle?: string }
 */
export default function StatsCardEstado({ icon, label, value, color = "emerald", subtitle }) {
  // Color classes for backgrounds and text
  const colorMap = {
    emerald: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      iconBg: "bg-white",
      iconText: "text-emerald-600"
    },
    blue: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      iconBg: "bg-white",
      iconText: "text-blue-600"
    },
    purple: {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-700",
      iconBg: "bg-white",
      iconText: "text-purple-600"
    },
    yellow: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      iconBg: "bg-white",
      iconText: "text-yellow-600"
    },
    red: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      iconBg: "bg-white",
      iconText: "text-red-600"
    },
    orange: {
      bg: "bg-orange-50 border-orange-200",
      text: "text-orange-700",
      iconBg: "bg-white",
      iconText: "text-orange-600"
    }
  };
  const c = colorMap[color] || colorMap["emerald"];

  return (
    <div className={`flex flex-col justify-between h-full rounded-2xl border p-6 min-w-[240px] ${c.bg}`}
      style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold text-base ${c.text}`}>{label}</span>
        <span className={`rounded-full p-2 ${c.iconBg} shadow-sm`}>
          {React.cloneElement(icon, { className: `${c.iconText} w-7 h-7` })}
        </span>
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
