import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

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
      LEFT JOIN user_data u ON h.id_hospital = u.id_hospital
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

    // Query para total de empleados únicos en el estado
    const empleadosQuery = `
      SELECT COUNT(DISTINCT u.id_user) as total_empleados
      FROM user_data u
      WHERE u.id_estado = $1
    `;

    // Query para total de salidas de geocerca en el período
    const salidasGeocercaQuery = `
      SELECT COUNT(*) as total_salidas_geocerca
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento = 0
    `;

    // Query para total de registros de entrada (horas trabajadas) en el período
    const horasTrabajadasQuery = `
      SELECT COUNT(*) as total_horas_trabajadas
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.tipo_registro = 1
    `;

    // Ejecutar todas las queries en paralelo
    const [hospitalesRes, empleadosRes, salidasRes, horasRes] = await Promise.all([
      pool.query(hospitalesQuery, [id_estado]),
      pool.query(empleadosQuery, [id_estado]),
      pool.query(salidasGeocercaQuery, [id_estado, fechaInicio, fechaFin]),
      pool.query(horasTrabajadasQuery, [id_estado, fechaInicio, fechaFin])
    ]);

    const metricas = {
      total_hospitales: parseInt(hospitalesRes.rows[0]?.total_hospitales) || 0,
      total_empleados: parseInt(empleadosRes.rows[0]?.total_empleados) || 0,
      total_salidas_geocerca: parseInt(salidasRes.rows[0]?.total_salidas_geocerca) || 0,
      total_horas_trabajadas: parseInt(horasRes.rows[0]?.total_horas_trabajadas) || 0
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
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento IN (0, 1)
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
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento IS NOT NULL
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

// 3. Ranking de Hospitales por Salidas
// GET /api/dashboards/estadual/ranking-hospitales?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/ranking-hospitales', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    const query = `
      SELECT 
        h.nombre_hospital,
        SUM(CASE WHEN r.tipo_registro = 0 THEN 1 ELSE 0 END) as salidas
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      JOIN hospitals h ON u.id_hospital = h.id_hospital
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3
      GROUP BY h.nombre_hospital
      ORDER BY salidas DESC
    `;
    const result = await pool.query(query, [id_estado, fechaInicio, fechaFin]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener ranking de hospitales' });
  }
});

// 4. Horas trabajadas por municipio
// GET /api/dashboards/estadual/horas-municipio?id_estado=XX&fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
router.get('/estatal/horas-municipio', async (req, res) => {
  try {
    const { id_estado, fechaInicio, fechaFin } = req.query;
    if (!id_estado || !fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'id_estado, fechaInicio y fechaFin son obligatorios' });
    }
    const query = `
      SELECT 
        m.nombre_municipio as municipio,
        COUNT(*) as horas
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      JOIN municipios m ON u.id_municipio = m.id_municipio
      WHERE u.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.tipo_registro = 1
      GROUP BY m.nombre_municipio
      ORDER BY horas DESC
    `;
    const result = await pool.query(query, [id_estado, fechaInicio, fechaFin]);
    res.json(result.rows);
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
    // Query para empleados por municipio
    const employeesQuery = `
      SELECT m.nombre_municipio as municipio, COUNT(u.id_user) as employees
      FROM user_data u
      JOIN municipios m ON u.id_municipio = m.id_municipio
      WHERE m.id_estado = $1
      GROUP BY m.nombre_municipio
    `;
    // Query para salidas de geocerca y horas trabajadas por municipio
    const registrosQuery = `
      SELECT m.nombre_municipio as municipio,
        SUM(CASE WHEN r.evento = 0 THEN 1 ELSE 0 END) as geofenceExits,
        SUM(CASE WHEN r.tipo_registro = 1 THEN 1 ELSE 0 END) as hoursWorked
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      JOIN municipios m ON u.id_municipio = m.id_municipio
      WHERE m.id_estado = $1 AND r.fecha_hora BETWEEN $2 AND $3
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

    // Query para empleados en el municipio
    const employeesQuery = `
      SELECT COUNT(u.id_user) as employees
      FROM user_data u
      WHERE u.id_municipio = $1
    `;

    // Query para salidas de geocerca en el período
    const geofenceExitsQuery = `
      SELECT COUNT(*) as geofenceExits
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_municipio = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.evento = 0
    `;

    // Query para horas trabajadas en el período
    const hoursWorkedQuery = `
      SELECT COUNT(*) as hoursWorked
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      WHERE u.id_municipio = $1 AND r.fecha_hora BETWEEN $2 AND $3 AND r.tipo_registro = 1
    `;

    // Query para obtener el nombre del municipio
    const municipioQuery = `
      SELECT m.nombre_municipio, e.nombre_estado
      FROM municipios m
      JOIN estados e ON m.id_estado = e.id_estado
      WHERE m.id_municipio = $1
    `;

    // Ejecutar todas las queries en paralelo
    const [hospitalsRes, employeesRes, geofenceRes, hoursRes, municipioRes] = await Promise.all([
      pool.query(hospitalsQuery, [id_municipio]),
      pool.query(employeesQuery, [id_municipio]),
      pool.query(geofenceExitsQuery, [id_municipio, fechaInicio, fechaFin]),
      pool.query(hoursWorkedQuery, [id_municipio, fechaInicio, fechaFin]),
      pool.query(municipioQuery, [id_municipio])
    ]);

    // Verificar que el municipio existe
    if (municipioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Municipio no encontrado' });
    }

    const result = {
      id_municipio: parseInt(id_municipio),
      municipio: municipioRes.rows[0].nombre_municipio,
      estado: municipioRes.rows[0].nombre_estado,
      hospitals: parseInt(hospitalsRes.rows[0]?.hospitals) || 0,
      employees: parseInt(employeesRes.rows[0]?.employees) || 0,
      geofenceExits: parseInt(geofenceRes.rows[0]?.geofenceexits) || 0,
      hoursWorked: parseInt(hoursRes.rows[0]?.hoursworked) || 0
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalle del municipio' });
  }
});

export default router;
