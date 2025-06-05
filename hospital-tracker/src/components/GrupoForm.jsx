import { useEffect, useState } from "react";
import { useLocation } from "../context/LocationContext";

export default function GrupoForm() {
  const { currentLocation } = useLocation();
  const [form, setForm] = useState({
    estado: "",
    municipio: "",
    hospital: "",
    id_estado: null,
    id_municipio: null,
    id_hospital: null,
  });

  // Actualizar formulario cuando cambie la ubicación
  useEffect(() => {
    if (currentLocation) {
      setForm((prev) => ({
        ...prev,
        estado: currentLocation.nombre_estado || "",
        municipio: currentLocation.nombre_municipio || "",
        hospital: currentLocation.nombre_hospital || "",
        id_estado: currentLocation.id_estado,
        id_municipio: currentLocation.id_municipio,
        id_hospital: currentLocation.id_hospital,
      }));
    }
  }, [currentLocation]);

  return <form>{/* ...campos del formulario... */}</form>;
}
