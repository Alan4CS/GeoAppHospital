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

const Header = ({ estatalData, startDate, endDate }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>REPORTE ESTATAL</Text>
    <View style={styles.headerInfo}>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Estado:</Text>{' '}{estatalData?.nombre_estado || 'N/A'}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Fecha de generación:</Text>{' '}{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Total municipios:</Text>{' '}{estatalData?.totalMunicipios || 0}</Text>
      </View>
      <View style={styles.headerColumn}>
        <Text><Text style={{ fontWeight: 'bold' }}>Período de análisis:</Text>{' '}{format(parseISO(startDate), 'dd/MM/yyyy', { locale: es })} al {format(parseISO(endDate), 'dd/MM/yyyy', { locale: es })}</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Tipo de reporte:</Text>{' '}Análisis Estatal Completo</Text>
        <Text><Text style={{ fontWeight: 'bold' }}>Duración del período:</Text>{' '}{Math.ceil((parseISO(endDate) - parseISO(startDate)) / (1000 * 60 * 60 * 24))} días</Text>
      </View>
    </View>
  </View>
);

const SummarySection = ({ estatalStats }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Resumen Ejecutivo Estatal</Text>
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Hospitales</Text>
        <Text style={styles.statValue}>{estatalStats?.totalHospitales || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Empleados</Text>
        <Text style={styles.statValue}>{estatalStats?.totalEmpleados || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Municipios</Text>
        <Text style={styles.statValue}>{estatalStats?.totalMunicipios || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Registros de Entrada</Text>
        <Text style={styles.statValue}>{estatalStats?.totalHoras || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Salidas de Geocerca</Text>
        <Text style={styles.statValue}>{estatalStats?.totalSalidas || 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Eficiencia Promedio</Text>
        <Text style={styles.statValue}>{estatalStats?.eficienciaPromedio || 0}%</Text>
      </View>
    </View>
  </View>
);

const MunicipalTable = ({ municipios }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Detalle por Municipios</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellHeader, { flex: 3 }]}>Municipio</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Hospitales</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Empleados</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Entradas</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Salidas</Text>
      </View>
      {municipios?.slice(0, 20).map((municipio, index) => (
        <View key={index} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#f8f9fa' }]}>
          <Text style={[styles.tableCell, { flex: 3 }]}>
            {municipio.municipio || municipio.nombre_municipio || municipio.municipality || 'N/A'}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {municipio.hospitals || municipio.hospitales || municipio.totalHospitales || 0}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {municipio.employees || municipio.empleados || municipio.totalEmpleados || 0}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {municipio.hoursWorked || municipio.horas || municipio.totalHoras || municipio.hours || 0}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {municipio.geofenceExits || municipio.salidas || municipio.totalSalidas || municipio.exits || 0}
          </Text>
        </View>
      ))}
      {(!municipios || municipios.length === 0) && (
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { textAlign: 'center', fontStyle: 'italic', color: '#6c757d', flex: 1 }]}>
            No hay datos de municipios para mostrar
          </Text>
        </View>
      )}
    </View>
  </View>
);

const HospitalRankingTable = ({ hospitales }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Ranking de Hospitales por Salidas de Geocerca</Text>
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Pos.</Text>
        <Text style={[styles.tableCellHeader, { flex: 4 }]}>Hospital</Text>
        <Text style={[styles.tableCellHeader, { flex: 2 }]}>Municipio</Text>
        <Text style={[styles.tableCellHeader, { flex: 1 }]}>Salidas</Text>
      </View>
      {hospitales?.slice(0, 15).map((hospital, index) => (
        <View key={index} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#f8f9fa' }]}>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{index + 1}</Text>
          <Text style={[styles.tableCell, { flex: 4 }]}>
            {hospital.nombre_hospital || hospital.hospital || hospital.name || 'Hospital sin nombre'}
          </Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>
            {hospital.municipio || hospital.nombre_municipio || hospital.municipality || 'Municipio no disponible'}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {hospital.salidas || hospital.geofenceExits || hospital.exits || hospital.totalSalidas || 0}
          </Text>
        </View>
      ))}
      {(!hospitales || hospitales.length === 0) && (
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { textAlign: 'center', fontStyle: 'italic', color: '#6c757d', flex: 1 }]}>
            No hay datos de hospitales para mostrar
          </Text>
        </View>
      )}
    </View>
  </View>
);

