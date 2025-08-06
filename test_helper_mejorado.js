import { calcularEstadisticasEmpleado } from './hospital-tracker/src/components/dashboard/hospital/employeeStatsHelper.js';

// Datos reales del empleado 2025-08-05
const datosReales = `id_registro,id_user,latitud,longitud,fecha_hora,dentro_geocerca,tipo_registro,evento
1,6,32.525588,-116.955292,2025-08-05 08:51:20,true,1,
2,6,32.525632,-116.955278,2025-08-05 08:51:32,true,,
3,6,32.525632,-116.955278,2025-08-05 08:51:43,true,,5
4,6,32.525631,-116.955276,2025-08-05 08:52:05,true,,4
5,6,32.525631,-116.955276,2025-08-05 08:52:16,true,,5
6,6,32.525631,-116.955276,2025-08-05 08:52:28,true,,4
7,6,32.525631,-116.955276,2025-08-05 08:52:39,true,,5
8,6,32.525631,-116.955276,2025-08-05 08:53:01,true,,4
9,6,32.525631,-116.955276,2025-08-05 08:53:12,true,,5
10,6,32.525631,-116.955276,2025-08-05 08:53:23,true,,4
11,6,32.525631,-116.955276,2025-08-05 08:53:34,true,,5
12,6,32.525632,-116.955278,2025-08-05 08:53:56,true,,4
13,6,32.525631,-116.955276,2025-08-05 08:54:07,true,,5
14,6,32.525632,-116.955278,2025-08-05 08:54:18,true,,4
15,6,32.525632,-116.955278,2025-08-05 08:54:29,true,,5
16,6,32.525632,-116.955278,2025-08-05 08:54:51,true,,4
17,6,32.525632,-116.955278,2025-08-05 08:55:02,true,,5
18,6,32.525632,-116.955278,2025-08-05 08:55:13,true,,4
19,6,32.525632,-116.955278,2025-08-05 08:55:24,true,,5
20,6,32.525632,-116.955278,2025-08-05 08:55:46,true,,4
21,6,32.525632,-116.955278,2025-08-05 08:55:57,true,,5
22,6,32.525632,-116.955278,2025-08-05 08:56:08,true,,4
23,6,32.525632,-116.955278,2025-08-05 08:56:19,true,,5
24,6,32.525632,-116.955278,2025-08-05 08:56:41,true,,4
25,6,32.525632,-116.955278,2025-08-05 08:56:52,true,,5
26,6,32.525632,-116.955278,2025-08-05 08:57:03,true,,4
27,6,32.525632,-116.955278,2025-08-05 08:57:14,true,,5
28,6,32.525632,-116.955278,2025-08-05 08:57:36,true,,4
29,6,32.525632,-116.955278,2025-08-05 08:57:47,true,,5
30,6,32.525632,-116.955278,2025-08-05 08:57:58,true,,4
31,6,32.525632,-116.955278,2025-08-05 08:58:09,true,,5
32,6,32.525632,-116.955278,2025-08-05 09:57:04,true,0,
33,6,32.525632,-116.955278,2025-08-05 12:21:43,true,1,
34,6,32.525632,-116.955278,2025-08-05 12:21:54,true,,5
35,6,32.525632,-116.955278,2025-08-05 12:22:16,true,,4
36,6,32.525632,-116.955278,2025-08-05 12:22:27,true,,5
37,6,32.525632,-116.955278,2025-08-05 12:22:38,true,,4
38,6,32.525632,-116.955278,2025-08-05 13:31:32,true,,4
39,6,32.525632,-116.955278,2025-08-05 13:33:14,true,,2
40,6,32.525632,-116.955278,2025-08-05 13:33:25,true,,2
41,6,32.525632,-116.955278,2025-08-05 13:33:36,true,,2
42,6,32.525632,-116.955278,2025-08-05 13:33:47,true,,2
43,6,32.525632,-116.955278,2025-08-05 13:33:58,true,,2
44,6,32.525632,-116.955278,2025-08-05 13:44:04,true,,2
45,6,32.525632,-116.955278,2025-08-05 13:44:15,true,,5
46,6,32.525632,-116.955278,2025-08-05 13:44:26,true,,4
47,6,32.525632,-116.955278,2025-08-05 13:44:37,true,,5
48,6,32.525632,-116.955278,2025-08-05 13:44:59,true,,4
49,6,32.525632,-116.955278,2025-08-05 13:45:10,true,,5
50,6,32.525632,-116.955278,2025-08-05 13:45:21,true,,4
51,6,32.525632,-116.955278,2025-08-05 13:45:32,true,,5
52,6,32.525632,-116.955278,2025-08-05 13:45:54,true,,4
53,6,32.525632,-116.955278,2025-08-05 13:46:05,true,,5
54,6,32.525632,-116.955278,2025-08-05 13:46:16,true,,4
55,6,32.525632,-116.955278,2025-08-05 13:46:27,true,,5
56,6,32.525632,-116.955278,2025-08-05 13:51:49,true,,4
57,6,32.525632,-116.955278,2025-08-05 13:52:22,true,0,
58,6,32.525632,-116.955278,2025-08-05 14:03:47,true,1,
59,6,32.525632,-116.955278,2025-08-05 14:04:09,true,,4
60,6,32.525632,-116.955278,2025-08-05 14:05:31,true,,2
61,6,32.525632,-116.955278,2025-08-05 14:07:06,true,,5
62,6,32.525632,-116.955278,2025-08-05 14:07:17,true,,4
63,6,32.525632,-116.955278,2025-08-05 14:28:44,true,,5
64,6,32.525632,-116.955278,2025-08-05 14:28:55,true,0,`;

