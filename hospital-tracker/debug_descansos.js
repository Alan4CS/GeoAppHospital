// Test para verificar cálculo de descansos
import { calcularEstadisticasEmpleado, generarResumenDiaMejorado } from './src/components/dashboard/hospital/employeeStatsHelper.js';

// Datos de ejemplo basados en la imagen mostrada
const datosEjemplo = [
  // 08:51 - Marcó entrada laboral
  { 
    fecha_hora: '2025-08-05T08:51:00.000Z', 
    dentro_geocerca: true, 
    tipo_registro: 1, 
    evento: 1 
  },
  
  // 09:57 - Marcó salida laboral
  { 
    fecha_hora: '2025-08-05T09:57:00.000Z', 
    dentro_geocerca: true, 
    tipo_registro: 0, 
    evento: 0 
  },
  
  // 12:21 - Marcó entrada laboral
  { 
    fecha_hora: '2025-08-05T12:21:00.000Z', 
    dentro_geocerca: true, 
    tipo_registro: 1, 
    evento: 1 
  },
  
  // 13:33 - Inicio de descanso
  { 
    fecha_hora: '2025-08-05T13:33:00.000Z', 
    dentro_geocerca: true, 
    evento: 2 
  },
  
  // 13:44 - Termino descanso (registro sin evento=2)
  { 
    fecha_hora: '2025-08-05T13:44:00.000Z', 
    dentro_geocerca: true, 
    evento: 5 // activo
  },
  
  // 13:52 - Marcó salida laboral
  { 
    fecha_hora: '2025-08-05T13:52:00.000Z', 
    dentro_geocerca: true, 
    tipo_registro: 0, 
    evento: 0 
  },
  
  // 14:03 - Marcó entrada laboral
  { 
    fecha_hora: '2025-08-05T14:03:00.000Z', 
    dentro_geocerca: true, 
    tipo_registro: 1, 
    evento: 1 
  },
  
  // 14:05 - Inicio de descanso
  { 
    fecha_hora: '2025-08-05T14:05:00.000Z', 
    dentro_geocerca: true, 
    evento: 2 
  },
  
  // 14:07 - Termino descanso
  { 
    fecha_hora: '2025-08-05T14:07:00.000Z', 
    dentro_geocerca: true, 
    evento: 5 // activo
  },
  
  // 14:28 - Fin del día (último registro)
  { 
    fecha_hora: '2025-08-05T14:28:00.000Z', 
    dentro_geocerca: true, 
    evento: 4 // inactivo
  }
];

console.log('=== TEST DE CÁLCULO DE DESCANSOS ===');
console.log('Datos de entrada:', datosEjemplo.length, 'registros');

// Test 1: Calcular estadísticas
const stats = calcularEstadisticasEmpleado(datosEjemplo, 120);
console.log('\n--- Estadísticas calculadas ---');
console.log('Horas trabajadas:', stats.workedHours);
console.log('Horas fuera:', stats.outsideHours);
console.log('Horas de descanso:', stats.restHours, '(debería ser ~0.18h = 11min)');
console.log('Total salidas:', stats.totalExits);

// Test 2: Generar resumen del día
const resumen = generarResumenDiaMejorado(datosEjemplo);
console.log('\n--- Resumen del día ---');
resumen.forEach(evento => {
  console.log(`${evento.hora} - ${evento.descripcion} ${evento.duracion || ''}`);
});

// Test 3: Verificar cálculos manuales
console.log('\n--- Verificación manual ---');
console.log('Descanso 1: 13:33 - 13:44 = 11 minutos');
console.log('Descanso 2: 14:05 - 14:07 = 2 minutos');
console.log('Total esperado: 13 minutos = 0.217 horas');
