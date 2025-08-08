import React from 'react';
import { View, Text } from '@react-pdf/renderer';

// Función para formatear tiempo directamente de string
function formatTime(date) {
  // Si es un string, extraer directamente
  if (typeof date === 'string') {
    return date.slice(11, 16); // "HH:mm"
  }
  // Si es Date, usar UTC para consistencia
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  // console.log('🕐 formatTime Debug UTC:', {
  //   inputDate: date,
  //   outputHours: hours,
  //   outputMinutes: minutes,
  //   result: `${hours}:${minutes}`,
  //   utc: date.toISOString(),
  //   local: date.toString(),
  //   nota: 'USANDO UTC PARA CONSISTENCIA'
  // });
  return `${hours}:${minutes}`;
}

function formatHora(fechaStr) {
  // Extraer hora directamente de la cadena SIN conversiones
  const horaDirecta = fechaStr.slice(11, 16); // "HH:mm"
  // console.log('🕐 formatHora Debug:', {
  //   input: fechaStr,
  //   extracted: horaDirecta
  // });
  return horaDirecta;
}

// Sistema de coordenadas unificado - TODO se basa en este cálculo
function calculatePosition(timestamp, startTimestamp, endTimestamp) {
  // Validar que los timestamps sean números válidos
  if (!Number.isFinite(timestamp) || !Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
    console.warn('calculatePosition: Timestamps inválidos', { timestamp, startTimestamp, endTimestamp });
    return 0;
  }
  
  const totalDuration = endTimestamp - startTimestamp;
  if (totalDuration <= 0) return 0;
  
  const elapsed = timestamp - startTimestamp;
  const position = (elapsed / totalDuration) * 100;
  
  // Asegurar que el resultado sea un número válido en rango [0, 100]
  if (!Number.isFinite(position)) {
    console.warn('calculatePosition: Posición inválida calculada', { elapsed, totalDuration, position });
    return 0;
  }
  
  return Math.max(0, Math.min(100, position));
}

// Función para convertir fecha a timestamp usando el constructor Date normal
function getTimestamp(fechaStr) {
  try {
    // Validar que la fecha sea un string válido
    if (!fechaStr || typeof fechaStr !== 'string') {
      console.warn('getTimestamp: Fecha inválida', fechaStr);
      return null;
    }
    
    // Usar new Date() directamente - JavaScript maneja la zona horaria
    const date = new Date(fechaStr);
    const timestamp = date.getTime();
    
    // Validar timestamp resultante
    if (!Number.isFinite(timestamp) || isNaN(timestamp)) {
      console.warn('getTimestamp: Timestamp resultante inválido', timestamp);
      return null;
    }
    
    return timestamp;
  } catch (error) {
    console.error('getTimestamp: Error al procesar fecha', fechaStr, error);
    return null;
  }
}

// Estructura de datos normalizada para todo el timeline
function normalizeTimelineData(actividades) {
  if (!actividades || actividades.length === 0) return null;

  // Filtrar actividades con fechas válidas y convertir timestamps
  const validActividades = actividades
    .map(act => ({
      ...act,
      timestamp: getTimestamp(act.fecha_hora)
    }))
    .filter(act => act.timestamp !== null && Number.isFinite(act.timestamp));

  if (validActividades.length === 0) {
    console.warn('normalizeTimelineData: No hay actividades con fechas válidas');
    return null;
  }

  const sorted = validActividades.slice().sort((a, b) => a.timestamp - b.timestamp);
  
  const startTimestamp = sorted[0].timestamp;
  const endTimestamp = sorted[sorted.length - 1].timestamp;
  
  // Validar que tengamos un rango temporal válido
  if (startTimestamp >= endTimestamp) {
    console.warn('normalizeTimelineData: Rango temporal inválido', { startTimestamp, endTimestamp });
    return null;
  }
  
  // Margen de visualización
  const margin = 45 * 60 * 1000; // 45 minutos
  const displayStartTimestamp = startTimestamp - margin;
  const displayEndTimestamp = endTimestamp + margin;
  
  // Timestamps base para TODO el timeline
  const baseTimestamps = {
    start: displayStartTimestamp,
    end: displayEndTimestamp,
    duration: displayEndTimestamp - displayStartTimestamp
  };

  return {
    actividades: sorted,
    baseTimestamps
  };
}

