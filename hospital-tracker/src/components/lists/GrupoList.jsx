"use client";

import { useState, useEffect } from "react";
import {
  UsersRound,
  X,
  Save,
  Building2,
  FileText,
  MapPin,
  Trash2,
  Edit3,
} from "lucide-react";

const GrupoList = ({ grupos, onGuardar, hospitales = [] }) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [grupoEliminar, setGrupoEliminar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEliminar, setLoadingEliminar] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(5);
  const [timerActivo, setTimerActivo] = useState(false);
  const [formData, setFormData] = useState({
    nombre_grupo: "",
    descripcion_grupo: "",
  });

  const handleEditar = (grupo) => {
    console.log("Grupo seleccionado para editar:", grupo); // Debug
    setGrupoEditando(grupo);
    setFormData({
      nombre_grupo: grupo.nombre_grupo || "",
      descripcion_grupo: grupo.descripcion_group || "",
    });
    setMostrarModal(true);
  };

  const handleEliminar = (grupo) => {
    setGrupoEliminar(grupo);
    setMostrarModalEliminar(true);
    setTiempoRestante(5);
    setTimerActivo(true);
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setGrupoEditando(null);
    setFormData({
      nombre_grupo: "",
      descripcion_grupo: "",
    });
  };

  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setGrupoEliminar(null);
    setTimerActivo(false);
    setTiempoRestante(5);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar el id_hospital basado en el nombre del hospital
      let id_hospital = null;

      if (hospitales && hospitales.length > 0) {
        const hospitalEncontrado = hospitales.find(
          (h) =>
            h.nombre_hospital === grupoEditando.nombre_hospital ||
            h.nombre === grupoEditando.nombre_hospital
        );
        id_hospital = hospitalEncontrado?.id_hospital;
        console.log("Hospital encontrado:", hospitalEncontrado);
      }

      // Si no encontramos el hospital en la lista, hacer una consulta adicional
      if (!id_hospital) {
        try {
          const hospitalResponse = await fetch(
            "http://localhost:4000/api/superadmin/hospitals"
          );
          const hospitalData = await hospitalResponse.json();
          const hospitalEncontrado = hospitalData.find(
            (h) => h.nombre_hospital === grupoEditando.nombre_hospital
          );
          id_hospital = hospitalEncontrado?.id_hospital;
          console.log(
            "Hospital encontrado en consulta adicional:",
            hospitalEncontrado
          );
        } catch (error) {
          console.error("Error al buscar hospital:", error);
        }
      }

      if (!id_hospital) {
        throw new Error("No se pudo encontrar el ID del hospital");
      }

      const body = {
        id_group: grupoEditando.id,
        nombre_grupo: formData.nombre_grupo,
        id_hospital: id_hospital,
        descripcion_grupo: formData.descripcion_grupo,
      };

      console.log("Enviando datos:", body);

      const response = await fetch(
        `http://localhost:4000/api/groups/update-groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      alert("✅ Grupo actualizado con éxito");
      handleCerrarModal();

      if (onGuardar) {
        onGuardar();
      }
    } catch (error) {
      console.error("Error al actualizar grupo:", error);
      alert(`❌ Error al actualizar el grupo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    setLoadingEliminar(true);

    try {
      const response = await fetch(
        `http://localhost:4000/api/groups/delete-groups/${grupoEliminar.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      alert("✅ Grupo eliminado con éxito");
      handleCerrarModalEliminar();

      if (onGuardar) {
        onGuardar();
      }
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
      alert(`❌ Error al eliminar el grupo: ${error.message}`);
    } finally {
      setLoadingEliminar(false);
    }
  };

  useEffect(() => {
    let intervalo;
    if (timerActivo && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => prev - 1);
      }, 1000);
    } else if (tiempoRestante === 0) {
      setTimerActivo(false);
    }
    return () => clearInterval(intervalo);
  }, [timerActivo, tiempoRestante]);

  return (
    <>
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <UsersRound className="h-5 w-5 mr-2 text-purple-600" />
            Grupos registrados
          </h3>
        </div>

        {grupos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2">Hospital</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Municipio</th>
                  <th className="px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grupos.map((grupo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium max-w-xs truncate">
                      {grupo.nombre_grupo}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">
                      {grupo.descripcion_group}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {grupo.nombre_hospital}
                    </td>
                    <td className="px-4 py-3 text-sm">{grupo.nombre_estado}</td>
                    <td className="px-4 py-3 text-sm">
                      {grupo.nombre_municipio || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditar(grupo)}
                          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center p-1 rounded hover:bg-blue-50"
                          title="Editar grupo"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(grupo)}
                          className="text-red-600 hover:text-red-800 transition-colors flex items-center p-1 rounded hover:bg-red-50"
                          title="Eliminar grupo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No hay grupos registrados todavía.
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-purple-600" />
                Editar Grupo
              </h2>
              <button
                onClick={handleCerrarModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hospital Info (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Hospital Asignado
                </label>
                <p className="text-sm text-gray-600">
                  {grupoEditando?.nombre_hospital} -{" "}
                  {grupoEditando?.nombre_estado}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Nombre del Grupo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Nombre del Grupo *
                  </label>
                  <input
                    type="text"
                    name="nombre_grupo"
                    value={formData.nombre_grupo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Limpieza turno matutino"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Descripción del Grupo *
                  </label>
                  <textarea
                    name="descripcion_grupo"
                    value={formData.descripcion_grupo}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Encargados del área de limpieza en turno matutino"
                    required
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCerrarModal}
                  className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Guardando..." : "Actualizar Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Trash2 className="h-6 w-6 mr-2 text-red-600" />
                Eliminar Grupo
              </h2>
              <button
                onClick={handleCerrarModalEliminar}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar el grupo{" "}
                <span className="font-semibold text-gray-800">
                  "{grupoEliminar?.nombre_grupo}"
                </span>
                ?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Advertencia:</strong> Esta acción eliminará el
                  grupo y actualizará todos los usuarios asociados. Esta acción
                  no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCerrarModalEliminar}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEliminar}
                disabled={loadingEliminar || tiempoRestante > 0}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loadingEliminar
                  ? "Eliminando..."
                  : tiempoRestante > 0
                  ? `Espere ${tiempoRestante}s...`
                  : "Eliminar Grupo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GrupoList;
