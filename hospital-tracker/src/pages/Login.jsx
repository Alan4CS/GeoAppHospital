import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const fakeUsers = {
  superadmin: { username: "admin", password: "1234" },
  estado: { username: "estado", password: "1234" },
};

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const userEntries = Object.entries(fakeUsers);
    const matched = userEntries.find(
      ([, user]) =>
        user.username === form.username && user.password === form.password
    );

    if (matched) {
      const [role] = matched;
      setIsAuthenticated(true);
      if (role === "superadmin") {
        navigate("/superadmin-geoapp");
      } else if (role === "estado") {
        navigate("/estadoadmin-geoapp");
      }
    } else {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-300 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-blue-700 mb-6">
          🏥 Hospital Tracker
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="admin o estado"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="1234"
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
          Acceso exclusivo para personal autorizado del sistema nacional de
          salud
        </p>
      </div>
    </div>
  );
}
