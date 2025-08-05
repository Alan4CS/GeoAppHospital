import { useState, useEffect } from "react";
import {
  FileDown,
  FileUp,
  Table,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import sendCredentialsEmail from "../../helpers/emailHelper";
import * as XLSX from "xlsx";

export default function CsvUploader({ onCancelar }) {
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [processedRows, setProcessedRows] = useState({ total: 0, current: 0 });
  const [processingErrors, setProcessingErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  // Verificar si un usuario ya existe en la base de datos
  const checkUserExists = async (username) => {
    try {
      const response = await fetch(
        `https://geoapphospital-b0yr.onrender.com/api/superadmin/check-user-exists?username=${encodeURIComponent(username)}`
      );
      if (!response.ok) {
        throw new Error("Error al verificar el usuario");
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      throw new Error("No se pudo verificar la disponibilidad del usuario");
    }
  };

  // Generar credenciales de usuario únicas (mejorada para importación masiva)
  const generateUniqueCredentials = async (nombres, apPaterno, apMaterno, existingUsers = new Set()) => {
    let user;
    let attempts = 0;
    const maxAttempts = 25; // Aumentado para importación masiva

    // Limpiar y preparar datos
    const nombresClean = nombres.trim().toLowerCase().replace(/\s+/g, "");
    const apPaternoClean = apPaterno.trim().toLowerCase().replace(/\s+/g, "");
    const apMaternoClean = apMaterno.trim().toLowerCase().replace(/\s+/g, "");

    // Diferentes estrategias para generar nombres de usuario
    const generateUserStrategies = [
      // Estrategia 1: Primera letra nombre + apellido paterno
      () => nombresClean.charAt(0) + apPaternoClean,
      
      // Estrategia 2: Primeras 2 letras nombre + apellido paterno
      () => nombresClean.substring(0, 2) + apPaternoClean,
      
      // Estrategia 3: Primera letra nombre + primeras 4 letras apellido paterno
      () => nombresClean.charAt(0) + apPaternoClean.substring(0, 4),
      
      // Estrategia 4: Primeras 3 letras nombre + primera letra apellido paterno
      () => nombresClean.substring(0, 3) + apPaternoClean.charAt(0),
      
      // Estrategia 5: Primera letra nombre + apellido paterno + primera letra apellido materno
      () => nombresClean.charAt(0) + apPaternoClean + apMaternoClean.charAt(0),
      
      // Estrategia 6: Primeras 3 letras nombre + primeras 3 letras apellido paterno
      () => nombresClean.substring(0, 3) + apPaternoClean.substring(0, 3),
      
      // Estrategia 7: Apellido paterno + primera letra nombre
      () => apPaternoClean + nombresClean.charAt(0),
      
      // Estrategia 8: Primeras 4 letras apellido paterno + primeras 2 letras nombre
      () => apPaternoClean.substring(0, 4) + nombresClean.substring(0, 2),
      
      // Estrategia 9: Iniciales + parte del apellido
      () => nombresClean.charAt(0) + apPaternoClean.charAt(0) + apMaternoClean.charAt(0) + apPaternoClean.substring(1, 4),
      
      // Estrategia 10: Nombre completo (si es corto)
      () => nombresClean.length <= 8 ? nombresClean : nombresClean.substring(0, 8),
      
      // Estrategia 11: Apellido completo (si es corto)
      () => apPaternoClean.length <= 8 ? apPaternoClean : apPaternoClean.substring(0, 8),
      
      // Estrategia 12: Combinación con apellido materno
      () => nombresClean.charAt(0) + apPaternoClean.substring(0, 3) + apMaternoClean.substring(0, 2),
    ];

    // Intentar generar un usuario único
    do {
      if (attempts < generateUserStrategies.length) {
        // Usar estrategias sin números primero
        user = generateUserStrategies[attempts]();
      } else {
        // Después usar estrategias con números
        const strategyIndex = attempts % generateUserStrategies.length;
        const baseUser = generateUserStrategies[strategyIndex]();
        
        if (attempts < 20) {
          // Agregar números secuenciales
          const numberSuffix = attempts - generateUserStrategies.length + 1;
          user = baseUser + numberSuffix;
        } else {
          // Agregar números aleatorios de 2-4 dígitos
          const randomNumber = Math.floor(Math.random() * 9999) + 1;
          user = baseUser + randomNumber;
        }
      }
      
      // Asegurar que el usuario no sea muy corto ni muy largo
      if (user.length < 3) {
        user = user + Math.floor(Math.random() * 99) + 1;
      }
      if (user.length > 15) {
        user = user.substring(0, 15);
      }
      
      console.log(`🔄 [${nombres}] Intento ${attempts + 1}: Probando usuario "${user}"`);
      
      // Verificar que no esté en el conjunto local de usuarios ya generados
      if (existingUsers.has(user)) {
        console.log(`❌ [${nombres}] Usuario ya generado en este lote: "${user}"`);
        attempts++;
        continue;
      }
      
      // Verificar en la base de datos
      const exists = await checkUserExists(user);
      if (!exists) {
        console.log(`✅ [${nombres}] Usuario disponible: "${user}"`);
        existingUsers.add(user); // Agregarlo al conjunto local
        break;
      } else {
        console.log(`❌ [${nombres}] Usuario ya existe en BD: "${user}"`);
      }
      
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error(`No se pudo generar un nombre de usuario único para ${nombres} ${apPaterno} después de ${maxAttempts} intentos. Intenta con un nombre diferente.`);
    }

    // Generar contraseña más robusta
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%&*";
    
    // Asegurar que la contraseña tenga al menos un carácter de cada tipo
    let pass = "";
    pass += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
    pass += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Completar los 6 caracteres restantes
    const allChars = upperCase + lowerCase + numbers + symbols;
    for (let i = 4; i < 10; i++) {
      pass += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Mezclar la contraseña
    pass = pass.split('').sort(() => Math.random() - 0.5).join('');

    console.log(`🎉 [${nombres}] Credenciales generadas - Usuario: "${user}", Contraseña: "${pass}"`);
    return { user, pass };
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
    if (!file) return;

    setProcessingErrors([]);
    setCsvData([]);
    setFileName("");
    setProcessedRows({ total: 0, current: 0 });

    if (!file.name.match(/\.(xlsx)$/i)) {
      setProcessingErrors([
        "Por favor, seleccione un archivo Excel (.xlsx) válido",
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      let workbook;
      try {
        workbook = XLSX.read(data, { type: "array" });
      } catch (err) {
        setProcessingErrors(["No se pudo leer el archivo Excel: " + err.message]);
        return;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Configurar opciones para mantener los valores como strings y no procesar fechas
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        defval: "",
        blankrows: false
      });

      console.log("Datos leídos del Excel:", rows); // Para debug

      // Validar encabezados
      const headers = rows[0].map(h => String(h || "").trim());
      const expectedHeaders = [
        "ESTADO",
        "MUNICIPIO",
        "HOSPITAL",
        "GRUPO",
        "Nombre",
        "Apellido Paterno",
        "Apellido Materno",
        "CURP",
        "Telefono",
        "Correo"
      ];

      console.log("Headers encontrados:", headers); // Para debug

      const validHeaders = expectedHeaders.every(
        (header, index) => headers[index]?.toUpperCase() === header.toUpperCase()
      );

      if (!validHeaders) {
        setProcessingErrors([
          "El archivo no tiene los encabezados correctos. Descargue la plantilla para ver el formato requerido."
        ]);
        return;
      }

      // Asegurarse de que todas las filas tengan el mismo número de columnas
      const processedRows = rows.map(row => {
        if (row.length < expectedHeaders.length) {
          return [...row, ...Array(expectedHeaders.length - row.length).fill("")];
        }
        return row;
      });

      console.log("Filas procesadas:", processedRows); // Para debug

      setCsvData(processedRows);
      setFileName(file.name);
      setProcessedRows({ total: processedRows.length - 1, current: 0 });
    };
    reader.readAsArrayBuffer(file);
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
    setIsProcessing(true);
    setIsGeneratingCredentials(true);
    setProcessingErrors([]);
    setProcessedRows({ total: csvData.length - 1, current: 0 });

    const errors = [];
    const data = csvData.slice(1); // Skip headers
    const validatedData = [];
    const existingUsers = new Set(); // Para evitar duplicados en el mismo lote

    // Validar encabezados esperados para plantilla con nombres
    const headers = csvData[0].map((h) => h.trim().toUpperCase());
    const expectedHeaders = [
      "ESTADO",
      "MUNICIPIO",
      "HOSPITAL",
      "GRUPO",
      "NOMBRE",
      "APELLIDO PATERNO",
      "APELLIDO MATERNO",
      "CURP",
      "TELEFONO",
      "CORREO"
    ];
    const validHeaders = expectedHeaders.every(
      (header, idx) => headers[idx] && headers[idx].toUpperCase() === header
    );
    if (!validHeaders) {
      setProcessingErrors([
        "El archivo no tiene los encabezados correctos. Descargue la plantilla para ver el formato requerido."
      ]);
      setIsProcessing(false);
      setIsGeneratingCredentials(false);
      return;
    }

    console.log("🚀 Iniciando generación de credenciales para", data.length, "empleados...");

    // Primera fase: Validación y generación de credenciales únicas
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      setProcessedRows((prev) => ({ ...prev, current: i + 1 }));
      
      // Validar campos obligatorios
      const [estado, municipio, hospital, grupo, nombre, ap_paterno, ap_materno, curp, telefono, correo] = row.map((cell) => cell?.trim?.() || "");
      const rowErrors = [];
      if (!estado) rowErrors.push("ESTADO es requerido");
      if (!municipio) rowErrors.push("MUNICIPIO es requerido");
      if (!hospital) rowErrors.push("HOSPITAL es requerido");
      if (!grupo) rowErrors.push("GRUPO es requerido");
      if (!nombre) rowErrors.push("Nombre es requerido");
      if (!ap_paterno) rowErrors.push("Apellido paterno es requerido");
      if (!ap_materno) rowErrors.push("Apellido materno es requerido");
      if (!curp) rowErrors.push("CURP es requerido");
      else if (!/^[A-Z&Ñ]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(curp.toUpperCase())) rowErrors.push("CURP inválido (formato: AAAA######AAA)");
      if (!telefono) rowErrors.push("Teléfono es requerido");
      else if (!/^\d{10}$/.test(telefono)) rowErrors.push("Teléfono debe tener 10 dígitos");
      if (!correo) rowErrors.push("Correo electrónico es requerido");
      else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo)) rowErrors.push("Correo electrónico inválido");
      
      if (rowErrors.length > 0) {
        errors.push(`Fila ${i + 2}: ${rowErrors.join(", ")}`);
        continue;
      }

      try {
        console.log(`🔐 Generando credenciales para: ${nombre} ${ap_paterno}`);
        
        // Generar credenciales únicas usando la nueva función
        const { user, pass } = await generateUniqueCredentials(nombre, ap_paterno, ap_materno, existingUsers);
        
        console.log("Procesando fila:", {
          estado, municipio, hospital, grupo,
          nombre, ap_paterno, ap_materno, curp,
          telefono, correo, user
        });
        
        validatedData.push({
          estado,
          municipio,
          hospital,
          grupo,
          nombre,
          ap_paterno,
          ap_materno,
          CURP: curp.toUpperCase(),
          correo_electronico: correo,
          telefono,
          user,
          pass,
          role_name: "empleado"
        });
        
      } catch (credentialError) {
        console.error(`❌ Error generando credenciales para ${nombre} ${ap_paterno}:`, credentialError);
        errors.push(`Fila ${i + 2} - ${nombre} ${ap_paterno}: ${credentialError.message}`);
      }
    }

    setIsGeneratingCredentials(false);

    if (errors.length > 0) {
      setProcessingErrors(errors);
      setIsProcessing(false);
      return;
    }

    console.log("✅ Credenciales generadas exitosamente para", validatedData.length, "empleados");
    console.log("🚀 Iniciando creación de empleados en el backend...");

    // Segunda fase: Crear empleados usando endpoint con nombres
    for (let i = 0; i < validatedData.length; i++) {
      const empleadoData = validatedData[i];
      setProcessedRows((prev) => ({ ...prev, current: i + 1 }));
      
      try {
        console.log(`📤 Enviando datos para ${empleadoData.nombre}:`, {
          estado: empleadoData.estado,
          municipio: empleadoData.municipio,
          hospital: empleadoData.hospital,
          grupo: empleadoData.grupo,
          nombre: empleadoData.nombre,
          CURP: empleadoData.CURP,
          user: empleadoData.user,
          role_name: empleadoData.role_name
        });

        const response = await fetch(
          "https://geoapphospital-b0yr.onrender.com/api/employees/create-empleado-nombres",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(empleadoData)
          }
        );
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error(`❌ Error del backend para ${empleadoData.nombre}:`, responseData);
          throw new Error(responseData.error || `Error al crear empleado: ${response.statusText}`);
        } else {
          console.log(`✅ Empleado ${empleadoData.nombre} creado exitosamente:`, responseData);
        }

        // Enviar email de credenciales solo si el empleado se creó correctamente
        try {
          await sendCredentialsEmail(empleadoData);
          console.log(`📧 Email enviado a ${empleadoData.nombre}`);
        } catch (emailError) {
          console.error(`📧❌ Error al enviar email a ${empleadoData.nombre}:`, emailError);
          errors.push(`Error al enviar email a ${empleadoData.nombre}: ${emailError.message}`);
        }
      } catch (error) {
        console.error(`❌ Error procesando ${empleadoData.nombre}:`, error);
        errors.push(`Fila ${i + 2} - ${empleadoData.nombre} ${empleadoData.ap_paterno}: ${error.message}`);
      }
    }

    setIsProcessing(false);
    if (errors.length > 0) {
      setProcessingErrors(errors);
    } else {
      setCsvData([]);
      setFileName("");
      setProcessedRows({ total: 0, current: 0 });
      setNotificacion({
        tipo: "exito",
        titulo: "¡Proceso completado!",
        mensaje: `Todos los ${validatedData.length} empleados fueron procesados exitosamente con usuarios únicos. Puedes cargar más empleados o cerrar el formulario.`,
        duracion: 8000
      });
    }
  };  // Descargar glosario de hospitales en Excel
  const descargarGlosarioHospitales = async () => {
    try {
      const res = await fetch("https://geoapphospital-b0yr.onrender.com/api/groups/get-groups");
      if (!res.ok) throw new Error("Error al obtener los datos");
      const data = await res.json();

            // Usar los nombres de campo correctos según la API y ordenar por estado y municipio
          const rows = data.map(item => ({
        ESTADO: item.nombre_estado,
        MUNICIPIO: item.nombre_municipio,
        HOSPITAL: item.nombre_hospital,
        GRUPO: item.nombre_grupo
      })).sort((a, b) => {
        const keys = ["ESTADO", "MUNICIPIO", "HOSPITAL", "GRUPO"];
        for (const key of keys) {
          const valA = a[key]?.toLowerCase?.() || "";
          const valB = b[key]?.toLowerCase?.() || "";
          if (valA < valB) return -1;
          if (valA > valB) return 1;
        }
        return 0;
      });

      // Calcular el ancho óptimo de cada columna
      const headers = ["ESTADO", "MUNICIPIO", "HOSPITAL", "GRUPO"];
      const allRows = [headers, ...rows.map(row => headers.map(h => row[h]))];
      const colWidths = headers.map((header, i) => {
        return {
          wch: Math.max(
            ...allRows.map(row => (row[i] ? row[i].toString().length : 0)),
            header.length
          ) + 2 // un poco de espacio extra
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Glosario");
      XLSX.writeFile(wb, "glosario_hospitales.xlsx");
    } catch (error) {
      setNotificacion({
        tipo: "error",
        titulo: "Error",
        mensaje: "No se pudo descargar el glosario de hospitales.",
        duracion: 3000
      });
    }
  };

  // Descargar plantilla de empleados en Excel
  const descargarPlantillaEmpleados = async () => {
    try {
      const rows = [
        {
          ESTADO: "Ejemplo Estado",
          MUNICIPIO: "Ejemplo Municipio",
          HOSPITAL: "Ejemplo Hospital",
          GRUPO: "Ejemplo Grupo",
          Nombre: "Nombre Ejemplo",
          "Apellido Paterno": "Apellido Paterno Ejemplo",
          "Apellido Materno": "Apellido Materno Ejemplo",
          CURP: "PELJ800101HDFXXX01",
          Telefono: "Telefono Ejemplo",
          Correo: "Correo Ejemplo"
        }
      ];
      const headers = [
        "ESTADO",
        "MUNICIPIO",
        "HOSPITAL",
        "GRUPO",
        "Nombre",
        "Apellido Paterno",
        "Apellido Materno",
        "CURP",
        "Telefono",
        "Correo"
      ];
      // Calcular el ancho óptimo de cada columna
      const allRows = [headers, ...rows.map(row => headers.map(h => row[h]))];
      const colWidths = headers.map((header, i) => {
        return {
          wch: Math.max(
            ...allRows.map(row => (row[i] ? row[i].toString().length : 0)),
            header.length
          ) + 2 // un poco de espacio extra
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PlantillaEmpleados");
      XLSX.writeFile(wb, "plantilla_empleados.xlsx");
    } catch (error) {
      setNotificacion({
        tipo: "error",
        titulo: "Error al descargar plantilla",
        mensaje: error.message || "No se pudo generar la plantilla",
        duracion: 5000,
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
              Importa múltiples empleados usando un archivo CSV.
            </p>
            {/* Instrucciones siempre visibles */}
            <div className="mt-3 space-y-2">
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <p className="font-medium text-blue-800 mb-1">
                  Instrucciones importantes:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Descarga la <b>plantilla de empleados</b> y el <b>glosario de hospitales</b> usando los botones de abajo.</li>
                  <li>Abre la plantilla de empleados con Excel o Google Sheets.</li>
                  <li>Utiliza el glosario para copiar correctamente los valores de ESTADO, MUNICIPIO, HOSPITAL y GRUPO en la plantilla.</li>
                  <li>Llena la plantilla solo con las columnas: ESTADO, MUNICIPIO, HOSPITAL y GRUPO.</li>
                  <li>Guarda el archivo como Excel (.xlsx).</li>
                  <li>Sube el archivo usando el formulario de abajo.</li>
                </ol>
              </div>
              {/* Botones de descarga debajo de las instrucciones */}
              <div className="flex flex-col md:flex-row gap-2 justify-start">
                <button
                  type="button"
                  onClick={descargarPlantillaEmpleados}
                  className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors w-fit bg-white"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Descargar plantilla de empleados
                </button>
                <button
                  type="button"
                  onClick={descargarGlosarioHospitales}
                  className="flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors w-fit bg-white"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Descargar glosario de hospitales
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
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
                accept=".xlsx"
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
                    {isGeneratingCredentials 
                      ? "🔐 Generando usuarios únicos..." 
                      : "👥 Creando empleados en el sistema..."}
                  </span>
                  <span className="text-sm text-blue-600">
                    {processedRows.current} de {processedRows.total}
                  </span>
                </div>
                
                {isGeneratingCredentials && (
                  <div className="text-xs text-blue-700 mb-2">
                    Verificando que cada usuario sea único en la base de datos...
                  </div>
                )}
                
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
                
                <div className="text-xs text-blue-600 mt-2">
                  {isGeneratingCredentials 
                    ? "Este proceso puede tomar unos minutos para asegurar usuarios únicos..." 
                    : "Enviando datos al servidor y configurando credenciales..."}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancelar}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Procesar {csvData.length - 1} Empleados con Usuarios Únicos
                </button>
              )}
              {isProcessing && (
                <button
                  type="button"
                  disabled
                  className="flex items-center px-4 py-2 bg-blue-400 text-white rounded-md shadow-sm text-sm font-medium cursor-not-allowed"
                >
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isGeneratingCredentials 
                    ? "Generando usuarios únicos..." 
                    : "Creando empleados..."}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
