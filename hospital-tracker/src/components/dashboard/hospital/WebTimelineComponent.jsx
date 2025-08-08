import React from 'react';

// Función para formatear tiempo - extracción directa sin conversiones
function formatTime(date) {
  // Si es un objeto Date, convertir a string ISO y extraer la hora
  const isoString = date.toISOString();
  return isoString.slice(11, 16); // Extrae "HH:mm"
}

function formatHora(fechaStr) {
  // Extraer hora directamente de la cadena sin conversiones de zona horaria
  return fechaStr.slice(11, 16); // Extrae "HH:mm" de "YYYY-MM-DDTHH:mm:ss"
}

// Función para calcular posición absoluta en porcentaje
function calculateAbsolutePosition(time, startTime, endTime) {
  const totalMs = endTime - startTime;
  const eventMs = time - startTime;
  if (totalMs <= 0) return 0;
  return Math.max(0, Math.min(100, (eventMs / totalMs) * 100));
}

// Generar escala de tiempo con marcas cada hora
function generateTimeScale(startTime, endTime) {
  const scale = [];
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Redondear al inicio de la hora más cercana
  start.setMinutes(0, 0, 0);
  if (start < new Date(startTime)) {
    start.setHours(start.getHours() + 1);
  }
  
  let current = new Date(start);
  while (current <= end) {
    scale.push(new Date(current));
    current.setHours(current.getHours() + 1);
  }
  
  return scale;
}

// Función para determinar el tipo de nodo
function getNodeType(evento) {
  switch (evento.tipo) {
    case 'entrada': return 'entry';
    case 'salida': return 'exit';
    case 'descanso': return 'break';
    case 'geocerca': return 'geofence';
    default: return 'default';
  }
}

// Función para obtener ícono del evento
function getEventIcon(evento) {
  switch (evento.tipo) {
    case 'entrada': return '🟢';
    case 'salida': return '🔴';
    case 'geocerca': 
      return evento.descripcion.includes('Entró') ? '🟢' : '🔴';
    case 'descanso': return '⏸️';
    default: return '⚪';
  }
}

