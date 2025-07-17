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
    lineHeight: 1.4,
  },
  recommendationsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    border: '2px solid #1976d2',
    marginTop: 10,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 6,
    textAlign: 'center',
  },
  recommendationText: {
    fontSize: 9,
    marginBottom: 3,
    color: '#0d47a1',
    lineHeight: 1.3,
  },
  alertContainer: {
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
    border: '1px solid #ff9800',
    marginTop: 8,
  },
  alertTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 9,
    color: '#bf360c',
    lineHeight: 1.3,
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

const SummarySection = ({ estatalStats, municipios }) => {
  // Calcular métricas avanzadas
  const totalHospitales = estatalStats?.totalHospitales || 0;
  const totalEmpleados = estatalStats?.totalEmpleados || 0;
  const totalMunicipios = estatalStats?.totalMunicipios || 0;
  const totalHoras = estatalStats?.totalHoras || 0;
  const totalSalidas = estatalStats?.totalSalidas || 0;
  
  const promedioEmpleadosPorHospital = totalHospitales > 0 ? Math.round(totalEmpleados / totalHospitales) : 0;
  const promedioHospitalesPorMunicipio = totalMunicipios > 0 ? Math.round(totalHospitales / totalMunicipios) : 0;
  const promedioHorasPorEmpleado = totalEmpleados > 0 ? Math.round(totalHoras / totalEmpleados) : 0;
  // Eliminado ratioSalidasHoras
  
  // Métricas de eficiencia operativa (corregidas)
  const eficienciaOperativa = totalHoras > 0 && totalSalidas > 0 ? 
    ((totalSalidas / totalHoras) * 100).toFixed(1) : '0.0';
  const densidadEmpleados = totalMunicipios > 0 ? (totalEmpleados / totalMunicipios).toFixed(1) : 0;
  const tasaCobertura = totalMunicipios > 0 ? ((municipios?.length || 0) / totalMunicipios * 100).toFixed(1) : 0;
  
  // Índice de retención (horas trabajadas vs salidas - mayor es mejor)
  const indiceRetencion = totalSalidas > 0 ? (totalHoras / totalSalidas).toFixed(1) : 'N/A';
  
  // Productividad general
  const productividadGeneral = totalEmpleados > 0 ? 
    ((totalHoras + totalSalidas) / totalEmpleados).toFixed(1) : '0.0';
  
  // Debug: Verificar cómo se calculan las horas en el resumen
  if (municipios && municipios.length > 0) {
    const horasMunicipios = municipios.map(m => ({
      municipio: m.municipio || m.nombre_municipio,
      horas: m.horas,
      hoursWorked: m.hoursWorked
    }));
    console.log('[PDF] [SummarySection] Horas por municipio:', horasMunicipios);
  }
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Resumen Ejecutivo Estatal</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Hospitales</Text>
          <Text style={styles.statValue}>{totalHospitales}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Empleados</Text>
          <Text style={styles.statValue}>{totalEmpleados}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Municipios Activos</Text>
          <Text style={styles.statValue}>{totalMunicipios}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Horas Trabajadas</Text>
          <Text style={styles.statValue}>{totalHoras.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Salidas de Geocerca</Text>
          <Text style={styles.statValue}>{totalSalidas.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Empleados por Hospital</Text>
          <Text style={styles.statValue}>{promedioEmpleadosPorHospital}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Hospitales por Municipio</Text>
          <Text style={styles.statValue}>{promedioHospitalesPorMunicipio}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tasa de Movilidad</Text>
          <Text style={styles.statValue}>{eficienciaOperativa}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Densidad de Personal</Text>
          <Text style={styles.statValue}>{densidadEmpleados} emp/mun</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cobertura Municipal</Text>
          <Text style={styles.statValue}>{tasaCobertura}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Índice de Retención</Text>
          <Text style={styles.statValue}>{indiceRetencion} hrs/salida</Text>
        </View>
      </View>
    </View>
  );
};

const MunicipalTable = ({ municipios }) => {
  // Aceptar datos tal como vienen del endpoint, sin filtrar por nombre de municipio
  const municipiosOrdenados = (municipios && Array.isArray(municipios))
    ? municipios
        .filter(m => typeof m === 'object' && m != null && (m.municipio || m.nombre_municipio))
        .sort((a, b) => (b.actividadTotal || (b.hoursWorked + b.geofenceExits)) - (a.actividadTotal || (a.hoursWorked + a.geofenceExits)))
    : [];

  // Debug: Mostrar cómo se usan las horas en la tabla municipal
  if (municipiosOrdenados.length > 0) {
    const horasTabla = municipiosOrdenados.map(m => ({
      municipio: m.municipio || m.nombre_municipio,
      horas: m.horas,
      hoursWorked: m.hoursWorked
    }));
    console.log('[PDF] [MunicipalTable] Horas mostradas en tabla:', horasTabla);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Análisis Municipal Detallado</Text>
      <Text style={[styles.analysisText, { marginBottom: 8, fontStyle: 'italic' }]}>
        Municipios ordenados por actividad total (horas trabajadas + salidas de geocerca). 
        Métricas calculadas automáticamente por el sistema.
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { flex: 0.6 }]}>Pos</Text>
          <Text style={[styles.tableCellHeader, { flex: 2 }]}>Municipio</Text>
          <Text style={[styles.tableCellHeader, { flex: 0.8, textAlign: 'center' }]}>Hospitales</Text>
          <Text style={[styles.tableCellHeader, { flex: 0.8, textAlign: 'center' }]}>Empleados</Text>
          <Text style={[styles.tableCellHeader, { flex: 1 }]}>Horas</Text>
          <Text style={[styles.tableCellHeader, { flex: 1 }]}>Salidas</Text>
          {/* Columna eficiencia eliminada */}
          <Text style={[styles.tableCellHeader, { flex: 1 }]}>Índice de Actividad</Text>
        </View>
        {municipiosOrdenados.slice(0, 20).map((municipio, index) => {
          return (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#f8f9fa' }]}> 
              <Text style={[styles.tableCell, { flex: 0.6, textAlign: 'center', fontWeight: 'bold' }]}> 
                {index + 1}
              </Text>
              <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}> 
                {(municipio.municipio || municipio.nombre_municipio || municipio.municipality || 'N/A').substring(0, 20)}
              </Text>
              <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}> 
                {municipio.hospitals ?? municipio.hospitales ?? ''}
              </Text>
              <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}> 
                {municipio.employees ?? municipio.empleados ?? ''}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}> 
                {(municipio.hoursWorked ?? municipio.horas ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}> 
                {(municipio.geofenceExits ?? municipio.salidas ?? 0).toLocaleString()}
              </Text>
              {/* Celda eficiencia eliminada */}
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}> 
                {municipio.indiceActividad ?? ''}
              </Text>
            </View>
          );
        })}
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
};

