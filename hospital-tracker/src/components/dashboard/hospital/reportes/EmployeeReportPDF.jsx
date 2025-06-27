import { pdf } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import TimelineComponent from './TimelineComponent';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
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
    marginTop: 10,
    gap: 10,
  },
  headerColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginRight: 10,
    marginLeft: 10,
    lineHeight: 1.3,
  },
  section: {
    marginBottom: 20,
    border: '1px solid #DEE2E6',
    borderRadius: 3,
    backgroundColor: '#f8f9fa',
    padding: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#198754',
  },
  table: {
    width: '100%',
    marginTop: 10,
    border: '1px solid #198754',
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#198754',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
    padding: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e0e0e0',
    fontSize: 10,
    padding: 6,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  noData: {
    margin: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#dc3545',
    fontWeight: 'bold',
  },
});

function getEmpleadoNombre(empleado) {
  if (!empleado) return '';
  if (empleado.name) return empleado.name;
  return `${empleado.nombre || ''} ${empleado.ap_paterno || ''} ${empleado.ap_materno || ''}`.replace(/ +/g, ' ').trim();
}

function getHorario(empleado) {
  return empleado.schedule || '07:00 - 16:00';
}

function getGrupo(empleado) {
  return empleado.grupo || '';
}

function getHospital(empleado) {
  return empleado.hospital || '';
}

function getEstado(empleado) {
  return empleado.estado || '';
}

function getMunicipio(empleado) {
  return empleado.municipio || '';
}

