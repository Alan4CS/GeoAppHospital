import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ActivityLog from "./components/ActivityLog";
import React, { Suspense, lazy } from "react";

const Login = lazy(() => import("./pages/Login"));
const SuperadminGeoApp = lazy(() => import("./pages/SuperadminGeoApp"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EstadoadminGeoApp = lazy(() => import("./pages/EstadoadminGeoApp"));
const MunicipioadminGeoApp = lazy(() => import("./pages/MunicipioadminGeoApp"));

// Solo para superadmin: ruta protegida con ActivityLog
const ProtectedRouteWithActivityLog = ({ children }) => (
  <ProtectedRoute>
    <>
      {children}
      <ActivityLog />
    </>
  </ProtectedRoute>
);
// Para los demás: ruta protegida normal
const ProtectedRouteOnly = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-lg">Cargando...</div>}>
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
                  <ProtectedRouteOnly>
                    <EstadoadminGeoApp />
                  </ProtectedRouteOnly>
                }
              />
              <Route
                path="/hospitaladmin-geoapp"
                element={
                  <ProtectedRouteOnly>
                    <HospitalAdminGeoApp />
                  </ProtectedRouteOnly>
                }
              />
              <Route
                path="/grupoadmin-geoapp"
                element={
                  <ProtectedRouteOnly>
                    <GroupadminGeoApp />
                  </ProtectedRouteOnly>
                }
              />
              <Route
                path="/municipioadmin-geoapp"
                element={
                  <ProtectedRouteOnly>
                    <MunicipioadminGeoApp />
                  </ProtectedRouteOnly>
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