const HospitalRankingTable = ({ hospitales }) => {
  // Calcular métricas adicionales para los hospitales
  const hospitalesConMetricas = hospitales?.map((hospital, index) => {
    const salidas = hospital.salidas || hospital.geofenceExits || hospital.exits || hospital.totalSalidas || 0;
    const empleados = hospital.empleados || hospital.employees || 0;
    const horasTrabajas = hospital.horas_trabajadas || hospital.hoursWorked || 0;
    const categoria = salidas > 100 ? 'Alto' : salidas > 50 ? 'Medio' : 'Bajo';
    return {
      ...hospital,
      salidas,
      empleados,
      horasTrabajas,
      // eficiencia eliminada
      categoria,
      posicion: index + 1
    };
  }).sort((a, b) => b.salidas - a.salidas) || [];

  // Mostrar la tabla aunque todos tengan salidas en cero
  if (!hospitales || hospitales.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hospitales ordenados por salidas de geocerca</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 0.5 }]}>Pos</Text>
            <Text style={[styles.tableCellHeader, { flex: 2.2 }]}>Hospital</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.3 }]}>Municipio</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Empl.</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Salidas</Text>
            {/* <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Efic.</Text> */}
            <Text style={[styles.tableCellHeader, { flex: 0.6 }]}>Cat.</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontStyle: 'italic', color: '#6c757d' }]}>No hay hospitales registrados para mostrar</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hospitales ordenados por salidas de geocerca</Text>
      <Text style={[styles.analysisText, { marginBottom: 8, fontStyle: 'italic' }]}> 
        Top 15 hospitales ordenados por salidas de geocerca.
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, { flex: 0.5 }]}>Pos</Text>
          <Text style={[styles.tableCellHeader, { flex: 2.2 }]}>Hospital</Text>
          <Text style={[styles.tableCellHeader, { flex: 1.3 }]}>Municipio</Text>
          <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Empleados</Text>
          <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Salidas</Text>
          {/* <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>Efic.</Text> */}
          <Text style={[styles.tableCellHeader, { flex: 0.6 }]}>Categoría</Text>
        </View>
      {hospitalesConMetricas.slice(0, 15).map((hospital, index) => {
        const posicion = index + 1;
        const categoriaColor = hospital.categoria === 'Alto' ? 'Alto' : hospital.categoria === 'Medio' ? 'Medio' : 'Bajo';
        return (
          <View key={index} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#f8f9fa' }]}>
            <Text style={[styles.tableCell, { flex: 0.5, textAlign: 'center', fontSize: 11 }]}>
              {posicion}
            </Text>
            <Text style={[styles.tableCell, { flex: 2.2, fontSize: 8 }]}>
              {(hospital.nombre_hospital || hospital.hospital || hospital.name || 'Hospital sin nombre').substring(0, 25)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1.3, fontSize: 8 }]}>
              {(hospital.municipio || hospital.nombre_municipio || hospital.municipality || 'N/A').substring(0, 12)}
            </Text>
            <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center', fontSize: 9 }]}>
              {hospital.empleados}
            </Text>
            <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center', fontWeight: 'bold', fontSize: 9 }]}>
              {hospital.salidas.toLocaleString()}
            </Text>
            {/* <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center', fontSize: 9 }]}> 
              {hospital.eficiencia}
            </Text> */}
            <Text style={[styles.tableCell, { flex: 0.6, textAlign: 'center', fontSize: 8 }]}>
              {categoriaColor}
            </Text>
          </View>
        );
      })}
      </View>
    </View>
  );
};

