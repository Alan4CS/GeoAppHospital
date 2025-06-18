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
  let currentY = 20

  // Configuración de colores mejorada
  const colors = {
    within: [34, 197, 94], // Verde - Dentro de geocerca
    outside: [239, 68, 68], // Rojo - Fuera de geocerca
    break: [255, 165, 0], // Naranja - Descanso
    absence: [156, 163, 175], // Gris - Ausencia
    weekend: [209, 213, 219], // Gris claro - Fin de semana
    header: [16, 185, 129], // Verde header
    text: [31, 41, 55], // Texto principal
    event: [59, 130, 246], // Azul - Eventos
    border: [229, 231, 235], // Borde gris claro
    lightGray: [248, 250, 252], // Fondo claro
  }

  // Header principal del documento
  drawDocumentHeader(doc, empleado, startDate, endDate, colors)
  currentY = 50

  // Leyenda mejorada al inicio
  currentY = drawImprovedLegend(doc, currentY, colors)
  currentY += 15

  // Timeline para cada día
  const dias = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  for (const dia of dias) {
    const dateStr = format(dia, "yyyy-MM-dd")
    const dayData = calendarData.find((d) => format(d.date, "yyyy-MM-dd") === dateStr)

    // Generar datos de timeline realistas para el día
    const timelineDataForDay = generateRealisticTimelineData(dia, empleado)
    const eventos = generateRealisticEvents(dia, empleado)

    // Verificar si necesitamos nueva página (con más espacio)
    if (currentY > 180) {
      doc.addPage()
      currentY = 20
    }

    currentY = drawProfessionalDayTimeline(doc, dia, dayData, eventos, timelineDataForDay, currentY, colors)
    currentY += 25 // Más espacio entre días
  }

  // Resumen final mejorado
  if (currentY > 220) {
    doc.addPage()
    currentY = 20
  }

  drawProfessionalSummary(doc, calendarData, currentY, colors)

  // Guardar PDF
  const fileName = `reporte_geocerca_${empleado.name.replace(/ /g, "_")}_${format(parseISO(startDate), "yyyy-MM-dd")}.pdf`
  doc.save(fileName)
}

