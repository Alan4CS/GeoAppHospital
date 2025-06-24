import html2pdf from 'html2pdf.js'
import { format, eachDayOfInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"

// Funciones auxiliares al principio del archivo
function parseTimeToHour(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours + minutes / 60
}

function calculateHoursDifference(startTime, endTime) {
  const start = parseTimeToHour(startTime)
  const end = parseTimeToHour(endTime)
  return end - start
}

function generateRealisticEvents(dia, empleado) {
  const dayOfWeek = dia.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) return []

  return [
    {
      hora: "07:00",
      tipo: "entrada",
      descripcion: "Marcó entrada (En geocerca)",
      ubicacion: "dentro",
    },
    {
      hora: "10:38",
      tipo: "salida",
      descripcion: "Se salió de la geocerca",
      ubicacion: "fuera",
    },
    {
      hora: "11:00",
      tipo: "entrada",
      descripcion: "Entró a la geocerca",
      ubicacion: "dentro",
    },
    {
      hora: "16:00",
      tipo: "salida",
      descripcion: "Marcó salida",
      ubicacion: "fuera",
    },
  ]
}

function generateWorkPeriods(eventos) {
  const periodos = []

  periodos.push({
    inicio: "07:00",
    fin: "10:38",
    estado: "dentro",
    descripcion: "Trabajando dentro de la geocerca (3h 38min)",
  })

  periodos.push({
    inicio: "10:38",
    fin: "11:00",
    estado: "fuera",
    descripcion: "Fuera de la geocerca - Descanso (22min)",
  })

  periodos.push({
    inicio: "11:00",
    fin: "16:00",
    estado: "dentro",
    descripcion: "Trabajando dentro de la geocerca (5h)",
  })

  return periodos
}

function createActivitiesHTML(eventos, periodos) {
  const timeline = []

  // Agregar eventos
  eventos.forEach((evento) => {
    timeline.push({
      hora: evento.hora,
      tipo: "evento",
      descripcion: evento.descripcion,
      estado: evento.tipo,
      ubicacion: evento.ubicacion,
      orden: parseTimeToHour(evento.hora),
    })
  })

  // Agregar períodos
  periodos.forEach((periodo) => {
    timeline.push({
      hora: periodo.inicio + " - " + periodo.fin,
      tipo: "periodo",
      descripcion: periodo.descripcion,
      estado: periodo.estado,
      orden: parseTimeToHour(periodo.inicio),
    })
  })

  // Ordenar cronológicamente
  timeline.sort((a, b) => a.orden - b.orden)

  return timeline.map(item => {
    let iconHTML = ''
    
    if (item.tipo === "evento") {
      // Primero verificar las descripciones específicas
      if (item.descripcion.includes("Marcó entrada")) {
        // 1. MARCAR ENTRADA - Reloj con play (inicio de jornada)
        iconHTML = `
          <div class="activity-icon marcar-entrada">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10,8 16,12 10,16" fill="white"/>
            </svg>
          </div>
        `
      } else if (item.descripcion.includes("Marcó salida")) {
        // 2. MARCAR SALIDA - Cuadrado con stop (fin de jornada)
        iconHTML = `
          <div class="activity-icon marcar-salida">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <rect x="8" y="8" width="8" height="8" fill="white"/>
            </svg>
          </div>
        `
      } else if (item.descripcion.includes("Se salió de la geocerca")) {
        // 3. SALIÓ DE LA GEOCERCA - Puerta con flecha saliendo
        iconHTML = `
          <div class="activity-icon salio-geocerca">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/>
              <path d="M3 12l3-3m0 6l-3-3m0 0h12"/>
            </svg>
          </div>
        `
      } else if (item.descripcion.includes("Entró a la geocerca")) {
        // 4. ENTRÓ A LA GEOCERCA - Puerta con flecha entrando
        iconHTML = `
          <div class="activity-icon entro-geocerca">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/>
              <path d="M21 12l-3-3m0 6l3-3m0 0H9"/>
            </svg>
          </div>
        `
      }
    } else {
      if (item.estado === "dentro") {
        // 5. PERÍODO DENTRO - Casa sólida (zona segura)
        iconHTML = `
          <div class="activity-icon periodo-dentro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        `
      } else {
        // 6. PERÍODO FUERA - Signo de exclamación en triángulo
        iconHTML = `
          <div class="activity-icon periodo-fuera">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm0 6l-1 7h2l-1-7zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
          </div>
        `
      }
    }

    const textClass = item.tipo === "evento" ? "evento" : ""
    const prefix = item.tipo === "evento" ? "EVENTO" : "PERÍODO"

    return `
      <div class="activity-item">
        ${iconHTML}
        <div class="activity-content">
          <div class="activity-text ${textClass}">
            <span class="activity-prefix">${prefix}:</span>
            <span class="activity-time">${item.hora}</span>
            <span class="activity-desc">- ${item.descripcion}</span>
          </div>
        </div>
      </div>
    `
  }).join('')
}