// Generar escala de tiempo con posiciones absolutas - USANDO UTC PURO
function generateTimeScale(baseTimestamps) {
  const { start, end } = baseTimestamps;
  const scale = [];
  
  // CORREGIDO: Trabajar completamente en UTC para alinearse con intervalos
  const startDate = new Date(start);
  
  // Usar métodos UTC para evitar conversiones de zona horaria
  startDate.setUTCMinutes(0, 0, 0); // Redondear a hora completa en UTC
  if (startDate.getTime() < start) {
    startDate.setUTCHours(startDate.getUTCHours() + 1); // Incrementar en UTC
  }
  
  // console.log('🕐 generateTimeScale Debug UTC:', {
  //   baseStart: new Date(start).toISOString(),
  //   baseEnd: new Date(end).toISOString(),
  //   startDate: startDate.toISOString(),
  //   startTimestamp: startDate.getTime(),
  //   baseStartTimestamp: start
  // });
  
  let current = new Date(startDate);
  while (current.getTime() <= end) {
    const position = calculatePosition(current.getTime(), start, end);
    
    // Extraer hora UTC directamente del ISO string - IGUAL QUE LOS EVENTOS
    const isoString = current.toISOString();
    const label = isoString.slice(11, 16); // "HH:mm" en UTC
    
    // console.log('🕐 Tick escala UTC:', {
    //   timestamp: current.getTime(),
    //   time: current.toISOString(),
    //   label: label,
    //   position: position.toFixed(2) + '%',
    //   nota: 'UTC PURO - DEBE COINCIDIR CON INTERVALOS'
    // });
    
    scale.push({
      time: new Date(current),
      position,
      label: label
    });
    
    // Incrementar en UTC para mantener consistencia
    current.setUTCHours(current.getUTCHours() + 1);
  }
  
  return scale;
}

// Función para agrupar intervalos consecutivos del mismo tipo básico (versión PDF)
function agruparIntervalosConsecutivos(intervals, events) {
  if (!intervals || intervals.length === 0) return [];

  const agrupados = [];
  let grupoActual = null;

  // Crear un set de timestamps de salidas laborales para detectar interrupciones
  const salidasLaborales = new Set();
  events.forEach(event => {
    if (event.type === 'exit') {
      const timestamp = getTimestamp(event.timestamp);
      if (timestamp !== null) {
        salidasLaborales.add(timestamp);
      }
    }
  });

  intervals.forEach((interval, idx) => {
    // Determinar el tipo básico (ignorar activo/inactivo para agrupación)
    let tipoBasico;
    if (interval.type === 'break') {
      tipoBasico = 'break';
    } else if (interval.type === 'outside') {
      tipoBasico = 'outside';
    } else if (interval.type === 'inside-active' || interval.type === 'inside-inactive') {
      tipoBasico = 'inside';
    } else {
      tipoBasico = 'unknown';
    }

    // Verificar si hay una salida laboral entre el grupo actual y este intervalo
    let haySalidaLaboral = false;
    if (grupoActual) {
      const finGrupoActual = getTimestamp(grupoActual.endTime);
      const inicioIntervaloActual = getTimestamp(interval.startTime);
      
      if (finGrupoActual !== null && inicioIntervaloActual !== null) {
        // Buscar si hay alguna salida laboral entre estos timestamps (INCLUSIVE en los límites)
        for (const salidaTimestamp of salidasLaborales) {
          if (salidaTimestamp >= finGrupoActual && salidaTimestamp <= inicioIntervaloActual) {
            haySalidaLaboral = true;
            break;
          }
        }
      }
    }

    // Si es el primer intervalo, es de un tipo diferente, o hay una salida laboral en el medio
    if (!grupoActual || grupoActual.tipoBasico !== tipoBasico || haySalidaLaboral) {
      // Finalizar grupo anterior si existe
      if (grupoActual) {
        agrupados.push(grupoActual);
      }
      
      // Crear nuevo grupo
      grupoActual = {
        tipoBasico,
        startPosition: interval.startPosition,
        endPosition: interval.endPosition,
        width: interval.width,
        startTime: interval.startTime,
        endTime: interval.endTime,
        intervalosOriginales: [interval],
        type: interval.type // Mantener el tipo original del primer intervalo
      };
    } else {
      // Extender el grupo actual
      grupoActual.endPosition = interval.endPosition;
      grupoActual.width = grupoActual.endPosition - grupoActual.startPosition;
      grupoActual.endTime = interval.endTime;
      grupoActual.intervalosOriginales.push(interval);
    }
  });

  // Agregar el último grupo
  if (grupoActual) {
    agrupados.push(grupoActual);
  }

  // Calcular duración total para cada grupo
  return agrupados.map(grupo => {
    const startMs = getTimestamp(grupo.startTime);
    const endMs = getTimestamp(grupo.endTime);
    
    if (startMs === null || endMs === null) {
      return { ...grupo, duration: '0min' };
    }
    
    const diffMs = endMs - startMs;
    const minutes = Math.floor(diffMs / 60000) % 60;
    const hours = Math.floor(diffMs / 3600000);
    const duracionTexto = `${hours > 0 ? hours + 'h ' : ''}${minutes}min`;

    return {
      ...grupo,
      duration: duracionTexto
    };
  });
}

