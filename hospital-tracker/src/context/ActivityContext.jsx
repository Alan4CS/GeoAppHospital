import { createContext, useContext, useState, useCallback } from "react";

const ActivityContext = createContext();

export function ActivityProvider({ children }) {
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Función para agregar una nueva actividad
  const addActivity = useCallback((activity) => {
    const newActivity = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...activity,
    };

    setActivities((prev) => [newActivity, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Función para marcar todas las actividades como leídas
  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <ActivityContext.Provider
      value={{ activities, unreadCount, addActivity, markAllAsRead }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity debe usarse dentro de un ActivityProvider");
  }
  return context;
};