const AlertSection = ({ estatalStats, municipios, hospitales }) => {
  const totalHospitales = estatalStats?.totalHospitales || 0;
  const totalEmpleados = estatalStats?.totalEmpleados || 0;
  const totalMunicipios = estatalStats?.totalMunicipios || 0;
  const municipiosConDatos = municipios?.length || 0;
  const hospitalesConDatos = hospitales?.length || 0;

  // Detectar problemas críticos
  const problemasDetectados = [];
  
  if (totalEmpleados === 0) {
    problemasDetectados.push("No hay empleados registrados en el sistema");
  }
  
  if (totalHospitales === 0) {
    problemasDetectados.push("No hay hospitales activos reportando datos");
  }
  
  if (municipiosConDatos < 3) {
    problemasDetectados.push(`Solo ${municipiosConDatos} municipio(s) con datos activos de ${totalMunicipios} total`);
  }
  
  if (hospitalesConDatos === 0) {
    problemasDetectados.push("Ningún hospital está proporcionando datos de personal");
  }

  const coberturaPublica = totalMunicipios > 0 ? ((municipiosConDatos / totalMunicipios) * 100).toFixed(1) : 0;
  
  if (parseFloat(coberturaPublica) < 50) {
    problemasDetectados.push(`Cobertura estatal crítica: solo ${coberturaPublica}% de municipios reportan`);
  }

  if (problemasDetectados.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ALERTAS Y PROBLEMAS DETECTADOS</Text>
      
      <View style={styles.alertContainer}>
        <Text style={styles.alertTitle}>Situación Crítica del Sistema</Text>
        <Text style={styles.alertText}>
          Se han detectado {problemasDetectados.length} problema(s) que requieren atención inmediata:
        </Text>
        
        {problemasDetectados.map((problema, index) => (
          <Text key={index} style={[styles.alertText, { marginTop: 4, marginLeft: 10 }]}>
            • {problema}
          </Text>
        ))}
        
        <Text style={[styles.alertText, { marginTop: 8, fontWeight: 'bold' }]}>
          ACCIONES REQUERIDAS:
        </Text>
        <Text style={[styles.alertText, { marginLeft: 10 }]}>
          • Verificar conectividad de hospitales al sistema
        </Text>
        <Text style={[styles.alertText, { marginLeft: 10 }]}>
          • Revisar registro de empleados en la plataforma
        </Text>
        <Text style={[styles.alertText, { marginLeft: 10 }]}>
          • Contactar municipios sin datos para activar el sistema
        </Text>
        <Text style={[styles.alertText, { marginLeft: 10 }]}>
          • Capacitar personal en el uso correcto de geocercas
        </Text>
      </View>

      <View style={[styles.analysisContainer, { marginTop: 8 }]}>
        <Text style={styles.analysisSubtitle}>Interpretación para Autoridades</Text>
        <Text style={styles.analysisText}>
          Este reporte indica que el sistema de monitoreo de personal de salud en {estatalStats?.nombre_estado || 'el estado'} 
          está en una fase inicial de implementación o presenta fallas técnicas significativas.
        </Text>
        <Text style={styles.analysisText}>
          La ausencia de datos de empleados y hospitales sugiere que:
        </Text>
        <Text style={[styles.analysisText, { marginLeft: 10 }]}>
          • El personal no está utilizando correctamente el sistema de geocercas
        </Text>
        <Text style={[styles.analysisText, { marginLeft: 10 }]}>
          • Los hospitales requieren capacitación técnica
        </Text>
        <Text style={[styles.analysisText, { marginLeft: 10 }]}>
          • Es necesaria una auditoría del sistema de monitoreo
        </Text>
        <Text style={[styles.analysisText, { marginLeft: 10 }]}>
          • Se requiere un plan de implementación gradual por municipios
        </Text>
      </View>
    </View>
  );
};

