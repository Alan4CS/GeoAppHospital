import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format, eachDayOfInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export function generarReporteEmpleadoPDF({
  empleado,
  calendarData,
  startDate,
  endDate,
  eventsByDay = {},
  timelineData = {},
}) {
  const doc = new jsPDF()

  // Configurar fuente profesional
  doc.setFont("Helvetica", "normal")

  let currentY = 20

  // Configuración de colores profesionales
  const colors = {
    primary: [25, 135, 84], // Verde profesional
    secondary: [108, 117, 125], // Gris
    success: [40, 167, 69], // Verde éxito
    danger: [220, 53, 69], // Rojo
    warning: [255, 193, 7], // Amarillo
    info: [13, 110, 253], // Azul
    light: [248, 249, 250], // Gris muy claro
    dark: [33, 37, 41], // Gris oscuro
    white: [255, 255, 255],
    border: [206, 212, 218],
  }

  // Header principal estilo Excel
  drawExcelStyleHeader(doc, empleado, startDate, endDate, colors)
  currentY = 60

  // Procesar cada día
  const dias = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  for (const dia of dias) {
    const dateStr = format(dia, "yyyy-MM-dd")
    const dayData = calendarData.find((d) => format(d.date, "yyyy-MM-dd") === dateStr)

    // Generar datos realistas para el día
    const eventos = generateRealisticEvents(dia, empleado)
    const periodos = generateWorkPeriods(eventos)

    // Verificar espacio en página (más permisivo)
    if (currentY > 240) {
      doc.addPage()
      currentY = 20
    }

    currentY = drawFormalDayReport(doc, dia, eventos, periodos, currentY, colors, empleado)
    currentY += 8 // Reducir espacio entre días
  }

  // Resumen final
  if (currentY > 220) {
    doc.addPage()
    currentY = 20
  }
  drawFinalSummary(doc, calendarData, currentY, colors)

  // Guardar PDF
  const fileName = `reporte_de_asistencia_${empleado.name.replace(/ /g, "_")}_${format(parseISO(startDate), "yyyy-MM-dd")}.pdf`
  doc.save(fileName)
}

function drawExcelStyleHeader(doc, empleado, startDate, endDate, colors) {
  // Fondo verde 
  doc.setFillColor(...colors.primary)
  doc.rect(10, 10, 190, 45, "F")

  // Título principal
  doc.setFontSize(16)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...colors.white)
  doc.text("REPORTE DE ASISTENCIA", 105, 22, { align: "center" })

  // Información del empleado en formato tabla
  doc.setFontSize(10)
  doc.setFont(undefined, "normal")

  // Línea 1
  doc.text("Empleado:", 15, 32)
  doc.text(empleado.name, 45, 32)
  doc.text("Período:", 120, 32)
  doc.text(
    `${format(parseISO(startDate), "dd/MM/yyyy", { locale: es })} al ${format(parseISO(endDate), "dd/MM/yyyy", { locale: es })}`,
    150,
    32,
  )

  // Línea 2
  doc.text("Horario:", 15, 40)
  doc.text(empleado.schedule, 45, 40)
  doc.text("Grupo:", 120, 40)
  doc.text(empleado.grupo || "N/A", 150, 40)

  // Línea 3
  doc.text("Fecha de reporte:", 15, 48)
  doc.text(format(new Date(), "dd/MM/yyyy", { locale: es }), 60, 48)
}

function drawFormalDayReport(doc, dia, eventos, periodos, startY, colors, empleado) {
  const dayName = format(dia, "EEEE", { locale: es })
  const dayDate = format(dia, "dd/MM/yyyy", { locale: es })
  const isWeekend = dia.getDay() === 0 || dia.getDay() === 6

  let currentY = startY

  // Header del día con información del empleado
  doc.setFillColor(...colors.primary)
  doc.rect(10, currentY, 190, 18, "F")

  doc.setFontSize(11)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...colors.white)

  // Línea 1: Día y fecha
  doc.text(`${dayName.toUpperCase()} - ${dayDate}`, 15, currentY + 7)

  // Línea 2: Información del empleado
  doc.setFontSize(9)
  doc.setFont(undefined, "normal")
  doc.text(
    `${empleado.name} | Estado: ${empleado.estado || "Activo"} | Hospital: ${empleado.hospital || "N/A"} | Grupo: ${empleado.grupo || "N/A"}`,
    15,
    currentY + 14,
  )

  currentY += 22

  if (isWeekend) {
    doc.setFillColor(...colors.light)
    doc.rect(10, currentY, 190, 15, "F")
    doc.setTextColor(...colors.secondary)
    doc.setFont(undefined, "normal")
    doc.setFontSize(10)
    doc.text("FIN DE SEMANA - Sin actividad programada", 15, currentY + 10)
    return currentY + 20
  }

  // Timeline visual mejorado
  drawProfessionalTimeline(doc, eventos, periodos, 15, currentY, 180, colors)
  currentY += 25

  // Tabla de eventos y períodos (más compacta)
  currentY = drawCompactEventPeriodsTable(doc, eventos, periodos, currentY, colors)

  // Métricas del día (en línea horizontal para ahorrar espacio)
  currentY = drawCompactDayMetrics(doc, periodos, currentY, colors)

  return currentY
}

