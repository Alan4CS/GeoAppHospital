// Script para analizar los eventos que existen en los datos reales
import { calcularEstadisticasEmpleado, generarResumenDiaMejorado } from './hospital-tracker/src/components/dashboard/hospital/employeeStatsHelper.js';

// Mismos datos del test
const rawData = `1590,179,21.0983224,-86.8608036,2025-08-05 08:51:05.223000,true,1,
1591,179,21.0983368,-86.8607835,2025-08-05 08:51:46.359000,true,1,5
1592,179,21.098323,-86.8608048,2025-08-05 08:52:07.758000,true,1,4
1593,179,21.098327,-86.8608007,2025-08-05 08:55:57.720000,true,1,4
1594,179,21.0983242,-86.8607972,2025-08-05 09:00:57.738000,true,1,4
1595,179,21.0983262,-86.8607982,2025-08-05 09:05:57.742000,true,1,4
1596,179,21.0983232,-86.8608019,2025-08-05 09:10:57.727000,true,1,4
1597,179,21.0983782,-86.8607489,2025-08-05 09:15:57.719000,true,1,4
1598,179,21.0983237,-86.8608031,2025-08-05 09:20:57.726000,true,1,4
1599,179,21.0983175,-86.8608044,2025-08-05 09:23:29.668000,true,1,5
1600,179,21.0983213,-86.860767,2025-08-05 09:54:51.091000,true,1,4
1601,179,21.0983329,-86.8607923,2025-08-05 09:54:41.201000,true,1,4
1602,179,21.0983233,-86.8608011,2025-08-05 09:54:41.207000,true,1,4
1603,179,21.0983329,-86.8607923,2025-08-05 09:54:37.676000,true,1,5
1604,179,21.0983233,-86.8608011,2025-08-05 09:54:47.511000,true,1,4
1605,179,21.0983213,-86.860767,2025-08-05 09:54:52.478000,true,1,5
1606,179,21.0983213,-86.860767,2025-08-05 09:54:42.341000,true,1,5
1607,179,21.0983233,-86.8608011,2025-08-05 09:56:04.711000,true,1,5
1608,179,21.0983233,-86.8608011,2025-08-05 09:54:47.511000,true,1,4
1609,179,21.0983389,-86.8607812,2025-08-05 09:57:06.292000,true,1,4
1610,179,21.0983389,-86.8607812,2025-08-05 09:57:14.756000,true,1,5
1611,179,21.0983261,-86.8608,2025-08-05 09:57:23.673000,true,0,
1612,179,21.0983212,-86.8607995,2025-08-05 12:21:18.208000,true,1,5
1613,179,21.0983251,-86.8607951,2025-08-05 12:22:21.388000,true,1,4
1614,179,21.0983242,-86.860804,2025-08-05 12:26:11.470000,true,1,4
1615,179,21.0983605,-86.8607676,2025-08-05 12:31:11.558000,true,1,4
1616,179,21.0983398,-86.8607834,2025-08-05 12:36:11.469000,true,1,4
1617,179,21.0983916,-86.8607258,2025-08-05 12:41:11.501000,true,1,4
1618,179,21.0983916,-86.8607258,2025-08-05 12:46:11.445000,true,1,4
1619,179,21.0983916,-86.8607258,2025-08-05 12:51:11.394000,true,1,4
1620,179,21.0983916,-86.8607258,2025-08-05 12:56:11.416000,true,1,4
1621,179,21.0983916,-86.8607258,2025-08-05 12:56:37.616000,true,1,4
1622,179,21.0983169,-86.8608044,2025-08-05 12:57:19.791000,true,1,4
1623,179,21.0983351,-86.8607914,2025-08-05 13:01:11.398000,true,1,4
1624,179,21.0983209,-86.8607946,2025-08-05 13:01:43.589000,true,1,5
1625,179,21.0983226,-86.8608058,2025-08-05 13:02:51.388000,true,1,4
1626,179,21.0983351,-86.8607914,2025-08-05 13:06:11.423000,true,1,4
1627,179,21.0983226,-86.8608058,2025-08-05 13:07:35.491000,true,1,5
1628,179,21.0983226,-86.8608058,2025-08-05 13:08:41.388000,true,1,4
1629,179,21.0983351,-86.8607914,2025-08-05 13:11:11.393000,true,1,4
1630,179,21.0983201,-86.8607993,2025-08-05 13:16:11.391000,true,1,4
1631,179,21.098336,-86.8607868,2025-08-05 13:21:11.390000,true,1,4
1632,179,21.0983249,-86.8607925,2025-08-05 13:26:11.397000,true,1,4
1633,179,21.0983234,-86.8608014,2025-08-05 13:31:11.390000,true,1,4
1634,179,21.0983203,-86.8608073,2025-08-05 13:33:57.697000,true,1,2
1635,179,21.0983303,-86.8607893,2025-08-05 13:33:58.728000,true,1,2
1636,179,21.0983235,-86.8607972,2025-08-05 13:36:11.396000,true,1,2
1637,179,21.0983276,-86.8607961,2025-08-05 13:41:11.406000,true,1,2
1640,179,21.0983161,-86.8608049,2025-08-05 13:44:32.381000,true,1,4
1641,179,21.0983348,-86.8607682,2025-08-05 13:46:11.398000,true,1,4
1642,179,21.0983371,-86.8607864,2025-08-05 13:51:11.401000,true,1,4
1643,179,21.0983441,-86.8607677,2025-08-05 13:52:33.309000,true,0,
1644,179,21.0983309,-86.8607886,2025-08-05 14:03:12.247000,true,1,5
1645,179,21.0983687,-86.8607175,2025-08-05 14:04:17.106000,true,1,4
1646,179,21.0983361,-86.8607906,2025-08-05 14:05:07.106000,true,1,4
1647,179,21.0983257,-86.8607995,2025-08-05 14:05:17.437000,true,1,2
1648,179,21.0983361,-86.8607906,2025-08-05 14:05:18.351000,true,1,2
1649,179,21.0983257,-86.8607995,2025-08-05 14:07:11.009000,true,1,4
1650,179,21.0983361,-86.8607906,2025-08-05 14:08:07.091000,true,1,4
1651,179,21.0983361,-86.8607906,2025-08-05 14:13:07.095000,true,1,4
1652,179,21.0983361,-86.8607906,2025-08-05 14:18:07.090000,true,1,4
1653,179,21.0983361,-86.8607906,2025-08-05 14:23:07.092000,true,1,4
1654,179,21.0983361,-86.8607906,2025-08-05 14:28:07.086000,true,1,4
1655,179,21.0983313,-86.8607894,2025-08-05 14:28:13.050000,true,0,`;