const ReportDocument = ({ estatalData, municipios, hospitales, estatalStats, startDate, endDate }) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Header estatalData={estatalData} startDate={startDate} endDate={endDate} />
      <AlertSection estatalStats={estatalStats} municipios={municipios} hospitales={hospitales} />
      <SummarySection estatalStats={estatalStats} municipios={municipios} />
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
    } else {
      console.log('[EstatalPDF] ⚠️ NO HAY DATOS DE HOSPITALES');
    }
    
    if (municipios && municipios.length > 0) {
      console.log('[EstatalPDF] Primer municipio ejemplo:', municipios[0]);
      console.log('[EstatalPDF] Propiedades del primer municipio:', Object.keys(municipios[0]));
      
      // Verificar específicamente los campos de horas y salidas
      const primerMunicipio = municipios[0];
      console.log('[EstatalPDF] Campos de actividad del primer municipio:', {
        horas: primerMunicipio.horas,
        hoursWorked: primerMunicipio.hoursWorked,
        salidas: primerMunicipio.salidas,
        geofenceExits: primerMunicipio.geofenceExits,
        hospitals: primerMunicipio.hospitals,
        employees: primerMunicipio.employees
      });
    } else {
      console.log('[EstatalPDF] ⚠️ NO HAY DATOS DE MUNICIPIOS');
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
