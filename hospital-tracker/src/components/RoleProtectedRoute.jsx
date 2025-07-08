import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-lg">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Puedes redirigir a una página de acceso denegado o al login
    return <Navigate to="/" replace />;
  }

  return children;
} 