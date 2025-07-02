// Funciones para calcular horas trabajadas, fuera, justificadas y total de salidas para un empleado

// Convierte milisegundos a horas con 2 decimales
function msToHours(ms) {
  return +(ms / 3600000).toFixed(2);
}

// Calcula las horas dentro, fuera, justificadas y total de salidas de un arreglo de registros
export function calcularEstadisticasEmpleado(registros = []) {
  let totalDentro = 0;
  let totalFuera = 0;
  let totalJustificadas = 0; // Puedes ajustar si tienes lógica para horas justificadas
  let totalSalidas = 0;
  let estadoGeocerca = null;
  let horaIntervalo = null;
  const ordenadas = registros.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  for (let i = 0; i < ordenadas.length; i++) {
    const act = ordenadas[i];
    if (i === 0) {
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      continue;
    }
    if (typeof act.evento === 'number') {
      if (act.evento === 0 && estadoGeocerca === true && horaIntervalo) {
        totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        estadoGeocerca = false;
        horaIntervalo = act.fecha_hora;
        totalSalidas++;
      } else if (act.evento === 1 && estadoGeocerca === false && horaIntervalo) {
        totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        estadoGeocerca = true;
        horaIntervalo = act.fecha_hora;
      }
    }
    if (i === ordenadas.length - 1 && horaIntervalo && estadoGeocerca !== null) {
      if (estadoGeocerca) {
        totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
      } else {
        totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
      }
    }
  }
  return {
    workedHours: msToHours(totalDentro),
    outsideHours: msToHours(totalFuera),
    justifiedHours: msToHours(totalJustificadas), // Si tienes lógica para justificadas, cámbiala aquí
    totalExits: totalSalidas,
  };
}
