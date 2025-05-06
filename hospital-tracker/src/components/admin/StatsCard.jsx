export default function StatsCard({ title, value, icon, description, color = "emerald" }) {
    const colorClasses = {
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      purple: "bg-purple-50 text-purple-700 border-purple-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200",
      rose: "bg-rose-50 text-rose-700 border-rose-200",
    }
  
    return (
      <div className={`rounded-xl border p-6 shadow-sm ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="rounded-full p-2 bg-white">{icon}</div>
        </div>
  
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs mt-1 text-gray-600">{description}</p>
        </div>
      </div>
    )
  }  