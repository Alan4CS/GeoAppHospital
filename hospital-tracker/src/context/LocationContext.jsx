import { createContext, useContext, useState } from "react";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationVersion, setLocationVersion] = useState(0);

  const updateLocation = async (userId) => {
    try {
      const res = await fetch(
        `https://geoapphospital-b0yr.onrender.com/api/superadmin/superadmin-hospital-ubi/${userId}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setCurrentLocation(data[0]);
        setLocationVersion((prev) => prev + 1); // Incrementar versión para forzar actualizaciones
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        updateLocation,
        locationVersion,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
