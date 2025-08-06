import { generarEventosYIntervalosDelResumen } from './hospital-tracker/src/components/dashboard/hospital/employeeStatsHelper.js';

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

console.log('=== PRUEBA DE INTERVALOS CON HELPER MEJORADO ===');
console.log(`Total de registros: ${registros.length}`);

const resultado = generarEventosYIntervalosDelResumen(registros);

console.log('\n=== INTERVALOS GENERADOS ===');
console.log(`Total de intervalos: ${resultado.intervalos.length}`);

resultado.intervalos.forEach((intervalo, index) => {
  const inicio = intervalo.inicio.toTimeString().slice(0, 8);
  const fin = intervalo.fin.toTimeString().slice(0, 8);
  const duracion = intervalo.duracionTexto;
  const tipo = intervalo.tipo;
  
  console.log(`${index + 1}. ${inicio} - ${fin} | ${tipo} | ${duracion}`);
});

// Calcular duración total de intervalos para verificar
let totalDentroMs = 0;
let totalDescansoMs = 0;
let totalFueraMs = 0;

resultado.intervalos.forEach(intervalo => {
  const duracionMs = intervalo.fin - intervalo.inicio;
  if (intervalo.dentro) totalDentroMs += duracionMs;
  if (intervalo.descanso) totalDescansoMs += duracionMs;
  if (intervalo.fuera) totalFueraMs += duracionMs;
});

console.log('\n=== RESUMEN DE TIEMPOS (DE INTERVALOS) ===');
console.log(`Tiempo dentro de geocerca: ${(totalDentroMs / 3600000).toFixed(2)} horas`);
console.log(`Tiempo fuera de geocerca: ${(totalFueraMs / 3600000).toFixed(2)} horas`);
console.log(`Tiempo en descanso: ${(totalDescansoMs / 3600000).toFixed(2)} horas`);

console.log('\n=== EVENTOS GENERADOS ===');
console.log(`Total de eventos: ${resultado.eventos.length}`);
resultado.eventos.forEach((evento, index) => {
  console.log(`${index + 1}. ${evento.hora} - ${evento.descripcion} (${evento.tipo}) ${evento.duracion}`);
});
