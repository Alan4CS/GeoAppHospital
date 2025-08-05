// Funciones para calcular horas trabajadas, fuera, justificadas y total de salidas para un empleado
// Maneja eventos de geocerca, descansos, inactividad/actividad y salidas/entradas laborales
// Eventos soportados:
// 0 - Salió de geocerca (acción puntual)
// 1 - Entró a geocerca (acción puntual) 
// 2 - En descanso (todos los registros durante el descanso tienen este evento)
// 3 - Terminó descanso (marca el fin del período de descanso)
// 4 - Inactividad (mientras trabaja)
// 5 - Activo (mientras trabaja)
// Tipo_registro:
// 0 - Salida laboral (marcó salida del trabajo)
// 1 - Entrada laboral (marcó entrada al trabajo)
// Durante el descanso (evento=2) se ignoran geocerca y actividad/inactividad.
// Durante salida laboral (tipo_registro=0) se detiene el cálculo hasta la próxima entrada.
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
    
    // Solo considerar sospechoso si NO hay un cambio de tipo_registro que justifique el gap
    // Si el registro anterior fue salida (tipo_registro=0) o el actual es entrada después de salida,
    // entonces el gap es legítimo y no sospechoso
    const esSalidaLegitima = prev.tipo_registro === 0 || 
                            (prev.tipo_registro === 0 && act.tipo_registro === 1);
    
    if (diffMs > minutosSospechoso * 60 * 1000 && !esSalidaLegitima) {
      // Saltar este intervalo, no sumar nada
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      continue;
    }

    // Manejo de tipo_registro: 0=salida laboral, 1=entrada laboral
    if (typeof act.tipo_registro === 'number') {
      if (act.tipo_registro === 0) {
        // Salida laboral - contabilizar tiempo hasta este punto si estaba trabajando
        if (estadoGeocerca === true && horaIntervalo) {
          totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        } else if (estadoGeocerca === false && horaIntervalo) {
          totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        }
        // Parar el cálculo hasta que marque entrada nuevamente
        estadoGeocerca = null;
        horaIntervalo = null;
        continue;
      } else if (act.tipo_registro === 1) {
        // Entrada laboral - reiniciar el cálculo
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        continue;
      }
    }

    if (typeof act.evento === 'number') {
      // Manejo de descansos - PRIORIDAD MÁXIMA
      if (act.evento === 2) {
        // Durante el descanso - contabilizar tiempo trabajado hasta este punto SOLO la primera vez
        if (inicioDescanso === null) {
          // Primera vez que se detecta descanso
          if (estadoGeocerca === true && horaIntervalo) {
            totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          } else if (estadoGeocerca === false && horaIntervalo) {
            totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          }
          inicioDescanso = act.fecha_hora;
          horaIntervalo = null; // Parar el cálculo durante descanso
        }
        // Durante el descanso, ignorar todos los otros eventos (geocerca, actividad)
        continue;
      } else if (act.evento === 3) {
        // Fin de descanso - contabilizar tiempo de descanso y reiniciar trabajo
        if (inicioDescanso) {
          totalDescanso += (new Date(act.fecha_hora) - new Date(inicioDescanso));
          inicioDescanso = null;
        }
        // Reiniciar el cálculo de trabajo
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        continue;
      }

      // Si está en descanso, ignorar todos los otros eventos
      if (inicioDescanso !== null) {
        continue;
      }

      // Manejo de geocerca (solo si NO está en descanso Y está trabajando)
      if (estadoGeocerca !== null) {
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

      // Manejo de eventos de actividad (4: Inactividad, 5: Activo)
      // Solo se procesan si NO está en descanso Y está trabajando
      if (act.evento === 4) {
        // Empleado se puso inactivo - no afecta cálculo de horas
        // Solo actualiza el estado de actividad
      } else if (act.evento === 5) {
        // Empleado se puso activo - no afecta cálculo de horas
        // Solo actualiza el estado de actividad
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
