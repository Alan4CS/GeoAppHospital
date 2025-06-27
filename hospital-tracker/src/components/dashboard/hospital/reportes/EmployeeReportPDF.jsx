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

  // Nuevos estilos para el resumen del día
  daySummaryContainer: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    padding: 10,
    marginTop: 0,
  },
  daySummaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#198754',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid #dee2e6',
  },
  summaryItemsContainer: {
    gap: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    paddingLeft: 8,
  },
  summaryTime: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#495057',
    minWidth: 45,
  },
  summaryDescription: {
    fontSize: 9,
    color: '#212529',
    flex: 1,
    marginLeft: 8,
  },
  summaryDuration: {
    fontSize: 8,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  // Estilos para diferentes tipos de eventos
  eventEntry: {
    color: '#28a745',
  },
  eventExit: {
    color: '#dc3545',
  },
  eventBreak: {
    color: '#ffc107',
  },
  eventGeofence: {
    color: '#17a2b8',
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
    let dateStr = act.fecha_hora;
    if (typeof dateStr === 'string' && dateStr.length >= 10) {
      dateStr = dateStr.substring(0, 10);
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

// Componente mejorado para información del empleado
const EmployeeInfo = ({ empleado }) => (
  <View style={{
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#e9f7ef',
    borderRadius: 5,
    border: '1px solid #b2dfdb',
    gap: 2,
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
      <Text style={{ fontWeight: 'bold', color: '#14532d', fontSize: 11, minWidth: 70 }}>Empleado:</Text>
      <Text style={{ fontSize: 11, color: '#14532d', fontWeight: 'bold' }}>{getEmpleadoNombre(empleado)}</Text>
      <Text style={{ fontWeight: 'bold', color: '#14532d', fontSize: 11, marginLeft: 18, minWidth: 70 }}>Grupo:</Text>
      <Text style={{ fontSize: 11, color: '#14532d' }}>{getGrupo(empleado)}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
      <Text style={{ fontWeight: 'bold', color: '#198754', fontSize: 10, minWidth: 70 }}>Estado:</Text>
      <Text style={{ fontSize: 10, color: '#198754', minWidth: 90 }}>{getEstado(empleado)}</Text>
      <Text style={{ fontWeight: 'bold', color: '#198754', fontSize: 10, minWidth: 70 }}>Municipio:</Text>
      <Text style={{ fontSize: 10, color: '#198754', minWidth: 90 }}>{getMunicipio(empleado)}</Text>
      <Text style={{ fontWeight: 'bold', color: '#198754', fontSize: 10, minWidth: 70 }}>Hospital:</Text>
      <Text style={{ fontSize: 10, color: '#198754' }}>{getHospital(empleado)}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      <Text style={{ fontWeight: 'bold', color: '#198754', fontSize: 10, minWidth: 70 }}>Horas al día:</Text>
      <Text style={{ fontSize: 10, color: '#198754' }}>{getHorario(empleado)}</Text>
    </View>
  </View>
);

// Función mejorada para generar resumen del día con mejor formato
function generarResumenDiaMejorado(actividades) {
  if (!actividades || actividades.length === 0) return [];
  
  const eventos = [];
  let estadoGeocerca = null;
  let horaIntervalo = null;

  const formatIntervalo = (inicio, fin) => {
    const diffMs = new Date(fin) - new Date(inicio);
    const min = Math.floor(diffMs / 60000) % 60;
    const hrs = Math.floor(diffMs / 3600000);
    return `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
  };

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  for (let i = 0; i < ordenadas.length; i++) {
    const act = ordenadas[i];
    const hora = formatHora(act.fecha_hora);
    
    // Entrada laboral
    if (i === 0 && act.tipo_registro === 1) {
      eventos.push({
        hora,
        descripcion: 'Marcó entrada laboral',
        tipo: 'entrada',
        duracion: ''
      });
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      continue;
    }
    
    // Eventos de geocerca
    if (typeof act.evento === 'number') {
      if (act.evento === 0) {
        // Salió de geocerca
        if (estadoGeocerca === true && horaIntervalo) {
          const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: `Tiempo dentro de geocerca`,
            tipo: 'tiempo_dentro',
            duracion: `(${duracion})`
          });
        }
        eventos.push({
          hora,
          descripcion: 'Salió de geocerca',
          tipo: 'geocerca_salida',
          duracion: ''
        });
        estadoGeocerca = false;
        horaIntervalo = act.fecha_hora;
      } else if (act.evento === 1) {
        // Entró a la geocerca
        if (estadoGeocerca === false && horaIntervalo) {
          const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: `Tiempo fuera de geocerca`,
            tipo: 'tiempo_fuera',
            duracion: `(${duracion})`
          });
        }
        eventos.push({
          hora,
          descripcion: 'Entró a geocerca',
          tipo: 'geocerca_entrada',
          duracion: ''
        });
        estadoGeocerca = true;
        horaIntervalo = act.fecha_hora;
      } else if (act.evento === 2) {
        eventos.push({
          hora,
          descripcion: 'Inicio de descanso',
          tipo: 'descanso_inicio',
          duracion: ''
        });
      } else if (act.evento === 3) {
        eventos.push({
          hora,
          descripcion: 'Fin de descanso',
          tipo: 'descanso_fin',
          duracion: ''
        });
      }
    }
    
    // Salida laboral
    if (i === ordenadas.length - 1 && act.tipo_registro === 0) {
      if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null) {
        const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
        eventos.push({
          hora: `${formatHora(horaIntervalo)} - ${hora}`,
          descripcion: `Tiempo ${estadoGeocerca ? 'dentro' : 'fuera'} de geocerca`,
          tipo: estadoGeocerca ? 'tiempo_dentro' : 'tiempo_fuera',
          duracion: `(${duracion})`
        });
      }
      eventos.push({
        hora,
        descripcion: 'Marcó salida laboral',
        tipo: 'salida',
        duracion: ''
      });
    }
  }
  
  return eventos;
}

// Componente mejorado para el resumen del día
const DaySummary = ({ eventos }) => {
  if (!eventos || eventos.length === 0) return null;

  const getEventStyle = (tipo) => {
    switch (tipo) {
      case 'entrada':
      case 'geocerca_entrada':
        return styles.eventEntry;
      case 'salida':
      case 'geocerca_salida':
        return styles.eventExit;
      case 'descanso_inicio':
      case 'descanso_fin':
        return styles.eventBreak;
      case 'tiempo_dentro':
      case 'tiempo_fuera':
        return styles.eventGeofence;
      default:
        return {};
    }
  };

  return (
    <View style={styles.daySummaryContainer}>
      <Text style={styles.daySummaryTitle}>Resumen del dia</Text>
      <View style={styles.summaryItemsContainer}>
        {eventos.map((evento, idx) => (
          <View key={idx} style={styles.summaryItem}>
            <Text style={[styles.summaryTime, getEventStyle(evento.tipo)]}>
              {evento.hora}
            </Text>
            <Text style={styles.summaryDescription}>
              {evento.descripcion}
            </Text>
            {evento.duracion && (
              <Text style={styles.summaryDuration}>
                {evento.duracion}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const DayTable = ({ fecha, actividades, empleado }) => {
  if (!actividades || actividades.length === 0) return null;
  
  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  const eventosResumen = generarResumenDiaMejorado(ordenadas);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {format(parseISO(fecha), 'EEEE dd/MM/yyyy', { locale: es })}
      </Text>
      
      {/* Información del empleado debajo del día */}
      <EmployeeInfo empleado={empleado} />
      
      {/* Espacio extra antes de la línea de tiempo solo en PDF */}
      <View style={{ marginTop: 18 }} /> {/* <-- Espacio agregado aquí */}
      
      {/* Línea de tiempo visual */}
      <TimelineComponent actividades={ordenadas} />
      
      {/* Resumen del día mejorado */}
      <DaySummary eventos={eventosResumen} />
    </View>
  );
};

const ReportDocument = ({ empleado, startDate, endDate, eventsByDay }) => {
  console.log('startDate:', startDate, 'endDate:', endDate);
  console.log('eventsByDay keys:', Object.keys(eventsByDay));

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dias = Object.keys(eventsByDay)
    .filter((fecha) => {
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
              <DayTable key={fecha} fecha={fecha} actividades={eventsByDay[fecha]} empleado={empleado} />
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