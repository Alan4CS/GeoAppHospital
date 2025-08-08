// Funciones para calcular horas trabajadas, fuera, justificadas y total de salidas para un empleado
// Maneja eventos de geocerca, descansos, inactividad/actividad y salidas/entradas laborales
// Eventos soportados:
// 0 - Salió de geocerca (acción puntual)
// 1 - Entró a geocerca (acción puntual) 
// 2 - En descanso (todos los registros durante el descanso tienen este evento)
// 3 - [OBSOLETO] Terminó descanso (ya no se usa)
// 4 - Inactividad (mientras trabaja)
// 5 - Activo (mientras trabaja)
// Tipo_registro:
// 0 - Salida laboral (marcó salida del trabajo)
// 1 - Entrada laboral (marcó entrada al trabajo)
// Durante el descanso (evento=2) se ignoran geocerca y actividad/inactividad.
// El descanso termina cuando se deja de enviar el evento 2.
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

    // Determinar el evento real
    const eventoReal = (act.evento === 1 && typeof act.tipo_registro === 'number' && act.tipo_registro !== 1) 
      ? act.tipo_registro 
      : act.evento;

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

    // Manejo de descansos - PRIORIDAD MÁXIMA (ANTES que tipo_registro)
    // Verificar si este registro es evento de descanso (evento === 2)
    if (typeof act.evento === 'number' && act.evento === 2) {
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
      
      // Verificar si es el último evento de descanso mirando hacia adelante
      const siguientesEventos = ordenadas.slice(i + 1);
      const proximoDescanso = siguientesEventos.find(siguiente => 
        typeof siguiente.evento === 'number' && siguiente.evento === 2
      );
      
      // Si no hay más eventos de descanso próximos (dentro de los próximos 10 minutos)
      // O si el próximo descanso está muy lejos, terminar este período de descanso
      let esFinDelDescanso = !proximoDescanso;
      if (proximoDescanso) {
        const tiempoHastaProximo = new Date(proximoDescanso.fecha_hora) - new Date(act.fecha_hora);
        // Si el próximo descanso está a más de 10 minutos, considerarlo un período separado
        esFinDelDescanso = tiempoHastaProximo > 10 * 60 * 1000;
      }
      
      if (esFinDelDescanso) {
        // Fin de descanso - contabilizar tiempo de descanso
        const tiempoDescanso = new Date(act.fecha_hora) - new Date(inicioDescanso);
        totalDescanso += tiempoDescanso;
        inicioDescanso = null;
        // Reiniciar el cálculo de trabajo
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
      }
      
      // Durante el descanso, ignorar todos los otros eventos (geocerca, actividad)
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
        // Entrada laboral - reiniciar el cálculo SOLO si no estaba ya trabajando
        if (estadoGeocerca === null) {
          // Solo procesar si realmente estaba fuera del trabajo
          estadoGeocerca = act.dentro_geocerca;
          horaIntervalo = act.fecha_hora;
        }
        // Si ya estaba trabajando (estadoGeocerca !== null), ignorar entradas duplicadas
        continue;
      }
    }

    // Si estaba en descanso pero el evento actual NO es 2, significa que terminó el descanso
    if (inicioDescanso !== null && (typeof act.evento !== 'number' || act.evento !== 2)) {
      // Fin de descanso - contabilizar tiempo de descanso y reiniciar trabajo
      totalDescanso += (new Date(act.fecha_hora) - new Date(inicioDescanso));
      inicioDescanso = null;
      // Reiniciar el cálculo de trabajo
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      // Continuar procesando este evento normalmente (no hacer continue aquí)
    }

    // Si está en descanso, ignorar todos los otros eventos (esto no debería ejecutarse ya)
    if (inicioDescanso !== null) {
      continue;
    }

    if (typeof eventoReal === 'number') {
      // Manejo de geocerca (solo si NO está en descanso Y está trabajando)
      if (estadoGeocerca !== null) {
        if (eventoReal === 0 && estadoGeocerca === true && horaIntervalo) {
          totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          estadoGeocerca = false;
          horaIntervalo = act.fecha_hora;
          totalSalidas++;
        } else if (eventoReal === 1 && estadoGeocerca === false && horaIntervalo) {
          totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          estadoGeocerca = true;
          horaIntervalo = act.fecha_hora;
        }
      }

      // Manejo de eventos de actividad (4: Inactividad, 5: Activo)
      // Solo se procesan si NO está en descanso Y está trabajando
      if (act.evento === 4 || act.evento === 5) {
        // Para eventos de actividad, NO actualizar horaIntervalo
        // Los eventos de actividad no deben cambiar el punto de inicio del intervalo
        // Solo es información de estado, el tiempo sigue corriendo desde horaIntervalo original
        continue; // Ignorar para el cálculo de intervalos de tiempo
      }
    }

    // NUEVO: Manejo del campo dentro_geocerca cuando NO hay eventos puntuales de geocerca
    // Si no hay eventos 0/1 pero el campo dentro_geocerca cambia, usar ese cambio
    if ((typeof eventoReal !== 'number' || (eventoReal !== 0 && eventoReal !== 1)) && 
        inicioDescanso === null && estadoGeocerca !== null) {
      // Solo procesar si cambió el estado de geocerca
      if (act.dentro_geocerca !== estadoGeocerca && horaIntervalo) {
        // Cambió el estado de geocerca - contabilizar tiempo del intervalo anterior
        if (estadoGeocerca === true) {
          totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
          if (act.dentro_geocerca === false) totalSalidas++;
        } else if (estadoGeocerca === false) {
          totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        }
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
      }
    }

    // Si estaba en descanso pero el registro actual NO tiene evento (o es diferente de 2), 
    // significa que terminó el descanso implícitamente
    if (inicioDescanso !== null && (typeof act.evento !== 'number' || act.evento !== 2)) {
      // Fin de descanso implícito
      totalDescanso += (new Date(act.fecha_hora) - new Date(inicioDescanso));
      inicioDescanso = null;
      // Reiniciar el cálculo de trabajo
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
    }

    // Al final, si hay tiempo pendiente por contabilizar
    if (i === ordenadas.length - 1) {
      if (inicioDescanso !== null) {
        // Si estaba en descanso hasta el final
        totalDescanso += (new Date(act.fecha_hora) - new Date(inicioDescanso));
      } else if (horaIntervalo && estadoGeocerca !== null) {
        // Si estaba trabajando hasta el final
        if (estadoGeocerca) {
          totalDentro += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        } else {
          totalFuera += (new Date(act.fecha_hora) - new Date(horaIntervalo));
        }
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

// Función para formatear hora - extracción directa sin conversiones
function formatHora(fechaStr) {
  // Extraer hora directamente de la cadena sin conversiones de zona horaria
  return fechaStr.slice(11, 16); // Extrae "HH:mm" de "YYYY-MM-DDTHH:mm:ss"
}

// Función para formatear intervalos de tiempo
function formatIntervalo(inicio, fin) {
  const diffMs = new Date(fin) - new Date(inicio);
  const min = Math.floor(diffMs / 60000) % 60;
  const hrs = Math.floor(diffMs / 3600000);
  return `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
}

// Genera el resumen de eventos del día para mostrar en la UI
export function generarResumenDiaMejorado(actividades) {
  if (!actividades || actividades.length === 0) return [];
  
  const eventos = [];
  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let inicioDescanso = null;
  
  // Variables para rastrear actividad dentro de geocerca
  let estadoActividad = true; // true = activo, false = inactivo
  let horaInicioActividad = null;
  let tiempoActivo = 0;
  let tiempoInactivo = 0;

  // Función para calcular desglose de actividad dentro de geocerca
  const calcularDesgloseDentro = (inicioIntervalo, finIntervalo) => {
    const subEventos = [];
    
    if (tiempoActivo > 0) {
      const min = Math.floor(tiempoActivo / 60000) % 60;
      const hrs = Math.floor(tiempoActivo / 3600000);
      const duracionTexto = `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
      subEventos.push({
        hora: '',
        descripcion: `Tiempo activo (${duracionTexto})`,
        tipo: 'desglose_activo',
        duracion: '',
        esSubevento: true
      });
    }
    
    if (tiempoInactivo > 0) {
      const min = Math.floor(tiempoInactivo / 60000) % 60;
      const hrs = Math.floor(tiempoInactivo / 3600000);
      const duracionTexto = `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
      subEventos.push({
        hora: '',
        descripcion: `Tiempo inactivo (${duracionTexto})`,
        tipo: 'desglose_inactivo',
        duracion: '',
        esSubevento: true
      });
    }
    
    return subEventos;
  };

  // Función para reiniciar contadores de actividad
  const reiniciarContadoresActividad = (fechaInicio) => {
    tiempoActivo = 0;
    tiempoInactivo = 0;
    estadoActividad = true; // Asumir activo al inicio
    horaInicioActividad = fechaInicio;
  };

  for (let i = 0; i < ordenadas.length; i++) {
    const act = ordenadas[i];
    const hora = formatHora(act.fecha_hora);

    // Determinar el evento real
    const eventoReal = (act.evento === 1 && typeof act.tipo_registro === 'number' && act.tipo_registro !== 1) 
      ? act.tipo_registro 
      : act.evento;

    // Primera entrada laboral del día O primer registro si no hay entrada explícita
    if (i === 0) {
      // Si es entrada laboral explícita, mostrar evento
      if (act.tipo_registro === 1) {
        eventos.push({
          hora,
          descripcion: 'Marcó entrada laboral',
          tipo: 'entrada',
          duracion: ''
        });
      }
      // Siempre inicializar el estado con el primer registro
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      
      // Inicializar contadores de actividad si está dentro
      if (estadoGeocerca === true) {
        reiniciarContadoresActividad(act.fecha_hora);
      }
      continue;
    }

    // Manejo de eventos de actividad (4: inactivo, 5: activo) - PROCESAR ANTES de otros eventos
    if (typeof eventoReal === 'number' && (eventoReal === 4 || eventoReal === 5) && estadoGeocerca === true && inicioDescanso === null) {
      const nuevoEstadoActividad = eventoReal === 5;
      
      // Solo procesar si cambió el estado de actividad
      if (nuevoEstadoActividad !== estadoActividad && horaInicioActividad) {
        const tiempoTranscurrido = new Date(act.fecha_hora) - new Date(horaInicioActividad);
        
        if (estadoActividad) {
          tiempoActivo += tiempoTranscurrido;
        } else {
          tiempoInactivo += tiempoTranscurrido;
        }
        
        estadoActividad = nuevoEstadoActividad;
        horaInicioActividad = act.fecha_hora;
      }
      continue;
    }

    // Manejo de descansos (nueva lógica)
    if (typeof eventoReal === 'number' && eventoReal === 2) {
      if (inicioDescanso === null) {
        // Primer evento de descanso - cerrar intervalo de trabajo previo
        if (estadoGeocerca !== null && horaIntervalo && act.fecha_hora !== horaIntervalo) {
          const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
          
          if (estadoGeocerca === true) {
            // Contabilizar tiempo final de actividad antes del descanso
            if (horaInicioActividad) {
              const tiempoFinal = new Date(act.fecha_hora) - new Date(horaInicioActividad);
              if (estadoActividad) {
                tiempoActivo += tiempoFinal;
              } else {
                tiempoInactivo += tiempoFinal;
              }
            }
            
            eventos.push({
              hora: `${formatHora(horaIntervalo)} - ${hora}`,
              descripcion: 'Tiempo dentro de geocerca',
              tipo: 'tiempo_dentro',
              duracion: `(${duracion})`
            });
            
            // Agregar desglose de actividad
            const desglose = calcularDesgloseDentro(horaIntervalo, act.fecha_hora);
            eventos.push(...desglose);
          } else {
            eventos.push({
              hora: `${formatHora(horaIntervalo)} - ${hora}`,
              descripcion: 'Tiempo fuera de geocerca',
              tipo: 'tiempo_fuera',
              duracion: `(${duracion})`
            });
          }
        }
        
        eventos.push({
          hora,
          descripcion: 'Inicio de descanso',
          tipo: 'descanso_inicio',
          duracion: ''
        });
        inicioDescanso = act.fecha_hora;
        horaIntervalo = null;
      }
      continue;
    }

    // Verificar si terminó el descanso (estaba en descanso pero el evento actual no es 2)
    if (inicioDescanso !== null && (typeof eventoReal !== 'number' || eventoReal !== 2)) {
      const duracion = formatIntervalo(inicioDescanso, act.fecha_hora);
      eventos.push({
        hora: `${formatHora(inicioDescanso)} - ${hora}`,
        descripcion: 'Tiempo en descanso',
        tipo: 'tiempo_descanso',
        duracion: `(${duracion})`
      });
      
      // Agregar evento de fin de descanso
      eventos.push({
        hora,
        descripcion: 'Terminó descanso',
        tipo: 'descanso_fin',
        duracion: ''
      });
      
      inicioDescanso = null;
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      
      // Reiniciar contadores de actividad para el nuevo período
      reiniciarContadoresActividad();
    }

    // Si aún está en descanso, saltar este evento
    if (inicioDescanso !== null) {
      continue;
    }

    // Eventos de geocerca tradicionales - PRIORIZAR evento sobre dentro_geocerca
    if (typeof eventoReal === 'number') {
      if (eventoReal === 0 && inicioDescanso === null) {
        // Salió de geocerca - cerrar intervalo dentro CON DESGLOSE DE ACTIVIDAD
        if (estadoGeocerca === true && horaIntervalo && act.fecha_hora !== horaIntervalo) {
          // Contabilizar tiempo final de actividad
          if (horaInicioActividad) {
            const tiempoFinal = new Date(act.fecha_hora) - new Date(horaInicioActividad);
            if (estadoActividad) {
              tiempoActivo += tiempoFinal;
            } else {
              tiempoInactivo += tiempoFinal;
            }
          }
          
          const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: 'Tiempo dentro de geocerca',
            tipo: 'tiempo_dentro',
            duracion: `(${duracion})`
          });
          
          // Agregar desglose de actividad
          const desglose = calcularDesgloseDentro(horaIntervalo, act.fecha_hora);
          eventos.push(...desglose);
        }
        eventos.push({
          hora,
          descripcion: 'Salió de geocerca',
          tipo: 'geocerca_salida',
          duracion: ''
        });
        estadoGeocerca = false;
        horaIntervalo = act.fecha_hora;
        // Reiniciar contadores de actividad
        tiempoActivo = 0;
        tiempoInactivo = 0;
        horaInicioActividad = null;
      } else if (eventoReal === 1 && inicioDescanso === null && estadoGeocerca === false) {
        // Solo procesar evento=1 como entrada si realmente estaba fuera
        // Entró a geocerca - cerrar intervalo fuera
        if (horaIntervalo && act.fecha_hora !== horaIntervalo) {
          const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: 'Tiempo fuera de geocerca',
            tipo: 'tiempo_fuera',
            duracion: `(${duracion})`
          });
        }
        eventos.push({
          hora,
          descripcion: 'Entró a geocerca',
          tipo: 'geocerca_entrada',
          duracion: ''
        });
        estadoGeocerca = true;
        horaIntervalo = act.fecha_hora;
        // Inicializar contadores de actividad
        reiniciarContadoresActividad(act.fecha_hora);
      }
      // Ignorar eventos 4 y 5 (actividad) en el resumen de eventos
      // Solo se usan internamente para el estado
    }

    // NUEVO: Manejo del campo dentro_geocerca cuando NO hay eventos puntuales de geocerca
    // Si no hay eventos 0/1 pero el campo dentro_geocerca cambia, usar ese cambio para el resumen
    if ((typeof eventoReal !== 'number' || (eventoReal !== 0 && eventoReal !== 1)) && 
        inicioDescanso === null && estadoGeocerca !== null) {
      // Solo procesar si cambió el estado de geocerca
      if (act.dentro_geocerca !== estadoGeocerca && horaIntervalo && act.fecha_hora !== horaIntervalo) {
        // Cambió el estado de geocerca - mostrar intervalo anterior
        const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
        if (estadoGeocerca === true) {
          // Contabilizar tiempo final de actividad
          if (horaInicioActividad) {
            const tiempoFinal = new Date(act.fecha_hora) - new Date(horaInicioActividad);
            if (estadoActividad) {
              tiempoActivo += tiempoFinal;
            } else {
              tiempoInactivo += tiempoFinal;
            }
          }
          
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: 'Tiempo dentro de geocerca',
            tipo: 'tiempo_dentro',
            duracion: `(${duracion})`
          });
          
          // Agregar desglose de actividad
          const desglose = calcularDesgloseDentro(horaIntervalo, act.fecha_hora);
          eventos.push(...desglose);
        } else if (estadoGeocerca === false) {
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: 'Tiempo fuera de geocerca',
            tipo: 'tiempo_fuera',
            duracion: `(${duracion})`
          });
        }
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        
        // Manejar contadores de actividad según nuevo estado
        if (act.dentro_geocerca === true) {
          reiniciarContadoresActividad(act.fecha_hora);
        } else {
          tiempoActivo = 0;
          tiempoInactivo = 0;
          horaInicioActividad = null;
        }
      }
    }

    // Salida laboral - cerrar cualquier intervalo pendiente
    if (act.tipo_registro === 0) {
      if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null && inicioDescanso === null) {
        const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
        
        if (estadoGeocerca === true) {
          // Contabilizar tiempo final de actividad
          if (horaInicioActividad) {
            const tiempoFinal = new Date(act.fecha_hora) - new Date(horaInicioActividad);
            if (estadoActividad) {
              tiempoActivo += tiempoFinal;
            } else {
              tiempoInactivo += tiempoFinal;
            }
          }
          
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: 'Tiempo dentro de geocerca',
            tipo: 'tiempo_dentro',
            duracion: `(${duracion})`
          });
          
          // Agregar desglose de actividad
          const desglose = calcularDesgloseDentro(horaIntervalo, act.fecha_hora);
          eventos.push(...desglose);
        } else {
          eventos.push({
            hora: `${formatHora(horaIntervalo)} - ${hora}`,
            descripcion: 'Tiempo fuera de geocerca',
            tipo: 'tiempo_fuera',
            duracion: `(${duracion})`
          });
        }
      }
      eventos.push({
        hora,
        descripcion: 'Marcó salida laboral',
        tipo: 'salida',
        duracion: ''
      });
      estadoGeocerca = null;
      horaIntervalo = null;
      
      // Reiniciar contadores de actividad para el siguiente período
      reiniciarContadoresActividad();
    }

    // Al final del bucle, si es el último registro y hay intervalo pendiente
    if (i === ordenadas.length - 1 && horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null && inicioDescanso === null) {
      const duracion = formatIntervalo(horaIntervalo, act.fecha_hora);
      
      if (estadoGeocerca === true) {
        // Contabilizar tiempo final de actividad
        if (horaInicioActividad) {
          const tiempoFinal = new Date(act.fecha_hora) - new Date(horaInicioActividad);
          if (estadoActividad) {
            tiempoActivo += tiempoFinal;
          } else {
            tiempoInactivo += tiempoFinal;
          }
        }
        
        eventos.push({
          hora: `${formatHora(horaIntervalo)} - ${formatHora(act.fecha_hora)}`,
          descripcion: 'Tiempo dentro de geocerca',
          tipo: 'tiempo_dentro',
          duracion: `(${duracion})`
        });
        
        // Agregar desglose de actividad
        const desglose = calcularDesgloseDentro(horaIntervalo, act.fecha_hora);
        eventos.push(...desglose);
      } else {
        eventos.push({
          hora: `${formatHora(horaIntervalo)} - ${formatHora(act.fecha_hora)}`,
          descripcion: 'Tiempo fuera de geocerca',
          tipo: 'tiempo_fuera',
          duracion: `(${duracion})`
        });
      }
    }

    // Entrada laboral (que no sea la primera)
    if (i > 0 && act.tipo_registro === 1) {
      // Verificar si hay una salida anterior para mostrar esta entrada
      let mostrarEntrada = false;
      for (let j = i - 1; j >= 0; j--) {
        if (ordenadas[j].tipo_registro === 0) {
          mostrarEntrada = true;
          break;
        } else if (ordenadas[j].tipo_registro === 1) {
          break;
        }
      }
      
      if (mostrarEntrada) {
        eventos.push({
          hora,
          descripcion: 'Marcó entrada laboral',
          tipo: 'entrada',
          duracion: ''
        });
        
        // Solo reiniciar el estado si realmente estaba fuera del trabajo
        if (estadoGeocerca === null) {
          estadoGeocerca = act.dentro_geocerca;
          horaIntervalo = act.fecha_hora;
          
          // Inicializar contadores de actividad si entra dentro de geocerca
          if (act.dentro_geocerca === true) {
            reiniciarContadoresActividad(act.fecha_hora);
          }
        }
      }
      // Si ya estaba trabajando, ignorar entradas duplicadas (no reiniciar horaIntervalo)
    }
  }
  
  return eventos;
}

// Función para generar intervalos consistente con TimelineComponent y PDF
export function generarEventosYIntervalosDelResumen(actividades) {
  if (!actividades || actividades.length === 0) return { eventos: [], intervalos: [] };

  const eventos = [];
  const intervalos = [];
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let inicioDescanso = null;
  let estadoActividad = true; // true = activo, false = inactivo (solo cuando está dentro)

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  let i = 0;
  while (i < ordenadas.length) {
    const act = ordenadas[i];
    
    // Entrada laboral
    if (i === 0 && act.tipo_registro === 1) {
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      estadoActividad = true; // Asumir activo al entrar
      i++;
      continue;
    }

    // Detectar hueco sospechoso (>2h)
    // PERO solo si NO hay una salida laboral que justifique el gap
    if (i > 0) {
      const prev = ordenadas[i - 1];
      const diffMs = new Date(act.fecha_hora) - new Date(prev.fecha_hora);
      
      // Verificar si el gap está justificado por salida laboral
      const esSalidaLegitima = prev.tipo_registro === 0 || 
                              (prev.tipo_registro === 0 && act.tipo_registro === 1);
      
      if (diffMs > 2 * 60 * 60 * 1000 && !esSalidaLegitima) {
        // Cerrar intervalo anterior
        if (horaIntervalo && horaIntervalo !== prev.fecha_hora && estadoGeocerca !== null) {
          intervalos.push({
            inicio: new Date(horaIntervalo),
            fin: new Date(prev.fecha_hora),
            dentro: estadoGeocerca === true,
            fuera: estadoGeocerca === false,
            descanso: false,
            sospechoso: false,
            activo: estadoActividad,
            tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
            duracionTexto: formatIntervalo(horaIntervalo, prev.fecha_hora)
          });
        }
        // Intervalo sospechoso SOLO si no está justificado por salida laboral
        intervalos.push({
          inicio: new Date(prev.fecha_hora),
          fin: new Date(act.fecha_hora),
          dentro: false,
          fuera: false,
          descanso: false,
          sospechoso: true,
          activo: true,
          tipo: 'sospechoso',
          duracionTexto: formatIntervalo(prev.fecha_hora, act.fecha_hora)
        });
        horaIntervalo = act.fecha_hora;
      }
    }

    if (typeof act.evento === 'number') {
      // Determinar el evento real - PRIORIZAR evento específico sobre dentro_geocerca
      const eventoReal = (act.evento === 1 && typeof act.tipo_registro === 'number' && act.tipo_registro !== 1) 
        ? act.tipo_registro 
        : act.evento;
        
      // Manejo de descansos
      if (eventoReal === 2) {
        // Durante el descanso - solo inicializar la primera vez
        if (inicioDescanso === null) {
          // Cerrar intervalo anterior antes del descanso
          if (estadoGeocerca !== null && horaIntervalo) {
            intervalos.push({
              inicio: new Date(horaIntervalo),
              fin: new Date(act.fecha_hora),
              dentro: estadoGeocerca === true,
              fuera: estadoGeocerca === false,
              descanso: false,
              sospechoso: false,
              activo: estadoActividad,
              tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
              duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
            });
          }
          inicioDescanso = act.fecha_hora;
          horaIntervalo = null;
        }
        
        // Buscar hasta dónde continúan los eventos=2 consecutivos
        let finDescanso = act.fecha_hora;
        let siguienteEventoGeoIndex = i + 1;
        
        // Avanzar mientras haya eventos=2 consecutivos
        while (siguienteEventoGeoIndex < ordenadas.length && ordenadas[siguienteEventoGeoIndex].evento === 2) {
          finDescanso = ordenadas[siguienteEventoGeoIndex].fecha_hora;
          siguienteEventoGeoIndex++;
        }
        
        // Crear el intervalo de descanso completo
        intervalos.push({
          inicio: new Date(inicioDescanso),
          fin: new Date(finDescanso),
          dentro: false,
          fuera: false,
          descanso: true,
          sospechoso: false,
          activo: true,
          tipo: 'descanso',
          duracionTexto: formatIntervalo(inicioDescanso, finDescanso)
        });

        // Agregar evento de terminación de descanso
        eventos.push({
          hora: finDescanso.split(' ')[1]?.substring(0, 5) || '',
          descripcion: 'Terminó descanso',
          tipo: 'descanso-fin',
          duracion: formatIntervalo(inicioDescanso, finDescanso)
        });
        
        // Preparar para el siguiente intervalo después del descanso
        if (siguienteEventoGeoIndex < ordenadas.length) {
          const siguienteEvento = ordenadas[siguienteEventoGeoIndex];
          estadoGeocerca = siguienteEvento.dentro_geocerca;
          horaIntervalo = finDescanso;
          estadoActividad = true;
        }
        
        inicioDescanso = null;
        i = siguienteEventoGeoIndex - 1; // -1 porque el bucle hará i++
        i++;
        continue;
      } else if (eventoReal === 3) {
        // Evento 3 ya no se usa en la nueva lógica - ignorar
        i++;
        continue;
      }

      // Si está en descanso, ignorar otros eventos
      if (inicioDescanso !== null) {
        i++;
        continue;
      }

      // Manejo de eventos de actividad
      if (eventoReal === 4 || eventoReal === 5) {
        // Solo actualizar el estado de actividad sin crear intervalos
        // Los eventos de actividad no deben fragmentar los intervalos de geocerca
        estadoActividad = eventoReal === 5; // true si es activo, false si es inactivo
        i++;
        continue;
      }

      // Manejo de geocerca - PRIORIZAR evento sobre dentro_geocerca
      if (eventoReal === 0) {
        // Salió de geocerca
        if (estadoGeocerca === true && horaIntervalo) {
          intervalos.push({
            inicio: new Date(horaIntervalo),
            fin: new Date(act.fecha_hora),
            dentro: true,
            fuera: false,
            descanso: false,
            sospechoso: false,
            activo: estadoActividad,
            tipo: estadoActividad ? 'dentro-activo' : 'dentro-inactivo',
            duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
          });
        }
        estadoGeocerca = false;
        horaIntervalo = act.fecha_hora;
        estadoActividad = true;
      } else if (eventoReal === 1) {
        // Entró a la geocerca
        if (estadoGeocerca === false && horaIntervalo) {
          intervalos.push({
            inicio: new Date(horaIntervalo),
            fin: new Date(act.fecha_hora),
            dentro: false,
            fuera: true,
            descanso: false,
            sospechoso: false,
            activo: true,
            tipo: 'fuera',
            duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
          });
        }
        estadoGeocerca = true;
        horaIntervalo = act.fecha_hora;
        estadoActividad = true;
      }
    }

    // NUEVO: Manejo del campo dentro_geocerca cuando NO hay eventos puntuales de geocerca
    // Si no hay eventos 0/1 pero el campo dentro_geocerca cambia, usar ese cambio
    if ((typeof act.evento !== 'number' || (act.evento !== 0 && act.evento !== 1)) && 
        inicioDescanso === null && estadoGeocerca !== null) {
      // Solo procesar si cambió el estado de geocerca
      if (i > 0 && act.dentro_geocerca !== undefined && act.dentro_geocerca !== estadoGeocerca && horaIntervalo) {
        intervalos.push({
          inicio: new Date(horaIntervalo),
          fin: new Date(act.fecha_hora),
          dentro: estadoGeocerca === true,
          fuera: estadoGeocerca === false,
          descanso: false,
          sospechoso: false,
          activo: estadoActividad,
          tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
          duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
        });
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        if (act.dentro_geocerca) estadoActividad = true;
      }
    }

    // Si cambia el estado de geocerca sin evento explícito (lógica original como fallback)
    if (i > 0 && act.dentro_geocerca !== undefined && act.dentro_geocerca !== estadoGeocerca && inicioDescanso === null) {
      if (estadoGeocerca !== null && horaIntervalo) {
        intervalos.push({
          inicio: new Date(horaIntervalo),
          fin: new Date(act.fecha_hora),
          dentro: estadoGeocerca === true,
          fuera: estadoGeocerca === false,
          descanso: false,
          sospechoso: false,
          activo: estadoActividad,
          tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
          duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
        });
      }
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      if (act.dentro_geocerca) estadoActividad = true;
    }

    // Salida laboral
    if (act.tipo_registro === 0) {
      if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null && inicioDescanso === null) {
        intervalos.push({
          inicio: new Date(horaIntervalo),
          fin: new Date(act.fecha_hora),
          dentro: estadoGeocerca === true,
          fuera: estadoGeocerca === false,
          descanso: false,
          sospechoso: false,
          activo: estadoActividad,
          tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
          duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
        });
      }
      estadoGeocerca = null;
      horaIntervalo = null;
    }

    // Al final del bucle, verificar si hay intervalo pendiente
    if (i === ordenadas.length - 1) {
      if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null && inicioDescanso === null) {
        intervalos.push({
          inicio: new Date(horaIntervalo),
          fin: new Date(act.fecha_hora),
          dentro: estadoGeocerca === true,
          fuera: estadoGeocerca === false,
          descanso: false,
          sospechoso: false,
          activo: estadoActividad,
          tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
          duracionTexto: formatIntervalo(horaIntervalo, act.fecha_hora)
        });
      }
    }

    i++;
  }
  
  return { eventos, intervalos };
}
