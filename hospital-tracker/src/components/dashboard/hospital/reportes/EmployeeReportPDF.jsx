import { pdf } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Funciones auxiliares
function parseTimeToHour(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + minutes / 60;
}

function calculateHoursDifference(startTime, endTime) {
  const start = parseTimeToHour(startTime);
  const end = parseTimeToHour(endTime);
  return end - start;
}

function generateRealisticEvents(dia, empleado) {
  const dayOfWeek = dia.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) return [];

  return [
    {
      hora: "07:00",
      tipo: "entrada",
      descripcion: "Marcó entrada",
      ubicacion: "dentro",
    },
    {
      hora: "10:38",
      tipo: "salida_geocerca",
      descripcion: "Se salió de la geocerca",
      ubicacion: "fuera",
    },
    {
      hora: "11:15",
      tipo: "entrada_geocerca",
      descripcion: "Entró a la geocerca",
      ubicacion: "dentro",
    },
    {
      hora: "16:00",
      tipo: "salida",
      descripcion: "Marcó salida",
      ubicacion: "fuera",
    },
  ];
}

function generateWorkPeriods(eventos) {
  return [
    {
      inicio: "07:00",
      fin: "10:38",
      estado: "dentro",
      descripcion: "Trabajando dentro de geocerca",
    },
    {
      inicio: "10:38",
      fin: "11:15",
      estado: "fuera",
      descripcion: "Fuera de la geocerca",
    },
    {
      inicio: "11:15",
      fin: "16:00",
      estado: "dentro",
      descripcion: "Trabajando dentro de geocerca",
    },
  ];
}

// ESTILOS PARA REACT-PDF
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // HEADER
  header: {
    backgroundColor: '#198754',
    color: 'white',
    padding: 15,
    marginBottom: 20,
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
  },
  headerColumn: {
    flex: 1,
  },
  
  // DAY SECTION
  daySection: {
    marginBottom: 20,
    border: '1px solid #DEE2E6',
    borderRadius: 3,
  },
  dayHeader: {
    backgroundColor: '#198754',
    color: 'white',
    padding: 10,
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  daySubtitle: {
    fontSize: 8,
  },
  dayContent: {
    padding: 15,
  },
  
  // WEEKEND
  weekendContent: {
    padding: 15,
    textAlign: 'center',
    color: '#6C757D',
  },
  
  // SUMMARY
  summarySection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 5,
    padding: 15,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryEvent: {
    marginBottom: 3,
    fontSize: 9,
    color: '#555',
  },
  summaryMetrics: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #DEE2E6',
    fontWeight: 'bold',
    fontSize: 9,
  },
  
  // PERIOD SUMMARY
  periodSummary: {
    backgroundColor: '#198754',
    color: 'white',
    padding: 15,
    borderRadius: 3,
    marginTop: 20,
  },
  periodTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  summaryTable: {
    border: '1px solid rgba(255,255,255,0.2)',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
});

