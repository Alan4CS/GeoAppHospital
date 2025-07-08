import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consultar /api/auth/me para saber si el usuario está autenticado
    fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include"
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setUserRole(data.role);
          setUserId(data.id_user);
        } else {
          setIsAuthenticated(false);
          setUserRole(null);
          setUserId(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserRole(null);
        setUserId(null);
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {}
    setIsAuthenticated(false);
    setUserRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, userRole, setUserRole, userId, setUserId, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