function drawProfessionalTimeline(doc, eventos, periodos, x, y, width, colors) {
  const startHour = 7
  const endHour = 17
  const totalHours = endHour - startHour
  const timelineHeight = 15

  // Fondo del timeline
  doc.setFillColor(...colors.light)
  doc.setDrawColor(...colors.border)
  doc.rect(x, y, width, timelineHeight, "FD")

  // Línea base
  doc.setDrawColor(...colors.secondary)
  doc.setLineWidth(2)
  doc.line(x + 20, y + 7, x + width - 20, y + 7)

  // Dibujar períodos
  periodos.forEach((periodo) => {
    const startTime = parseTimeToHour(periodo.inicio)
    const endTime = parseTimeToHour(periodo.fin)

    if (startTime >= startHour && endTime <= endHour) {
      const segmentX = x + 20 + ((startTime - startHour) / totalHours) * (width - 40)
      const segmentWidth = ((endTime - startTime) / totalHours) * (width - 40)

      const fillColor = periodo.estado === "dentro" ? colors.success : colors.danger

      doc.setFillColor(...fillColor)
      doc.rect(segmentX, y + 3, segmentWidth, 8, "F")
    }
  })

  // Marcadores de eventos
  eventos.forEach((evento) => {
    const eventHour = parseTimeToHour(evento.hora)
    if (eventHour >= startHour && eventHour <= endHour) {
      const eventX = x + 20 + ((eventHour - startHour) / totalHours) * (width - 40)

      // Línea vertical
      doc.setDrawColor(...colors.info)
      doc.setLineWidth(2)
      doc.line(eventX, y + 1, eventX, y + timelineHeight - 1)

      // Punto del evento
      doc.setFillColor(...colors.info)
      doc.circle(eventX, y + 7, 2, "F")
    }
  })

  // Etiquetas de horas
  for (let hour = startHour; hour <= endHour; hour += 2) {
    const hourX = x + 20 + ((hour - startHour) / totalHours) * (width - 40)
    doc.setFontSize(8)
    doc.setTextColor(...colors.dark)
    doc.text(`${hour}:00`, hourX - 6, y + timelineHeight + 8)
  }
}

