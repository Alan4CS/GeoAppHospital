import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ActivityLog from "./components/ActivityLog";
import React, { Suspense, lazy } from "react";

const Login = lazy(() => import("./pages/Login"));
const SuperadminGeoApp = lazy(() => import("./pages/SuperadminGeoApp"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EstadoadminGeoApp = lazy(() => import("./pages/EstadoadminGeoApp"));
const MunicipioadminGeoApp = lazy(() => import("./pages/MunicipioadminGeoApp"));
const HospitaladminGeoApp = lazy(() => import("./pages/HospitaladminGeoApp"));

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
                  <RoleProtectedRoute allowedRoles={["superadmin"]}>
                    <>
                      <SuperadminGeoApp />
                      <ActivityLog />
                    </>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/estadoadmin-geoapp"
                element={
                  <RoleProtectedRoute allowedRoles={["estadoadmin"]}>
                    <EstadoadminGeoApp />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/municipioadmin-geoapp"
                element={
                  <RoleProtectedRoute allowedRoles={["municipioadmin"]}>
                    <MunicipioadminGeoApp />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/hospitaladmin-geoapp"
                element={
                  <RoleProtectedRoute allowedRoles={["hospitaladmin"]}>
                    <HospitaladminGeoApp />
                  </RoleProtectedRoute>
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
