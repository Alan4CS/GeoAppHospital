// Script para analizar los datos proporcionados por el usuario
// Usando las funciones corregidas del employeeStatsHelper.js

import { calcularEstadisticasEmpleado, generarResumenDiaMejorado, generarEventosYIntervalosDelResumen } from './hospital-tracker/src/components/dashboard/hospital/employeeStatsHelper.js';

// Datos del usuario convertidos al formato esperado
const rawData = `1590,21.0983224,179,-86.8608036,2025-08-05 08:51:05.223000,true,1,
1591,21.0983368,179,-86.8607835,2025-08-05 08:51:46.359000,true,1,5
1592,21.098323,179,-86.8608048,2025-08-05 08:52:07.758000,true,1,4
1593,21.098327,179,-86.8608007,2025-08-05 08:55:57.720000,true,1,4
1594,21.0983242,179,-86.8607972,2025-08-05 09:00:57.738000,true,1,4
1595,21.0983262,179,-86.8607982,2025-08-05 09:05:57.742000,true,1,4
1596,21.0983232,179,-86.8608019,2025-08-05 09:10:57.727000,true,1,4
1597,21.0983782,179,-86.8607489,2025-08-05 09:15:57.719000,true,1,4
1598,21.0983237,179,-86.8608031,2025-08-05 09:20:57.726000,true,1,4
1599,21.0983175,179,-86.8608044,2025-08-05 09:23:29.668000,true,1,5
1600,21.0983213,179,-86.860767,2025-08-05 09:54:51.091000,true,1,4
1601,21.0983329,179,-86.8607923,2025-08-05 09:54:41.201000,true,1,4
1602,21.0983233,179,-86.8608011,2025-08-05 09:54:41.207000,true,1,4
1603,21.0983329,179,-86.8607923,2025-08-05 09:54:37.676000,true,1,5
1604,21.0983233,179,-86.8608011,2025-08-05 09:54:47.511000,true,1,4
1605,21.0983213,179,-86.860767,2025-08-05 09:54:52.478000,true,1,5
1606,21.0983213,179,-86.860767,2025-08-05 09:54:42.341000,true,1,5
1607,21.0983233,179,-86.8608011,2025-08-05 09:56:04.711000,true,1,5
1608,21.0983233,179,-86.8608011,2025-08-05 09:54:47.511000,true,1,4
1609,21.0983389,179,-86.8607812,2025-08-05 09:57:06.292000,true,1,4
1610,21.0983389,179,-86.8607812,2025-08-05 09:57:14.756000,true,1,5
1611,21.0983261,179,-86.8608,2025-08-05 09:57:23.673000,true,0,
1612,21.0983212,179,-86.8607995,2025-08-05 12:21:18.208000,true,1,5
1613,21.0983251,179,-86.8607951,2025-08-05 12:22:21.388000,true,1,4
1614,21.0983242,179,-86.860804,2025-08-05 12:26:11.470000,true,1,4
1615,21.0983605,179,-86.8607676,2025-08-05 12:31:11.558000,true,1,4
1616,21.0983398,179,-86.8607834,2025-08-05 12:36:11.469000,true,1,4
1617,21.0983916,179,-86.8607258,2025-08-05 12:41:11.501000,true,1,4
1618,21.0983916,179,-86.8607258,2025-08-05 12:46:11.445000,true,1,4
1619,21.0983916,179,-86.8607258,2025-08-05 12:51:11.394000,true,1,4
1620,21.0983916,179,-86.8607258,2025-08-05 12:56:11.416000,true,1,4
1621,21.0983916,179,-86.8607258,2025-08-05 12:56:37.616000,true,1,4
1622,21.0983169,179,-86.8608044,2025-08-05 12:57:19.791000,true,1,4
1623,21.0983351,179,-86.8607914,2025-08-05 13:01:11.398000,true,1,4
1624,21.0983209,179,-86.8607946,2025-08-05 13:01:43.589000,true,1,5
1625,21.0983226,179,-86.8608058,2025-08-05 13:02:51.388000,true,1,4
1626,21.0983351,179,-86.8607914,2025-08-05 13:06:11.423000,true,1,4
1627,21.0983226,179,-86.8608058,2025-08-05 13:07:35.491000,true,1,5
1628,21.0983226,179,-86.8608058,2025-08-05 13:08:41.388000,true,1,4
1629,21.0983351,179,-86.8607914,2025-08-05 13:11:11.393000,true,1,4
1630,21.0983201,179,-86.8607993,2025-08-05 13:16:11.391000,true,1,4
1631,21.098336,179,-86.8607868,2025-08-05 13:21:11.390000,true,1,4
1632,21.0983249,179,-86.8607925,2025-08-05 13:26:11.397000,true,1,4
1633,21.0983234,179,-86.8608014,2025-08-05 13:31:11.390000,true,1,4
1634,21.0983203,179,-86.8608073,2025-08-05 13:33:57.697000,true,1,2
1635,21.0983303,179,-86.8607893,2025-08-05 13:33:58.728000,true,1,2
1636,21.0983235,179,-86.8607972,2025-08-05 13:36:11.396000,true,1,2
1637,21.0983276,179,-86.8607961,2025-08-05 13:41:11.406000,true,1,2
1640,21.0983161,179,-86.8608049,2025-08-05 13:44:32.381000,true,1,4
1641,21.0983348,179,-86.8607682,2025-08-05 13:46:11.398000,true,1,4
1642,21.0983371,179,-86.8607864,2025-08-05 13:51:11.401000,true,1,4
1643,21.0983441,179,-86.8607677,2025-08-05 13:52:33.309000,true,0,
1644,21.0983309,179,-86.8607886,2025-08-05 14:03:12.247000,true,1,5
1645,21.0983687,179,-86.8607175,2025-08-05 14:04:17.106000,true,1,4
1646,21.0983361,179,-86.8607906,2025-08-05 14:05:07.106000,true,1,4
1647,21.0983257,179,-86.8607995,2025-08-05 14:05:17.437000,true,1,2
1648,21.0983361,179,-86.8607906,2025-08-05 14:05:18.351000,true,1,2
1649,21.0983257,179,-86.8607995,2025-08-05 14:07:11.009000,true,1,4
1650,21.0983361,179,-86.8607906,2025-08-05 14:08:07.091000,true,1,4
1651,21.0983361,179,-86.8607906,2025-08-05 14:13:07.095000,true,1,4
1652,21.0983361,179,-86.8607906,2025-08-05 14:18:07.090000,true,1,4
1653,21.0983361,179,-86.8607906,2025-08-05 14:23:07.092000,true,1,4
1654,21.0983361,179,-86.8607906,2025-08-05 14:28:07.086000,true,1,4
1655,21.0983313,179,-86.8607894,2025-08-05 14:28:13.050000,true,0,`;

