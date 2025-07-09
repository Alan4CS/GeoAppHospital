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

// Función mejorada para evitar superposición de etiquetas
function calculateLabelPositions(eventos, displayStart, displayEnd) {
  const MIN_DISTANCE = 120; // Distancia mínima entre etiquetas en px
  const positions = eventos.map((evento, idx) => ({
    originalPosition: calculateAbsolutePosition(evento.time, displayStart, displayEnd),
    index: idx,
    isAbove: idx % 2 === 0, // Alternar arriba/abajo por defecto
    adjustedPosition: calculateAbsolutePosition(evento.time, displayStart, displayEnd)
  }));

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
            {/* Línea conectora entre eventos - MÁS DELGADA */}
            {eventosClave.length > 1 && (
              <div
                className="absolute h-0.5 bg-green-600 top-1/2 transform -translate-y-1/2 rounded-sm"
                style={{
                  left: `${calculateAbsolutePosition(eventosClave[0].time, displayStart, displayEnd)}%`,
                  width: `${calculateAbsolutePosition(eventosClave[eventosClave.length - 1].time, displayStart, displayEnd) - calculateAbsolutePosition(eventosClave[0].time, displayStart, displayEnd)}%`,
                }}
              />
            )}
            
            {/* Intervalos de tiempo dentro/fuera - MÁS SUTILES */}
            {intervalos.map((intervalo, idx) => {
              const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
              const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
              const width = endPos - startPos;
              
              return (
                <div
                  key={`interval-${idx}`}
                  className={`absolute h-2 rounded-sm ${
                    intervalo.dentro ? 'bg-green-500 shadow-sm' : 'bg-red-500 shadow-sm'
                  }`}
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
              const originalPosition = calculateAbsolutePosition(evento.time, displayStart, displayEnd);
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
        
        {/* Etiquetas de intervalos - EXTREMADAMENTE PEGADAS A LA LÍNEA */}
        <div className="relative h-4 -mt-4">
          {intervalos.map((intervalo, idx) => {
            const startPos = calculateAbsolutePosition(intervalo.inicio, displayStart, displayEnd);
            const endPos = calculateAbsolutePosition(intervalo.fin, displayStart, displayEnd);
            const width = endPos - startPos;
            const trueCenterPos = startPos + (width / 2);
            
            // Solo ajustar si el intervalo es muy pequeño (menos del 5% del ancho total)
            let finalCenterPos = trueCenterPos;
            if (width < 5) {
              // Para intervalos muy pequeños, usar una posición ligeramente ajustada
              finalCenterPos = Math.max(8, Math.min(92, trueCenterPos));
            } else {
              // Para intervalos normales, usar exactamente el centro
              finalCenterPos = trueCenterPos;
            }
            
            return (
              <div
                key={`label-${idx}`}
                className="absolute text-xs text-center"
                style={{ left: `${finalCenterPos}%`, transform: 'translateX(-50%)' }}
              >
                {/* Texto limpio sin fondo, como PDF */}
                <div className={`font-medium ${
                  intervalo.dentro ? 'text-green-700' : 'text-red-700'
                }`}>
                  {intervalo.dentro ? 'Dentro' : 'Fuera'}
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

// Datos de ejemplo para demostración
const datosEjemplo = [
  {
    fecha_hora: '2024-01-15T09:09:00',
    tipo_registro: 1,
    dentro_geocerca: true
  },
  {
    fecha_hora: '2024-01-15T10:45:00',
    evento: 0,
    dentro_geocerca: false
  },
  {
    fecha_hora: '2024-01-15T11:08:00',
    evento: 1,
    dentro_geocerca: true
  },
  {
    fecha_hora: '2024-01-15T11:22:00',
    tipo_registro: 0,
    dentro_geocerca: true
  }
];

export default WebTimelineComponent;