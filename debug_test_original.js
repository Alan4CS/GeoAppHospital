import { calcularEstadisticasEmpleado, generarResumenDiaMejorado } from './hospital-tracker/src/components/dashboard/hospital/employeeStatsHelper.js';

// Mismo parsing que en test_original_helper.js
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

console.log('=== ANÁLISIS DE DATOS DEL TEST ORIGINAL ===');
console.log(`Total de registros: ${actividades.length}`);

// Verificar distribución de dentro_geocerca
const dentroDistribucion = {};
actividades.forEach(r => {
  const estado = r.dentro_geocerca;
  dentroDistribucion[estado] = (dentroDistribucion[estado] || 0) + 1;
});
console.log('📍 Distribución dentro_geocerca:', dentroDistribucion);

// Buscar cambios en dentro_geocerca
let cambiosGeocerca = 0;
for (let i = 1; i < actividades.length; i++) {
  if (actividades[i].dentro_geocerca !== actividades[i-1].dentro_geocerca) {
    cambiosGeocerca++;
    console.log(`🔄 Cambio en dentro_geocerca en registro ${i+1}: ${actividades[i-1].dentro_geocerca} → ${actividades[i].dentro_geocerca} (${actividades[i].fecha_hora})`);
  }
}
console.log(`Total de cambios en dentro_geocerca: ${cambiosGeocerca}`);

// Verificar eventos de entrada/salida laboral
const entradasSalidas = actividades.filter(a => a.tipo_registro === 0 || a.tipo_registro === 1);
console.log('\n=== ENTRADAS Y SALIDAS LABORALES ===');
entradasSalidas.forEach(a => {
  const tipo = a.tipo_registro === 1 ? 'ENTRADA' : 'SALIDA';
  console.log(`${a.fecha_hora} - ${tipo} (tipo_registro=${a.tipo_registro})`);
});

// Ordenar por fecha
actividades.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

const stats = calcularEstadisticasEmpleado(actividades, 120);

console.log('\n=== ESTADÍSTICAS CON HELPER MEJORADO ===');
console.log(`Horas trabajadas (dentro de geocerca): ${stats.workedHours} horas`);
console.log(`Horas fuera de geocerca: ${stats.outsideHours} horas`);
console.log(`Horas de descanso: ${stats.restHours} horas`);
console.log(`Total de salidas de geocerca: ${stats.totalExits}`);

// Calcular tiempo esperado manualmente
const primeraEntrada = new Date('2025-08-05 08:51:05.223000');
const primeraSalida = new Date('2025-08-05 09:57:23.673000');
const segundaEntrada = new Date('2025-08-05 12:21:18.208000');
const segundaSalida = new Date('2025-08-05 13:52:33.309000');
const terceraEntrada = new Date('2025-08-05 14:03:12.247000');
const terceraSalida = new Date('2025-08-05 14:28:13.050000');

const tiempoSesion1 = (primeraSalida - primeraEntrada) / 3600000;
const tiempoSesion2 = (segundaSalida - segundaEntrada) / 3600000;
const tiempoSesion3 = (terceraSalida - terceraEntrada) / 3600000;
const tiempoTotal = tiempoSesion1 + tiempoSesion2 + tiempoSesion3;

console.log('\n=== CÁLCULO MANUAL ESPERADO ===');
console.log(`Sesión 1: ${primeraEntrada.toTimeString().slice(0,8)} - ${primeraSalida.toTimeString().slice(0,8)} = ${tiempoSesion1.toFixed(2)} horas`);
console.log(`Sesión 2: ${segundaEntrada.toTimeString().slice(0,8)} - ${segundaSalida.toTimeString().slice(0,8)} = ${tiempoSesion2.toFixed(2)} horas`);
console.log(`Sesión 3: ${terceraEntrada.toTimeString().slice(0,8)} - ${terceraSalida.toTimeString().slice(0,8)} = ${tiempoSesion3.toFixed(2)} horas`);
console.log(`Total esperado: ${tiempoTotal.toFixed(2)} horas`);
