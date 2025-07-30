// Funciones para calcular horas trabajadas, fuera, justificadas y total de salidas para un empleado
// Inserta eventos de "actividad sospechosa" si hay huecos mayores a 10 minutos entre registros
// No marca salida ni entrada, solo inserta un evento especial (evento: 99)
// Elimina insertarEventosSospechosos. Ahora el filtrado de huecos sospechosos se hace en el cálculo de horas.

// Convierte milisegundos a horas con 2 decimales
function msToHours(ms) {
  return +(ms / 3600000).toFixed(2);
}

// Calcula las horas dentro, fuera, descanso y total de salidas de un arreglo de registros
export function calcularEstadisticasEmpleado(registros = [], minutosSospechoso = 120) {
  let totalDentro = 0;
  let totalFuera = 0;
  let totalDescanso = 0;
  let totalSalidas = 0;
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let inicioDescanso = null;

  const ordenadas = registros.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  for (let i = 0; i < ordenadas.length; i++) {
    const act = ordenadas[i];

    if (i === 0) {
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      continue;
    }

    // Detectar hueco sospechoso
    const prev = ordenadas[i - 1];
    const diffMs = new Date(act.fecha_hora) - new Date(prev.fecha_hora);
    if (diffMs > minutosSospechoso * 60 * 1000) {
      // Saltar este intervalo, no sumar nada
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      continue;
    }

    if (typeof act.evento === 'number') {
      // Manejo de descansos
      if (act.evento === 2) {
        // Inicio de descanso
        inicioDescanso = act.fecha_hora;
      } else if (act.evento === 3 && inicioDescanso) {
        // Fin de descanso
        totalDescanso += (new Date(act.fecha_hora) - new Date(inicioDescanso));
        inicioDescanso = null;
      }

      // Manejo de geocerca
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
    restHours: msToHours(totalDescanso),
    totalExits: totalSalidas,
  };
}

// Agrupa registros por día y suma horas por día (para evitar duplicar horas)
export function calcularEstadisticasEmpleadoPorDias(registros = [], minutosSospechoso = 120) {
  // Agrupar registros por día local
  const actividadesPorDia = {};
  registros.forEach((registro) => {
    const fecha = registro.fecha_hora.slice(0, 10); // yyyy-MM-dd
    if (!actividadesPorDia[fecha]) actividadesPorDia[fecha] = [];
    actividadesPorDia[fecha].push(registro);
  });

  let totalTrabajadas = 0;
  let totalFuera = 0;
  let totalDescanso = 0;

  Object.values(actividadesPorDia).forEach(acts => {
    const stats = calcularEstadisticasEmpleado(acts, minutosSospechoso);
    totalTrabajadas += stats.workedHours || 0;
    totalFuera += stats.outsideHours || 0;
    totalDescanso += stats.restHours || 0;
  });

  return {
    workedHours: totalTrabajadas,
    outsideHours: totalFuera,
    restHours: totalDescanso,
  };
}
