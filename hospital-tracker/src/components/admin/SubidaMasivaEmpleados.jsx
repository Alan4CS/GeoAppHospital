import { useState, useEffect } from "react";
import {
  FileDown,
  FileUp,
  Table,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Building2,
  Hospital,
  Info,
} from "lucide-react";
import { useLocation } from "../../context/LocationContext";

export default function CsvUploader({ onCancelar }) {
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [processedRows, setProcessedRows] = useState({ total: 0, current: 0 });
  const [processingErrors, setProcessingErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const { currentLocation, locationVersion } = useLocation();

  // Obtener la ubicación del administrador al cargar el componente
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setIsLoadingLocation(true);

        if (currentLocation) {
          console.log("📍 Actualizando con nueva ubicación:", currentLocation);
          setLocationData(currentLocation);
          if (currentLocation.id_hospital) {
            await fetchGrupos(currentLocation.id_hospital);
          }
        } else {
          // Fallback a obtención manual solo si no hay contexto
          const userId = localStorage.getItem("userId");
          if (!userId) return;

          const response = await fetch(
            `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital-ubi/${userId}`
          );

          if (!response.ok) throw new Error("Error al obtener ubicación");

          const data = await response.json();
          if (data?.[0]) {
            setLocationData(data[0]);
            if (data[0].id_hospital) {
              await fetchGrupos(data[0].id_hospital);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener ubicación:", error);
        setProcessingErrors([
          "Error al obtener la ubicación: " + error.message,
        ]);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocationData();
  }, [currentLocation, locationVersion]); // Agregamos locationVersion como dependencia

  // Obtener grupos al cambiar la ubicación
  useEffect(() => {
    if (locationData?.id_hospital) {
      fetchGrupos(locationData.id_hospital);
    } else {
      setGrupos([]);
      setSelectedGrupo("");
    }
  }, [locationData]);

  // Función para obtener grupos por hospital
  const fetchGrupos = async (hospitalId) => {
    try {
      const res = await fetch(
        `https://geoapphospital.onrender.com/api/employees/grupos-by-hospital?id_hospital=${hospitalId}`
      );
      if (!res.ok) throw new Error("Error al obtener grupos");
      const data = await res.json();
      setGrupos(data);
      setSelectedGrupo(""); // Reset the selected group
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      setGrupos([]);
    }
  };

  // Validación de campos del CSV
  const validateCsvRow = (row) => {
    const errors = [];
    const [nombre, ap_paterno, ap_materno, curp, telefono, correo] = row;

    if (!nombre?.trim()) errors.push("Nombre es requerido");
    if (!ap_paterno?.trim()) errors.push("Apellido paterno es requerido");
    if (!ap_materno?.trim()) errors.push("Apellido materno es requerido");

    // Validación de CURP
    if (!curp?.trim()) {
      errors.push("CURP es requerido");
    } else if (
      !/^[A-Z&Ñ]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(curp.trim())
    ) {
      errors.push("CURP inválido (formato: AAAA######AAA)");
    }

    // Validación de teléfono
    if (!telefono?.trim()) {
      errors.push("Teléfono es requerido");
    } else if (!/^\d{10}$/.test(telefono.trim())) {
      errors.push("Teléfono debe tener 10 dígitos");
    }

    // Validación de correo
    if (!correo?.trim()) {
      errors.push("Correo electrónico es requerido");
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo.trim())
    ) {
      errors.push("Correo electrónico inválido");
    }

    return errors;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    // Si no hay archivo seleccionado (usuario canceló), simplemente retornar
    if (!file) return;

    // Limpiar estado previo
    setProcessingErrors([]);
    setCsvData([]);
    setFileName("");
    setProcessedRows({ total: 0, current: 0 });

    if (!file.name.match(/\.(csv|xls|xlsx)$/i)) {
      setProcessingErrors([
        "Por favor, seleccione un archivo CSV o Excel válido",
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      let rows;

      // Si es un archivo Excel (detectamos por el inicio del contenido)
      if (text.startsWith("<?xml") || text.includes("spreadsheet")) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        rows = Array.from(xmlDoc.getElementsByTagName("Row")).map((row) =>
          Array.from(row.getElementsByTagName("Data")).map((cell) =>
            cell.textContent.trim()
          )
        );
      } else {
        // Procesar como CSV
        rows = text
          .split("\n")
          .map((row) => row.trim())
          .filter(Boolean)
          .map((row) =>
            row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
          );
      }

      // Validar encabezados
      const headers = rows[0];
      const expectedHeaders = [
        "Nombre",
        "Apellido Paterno",
        "Apellido Materno",
        "CURP",
        "Telefono",
        "Correo",
      ];
      const validHeaders = expectedHeaders.every(
        (header, index) =>
          headers[index]?.toLowerCase() === header.toLowerCase()
      );

      if (!validHeaders) {
        alert(
          "El archivo no tiene los encabezados correctos. Descargue la plantilla para ver el formato requerido."
        );
        return;
      }

      setCsvData(rows);
      setFileName(file.name);
      setProcessingErrors([]);
      setProcessedRows({ total: rows.length - 1, current: 0 }); // -1 para excluir encabezados
    };
    reader.readAsText(file);
  };
  const downloadTemplate = () => {
    const headers =
      "Nombre,Apellido Paterno,Apellido Materno,CURP,Telefono,Correo\n";
    const example =
      "Juan,Perez,Lopez,PELJ800101HDFXXX01,0123456789,ejemplo@correo.com\n";
    const content = headers + example;

    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_empleados.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const generateCredentials = (nombre, ap_paterno) => {
    // Usuario: primera letra del nombre + apellido paterno
    const user =
      nombre.trim().charAt(0).toLowerCase() +
      ap_paterno.trim().toLowerCase().replace(/\s+/g, "");

    // Contraseña aleatoria de 10 caracteres
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return { user, pass };
  };

  const processEmployees = async () => {
    if (csvData.length <= 1) return;
    if (!selectedGrupo) {
      setProcessingErrors([
        "Por favor selecciona un grupo antes de procesar los empleados",
      ]);
      return;
    }

    setIsProcessing(true);
    setProcessingErrors([]);
    setProcessedRows({ total: csvData.length - 1, current: 0 });

    // Obtener ubicación del administrador actual
    const userId = localStorage.getItem("userId");
    let locationData;

    try {
      const locationRes = await fetch(
        `https://geoapphospital.onrender.com/api/superadmin/superadmin-hospital-ubi/${userId}`
      );

      if (!locationRes.ok) throw new Error("Error al obtener ubicación");

      locationData = await locationRes.json();
      if (!locationData?.[0]) {
        throw new Error(
          "No se encontró información de ubicación del administrador"
        );
      }

      const location = locationData[0];
      // Validar que existan todos los ID de ubicación necesarios
      if (
        !location.id_estado ||
        !location.id_municipio ||
        !location.id_hospital
      ) {
        throw new Error(
          "Faltan datos de ubicación (estado, municipio, hospital) del administrador"
        );
      }
    } catch (error) {
      setIsProcessing(false);
      setProcessingErrors([
        "Error al obtener la ubicación del administrador: " + error.message,
      ]);
      return;
    }

    const errors = [];
    const data = csvData.slice(1); // Skip headers
    const validatedData = [];

    // Primera fase: Validación de todos los registros
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      setProcessedRows((prev) => ({ ...prev, current: i + 1 }));

      // Validar el registro actual
      const rowErrors = validateCsvRow(row);
      if (rowErrors.length > 0) {
        errors.push(`Fila ${i + 2}: ${rowErrors.join(", ")}`);
        continue;
      }

      // Si el registro es válido, preparar los datos
      const [nombre, ap_paterno, ap_materno, curp, telefono, correo] = row.map(
        (cell) => cell.trim()
      );
      const { user, pass } = generateCredentials(nombre, ap_paterno);

      validatedData.push({
        nombre,
        ap_paterno,
        ap_materno,
        CURP: curp.toUpperCase(),
        correo_electronico: correo,
        telefono: parseInt(telefono),
        user,
        pass,
        role_name: "empleado",
        id_estado: locationData[0].id_estado,
        id_municipio: locationData[0].id_municipio,
        id_hospital: locationData[0].id_hospital,
        id_grupo: parseInt(selectedGrupo),
      });
    }

    // Si hay errores de validación, mostrarlos y detener el proceso
    if (errors.length > 0) {
      setProcessingErrors(errors);
      setIsProcessing(false);
      return;
    }

    // Segunda fase: Crear empleados (solo si no hubo errores de validación)
    for (let i = 0; i < validatedData.length; i++) {
      const empleadoData = validatedData[i];
      setProcessedRows((prev) => ({ ...prev, current: i + 1 }));

      try {
        const response = await fetch(
          "https://geoapphospital.onrender.com/api/employees/create-empleado",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(empleadoData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Error al crear empleado: ${response.statusText}`
          );
        }
      } catch (error) {
        errors.push(
          `Fila ${i + 2} - ${empleadoData.nombre} ${empleadoData.ap_paterno}: ${
            error.message
          }`
        );
      }
    }
    setIsProcessing(false);
    if (errors.length > 0) {
      setProcessingErrors(errors);
    } else {
      // Limpiar el formulario para una nueva carga
      setCsvData([]);
      setFileName("");
      setProcessedRows({ total: 0, current: 0 });

      setNotificacion({
        tipo: "exito",
        titulo: "¡Proceso completado!",
        mensaje:
          "Todos los empleados fueron procesados exitosamente. Puedes cargar más empleados o cerrar el formulario.",
        duracion: 8000,
      });
    }
  };

  // Componente de notificación toast
  const NotificacionToast = ({ notificacion, onCerrar }) => {
    const [progreso, setProgreso] = useState(100);

    useEffect(() => {
      if (!notificacion) return;

      const intervalo = setInterval(() => {
        setProgreso((prev) => {
          const nuevo = prev - 100 / (notificacion.duracion / 100);
          if (nuevo <= 0) {
            clearInterval(intervalo);
            return 0;
          }
          return nuevo;
        });
      }, 100);

      return () => clearInterval(intervalo);
    }, [notificacion]);

    if (!notificacion) return null;

    const esExito = notificacion.tipo === "exito";

    return (
      <div className="fixed top-4 right-4 z-[9999] max-w-md w-full">
        <div
          className={`rounded-lg shadow-lg border-l-4 p-4 ${
            esExito
              ? "bg-white border-green-500 text-green-800"
              : "bg-white border-red-500 text-red-800"
          } transform transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {esExito ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3
                className={`text-sm font-medium ${
                  esExito ? "text-green-800" : "text-red-800"
                }`}
              >
                {notificacion.titulo}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  esExito ? "text-green-700" : "text-red-700"
                }`}
              >
                {notificacion.mensaje}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={onCerrar}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  esExito
                    ? "text-green-500 hover:bg-green-100 focus:ring-green-600"
                    : "text-red-500 hover:bg-red-100 focus:ring-red-600"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Barra de progreso */}
          <div
            className={`mt-2 w-full bg-gray-200 rounded-full h-1 ${
              esExito ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-100 ease-linear ${
                esExito ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Notificación Toast */}
      <NotificacionToast
        notificacion={notificacion}
        onCerrar={() => setNotificacion(null)}
      />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FileUp className="h-5 w-5 mr-2 text-blue-600" />
            Subir Archivo CSV para Agregar Múltiples Empleados
          </h2>
          <div className="text-gray-500 mt-1">
            <p>
              Importa múltiples empleados usando un archivo CSV.{" "}
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                {showInstructions
                  ? "Ocultar instrucciones"
                  : "Ver instrucciones"}
              </button>
            </p>

            {showInstructions && (
              <div className="mt-3 space-y-2">
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 mb-1">
                    Instrucciones importantes:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Descarga la plantilla CSV</li>
                    <li>
                      Abre el archivo con un editor de texto (como Notepad) o
                      Excel
                    </li>
                    <li>
                      Si usas Excel:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>
                          Al abrir el archivo, selecciona "No convertir" cuando
                          Excel muestre la advertencia
                        </li>
                        <li>
                          O formatea manualmente la columna de teléfono como
                          texto antes de ingresar datos
                        </li>
                      </ul>
                    </li>
                    <li>Ingresa los datos siguiendo el formato del ejemplo</li>
                    <li>Guarda el archivo manteniendo el formato CSV</li>
                  </ol>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors w-fit"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Descargar Plantilla CSV
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Información de ubicación */}
          <div className="md:col-span-2 mb-6">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-4 pb-2 border-b">
              <Building2 className="h-4 w-4 mr-2 text-blue-600" />
              Ubicación e Institución
            </h3>
            {isLoadingLocation ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : locationData ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <p className="font-medium">{locationData.nombre_estado}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Municipio</p>
                    <p className="font-medium">
                      {locationData.nombre_municipio}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Hospital className="h-4 w-4 mr-2 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Hospital</p>
                    <p className="font-medium">
                      {locationData.nombre_hospital}
                    </p>
                  </div>
                </div>
                <div className="flex items-start pt-2">
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Grupo asignado
                    </label>
                    <select
                      value={selectedGrupo}
                      onChange={(e) => setSelectedGrupo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecciona un grupo</option>
                      {grupos.map((grupo) => (
                        <option key={grupo.id_group} value={grupo.id_group}>
                          {grupo.nombre_grupo}
                        </option>
                      ))}
                    </select>
                    {grupos.length === 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        No hay grupos disponibles en el hospital
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                No se pudo obtener la información de ubicación
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-4">
            {/* Botón de descarga de plantilla */}

            {/* Input de archivo */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="h-4 w-4 mr-1 inline text-blue-600" />
                Selecciona un archivo CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
              {fileName && (
                <p className="mt-2 text-sm text-gray-600 flex items-center">
                  <FileUp className="h-4 w-4 mr-1 text-gray-400" />
                  {fileName}
                </p>
              )}
            </div>

            {/* Mensajes de error de procesamiento */}
            {processingErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Se encontraron errores en el archivo
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {processingErrors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Vista previa del CSV */}
            {csvData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
                  <Table className="h-4 w-4 mr-2 text-blue-600" />
                  Vista previa del archivo
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100 text-gray-700 font-semibold">
                      <tr>
                        {csvData[0].map((col, index) => (
                          <th key={index} className="px-4 py-2 text-left">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {csvData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-2 whitespace-nowrap"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Progreso del procesamiento */}
            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    Procesando empleados...
                  </span>
                  <span className="text-sm text-blue-600">
                    {processedRows.current} de {processedRows.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (processedRows.current / processedRows.total) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancelar}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              {csvData.length > 1 && !isProcessing && (
                <button
                  type="button"
                  onClick={processEmployees}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Procesar {csvData.length - 1} Empleados
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
