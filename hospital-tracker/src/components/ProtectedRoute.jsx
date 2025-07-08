// src/components/ProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Puedes personalizar este loader
    return <div className="flex h-screen items-center justify-center text-lg">Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}