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
             (r.fecha_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City') AS fecha_hora,
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

export default router;