// Función para generar eventos y intervalos basados en el resumen del día
function generarEventosYIntervalosDelResumen(actividades) {
  if (!actividades || actividades.length === 0) return { eventos: [], intervalos: [] };

  console.log(`[DEBUG WEB] Procesando ${actividades.length} actividades:`, actividades.map(a => ({
    fecha_hora: a.fecha_hora,
    evento: a.evento,
    tipo_registro: a.tipo_registro,
    dentro_geocerca: a.dentro_geocerca
  })));

  const eventos = [];
  const intervalos = [];
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let inicioDescanso = null;
  let estadoActividad = true; // true = activo, false = inactivo (solo cuando está dentro)

  const formatIntervalo = (inicio, fin) => {
    const diffMs = new Date(fin) - new Date(inicio);
    const min = Math.floor(diffMs / 60000) % 60;
    const hrs = Math.floor(diffMs / 3600000);
    return `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
  };

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  let i = 0;
  
  while (i < ordenadas.length) {
    const act = ordenadas[i];
    const hora = formatHora(act.fecha_hora);
    
    console.log(`[DEBUG WEB] Procesando registro ${i}: ${formatHora(act.fecha_hora)}, evento=${act.evento}, tipo_registro=${act.tipo_registro}, dentro_geocerca=${act.dentro_geocerca}, estadoGeocerca=${estadoGeocerca}, horaIntervalo=${horaIntervalo ? formatHora(horaIntervalo) : 'null'}`);
    // PRIORIDAD 1: Manejo de descansos ANTES que todo lo demás
    if (typeof act.evento === 'number' && act.evento === 2) {
      if (inicioDescanso === null) {
        // Primer evento de descanso del período
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
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'descanso',
          descripcion: 'Inicio descanso',
          hora
        });
        horaIntervalo = null;
      }
      
      // Verificar si es el último evento de descanso mirando hacia adelante
      const siguientesEventos = ordenadas.slice(i + 1);
      const proximoDescanso = siguientesEventos.find(siguiente => 
        typeof siguiente.evento === 'number' && siguiente.evento === 2
      );
      
      // Si no hay más eventos de descanso próximos (dentro de los próximos 10 minutos)
      let esFinDelDescanso = !proximoDescanso;
      if (proximoDescanso) {
        const tiempoHastaProximo = new Date(proximoDescanso.fecha_hora) - new Date(act.fecha_hora);
        // Si el próximo descanso está a más de 10 minutos, considerarlo un período separado
        esFinDelDescanso = tiempoHastaProximo > 10 * 60 * 1000;
      }
      
      if (esFinDelDescanso && inicioDescanso !== null) {
        // Buscar el siguiente evento que NO sea de descanso para determinar cuándo realmente terminó
        const siguientesEventosNoDescanso = ordenadas.slice(i + 1);
        const proximoEventoNoDescanso = siguientesEventosNoDescanso.find(siguiente => 
          typeof siguiente.evento !== 'number' || siguiente.evento !== 2
        );
        
        let finRealDescanso = act.fecha_hora;
        if (proximoEventoNoDescanso) {
          finRealDescanso = proximoEventoNoDescanso.fecha_hora;
        }
        
        // Fin de descanso - contabilizar tiempo de descanso desde inicio hasta el siguiente evento no-descanso
        intervalos.push({
          inicio: new Date(inicioDescanso),
          fin: new Date(finRealDescanso),
          dentro: false,
          fuera: false,
          descanso: true,
          sospechoso: false,
          activo: true,
          tipo: 'descanso',
          duracionTexto: formatIntervalo(inicioDescanso, finRealDescanso)
        });
        eventos.push({
          time: new Date(finRealDescanso),
          tipo: 'descanso',
          descripcion: 'Terminó descanso',
          hora: formatHora(finRealDescanso)
        });
        inicioDescanso = null;
        // Reiniciar el cálculo de trabajo
        estadoGeocerca = proximoEventoNoDescanso ? proximoEventoNoDescanso.dentro_geocerca : act.dentro_geocerca;
        horaIntervalo = finRealDescanso;
        estadoActividad = true; // Asumir activo al salir del descanso
      }
      
      // Durante el descanso, ignorar todos los otros eventos
      i++;
      continue;
    }

    // Si estaba en descanso pero el evento actual NO es 2, significa que terminó el descanso
    if (inicioDescanso !== null && (typeof act.evento !== 'number' || act.evento !== 2)) {
      // Fin de descanso - contabilizar tiempo de descanso y reiniciar trabajo
      intervalos.push({
        inicio: new Date(inicioDescanso),
        fin: new Date(act.fecha_hora),
        dentro: false,
        fuera: false,
        descanso: true,
        sospechoso: false,
        activo: true,
        tipo: 'descanso',
        duracionTexto: formatIntervalo(inicioDescanso, act.fecha_hora)
      });
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'descanso',
        descripcion: 'Terminó descanso',
        hora
      });
      inicioDescanso = null;
      // Reiniciar el cálculo de trabajo
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      estadoActividad = true; // Asumir activo al salir del descanso
      // Continuar procesando este evento normalmente (no hacer continue aquí)
    }

    // Si está en descanso, ignorar todos los otros eventos
    if (inicioDescanso !== null) {
      i++;
      continue;
    }

    // PRIORIDAD 2: Manejo de tipo_registro: 0=salida laboral, 1=entrada laboral
    if (typeof act.tipo_registro === 'number') {
      if (act.tipo_registro === 0) {
        // Salida laboral - contabilizar tiempo hasta este punto si estaba trabajando
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
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'salida',
          descripcion: 'Salida laboral',
          hora
        });
        // Parar el cálculo hasta que marque entrada nuevamente
        estadoGeocerca = null;
        horaIntervalo = null;
        i++;
        continue;
      } else if (act.tipo_registro === 1) {
        // Entrada laboral - reiniciar el cálculo SOLO si no estaba ya trabajando
        if (estadoGeocerca === null || i === 0) {
          eventos.push({
            time: new Date(act.fecha_hora),
            tipo: 'entrada',
            descripcion: 'Entrada laboral',
            hora
          });
          estadoGeocerca = act.dentro_geocerca;
          horaIntervalo = act.fecha_hora;
          estadoActividad = true; // Asumir activo al entrar
        }
        // Si ya estaba trabajando (estadoGeocerca !== null), NO hacer continue
        // para que se procesen los eventos 4/5 en este mismo registro
        if (estadoGeocerca !== null && i > 0) {
          // No hacer continue aquí, permitir que se procesen otros eventos
        } else {
          i++;
          continue;
        }
      }
    }

    // Detectar hueco sospechoso (>2h) - PERO solo si NO hay salida laboral que lo justifique
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
            activo: estadoActividad, // Nuevo campo para estado de actividad
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
        // No cambiar estadoGeocerca ni estadoActividad
      }
    }

    if (typeof act.evento === 'number') {
      // console.log(`[DEBUG WEB] Evento numérico encontrado: ${act.evento} a las ${formatHora(act.fecha_hora)}`);
      // PRIORIDAD 1: Manejo de eventos de actividad ANTES de geocerca
      if (act.evento === 4 || act.evento === 5) {
        const nuevoEstadoActividad = act.evento === 5; // 5 = activo, 4 = inactivo
        
        // console.log(`[DEBUG WEB] Evento ${act.evento} (${nuevoEstadoActividad ? 'ACTIVO' : 'INACTIVO'}) a las ${formatHora(act.fecha_hora)}, estadoGeocerca=${estadoGeocerca}, estadoActividad=${estadoActividad}, inicioDescanso=${inicioDescanso}`);
        
        // Solo procesar si está dentro de geocerca y cambia el estado de actividad
        if (estadoGeocerca === true && nuevoEstadoActividad !== estadoActividad) {
          // console.log(`[DEBUG WEB] CAMBIO DE ACTIVIDAD: ${estadoActividad ? 'ACTIVO' : 'INACTIVO'} -> ${nuevoEstadoActividad ? 'ACTIVO' : 'INACTIVO'}`);
          // Cerrar intervalo anterior con el estado de actividad anterior
          if (horaIntervalo) {
            const tipoAnterior = estadoActividad ? 'dentro-activo' : 'dentro-inactivo';
            // console.log(`[DEBUG WEB] Cerrando intervalo ${tipoAnterior} desde ${formatHora(horaIntervalo)} hasta ${formatHora(act.fecha_hora)}`);
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
          // Actualizar estado y reiniciar intervalo
          estadoActividad = nuevoEstadoActividad;
          horaIntervalo = act.fecha_hora;
        }
        // Si no está dentro de geocerca, solo actualizar el estado para futuro uso
        else if (estadoGeocerca !== true) {
          // console.log(`[DEBUG WEB] Fuera de geocerca, solo actualizando estado actividad para futuro uso`);
          estadoActividad = nuevoEstadoActividad;
        }
        i++;
        continue;
      }

      // PRIORIDAD 2: Manejo de geocerca (después de actividad)
      if (act.evento === 0) {
        // console.log(`[DEBUG WEB] SALIÓ de geocerca a las ${formatHora(act.fecha_hora)}, estadoActividad=${estadoActividad}`);
        // Salió de geocerca
        if (estadoGeocerca === true && horaIntervalo) {
          const tipoIntervalo = estadoActividad ? 'dentro-activo' : 'dentro-inactivo';
          // console.log(`[DEBUG WEB] Cerrando intervalo ${tipoIntervalo} por salida de geocerca`);
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
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'geocerca',
          descripcion: 'Salió geocerca',
          hora
        });
        estadoGeocerca = false;
        horaIntervalo = act.fecha_hora;
        estadoActividad = true; // Reset a activo cuando sale
      } else if (act.evento === 1) {
        // console.log(`[DEBUG WEB] ENTRÓ a geocerca a las ${formatHora(act.fecha_hora)}`);
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
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'geocerca',
          descripcion: 'Entró geocerca',
          hora
        });
        estadoGeocerca = true;
        horaIntervalo = act.fecha_hora;
        estadoActividad = true; // Asumir activo al entrar
      }
    }

    // Si cambia el estado de geocerca sin evento explícito
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
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'geocerca',
        descripcion: act.dentro_geocerca ? 'Entró geocerca' : 'Salió geocerca',
        hora
      });
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      if (act.dentro_geocerca) estadoActividad = true; // Asumir activo al entrar
    }

    i++;
  }

  // Manejo del intervalo final si quedó uno abierto (no hubo salida laboral final)
  if (horaIntervalo && estadoGeocerca !== null && inicioDescanso === null) {
    const ultimaActividad = ordenadas[ordenadas.length - 1];
    intervalos.push({
      inicio: new Date(horaIntervalo),
      fin: new Date(ultimaActividad.fecha_hora),
      dentro: estadoGeocerca === true,
      fuera: estadoGeocerca === false,
      descanso: false,
      sospechoso: false,
      activo: estadoActividad,
      tipo: estadoGeocerca ? (estadoActividad ? 'dentro-activo' : 'dentro-inactivo') : 'fuera',
      duracionTexto: formatIntervalo(horaIntervalo, ultimaActividad.fecha_hora)
    });
  }

  console.log(`[DEBUG WEB] Intervalos generados:`, intervalos.map(i => ({
    tipo: i.tipo,
    activo: i.activo,
    inicio: formatHora(i.inicio.toISOString()),
    fin: formatHora(i.fin.toISOString()),
    duracion: i.duracionTexto
  })));

  return { eventos, intervalos };
}

// Función para agrupar intervalos consecutivos del mismo tipo básico
function agruparIntervalosConsecutivos(intervalos, eventos) {
  if (!intervalos || intervalos.length === 0) return [];

  console.log('[DEBUG AGRUPACION] Iniciando agrupación con intervalos:', intervalos.map(i => ({
    tipo: i.tipo,
    inicio: formatHora(i.inicio.toISOString()),
    fin: formatHora(i.fin.toISOString())
  })));

  const agrupados = [];
  let grupoActual = null;

  // Crear un set de timestamps de salidas laborales para detectar interrupciones
  const salidasLaborales = new Set();
  eventos.forEach(evento => {
    if (evento.tipo === 'salida') {
      console.log('[DEBUG AGRUPACION] Salida laboral detectada en:', formatTime(evento.time));
      salidasLaborales.add(evento.time.getTime());
    }
  });

  intervalos.forEach((intervalo, idx) => {
    // Determinar el tipo básico (ignorar activo/inactivo para agrupación)
    let tipoBasico;
    if (intervalo.tipo === 'descanso' || intervalo.descanso) {
      tipoBasico = 'descanso';
    } else if (intervalo.tipo === 'sospechoso' || intervalo.sospechoso) {
      tipoBasico = 'sospechoso';
    } else if (intervalo.tipo === 'fuera' || intervalo.fuera) {
      tipoBasico = 'fuera';
    } else if (intervalo.tipo === 'dentro-activo' || intervalo.tipo === 'dentro-inactivo' || intervalo.dentro) {
      tipoBasico = 'dentro';
    } else {
      tipoBasico = 'desconocido';
    }

    // Verificar si hay una salida laboral entre el grupo actual y este intervalo
    let haySalidaLaboral = false;
    if (grupoActual) {
      const finGrupoActual = grupoActual.fin.getTime();
      const inicioIntervaloActual = intervalo.inicio.getTime();
      
      console.log(`[DEBUG AGRUPACION] Verificando salida laboral entre ${formatHora(new Date(finGrupoActual).toISOString())} y ${formatHora(new Date(inicioIntervaloActual).toISOString())}`);
      
      // Buscar si hay alguna salida laboral entre estos timestamps (INCLUSIVE en los límites)
      for (const salidaTimestamp of salidasLaborales) {
        if (salidaTimestamp >= finGrupoActual && salidaTimestamp <= inicioIntervaloActual) {
          console.log(`[DEBUG AGRUPACION] ¡Salida laboral encontrada en medio! ${formatHora(new Date(salidaTimestamp).toISOString())}`);
          haySalidaLaboral = true;
          break;
        }
      }
    }

    // Si es el primer intervalo, es de un tipo diferente, o hay una salida laboral en el medio
    if (!grupoActual || grupoActual.tipoBasico !== tipoBasico || haySalidaLaboral) {
      // Finalizar grupo anterior si existe
      if (grupoActual) {
        console.log(`[DEBUG AGRUPACION] Finalizando grupo ${grupoActual.tipoBasico} de ${formatHora(grupoActual.inicio.toISOString())} a ${formatHora(grupoActual.fin.toISOString())}`);
        agrupados.push(grupoActual);
      }
      
      // Crear nuevo grupo
      console.log(`[DEBUG AGRUPACION] Creando nuevo grupo ${tipoBasico} desde ${formatHora(intervalo.inicio.toISOString())} (razón: ${!grupoActual ? 'primer intervalo' : grupoActual.tipoBasico !== tipoBasico ? 'tipo diferente' : 'salida laboral en medio'})`);
      grupoActual = {
        tipoBasico,
        inicio: intervalo.inicio,
        fin: intervalo.fin,
        intervalosOriginales: [intervalo],
        // Preservar algunas propiedades del primer intervalo
        dentro: intervalo.dentro,
        fuera: intervalo.fuera,
        descanso: intervalo.descanso,
        sospechoso: intervalo.sospechoso
      };
    } else {
      // Extender el grupo actual
      console.log(`[DEBUG AGRUPACION] Extendiendo grupo ${tipoBasico} hasta ${formatHora(intervalo.fin.toISOString())}`);
      grupoActual.fin = intervalo.fin;
      grupoActual.intervalosOriginales.push(intervalo);
    }
  });

  // Agregar el último grupo
  if (grupoActual) {
    console.log(`[DEBUG AGRUPACION] Finalizando último grupo ${grupoActual.tipoBasico} de ${formatHora(grupoActual.inicio.toISOString())} a ${formatHora(grupoActual.fin.toISOString())}`);
    agrupados.push(grupoActual);
  }

  console.log('[DEBUG AGRUPACION] Grupos finales:', agrupados.map(g => ({
    tipo: g.tipoBasico,
    inicio: formatHora(g.inicio.toISOString()),
    fin: formatHora(g.fin.toISOString()),
    duracion: `${Math.floor((g.fin - g.inicio) / 60000)}min`
  })));

  // Calcular duración total y etiqueta para cada grupo
  return agrupados.map(grupo => {
    const diffMs = new Date(grupo.fin) - new Date(grupo.inicio);
    const min = Math.floor(diffMs / 60000) % 60;
    const hrs = Math.floor(diffMs / 3600000);
    const duracionTexto = `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;

    return {
      ...grupo,
      duracionTexto,
      // Para compatibilidad con el código existente
      tipo: grupo.tipoBasico
    };
  });
}

