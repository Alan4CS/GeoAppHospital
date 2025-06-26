import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const timelineStyles = StyleSheet.create({
  timelineContainer: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#198754',
  },
  timeScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  timeLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    minWidth: 35,
  },
  timelineTrack: {
    position: 'relative',
    height: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 3,
    marginBottom: 10,
  },
  timelineBar: {
    position: 'absolute',
    top: 25,
    left: 5,
    right: 5,
    height: 4,
    backgroundColor: '#dee2e6',
    borderRadius: 2,
  },
  timeInterval: {
    position: 'absolute',
    top: 25,
    height: 4,
    borderRadius: 2,
  },
  intervalInside: {
    backgroundColor: '#28a745',
  },
  intervalOutside: {
    backgroundColor: '#dc3545',
  },
  eventNode: {
    position: 'absolute',
    top: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#198754',
    border: '2px solid white',
    zIndex: 2,
  },
  eventNodeSpecial: {
    backgroundColor: '#ffc107',
  },
  eventLabel: {
    position: 'absolute',
    fontSize: 7,
    color: '#333',
    textAlign: 'center',
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 2,
    minWidth: 60,
    marginLeft: -30,
    // El top se ajustará dinámicamente
  },
  intervalLabels: {
    flexDirection: 'row',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  intervalLabel: {
    position: 'absolute',
    fontSize: 6,
    color: '#666',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 1,
    borderRadius: 2,
  },
});

function calculatePosition(time, startTime, endTime, containerWidth = 100) {
  const totalMinutes = (endTime - startTime) / (1000 * 60);
  const eventMinutes = (time - startTime) / (1000 * 60);
  return Math.max(0, Math.min(containerWidth, (eventMinutes / totalMinutes) * containerWidth));
}

function generateTimeScale(startTime, endTime) {
  const scale = [];
  const start = new Date(startTime);
  const end = new Date(endTime);
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
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatHora(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Función para generar eventos y intervalos basados en el resumen del día
function generarEventosYIntervalosDelResumen(actividades) {
  if (!actividades || actividades.length === 0) return { eventos: [], intervalos: [] };
  
  const eventos = [];
  const intervalos = [];
  let estadoGeocerca = null;
  let horaIntervalo = null;

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
        duracionTexto: formatIntervalo(inicio, fin)
      });
    }
  };

  const ordenadas = actividades.slice().sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  for (let i = 0; i < ordenadas.length; i++) {
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
      continue;
    }
    
    // Evento de geocerca
    if (typeof act.evento === 'number') {
      if (act.evento === 0) {
        // Salió de geocerca
        if (estadoGeocerca === true && horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, 'dentro');
          eventos.push({
            time: new Date(act.fecha_hora),
            tipo: 'geocerca',
            descripcion: 'Salió geocerca',
            hora: formatHora(act.fecha_hora)
          });
          estadoGeocerca = false;
          horaIntervalo = act.fecha_hora;
        }
      } else if (act.evento === 1) {
        // Entró a la geocerca
        if (estadoGeocerca === false && horaIntervalo) {
          pushIntervalo(horaIntervalo, act.fecha_hora, 'fuera');
          eventos.push({
            time: new Date(act.fecha_hora),
            tipo: 'geocerca',
            descripcion: 'Entró geocerca',
            hora: formatHora(act.fecha_hora)
          });
          estadoGeocerca = true;
          horaIntervalo = act.fecha_hora;
        }
      } else if (act.evento === 2) {
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'descanso',
          descripcion: 'Inicio descanso',
          hora: formatHora(act.fecha_hora)
        });
      } else if (act.evento === 3) {
        eventos.push({
          time: new Date(act.fecha_hora),
          tipo: 'descanso',
          descripcion: 'Fin descanso',
          hora: formatHora(act.fecha_hora)
        });
      }
    }
    
    // Si cambia el estado de geocerca sin evento explícito
    if (i > 0 && act.dentro_geocerca !== undefined && act.dentro_geocerca !== estadoGeocerca) {
      if (estadoGeocerca !== null && horaIntervalo) {
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
  }
  
  return { eventos, intervalos };
}