function formatHora(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function agrupaPorDia(actividades) {
  const porDia = {};
  actividades.forEach((act) => {
    // Agrupar por la fecha original, sin ninguna conversión ni manipulación
    let dateStr = act.fecha_hora;
    if (typeof dateStr === 'string' && dateStr.length >= 10) {
      dateStr = dateStr.substring(0, 10); // Solo YYYY-MM-DD
    }
    if (!porDia[dateStr]) porDia[dateStr] = [];
    porDia[dateStr].push(act);
  });
  return porDia;
}

function calculaResumen(actividadesPorDia) {
  let totalHoras = 0;
  let diasTrabajados = 0;
  Object.values(actividadesPorDia).forEach((acts) => {
    if (acts.length > 1) {
      // Ordenar por fecha
      const ordenadas = acts.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      const primera = ordenadas[0];
      const ultima = ordenadas[ordenadas.length - 1];
      const inicio = new Date(primera.fecha_hora);
      const fin = new Date(ultima.fecha_hora);
      let horas = (fin - inicio) / (1000 * 60 * 60);
      if (horas < 0) horas = 0;
      totalHoras += horas;
      diasTrabajados++;
    }
  });
  const promedioDiario = diasTrabajados > 0 ? totalHoras / diasTrabajados : 0;
  const rendimiento = diasTrabajados > 0 ? (totalHoras / (diasTrabajados * 9)) * 100 : 0;
  return { totalHoras, diasTrabajados, promedioDiario, rendimiento };
}

const Header = ({ empleado, startDate, endDate }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>REPORTE DE ASISTENCIA</Text>
    <View style={styles.headerInfo}>
      <View style={styles.headerColumn}>
        <Text>Empleado: {getEmpleadoNombre(empleado)}</Text>
        <Text>Horario: {getHorario(empleado)}</Text>
        <Text>Estado: {getEstado(empleado)}</Text>
        <Text>Municipio: {getMunicipio(empleado)}</Text>
        <Text>Fecha de reporte: {format(new Date(), 'dd/MM/yyyy', { locale: es })}</Text>
      </View>
      <View style={styles.headerColumn}>
        <Text>Período: {format(parseISO(startDate), 'dd/MM/yyyy', { locale: es })} al {format(parseISO(endDate), 'dd/MM/yyyy', { locale: es })}</Text>
        <Text>Grupo: {getGrupo(empleado) || 'N/A'}</Text>
        <Text>Hospital: {getHospital(empleado) || 'N/A'}</Text>
      </View>
    </View>
  </View>
);

const PeriodSummary = ({ resumen }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>RESUMEN DEL PERÍODO</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>CONCEPTO</Text>
        <Text style={styles.tableCell}>CANTIDAD</Text>
        <Text style={styles.tableCell}>OBSERVACIONES</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Total de horas trabajadas</Text>
        <Text style={styles.tableCell}>{resumen.totalHoras.toFixed(2)} h</Text>
        <Text style={styles.tableCell}>Entre primer y último registro</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Días laborados</Text>
        <Text style={styles.tableCell}>{resumen.diasTrabajados}</Text>
        <Text style={styles.tableCell}>Días con actividad</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Promedio diario</Text>
        <Text style={styles.tableCell}>{resumen.promedioDiario.toFixed(2)} h</Text>
        <Text style={styles.tableCell}>Horas por día</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>Rendimiento general</Text>
        <Text style={styles.tableCell}>{resumen.rendimiento.toFixed(1)}%</Text>
        <Text style={styles.tableCell}>Basado en 9h/día</Text>
      </View>
    </View>
  </View>
);

// Genera un resumen detallado de los eventos y tiempos dentro/fuera por día
function generarResumenDia(actividades) {
  if (!actividades || actividades.length === 0) return [];
  const eventos = [];
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let tipoUltimo = null;
  let eventoUltimo = null;

  const formatIntervalo = (inicio, fin) => {
    const diffMs = new Date(fin) - new Date(inicio);
    const min = Math.floor(diffMs / 60000) % 60;
    const hrs = Math.floor(diffMs / 3600000);
    return `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
  };

  const pushIntervalo = (inicio, fin, tipo) => {
    if (inicio && fin && inicio !== fin) {
      eventos.push(`${formatHora(inicio)} - ${formatHora(fin)} Tiempo ${tipo} (${formatIntervalo(inicio, fin)})`);
    }
  };

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  for (let i = 0; i < ordenadas.length; i++) {
    const act = ordenadas[i];
    const hora = formatHora(act.fecha_hora);
    // Entrada laboral
    if (i === 0 && act.tipo_registro === 1) {
      eventos.push(`${hora} Marco entrada laboral`);
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      tipoUltimo = act.tipo_registro;
      eventoUltimo = act.evento;
      continue;
    }
    // Evento de geocerca
    if (typeof act.evento === 'number') {
      if (act.evento === 0) {
        // Salió de geocerca
        if (estadoGeocerca === true && horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, 'dentro');
          eventos.push(`${hora} - Salió de geocerca`);
          estadoGeocerca = false;
          horaIntervalo = act.fecha_hora;
        }
      } else if (act.evento === 1) {
        // Entró a la geocerca
        if (estadoGeocerca === false && horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, 'fuera');
          eventos.push(`${hora} - Entró a la geocerca`);
          estadoGeocerca = true;
          horaIntervalo = act.fecha_hora;
        }
      } else if (act.evento === 2) {
        eventos.push(`${hora} Inicio descanso`);
      } else if (act.evento === 3) {
        eventos.push(`${hora} Fin descanso`);
      }
    }
    // Si cambia el estado de geocerca sin evento explícito
    if (i > 0 && act.dentro_geocerca !== undefined && act.dentro_geocerca !== estadoGeocerca) {
      if (estadoGeocerca !== null && horaIntervalo) {
        pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
      }
      // Evento de cambio de estado
      eventos.push(`${hora} - ${act.dentro_geocerca ? 'Entró a la geocerca' : 'Salió de geocerca'}`);
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
    }
    // Salida laboral
    if (i === ordenadas.length - 1 && act.tipo_registro === 0) {
      if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null) {
        pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
      }
      eventos.push(`${hora} Marco salida`);
    }
  }
  return eventos;
}

const DayTable = ({ fecha, actividades }) => {
  if (!actividades || actividades.length === 0) return null;
  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  const resumen = generarResumenDia(ordenadas);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{format(parseISO(fecha), 'EEEE dd/MM/yyyy', { locale: es })}</Text>
      {/* Línea de tiempo visual y resumen del día */}
      <TimelineComponent actividades={ordenadas} />
      {resumen.length > 0 && (
        <View style={{ marginTop: 0, paddingTop: 0 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Resumen del día:</Text>
          {resumen.map((linea, idx) => (
            <Text key={idx} style={{ fontSize: 9 }}>{linea}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

const ReportDocument = ({ empleado, startDate, endDate, eventsByDay }) => {
  // DEBUG: Mostrar las fechas que llegan y el rango
  console.log('startDate:', startDate, 'endDate:', endDate);
  console.log('eventsByDay keys:', Object.keys(eventsByDay));

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dias = Object.keys(eventsByDay)
    .filter((fecha) => {
      // DEBUG: Mostrar cada fecha y su comparación
      const d = parseISO(fecha);
      console.log('Comparando:', fecha, '->', d, '>=', start, '&&', d, '<=', end, ':', d >= start && d <= end);
      return d >= start && d <= end;
    })
    .sort();
  console.log('dias filtrados:', dias);

  const resumen = calculaResumen(
    dias.reduce((acc, fecha) => {
      acc[fecha] = eventsByDay[fecha];
      return acc;
    }, {})
  );
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header empleado={empleado} startDate={startDate} endDate={endDate} />
        {dias.length === 0 ? (
          <Text style={styles.noData}>No hay actividades registradas en el rango seleccionado.</Text>
        ) : (
          <>
            {dias.map((fecha) => (
              <DayTable key={fecha} fecha={fecha} actividades={eventsByDay[fecha]} />
            ))}
          </>
        )}
        <PeriodSummary resumen={resumen} />
      </Page>
    </Document>
  );
};

export async function generarReporteEmpleadoPDF({ empleado, startDate, endDate, eventsByDay }) {
  try {
    const MyDocument = () => (
      <ReportDocument empleado={empleado} startDate={startDate} endDate={endDate} eventsByDay={eventsByDay} />
    );
    const blob = await pdf(<MyDocument />).toBlob();
    const filename = `reporte_de_asistencia_${getEmpleadoNombre(empleado).replace(/ /g, '_')}_${format(parseISO(startDate), 'yyyy-MM-dd')}.pdf`;
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