// Convertir datos a formato del sistema
const actividades = rawData.trim().split('\n').map(line => {
  const parts = line.split(',');
  
  // CORRECCIÓN REAL: Los datos tienen formato:
  // ID,lat,emp_id,lon,fecha,dentro_geo,evento[,evento_adicional]
  // Donde el 7mo campo puede ser evento de actividad (4,5) o tipo_registro (0,1) o evento descanso (2)
  
  let evento = null;
  let tipo_registro = null;
  
  if (parts.length >= 7 && parts[6] !== '') {
    evento = parseInt(parts[6]);
  }
  
  if (parts.length >= 8 && parts[7] !== '') {
    const ultimoCampo = parseInt(parts[7]);
    
    // Si el último campo es 0 o 1, es tipo_registro (entrada/salida laboral)
    if (ultimoCampo === 0 || ultimoCampo === 1) {
      tipo_registro = ultimoCampo;
    } 
    // Si es 2, podría ser evento descanso o tipo_registro
    else if (ultimoCampo === 2) {
      // Si el evento anterior es 1 (entrada geo), entonces 2 es evento descanso
      if (evento === 1) {
        evento = ultimoCampo; // Cambiar evento a 2 (descanso)
      } else {
        tipo_registro = ultimoCampo;
      }
    }
    // Si es 4 o 5, es evento de actividad, cambiar el evento principal
    else if (ultimoCampo === 4 || ultimoCampo === 5) {
      evento = ultimoCampo;
    }
  }
  
  return {
    id: parseInt(parts[0]),
    latitud: parseFloat(parts[1]),
    empleado_id: parseInt(parts[2]),
    longitud: parseFloat(parts[3]),
    fecha_hora: parts[4],
    dentro_geocerca: parts[5] === 'true',
    evento: evento,
    tipo_registro: tipo_registro
  };
});

console.log('=== ANÁLISIS DE DATOS DEL EMPLEADO 179 ===');
console.log('Fecha: 2025-08-05');
console.log('Total de registros:', actividades.length);
console.log('');

// Ordenar por fecha para análisis temporal
actividades.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

console.log('Primer registro:', actividades[0].fecha_hora);
console.log('Último registro:', actividades[actividades.length - 1].fecha_hora);
console.log('');

