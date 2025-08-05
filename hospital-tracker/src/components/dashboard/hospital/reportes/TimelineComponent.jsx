import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

// Constantes para medidas fijas
const TIMELINE_WIDTH = 600; // Ancho fijo en puntos
const TIMELINE_HEIGHT = 80;
const TIMELINE_MARGIN = 20; // Margen lateral
const BAR_HEIGHT = 8; // Aumentado de 4 a 8
const NODE_SIZE = 12; // Aumentado ligeramente

const timelineStyles = StyleSheet.create({
  intervalSus: {
    backgroundColor: '#adb5bd', // gris
    opacity: 0.8,
  },
  timelineContainer: {
    marginVertical: 0, // Eliminado margen arriba y abajo
    paddingHorizontal: TIMELINE_MARGIN,
    backgroundColor: '#f8f9fa', // Cambiado al color de fondo general
    minHeight: 100, 
    maxHeight: 200, 
    height: 150,    
    overflow: 'visible', // <-- CAMBIO: antes 'hidden', ahora 'visible' para evitar recorte
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#198754',
  },
  timelineWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    position: 'relative',
    width: '100%', // Usar ancho relativo en lugar de fijo
    height: '100%', // Ocupa todo el alto del contenedor
    marginHorizontal: 'auto',
    overflow: 'visible', // <-- CAMBIO: antes 'hidden', ahora 'visible' para evitar recorte
  },
  // Escala de tiempo superior
  timeScale: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    height: 20,
  },
  timeLabel: {
    position: 'absolute',
    fontSize: 8,
    color: '#555',
    textAlign: 'center',
    width: 40,
    marginLeft: -20,
    fontWeight: '500',
  },
  timeTick: {
    position: 'absolute',
    top: 18,
    width: 1,
    height: 8,
    backgroundColor: '#bbb',
  },
  // Barra principal de tiempo
  timelineTrack: {
    position: 'absolute',
    top: 35,
    left: 0,
    width: '100%', // Usar ancho relativo
    height: BAR_HEIGHT + 35, // Más espacio para nodos y conectores
  },
  timelineBar: {
    position: 'absolute',
    top: 20, // Centrado verticalmente en el track
    left: 0,
    width: '100%', // Usar ancho relativo
    height: BAR_HEIGHT,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  // Línea conectora horizontal entre nodos
  nodeConnectorLine: {
    position: 'absolute',
    top: 20 + (BAR_HEIGHT / 2) - 1, // A la altura exacta de la barra
    height: 2,
    backgroundColor: '#198754',
    borderRadius: 1,
  },
  // Intervalos de tiempo (dentro/fuera de geocerca)
  timeInterval: {
    position: 'absolute',
    top: 20,
    height: BAR_HEIGHT,
    borderRadius: 4,
  },
  intervalInside: {
    backgroundColor: '#28a745',
    boxShadow: '0 1px 3px rgba(40, 167, 69, 0.3)',
  },
  intervalInsideInactive: {
    backgroundColor: '#86efac', // Verde claro para inactivo (equivalente a bg-green-300)
    opacity: 0.7,
    boxShadow: '0 1px 3px rgba(40, 167, 69, 0.2)',
  },
  intervalOutside: {
    backgroundColor: '#dc3545',
    boxShadow: '0 1px 3px rgba(220, 53, 69, 0.3)',
  },
  intervalBreak: {
    backgroundColor: '#ffc107',
    boxShadow: '0 1px 3px rgba(255, 193, 7, 0.3)',
  },
  // Nodos de eventos - SIMPLIFICADOS sin líneas duplicadas
  eventNode: {
    position: 'absolute',
    top: 20 + (BAR_HEIGHT / 2) - (NODE_SIZE / 2), // Centrado en la barra
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE/2,
    backgroundColor: '#198754',
    border: '3px solid white',
    marginLeft: -NODE_SIZE/2,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  eventNodeEntry: {
    backgroundColor: '#28a745',
    border: '3px solid #d4edda',
  },
  eventNodeExit: {
    backgroundColor: '#dc3545',
    border: '3px solid #f8d7da',
  },
  eventNodeBreak: {
    backgroundColor: '#ffc107',
    border: '3px solid #fff3cd',
  },
  eventNodeGeofence: {
    backgroundColor: '#17a2b8',
    border: '3px solid #d1ecf1',
  },
  eventNodeActive: {
    backgroundColor: '#198754',
    border: '3px solid #d4edda',
  },
  eventNodeInactive: {
    backgroundColor: '#6c757d',
    border: '3px solid #e9ecef',
  },
  // Conectores verticales - UNA SOLA LÍNEA POR EVENTO
  eventConnector: {
    position: 'absolute',
    top: 20 + (BAR_HEIGHT / 2), // Desde el centro de la barra
    width: 2,
    backgroundColor: '#198754',
    marginLeft: -1,
    borderRadius: 1,
  },
  eventLabel: {
    position: 'absolute',
    fontSize: 7,
    color: '#444',
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 2,
    borderRadius: 3,
    border: '1px solid #ddd',
    minWidth: 40,
  },
  eventLabelAbove: {
    top: -25,
  },
  eventLabelBelow: {
    top: 35,
  },

  // Etiquetas de eventos arriba/abajo según posición
  eventLabelAbove: {
    top: 20 + (BAR_HEIGHT / 2) - 52, // 📏 Más separación arriba
  },
  eventLabelBelow: {
    top: 20 + (BAR_HEIGHT / 2) + 28, // 📏 Más separación abajo
  },
  // Etiquetas de intervalos - CENTRADAS EN SU INTERVALO
  intervalLabelsContainer: {
    position: 'absolute',
    top: 65, // Más abajo para evitar superposición
    left: 0,
    right: 0,
    height: 28,
  },
  intervalLabel: {
    position: 'absolute',
    fontSize: 9,
    color: '#495057',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
    fontWeight: '500',
    lineHeight: 1.1,
    // Sin fondo, sin borde, sin borderRadius, sin boxShadow
  },
});