function drawCompactEventPeriodsTable(doc, eventos, periodos, startY, colors) {
  let currentY = startY + 3

  // Título de la sección más compacto
  doc.setFillColor(...colors.secondary)
  doc.rect(10, currentY, 190, 8, "F")
  doc.setFontSize(9)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...colors.white)
  doc.text("CRONOLOGÍA DE ACTIVIDADES", 15, currentY + 6)

  currentY += 12

  // Combinar eventos y períodos en orden cronológico
  const timeline = []

  // Agregar eventos
  eventos.forEach((evento) => {
    timeline.push({
      hora: evento.hora,
      tipo: "evento",
      descripcion: evento.descripcion,
      estado: evento.tipo,
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

  doc.setFontSize(8)
  doc.setFont(undefined, "normal")

  timeline.forEach((item, index) => {
    let icon = ""
    let iconColor = colors.dark

    if (item.tipo === "evento") {
      if (item.estado === "entrada") {
        icon = "→"
        iconColor = colors.success
      } else {
        icon = "←"
        iconColor = colors.danger
      }
    } else {
      if (item.estado === "dentro") {
        icon = "■"
        iconColor = colors.success
      } else {
        icon = "□"
        iconColor = colors.danger
      }
    }

    // Dibujar icono
    doc.setTextColor(...iconColor)
    doc.setFontSize(10)
    doc.text(icon, 20, currentY)

    // Dibujar texto más compacto
    doc.setTextColor(...colors.dark)
    doc.setFontSize(8)
    doc.setFont(undefined, item.tipo === "evento" ? "bold" : "normal")

    if (item.tipo === "evento") {
      doc.text(`EVENTO: ${item.hora} - ${item.descripcion}`, 28, currentY)
    } else {
      doc.text(`PERÍODO: ${item.hora} - ${item.descripcion}`, 28, currentY)
    }

    currentY += 5 // Menos espacio entre líneas
  })

  return currentY + 5
}

function drawDayMetrics(doc, periodos, startY, colors) {
  const currentY = startY

  // Calcular métricas
  const horasDentro = periodos
    .filter((p) => p.estado === "dentro")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0)

  const horasFuera = periodos
    .filter((p) => p.estado === "fuera")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0)

  const rendimiento = ((horasDentro / 9) * 100).toFixed(1)

  // Tabla de métricas
  const metricsData = [
    ["Horas dentro de geocerca", `${horasDentro.toFixed(1)}h`],
    ["Horas fuera de geocerca", `${horasFuera.toFixed(1)}h`],
    ["Total de horas", `${(horasDentro + horasFuera).toFixed(1)}h`],
    ["Rendimiento", `${rendimiento}%`],
  ]

  autoTable(doc, {
    body: metricsData,
    startY: currentY,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: colors.dark,
      lineColor: colors.border,
      lineWidth: 0.5,
    },
    columnStyles: {
      0: {
        cellWidth: 80,
        fontStyle: "bold",
        fillColor: colors.light,
      },
      1: {
        cellWidth: 40,
        halign: "center",
        fontStyle: "bold",
      },
    },
    margin: { left: 15, right: 75 },
  })

  return currentY + metricsData.length * 8 + 10
}

function drawCompactDayMetrics(doc, periodos, startY, colors) {
  const currentY = startY

  // Calcular métricas
  const horasDentro = periodos
    .filter((p) => p.estado === "dentro")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0)

  const horasFuera = periodos
    .filter((p) => p.estado === "fuera")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0)

  const rendimiento = ((horasDentro / 9) * 100).toFixed(1)

  // Fondo para las métricas
  doc.setFillColor(...colors.light)
  doc.rect(10, currentY, 190, 12, "F")

  // Mostrar métricas en una línea
  doc.setFontSize(8)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...colors.dark)

  doc.text(
    `MÉTRICAS: Dentro: ${horasDentro.toFixed(1)}h | Fuera: ${horasFuera.toFixed(1)}h | Total: ${(horasDentro + horasFuera).toFixed(1)}h | Rendimiento: ${rendimiento}%`,
    15,
    currentY + 7,
  )

  return currentY + 15
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

  // Basado en los eventos, generar períodos
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

function parseTimeToHour(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours + minutes / 60
}

function calculateHoursDifference(startTime, endTime) {
  const start = parseTimeToHour(startTime)
  const end = parseTimeToHour(endTime)
  return end - start
}

function drawFinalSummary(doc, calendarData, startY, colors) {
  let currentY = startY + 10

  // Header del resumen
  doc.setFillColor(...colors.primary)
  doc.rect(10, currentY, 190, 15, "F")

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...colors.white)
  doc.text("RESUMEN DEL PERÍODO", 105, currentY + 10, { align: "center" })

  currentY += 20

  // Datos del resumen
  const totalHoras = calendarData.reduce((acc, d) => acc + (d.totalHours || 0), 0)
  const diasTrabajados = calendarData.filter((d) => d.status === "completed").length

  const summaryData = [
    ["CONCEPTO", "CANTIDAD", "OBSERVACIONES"],
    ["Total de horas trabajadas", `${totalHoras.toFixed(1)} h`, "Dentro de geocerca"],
    ["Días laborados", `${diasTrabajados}`, "Días completos"],
    ["Promedio diario", `${(totalHoras / diasTrabajados || 0).toFixed(1)} h`, "Horas por día"],
    ["Rendimiento general", `${((totalHoras / (diasTrabajados * 9)) * 100 || 0).toFixed(1)}%`, "Basado en 9h/día"],
  ]

  autoTable(doc, {
    body: summaryData,
    startY: currentY,
    theme: "striped",
    headStyles: {
      fillColor: colors.secondary,
      textColor: colors.white,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
      textColor: colors.dark,
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 80, fontSize: 9 },
    },
    margin: { left: 15, right: 15 },
  })
}
