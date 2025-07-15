import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

/**
 * DASHBOARDS ROUTES - CÁLCULO DE HORAS TRABAJADAS REALES
 * 
 * Este módulo calcula las horas trabajadas basándose en intervalos de tiempo
 * reales entre eventos de entrada y salida de geocerca, no en conteo de registros.
 * 
 * Características:
 * - Calcula horas reales trabajadas dentro de geocerca
 * - Maneja descansos (eventos 2 y 3)
 * - Agrupa por días para evitar duplicación
 * - Optimizado para múltiples empleados/municipios
 */

// --- FUNCIONES AUXILIARES PARA CÁLCULO DE HORAS TRABAJADAS ---

// Convierte milisegundos a horas con 2 decimales
function msToHours(ms) {
  return +(ms / 3600000).toFixed(2);
}

// Calcula las horas dentro, fuera, descanso y total de salidas de un arreglo de registros
function calcularEstadisticasEmpleado(registros = []) {
  let totalDentro = 0;
  let totalFuera = 0;
  let totalDescanso = 0;
  let totalSalidas = 0;
  let estadoGeocerca = null;
  let horaIntervalo = null;
  let inicioDescanso = null;
  
  // Función auxiliar para normalizar fechas
  const normalizarFecha = (fecha) => {
    if (fecha instanceof Date) return fecha;
    if (typeof fecha === 'string') return new Date(fecha);
    return new Date(fecha);
  };
  
  const ordenadas = registros.slice().sort((a, b) => 
    normalizarFecha(a.fecha_hora) - normalizarFecha(b.fecha_hora)
  );
  
  for (let i = 0; i < ordenadas.length; i++) {
    const act = ordenadas[i];
    
    if (i === 0) {
      estadoGeocerca = act.dentro_geocerca;
      horaIntervalo = normalizarFecha(act.fecha_hora);
      continue;
    }
    
    if (typeof act.evento === 'number') {
      const fechaActual = normalizarFecha(act.fecha_hora);
      
      // Manejo de descansos
      if (act.evento === 2) {
        // Inicio de descanso
        inicioDescanso = fechaActual;
      } else if (act.evento === 3 && inicioDescanso) {
        // Fin de descanso
        totalDescanso += (fechaActual - inicioDescanso);
        inicioDescanso = null;
      }
      
      // Manejo de geocerca
      if (act.evento === 0 && estadoGeocerca === true && horaIntervalo) {
        totalDentro += (fechaActual - horaIntervalo);
        estadoGeocerca = false;
        horaIntervalo = fechaActual;
        totalSalidas++;
      } else if (act.evento === 1 && estadoGeocerca === false && horaIntervalo) {
        totalFuera += (fechaActual - horaIntervalo);
        estadoGeocerca = true;
        horaIntervalo = fechaActual;
      }
    }
    
    if (i === ordenadas.length - 1 && horaIntervalo && estadoGeocerca !== null) {
      const fechaFinal = normalizarFecha(act.fecha_hora);
      if (estadoGeocerca) {
        totalDentro += (fechaFinal - horaIntervalo);
      } else {
        totalFuera += (fechaFinal - horaIntervalo);
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
function calcularEstadisticasEmpleadoPorDias(registros = []) {
  // Agrupar registros por día local
  const actividadesPorDia = {};
  registros.forEach((registro) => {
    // Manejar tanto strings como objetos Date
    let fechaStr;
    if (registro.fecha_hora instanceof Date) {
      fechaStr = registro.fecha_hora.toISOString().slice(0, 10); // yyyy-MM-dd
    } else if (typeof registro.fecha_hora === 'string') {
      fechaStr = registro.fecha_hora.slice(0, 10); // yyyy-MM-dd
    } else {
      fechaStr = new Date(registro.fecha_hora).toISOString().slice(0, 10);
    }
    
    if (!actividadesPorDia[fechaStr]) actividadesPorDia[fechaStr] = [];
    actividadesPorDia[fechaStr].push(registro);
  });
  
  let totalTrabajadas = 0;
  let totalFuera = 0;
  let totalDescanso = 0;
  let totalSalidas = 0;
  
  Object.values(actividadesPorDia).forEach(acts => {
    const stats = calcularEstadisticasEmpleado(acts);
    totalTrabajadas += stats.workedHours || 0;
    totalFuera += stats.outsideHours || 0;
    totalDescanso += stats.restHours || 0;
    totalSalidas += stats.totalExits || 0;
  });
  
  return {
    workedHours: totalTrabajadas,
    outsideHours: totalFuera,
    restHours: totalDescanso,
    totalExits: totalSalidas,
  };
}

// Función auxiliar para calcular horas trabajadas reales para múltiples empleados
async function calcularHorasTrabajadasReales(empleados, fechaInicio, fechaFin) {
  if (!empleados || empleados.length === 0) return 0;
  
  try {
    const empleadoIds = empleados.map(emp => emp.id_user);
    
    // Obtener todos los registros de todos los empleados en una sola consulta
    const registrosQuery = `
      SELECT id_user, fecha_hora, dentro_geocerca, evento, tipo_registro
      FROM registro_ubicaciones
      WHERE id_user = ANY($1) AND fecha_hora BETWEEN $2 AND $3
      ORDER BY id_user, fecha_hora ASC
    `;
    
    const result = await pool.query(registrosQuery, [empleadoIds, fechaInicio, fechaFin]);
    
    // Agrupar registros por empleado
    const registrosPorEmpleado = {};
    result.rows.forEach(registro => {
      if (!registrosPorEmpleado[registro.id_user]) {
        registrosPorEmpleado[registro.id_user] = [];
      }
      registrosPorEmpleado[registro.id_user].push(registro);
    });
    
    let totalHorasReales = 0;
    
    // Calcular horas para cada empleado
    Object.values(registrosPorEmpleado).forEach(registros => {
      if (registros.length > 0) {
        try {
          const stats = calcularEstadisticasEmpleadoPorDias(registros);
          totalHorasReales += stats.workedHours;
        } catch (error) {
          console.error('Error calculando estadísticas para empleado:', error);
        }
      }
    });
    
    return totalHorasReales;
  } catch (error) {
    console.error('Error en calcularHorasTrabajadasReales:', error);
    return 0;
  }
}

// Función auxiliar para calcular todas las estadísticas de horas (trabajadas, descanso, fuera)
async function calcularHorasTrabajadasRealesTotales(empleados, fechaInicio, fechaFin) {
  if (!empleados || empleados.length === 0) {
    return {
      workedHours: 0,
      outsideHours: 0,
      restHours: 0,
      totalExits: 0
    };
  }
  
  try {
    const empleadoIds = empleados.map(emp => emp.id_user);
    
    // Obtener todos los registros de todos los empleados en una sola consulta
    const registrosQuery = `
      SELECT id_user, fecha_hora, dentro_geocerca, evento, tipo_registro
      FROM registro_ubicaciones
      WHERE id_user = ANY($1) AND fecha_hora BETWEEN $2 AND $3
      ORDER BY id_user, fecha_hora ASC
    `;
    
    const result = await pool.query(registrosQuery, [empleadoIds, fechaInicio, fechaFin]);
    
    // Agrupar registros por empleado
    const registrosPorEmpleado = {};
    result.rows.forEach(registro => {
      if (!registrosPorEmpleado[registro.id_user]) {
        registrosPorEmpleado[registro.id_user] = [];
      }
      registrosPorEmpleado[registro.id_user].push(registro);
    });
    
    let totalWorkedHours = 0;
    let totalOutsideHours = 0;
    let totalRestHours = 0;
    let totalExits = 0;
    
    // Calcular estadísticas completas para cada empleado
    Object.values(registrosPorEmpleado).forEach(registros => {
      if (registros.length > 0) {
        try {
          const stats = calcularEstadisticasEmpleadoPorDias(registros);
          totalWorkedHours += stats.workedHours || 0;
          totalOutsideHours += stats.outsideHours || 0;
          totalRestHours += stats.restHours || 0;
          totalExits += stats.totalExits || 0;
        } catch (error) {
          console.error('Error calculando estadísticas para empleado:', error);
        }
      }
    });
    
    return {
      workedHours: totalWorkedHours,
      outsideHours: totalOutsideHours,
      restHours: totalRestHours,
      totalExits: totalExits
    };
  } catch (error) {
    console.error('Error en calcularHorasTrabajadasRealesTotales:', error);
    return {
      workedHours: 0,
      outsideHours: 0,
      restHours: 0,
      totalExits: 0
    };
  }
}

// Función auxiliar optimizada para calcular horas por municipio
async function calcularHorasTrabajadasPorMunicipio(idEstado, fechaInicio, fechaFin) {
  try {
    // Obtener todos los empleados del estado con su municipio
    const empleadosQuery = `
      SELECT u.id_user, m.id_municipio, m.nombre_municipio
      FROM user_data u
      JOIN municipios m ON u.id_municipio = m.id_municipio
      WHERE m.id_estado = $1 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
    `;
    
    const empleadosRes = await pool.query(empleadosQuery, [idEstado]);
    
    if (empleadosRes.rows.length === 0) return [];
    
    const empleadoIds = empleadosRes.rows.map(emp => emp.id_user);
    
    // Obtener todos los registros en una sola consulta
    const registrosQuery = `
      SELECT id_user, fecha_hora, dentro_geocerca, evento, tipo_registro
      FROM registro_ubicaciones
      WHERE id_user = ANY($1) AND fecha_hora BETWEEN $2 AND $3
      ORDER BY id_user, fecha_hora ASC
    `;
    
    const registrosRes = await pool.query(registrosQuery, [empleadoIds, fechaInicio, fechaFin]);
    
    // Agrupar registros por empleado
    const registrosPorEmpleado = {};
    registrosRes.rows.forEach(registro => {
      if (!registrosPorEmpleado[registro.id_user]) {
        registrosPorEmpleado[registro.id_user] = [];
      }
      registrosPorEmpleado[registro.id_user].push(registro);
    });
    
    // Agrupar horas por municipio
    const horasPorMunicipio = {};
    
    empleadosRes.rows.forEach(empleado => {
      const registros = registrosPorEmpleado[empleado.id_user] || [];
      if (registros.length > 0) {
        try {
          const stats = calcularEstadisticasEmpleadoPorDias(registros);
          
          if (!horasPorMunicipio[empleado.nombre_municipio]) {
            horasPorMunicipio[empleado.nombre_municipio] = 0;
          }
          horasPorMunicipio[empleado.nombre_municipio] += stats.workedHours;
        } catch (error) {
          console.error(`Error calculando horas para empleado ${empleado.id_user}:`, error);
        }
      }
    });
    
    // Convertir a array y filtrar municipios con horas > 0
    return Object.entries(horasPorMunicipio)
      .filter(([_, horas]) => horas > 0)
      .map(([municipio, horas]) => ({
        municipio,
        horas: Math.round(horas * 100) / 100
      }))
      .sort((a, b) => b.horas - a.horas);
  } catch (error) {
    console.error('Error en calcularHorasTrabajadasPorMunicipio:', error);
    return [];
  }
}

// Función auxiliar para mapear IDs de estado a códigos de mapa
const getStateCodeMapping = () => {
  return {
    1: 'MXAGU',   // Aguascalientes
    2: 'MXBCN',   // Baja California
    3: 'MXBCS',   // Baja California Sur
    4: 'MXCAM',   // Campeche
    5: 'MXCOA',   // Coahuila
    6: 'MXCOL',   // Colima
    7: 'MXCHP',   // Chiapas
    8: 'MXCHH',   // Chihuahua
    9: 'MXCMX',   // Ciudad de México
    10: 'MXDUR',  // Durango
    11: 'MXGUA',  // Guanajuato
    12: 'MXGRO',  // Guerrero
    13: 'MXHID',  // Hidalgo
    14: 'MXJAL',  // Jalisco
    15: 'MXMEX',  // México
    16: 'MXMIC',  // Michoacán
    17: 'MXMOR',  // Morelos
    18: 'MXNAY',  // Nayarit
    19: 'MXNLE',  // Nuevo León
    20: 'MXOAX',  // Oaxaca
    21: 'MXPUE',  // Puebla
    22: 'MXQUE',  // Querétaro
    23: 'MXROO',  // Quintana Roo
    24: 'MXSLP',  // San Luis Potosí
    25: 'MXSIN',  // Sinaloa
    26: 'MXSON',  // Sonora
    27: 'MXTAB',  // Tabasco
    28: 'MXTAM',  // Tamaulipas
    29: 'MXTLA',  // Tlaxcala
    30: 'MXVER',  // Veracruz
    31: 'MXYUC',  // Yucatán
    32: 'MXZAC'   // Zacatecas
  };
};

// POST /api/dashboards/grupo
// Recibe: { id_hospital, fechaInicio, fechaFin }
// Devuelve: [{ empleado: {...}, registros: [...] }, ...]
router.post('/grupo', async (req, res) => {
  try {
    const { id_hospital, fechaInicio, fechaFin } = req.body;
    // Validar que todos los campos requeridos estén presentes
    if (!id_hospital || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_hospital, fechaInicio y fechaFin son obligatorios' });
    }
    // Construir filtros
    let where = 'u.id_hospital = $1 AND r.fecha_hora BETWEEN $2 AND $3';
    const values = [id_hospital, fechaInicio, fechaFin];
    // Consulta empleados y sus registros
    const query = `
      SELECT u.id_user, u.nombre, u.ap_paterno, u.ap_materno, u.id_group, u.id_estado, u.id_municipio, 
             g.nombre_grupo, e.nombre_estado, m.nombre_municipio, h.nombre_hospital,
             r.id_registro, r.latitud, r.longitud, 
             r.fecha_hora,
             r.dentro_geocerca, r.tipo_registro, r.evento
      FROM user_data u
      LEFT JOIN registro_ubicaciones r ON u.id_user = r.id_user
      LEFT JOIN groups g ON u.id_group = g.id_group
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
      LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
      WHERE ${where}
      ORDER BY u.id_user, r.fecha_hora ASC
    `;
    const result = await pool.query(query, values);
    // Agrupar por empleado
    const empleadosMap = {};
    for (const row of result.rows) {
      if (!empleadosMap[row.id_user]) {
        empleadosMap[row.id_user] = {
          empleado: {
            id_user: row.id_user,
            nombre: row.nombre,
            ap_paterno: row.ap_paterno,
            ap_materno: row.ap_materno,
            id_group: row.id_group, // <-- incluir id_group
            grupo: row.nombre_grupo,
            estado: row.nombre_estado,
            municipio: row.nombre_municipio,
            hospital: row.nombre_hospital,
          },
          registros: [],
        };
      }
      if (row.id_registro) {
        empleadosMap[row.id_user].registros.push({
          id_registro: row.id_registro,
          latitud: row.latitud,
          longitud: row.longitud,
          fecha_hora: row.fecha_hora,
          dentro_geocerca: row.dentro_geocerca,
          tipo_registro: row.tipo_registro,
          evento: row.evento,
        });
      }
    }
    const empleados = Object.values(empleadosMap);
    res.json({ empleados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los empleados del hospital' });
  }
});

// POST /api/dashboards/municipio
// Recibe: { id_municipio, fechaInicio, fechaFin }
// Devuelve: { empleados: [...], hospitales: [...] }
router.post('/municipio', async (req, res) => {
  try {
    const { id_municipio, fechaInicio, fechaFin } = req.body;
    
    // Validar que todos los campos requeridos estén presentes
    if (!id_municipio || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_municipio, fechaInicio y fechaFin son obligatorios' });
    }

    // Construir filtros para empleados
    let where = 'u.id_municipio = $1 AND r.fecha_hora BETWEEN $2 AND $3';
    const values = [id_municipio, fechaInicio, fechaFin];

    // Consulta empleados y sus registros del municipio
    const queryEmpleados = `
      SELECT u.id_user, u.nombre, u.ap_paterno, u.ap_materno, u.id_group, u.id_hospital, u.id_estado, u.id_municipio,
             g.nombre_grupo, e.nombre_estado, m.nombre_municipio, h.nombre_hospital,
             r.id_registro, r.latitud, r.longitud, 
             r.fecha_hora,
             r.dentro_geocerca, r.tipo_registro, r.evento
      FROM user_data u
      LEFT JOIN registro_ubicaciones r ON u.id_user = r.id_user
      LEFT JOIN groups g ON u.id_group = g.id_group
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
      LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
      WHERE ${where}
      ORDER BY u.id_user, r.fecha_hora ASC
    `;

    const resultEmpleados = await pool.query(queryEmpleados, values);

    // Agrupar empleados por id_user
    const empleadosMap = {};
    for (const row of resultEmpleados.rows) {
      if (!empleadosMap[row.id_user]) {
        empleadosMap[row.id_user] = {
          empleado: {
            id_user: row.id_user,
            nombre: row.nombre,
            ap_paterno: row.ap_paterno,
            ap_materno: row.ap_materno,
            id_group: row.id_group,
            id_hospital: row.id_hospital,
            grupo: row.nombre_grupo,
            estado: row.nombre_estado,
            municipio: row.nombre_municipio,
            hospital: row.nombre_hospital,
          },
          registros: [],
        };
      }
      
      // Solo agregar registros si existen (id_registro no es null)
      if (row.id_registro) {
        empleadosMap[row.id_user].registros.push({
          id_registro: row.id_registro,
          latitud: row.latitud,
          longitud: row.longitud,
          fecha_hora: row.fecha_hora,
          dentro_geocerca: row.dentro_geocerca,
          tipo_registro: row.tipo_registro,
          evento: row.evento,
        });
      }
    }

    const empleados = Object.values(empleadosMap);

    // Consulta para obtener todos los hospitales del municipio con total de empleados
    const queryHospitales = `
      SELECT h.id_hospital, h.nombre_hospital, h.latitud_hospital, h.longitud_hospital, h.direccion_hospital,
             e.nombre_estado, m.nombre_municipio,
             COUNT(u.id_user) as total_empleados
      FROM hospitals h
      JOIN municipios m ON h.id_municipio = m.id_municipio
      JOIN estados e ON m.id_estado = e.id_estado
      LEFT JOIN user_data u ON h.id_hospital = u.id_hospital AND u.id_group IS NOT NULL
      WHERE h.id_municipio = $1
      GROUP BY h.id_hospital, h.nombre_hospital, h.latitud_hospital, h.longitud_hospital, h.direccion_hospital,
               e.nombre_estado, m.nombre_municipio
      ORDER BY h.nombre_hospital ASC
    `;

    const resultHospitales = await pool.query(queryHospitales, [id_municipio]);

    const hospitales = resultHospitales.rows.map(row => ({
      id_hospital: row.id_hospital,
      nombre_hospital: row.nombre_hospital,
      latitud: row.latitud_hospital,
      longitud: row.longitud_hospital,
      direccion: row.direccion_hospital,
      nombre_estado: row.nombre_estado,
      nombre_municipio: row.nombre_municipio,
      total_empleados: parseInt(row.total_empleados) || 0,
    }));

    res.json({ 
      empleados,
      hospitales 
    });

  } catch (error) {
    console.error('Error en endpoint /municipio:', error);
    res.status(500).json({ error: 'Error al obtener los datos del municipio' });
  }
});

// --- ENDPOINTS Estatales PARA DASHBOARD ---

// 0. Métricas para las tarjetas del dashboard
// GET /api/dashboards/estatal/metricas?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/metricas', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }

    // Query para total de hospitales únicos en el estado
    const hospitalesQuery = `
      SELECT COUNT(DISTINCT h.id_hospital) as total_hospitales
      FROM hospitals h
      JOIN municipios m ON h.id_municipio = m.id_municipio
      WHERE m.id_estado = $1
    `;

    // Query para obtener empleados únicos en el estado (solo los que tienen hospital y grupo asignados)
    const empleadosQuery = `
      SELECT u.id_user
      FROM user_data u
      WHERE u.id_estado = $1 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
    `;

    // Query para total de salidas de geocerca en el período (solo empleados con hospital y grupo asignados)
    const salidasGeocercaQuery = `
      SELECT COUNT(*) as total_salidas_geocerca
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento = 0 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
    `;

    // Ejecutar queries básicas en paralelo
    const [hospitalesRes, empleadosRes, salidasRes] = await Promise.all([
      pool.query(hospitalesQuery, [id_estado]),
      pool.query(empleadosQuery, [id_estado]),
      pool.query(salidasGeocercaQuery, [id_estado, fechaInicio, fechaFin])
    ]);

    // Calcular horas trabajadas reales usando las funciones auxiliares
    const empleados = empleadosRes.rows;
    const statsCompletas = await calcularHorasTrabajadasRealesTotales(empleados, fechaInicio, fechaFin);

    const metricas = {
      total_hospitales: parseInt(hospitalesRes.rows[0]?.total_hospitales) || 0,
      total_empleados: empleados.length || 0,
      total_salidas_geocerca: parseInt(salidasRes.rows[0]?.total_salidas_geocerca) || 0,
      total_horas_trabajadas: Math.round(statsCompletas.workedHours * 100) / 100, // Redondear a 2 decimales
      total_horas_descanso: Math.round(statsCompletas.restHours * 100) / 100,
      total_horas_fuera: Math.round(statsCompletas.outsideHours * 100) / 100
    };

    res.json(metricas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener métricas del dashboard' });
  }
});

// 1. Entradas y Salidas por Día
// GET /api/dashboards/estadual/entradas-salidas?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/entradas-salidas', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    const query = `
      SELECT 
        DATE(r.fecha_hora) as fecha,
        SUM(CASE WHEN r.evento = 1 THEN 1 ELSE 0 END) as entradas,
        SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) as salidas
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento IN (0, 1) AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
      GROUP BY fecha
      ORDER BY fecha
    `;
    const result = await pool.query(query, [id_estado, fechaInicio, fechaFin]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener entradas y salidas por día' });
  }
});

// 2. Distribución de Eventos de Geocerca
// GET /api/dashboards/estadual/eventos-geocerca?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/eventos-geocerca', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    const query = `
      SELECT 
        r.evento,
        COUNT(*) as cantidad
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento IS NOT NULL AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
      GROUP BY r.evento
      ORDER BY r.evento
    `;
    const result = await pool.query(query, [id_estado, fechaInicio, fechaFin]);
    // Agregar nombre del evento
    const eventosNombres = [
      'Salió geocerca',
      'Entró geocerca',
      'Inicio descanso',
      'Termino descanso'
    ];
    const data = result.rows.map(r => ({
      evento: eventosNombres[r.evento] || `Evento ${r.evento}`,
      cantidad: parseInt(r.cantidad)
    }));
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener distribución de eventos' });
  }
});

// 3. Ranking de Hospitales por Salidas (MEJORADO - incluye empleados, horas reales y métricas)
// GET /api/dashboards/estadual/ranking-hospitales?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/ranking-hospitales', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    
    // Query para obtener hospitales con empleados y salidas
    const query = `
      SELECT 
        h.id_hospital,
        h.nombre_hospital,
        m.nombre_municipio as municipio,
        COUNT(DISTINCT u.id_user) as empleados,
        SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) as salidas,
        COUNT(r.id_registro) as total_registros
      FROM hospitals h
      JOIN municipios m ON h.id_municipio = m.id_municipio
      LEFT JOIN user_data u ON u.id_hospital = h.id_hospital AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
      LEFT JOIN registro_ubicaciones r ON u.id_user = r.id_user AND r.fecha_hora BETWEEN $2 AND $3
      WHERE m.id_estado = $1
      GROUP BY h.id_hospital, h.nombre_hospital, m.nombre_municipio
      HAVING COUNT(DISTINCT u.id_user) > 0 OR SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) > 0
      ORDER BY salidas DESC, empleados DESC
    `;
    
    const result = await pool.query(query, [id_estado, fechaInicio, fechaFin]);
    
    // Calcular horas reales para cada hospital
    const hospitalesConMetricas = [];
    
    for (const hospital of result.rows) {
      // Obtener empleados del hospital
      const empleadosQuery = `
        SELECT id_user FROM user_data 
        WHERE id_hospital = $1 AND id_hospital IS NOT NULL AND id_group IS NOT NULL
      `;
      const empleadosRes = await pool.query(empleadosQuery, [hospital.id_hospital]);
      
      // Calcular horas reales trabajadas
      const horasReales = await calcularHorasTrabajadasReales(empleadosRes.rows, fechaInicio, fechaFin);
      
      hospitalesConMetricas.push({
        ...hospital,
        empleados: parseInt(hospital.empleados) || 0,
        salidas: parseInt(hospital.salidas) || 0,
        horas_trabajadas: Math.round(horasReales * 100) / 100, // Horas reales
        total_registros: parseInt(hospital.total_registros) || 0,
        eficiencia: hospital.empleados > 0 ? parseFloat((hospital.salidas / hospital.empleados).toFixed(2)) : 0,
        actividad_total: parseInt(hospital.salidas || 0) + horasReales,
        ratio_salidas_horas: horasReales > 0 ? parseFloat((hospital.salidas / horasReales).toFixed(2)) : 0
      });
    }
    
    res.json(hospitalesConMetricas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ranking de hospitales' });
  }
});

// 4. Horas trabajadas reales por municipio
// GET /api/dashboards/estadual/horas-municipio?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/horas-municipio', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }

    const resultados = await calcularHorasTrabajadasPorMunicipio(id_estado, fechaInicio, fechaFin);
    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener horas por municipio' });
  }
});

// 5. Distribución Municipal por municipio
// GET /api/dashboards/estadual/distribucion-municipal?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/distribucion-municipal', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    // Query para hospitales por municipio
    const hospitalsQuery = `
      SELECT m.nombre_municipio as municipio, COUNT(h.id_hospital) as hospitals
      FROM hospitals h
      JOIN municipios m ON h.id_municipio = m.id_municipio
      WHERE m.id_estado = $1
      GROUP BY m.nombre_municipio
    `;
    // Query para empleados por municipio (solo los que tienen hospital y grupo asignados)
    const employeesQuery = `
      SELECT m.nombre_municipio as municipio, COUNT(u.id_user) as employees
      FROM user_data u
      JOIN municipios m ON u.id_municipio = m.id_municipio
      WHERE m.id_estado = $1 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
      GROUP BY m.nombre_municipio
    `;
    // Query para salidas de geocerca y horas trabajadas por municipio
    const registrosQuery = `
      SELECT m.nombre_municipio as municipio,
        SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) as geofenceExits,
        SUM(CASE WHEN r.tipo_registro = 1 AND r.dentro_geocerca = true THEN 1 ELSE 0 END) as hoursWorked
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      JOIN municipios m ON u.id_municipio = m.id_municipio
      WHERE m.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
      GROUP BY m.nombre_municipio
    `;
    // Ejecutar queries en paralelo
    const [hospitalsRes, employeesRes, registrosRes] = await Promise.all([
      pool.query(hospitalsQuery, [id_estado]),
      pool.query(employeesQuery, [id_estado]),
      pool.query(registrosQuery, [id_estado, fechaInicio, fechaFin])
    ]);
    // Unir resultados por municipio
    const municipios = {};
    hospitalsRes.rows.forEach(row => {
      municipios[row.municipio] = { municipio: row.municipio, hospitals: parseInt(row.hospitals) || 0 };
    });
    employeesRes.rows.forEach(row => {
      if (!municipios[row.municipio]) municipios[row.municipio] = { municipio: row.municipio };
      municipios[row.municipio].employees = parseInt(row.employees) || 0;
    });
    registrosRes.rows.forEach(row => {
      if (!municipios[row.municipio]) municipios[row.municipio] = { municipio: row.municipio };
      municipios[row.municipio].geofenceExits = parseInt(row.geofenceExits) || 0;
      municipios[row.municipio].hoursWorked = parseInt(row.hoursWorked) || 0;
    });
    // Formatear respuesta
    const result = Object.values(municipios).filter(m => m.employees && m.employees > 0);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la distribución municipal' });
  }
});

// 5.1. Distribución Municipal OPTIMIZADA (para PDF y análisis avanzados)
// GET /api/dashboards/estatal/distribucion-municipal-completa?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/distribucion-municipal-completa', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    
    // Query optimizada que obtiene todos los datos en una sola consulta
    const query = `
      SELECT 
        m.nombre_municipio as municipio,
        COUNT(DISTINCT h.id_hospital) as hospitals,
        COUNT(DISTINCT u.id_user) as employees,
        SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) as geofenceExits,
        SUM(CASE WHEN r.tipo_registro = 1 AND r.dentro_geocerca = true THEN 1 ELSE 0 END) as hoursWorked,
        COUNT(r.id_registro) as totalRegistros,
        AVG(CASE WHEN r.evento = 0 THEN 1.0 ELSE 0.0 END) as promedioSalidas,
        AVG(CASE WHEN r.tipo_registro = 1 AND r.dentro_geocerca = true THEN 1.0 ELSE 0.0 END) as promedioHoras
      FROM municipios m
      LEFT JOIN hospitals h ON h.id_municipio = m.id_municipio
      LEFT JOIN user_data u ON u.id_municipio = m.id_municipio AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
      LEFT JOIN registro_ubicaciones r ON u.id_user = r.id_user AND r.fecha_hora BETWEEN $2 AND $3
      WHERE m.id_estado = $1
      GROUP BY m.id_municipio, m.nombre_municipio
      HAVING COUNT(DISTINCT u.id_user) > 0 OR SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) > 0 OR SUM(CASE WHEN r.tipo_registro = 1 AND r.dentro_geocerca = true THEN 1 ELSE 0 END) > 0
      ORDER BY (SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) + SUM(CASE WHEN r.tipo_registro = 1 AND r.dentro_geocerca = true THEN 1 ELSE 0 END)) DESC
    `;
    
    const result = await pool.query(query, [id_estado, fechaInicio, fechaFin]);
    
    // Procesar resultados para agregar métricas calculadas
    const municipiosConMetricas = result.rows.map(municipio => {
      const hospitals = parseInt(municipio.hospitals) || 0;
      const employees = parseInt(municipio.employees) || 0;
      const geofenceExits = parseInt(municipio.geofenceexits) || 0;
      const hoursWorked = parseInt(municipio.hoursworked) || 0;
      const totalRegistros = parseInt(municipio.totalregistros) || 0;
      
      return {
        municipio: municipio.municipio,
        hospitals,
        employees,
        geofenceExits,
        hoursWorked,
        totalRegistros,
        // Métricas calculadas
        actividadTotal: geofenceExits + hoursWorked,
        eficiencia: employees > 0 ? parseFloat((hoursWorked / employees).toFixed(2)) : 0,
        indiceActividad: hospitals > 0 ? parseFloat((geofenceExits / hospitals).toFixed(2)) : 0,
        ratioSalidasHoras: hoursWorked > 0 ? parseFloat((geofenceExits / hoursWorked).toFixed(2)) : 0,
        densidadHospitalaria: hospitals,
        productividadEmpleado: employees > 0 ? parseFloat(((geofenceExits + hoursWorked) / employees).toFixed(2)) : 0
      };
    });
    
    res.json(municipiosConMetricas);
  } catch (error) {
    console.error('Error en distribucion-municipal-completa:', error);
    res.status(500).json({ error: 'Error al obtener la distribución municipal completa' });
  }
});

// 6. Detalle de un municipio específico para tooltip del mapa
// GET /api/dashboards/estatal/municipio-detalle?id_municipio=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/municipio-detalle', async (req, res) => {
  try {
    const { id_municipio, fechaInicio, fechaFin } = req.query;
    if (!id_municipio || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_municipio, fechaInicio y fechaFin son obligatorios' });
    }

    // Query para hospitales en el municipio
    const hospitalsQuery = `
      SELECT COUNT(h.id_hospital) as hospitals
      FROM hospitals h
      WHERE h.id_municipio = $1
    `;

    // Query para empleados en el municipio (solo los que tienen hospital y grupo asignados)
    const employeesQuery = `
      SELECT u.id_user
      FROM user_data u
      WHERE u.id_municipio = $1 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
    `;

    // Query para salidas de geocerca en el período (solo empleados con hospital y grupo asignados)
    const geofenceExitsQuery = `
      SELECT COUNT(*) as geofenceExits
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_municipio = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento = 0 AND u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
    `;

    // Query para obtener el nombre del municipio
    const municipioQuery = `
      SELECT m.nombre_municipio, e.nombre_estado
      FROM municipios m
      JOIN estados e ON m.id_estado = e.id_estado
      WHERE m.id_municipio = $1
    `;

    // Ejecutar queries básicas en paralelo
    const [hospitalsRes, employeesRes, geofenceRes, municipioRes] = await Promise.all([
      pool.query(hospitalsQuery, [id_municipio]),
      pool.query(employeesQuery, [id_municipio]),
      pool.query(geofenceExitsQuery, [id_municipio, fechaInicio, fechaFin]),
      pool.query(municipioQuery, [id_municipio])
    ]);

    // Verificar que el municipio existe
    if (municipioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Municipio no encontrado' });
    }

    // Calcular horas trabajadas reales usando la función auxiliar
    const empleados = employeesRes.rows;
    const horasReales = await calcularHorasTrabajadasReales(empleados, fechaInicio, fechaFin);

    const result = {
      id_municipio: parseInt(id_municipio),
      municipio: municipioRes.rows[0].nombre_municipio,
      estado: municipioRes.rows[0].nombre_estado,
      hospitals: parseInt(hospitalsRes.rows[0]?.hospitals) || 0,
      employees: empleados.length || 0,
      geofenceExits: parseInt(geofenceRes.rows[0]?.geofenceexits) || 0,
      hoursWorked: Math.round(horasReales * 100) / 100 // Horas reales con 2 decimales
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalle del municipio' });
  }
});

// Endpoint para obtener municipios por estado
// GET /api/dashboards/municipios-by-estado/:id_estado
router.get("/municipios-by-estado/:id_estado", async (req, res) => {
  const { id_estado } = req.params;

  try {
    // 1. Buscar Municipios
    const municipios = await pool.query(
      `SELECT
         m.id_municipio, 
         m.nombre_municipio 
       FROM municipios m
       JOIN estados e ON m.id_estado = e.id_estado
       WHERE m.id_estado = $1
       ORDER BY m.nombre_municipio ASC`,
      [id_estado]
    );

    res.json(municipios.rows);
  } catch (error) {
    console.error("❌ Error al obtener los municipios por estado:", error);
    res.status(500).json({ error: "Error al obtener municipios" });
  }
});

// --- ENDPOINTS NACIONALES PARA DASHBOARD ---

// 1. Endpoint principal para estadísticas por estado
// GET /api/dashboards/nacional/estadisticas-estados?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/nacional/estadisticas-estados', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'fechaInicio y fechaFin son obligatorios' });
    }

    // Query para obtener estadísticas por estado
    const query = `
      SELECT 
        e.id_estado as state,
        e.nombre_estado as stateName,
        COUNT(DISTINCT h.id_hospital) as hospitals,
        COUNT(DISTINCT CASE WHEN u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL THEN u.id_user END) as employees,
        COALESCE(sg.geofenceExits, 0) as geofenceExits,
        COALESCE(ht.hoursWorked, 0) as hoursWorked
      FROM estados e
      LEFT JOIN municipios m ON e.id_estado = m.id_estado
      LEFT JOIN hospitals h ON m.id_municipio = h.id_municipio
      LEFT JOIN user_data u ON h.id_hospital = u.id_hospital
      LEFT JOIN (
        SELECT 
          e2.id_estado,
          COUNT(*) as geofenceExits
        FROM registro_ubicaciones r
        JOIN user_data u2 ON r.id_user = u2.id_user
        JOIN estados e2 ON u2.id_estado = e2.id_estado
        WHERE r.fecha_hora BETWEEN $1 AND $2 
          AND r.evento = 0 
          AND u2.id_hospital IS NOT NULL 
          AND u2.id_group IS NOT NULL
        GROUP BY e2.id_estado
      ) sg ON e.id_estado = sg.id_estado
      LEFT JOIN (
        SELECT 
          e3.id_estado,
          COUNT(*) as hoursWorked
        FROM registro_ubicaciones r2
        JOIN user_data u3 ON r2.id_user = u3.id_user
        JOIN estados e3 ON u3.id_estado = e3.id_estado
        WHERE r2.fecha_hora BETWEEN $1 AND $2 
          AND r2.tipo_registro = 1 
          AND r2.dentro_geocerca = true
          AND u3.id_hospital IS NOT NULL 
          AND u3.id_group IS NOT NULL
        GROUP BY e3.id_estado
      ) ht ON e.id_estado = ht.id_estado
      GROUP BY e.id_estado, e.nombre_estado, sg.geofenceExits, ht.hoursWorked
      ORDER BY e.nombre_estado
    `;

    const result = await pool.query(query, [fechaInicio, fechaFin]);
    
    // Mapear los códigos de estado a formato de mapa (MX + código)
    const stateCodeMapping = getStateCodeMapping();

    const data = result.rows.map(row => ({
      state: stateCodeMapping[row.state] || `MX${row.state}`,
      stateName: row.statename,
      hospitals: parseInt(row.hospitals) || 0,
      employees: parseInt(row.employees) || 0,
      geofenceExits: parseInt(row.geofenceexits) || 0,
      hoursWorked: parseInt(row.hoursworked) || 0
    }));

    res.json({
      success: true,
      data,
      period: {
        startDate: fechaInicio,
        endDate: fechaFin
      }
    });

  } catch (error) {
    console.error('Error en endpoint nacional/estadisticas-estados:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas por estado' });
  }
});

// 2. Endpoint para totales nacionales
// GET /api/dashboards/nacional/totales?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/nacional/totales', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'fechaInicio y fechaFin son obligatorios' });
    }

    // Query para total de hospitales únicos
    const hospitalesQuery = `
      SELECT COUNT(DISTINCT h.id_hospital) as totalHospitals
      FROM hospitals h
    `;

    // Query para total de empleados únicos (solo los que tienen hospital y grupo asignados)
    const empleadosQuery = `
      SELECT COUNT(DISTINCT u.id_user) as totalEmployees
      FROM user_data u
      WHERE u.id_hospital IS NOT NULL AND u.id_group IS NOT NULL
    `;

    // Query para total de salidas de geocerca en el período
    const salidasGeocercaQuery = `
      SELECT COUNT(*) as totalGeofenceExits
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE r.fecha_hora BETWEEN $1 AND $2 
        AND r.evento = 0 
        AND u.id_hospital IS NOT NULL 
        AND u.id_group IS NOT NULL
    `;

    // Query para total de horas trabajadas en el período
    const horasTrabajadasQuery = `
      SELECT COUNT(*) as totalHoursWorked
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE r.fecha_hora BETWEEN $1 AND $2 
        AND r.tipo_registro = 1 
        AND r.dentro_geocerca = true
        AND u.id_hospital IS NOT NULL 
        AND u.id_group IS NOT NULL
    `;

    // Ejecutar todas las queries en paralelo
    const [hospitalesRes, empleadosRes, salidasRes, horasRes] = await Promise.all([
      pool.query(hospitalesQuery),
      pool.query(empleadosQuery),
      pool.query(salidasGeocercaQuery, [fechaInicio, fechaFin]),
      pool.query(horasTrabajadasQuery, [fechaInicio, fechaFin])
    ]);

    const totales = {
      totalHospitals: parseInt(hospitalesRes.rows[0]?.totalhospitals) || 0,
      totalEmployees: parseInt(empleadosRes.rows[0]?.totalemployees) || 0,
      totalGeofenceExits: parseInt(salidasRes.rows[0]?.totalgeofenceexits) || 0,
      totalHoursWorked: parseInt(horasRes.rows[0]?.totalhoursworked) || 0
    };

    res.json({
      success: true,
      data: totales,
      period: {
        startDate: fechaInicio,
        endDate: fechaFin
      }
    });

  } catch (error) {
    console.error('Error en endpoint nacional/totales:', error);
    res.status(500).json({ error: 'Error al obtener totales nacionales' });
  }
});

// 3. Endpoint para ranking de estados (Top 10)
// GET /api/dashboards/nacional/ranking-estados?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&metric=geofenceExits|hoursWorked&limit=10
router.get('/nacional/ranking-estados', async (req, res) => {
  try {
    const { fechaInicio, fechaFin, metric = 'geofenceExits', limit = 10 } = req.query;
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'fechaInicio y fechaFin son obligatorios' });
    }

    let query;
    if (metric === 'geofenceExits') {
      query = `
        SELECT 
          e.id_estado as state,
          e.nombre_estado as stateName,
          COUNT(*) as value
        FROM registro_ubicaciones r
        JOIN user_data u ON r.id_user = u.id_user
        JOIN estados e ON u.id_estado = e.id_estado
        WHERE r.fecha_hora BETWEEN $1 AND $2 
          AND r.evento = 0 
          AND u.id_hospital IS NOT NULL 
          AND u.id_group IS NOT NULL
        GROUP BY e.id_estado, e.nombre_estado
        ORDER BY value DESC
        LIMIT $3
      `;
    } else if (metric === 'hoursWorked') {
      query = `
        SELECT 
          e.id_estado as state,
          e.nombre_estado as stateName,
          COUNT(*) as value
        FROM registro_ubicaciones r
        JOIN user_data u ON r.id_user = u.id_user
        JOIN estados e ON u.id_estado = e.id_estado
        WHERE r.fecha_hora BETWEEN $1 AND $2 
          AND r.tipo_registro = 1 
          AND r.dentro_geocerca = true
          AND u.id_hospital IS NOT NULL 
          AND u.id_group IS NOT NULL
        GROUP BY e.id_estado, e.nombre_estado
        ORDER BY value DESC
        LIMIT $3
      `;
    } else {
      return res.status(400).json({ error: 'metric debe ser geofenceExits o hoursWorked' });
    }

    const result = await pool.query(query, [fechaInicio, fechaFin, limit]);

    // Mapear los códigos de estado
    const stateCodeMapping = getStateCodeMapping();

    const data = result.rows.map((row, index) => ({
      state: stateCodeMapping[row.state] || `MX${row.state}`,
      stateName: row.statename,
      value: parseInt(row.value) || 0,
      rank: index + 1
    }));

    res.json({
      success: true,
      data: {
        [metric]: data
      },
      period: {
        startDate: fechaInicio,
        endDate: fechaFin
      }
    });

  } catch (error) {
    console.error('Error en endpoint nacional/ranking-estados:', error);
    res.status(500).json({ error: 'Error al obtener ranking de estados' });
  }
});

export default router;
