import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // IMPORTA el AuthProvider
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import SuperadminGeoApp from "./pages/SuperadminGeoApp";
import Dashboard from "./pages/Dashboard";
import EstadoadminGeoApp from "./pages/EstadoadminGeoApp";
import HospitalAdminGeoApp from "./pages/HospitalAdminGeoApp";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/superadmin-geoapp"
            element={
              <ProtectedRoute>
                <SuperadminGeoApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estadoadmin-geoapp"
            element={
              <ProtectedRoute>
                <EstadoadminGeoApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospitaladmin-geoapp"
            element={
              <ProtectedRoute>
                <HospitalAdminGeoApp />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;