function createTimelineHTML(eventos, periodos) {
  const startHour = 7
  const endHour = 17
  const totalHours = endHour - startHour

  let segmentsHTML = ''
  let eventsHTML = ''

  // Crear segmentos de períodos
  periodos.forEach(periodo => {
    const startTime = parseTimeToHour(periodo.inicio)
    const endTime = parseTimeToHour(periodo.fin)
    
    if (startTime >= startHour && endTime <= endHour) {
      const leftPercent = ((startTime - startHour) / totalHours) * 100
      const widthPercent = ((endTime - startTime) / totalHours) * 100
      
      segmentsHTML += `
        <div class="timeline-segment ${periodo.estado}" 
             style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
      `
    }
  })

  // Crear marcadores de eventos
  eventos.forEach(evento => {
    const eventHour = parseTimeToHour(evento.hora)
    if (eventHour >= startHour && eventHour <= endHour) {
      const leftPercent = ((eventHour - startHour) / totalHours) * 100
      eventsHTML += `
        <div class="timeline-event" style="left: ${leftPercent}%;"></div>
      `
    }
  })

  // Crear etiquetas de horas
  let labelsHTML = ''
  for (let hour = startHour; hour <= endHour; hour += 2) {
    labelsHTML += `<span>${hour}:00</span>`
  }

  return `
    <div class="timeline">
      <div class="timeline-line"></div>
      ${segmentsHTML}
      ${eventsHTML}
      <div class="timeline-labels">${labelsHTML}</div>
    </div>
  `
}

function createMetricsHTML(periodos) {
  const horasDentro = periodos
    .filter((p) => p.estado === "dentro")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0)

  const horasFuera = periodos
    .filter((p) => p.estado === "fuera")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0)

  const rendimiento = ((horasDentro / 9) * 100).toFixed(1)

  return `
    <div class="metrics">
      MÉTRICAS: Dentro: ${horasDentro.toFixed(1)}h | Fuera: ${horasFuera.toFixed(1)}h | 
      Total: ${(horasDentro + horasFuera).toFixed(1)}h | Rendimiento: ${rendimiento}%
    </div>
  `
}

function createDayHTML(dia, eventos, periodos, empleado) {
  const dayName = format(dia, "EEEE", { locale: es })
  const dayDate = format(dia, "dd/MM/yyyy", { locale: es })
  const isWeekend = dia.getDay() === 0 || dia.getDay() === 6

  if (isWeekend) {
    return `
      <div class="day-section">
        <div class="day-header">
          <div class="day-title">${dayName.toUpperCase()} - ${dayDate}</div>
          <div class="day-subtitle">${empleado.name} | Estado: ${empleado.estado || "Activo"}</div>
        </div>
        <div style="padding: 20px; text-align: center; color: #6c757d;">
          <strong>FIN DE SEMANA</strong> - Sin actividad programada
        </div>
      </div>
    `
  }

  const timelineHTML = createTimelineHTML(eventos, periodos)
  const activitiesHTML = createActivitiesHTML(eventos, periodos)
  const metricsHTML = createMetricsHTML(periodos)

  return `
    <div class="day-section">
      <div class="day-header">
        <div class="day-title">${dayName.toUpperCase()} - ${dayDate}</div>
        <div class="day-subtitle">${empleado.name} | Estado: ${empleado.estado || "Activo"} | Hospital: ${empleado.hospital || "N/A"} | Grupo: ${empleado.grupo || "N/A"}</div>
      </div>
      ${timelineHTML}
      <div class="activities-section">
        <div class="activities-header">CRONOLOGÍA DE ACTIVIDADES</div>
        ${activitiesHTML}
      </div>
      ${metricsHTML}
    </div>
  `
}