const actividades = rawData.trim().split('\n').map(line => {
  const parts = line.split(',');
  return {
    id: parseInt(parts[0]),
    empleado_id: parseInt(parts[1]),
    latitud: parseFloat(parts[2]),
    longitud: parseFloat(parts[3]),
    fecha_hora: parts[4],
    dentro_geocerca: parts[5] === 'true',
    tipo_registro: parts[6] ? parseInt(parts[6]) : null,
    evento: parts[7] ? parseInt(parts[7]) : null
  };
});

// Ordenar por fecha
actividades.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

console.log('=== ANÁLISIS DE EVENTOS EN LOS DATOS ===');
console.log('Total registros:', actividades.length);
console.log('');

// Contar tipos de eventos
const eventosCount = {};
const tipoRegistroCount = {};

actividades.forEach(act => {
  const evento = act.evento === null ? 'null' : act.evento;
  const tipo = act.tipo_registro === null ? 'null' : act.tipo_registro;
  
  eventosCount[evento] = (eventosCount[evento] || 0) + 1;
  tipoRegistroCount[tipo] = (tipoRegistroCount[tipo] || 0) + 1;
});

console.log('DISTRIBUCIÓN DE EVENTOS:');
Object.entries(eventosCount).forEach(([evento, count]) => {
  console.log(`  evento=${evento}: ${count} registros`);
});

console.log('');
console.log('DISTRIBUCIÓN DE TIPO_REGISTRO:');
Object.entries(tipoRegistroCount).forEach(([tipo, count]) => {
  console.log(`  tipo_registro=${tipo}: ${count} registros`);
});

console.log('');
console.log('=== PROBLEMAS DETECTADOS ===');

// El helper espera eventos 0 y 1 para geocerca, pero no los hay
const tieneEventos01 = actividades.some(act => act.evento === 0 || act.evento === 1);
console.log('¿Hay eventos 0 o 1 (geocerca)?', tieneEventos01);

if (!tieneEventos01) {
  console.log('❌ PROBLEMA: El helper espera eventos 0/1 para calcular tiempo de geocerca,');
  console.log('   pero estos datos solo tienen eventos null, 2, 4, 5');
  console.log('   El helper necesita usar el campo "dentro_geocerca" en lugar de eventos puntuales');
}

// Verificar si todos los registros están dentro de geocerca
const todosAdentro = actividades.every(act => act.dentro_geocerca === true);
console.log('¿Todos los registros están dentro de geocerca?', todosAdentro);

if (todosAdentro) {
  console.log('');
console.log('=== TEST CON HELPER ACTUAL ===');

// Test con el helper
const stats = calcularEstadisticasEmpleado(actividades, 120);
console.log('Estadísticas calculadas:');
console.log('  workedHours:', stats.workedHours);
console.log('  outsideHours:', stats.outsideHours);
console.log('  restHours:', stats.restHours);
console.log('  totalExits:', stats.totalExits);

console.log('');
console.log('=== ANÁLISIS DETALLADO DE DESCANSOS ===');
const eventosDescanso = actividades.filter(a => a.evento === 2);
console.log('Eventos de descanso encontrados:', eventosDescanso.length);

eventosDescanso.forEach((evento, index) => {
  const hora = new Date(evento.fecha_hora).toTimeString().substring(0, 8);
  console.log(`  ${index + 1}. ${hora} - evento=2`);
});

// Calcular manualmente el tiempo de descanso
if (eventosDescanso.length > 0) {
  const primerDescanso = new Date(eventosDescanso[0].fecha_hora);
  const ultimoDescanso = new Date(eventosDescanso[eventosDescanso.length - 1].fecha_hora);
  
  // Buscar el siguiente evento después del último descanso
  const siguienteEvento = actividades.find(a => 
    new Date(a.fecha_hora) > ultimoDescanso && a.evento !== 2
  );
  
  if (siguienteEvento) {
    const finDescanso = new Date(siguienteEvento.fecha_hora);
    const totalDescansoMs = finDescanso - primerDescanso;
    const totalDescansoHoras = totalDescansoMs / (1000 * 60 * 60);
    
    console.log('');
    console.log('Cálculo manual de descanso:');
    console.log(`  Inicio: ${primerDescanso.toTimeString().substring(0, 8)}`);
    console.log(`  Fin: ${finDescanso.toTimeString().substring(0, 8)}`);
    console.log(`  Total: ${totalDescansoHoras.toFixed(2)} horas (${(totalDescansoHoras * 60).toFixed(1)} minutos)`);
  }
}
}
