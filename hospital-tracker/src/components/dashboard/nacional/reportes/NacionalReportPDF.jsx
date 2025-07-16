import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    backgroundColor: '#21996f',
    color: 'white',
    padding: 14,
    marginBottom: 14,
    borderRadius: 7,
    boxShadow: '0 1px 4px #0001',
    border: '1px solid #198754',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    marginTop: 0,
    gap: 8,
    borderTop: '2px solid #157347',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: '1 1 48%',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    border: '1px solid #dee2e6',
  },
  statLabel: {
    fontSize: 9,
    color: '#6c757d',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 11,
    fontWeight: 'bold',
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
    fontSize: 9,
    padding: 2,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 2,
    color: 'white',
  },
  analysisContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    border: '1px solid #dee2e6',
  },
  analysisSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#198754',
  },
  analysisText: {
    fontSize: 9,
    marginBottom: 2,
    color: '#495057',
  },
});

const Header = ({ dateRange }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>REPORTE NACIONAL</Text>
    <View style={styles.headerInfo}>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Fecha de generación:</Text>{' '}{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</Text>
      </View>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Período de análisis:</Text>{' '}{format(parseISO(dateRange.startDate), 'dd/MM/yyyy', { locale: es })} al {format(parseISO(dateRange.endDate), 'dd/MM/yyyy', { locale: es })}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Tipo de reporte:</Text>{' '}Análisis Nacional Completo</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Duración del período:</Text>{' '}{Math.ceil((parseISO(dateRange.endDate) - parseISO(dateRange.startDate)) / (1000 * 60 * 60 * 24))} días</Text>
      </View>
    </View>
  </View>
);

const SummarySection = ({ totalStats }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Hospitales</Text>
        <Text style={styles.statValue}>{totalStats?.hospitals || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Empleados</Text>
        <Text style={styles.statValue}>{totalStats?.employees || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Salidas de Geocerca</Text>
        <Text style={styles.statValue}>{totalStats?.totalExits || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Horas Trabajadas</Text>
        <Text style={styles.statValue}>{totalStats?.totalHours || 0}</Text>
      </View>
    </View>
  </View>
);

const StatesTable = ({ stateData }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Detalle por Estado</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellHeader, { flex: 2 }]}>Estado</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Hospitales</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Empleados</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Salidas</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Horas</Text>
      </View>
      {stateData?.length > 0 ? stateData.map((s, i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 1 && { backgroundColor: '#f8f9fa' }] }>
          <Text style={[styles.tableCell, { flex: 2 }]}>{s.stateName || s.state}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{s.hospitals ?? '-'}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{s.employees ?? '-'}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{s.geofenceExits ?? '-'}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{s.hoursWorked ?? '-'}</Text>
        </View>
      )) : (
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { textAlign: 'center', fontStyle: 'italic', color: '#6c757d', flex: 1 }]}>No hay datos de estados para mostrar</Text>
        </View>
      )}
    </View>
  </View>
);

const AnalysisSection = ({ totalStats, stateData }) => {
  // Top 5 estados por eficiencia (definida como salidas/empleados)
  // Eficiencia: % de empleados que marcaron al menos una salida (máx 100%)
  const topStates = [...(stateData || [])]
    .filter(s => s.employees > 0 && Array.isArray(s.employeeRecords))
    .map(s => {
      // Suponiendo que s.employeeRecords es un array de empleados con sus registros
      // Si no existe, fallback a geofenceExits/employees como antes
      let efficiency = 0;
      if (Array.isArray(s.employeeRecords) && s.employeeRecords.length > 0) {
        const empleadosConSalida = s.employeeRecords.filter(emp => Array.isArray(emp.registros) && emp.registros.some(r => r.tipo_registro === 0)).length;
        efficiency = (empleadosConSalida / s.employeeRecords.length) * 100;
      } else if (s.geofenceExits && s.employees) {
        // Fallback: si no hay registros individuales, usar la métrica anterior pero limitada a 100%
        efficiency = Math.min(100, (s.geofenceExits / s.employees) * 100);
      }
      return { ...s, efficiency: efficiency.toFixed(1) };
    })
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Análisis de Rendimiento</Text>
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisSubtitle}>Top 5 Estados por Eficiencia (Salidas/Empleado):</Text>
        {topStates.length > 0 ? (
          topStates.map((state, index) => (
            <Text key={index} style={styles.analysisText}>
              {index + 1}. {state.stateName || state.state} - {state.efficiency}%
            </Text>
          ))
        ) : (
          <Text style={[styles.analysisText, { fontStyle: 'italic', color: '#6c757d' }]}>No hay datos de estados disponibles</Text>
        )}
      </View>
      <View style={[styles.analysisContainer, { marginTop: 8 }] }>
        <Text style={styles.analysisSubtitle}>Estadísticas Generales:</Text>
        <Text style={styles.analysisText}>
          • Promedio de empleados por hospital: {totalStats?.hospitals > 0 ? Math.round(totalStats.employees / totalStats.hospitals) : 0}
        </Text>
        <Text style={styles.analysisText}>
          • Horas promedio trabajadas: {totalStats?.employees > 0 ? Math.round(totalStats.totalHours / totalStats.employees) : 0}h por empleado
        </Text>
        <Text style={styles.analysisText}>
          • Salidas promedio por hospital: {totalStats?.hospitals > 0 ? Math.round(totalStats.totalExits / totalStats.hospitals) : 0}
        </Text>
      </View>
    </View>
  );
};
export async function generarReporteNacionalPDF({ dateRange, totalStats, stateData }) {
  const MyDocument = () => (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header dateRange={dateRange} />
        <SummarySection totalStats={totalStats} />
        <AnalysisSection totalStats={totalStats} stateData={stateData} />
        <StatesTable stateData={stateData} />
      </Page>
    </Document>
  );

  const blob = await pdf(<MyDocument />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte_Nacional_${dateRange.startDate}_a_${dateRange.endDate}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
