export default function GroupLeaderStatsCard({ title, value, icon, description, color = "teal" }) {
  const colorClasses = {
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
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