// Función mejorada para calcular posición absoluta en porcentaje (como WebTimelineComponent)
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

function formatTime(date) {
  // Si es un objeto Date, convertir a string ISO y extraer la hora
  const isoString = date.toISOString();
  return isoString.slice(11, 16); // Extrae "HH:mm"
}

function formatHora(fechaStr) {
  // Extraer hora directamente de la cadena sin conversiones de zona horaria
  return fechaStr.slice(11, 16); // Extrae "HH:mm" de "YYYY-MM-DDTHH:mm:ss"
}

// Función para determinar el tipo de nodo
function getNodeType(evento) {
  switch (evento.tipo) {
    case 'entrada': return 'entry';
    case 'salida': return 'exit';
    case 'descanso': return 'break';
    case 'geocerca': return 'geofence';
    case 'activo': return 'active';
    case 'inactivo': return 'inactive';
    default: return 'default';
  }
}

// Función para obtener ícono del evento
function getEventIcon(evento) {
  switch (evento.tipo) {
    case 'entrada': return '';
    case 'salida': return '';
    case 'geocerca': 
      return evento.descripcion.includes('Entró') ? '' : '';
    case 'descanso': return '';
    case 'activo': return '⚡';
    case 'inactivo': return '😴';
    default: return '';
  }
}