const AnalysisSection = ({ municipios, hospitales, estatalStats }) => {
  // Asegurar que tenemos datos para procesar
  const municipiosValidos = municipios?.filter(m => m && (m.municipio || m.nombre_municipio)) || [];
  const sortedMunicipios = municipiosValidos
    .sort((a, b) => {
      const salidasA = a.geofenceExits || a.salidas || a.totalSalidas || a.exits || 0;
      const salidasB = b.geofenceExits || b.salidas || b.totalSalidas || b.exits || 0;
      return salidasB - salidasA;
    })
    .slice(0, 5);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Análisis de Rendimiento Estatal</Text>
      
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisSubtitle}>
          Top 5 Municipios por Salidas de Geocerca:
        </Text>
        {sortedMunicipios.length > 0 ? (
          sortedMunicipios.map((municipio, index) => {
            const nombre = municipio.municipio || municipio.nombre_municipio || 'N/A';
            const salidas = municipio.geofenceExits || municipio.salidas || municipio.totalSalidas || municipio.exits || 0;
            return (
              <Text key={index} style={styles.analysisText}>
                {index + 1}. {nombre} - {salidas} salidas
              </Text>
            );
          })
        ) : (
          <Text style={[styles.analysisText, { fontStyle: 'italic', color: '#6c757d' }]}>
            No hay datos de municipios disponibles
          </Text>
        )}
      </View>
      
      <View style={[styles.analysisContainer, { marginTop: 8 }]}>
        <Text style={styles.analysisSubtitle}>
          Estadísticas Generales del Estado:
        </Text>
        <Text style={styles.analysisText}>
          • Promedio de hospitales por municipio: {Math.round((estatalStats?.totalHospitales || 0) / Math.max(estatalStats?.totalMunicipios || 1, 1))}
        </Text>
        <Text style={styles.analysisText}>
          • Promedio de empleados por hospital: {Math.round((estatalStats?.totalEmpleados || 0) / Math.max(estatalStats?.totalHospitales || 1, 1))}
        </Text>
        <Text style={styles.analysisText}>
          • Total de registros de entrada: {estatalStats?.totalHoras || 0}
        </Text>
        <Text style={styles.analysisText}>
          • Total de salidas de geocerca: {estatalStats?.totalSalidas || 0}
        </Text>
        <Text style={styles.analysisText}>
          • Cobertura municipal: {estatalStats?.totalMunicipios || 0} municipios con servicios
        </Text>
        <Text style={styles.analysisText}>
          • Hospitales registrados: {hospitales?.length || 0} hospitales en el ranking
        </Text>
      </View>
    </View>
  );
};

const ReportDocument = ({ estatalData, municipios, hospitales, estatalStats, startDate, endDate }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Header estatalData={estatalData} startDate={startDate} endDate={endDate} />
      <SummarySection estatalStats={estatalStats} />
      <AnalysisSection municipios={municipios} hospitales={hospitales} estatalStats={estatalStats} />
      <MunicipalTable municipios={municipios} />
      <HospitalRankingTable hospitales={hospitales} />
    </Page>
  </Document>
);

const generarReporteEstatalPDF = async ({ estatalData, municipios, hospitales, estatalStats, startDate, endDate }) => {
  try {
    // Debug logs para verificar los datos recibidos
    console.log('[EstatalPDF] Datos recibidos:', {
      estatalData,
      municipios: municipios?.length || 0,
      hospitales: hospitales?.length || 0,
      estatalStats,
      dateRange: { startDate, endDate }
    });

    // Debug detallado de la estructura de datos
    console.log('[EstatalPDF] Estructura detallada de municipios:', municipios);
    console.log('[EstatalPDF] Estructura detallada de hospitales:', hospitales);
    
    if (hospitales && hospitales.length > 0) {
      console.log('[EstatalPDF] Primer hospital ejemplo:', hospitales[0]);
      console.log('[EstatalPDF] Propiedades del primer hospital:', Object.keys(hospitales[0]));
    }
    
    if (municipios && municipios.length > 0) {
      console.log('[EstatalPDF] Primer municipio ejemplo:', municipios[0]);
      console.log('[EstatalPDF] Propiedades del primer municipio:', Object.keys(municipios[0]));
    }

    const MyDocument = () => (
      <ReportDocument 
        estatalData={estatalData}
        municipios={municipios}
        hospitales={hospitales}
        estatalStats={estatalStats}
        startDate={startDate}
        endDate={endDate}
      />
    );
    
    const blob = await pdf(<MyDocument />).toBlob();
    const estadoNombre = estatalData?.nombre_estado || 'Estado';
    const filename = `reporte_estatal_${estadoNombre.replace(/ /g, '_')}_${format(parseISO(startDate), 'yyyy-MM-dd')}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('PDF estatal generado exitosamente');
  } catch (error) {
    console.error('Error al generar PDF estatal:', error);
    throw error;
  }
};

// Componente React para usar en el dashboard
const EstatalReportPDF = ({ estatalData, municipios, hospitales, estatalStats, startDate, endDate }) => {
  const handleGenerateReport = async () => {
    try {
      await generarReporteEstatalPDF({
        estatalData,
        municipios,
        hospitales,
        estatalStats,
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
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Generar Reporte PDF
    </button>
  );
};

export default EstatalReportPDF;
export { generarReporteEstatalPDF };