// Calcular estadísticas usando la función corregida
const stats = calcularEstadisticasEmpleado(actividades, 120);

console.log('=== ESTADÍSTICAS CALCULADAS ===');
console.log('Horas trabajadas (dentro de geocerca):', stats.workedHours, 'horas');
console.log('Horas fuera de geocerca:', stats.outsideHours, 'horas');
console.log('Horas de descanso:', stats.restHours, 'horas');
console.log('Total de salidas de geocerca:', stats.totalExits);
console.log('');

// Generar resumen detallado
const resumen = generarResumenDiaMejorado(actividades);
console.log('=== RESUMEN DE EVENTOS ===');
resumen.forEach(evento => {
  console.log(`${evento.hora} - ${evento.descripcion} ${evento.duracion}`);
});
console.log('');

// Generar intervalos detallados
const { eventos, intervalos } = generarEventosYIntervalosDelResumen(actividades);
console.log('=== INTERVALOS DETALLADOS ===');
intervalos.forEach((intervalo, index) => {
  const inicio = intervalo.inicio.toISOString().substr(11, 5);
  const fin = intervalo.fin.toISOString().substr(11, 5);
  console.log(`${index + 1}. ${inicio} - ${fin}: ${intervalo.tipo} (${intervalo.duracionTexto})`);
});

// Análisis detallado paso a paso
console.log('');
console.log('=== ANÁLISIS DETALLADO DE EVENTOS ===');

// Primeros 10 registros para ver el patrón
console.log('Primeros 10 registros cronológicos:');
actividades.slice(0, 10).forEach((r, i) => {
  console.log(`${i+1}. ${r.fecha_hora} - dentro=${r.dentro_geocerca}, evento=${r.evento}, tipo_registro=${r.tipo_registro}`);
});

console.log('');
console.log('=== ANÁLISIS DE DESCANSOS ===');
const eventosDescanso = actividades.filter(a => a.evento === 2);
if (eventosDescanso.length > 0) {
  console.log(`Total de registros con evento=2 (descanso): ${eventosDescanso.length}`);
  console.log('Registros con evento=2 (descanso):');
  eventosDescanso.forEach(r => {
    console.log(`  ${r.fecha_hora} - evento=${r.evento}`);
  });
  
  const primerDescanso = eventosDescanso[0].fecha_hora;
  const ultimoDescanso = eventosDescanso[eventosDescanso.length - 1].fecha_hora;
  
  const tiempoDescanso = new Date(ultimoDescanso) - new Date(primerDescanso);
  const minutosDescanso = Math.floor(tiempoDescanso / 60000);
  const horasDescanso = Math.floor(minutosDescanso / 60);
  const minRestantes = minutosDescanso % 60;
  
  console.log(`Primer descanso: ${primerDescanso.substr(11, 5)}`);
  console.log(`Último descanso: ${ultimoDescanso.substr(11, 5)}`);
  console.log(`Duración total: ${horasDescanso}h ${minRestantes}min`);
} else {
  console.log('No se encontraron registros con evento=2 (descanso)');
}

console.log('');
console.log('=== ANÁLISIS DE EVENTOS DE GEOCERCA ===');
const salidosGeo = actividades.filter(a => a.evento === 0);
const entradosGeo = actividades.filter(a => a.evento === 1);
console.log(`Salidas de geocerca (evento=0): ${salidosGeo.length}`);
salidosGeo.forEach(r => {
  console.log(`  SALIDA: ${r.fecha_hora}`);
});
console.log(`Entradas a geocerca (evento=1): ${entradosGeo.length}`);
entradosGeo.forEach(r => {
  console.log(`  ENTRADA: ${r.fecha_hora}`);
});

console.log('');
console.log('=== ANÁLISIS DEL PROBLEMA ===');
console.log('¿Por qué dice 0 horas de descanso si hay eventos=2?');
console.log('¿Por qué los intervalos están mal calculados?');

// Verificar si el primer registro tiene tipo_registro=1 (entrada laboral)
const primerRegistro = actividades[0];
console.log(`Primer registro - tipo_registro: ${primerRegistro.tipo_registro}, evento: ${primerRegistro.evento}`);

// Buscar registros de entrada/salida laboral
const entradasLaborales = actividades.filter(a => a.tipo_registro === 1);
const salidasLaborales = actividades.filter(a => a.tipo_registro === 0);
console.log(`Entradas laborales (tipo_registro=1): ${entradasLaborales.length}`);
console.log(`Salidas laborales (tipo_registro=0): ${salidasLaborales.length}`);