// Función para generar eventos y intervalos basados en el resumen del día (del WebTimelineComponent)
function generarEventosYIntervalosDelResumen(actividades) {
  if (!actividades || actividades.length === 0) return { eventos: [], intervalos: [] };

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
    
    // Entrada laboral
    if (i === 0 && act.tipo_registro === 1) {
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'entrada',
        descripcion: 'Entrada',
        hora
      });
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      estadoActividad = true; // Asumir activo al entrar
      i++;
      continue;
    }

    // Detectar hueco sospechoso (>2h) - MANTENER LÓGICA EXISTENTE
    if (i > 0) {
      const prev = ordenadas[i - 1];
      const diffMs = new Date(act.fecha_hora) - new Date(prev.fecha_hora);
      if (diffMs > 2 * 60 * 60 * 1000) {
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
        // Intervalo sospechoso
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
      // PRIORIDAD MÁXIMA: Manejo de descansos
      if (act.evento === 2) {
        // Si no estaba en descanso, iniciar descanso
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
          eventos.push({
            time: new Date(act.fecha_hora),
            tipo: 'descanso',
            descripcion: 'Inicio descanso',
            hora
          });
          horaIntervalo = null;
        }
        // Durante el descanso, ignorar todos los otros eventos
        i++;
        continue;
      } else if (act.evento === 3) {
        // Fin de descanso
        if (inicioDescanso) {
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
          inicioDescanso = null;
        }
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'descanso',
          descripcion: 'Fin descanso',
          hora
        });
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
        estadoActividad = true; // Asumir activo al salir del descanso
        i++;
        continue;
      }

      // Si está en descanso, ignorar todos los otros eventos
      if (inicioDescanso !== null) {
        i++;
        continue;
      }

      // Manejo de eventos de actividad (solo si NO está en descanso)
      if (act.evento === 4 || act.evento === 5) {
        const nuevoEstadoActividad = act.evento === 5; // 5 = activo, 4 = inactivo
        
        // Solo procesar si está dentro de geocerca y cambia el estado de actividad
        if (estadoGeocerca === true && nuevoEstadoActividad !== estadoActividad) {
          // Cerrar intervalo anterior con el estado de actividad anterior
          if (horaIntervalo) {
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
        i++;
        continue;
      }

      // Manejo de geocerca (solo si NO está en descanso)
      if (act.evento === 0) {
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

    // Salida laboral
    if (i === ordenadas.length - 1 && act.tipo_registro === 0) {
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
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'salida',
        descripcion: 'Salida',
        hora
      });
    }
    i++;
  }
  
  return { eventos, intervalos };
}

// Función mejorada para evitar superposición de etiquetas (porcentajes)
function calculateLabelPosition(eventos, currentIndex, basePosition) {
  const MIN_DISTANCE_PERCENT = 15; // Distancia mínima en porcentaje
  let isAbove = currentIndex % 2 === 0; // Alternar arriba/abajo
  let horizontalOffsetPercent = 0;
  
  // Verificar superposición con eventos anteriores
  for (let i = 0; i < currentIndex; i++) {
    const prevPosition = eventos[i].__position;
    const distance = Math.abs(basePosition - prevPosition);
    
    if (distance < MIN_DISTANCE_PERCENT) {
      // Si hay superposición horizontal, aplicar desplazamiento en porcentaje
      if (distance < MIN_DISTANCE_PERCENT / 2) {
        horizontalOffsetPercent = basePosition > prevPosition ? 5 : -5; // 5% de desplazamiento
      }
      // Forzar posición opuesta (arriba/abajo)
      isAbove = !isAbove;
      break;
    }
  }
  
  return { isAbove, horizontalOffset: horizontalOffsetPercent };
}