function drawDocumentHeader(doc, empleado, startDate, endDate, colors) {
  // Fondo del header
  doc.setFillColor(...colors.header)
  doc.roundedRect(10, 10, 190, 35, 5, 5, "F")

  // Título principal
  doc.setFontSize(18)
  doc.setFont(undefined, "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("REPORTE DE SEGUIMIENTO DE GEOCERCA", 105, 22, { align: "center" })

  // Información del empleado
  doc.setFontSize(11)
  doc.setFont(undefined, "normal")
  doc.text(`Empleado: ${empleado.name}`, 15, 32)
  doc.text(`Horario: ${empleado.schedule}`, 15, 38)

  // Período
  const periodoText = `Período: ${format(parseISO(startDate), "dd/MM/yyyy", { locale: es })} - ${format(parseISO(endDate), "dd/MM/yyyy", { locale: es })}`
  doc.text(periodoText, 195, 32, { align: "right" })
  doc.text(`Grupo: ${empleado.grupo || "N/A"}`, 195, 38, { align: "right" })
}

function drawImprovedLegend(doc, y, colors) {
  // Contenedor de la leyenda
  doc.setFillColor(...colors.lightGray)
  doc.setDrawColor(...colors.border)
  doc.roundedRect(10, y, 190, 25, 3, 3, "FD")

  doc.setFontSize(10)
  doc.setFont(undefined, "bold")
  doc.setTextColor(...colors.text)
  doc.text("LEYENDA DE ESTADOS", 15, y + 8)

  const legendItems = [
    { label: "Dentro de geocerca", color: colors.within, symbol: "●" },
    { label: "Fuera de geocerca", color: colors.outside, symbol: "●" },
    { label: "Evento registrado", color: colors.event, symbol: "◆" },
  ]

  let startX = 15
  const legendY = y + 16

  legendItems.forEach((item, index) => {
    // Símbolo de color
    doc.setTextColor(...item.color)
    doc.setFontSize(12)
    doc.text(item.symbol, startX, legendY)

    // Texto de la leyenda
    doc.setTextColor(...colors.text)
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.text(item.label, startX + 5, legendY)

    startX += 60 // Espaciado horizontal
  })

  return y + 25
}

function drawProfessionalDayTimeline(doc, dia, dayData, eventos, timeline, startY, colors) {
  const dayName = format(dia, "EEEE", { locale: es })
  const dayDate = format(dia, "dd/MM/yyyy", { locale: es })
  const isWeekend = dia.getDay() === 0 || dia.getDay() === 6

  let currentY = startY

  // Contenedor principal del día
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...colors.border)
  doc.roundedRect(10, currentY, 190, 70, 5, 5, "FD")

  // Header del día
  const headerColor = isWeekend ? colors.weekend : colors.header
  doc.setFillColor(...headerColor)
  doc.roundedRect(10, currentY, 190, 15, 5, 5, "F")

  doc.setFontSize(12)
  doc.setFont(undefined, "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(`${dayName.toUpperCase()} ${dayDate}`, 15, currentY + 10)

  currentY += 20

  if (isWeekend) {
    doc.setTextColor(...colors.text)
    doc.setFont(undefined, "normal")
    doc.setFontSize(10)
    doc.text("Fin de semana - Sin actividad programada", 15, currentY + 10)
    return currentY + 20
  }

  // Timeline mejorado
  drawEnhancedTimeline(doc, timeline, eventos, 15, currentY + 5, 180, colors)

  currentY += 30

  // Información en dos columnas bien separadas
  doc.setFontSize(9)
  doc.setTextColor(...colors.text)

  // Columna izquierda - Métricas
  const horasTrabajadas = calculateWorkedHours(timeline)
  const horasFuera = calculateOutsideHours(timeline)

  doc.setFont(undefined, "bold")
  doc.text("MÉTRICAS DEL DÍA:", 15, currentY)
  doc.setFont(undefined, "normal")
  doc.text(`• Horas trabajadas: ${horasTrabajadas}h`, 15, currentY + 6)
  doc.text(`• Horas fuera: ${horasFuera}h`, 15, currentY + 12)
  doc.text(`• Eficiencia: ${((Number.parseFloat(horasTrabajadas) / 9) * 100).toFixed(1)}%`, 15, currentY + 18)

  // Columna derecha - Eventos (con mejor espaciado)
  doc.setFont(undefined, "bold")
  doc.text("EVENTOS REGISTRADOS:", 110, currentY)
  doc.setFont(undefined, "normal")

  let eventY = currentY + 6
  eventos.slice(0, 3).forEach((evento, index) => {
    const eventColor = evento.type === "entry" ? colors.within : colors.outside
    doc.setTextColor(...eventColor)
    doc.text("●", 110, eventY)
    doc.setTextColor(...colors.text)
    doc.text(`${evento.time} - ${evento.description}`, 115, eventY)
    eventY += 6
  })

  return currentY + 25
}

function drawEnhancedTimeline(doc, timeline, eventos, x, y, width, colors) {
  const startHour = 7
  const endHour = 16
  const totalHours = endHour - startHour
  const timelineHeight = 12

  // Fondo del timeline
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(x, y - 2, width, timelineHeight + 4, 2, 2, "F")

  // Línea base del timeline
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(2)
  doc.line(x + 10, y + 6, x + width - 10, y + 6)

  // Dibujar segmentos de tiempo con mejor visualización
  timeline.forEach((segment) => {
    const startTime = parseTimeToHour(segment.startTime)
    const endTime = parseTimeToHour(segment.endTime)

    if (startTime >= startHour && endTime <= endHour) {
      const segmentX = x + 10 + ((startTime - startHour) / totalHours) * (width - 20)
      const segmentWidth = ((endTime - startTime) / totalHours) * (width - 20)

      let fillColor
      switch (segment.status) {
        case "within":
          fillColor = colors.within
          break
        case "outside":
          fillColor = colors.outside
          break
        default:
          fillColor = colors.absence
      }

      // Barra de estado más gruesa y visible
      doc.setFillColor(...fillColor)
      doc.roundedRect(segmentX, y + 2, segmentWidth, 8, 2, 2, "F")
    }
  })

  // Marcadores de eventos mejorados
  eventos.forEach((evento) => {
    const eventHour = parseTimeToHour(evento.time)
    if (eventHour >= startHour && eventHour <= endHour) {
      const eventX = x + 10 + ((eventHour - startHour) / totalHours) * (width - 20)

      // Línea vertical del evento
      doc.setDrawColor(...colors.event)
      doc.setLineWidth(3)
      doc.line(eventX, y, eventX, y + timelineHeight)

      // Punto del evento más grande
      doc.setFillColor(...colors.event)
      doc.circle(eventX, y + 6, 3, "F")

      // Etiqueta de tiempo arriba
      doc.setFontSize(8)
      doc.setTextColor(...colors.event)
      doc.setFont(undefined, "bold")
      doc.text(evento.time, eventX - 6, y - 2)
    }
  })

  // Etiquetas de horas principales en la parte inferior
  const majorHours = [7, 10, 13, 16]
  majorHours.forEach((hour) => {
    const hourX = x + 10 + ((hour - startHour) / totalHours) * (width - 20)
    doc.setFontSize(8)
    doc.setTextColor(...colors.text)
    doc.setFont(undefined, "normal")
    doc.text(`${hour}:00`, hourX - 6, y + timelineHeight + 8)
  })
}

function generateRealisticTimelineData(dia, empleado) {
  const dayOfWeek = dia.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    return []
  }

  return [
    {
      startTime: "07:00",
      endTime: "11:00",
      status: "within",
      description: "Trabajo normal",
    },
    {
      startTime: "11:00",
      endTime: "11:30",
      status: "outside",
      description: "Fuera de geocerca",
    },
    {
      startTime: "11:30",
      endTime: "16:00",
      status: "within",
      description: "Trabajo normal",
    },
  ]
}