// Generar intervalos con lógica simplificada y posiciones absolutas
function generateIntervals(actividades, baseTimestamps) {
  const intervals = [];
  const events = [];
  
  let currentState = {
    isWorking: false,
    inGeofence: null,
    isActive: true,
    intervalStart: null,
    breakStart: null
  };

  const formatDuration = (startTime, endTime) => {
    const startMs = getTimestamp(startTime);
    const endMs = getTimestamp(endTime);
    if (startMs === null || endMs === null) return '0min';
    const diffMs = endMs - startMs;
    const minutes = Math.floor(diffMs / 60000) % 60;
    const hours = Math.floor(diffMs / 3600000);
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}min`;
  };

  const closeCurrentInterval = (endTime, baseTimestamps) => {
    if (currentState.intervalStart) {
      const startMs = getTimestamp(currentState.intervalStart);
      const endMs = getTimestamp(endTime);
      
      // Validar timestamps
      if (startMs === null || endMs === null) {
        console.warn('closeCurrentInterval: Timestamps inválidos', { startMs, endMs });
        return;
      }
      
      const startPos = calculatePosition(startMs, baseTimestamps.start, baseTimestamps.end);
      const endPos = calculatePosition(endMs, baseTimestamps.start, baseTimestamps.end);
      const width = endPos - startPos;
      
      // Validar posiciones calculadas
      if (!Number.isFinite(startPos) || !Number.isFinite(endPos) || !Number.isFinite(width)) {
        console.warn('closeCurrentInterval: Posiciones inválidas', { startPos, endPos, width });
        return;
      }
      
      // Evitar intervalos con ancho negativo o muy pequeño
      if (width <= 0.01) { // Cambiar de 0 a 0.01% para incluir intervalos muy pequeños
        // console.warn('closeCurrentInterval: Ancho de intervalo muy pequeño', width);
        return;
      }
      
      intervals.push({
        startPosition: startPos,
        endPosition: endPos,
        width: width,
        type: determineIntervalType(currentState),
        duration: formatDuration(currentState.intervalStart, endTime),
        startTime: currentState.intervalStart,
        endTime: endTime
      });
      
      // DEBUG: Log de intervalos para comparar con marcas de hora
      const startHour = formatHora(currentState.intervalStart);
      const endHour = formatHora(endTime);
      // console.log('📊 Intervalo creado:', {
      //   tipo: determineIntervalType(currentState),
      //   startTime: startHour,
      //   endTime: endHour,
      //   startPosition: startPos.toFixed(2) + '%',
      //   endPosition: endPos.toFixed(2) + '%',
      //   width: width.toFixed(2) + '%',
      //   duration: formatDuration(currentState.intervalStart, endTime)
      // });
    }
  };

  const determineIntervalType = (state) => {
    if (state.breakStart) return 'break';
    if (state.inGeofence === true) {
      return state.isActive ? 'inside-active' : 'inside-inactive';
    }
    if (state.inGeofence === false) return 'outside';
    return 'unknown';
  };

  const addEvent = (activity, type, description) => {
    // Usar timestamp ya calculado o calcularlo si no existe
    const timestamp = activity.timestamp || getTimestamp(activity.fecha_hora);
    if (timestamp === null) {
      console.warn('addEvent: Timestamp inválido para evento', activity);
      return;
    }
    
    const position = calculatePosition(timestamp, baseTimestamps.start, baseTimestamps.end);
    
    // Validar que la posición sea válida
    if (!Number.isFinite(position)) {
      console.warn('addEvent: Posición inválida calculada', { timestamp, position });
      return;
    }
    
    // DEBUG: Comparar hora extraída vs hora calculada
    const horaExtraida = formatHora(activity.fecha_hora);
    const horaCalculada = formatTime(new Date(timestamp));
    
    // console.log('📍 addEvent Debug UTC:', {
    //   tipo: activity.tipo,
    //   fechaOriginal: activity.fecha_hora,
    //   horaExtraida: horaExtraida,
    //   timestamp: timestamp,
    //   horaCalculada: horaCalculada,
    //   position: position.toFixed(2) + '%',
    //   diferencia: horaExtraida !== horaCalculada ? '⚠️ DIFERENTE' : '✅ IGUAL - UTC CONSISTENTE'
    // });
    
    events.push({
      position,
      type,
      description,
      time: formatHora(activity.fecha_hora), // Usar hora original
      timestamp: activity.fecha_hora
    });
  };

  actividades.forEach((activity, index) => {
    // Detectar cambios de estado y cerrar intervalos
    let stateChanged = false;

    // 1. Manejo de entrada/salida laboral
    if (typeof activity.tipo_registro === 'number') {
      if (activity.tipo_registro === 1 && !currentState.isWorking) { // Entrada
        closeCurrentInterval(activity.fecha_hora, baseTimestamps);
        currentState.isWorking = true;
        currentState.inGeofence = activity.dentro_geocerca;
        currentState.intervalStart = activity.fecha_hora;
        addEvent(activity, 'entry', 'Entrada laboral');
        stateChanged = true;
      } else if (activity.tipo_registro === 0 && currentState.isWorking) { // Salida
        closeCurrentInterval(activity.fecha_hora, baseTimestamps);
        currentState.isWorking = false;
        currentState.intervalStart = null;
        addEvent(activity, 'exit', 'Salida laboral');
        stateChanged = true;
      }
    }

    // 2. Manejo de descansos
    if (typeof activity.evento === 'number' && activity.evento === 2) {
      if (!currentState.breakStart) {
        closeCurrentInterval(activity.fecha_hora, baseTimestamps);
        currentState.breakStart = activity.fecha_hora;
        addEvent(activity, 'break', 'Inicio descanso');
        stateChanged = true;
      }
    } else if (currentState.breakStart) {
      // Fin de descanso
      const breakStartMs = getTimestamp(currentState.breakStart);
      const breakEndMs = activity.timestamp || getTimestamp(activity.fecha_hora);
      
      // Validar timestamps
      if (breakStartMs === null || breakEndMs === null) {
        console.warn('Fin de descanso: Timestamps inválidos', { breakStartMs, breakEndMs });
      } else {
        const startPos = calculatePosition(breakStartMs, baseTimestamps.start, baseTimestamps.end);
        const endPos = calculatePosition(breakEndMs, baseTimestamps.start, baseTimestamps.end);
        const width = endPos - startPos;
        
        // Validar posiciones y ancho
        if (!Number.isFinite(startPos) || !Number.isFinite(endPos) || !Number.isFinite(width) || width <= 0.01) {
          // console.warn('Fin de descanso: Posiciones inválidas o ancho muy pequeño', { startPos, endPos, width });
        } else {
          intervals.push({
            startPosition: startPos,
            endPosition: endPos,
            width: width,
            type: 'break',
            duration: formatDuration(currentState.breakStart, activity.fecha_hora),
            startTime: currentState.breakStart,
            endTime: activity.fecha_hora
          });
          
          // DEBUG: Log de intervalo de descanso
          const breakStartHour = formatHora(currentState.breakStart);
          const breakEndHour = formatHora(activity.fecha_hora);
          // console.log('🟡 Intervalo DESCANSO creado:', {
          //   startTime: breakStartHour,
          //   endTime: breakEndHour,
          //   startPosition: startPos.toFixed(2) + '%',
          //   endPosition: endPos.toFixed(2) + '%',
          //   width: width.toFixed(2) + '%',
          //   duration: formatDuration(currentState.breakStart, activity.fecha_hora)
          // });
        }
      }
      
      currentState.breakStart = null;
      currentState.intervalStart = activity.fecha_hora;
      addEvent(activity, 'break', 'Fin descanso');
      stateChanged = true;
    }

    // 3. Manejo de geocerca (solo si no está en descanso)
    if (!currentState.breakStart && typeof activity.evento === 'number') {
      if (activity.evento === 1 && currentState.inGeofence !== true) { // Entró
        closeCurrentInterval(activity.fecha_hora, baseTimestamps);
        currentState.inGeofence = true;
        currentState.intervalStart = activity.fecha_hora;
        addEvent(activity, 'geofence', 'Entró geocerca');
        stateChanged = true;
      } else if (activity.evento === 0 && currentState.inGeofence !== false) { // Salió
        closeCurrentInterval(activity.fecha_hora, baseTimestamps);
        currentState.inGeofence = false;
        currentState.intervalStart = activity.fecha_hora;
        addEvent(activity, 'geofence', 'Salió geocerca');
        stateChanged = true;
      }
    }

    // 4. Manejo de actividad (solo si está dentro y no en descanso)
    if (!currentState.breakStart && currentState.inGeofence === true && typeof activity.evento === 'number') {
      if (activity.evento === 4 || activity.evento === 5) {
        const newActiveState = activity.evento === 5; // 5 = activo, 4 = inactivo
        if (newActiveState !== currentState.isActive) {
          closeCurrentInterval(activity.fecha_hora, baseTimestamps);
          currentState.isActive = newActiveState;
          currentState.intervalStart = activity.fecha_hora;
          stateChanged = true;
        }
      }
    }

    // Si no hubo cambio de estado pero es el primer evento, inicializar
    if (!stateChanged && index === 0 && !currentState.intervalStart) {
      currentState.isWorking = true;
      currentState.inGeofence = activity.dentro_geocerca;
      currentState.intervalStart = activity.fecha_hora;
    }
  });

  // Cerrar intervalo final
  if (currentState.intervalStart && actividades.length > 0) {
    const lastActivity = actividades[actividades.length - 1];
    closeCurrentInterval(lastActivity.fecha_hora, baseTimestamps);
  }

  return { intervals, events };
}

// Configuración visual unificada
const VISUAL_CONFIG = {
  colors: {
    'inside-active': '#22c55e',
    'inside-inactive': '#86efac',
    'outside': '#ef4444',
    'break': '#eab308',
    'unknown': '#9ca3af'
  },
  opacity: {
    'inside-active': 1,
    'inside-inactive': 0.7,
    'outside': 1,
    'break': 1,
    'unknown': 0.8
  },
  eventColors: {
    'entry': '#22c55e',
    'exit': '#ef4444',
    'break': '#eab308',
    'geofence': '#3b82f6',
    'default': '#059669'
  }
};

// Constantes para el sistema de coordenadas unificado en PDF
const TIMELINE_CONFIG = {
  containerWidth: 500, // ancho fijo del contenedor timeline en puntos
  containerHeight: 8,   // altura de la barra principal
  eventSize: 12,        // tamaño de los círculos de eventos
  tickHeight: 12        // altura de las marcas de tiempo
};

// Función para convertir porcentaje a píxeles absolutos
function percentToPixels(percent, containerWidth = TIMELINE_CONFIG.containerWidth) {
  return Math.max(0, Math.min(containerWidth, (percent / 100) * containerWidth));
}

// Función para centrar un elemento (devuelve la posición izquierda para centrarlo)
function centerElement(positionPercent, elementWidth, containerWidth = TIMELINE_CONFIG.containerWidth) {
  const centerPx = percentToPixels(positionPercent, containerWidth);
  return Math.max(0, Math.min(containerWidth - elementWidth, centerPx - (elementWidth / 2)));
}

const TimelineComponentSimple = ({ actividades, titulo = "Cronología del Día" }) => {
  // Validación inicial
  if (!actividades || actividades.length === 0) {
    return (
      <View style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 }}>
          {titulo}
        </Text>
        <View style={{ padding: 20, textAlign: 'center' }}>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>
            No hay actividades para mostrar
          </Text>
        </View>
      </View>
    );
  }

  // Normalizar datos con sistema de coordenadas unificado
  const timelineData = normalizeTimelineData(actividades);
  if (!timelineData) {
    return (
      <View style={{ padding: 10, border: '1px solid #e5e7eb', borderRadius: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 }}>
          {titulo}
        </Text>
        <View style={{ padding: 20, textAlign: 'center' }}>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>
            Error al procesar actividades
          </Text>
        </View>
      </View>
    );
  }

  const { baseTimestamps } = timelineData;
  const timeScale = generateTimeScale(baseTimestamps);
  const { intervals, events } = generateIntervals(timelineData.actividades, baseTimestamps);
  
  // Agrupar intervalos consecutivos del mismo tipo básico para evitar solapamiento
  // PERO respetando las salidas laborales como separadores
  const intervalosAgrupados = agruparIntervalosConsecutivos(intervals, events);

  return (
    <View style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 10 }} wrap={false}>
      <Text style={{ 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#059669', 
        marginBottom: 12
      }}>
        {titulo}
      </Text>
      
      <View style={{ 
        position: 'relative', 
        width: TIMELINE_CONFIG.containerWidth + 24, // ancho fijo + padding
        backgroundColor: '#f9fafb', 
        borderRadius: 4, 
        padding: 12,
        border: '1px solid #f3f4f6',
        minHeight: 140
      }}>
        
        {/* Marcas de tiempo con posicionamiento absoluto en píxeles */}
        <View style={{ position: 'relative', marginBottom: 24, height: 20 }}>
          {timeScale.map((tick, idx) => {
            if (!Number.isFinite(tick.position)) return null;
            
            const tickLeftPx = centerElement(tick.position, 30); // centrar un área de 30px para el texto
            
            return (
              <View key={`tick-${idx}`} style={{ 
                position: 'absolute', 
                left: tickLeftPx,
                width: 30
              }}>
                <Text style={{ 
                  fontSize: 8, 
                  color: '#4b5563', 
                  fontWeight: 'bold',
                  marginBottom: 3,
                  textAlign: 'center',
                  width: 30
                }}>
                  {tick.label}
                </Text>
                <View style={{ 
                  width: 1, 
                  height: TIMELINE_CONFIG.tickHeight, 
                  backgroundColor: '#9ca3af',
                  marginLeft: 14.5 // centrar la línea en el texto de 30px
                }}
                />
              </View>
            );
          })}
        </View>
        
        {/* Contenedor principal del timeline con ancho fijo */}
        <View style={{ position: 'relative', marginBottom: 12 }}>
          <View style={{ 
            width: TIMELINE_CONFIG.containerWidth, 
            height: TIMELINE_CONFIG.containerHeight, 
            backgroundColor: '#e5e7eb', 
            borderRadius: 2,
            position: 'relative'
          }}>
            
            {/* Intervalos agrupados con posicionamiento absoluto en píxeles */}
            {intervalosAgrupados.map((interval, idx) => {
              if (!Number.isFinite(interval.startPosition) || 
                  !Number.isFinite(interval.width) ||
                  interval.width <= 0.01) {
                return null;
              }
              
              const intervalLeftPx = percentToPixels(interval.startPosition);
              const intervalWidthPx = Math.max(1, percentToPixels(interval.width)); // mínimo 1px de ancho
              
              // Usar el tipo básico para el color, pero mantener la opacidad del tipo original
              const colorType = interval.tipoBasico === 'inside' ? 'inside-active' : interval.tipoBasico;
              
              return (
                <View
                  key={`interval-agrupado-${idx}`}
                  style={{
                    position: 'absolute',
                    height: TIMELINE_CONFIG.containerHeight,
                    backgroundColor: VISUAL_CONFIG.colors[colorType] || VISUAL_CONFIG.colors.unknown,
                    opacity: VISUAL_CONFIG.opacity[colorType] || 1,
                    borderRadius: 2,
                    left: intervalLeftPx,
                    width: intervalWidthPx,
                    top: 0,
                    zIndex: 1
                  }}
                />
              );
            })}
            
            {/* Eventos con posicionamiento absoluto en píxeles */}
            {events.map((event, idx) => {
              if (!Number.isFinite(event.position)) return null;
              
              const eventColor = VISUAL_CONFIG.eventColors[event.type] || VISUAL_CONFIG.eventColors.default;
              const isAbove = idx % 2 === 0;
              const eventCenterPx = percentToPixels(event.position);
              const eventLeftPx = eventCenterPx - (TIMELINE_CONFIG.eventSize / 2);
              
              return (
                <View key={`event-${idx}`} style={{ 
                  position: 'absolute', 
                  left: eventCenterPx,
                  width: 1
                }}>
                  {/* Conector vertical */}
                  <View 
                    style={{ 
                      width: 1, 
                      backgroundColor: '#6b7280',
                      position: 'absolute',
                      left: -0.5,
                      height: isAbove ? 22 : 24, 
                      top: isAbove ? -22 : TIMELINE_CONFIG.containerHeight
                    }}
                  />
                  
                  {/* Círculo del evento */}
                  <View style={{
                    width: TIMELINE_CONFIG.eventSize,
                    height: TIMELINE_CONFIG.eventSize,
                    backgroundColor: eventColor,
                    borderRadius: TIMELINE_CONFIG.eventSize / 2,
                    border: '2px solid #ffffff',
                    position: 'absolute',
                    zIndex: 10,
                    left: -(TIMELINE_CONFIG.eventSize / 2),
                    top: -(TIMELINE_CONFIG.eventSize / 2) + (TIMELINE_CONFIG.containerHeight / 2)
                  }} />
                  
                  {/* Etiqueta del evento */}
                  <View 
                    style={{ 
                      position: 'absolute',
                      zIndex: 20,
                      left: -30,
                      width: 60,
                      top: isAbove ? -40 : 18
                    }}
                  >
                    <Text style={{
                      fontSize: 7,
                      fontWeight: 'bold',
                      color: '#1f2937',
                      textAlign: 'center',
                      lineHeight: 1.1
                    }}>
                      {event.description}
                    </Text>
                    <Text style={{
                      fontSize: 6,
                      color: '#4b5563',
                      textAlign: 'center',
                      marginTop: 1
                    }}>
                      ({event.time})
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Etiquetas de intervalos agrupados */}
        <View style={{ position: 'relative', height: 16, marginTop: 4 }}>
          {intervalosAgrupados.map((interval, idx) => {
            if (!Number.isFinite(interval.startPosition) || !Number.isFinite(interval.width)) {
              return null;
            }
            
            const centerPercent = interval.startPosition + (interval.width / 2);
            if (!Number.isFinite(centerPercent)) return null;
            
            // Solo mostrar etiqueta si el intervalo es lo suficientemente grande (más del 3% del ancho total)
            if (interval.width < 3) return null;
            
            const typeLabels = {
              'inside': 'Dentro',
              'outside': 'Fuera',
              'break': 'Descanso',
              'unknown': 'Desconocido'
            };
            
            const typeColors = {
              'inside': '#15803d',
              'outside': '#b91c1c',
              'break': '#a16207',
              'unknown': '#374151'
            };
            
            const labelLeftPx = centerElement(centerPercent, 80);
            
            return (
              <View
                key={`label-agrupado-${idx}`}
                style={{
                  position: 'absolute',
                  left: labelLeftPx,
                  width: 80
                }}
              >
                <Text style={{
                  fontSize: 7,
                  fontWeight: 'bold',
                  color: typeColors[interval.tipoBasico] || typeColors.unknown,
                  textAlign: 'center'
                }}>
                  {typeLabels[interval.tipoBasico] || 'Desconocido'}
                </Text>
                <Text style={{
                  fontSize: 6,
                  color: '#4b5563',
                  textAlign: 'center',
                  marginTop: 1
                }}>
                  ({interval.duration})
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default TimelineComponentSimple;