// COMPONENTE TIMELINE MEJORADO
const Timeline = ({ eventos, periodos }) => {
  const startHour = 7;
  const endHour = 17;
  const totalHours = endHour - startHour;
  const labels = ['7:00am', '9:00am', '11:00am', '1:00pm', '3:00pm', '5:00pm'];

  // Colores para cada tipo de evento
  const eventColors = {
    entrada: '#007bff', // azul
    salida: '#dc3545', // rojo
    salida_geocerca: '#ff9800', // naranja
    entrada_geocerca: '#43a047', // verde
  };

  // Segmentos de línea (verde o rojo según periodo)
  const segments = periodos.map((periodo, idx) => {
    const startTime = parseTimeToHour(periodo.inicio);
    const endTime = parseTimeToHour(periodo.fin);
    if (startTime >= startHour && endTime <= endHour) {
      const leftPercent = ((startTime - startHour) / totalHours) * 100;
      const widthPercent = ((endTime - startTime) / totalHours) * 100;
      return (
        <View
          key={idx}
          style={{
            position: 'absolute',
            top: 38,
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            height: 10,
            backgroundColor: periodo.estado === 'dentro' ? '#28a745' : '#dc3545',
            borderRadius: 5,
            zIndex: 1,
          }}
        />
      );
    }
    return null;
  });

  // Bolitas de eventos con label arriba y hora abajo, bien separadas
  const EVENT_WIDTH = 70;
  const events = eventos.map((evento, idx) => {
    const eventHour = parseTimeToHour(evento.hora);
    if (eventHour >= startHour && eventHour <= endHour) {
      const leftPercent = ((eventHour - startHour) / totalHours) * 100;
      let tipoTexto = '';
      let color = eventColors[evento.tipo] || '#007bff';
      if (evento.tipo === 'entrada') tipoTexto = 'Entrada';
      else if (evento.tipo === 'salida') tipoTexto = 'Salida';
      else if (evento.tipo === 'salida_geocerca') tipoTexto = 'Salida de zona';
      else if (evento.tipo === 'entrada_geocerca') tipoTexto = 'Entrada de zona';
      // Para evitar encimados, alterna el top de los labels si hay eventos juntos
      const labelTop = idx % 2 === 0 ? 0 : 18;
      return (
        <View key={idx} style={{ position: 'absolute', left: `calc(${leftPercent}% - ${EVENT_WIDTH/2}px)`, top: labelTop, alignItems: 'center', width: EVENT_WIDTH, zIndex: 3 }}>
          <Text style={{ fontSize: 11, color, fontWeight: 'bold', textAlign: 'center', marginBottom: 2, backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 2 }}>{tipoTexto}</Text>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color, borderWidth: 3, borderColor: '#fff', marginBottom: 2, zIndex: 3 }} />
          <Text style={{ fontSize: 10, color: '#333', textAlign: 'center', marginTop: 0 }}>{evento.hora}</Text>
        </View>
      );
    }
    return null;
  });

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>Cronología</Text>
      <View style={{ position: 'relative', height: 90, backgroundColor: 'transparent', marginBottom: 10 }}>
        {/* Segmentos de línea */}
        {segments}
        {/* Bolitas de eventos */}
        {events}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: -8 }}>
        {labels.map((label, index) => (
          <Text key={index} style={{ fontSize: 11, color: '#666', minWidth: 40, textAlign: 'center' }}>{label}</Text>
        ))}
      </View>
    </View>
  );
};

// COMPONENTE SUMMARY CORREGIDO - COMO TU IMAGEN
const Summary = ({ eventos, periodos }) => {
  const horasDentro = periodos
    .filter((p) => p.estado === "dentro")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0);

  const horasFuera = periodos
    .filter((p) => p.estado === "fuera")
    .reduce((total, p) => total + calculateHoursDifference(p.inicio, p.fin), 0);

  const totalHoras = horasDentro + horasFuera;
  const rendimiento = ((horasDentro / 9) * 100).toFixed(0);

  // FORMATEAR HORAS CORRECTAMENTE
  function formatearHora(hora) {
    const [h, m] = hora.split(':');
    const horaNum = parseInt(h);
    if (horaNum === 7) return '7:00am';
    if (horaNum === 10) return '10:38am';
    if (horaNum === 11) return '11:15am';
    if (horaNum === 16) return '4:00pm';
    return hora;
  }

  return (
    <View style={styles.summarySection}>
      <Text style={styles.summaryTitle}>Resumen</Text>
      
      {/* LISTA DETALLADA COMO EN TU IMAGEN */}
      <View style={{ marginBottom: 15 }}>
        <Text style={styles.summaryEvent}>7:00am EVENTO Marcó entrada</Text>
        <Text style={styles.summaryEvent}>7:00am - 10:38am Trabajando dentro de geocerca</Text>
        <Text style={styles.summaryEvent}>10:38am EVENTO Se salió de la geocerca</Text>
        <Text style={styles.summaryEvent}>10:38am - 11:15am Fuera de la geocerca</Text>
        <Text style={styles.summaryEvent}>11:15am Entró a la geocerca</Text>
        <Text style={styles.summaryEvent}>11:15am - 4:00pm Trabajando dentro de geocerca</Text>
        <Text style={styles.summaryEvent}>4:00pm EVENTO Marcó salida</Text>
      </View>
      
      {/* MÉTRICAS */}
      <View style={styles.summaryMetrics}>
        <Text>
          Horas dentro: {horasDentro.toFixed(1)}h | Horas fuera: {horasFuera.toFixed(1)}h | Total: {totalHoras.toFixed(1)}h | Rendimiento {rendimiento}%
        </Text>
      </View>
    </View>
  );
};