const TimelineComponent = ({ actividades, titulo = "Cronologia" }) => {
  // Formatear a 'Xh Ymin'
  function msToHM(ms) {
    if (!ms || ms < 0) return '0min';
    const h = Math.floor(ms / 3600000);
    const m = Math.round((ms % 3600000) / 60000);
    return (h > 0 ? `${h}h ` : '') + `${m}min`;
  }

  if (!actividades || actividades.length === 0) {
    return (
      <View style={timelineStyles.timelineContainer} wrap={false}>
        <Text style={timelineStyles.timelineTitle}>{titulo}</Text>
        <Text style={{ textAlign: 'center', color: '#666', fontSize: 10 }}>
          No hay actividades para mostrar
        </Text>
      </View>
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
  
  // Calcular totales por tipo (igual que en WebTimelineComponent)
  let totalDentro = 0;
  let totalFuera = 0;
  let totalDescanso = 0;
  
  intervalos.forEach(intervalo => {
    const duracion = intervalo.fin - intervalo.inicio;
    if (intervalo.descanso || intervalo.tipo === 'descanso') {
      totalDescanso += duracion;
    } else if (intervalo.dentro || intervalo.tipo === 'dentro-activo' || intervalo.tipo === 'dentro-inactivo' || intervalo.tipo === 'dentro') {
      totalDentro += duracion;
    } else if (intervalo.fuera || intervalo.tipo === 'fuera') {
      totalFuera += duracion;
    }
  });

  // Solo mostrar eventos principales (entrada, salida, entrada/salida geocerca, descansos)
  const eventosClaveFiltrados = eventosClave.filter(e => 
    ['entrada', 'salida', 'geocerca', 'descanso'].includes(e.tipo)
  );

  return (
    <View style={timelineStyles.timelineContainer} wrap={false}>
      <Text style={timelineStyles.timelineTitle}>{titulo}</Text>
      
      {/* Totales arriba de la línea de tiempo - igual que WebTimelineComponent */}
      <Text style={{ fontSize: 10, marginBottom: 8, textAlign: 'center' }}>
        <Text style={{ color: '#198754', fontWeight: 'bold' }}>Total dentro:</Text> {msToHM(totalDentro)}{' '}
        <Text style={{ color: '#dc3545', fontWeight: 'bold' }}>Fuera:</Text> {msToHM(totalFuera)}{' '}
        <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>Descanso:</Text> {msToHM(totalDescanso)}
      </Text>
      
      <View style={timelineStyles.timelineWrapper}>          {/* Escala de tiempo superior */}
        <View style={timelineStyles.timeScale}>
          {timeScale.map((time, idx) => {
            const position = calculateAbsolutePosition(time, displayStart, displayEnd);
            const positionInPixels = (position / 100) * TIMELINE_WIDTH;
            return (
              <View key={idx}>
                <Text style={[timelineStyles.timeLabel, { left: `${position}%` }]}>
                  {formatTime(time)}
                </Text>
                <View style={[timelineStyles.timeTick, { left: `${position}%` }]} />
              </View>
            );
          })}
        </View>
        
        {/* Track principal */}
        <View style={timelineStyles.timelineTrack}>
          {/* Barra base */}
          <View style={timelineStyles.timelineBar} />
          
          {/* Intervalos de tiempo */}
          {intervalos.map((intervalo, idx) => {
            const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
            const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
            const width = Math.max(0.5, endPos - startPos); // Ancho mínimo de 0.5%
            
            // Determinar estilo según el tipo de intervalo (WebTimelineComponent logic)
            let intervalStyle = timelineStyles.intervalOutside; // Por defecto fuera
            if (intervalo.descanso || intervalo.tipo === 'descanso') {
              intervalStyle = timelineStyles.intervalBreak;
            } else if (intervalo.tipo === 'dentro-activo') {
              intervalStyle = timelineStyles.intervalInside;
            } else if (intervalo.tipo === 'dentro-inactivo') {
              intervalStyle = timelineStyles.intervalInsideInactive;
            } else if (intervalo.dentro || intervalo.tipo === 'dentro') {
              intervalStyle = timelineStyles.intervalInside;
            } else if (intervalo.sospechoso || intervalo.tipo === 'sospechoso') {
              intervalStyle = timelineStyles.intervalSus;
            }
            
            return (
              <View
                key={idx}
                style={[
                  timelineStyles.timeInterval,
                  intervalStyle,
                  {
                    left: `${startPos}%`,
                    width: `${width}%`,
                  }
                ]}
              />
            );
          })}
          
          {/* Nodos de eventos */}
          {eventosClaveFiltrados.map((evento, idx) => {
            const position = calculateAbsolutePosition(evento.time, displayStart, displayEnd);
            const nodeType = getNodeType(evento);
            
            let nodeStyle = timelineStyles.eventNode;
            if (nodeType === 'entry') nodeStyle = [timelineStyles.eventNode, timelineStyles.eventNodeEntry];
            if (nodeType === 'exit') nodeStyle = [timelineStyles.eventNode, timelineStyles.eventNodeExit];
            if (nodeType === 'break') nodeStyle = [timelineStyles.eventNode, timelineStyles.eventNodeBreak];
            if (nodeType === 'geofence') nodeStyle = [timelineStyles.eventNode, timelineStyles.eventNodeGeofence];
            
            const isAbove = idx % 2 === 0;
            
            return (
              <View key={idx}>
                {/* Nodo */}
                <View
                  style={[
                    nodeStyle,
                    { left: `${position}%` }
                  ]}
                />
                {/* Etiqueta */}
                <Text
                  style={[
                    timelineStyles.eventLabel,
                    isAbove ? timelineStyles.eventLabelAbove : timelineStyles.eventLabelBelow,
                    { left: `${position}%`, marginLeft: -20 }
                  ]}
                >
                  {evento.descripcion}
                  {'\n'}({evento.hora})
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default TimelineComponent;