function createHeaderHTML(empleado, startDate, endDate) {
  return `
    <div class="header">
      <h1>REPORTE DE ASISTENCIA</h1>
      <div class="header-info">
        <div>
          <strong>Empleado:</strong> ${empleado.name}<br>
          <strong>Horario:</strong> ${empleado.schedule}<br>
          <strong>Fecha de reporte:</strong> ${format(new Date(), "dd/MM/yyyy", { locale: es })}
        </div>
        <div>
          <strong>Período:</strong> ${format(parseISO(startDate), "dd/MM/yyyy", { locale: es })} al ${format(parseISO(endDate), "dd/MM/yyyy", { locale: es })}<br>
          <strong>Grupo:</strong> ${empleado.grupo || "N/A"}<br>
          <strong>Hospital:</strong> ${empleado.hospital || "N/A"}
        </div>
      </div>
    </div>
  `
}

function createSummaryHTML(calendarData) {
  const totalHoras = calendarData.reduce((acc, d) => acc + (d.totalHours || 0), 0)
  const diasTrabajados = calendarData.filter((d) => d.status === "completed").length

  return `
    <div class="summary">
      <h2>RESUMEN DEL PERÍODO</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th>CONCEPTO</th>
            <th>CANTIDAD</th>
            <th>OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total de horas trabajadas</td>
            <td>${totalHoras.toFixed(1)} h</td>
            <td>Dentro de geocerca</td>
          </tr>
          <tr>
            <td>Días laborados</td>
            <td>${diasTrabajados}</td>
            <td>Días completos</td>
          </tr>
          <tr>
            <td>Promedio diario</td>
            <td>${(totalHoras / diasTrabajados || 0).toFixed(1)} h</td>
            <td>Horas por día</td>
          </tr>
          <tr>
            <td>Rendimiento general</td>
            <td>${((totalHoras / (diasTrabajados * 9)) * 100 || 0).toFixed(1)}%</td>
            <td>Basado en 9h/día</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
}

function getReportStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #212529;
    }
    
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: #198754;
      color: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    
    .header h1 {
      text-align: center;
      font-size: 18px;
      margin-bottom: 15px;
    }
    
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 11px;
    }
    
    .day-section {
      margin-bottom: 25px;
      border: 1px solid #dee2e6;
      border-radius: 5px;
      overflow: hidden;
    }
    
    .day-header {
      background: #198754;
      color: white;
      padding: 12px 15px;
    }
    
    .day-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .day-subtitle {
      font-size: 10px;
      opacity: 0.9;
    }
    
    .timeline {
      background: #f8f9fa;
      padding: 15px;
      position: relative;
      height: 60px;
      margin: 10px 0;
    }
    
    .timeline-line {
      position: absolute;
      top: 30px;
      left: 50px;
      right: 50px;
      height: 4px;
      background: #6c757d;
      border-radius: 2px;
    }
    
    .timeline-segment {
      position: absolute;
      top: 25px;
      height: 14px;
      border-radius: 2px;
    }
    
    .timeline-segment.dentro {
      background: #28a745;
    }
    
    .timeline-segment.fuera {
      background: #dc3545;
    }
    
    .timeline-event {
      position: absolute;
      top: 20px;
      width: 4px;
      height: 24px;
      background: #0d6efd;
      border-radius: 2px;
    }
    
    .timeline-labels {
      position: absolute;
      bottom: 5px;
      left: 50px;
      right: 50px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #6c757d;
    }
    
    .activities-section {
      padding: 15px;
    }
    
    .activities-header {
      background: #6c757d;
      color: white;
      padding: 8px 15px;
      font-size: 11px;
      font-weight: bold;
      margin: -15px -15px 15px -15px;
    }
    
    /* AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL - ALINEACIÓN PERFECTA */
    .activity-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      font-size: 10px;
      min-height: 24px;
    }
    
    .activity-icon {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0;
    }
    
    .activity-content {
      flex: 1;
      display: flex;
      align-items: flex-start;
      min-height: 24px;
    }
    
    .activity-text {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      line-height: 1.4;
      padding-top: 2px;
    }
    
    .activity-prefix {
      font-weight: bold;
      margin-right: 4px;
    }
    
    .activity-time {
      font-weight: bold;
      margin-right: 4px;
    }
    
    .activity-desc {
      font-weight: normal;
    }
    
    /* ICONOS ÚNICOS PARA CADA ACCIÓN ESPECÍFICA */
    .activity-icon.marcar-entrada {
      color: #28a745;
      background: rgba(40, 167, 69, 0.1);
      border-radius: 50%;
    }
    
    .activity-icon.marcar-salida {
      color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
      border-radius: 10%;
    }
    
    .activity-icon.salio-geocerca {
      color: #fd7e14;
      background: rgba(253, 126, 20, 0.1);
      border-radius: 5px;
    }
    
    .activity-icon.entro-geocerca {
      color: #20c997;
      background: rgba(32, 201, 151, 0.1);
      border-radius: 5px;
    }
    
    .activity-icon.periodo-dentro {
      color: #0d6efd;
      background: rgba(13, 110, 253, 0.1);
      border-radius: 15%;
    }
    
    .activity-icon.periodo-fuera {
      color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
      border-radius: 0;
    }
    
    .metrics {
      background: #f8f9fa;
      padding: 10px 15px;
      margin-top: 10px;
      font-size: 10px;
      font-weight: bold;
      border-top: 1px solid #dee2e6;
    }
    
    .summary {
      background: #198754;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-top: 30px;
    }
    
    .summary h2 {
      text-align: center;
      font-size: 16px;
      margin-bottom: 20px;
    }
    
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .summary-table th,
    .summary-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    }
    
    .summary-table th {
      background: rgba(0,0,0,0.1);
      font-weight: bold;
    }
    
    @media print {
      .day-section {
        page-break-inside: avoid;
      }
    }
  `
}

