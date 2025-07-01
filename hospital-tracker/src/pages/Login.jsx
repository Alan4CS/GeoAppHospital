import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const role = localStorage.getItem("userRole");
    if (isAuthenticated) {
      if (role === "superadmin") {
        navigate("/superadmin-geoapp");
      } else if (role === "estadoadmin") {
        navigate("/estadoadmin-geoapp");
      } else if (role === "hospitaladmin") {
        navigate("/hospitaladmin-geoapp");
      } else if (role === "grupoadmin") {
        navigate("/grupoadmin-geoapp");
      } else if (role === "municipioadmin") {
        navigate("/municipioadmin-geoapp");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(
        "https://geoapphospital.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: form.username, pass: form.password }),
        }
      );

      const data = await res.json();

      if (data.mensaje === "Usuario no existe" || data.error) {
        setError("Credenciales incorrectas");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data.id_user);
      setIsAuthenticated(true);

      if (data.role === "superadmin") {
        navigate("/superadmin-geoapp");
      } else if (data.role === "estadoadmin") {
        navigate("/estadoadmin-geoapp");
      } else if (data.role === "hospitaladmin") {
        navigate("/hospitaladmin-geoapp");
      } else if (data.role === "grupoadmin") {
        navigate("/grupoadmin-geoapp");
      } else if (data.role === "municipioadmin") {
        navigate("/municipioadmin-geoapp");
      } else {
        setError("Rol no reconocido");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Error en el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-blue-400">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-blue-300/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-blue-200/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-xl"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Logo and header */}
          <div className="flex flex-col items-center mb-8 relative">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-300 rounded-full opacity-20 blur-2xl"></div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-4 rounded-full mb-4 shadow-lg border-2 border-white/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">Geo App</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-blue-300 to-blue-100 rounded-full mb-2"></div>
            <p className="text-blue-100 text-sm">Sistema Nacional de Salud</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-blue-100 mb-1 ml-1"
              >
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-200 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="relative w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder-blue-200/70"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-blue-100 mb-1 ml-1"
              >
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-200 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="relative w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-white placeholder-blue-200/70"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-100 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 rounded-lg transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed border border-white/20 shadow-lg">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar sesión"
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-white/10">
            <p className="text-xs text-blue-100/70 text-center">
              Acceso exclusivo para personal autorizado del sistema nacional de
              salud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
