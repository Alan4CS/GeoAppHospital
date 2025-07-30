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
  // Conectores verticales - UNA SOLA LÍNEA POR EVENTO
  eventConnector: {
    position: 'absolute',
    top: 20 + (BAR_HEIGHT / 2), // Desde el centro de la barra
    width: 2,
    backgroundColor: '#198754',
    marginLeft: -1,
    borderRadius: 1,
  },
  // Etiquetas de eventos - SOLO TEXTO PLANO, SIN SUPERPOSICIÓN
  eventLabel: {
  position: 'absolute',
  fontSize: 9,
  color: '#2c3e50',
  fontWeight: 600,
  textAlign: 'center',
  width: 100,
  marginLeft: -50,
  lineHeight: 1.2,
  paddingVertical: 3,
  paddingHorizontal: 6,
  // Sin fondo, sin borde, sin borderRadius
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
    default: return '';
  }
}

// Función para generar eventos y intervalos basados en el resumen del día
function generarEventosYIntervalosDelResumen(actividades) {
  if (!actividades || actividades.length === 0) return { eventos: [], intervalos: [] };
  const eventos = [];
  const intervalos = [];
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let inicioDescanso = null;

  const formatIntervalo = (inicio, fin) => {
    const diffMs = new Date(fin) - new Date(inicio);
    const min = Math.floor(diffMs / 60000) % 60;
    const hrs = Math.floor(diffMs / 3600000);
    return `${hrs > 0 ? hrs + 'h ' : ''}${min}min`;
  };

  const pushIntervalo = (inicio, fin, tipo) => {
    if (inicio && fin && inicio !== fin) {
      intervalos.push({
        inicio: new Date(inicio),
        fin: new Date(fin),
        dentro: tipo === 'dentro',
        fuera: tipo === 'fuera',
        descanso: tipo === 'descanso',
        sospechoso: tipo === 'sospechoso',
        tipo: tipo,
        duracionTexto: formatIntervalo(inicio, fin)
      });
    }
  };

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  let i = 0;
  while (i < ordenadas.length) {
    const act = ordenadas[i];
    // Entrada laboral
    if (i === 0 && act.tipo_registro === 1) {
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'entrada',
        descripcion: 'Entrada',
        hora: formatHora(act.fecha_hora)
      });
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
      i++;
      continue;
    }

    // Detectar hueco sospechoso entre este registro y el anterior (>2 horas)
    if (i > 0) {
      const prev = ordenadas[i - 1];
      const diffMs = new Date(act.fecha_hora) - new Date(prev.fecha_hora);
      if (diffMs > 2 * 60 * 60 * 1000) {
        // Si hay un intervalo abierto (dentro/fuera de geocerca), cerrarlo justo antes del hueco
        if (horaIntervalo && prev.fecha_hora !== horaIntervalo && estadoGeocerca !== null) {
          pushIntervalo(horaIntervalo, prev.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
        }
        // Agregar el hueco sospechoso
        pushIntervalo(prev.fecha_hora, act.fecha_hora, 'sospechoso');
        eventos.push({
          time: new Date(prev.fecha_hora),
          tipo: 'sospechoso',
          descripcion: 'Tiempo sospechoso (posible cierre de app)',
          hora: `${formatHora(prev.fecha_hora)} - ${formatHora(act.fecha_hora)}`,
          duracion: `(${formatIntervalo(prev.fecha_hora, act.fecha_hora)})`
        });
        // Reiniciar el intervalo a partir del registro actual
        horaIntervalo = act.fecha_hora;
      }
    }

    // Evento de geocerca y descanso
    if (typeof act.evento === 'number') {
      if (act.evento === 0) {
        // Salió de geocerca
        if (estadoGeocerca === true && horaIntervalo && act.fecha_hora !== horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, 'dentro');
        }
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'geocerca',
          descripcion: 'Salió geocerca',
          hora: formatHora(act.fecha_hora)
        });
        estadoGeocerca = false;
        horaIntervalo = act.fecha_hora;
      } else if (act.evento === 1) {
        // Entró a la geocerca
        if (estadoGeocerca === false && horaIntervalo && act.fecha_hora !== horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, 'fuera');
        }
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'geocerca',
          descripcion: 'Entró geocerca',
          hora: formatHora(act.fecha_hora)
        });
        estadoGeocerca = true;
        horaIntervalo = act.fecha_hora;
      } else if (act.evento === 2) {
        // Inicio de descanso - PAUSAR tracking de geocerca
        if (estadoGeocerca !== null && horaIntervalo && act.fecha_hora !== horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
        }
        inicioDescanso = act.fecha_hora;
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'descanso',
          descripcion: 'Inicio descanso',
          hora: formatHora(act.fecha_hora)
        });
        horaIntervalo = null;
      } else if (act.evento === 3) {
        // Fin de descanso - REANUDAR tracking de geocerca
        if (inicioDescanso) {
          pushIntervalo(inicioDescanso, act.fecha_hora, 'descanso');
          inicioDescanso = null;
        }
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'descanso',
          descripcion: 'Fin descanso',
          hora: formatHora(act.fecha_hora)
        });
        estadoGeocerca = act.dentro_geocerca;
        horaIntervalo = act.fecha_hora;
      }
    }

    // Si cambia el estado de geocerca sin evento explícito
    if (i > 0 && act.dentro_geocerca !== undefined && act.dentro_geocerca !== estadoGeocerca) {
      if (estadoGeocerca !== null && horaIntervalo && act.fecha_hora !== horaIntervalo) {
        pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
      }
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'geocerca',
        descripcion: act.dentro_geocerca ? 'Entró geocerca' : 'Salió geocerca',
        hora: formatHora(act.fecha_hora)
      });
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = act.fecha_hora;
    }

    // Salida laboral
    if (i === ordenadas.length - 1 && act.tipo_registro === 0) {
      if (horaIntervalo && act.fecha_hora !== horaIntervalo && estadoGeocerca !== null) {
        pushIntervalo(horaIntervalo, act.fecha_hora, estadoGeocerca ? 'dentro' : 'fuera');
      }
      eventos.push({
        time: new Date(act.fecha_hora),
        tipo: 'salida',
        descripcion: 'Salida',
        hora: formatHora(act.fecha_hora)
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

  // Calcular totales de tiempo usando los intervalos generados (misma lógica que la línea)
  const totalDentroMs = intervalos.filter(i => i.dentro).reduce((acc, i) => acc + (i.fin - i.inicio), 0);
  const totalFueraMs = intervalos.filter(i => i.fuera).reduce((acc, i) => acc + (i.fin - i.inicio), 0);
  const totalDescansoMs = intervalos.filter(i => i.descanso).reduce((acc, i) => acc + (i.fin - i.inicio), 0);

  // Filtrar eventos: NO mostrar nodos ni etiquetas para eventos 'sospechoso' (solo para la barra gris)
  const eventosClaveFiltrados = eventosClave.filter(e => e.tipo !== 'sospechoso');
  const eventPositions = eventosClaveFiltrados.map(evento => 
    calculateAbsolutePosition(evento.time, displayStart, displayEnd)
  );

  return (
    <View style={timelineStyles.timelineContainer} wrap={false}>
      {/* Totales arriba de la línea de tiempo */}
      <Text style={{ fontSize: 10, marginBottom: 2, textAlign: 'center' }}>
        <Text style={{ color: '#198754', fontWeight: 'bold' }}>Total dentro:</Text> {msToHM(totalDentroMs)}{' '}
        <Text style={{ color: '#dc3545', fontWeight: 'bold' }}>Fuera:</Text> {msToHM(totalFueraMs)}{' '}
        <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>Descanso:</Text> {msToHM(totalDescansoMs)}
      </Text>
      <Text style={timelineStyles.timelineTitle}>{titulo}</Text>
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
          
          {/* Línea conectora horizontal entre nodos */}
          {eventPositions.length > 1 && (
            <View
              style={[
                timelineStyles.nodeConnectorLine,
                {
                  left: `${eventPositions[0]}%`,
                  width: `${eventPositions[eventPositions.length - 1] - eventPositions[0]}%`,
                },
              ]}
            />
          )}
          
          {/* Intervalos de tiempo dentro/fuera/descanso/sospechoso */}
          {intervalos.map((intervalo, idx) => {
            const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
            const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
            const width = endPos - startPos;
            // Determinar el estilo según el tipo de intervalo
            let intervalStyle = timelineStyles.intervalOutside; // Por defecto fuera
            if (intervalo.tipo === 'descanso' || intervalo.descanso) {
              intervalStyle = timelineStyles.intervalBreak;
            } else if (intervalo.tipo === 'dentro' || intervalo.dentro) {
              intervalStyle = timelineStyles.intervalInside;
            } else if (intervalo.tipo === 'sospechoso' || intervalo.sospechoso) {
              intervalStyle = timelineStyles.intervalSus;
            }
            return (
              <View
                key={`interval-${idx}`}
                style={[
                  timelineStyles.timeInterval,
                  intervalStyle,
                  {
                    left: `${startPos}%`,
                    width: `${width}%`,
                  },
                ]}
              />
            );
          })}
          
          {/* Eventos clave - SIN LÍNEAS DUPLICADAS Y SIN SUPERPOSICIÓN (sin sospechosos) */}
          {eventosClaveFiltrados.map((evento, idx) => {
            const position = calculateAbsolutePosition(evento.time, displayStart, displayEnd);
            const nodeType = getNodeType(evento);
            const eventIcon = getEventIcon(evento);
            // Guardar posición para cálculos de superposición
            evento.__position = position;
            // Calcular posición y desplazamiento de la etiqueta
            const { isAbove, horizontalOffset } = calculateLabelPosition(eventosClaveFiltrados, idx, position);
            // Altura del conector - DESDE EL CENTRO EXACTO DEL NODO
            const nodeCenter = 20 + (BAR_HEIGHT / 2); // Centro vertical del nodo
            const connectorHeight = 25; // igual altura para ambos
            const connectorStartY = isAbove ? nodeCenter - 25 : nodeCenter;

            // Determinar estilo de fondo según tipo de evento
            let labelBgStyle = null;
            if (nodeType === 'entry') labelBgStyle = timelineStyles.eventLabelEntry;
            else if (nodeType === 'exit') labelBgStyle = timelineStyles.eventLabelExit;
            else if (nodeType === 'geofence') labelBgStyle = timelineStyles.eventLabelGeofence;
            else if (nodeType === 'break') labelBgStyle = timelineStyles.eventLabelBreak;
            return (
              <View key={`event-${idx}`}>
                {/* Conector vertical - DESDE EL CENTRO EXACTO DEL NODO */}
                <View style={[
                  timelineStyles.eventConnector,
                  { 
                    left: `${position}%`, 
                    height: connectorHeight,
                    top: connectorStartY,
                  },
                ]} />
                {/* Nodo del evento */}
                <View
                  style={[
                    timelineStyles.eventNode,
                    nodeType === 'entry' && timelineStyles.eventNodeEntry,
                    nodeType === 'exit' && timelineStyles.eventNodeExit,
                    nodeType === 'break' && timelineStyles.eventNodeBreak,
                    nodeType === 'geofence' && timelineStyles.eventNodeGeofence,
                    { left: `${position}%` },
                  ]}
                />
                {/* Etiqueta del evento - CON DESPLAZAMIENTO PARA EVITAR SUPERPOSICIÓN */}
                <Text
                  style={[
                    timelineStyles.eventLabel,
                    labelBgStyle,
                    isAbove ? timelineStyles.eventLabelAbove : timelineStyles.eventLabelBelow,
                    { 
                      left: `${position + horizontalOffset}%`, // Usar porcentajes para el offset
                      marginLeft: -50, // Mantener centrado base
                    },
                  ]}
                >
                  {`${eventIcon}${evento.descripcion}\n(${evento.hora})`}
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* Etiquetas de intervalos - CENTRADAS EXACTAMENTE */}
        <View style={timelineStyles.intervalLabelsContainer}>
        {intervalos.map((intervalo, idx) => {
            const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
            const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
            const width = endPos - startPos;
            const centerPos = startPos + (width / 2);
            let adjustedPos = centerPos;
            const labelWidthPercent = 10;
            eventosClave.forEach(evento => {
              const eventPos = evento.__position;
              if (width < 15 && Math.abs(centerPos - eventPos) < labelWidthPercent) {
                adjustedPos += (eventPos > centerPos ? 3 : -3);
              }
            });
            adjustedPos = Math.max(5, Math.min(95, adjustedPos));
            // Determinar texto y color según tipo de intervalo
            let labelText = 'Fuera';
            let labelColor = '#dc3545';
            if (intervalo.tipo === 'descanso' || intervalo.descanso) {
              labelText = 'Descanso';
              labelColor = '#e69500';
            } else if (intervalo.tipo === 'dentro' || intervalo.dentro) {
              labelText = 'Dentro';
              labelColor = '#198754';
            } else if (intervalo.tipo === 'sospechoso' || intervalo.sospechoso) {
              labelText = 'Sospechoso';
              labelColor = '#495057';
            }
            return (
              <Text
                key={`label-${idx}`}
                style={[
                  timelineStyles.intervalLabel, 
                  { 
                    left: `${adjustedPos}%`,
                    marginLeft: -30,
                    color: labelColor,
                  }
                ]}
              >
                {labelText}{"\n"}
                ({intervalo.duracionTexto})
              </Text>
            );
        })}
        </View>

      </View>
    </View>
  );
};

export default TimelineComponent;