// Función mejorada para evitar superposición de etiquetas
function calculateLabelPositions(eventos, displayStart, displayEnd) {
  const MIN_DISTANCE = 120; // Distancia mínima entre etiquetas en px
  
  // Convertir a timestamps para sincronización exacta
  const displayStartTimestamp = displayStart.getTime();
  const displayEndTimestamp = displayEnd.getTime();
  
  const positions = eventos.map((evento, idx) => {
    const eventoTimestamp = evento.time.getTime ? evento.time.getTime() : new Date(evento.time).getTime();
    const position = calculateAbsolutePosition(eventoTimestamp, displayStartTimestamp, displayEndTimestamp);
    
    return {
      originalPosition: position,
      index: idx,
      isAbove: idx % 2 === 0, // Alternar arriba/abajo por defecto
      adjustedPosition: position
    };
  });

  // Resolver conflictos de superposición
  for (let i = 1; i < positions.length; i++) {
    const current = positions[i];
    const previous = positions[i - 1];
    
    const distance = Math.abs(current.originalPosition - previous.adjustedPosition);
    
    if (distance < MIN_DISTANCE / 10) { // Convertir px a porcentaje aproximado
      // Si están muy cerca, forzar posición opuesta
      current.isAbove = !previous.isAbove;
      
      // Si aún están muy cerca horizontalmente, ajustar posición
      if (distance < MIN_DISTANCE / 20) {
        const offset = MIN_DISTANCE / 20;
        current.adjustedPosition = previous.adjustedPosition + (current.originalPosition > previous.originalPosition ? offset : -offset);
        current.adjustedPosition = Math.max(0, Math.min(100, current.adjustedPosition));
      }
    }
  }

  return positions;
}