const TimelineComponent = ({ actividades, titulo = "LÍNEA DE TIEMPO DE LA JORNADA" }) => {
  if (!actividades || actividades.length === 0) {
    return (
      <View style={timelineStyles.timelineContainer}>
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
  
  // Margen de 30 minutos
  const margin = 30 * 60 * 1000;
  const displayStart = new Date(startTime.getTime() - margin);
  const displayEnd = new Date(endTime.getTime() + margin);
  
  const timeScale = generateTimeScale(displayStart, displayEnd);

  // Usar la función para generar solo los eventos del resumen
  const { eventos: eventosClave, intervalos } = generarEventosYIntervalosDelResumen(ordenadas);

  return (
    <View style={timelineStyles.timelineContainer}>
      <Text style={timelineStyles.timelineTitle}>{titulo}</Text>
      
      <View style={timelineStyles.timeScale}>
        {timeScale.map((time, idx) => (
          <Text key={idx} style={timelineStyles.timeLabel}>
            {formatTime(time)}
          </Text>
        ))}
      </View>
      
      <View style={timelineStyles.timelineTrack}>
        <View style={timelineStyles.timelineBar} />
        
        {/* Intervalos de tiempo dentro/fuera */}
        {intervalos.map((intervalo, idx) => {
          const leftPos = calculatePosition(intervalo.inicio, displayStart, displayEnd, 90);
          const rightPos = calculatePosition(intervalo.fin, displayStart, displayEnd, 90);
          const width = rightPos - leftPos;
          return (
            <View
              key={`interval-${idx}`}
              style={[
                timelineStyles.timeInterval,
                intervalo.dentro ? timelineStyles.intervalInside : timelineStyles.intervalOutside,
                {
                  left: `${leftPos + 5}%`,
                  width: `${width}%`,
                },
              ]}
            />
          );
        })}
        
        {/* Eventos clave */}
        {eventosClave.map((evento, idx) => {
          const position = calculatePosition(evento.time, displayStart, displayEnd, 90);
          // Alternar la posición vertical de las etiquetas para evitar encimado
          const labelTop = idx % 2 === 0 ? -18 : 22; // alterna arriba y abajo de la línea
          return (
            <View key={`event-${idx}`}>
              <View
                style={[
                  timelineStyles.eventNode,
                  (evento.tipo === 'entrada' || evento.tipo === 'salida') && timelineStyles.eventNodeSpecial,
                  { left: `${position + 5}%` },
                ]}
              />
              <Text
                style={[
                  timelineStyles.eventLabel,
                  { left: `${position + 5}%`, top: labelTop },
                ]}
              >
                {evento.hora} {evento.descripcion}
              </Text>
            </View>
          );
        })}
      </View>
      
      {/* Etiquetas de intervalos */}
      <View style={timelineStyles.intervalLabels}>
        {intervalos.map((intervalo, idx) => {
          const leftPos = calculatePosition(intervalo.inicio, displayStart, displayEnd, 90);
          const rightPos = calculatePosition(intervalo.fin, displayStart, displayEnd, 90);
          const centerPos = leftPos + (rightPos - leftPos) / 2;
          return (
            <Text
              key={`label-${idx}`}
              style={[
                timelineStyles.intervalLabel,
                { left: `${centerPos + 5}%` },
              ]}
            >
              {intervalo.dentro ? 'Dentro' : 'Fuera'} ({intervalo.duracionTexto})
            </Text>
          );
        })}
      </View>
      
      {/* Leyenda */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, fontSize: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#28a745', marginRight: 3, borderRadius: 1 }} />
          <Text style={{ fontSize: 8, color: '#666' }}>Dentro de geocerca</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, backgroundColor: '#dc3545', marginRight: 3, borderRadius: 1 }} />
          <Text style={{ fontSize: 8, color: '#666' }}>Fuera de geocerca</Text>
        </View>
      </View>
    </View>
  );
};

export default TimelineComponent;