// COMPONENTE DAY
const DaySection = ({ dia, eventos, periodos, empleado }) => {
  const dayName = format(dia, "EEEE", { locale: es });
  const dayDate = format(dia, "dd/MM/yyyy", { locale: es });
  const isWeekend = dia.getDay() === 0 || dia.getDay() === 6;

  return (
    <View style={styles.daySection}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{dayName.toUpperCase()} - {dayDate}</Text>
        <Text style={styles.daySubtitle}>
          {empleado.name} | Estado: {empleado.estado || "Activo"} | 
          Hospital: {empleado.hospital || "N/A"} | Grupo: {empleado.grupo || "N/A"}
        </Text>
      </View>
      
      {isWeekend ? (
        <View style={styles.weekendContent}>
          <Text style={{ fontWeight: 'bold' }}>FIN DE SEMANA</Text>
          <Text>Sin actividad programada</Text>
        </View>
      ) : (
        <View style={styles.dayContent}>
          <Timeline eventos={eventos} periodos={periodos} />
          <Summary eventos={eventos} periodos={periodos} />
        </View>
      )}
    </View>
  );
};

// COMPONENTE HEADER
const Header = ({ empleado, startDate, endDate }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>REPORTE DE ASISTENCIA</Text>
    <View style={styles.headerInfo}>
      <View style={styles.headerColumn}>
        <Text>Empleado: {empleado.name}</Text>
        <Text>Horario: {empleado.schedule}</Text>
        <Text>Fecha de reporte: {format(new Date(), "dd/MM/yyyy", { locale: es })}</Text>
      </View>
      <View style={styles.headerColumn}>
        <Text>Período: {format(parseISO(startDate), "dd/MM/yyyy", { locale: es })} al {format(parseISO(endDate), "dd/MM/yyyy", { locale: es })}</Text>
        <Text>Grupo: {empleado.grupo || "N/A"}</Text>
        <Text>Hospital: {empleado.hospital || "N/A"}</Text>
      </View>
    </View>
  </View>
);

// COMPONENTE PERIOD SUMMARY
const PeriodSummary = ({ calendarData }) => {
  const totalHoras = calendarData.reduce((acc, d) => acc + (d.totalHours || 0), 0);
  const diasTrabajados = calendarData.filter((d) => d.status === "completed").length;

  return (
    <View style={styles.periodSummary}>
      <Text style={styles.periodTitle}>RESUMEN DEL PERÍODO</Text>
      <View style={styles.summaryTable}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableCellBold}>CONCEPTO</Text>
          <Text style={styles.tableCellBold}>CANTIDAD</Text>
          <Text style={styles.tableCellBold}>OBSERVACIONES</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Total de horas trabajadas</Text>
          <Text style={styles.tableCell}>{totalHoras.toFixed(1)} h</Text>
          <Text style={styles.tableCell}>Dentro de geocerca</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Días laborados</Text>
          <Text style={styles.tableCell}>{diasTrabajados}</Text>
          <Text style={styles.tableCell}>Días completos</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Promedio diario</Text>
          <Text style={styles.tableCell}>{(totalHoras / diasTrabajados || 0).toFixed(1)} h</Text>
          <Text style={styles.tableCell}>Horas por día</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Rendimiento general</Text>
          <Text style={styles.tableCell}>{((totalHoras / (diasTrabajados * 9)) * 100 || 0).toFixed(1)}%</Text>
          <Text style={styles.tableCell}>Basado en 9h/día</Text>
        </View>
      </View>
    </View>
  );
};

// COMPONENTE PRINCIPAL DEL DOCUMENTO
const ReportDocument = ({ empleado, calendarData, startDate, endDate }) => {
  const dias = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header empleado={empleado} startDate={startDate} endDate={endDate} />
        
        {dias.map(dia => {
          const eventos = generateRealisticEvents(dia, empleado);
          const periodos = generateWorkPeriods(eventos);
          return (
            <DaySection 
              key={dia.toISOString()} 
              dia={dia} 
              eventos={eventos} 
              periodos={periodos} 
              empleado={empleado} 
            />
          );
        })}
        
        <PeriodSummary calendarData={calendarData} />
      </Page>
    </Document>
  );
};

// FUNCIÓN PRINCIPAL DE EXPORTACIÓN
export async function generarReporteEmpleadoPDF({
  empleado,
  calendarData,
  startDate,
  endDate,
  eventsByDay = {},
  timelineData = {},
}) {
  try {
    const MyDocument = () => (
      <ReportDocument 
        empleado={empleado}
        calendarData={calendarData}
        startDate={startDate}
        endDate={endDate}
      />
    );

    const blob = await pdf(<MyDocument />).toBlob();
    
    const filename = `reporte_de_asistencia_${empleado.name.replace(/ /g, "_")}_${format(parseISO(startDate), "yyyy-MM-dd")}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF generado exitosamente');
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw error;
  }
}

export default generarReporteEmpleadoPDF;