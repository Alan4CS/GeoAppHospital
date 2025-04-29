import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SuperadminGeoApp from "./pages/SuperadminGeoApp";
import Dashboard from "./pages/Dashboard";
import EstadoadminGeoApp from "./pages/EstadoadminGeoApp"; // Importa el componente

function App() {
  return (
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
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