const WebTimelineComponent = ({ actividades, titulo = "Cronología del Día" }) => {
  if (!actividades || actividades.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{titulo}</h3>
        <div className="text-center text-gray-500 py-8">
          No hay actividades para mostrar
        </div>
      </div>
    );
  }

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
  const startTime = new Date(ordenadas[0].fecha_hora);
  const endTime = new Date(ordenadas[ordenadas.length - 1].fecha_hora);
  
  // Margen de 45 minutos para mejor visualización
  const margin = 45 * 60 * 1000;
  const displayStart = new Date(startTime.getTime() - margin);
  const displayEnd = new Date(endTime.getTime() + margin);
  
  const timeScale = generateTimeScale(displayStart, displayEnd);
  const { eventos: eventosClave, intervalos } = generarEventosYIntervalosDelResumen(ordenadas);
  
  // Agrupar intervalos consecutivos del mismo tipo básico para evitar solapamiento
  // PERO respetando las salidas laborales como separadores
  const intervalosAgrupados = agruparIntervalosConsecutivos(intervalos, eventosClave);
  
  // Calcular posiciones mejoradas para evitar superposición
  const labelPositions = calculateLabelPositions(eventosClave, displayStart, displayEnd);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-green-600 mb-6 flex items-center gap-2">
        <span>📅</span> {titulo}
      </h3>
      
      {/* Timeline Container - MÁS LIMPIO COMO PDF */}
      <div className="relative w-full bg-gray-50 rounded-lg p-6 border border-gray-100" style={{ minHeight: '200px' }}>
        {/* Escala de tiempo superior - MÁS ARRIBA */}
        <div className="relative mb-12 h-8">
          {timeScale.map((time, idx) => {
            const position = calculateAbsolutePosition(time, displayStart, displayEnd);
            return (
              <div key={idx} className="absolute" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                <div className="text-xs text-gray-600 font-medium mb-3 text-center">
                  {formatTime(time)}
                </div>
                <div className="w-px h-6 bg-gray-400 mx-auto"></div>
              </div>
            );
          })}
        </div>
        
        {/* Barra principal de tiempo */}
        <div className="relative mb-6">
          {/* Barra base - MÁS ELEGANTE COMO PDF */}
          <div className="w-full h-2 bg-gray-200 rounded-sm relative shadow-sm">
            {/* Líneas conectoras segmentadas - RESPETAN SALIDAS LABORALES */}
            {eventosClave.length > 1 && (() => {
              const segmentos = [];
              let inicioSegmento = null;
              let trabajandoActualmente = true; // Asumimos que empieza trabajando
              
              eventosClave.forEach((evento, idx) => {
                if (evento.tipo === 'entrada') {
                  // Inicio de nuevo segmento laboral
                  if (!trabajandoActualmente) {
                    inicioSegmento = evento;
                    trabajandoActualmente = true;
                  }
                } else if (evento.tipo === 'salida') {
                  // Fin del segmento laboral actual
                  if (trabajandoActualmente && inicioSegmento) {
                    const startPos = calculateAbsolutePosition(inicioSegmento.time, displayStart, displayEnd);
                    const endPos = calculateAbsolutePosition(evento.time, displayStart, displayEnd);
                    const width = endPos - startPos;
                    
                    segmentos.push(
                      <div
                        key={`segment-${idx}`}
                        className="absolute h-0.5 bg-green-600 top-1/2 transform -translate-y-1/2 rounded-sm"
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                        }}
                      />
                    );
                  }
                  trabajandoActualmente = false;
                  inicioSegmento = null;
                } else {
                  // Otros eventos (geocerca, descanso) - no afectan segmento laboral
                  if (trabajandoActualmente && !inicioSegmento) {
                    inicioSegmento = eventosClave[0]; // Usar primer evento si no hay entrada explícita
                  }
                }
              });
              
              // Segmento final si termina trabajando
              if (trabajandoActualmente && inicioSegmento && eventosClave.length > 1) {
                const ultimoEvento = eventosClave[eventosClave.length - 1];
                if (ultimoEvento.tipo !== 'salida') {
                  const startPos = calculateAbsolutePosition(inicioSegmento.time, displayStart, displayEnd);
                  const endPos = calculateAbsolutePosition(ultimoEvento.time, displayStart, displayEnd);
                  const width = endPos - startPos;
                  
                  segmentos.push(
                    <div
                      key="segment-final"
                      className="absolute h-0.5 bg-green-600 top-1/2 transform -translate-y-1/2 rounded-sm"
                      style={{
                        left: `${startPos}%`,
                        width: `${width}%`,
                      }}
                    />
                  );
                }
              }
              
              return segmentos;
            })()}
            
            {/* Intervalos de tiempo dentro/fuera/descanso - MÁS SUTILES */}
            {intervalos.map((intervalo, idx) => {
              const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
              const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
              const width = endPos - startPos;
              
              // Color para cada tipo de intervalo
              const esDescanso = intervalo.tipo === 'descanso' || intervalo.descanso;
              const esSospechoso = intervalo.tipo === 'sospechoso' || intervalo.sospechoso;
              const esDentroActivo = intervalo.tipo === 'dentro-activo';
              const esDentroInactivo = intervalo.tipo === 'dentro-inactivo';
              const esDentro = intervalo.tipo === 'dentro' || intervalo.dentro;
              
              let colorClass = 'bg-red-500 shadow-sm'; // Por defecto: fuera
              if (esDescanso) colorClass = 'bg-yellow-500 shadow-sm';
              else if (esSospechoso) colorClass = 'bg-gray-400 opacity-80';
              else if (esDentroActivo) colorClass = 'bg-green-500 shadow-sm';
              else if (esDentroInactivo) colorClass = 'bg-green-300 shadow-sm opacity-70';
              else if (esDentro) colorClass = 'bg-green-500 shadow-sm'; // Fallback para dentro sin estado

              return (
                <div
                  key={`interval-${idx}`}
                  className={`absolute h-2 rounded-sm ${colorClass}`}
                  style={{
                    left: `${startPos}%`,
                    width: `${width}%`,
                  }}
                />
              );
            })}
            
            {/* Eventos clave con posicionamiento mejorado */}
            {eventosClave.map((evento, idx) => {
              const labelPos = labelPositions[idx];
              // Usar timestamps para sincronización exacta - IGUAL QUE INTERVALOS
              const eventoTimestamp = evento.time.getTime ? evento.time.getTime() : new Date(evento.time).getTime();
              const displayStartTimestamp = displayStart.getTime();
              const displayEndTimestamp = displayEnd.getTime();
              const originalPosition = calculateAbsolutePosition(eventoTimestamp, displayStartTimestamp, displayEndTimestamp);
              const nodeType = getNodeType(evento);
              const isAbove = labelPos.isAbove;
              
              let nodeColor = 'bg-emerald-600 border-emerald-200';
              if (nodeType === 'entry') nodeColor = 'bg-green-500 border-green-200';
              else if (nodeType === 'exit') nodeColor = 'bg-red-500 border-red-200';
              else if (nodeType === 'break') nodeColor = 'bg-yellow-500 border-yellow-200';
              else if (nodeType === 'geofence') nodeColor = 'bg-blue-500 border-blue-200';
              
              return (
                <div key={`event-${idx}`} className="absolute" style={{ left: `${originalPosition}%`, transform: 'translateX(-50%)' }}>
                  {/* Conector vertical - DIFERENTES ALTURAS PARA ARRIBA Y ABAJO */}
                  <div 
                    className="w-0.5 bg-gray-500 absolute left-1/2 transform -translate-x-1/2"
                    style={{ 
                      height: isAbove ? '32px' : '36px', 
                      top: isAbove ? '-32px' : '8px'
                    }}
                  />
                  
                  {/* Nodo del evento - MÁS GRANDE Y ELEGANTE COMO PDF */}
                  <div className={`w-5 h-5 ${nodeColor} rounded-full border-2 border-white shadow-md relative z-10`}
                       style={{ marginTop: '-2.5px', marginLeft: '-2.5px' }} />
                  
                  {/* Etiqueta del evento - ARRIBA MÁS SEPARADAS */}
                  <div 
                    className={`absolute text-xs min-w-max z-20 ${
                      isAbove ? 'bottom-12' : 'top-12'
                    }`}
                    style={{ 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      maxWidth: '120px'
                    }}
                  >
                    <div className="font-semibold text-gray-800 text-center leading-tight">
                      {evento.descripcion}
                    </div>
                    <div className="text-gray-600 text-center mt-0.5">
                      ({evento.hora})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Etiquetas de intervalos - AGRUPADAS PARA EVITAR SOLAPAMIENTO */}
        <div className="relative h-4 -mt-4">
          {intervalosAgrupados.map((intervalo, idx) => {
            const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
            const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
            const width = endPos - startPos;
            const trueCenterPos = startPos + (width / 2);
            
            // Solo mostrar etiqueta si el intervalo es lo suficientemente grande (más del 3% del ancho total)
            if (width < 3) return null;
            
            // Para intervalos normales, usar exactamente el centro
            const finalCenterPos = Math.max(8, Math.min(92, trueCenterPos));
            
            return (
              <div
                key={`label-agrupado-${idx}`}
                className="absolute text-xs text-center"
                style={{ left: `${finalCenterPos}%`, transform: 'translateX(-50%)' }}
              >
                {/* Texto limpio sin fondo, como PDF */}
                <div className={`font-medium ${
                  intervalo.tipoBasico === 'descanso'
                    ? 'text-yellow-700'
                    : intervalo.tipoBasico === 'dentro'
                      ? 'text-green-700'
                    : intervalo.tipoBasico === 'sospechoso'
                        ? 'text-gray-700'
                        : 'text-red-700'
                }`}>
                  {intervalo.tipoBasico === 'descanso'
                    ? 'Descanso'
                    : intervalo.tipoBasico === 'dentro'
                      ? 'Dentro'
                    : intervalo.tipoBasico === 'sospechoso'
                        ? 'Sospechoso'
                        : 'Fuera'}
                </div>
                <div className="text-gray-600 mt-0.5 text-xs">
                  ({intervalo.duracionTexto})
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


export default WebTimelineComponent;