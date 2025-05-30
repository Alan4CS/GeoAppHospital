import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SuperadminGeoApp from "./pages/SuperadminGeoApp";
import Dashboard from "./pages/Dashboard";
import EstadoadminGeoApp from "./pages/EstadoadminGeoApp";
import HospitalAdminGeoApp from "./pages/HospitalAdminGeoApp";
import GroupadminGeoApp from "./pages/GroupadminGeoApp";
import ActivityLog from "./components/ActivityLog";

// Componente envoltorio para rutas protegidas que incluye ActivityLog
const ProtectedRouteWithActivityLog = ({ children }) => (
  <ProtectedRoute>
    <>
      {children}
      <ActivityLog />
    </>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/superadmin-geoapp"
            element={
              <ProtectedRouteWithActivityLog>
                <SuperadminGeoApp />
              </ProtectedRouteWithActivityLog>
            }
          />
          <Route
            path="/estadoadmin-geoapp"
            element={
              <ProtectedRouteWithActivityLog>
                <EstadoadminGeoApp />
              </ProtectedRouteWithActivityLog>
            }
          />
          <Route
            path="/hospitaladmin-geoapp"
            element={
              <ProtectedRouteWithActivityLog>
                <HospitalAdminGeoApp />
              </ProtectedRouteWithActivityLog>
            }
          />
          <Route
            path="/grupoadmin-geoapp"
            element={
              <ProtectedRouteWithActivityLog>
                <GroupadminGeoApp />
              </ProtectedRouteWithActivityLog>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