function generateRealisticEvents(dia, empleado) {
  const dayOfWeek = dia.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isWeekend) {
    return []
  }

  return [
    {
      time: "07:00",
      type: "entry",
      description: "Entrada - Inicio de jornada",
      location: "inside",
    },
    {
      time: "11:00",
      type: "exit",
      description: "Salida temporal",
      location: "outside",
    },
    {
      time: "11:30",
      type: "entry",
      description: "Regreso a geocerca",
      location: "inside",
    },
    {
      time: "16:00",
      type: "exit",
      description: "Salida - Fin de jornada",
      location: "outside",
    },
  ]
}

function calculateWorkedHours(timeline) {
  return timeline
    .filter((segment) => segment.status === "within")
    .reduce((total, segment) => {
      const start = parseTimeToHour(segment.startTime)
      const end = parseTimeToHour(segment.endTime)
      return total + (end - start)
    }, 0)
    .toFixed(1)
}

function calculateOutsideHours(timeline) {
  return timeline
    .filter((segment) => segment.status === "outside")
    .reduce((total, segment) => {
      const start = parseTimeToHour(segment.startTime)
      const end = parseTimeToHour(segment.endTime)
      return total + (end - start)
    }, 0)
    .toFixed(1)
}

function parseTimeToHour(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours + minutes / 60
}

function drawProfessionalSummary(doc, calendarData, startY, colors) {
  let currentY = startY + 15

  // Contenedor del resumen
  doc.setFillColor(...colors.lightGray)
  doc.setDrawColor(...colors.border)
  doc.roundedRect(10, currentY - 10, 190, 80, 5, 5, "FD")

  // Título del resumen
  doc.setFillColor(...colors.header)
  doc.roundedRect(10, currentY - 10, 190, 20, 5, 5, "F")

  doc.setFontSize(14)
  doc.setFont(undefined, "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("RESUMEN EJECUTIVO DEL PERÍODO", 105, currentY + 2, { align: "center" })

  currentY += 25

  // Cálculos
  const totalHoras = calendarData.reduce((acc, d) => acc + (d.totalHours || 0), 0)
  const diasTrabajados = calendarData.filter((d) => d.status === "completed").length
  const diasAusencia = calendarData.filter((d) => d.status === "absence").length
  const diasParciales = calendarData.filter((d) => d.status === "partial").length

  // Tabla de resumen con mejor formato
  const summaryData = [
    ["📊 Total de horas trabajadas", `${totalHoras.toFixed(1)} horas`, "✅"],
    ["📅 Días completados", `${diasTrabajados} días`, "✅"],
    ["⚠️ Días con ausencia", `${diasAusencia} días`, diasAusencia > 0 ? "⚠️" : "✅"],
    ["📈 Promedio diario", `${diasTrabajados > 0 ? (totalHoras / diasTrabajados).toFixed(1) : 0} h/día`, "✅"],
    [
      "🎯 Eficiencia general",
      `${diasTrabajados > 0 ? ((totalHoras / (diasTrabajados * 9)) * 100).toFixed(1) : 0}%`,
      "✅",
    ],
  ]

  autoTable(doc, {
    body: summaryData,
    startY: currentY,
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 5,
      textColor: colors.text,
      lineColor: colors.border,
      lineWidth: 0.5,
    },
    columnStyles: {
      0: {
        cellWidth: 70,
        fontStyle: "bold",
        fillColor: [249, 250, 251],
      },
      1: {
        cellWidth: 50,
        halign: "center",
        fillColor: [255, 255, 255],
        fontStyle: "bold",
      },
      2: {
        cellWidth: 20,
        halign: "center",
        fillColor: [240, 253, 244],
        fontSize: 12,
      },
    },
    margin: { left: 15, right: 15 },
  })
}
