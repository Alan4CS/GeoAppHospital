import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

// Ruta para generar reporte por empleado
// POST /api/reportes/empleado
router.post('/empleado', async (req, res) => {
  try {
    const { empleadoId, fechaInicio, fechaFin } = req.body;
    // Consulta SQL para obtener datos del empleado y sus registros
    const query = `
      SELECT u.id_user, u.nombre, u.ap_paterno, u.ap_materno, u.id_group, u.id_estado, u.id_municipio, 
             g.nombre_grupo, e.nombre_estado, m.nombre_municipio, h.nombre_hospital,
             r.id_registro, r.latitud, r.longitud, r.fecha_hora, r.dentro_geocerca, r.tipo_registro, r.evento
      FROM user_data u
      LEFT JOIN registro_ubicaciones r ON u.id_user = r.id_user
      LEFT JOIN groups g ON u.id_group = g.id_group
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
      LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
      WHERE u.id_user = $1 AND r.fecha_hora BETWEEN $2 AND $3
      ORDER BY r.fecha_hora ASC
    `;
    const values = [empleadoId, fechaInicio, fechaFin];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para el empleado en ese periodo.' });
    }
    // Estructura del reporte
    const empleado = {
      id_user: result.rows[0].id_user,
      nombre: result.rows[0].nombre,
      ap_paterno: result.rows[0].ap_paterno,
      ap_materno: result.rows[0].ap_materno,
      grupo: result.rows[0].nombre_grupo,
      estado: result.rows[0].nombre_estado,
      municipio: result.rows[0].nombre_municipio,
      hospital: result.rows[0].nombre_hospital,
    };
    const actividades = result.rows.map(row => ({
      id_registro: row.id_registro,
      latitud: row.latitud,
      longitud: row.longitud,
      fecha_hora: row.fecha_hora,
      dentro_geocerca: row.dentro_geocerca,
      tipo_registro: row.tipo_registro,
      evento: row.evento
    }));
    res.json({ empleado, actividades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte por empleado' });
  }
});

export default router;