function createReportHTML(empleado, calendarData, startDate, endDate) {
  const dias = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  const diasHTML = dias.map(dia => {
    const eventos = generateRealisticEvents(dia, empleado)
    const periodos = generateWorkPeriods(eventos)
    return createDayHTML(dia, eventos, periodos, empleado)
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        ${getReportStyles()}
      </style>
    </head>
    <body>
      <div class="report-container">
        ${createHeaderHTML(empleado, startDate, endDate)}
        ${diasHTML}
        ${createSummaryHTML(calendarData)}
      </div>
    </body>
    </html>
  `
}

// EXPORTACIÓN PRINCIPAL
export function generarReporteEmpleadoPDF({
  empleado,
  calendarData,
  startDate,
  endDate,
  eventsByDay = {},
  timelineData = {},
}) {
  // Crear el HTML del reporte
  const htmlContent = createReportHTML(empleado, calendarData, startDate, endDate)
  
  // Configuración para html2pdf
  const options = {
    margin: 0.5,
    filename: `reporte_de_asistencia_${empleado.name.replace(/ /g, "_")}_${format(parseISO(startDate), "yyyy-MM-dd")}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }

  // Generar PDF
  html2pdf().set(options).from(htmlContent).save()
}

// EXPORTACIÓN POR DEFECTO (opcional)
export default generarReporteEmpleadoPDF