// src/pages/Login.js
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { setIsAuthenticated } = useAuth()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    const role = localStorage.getItem("userRole")
    if (isAuthenticated) {
      if (role === "superadmin") {
        navigate("/superadmin-geoapp")
      } else if (role === "estadoadmin") {
        navigate("/estadoadmin-geoapp")
      }
    }
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: form.username, pass: form.password }),
      })

      const data = await res.json()

      if (data.mensaje === "Usuario no existe" || data.error) {
        setError("Credenciales incorrectas")
        return
      }

      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userRole", data.role)
      localStorage.setItem("userId", data.id_user)
      setIsAuthenticated(true)

      if (data.role === "superadmin") {
        navigate("/superadmin-geoapp")
      } else if (data.role === "estadoadmin") {
        navigate("/estadoadmin-geoapp")
      } else {
        setError("Rol no reconocido")
      }
    } catch (err) {
      console.error("Error en login:", err)
      setError("Error en el servidor")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-300 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-6">
          🏥 Hospital Tracker
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Tu usuario"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-all"
          >
            Iniciar sesión
          </button>
        </form>
        <p className="mt-4 text-xs text-gray-400 text-center">
          Acceso exclusivo para personal autorizado del sistema nacional de salud
        </p>
      </div>
    </div>
  )
}