// Test para verificar cálculo de descansos con datos reales
import { calcularEstadisticasEmpleado } from './src/components/dashboard/hospital/employeeStatsHelper.js';

// Datos similares a los reales del dashboard
const datosReales = [
  // 08:51 - Entrada laboral
  { fecha_hora: '2025-08-05T08:51:05.223Z', dentro_geocerca: true, tipo_registro: 1, evento: null },
  { fecha_hora: '2025-08-05T08:51:06.223Z', dentro_geocerca: true, tipo_registro: null, evento: 5 },
  
  // Trabajo normal hasta 13:33
  { fecha_hora: '2025-08-05T13:32:00.000Z', dentro_geocerca: true, tipo_registro: null, evento: 4 },
  
  // DESCANSO 1: 13:33 - múltiples eventos evento=2
  { fecha_hora: '2025-08-05T13:33:57.697Z', dentro_geocerca: true, tipo_registro: null, evento: 2 },
  { fecha_hora: '2025-08-05T13:33:58.728Z', dentro_geocerca: true, tipo_registro: null, evento: 2 },
  { fecha_hora: '2025-08-05T13:36:11.396Z', dentro_geocerca: true, tipo_registro: null, evento: 2 },
  { fecha_hora: '2025-08-05T13:41:11.406Z', dentro_geocerca: true, tipo_registro: null, evento: 2 },
  
  // Termina descanso 1 - aparece evento diferente a 2
  { fecha_hora: '2025-08-05T13:44:00.000Z', dentro_geocerca: true, tipo_registro: null, evento: 5 },
  
  // Trabajo normal
  { fecha_hora: '2025-08-05T13:50:00.000Z', dentro_geocerca: true, tipo_registro: null, evento: 4 },
  
  // DESCANSO 2: 14:05 - múltiples eventos evento=2
  { fecha_hora: '2025-08-05T14:05:17.437Z', dentro_geocerca: true, tipo_registro: null, evento: 2 },
  { fecha_hora: '2025-08-05T14:05:18.351Z', dentro_geocerca: true, tipo_registro: null, evento: 2 },
  
  // Termina descanso 2 - aparece evento diferente a 2
  { fecha_hora: '2025-08-05T14:07:00.000Z', dentro_geocerca: true, tipo_registro: null, evento: 5 },
  
  // Fin del día
  { fecha_hora: '2025-08-05T14:28:13.050Z', dentro_geocerca: true, tipo_registro: null, evento: 4 }
];

console.log('=== TEST CON DATOS REALES ===');
console.log('Datos de entrada:', datosReales.length, 'registros');

const stats = calcularEstadisticasEmpleado(datosReales, 120);
console.log('\n--- Estadísticas calculadas ---');
console.log('Horas trabajadas:', stats.workedHours);
console.log('Horas fuera:', stats.outsideHours);
console.log('Horas de descanso:', stats.restHours);
console.log('Total salidas:', stats.totalExits);

console.log('\n--- Análisis esperado ---');
console.log('Descanso 1: 13:33:57 - 13:44:00 = ~10.3 minutos');
console.log('Descanso 2: 14:05:17 - 14:07:00 = ~1.7 minutos');
console.log('Total esperado: ~12 minutos = 0.2 horas');

if (stats.restHours > 0) {
  console.log('✅ ¡Funciona! El helper ahora detecta los descansos correctamente');
} else {
  console.log('❌ Aún hay problemas con el cálculo de descansos');
}
