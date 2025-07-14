import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
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
  headerSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
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

const Header = ({ municipalData, startDate, endDate }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>REPORTE MUNICIPAL</Text>
    <View style={styles.headerInfo}>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Municipio:</Text>{' '}{municipalData?.nombre_municipio || 'N/A'}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Estado:</Text>{' '}{municipalData?.nombre_estado || 'N/A'}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Fecha de generación:</Text>{' '}{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</Text>
      </View>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Período de análisis:</Text>{' '}{format(parseISO(startDate), 'dd/MM/yyyy', { locale: es })} al {format(parseISO(endDate), 'dd/MM/yyyy', { locale: es })}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Tipo de reporte:</Text>{' '}Análisis Municipal Completo</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Duración del período:</Text>{' '}{Math.ceil((parseISO(endDate) - parseISO(startDate)) / (1000 * 60 * 60 * 24))} días</Text>
      </View>
    </View>
  </View>
);

const SummarySection = ({ municipalStats }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Hospitales</Text>
        <Text style={styles.statValue}>{municipalStats?.totalHospitals || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Empleados Activos</Text>
        <Text style={styles.statValue}>{municipalStats?.activeEmployees || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Empleados</Text>
        <Text style={styles.statValue}>{municipalStats?.totalEmployees || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Horas Trabajadas</Text>
        <Text style={styles.statValue}>{municipalStats?.totalHoursWorked || 0}h</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Salidas de Geocerca</Text>
        <Text style={styles.statValue}>{municipalStats?.totalGeofenceExits || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Eficiencia Promedio</Text>
        <Text style={styles.statValue}>{municipalStats?.averageEfficiency || 0}%</Text>
      </View>
    </View>
  </View>
);

const HospitalTable = ({ hospitals }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Detalle de Hospitales</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellHeader, { flex: 3 }]}>Hospital</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Empleados</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Horas T.</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Salidas</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Eficiencia</Text>
      </View>
      {hospitals?.slice(0, 15).map((hospital, index) => (
        <View key={index} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#f8f9fa' }]}>
          <Text style={[styles.tableCell, { flex: 3 }]}>{hospital.name}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{hospital.employees}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{hospital.hoursWorked}h</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{hospital.geofenceExits}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{hospital.efficiency}%</Text>
        </View>
      ))}
      {hospitals?.length === 0 && (
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { textAlign: 'center', fontStyle: 'italic', color: '#6c757d' }]}>
            No hay datos de hospitales para mostrar
          </Text>
        </View>
      )}
    </View>
  </View>
);

const AnalysisSection = ({ hospitals, municipalStats }) => {
  const topHospitals = hospitals?.slice(0, 5).sort((a, b) => b.efficiency - a.efficiency) || [];
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Análisis de Rendimiento</Text>
      
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisSubtitle}>
          Top 5 Hospitales por Eficiencia:
        </Text>
        {topHospitals.length > 0 ? (
          topHospitals.map((hospital, index) => (
            <Text key={index} style={styles.analysisText}>
              {index + 1}. {hospital.name} - {hospital.efficiency}%
            </Text>
          ))
        ) : (
          <Text style={[styles.analysisText, { fontStyle: 'italic', color: '#6c757d' }]}>
            No hay datos de hospitales disponibles
          </Text>
        )}
      </View>
      
      <View style={[styles.analysisContainer, { marginTop: 8 }]}>
        <Text style={styles.analysisSubtitle}>
          Estadísticas Generales:
        </Text>
        <Text style={styles.analysisText}>
          • Promedio de empleados por hospital: {Math.round((municipalStats?.activeEmployees || 0) / Math.max(municipalStats?.totalHospitals || 1, 1))}
        </Text>
        <Text style={styles.analysisText}>
          • Horas promedio trabajadas: {Math.round((municipalStats?.totalHoursWorked || 0) / Math.max(municipalStats?.activeEmployees || 1, 1))}h por empleado
        </Text>
        <Text style={styles.analysisText}>
          • Salidas promedio por hospital: {Math.round((municipalStats?.totalGeofenceExits || 0) / Math.max(municipalStats?.totalHospitals || 1, 1))}
        </Text>
        <Text style={styles.analysisText}>
          • Tasa de eficiencia municipal: {municipalStats?.averageEfficiency || 0}%
        </Text>
      </View>
    </View>
  );
};

const ReportDocument = ({ municipalData, hospitals, municipalStats, startDate, endDate }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Header municipalData={municipalData} startDate={startDate} endDate={endDate} />
      <SummarySection municipalStats={municipalStats} />
      <AnalysisSection hospitals={hospitals} municipalStats={municipalStats} />
      <HospitalTable hospitals={hospitals} />
    </Page>
  </Document>
);

const generarReporteMunicipalPDF = async ({ municipalData, hospitals, municipalStats, startDate, endDate }) => {
  try {
    const MyDocument = () => (
      <ReportDocument 
        municipalData={municipalData}
        hospitals={hospitals}
        municipalStats={municipalStats}
        startDate={startDate}
        endDate={endDate}
      />
    );
    
    const blob = await pdf(<MyDocument />).toBlob();
    const filename = `reporte_municipal_${municipalData.nombre_municipio.replace(/ /g, '_')}_${municipalData.nombre_estado.replace(/ /g, '_')}_${format(parseISO(startDate), 'yyyy-MM-dd')}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF municipal generado exitosamente');
  } catch (error) {
    console.error('Error al generar PDF municipal:', error);
    throw error;
  }
};

// Componente React para usar en el dashboard
const MunicipalReportPDF = ({ municipalData, hospitals, municipalStats, startDate, endDate }) => {
  const handleGenerateReport = async () => {
    try {
      await generarReporteMunicipalPDF({
        municipalData,
        hospitals,
        municipalStats,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Error al generar reporte:', error);
    }
  };

  return (
    <button 
      onClick={handleGenerateReport}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
    >
      Generar Reporte PDF
    </button>
  );
};

// Exports
export default MunicipalReportPDF;
export { generarReporteMunicipalPDF };