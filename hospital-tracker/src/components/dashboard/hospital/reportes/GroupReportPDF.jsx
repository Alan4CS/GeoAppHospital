import { pdf } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    backgroundColor: '#059669', // verde esmeralda
    color: 'white',
    padding: 14,
    marginBottom: 14,
    borderRadius: 7,
    boxShadow: '0 1px 4px #0001',
    border: '1px solid #047857', // borde verde oscuro
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#059669', // verde esmeralda para el título
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    marginTop: 0,
    gap: 8,
    borderTop: '2px solid #1e40af',
    paddingTop: 6,
  },
  headerColumn: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginRight: 6,
    marginLeft: 6,
    lineHeight: 1.3,
    gap: 2,
  },
  section: {
    marginBottom: 8,
    border: '1px solid #DEE2E6',
    borderRadius: 3,
    backgroundColor: '#f8f9fa',
    padding: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#059669', // verde esmeralda
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  table: {
    width: '100%',
    marginTop: 10,
    border: '1px solid #059669', // verde esmeralda
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669', // verde esmeralda
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
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e0e0e0',
    fontSize: 10,
    padding: 6,
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    paddingRight: 4,
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
    paddingRight: 4,
  },
  noData: {
    margin: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    flex: 1,
    textAlign: 'center',
    borderRight: '1px solid #dee2e6',
    paddingRight: 8,
    marginRight: 8,
  },
  statsItemLast: {
    flex: 1,
    textAlign: 'center',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669', // verde esmeralda
    marginBottom: 3,
  },
  statsLabel: {
    fontSize: 8,
    color: '#6c757d',
  },
  groupSection: {
    marginBottom: 5,
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  groupHeader: {
    backgroundColor: '#10b981', // verde más claro
    color: 'white',
    padding: 4,
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  groupContent: {
    padding: 5,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderBottom: '1px solid #f0f0f0',
  },
  employeeStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeStatus: {
    backgroundColor: '#10b981',
  },
  inactiveStatus: {
    backgroundColor: '#ef4444',
  },
  employeeName: {
    flex: 3,
    fontSize: 8,
    color: '#374151',
  },
  employeeStats: {
    flex: 2,
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'right',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.3,
    color: '#374151',
  },
});

function formatHorasMinutos(horasDecimales) {
  if (typeof horasDecimales !== 'number' || isNaN(horasDecimales) || horasDecimales < 0) {
    return '0h 0min';
  }
  const horas = Math.floor(horasDecimales);
  const minutos = Math.round((horasDecimales - horas) * 60);
  return `${horas}h ${minutos}min`;
}

const Header = ({ 
  hospital, 
  startDate, 
  endDate, 
  estado, 
  municipio, 
  reportTitle = "REPORTE ANALÍTICO DE GRUPOS HOSPITALARIOS",
  reportSubtitle = "Análisis completo de todos los grupos del hospital",
  selectedGroup = null 
}) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{reportTitle.toUpperCase()}</Text>
    {reportSubtitle && (
      <Text style={[styles.headerTitle, { fontSize: 11, fontWeight: 'normal', marginTop: 4, marginBottom: 4 }]}>
        {reportSubtitle}
      </Text>
    )}
    <View style={styles.headerInfo}>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Hospital:</Text>{' '}{hospital}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Estado:</Text>{' '}{estado}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Municipio:</Text>{' '}{municipio}</Text>
        {selectedGroup && (
          <Text><Text style={{ fontWeight: 'bold' }}>Grupo específico:</Text>{' '}{selectedGroup}</Text>
        )}
      </View>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Período de análisis:</Text>{' '}{format(parseISO(startDate), 'dd/MM/yyyy', { locale: es })} al {format(parseISO(endDate), 'dd/MM/yyyy', { locale: es })}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Fecha de generación:</Text>{' '}{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Tipo de reporte:</Text>{' '}{selectedGroup ? `Análisis de Grupo Específico` : `Análisis de Grupos y Empleados`}</Text>
      </View>
    </View>
  </View>
);

const EmployeeSummaryCards = ({ cardData, empleadosActivos, empleadosInactivos }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>RESUMEN GENERAL DE EMPLEADOS</Text>
    <View style={styles.statsCard}>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{empleadosActivos.length || 0}</Text>
        <Text style={styles.statsLabel}>EMPLEADOS ACTIVOS</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>en el período</Text>
      </View>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{empleadosInactivos.length || 0}</Text>
        <Text style={styles.statsLabel}>EMPLEADOS INACTIVOS</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>sin registros</Text>
      </View>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{cardData.totalEmployees || 0}</Text>
        <Text style={styles.statsLabel}>TOTAL EMPLEADOS</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>del hospital</Text>
      </View>
      <View style={styles.statsItemLast}>
        <Text style={styles.statsValue}>
          {cardData.totalEmployees > 0 
            ? Math.round((empleadosActivos.length / cardData.totalEmployees) * 100)
            : 0}%
        </Text>
        <Text style={styles.statsLabel}>TASA DE ACTIVIDAD</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>en el período</Text>
      </View>
    </View>
  </View>
);

const PeriodAnalysisCard = ({ cardData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>RESUMEN DE ASISTENCIA EN EL PERÍODO</Text>
    <View style={styles.statsCard}>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{cardData.totalWorkingDays || 0}</Text>
        <Text style={styles.statsLabel}>DÍAS DEL PERÍODO</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>total de días</Text>
      </View>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{cardData.averageWorkingDays || 0}</Text>
        <Text style={styles.statsLabel}>DÍAS PROMEDIO</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>por empleado activo</Text>
      </View>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{cardData.consistentEmployees || 0}</Text>
        <Text style={styles.statsLabel}>EMPLEADOS CONSISTENTES</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>50% o más días del período</Text>
      </View>
      <View style={styles.statsItemLast}>
        <Text style={styles.statsValue}>{cardData.activeGroups || 0}</Text>
        <Text style={styles.statsLabel}>GRUPOS ACTIVOS</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>de {cardData.totalGroups || 0} totales</Text>
      </View>
    </View>
  </View>
);

const HoursMetricsCards = ({ cardData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>MÉTRICAS DE TIEMPO LABORAL</Text>
    <View style={styles.statsCard}>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{formatHorasMinutos(cardData.totalDentro || 0)}</Text>
        <Text style={styles.statsLabel}>HORAS EN GEOCERCA</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>tiempo en área de trabajo</Text>
      </View>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{formatHorasMinutos(cardData.totalFuera || 0)}</Text>
        <Text style={styles.statsLabel}>HORAS FUERA</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>tiempo fuera del área</Text>
      </View>
      <View style={styles.statsItem}>
        <Text style={styles.statsValue}>{formatHorasMinutos(cardData.totalDescanso || 0)}</Text>
        <Text style={styles.statsLabel}>HORAS DESCANSO</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>tiempo en descanso</Text>
      </View>
      <View style={styles.statsItemLast}>
        <Text style={styles.statsValue}>{formatHorasMinutos((cardData.totalDentro || 0) + (cardData.totalFuera || 0) + (cardData.totalDescanso || 0))}</Text>
        <Text style={styles.statsLabel}>TOTAL HORAS</Text>
        <Text style={[styles.statsLabel, { fontSize: 7, marginTop: 2 }]}>tiempo total registrado</Text>
      </View>
    </View>
  </View>
);

const ActivityLevelBreakdown = ({ cardData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>DISTRIBUCIÓN DE EMPLEADOS POR NIVEL DE ACTIVIDAD</Text>
    <View style={{ marginBottom: 6 }}>
      <Text style={[styles.text, { fontSize: 9, textAlign: 'justify' }]}> 
        La siguiente tabla presenta la distribución de empleados según su nivel de participación durante el período analizado, categorizando su asistencia en cinco niveles principales (incluyendo inactivos).
      </Text>
    </View>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>NIVEL DE ACTIVIDAD</Text>
        <Text style={styles.tableCellCenter}>EMPLEADOS</Text>
        <Text style={styles.tableCellCenter}>CRITERIO</Text>
        <Text style={styles.tableCellCenter}>PORCENTAJE</Text>
      </View>
      {/* Muy Activos */}
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Muy Activos</Text>
        <Text style={styles.tableCellCenter}>{cardData.muyActivos || 0}</Text>
        <Text style={styles.tableCellCenter}>80% o más días</Text>
        <Text style={styles.tableCellCenter}>{cardData.totalEmployees > 0 ? (((cardData.muyActivos || 0) / cardData.totalEmployees) * 100).toFixed(1) : '0.0'}%</Text>
      </View>
      {/* Activos Regulares */}
      <View style={styles.tableRowAlt}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Activos Regulares</Text>
        <Text style={styles.tableCellCenter}>{cardData.activos || 0}</Text>
        <Text style={styles.tableCellCenter}>50-79% días</Text>
        <Text style={styles.tableCellCenter}>{cardData.totalEmployees > 0 ? (((cardData.activos || 0) / cardData.totalEmployees) * 100).toFixed(1) : '0.0'}%</Text>
      </View>
      {/* Poco Activos */}
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Poco Activos</Text>
        <Text style={styles.tableCellCenter}>{cardData.pocoActivos || 0}</Text>
        <Text style={styles.tableCellCenter}>20-49% días</Text>
        <Text style={styles.tableCellCenter}>{cardData.totalEmployees > 0 ? (((cardData.pocoActivos || 0) / cardData.totalEmployees) * 100).toFixed(1) : '0.0'}%</Text>
      </View>
      {/* Esporádicos */}
      <View style={styles.tableRowAlt}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Esporádicos</Text>
        <Text style={styles.tableCellCenter}>{cardData.esporadicos || 0}</Text>
        <Text style={styles.tableCellCenter}>Menos de 20% días</Text>
        <Text style={styles.tableCellCenter}>{cardData.totalEmployees > 0 ? (((cardData.esporadicos || 0) / cardData.totalEmployees) * 100).toFixed(1) : '0.0'}%</Text>
      </View>
      {/* Inactivos */}
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Inactivos</Text>
        <Text style={styles.tableCellCenter}>{cardData.inactivos || 0}</Text>
        <Text style={styles.tableCellCenter}>0 días</Text>
        <Text style={styles.tableCellCenter}>{cardData.totalEmployees > 0 ? (((cardData.inactivos || 0) / cardData.totalEmployees) * 100).toFixed(1) : '0.0'}%</Text>
      </View>
      {/* Total general */}
      <View style={[styles.tableRow, { backgroundColor: '#d1fae5', borderTop: '2px solid #059669' }]}> 
        <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>TOTAL EMPLEADOS</Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>{cardData.totalEmployees || 0}</Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>-</Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>100%</Text>
      </View>
    </View>
  </View>
);

const GroupDistributionTable = ({ groupDistributionData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>EMPLEADOS POR GRUPO DE TRABAJO</Text>
    <View style={{ marginBottom: 6 }}>
      <Text style={[styles.text, { fontSize: 9, textAlign: 'justify' }]}>
        La siguiente tabla muestra la distribución total de empleados registrados en cada grupo de trabajo, 
        incluyendo tanto empleados activos como inactivos durante el período analizado.
      </Text>
    </View>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>GRUPO DE TRABAJO</Text>
        <Text style={styles.tableCellCenter}>TOTAL EMPLEADOS</Text>
        <Text style={styles.tableCellCenter}>PORCENTAJE</Text>
      </View>
      {groupDistributionData.map((grupo, index) => {
        const totalEmpleados = groupDistributionData.reduce((sum, g) => sum + g.cantidad, 0);
        const porcentaje = ((grupo.cantidad / totalEmpleados) * 100).toFixed(1);
        return (
          <View key={grupo.grupo} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{grupo.grupo}</Text>
            <Text style={styles.tableCellCenter}>{grupo.cantidad}</Text>
            <Text style={styles.tableCellCenter}>{porcentaje}%</Text>
          </View>
        );
      })}
      <View style={[styles.tableRow, { backgroundColor: '#e3f2fd', borderTop: '2px solid #2563eb' }]}>
        <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>TOTAL GENERAL</Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {groupDistributionData.reduce((sum, g) => sum + g.cantidad, 0)}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>100%</Text>
      </View>
    </View>
  </View>
);

const ActiveInactiveTable = ({ stackedGroupData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>COMPARATIVO DE EMPLEADOS ACTIVOS E INACTIVOS POR GRUPO</Text>
    <View style={{ marginBottom: 6 }}>
      <Text style={[styles.text, { fontSize: 9, textAlign: 'justify' }]}>
        Este análisis compara la participación laboral por grupo, mostrando la efectividad de cada equipo 
        de trabajo en términos de empleados activos durante el período evaluado.
      </Text>
    </View>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>GRUPO DE TRABAJO</Text>
        <Text style={styles.tableCellCenter}>ACTIVOS</Text>
        <Text style={styles.tableCellCenter}>INACTIVOS</Text>
        <Text style={styles.tableCellCenter}>TOTAL</Text>
        <Text style={styles.tableCellCenter}>% EFECTIVIDAD</Text>
      </View>
      {stackedGroupData.map((grupo, index) => {
        const porcentajeActivos = grupo.Total > 0 ? ((grupo.Activos / grupo.Total) * 100).toFixed(1) : '0.0';
        return (
          <View key={grupo.grupo} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{grupo.grupo}</Text>
            <Text style={styles.tableCellCenter}>{grupo.Activos}</Text>
            <Text style={styles.tableCellCenter}>{grupo.Inactivos}</Text>
            <Text style={styles.tableCellCenter}>{grupo.Total}</Text>
            <Text style={styles.tableCellCenter}>{porcentajeActivos}%</Text>
          </View>
        );
      })}
      <View style={[styles.tableRow, { backgroundColor: '#e3f2fd', borderTop: '2px solid #2563eb' }]}>
        <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>TOTALES GENERALES</Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {stackedGroupData.reduce((sum, g) => sum + g.Activos, 0)}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {stackedGroupData.reduce((sum, g) => sum + g.Inactivos, 0)}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {stackedGroupData.reduce((sum, g) => sum + g.Total, 0)}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {stackedGroupData.reduce((sum, g) => sum + g.Total, 0) > 0 
            ? ((stackedGroupData.reduce((sum, g) => sum + g.Activos, 0) / stackedGroupData.reduce((sum, g) => sum + g.Total, 0)) * 100).toFixed(1)
            : 0}%
        </Text>
      </View>
    </View>
  </View>
);

const GroupHoursTable = ({ groupHoursData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>TIEMPO LABORAL REGISTRADO POR GRUPO</Text>
    <View style={{ marginBottom: 6 }}>
      <Text style={[styles.text, { fontSize: 9, textAlign: 'justify' }]}>
        La siguiente tabla presenta el tiempo efectivo de trabajo registrado por cada grupo, diferenciando 
        entre el tiempo trabajado dentro y fuera de las áreas georreferenciadas establecidas, así como el tiempo de descanso.
      </Text>
    </View>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, { flex: 2 }]}>GRUPO DE TRABAJO</Text>
        <Text style={styles.tableCellCenter}>TIEMPO EN GEOCERCA</Text>
        <Text style={styles.tableCellCenter}>TIEMPO FUERA</Text>
        <Text style={styles.tableCellCenter}>TIEMPO DESCANSO</Text>
        <Text style={styles.tableCellCenter}>TIEMPO TOTAL</Text>
        <Text style={styles.tableCellCenter}>% EFECTIVIDAD</Text>
      </View>
      {groupHoursData
        .sort((a, b) => (b.horas + b.horasFuera + (b.horasDescanso || 0)) - (a.horas + a.horasFuera + (a.horasDescanso || 0)))
        .map((grupo, index) => {
          const totalHoras = grupo.horas + grupo.horasFuera + (grupo.horasDescanso || 0);
          const porcentajeEfectividad = totalHoras > 0 ? ((grupo.horas / totalHoras) * 100).toFixed(1) : '0.0';
          return (
            <View key={grupo.grupo} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{grupo.grupo}</Text>
              <Text style={styles.tableCellCenter}>{formatHorasMinutos(grupo.horas)}</Text>
              <Text style={styles.tableCellCenter}>{formatHorasMinutos(grupo.horasFuera)}</Text>
              <Text style={styles.tableCellCenter}>{formatHorasMinutos(grupo.horasDescanso || 0)}</Text>
              <Text style={styles.tableCellCenter}>{formatHorasMinutos(totalHoras)}</Text>
              <Text style={styles.tableCellCenter}>{porcentajeEfectividad}%</Text>
            </View>
          );
        })}
      <View style={[styles.tableRow, { backgroundColor: '#e3f2fd', borderTop: '2px solid #2563eb' }]}>
        <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>TOTALES GENERALES</Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {formatHorasMinutos(groupHoursData.reduce((sum, g) => sum + g.horas, 0))}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {formatHorasMinutos(groupHoursData.reduce((sum, g) => sum + g.horasFuera, 0))}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {formatHorasMinutos(groupHoursData.reduce((sum, g) => sum + (g.horasDescanso || 0), 0))}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {formatHorasMinutos(groupHoursData.reduce((sum, g) => sum + g.horas + g.horasFuera + (g.horasDescanso || 0), 0))}
        </Text>
        <Text style={[styles.tableCellCenter, { fontWeight: 'bold' }]}>
          {groupHoursData.reduce((sum, g) => sum + g.horas + g.horasFuera + (g.horasDescanso || 0), 0) > 0 
            ? ((groupHoursData.reduce((sum, g) => sum + g.horas, 0) / groupHoursData.reduce((sum, g) => sum + g.horas + g.horasFuera + (g.horasDescanso || 0), 0)) * 100).toFixed(1)
            : 0}%
        </Text>
      </View>
    </View>
  </View>
);

const EmployeeDetailsByGroup = ({ empleadosActivos, empleadosInactivos, groupDistributionData, selectedGroup = null }) => {
  // Agrupar empleados por grupo
  const empleadosPorGrupo = {};
  
  // Agregar empleados activos
  empleadosActivos.forEach(emp => {
    if (!empleadosPorGrupo[emp.nombre_grupo]) {
      empleadosPorGrupo[emp.nombre_grupo] = { activos: [], inactivos: [] };
    }
    empleadosPorGrupo[emp.nombre_grupo].activos.push(emp);
  });
  
  // Agregar empleados inactivos
  empleadosInactivos.forEach(emp => {
    if (!empleadosPorGrupo[emp.nombre_grupo]) {
      empleadosPorGrupo[emp.nombre_grupo] = { activos: [], inactivos: [] };
    }
    empleadosPorGrupo[emp.nombre_grupo].inactivos.push(emp);
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {selectedGroup ? `LISTADO DETALLADO DE EMPLEADOS DEL GRUPO: ${selectedGroup.toUpperCase()}` : 'LISTADO DETALLADO DE EMPLEADOS POR GRUPO'}
      </Text>
      <View style={{ marginBottom: 5 }}>
        <Text style={[styles.text, { fontSize: 8, textAlign: 'justify' }]}>
          {selectedGroup 
            ? `Listado completo de empleados del grupo "${selectedGroup}", diferenciando entre aquellos que registraron actividad durante el período y los que no.`
            : 'Listado completo de empleados organizados por grupo de trabajo, diferenciando entre aquellos que registraron actividad durante el período y los que no.'
          }
        </Text>
      </View>
      {Object.keys(empleadosPorGrupo).map((nombreGrupo) => {
        const grupo = empleadosPorGrupo[nombreGrupo];
        const totalEmpleados = grupo.activos.length + grupo.inactivos.length;
        const porcentajeActivos = totalEmpleados > 0 ? ((grupo.activos.length / totalEmpleados) * 100).toFixed(1) : 0;
        
        return (
          <View key={nombreGrupo} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <Text>
                {nombreGrupo.toUpperCase()} - Total: {totalEmpleados} empleados 
                (Activos: {grupo.activos.length} - {porcentajeActivos}% | Inactivos: {grupo.inactivos.length})
              </Text>
            </View>
            <View style={styles.groupContent}>
              {/* Empleados activos */}
              {grupo.activos.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold', color: '#059669', marginBottom: 3, fontSize: 8, paddingVertical: 2 }}>
                    EMPLEADOS ACTIVOS ({grupo.activos.length}):
                  </Text>
                  {grupo.activos.map((empleado) => (
                    <View key={`activo-${empleado.id_user}`} style={styles.employeeRow}>
                      <View style={[styles.employeeStatus, styles.activeStatus]} />
                      <Text style={styles.employeeName}>
                        {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno || ''}
                      </Text>
                      <Text style={styles.employeeStats}>Con actividad registrada</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Empleados inactivos */}
              {grupo.inactivos.length > 0 && (
                <View style={{ marginTop: 2 }}>
                  <Text style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: 3, fontSize: 8, paddingVertical: 2 }}>
                    EMPLEADOS INACTIVOS ({grupo.inactivos.length}):
                  </Text>
                  {grupo.inactivos.map((empleado) => (
                    <View key={`inactivo-${empleado.id_user}`} style={styles.employeeRow}>
                      <View style={[styles.employeeStatus, styles.inactiveStatus]} />
                      <Text style={styles.employeeName}>
                        {empleado.nombre} {empleado.ap_paterno} {empleado.ap_materno || ''}
                      </Text>
                      <Text style={styles.employeeStats}>Sin actividad en el período</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const ReportDocument = ({ 
  hospital, 
  estado, 
  municipio, 
  startDate, 
  endDate, 
  cardData,
  groupDistributionData,
  stackedGroupData,
  groupHoursData,
  empleadosActivos,
  empleadosInactivos,
  selectedGroup = null,
  reportTitle = "Reporte General de Grupos",
  reportSubtitle = "Análisis completo de todos los grupos del hospital"
}) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header 
          hospital={hospital}
          estado={estado}
          municipio={municipio}
          startDate={startDate} 
          endDate={endDate}
          reportTitle={reportTitle}
          reportSubtitle={reportSubtitle}
          selectedGroup={selectedGroup}
        />
        
        <ExecutiveSummary 
          cardData={cardData} 
          empleadosActivos={empleadosActivos}
          empleadosInactivos={empleadosInactivos}
          selectedGroup={selectedGroup}
        />
        
        <EmployeeSummaryCards 
          cardData={cardData} 
          empleadosActivos={empleadosActivos}
          empleadosInactivos={empleadosInactivos}
          selectedGroup={selectedGroup}
        />
        
        <PeriodAnalysisCard cardData={cardData} />
        
        <HoursMetricsCards cardData={cardData} />
        
        <ActivityLevelBreakdown cardData={cardData} />
        
        {/* Solo incluir las siguientes secciones si es un reporte general (no específico de un grupo) */}
        {!selectedGroup && (
          <>
            <GroupDistributionTable groupDistributionData={groupDistributionData} />
            
            <ActiveInactiveTable stackedGroupData={stackedGroupData} />
            
            <GroupHoursTable groupHoursData={groupHoursData} />
          </>
        )}
        
        <EmployeeDetailsByGroup 
          empleadosActivos={empleadosActivos}
          empleadosInactivos={empleadosInactivos}
          groupDistributionData={groupDistributionData}
          selectedGroup={selectedGroup}
        />
      </Page>
    </Document>
  );
};

export async function generarReporteGrupoPDF({ 
  hospital, 
  estado, 
  municipio, 
  startDate, 
  endDate, 
  cardData,
  groupDistributionData,
  stackedGroupData,
  groupHoursData,
  empleadosActivos,
  empleadosInactivos,
  selectedGroup = null,
  reportTitle = "Reporte General de Grupos",
  reportSubtitle = "Análisis completo de todos los grupos del hospital"
}) {
  try {
    const MyDocument = () => (
      <ReportDocument 
        hospital={hospital}
        estado={estado}
        municipio={municipio}
        startDate={startDate}
        endDate={endDate}
        cardData={cardData}
        groupDistributionData={groupDistributionData}
        stackedGroupData={stackedGroupData}
        groupHoursData={groupHoursData}
        empleadosActivos={empleadosActivos}
        empleadosInactivos={empleadosInactivos}
        selectedGroup={selectedGroup}
        reportTitle={reportTitle}
        reportSubtitle={reportSubtitle}
      />
    );
    
    // Generar nombre de archivo dinámico según el tipo de reporte
    const baseFilename = selectedGroup 
      ? `reporte_grupo_${selectedGroup.replace(/[^a-zA-Z0-9]/g, '_')}`
      : `reporte_grupos_${hospital.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const filename = `${baseFilename}_${format(parseISO(startDate), 'yyyy-MM-dd')}_${format(parseISO(endDate), 'yyyy-MM-dd')}.pdf`;
    
    const blob = await pdf(<MyDocument />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating group PDF report:', error);
    throw error;
  }
}

const ExecutiveSummary = ({ cardData, empleadosActivos, empleadosInactivos, selectedGroup = null }) => {
  const totalEmpleados = empleadosActivos.length + empleadosInactivos.length || 0;
  const tasaActividad = totalEmpleados > 0 ? ((empleadosActivos.length / totalEmpleados) * 100).toFixed(1) : 0;
  const diasPeriodo = cardData.totalWorkingDays || 0;
  const promedioAsistencia = cardData.averageWorkingDays || 0;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>RESUMEN</Text>
      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.text, { fontSize: 11, lineHeight: 1.4, textAlign: 'justify' }]}>
          {selectedGroup ? (
            `Durante el período analizado de ${diasPeriodo} días, se registró la actividad específica del grupo "${selectedGroup}". Este grupo cuenta con ${totalEmpleados} empleados, de los cuales ${empleadosActivos.length} empleados (${tasaActividad}%) mostraron actividad laboral, con un promedio de ${promedioAsistencia} días trabajados por empleado activo.`
          ) : (
            `Durante el período analizado de ${diasPeriodo} días, se registró la actividad de ${totalEmpleados} empleados distribuidos en ${cardData.totalGroups || 0} grupos de trabajo. De estos, ${empleadosActivos.length} empleados (${tasaActividad}%) mostraron actividad laboral, con un promedio de ${promedioAsistencia} días trabajados por empleado activo.`
          )}
        </Text>
      </View>
      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.text, { fontSize: 11, lineHeight: 1.4, textAlign: 'justify' }]}>
          {selectedGroup ? (
            `El análisis específico del grupo "${selectedGroup}" muestra una distribución de actividad donde se identificaron empleados con diferentes niveles de participación laboral durante el período evaluado. Este enfoque particular permite un análisis más detallado y específico del rendimiento grupal.`
          ) : (
            `El análisis de distribución por nivel de actividad revela que ${cardData.muyActivos || 0} empleados mantuvieron una asistencia muy alta (mayor o igual al 80% de días), mientras que ${cardData.activos || 0} empleados presentaron una asistencia regular (50-79% de días). Se identificaron ${cardData.pocoActivos || 0} empleados con baja actividad y ${cardData.esporadicos || 0} con participación esporádica.`
          )}
        </Text>
      </View>
      <View style={{ marginBottom: 8 }}>
        <Text style={[styles.text, { fontSize: 11, lineHeight: 1.4, textAlign: 'justify' }]}>
          En términos de tiempo efectivo, se registraron {formatHorasMinutos(cardData.totalDentro || 0)} de trabajo dentro de las áreas georreferenciadas y {formatHorasMinutos(cardData.totalFuera || 0)} fuera de las mismas, lo que representa un {cardData.totalDentro + cardData.totalFuera > 0 ? Math.round((cardData.totalDentro / (cardData.totalDentro + cardData.totalFuera)) * 100) : 0}% de tiempo efectivo en zona de trabajo.
        </Text>
      </View>
    </View>
  );
};