// Convertir datos CSV a objetos
const lineas = datosReales.trim().split('\n');
const encabezados = lineas[0].split(',');
const registros = lineas.slice(1).map(linea => {
  const valores = linea.split(',');
  const obj = {};
  encabezados.forEach((encabezado, index) => {
    let valor = valores[index];
    if (valor === '') valor = null;
    if (encabezado === 'id_registro' || encabezado === 'id_user') valor = parseInt(valor);
    if (encabezado === 'latitud' || encabezado === 'longitud') valor = parseFloat(valor);
    if (encabezado === 'dentro_geocerca') valor = valor === 'true';
    if (encabezado === 'tipo_registro' && valor !== null) valor = parseInt(valor);
    if (encabezado === 'evento' && valor !== null) valor = parseInt(valor);
    obj[encabezado] = valor;
  });
  return obj;
});

console.log('=== PRUEBA CON HELPER MEJORADO ===');
console.log(`Total de registros: ${registros.length}`);

// Verificar distribución de dentro_geocerca
const dentroDistribucion = {};
registros.forEach(r => {
  const estado = r.dentro_geocerca;
  dentroDistribucion[estado] = (dentroDistribucion[estado] || 0) + 1;
});
console.log('📍 Distribución dentro_geocerca:', dentroDistribucion);

// Buscar cambios en dentro_geocerca
let cambiosGeocerca = 0;
for (let i = 1; i < registros.length; i++) {
  if (registros[i].dentro_geocerca !== registros[i-1].dentro_geocerca) {
    cambiosGeocerca++;
    console.log(`🔄 Cambio en dentro_geocerca en registro ${i+1}: ${registros[i-1].dentro_geocerca} → ${registros[i].dentro_geocerca} (${registros[i].fecha_hora})`);
  }
}
console.log(`Total de cambios en dentro_geocerca: ${cambiosGeocerca}`);

const stats = calcularEstadisticasEmpleado(registros);

console.log('\n=== ESTADÍSTICAS CALCULADAS (HELPER MEJORADO) ===');
console.log(`Horas trabajadas (dentro de geocerca): ${stats.workedHours} horas`);
console.log(`Horas fuera de geocerca: ${stats.outsideHours} horas`);
console.log(`Horas de descanso: ${stats.restHours} horas`);
console.log(`Total de salidas de geocerca: ${stats.totalExits}`);

// Calcular tiempo esperado manualmente
const primeraEntrada = new Date('2025-08-05 08:51:20');
const primeraSalida = new Date('2025-08-05 09:57:04');
const segundaEntrada = new Date('2025-08-05 12:21:43');
const segundaSalida = new Date('2025-08-05 13:52:22');
const terceraEntrada = new Date('2025-08-05 14:03:47');
const terceraSalida = new Date('2025-08-05 14:28:55');

const tiempoSesion1 = (primeraSalida - primeraEntrada) / 3600000;
const tiempoSesion2 = (segundaSalida - segundaEntrada) / 3600000;
const tiempoSesion3 = (terceraSalida - terceraEntrada) / 3600000;
const tiempoTotal = tiempoSesion1 + tiempoSesion2 + tiempoSesion3;

console.log('\n=== CÁLCULO ESPERADO MANUAL ===');
console.log(`Sesión 1: ${primeraEntrada.toTimeString().slice(0,8)} - ${primeraSalida.toTimeString().slice(0,8)} = ${tiempoSesion1.toFixed(2)} horas`);
console.log(`Sesión 2: ${segundaEntrada.toTimeString().slice(0,8)} - ${segundaSalida.toTimeString().slice(0,8)} = ${tiempoSesion2.toFixed(2)} horas`);
console.log(`Sesión 3: ${terceraEntrada.toTimeString().slice(0,8)} - ${terceraSalida.toTimeString().slice(0,8)} = ${tiempoSesion3.toFixed(2)} horas`);
console.log(`Total esperado: ${tiempoTotal.toFixed(2)} horas`);

// Tiempo de descansos
const inicioDescanso1 = new Date('2025-08-05 13:33:14');
const finDescanso1 = new Date('2025-08-05 13:44:15');
const inicioDescanso2 = new Date('2025-08-05 14:05:31');
const finDescanso2 = new Date('2025-08-05 14:07:06');

const tiempoDescanso1 = (finDescanso1 - inicioDescanso1) / 3600000;
const tiempoDescanso2 = (finDescanso2 - inicioDescanso2) / 3600000;
const tiempoDescansoTotal = tiempoDescanso1 + tiempoDescanso2;

console.log('\n=== TIEMPO DE DESCANSOS ===');
console.log(`Descanso 1: ${inicioDescanso1.toTimeString().slice(0,8)} - ${finDescanso1.toTimeString().slice(0,8)} = ${tiempoDescanso1.toFixed(2)} horas`);
console.log(`Descanso 2: ${inicioDescanso2.toTimeString().slice(0,8)} - ${finDescanso2.toTimeString().slice(0,8)} = ${tiempoDescanso2.toFixed(2)} horas`);
console.log(`Total descansos: ${tiempoDescansoTotal.toFixed(2)} horas`);

const tiempoTrabajoNeto = tiempoTotal - tiempoDescansoTotal;
console.log(`Tiempo trabajo neto (sin descansos): ${tiempoTrabajoNeto.toFixed(2)} horas`);
