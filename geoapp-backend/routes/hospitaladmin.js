import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/hospitals-by-municipio", async (req, res) => {
  const { id_estado, id_municipio } = req.query;

  try {
    const result = await pool.query(
      `SELECT id_hospital, nombre_hospital 
       FROM hospitals 
       WHERE estado_id = $1 AND id_municipio = $2`,
      [id_estado, id_municipio]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitales por municipio:", error);
    res.status(500).json({ error: "Error al consultar hospitales" });
  }
});

router.post("/create-hospitaladmin", async (req, res) => {
  const { nombre, ap_paterno, ap_materno, CURP, user, pass, role_name, id_estado, id_municipio, id_hospital } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 2. Insertar en user_data
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user, id_estado, id_municipio, id_hospital)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP, id_estado, id_municipio, id_hospital]
    );
    const newUserId = userDataResult.rows[0].id_user;

    // 3. Insertar en user_credentials
    await client.query(
      `INSERT INTO user_credentials (id_user, "user", pass)
       VALUES ($1, $2, $3)`,
      [newUserId, user, pass]
    );

    // 4. Obtener id_role
    const roleResult = await client.query(
      `SELECT id_role FROM roles WHERE role_name = $1`,
      [role_name]
    );
    if (roleResult.rowCount === 0) throw new Error("Rol no encontrado");

    const roleId = roleResult.rows[0].id_role;

    // 5. Insertar en user_roles con id_hospital
    await client.query(
      `INSERT INTO user_roles (id_user, id_role, id_hospital)
       VALUES ($1, $2, $3)`,
      [newUserId, roleId, id_hospital]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Administrador de hospital creado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear municipioadmin:", error);
    res.status(500).json({ error: "Error al crear el administrador de hospital" });
  } finally {
    client.release();
  }
});

// Endpoint flexible para obtener empleados por hospital, municipio o estado
// Propósito: Permite al frontend obtener empleados filtrando por hospital, municipio o estado según los parámetros recibidos.
// Si se manda id_hospital, filtra por hospital. Si no, por municipio. Si no, por estado. Si no se manda nada, devuelve todos.
router.get("/empleados-by-ubicacion", async (req, res) => {
  const { id_estado, id_municipio, id_hospital } = req.query;

  /*
    Lógica de filtrado:
    - Si se manda id_hospital, filtra por hospital
    - Si se manda id_municipio, filtra por municipio
    - Si se manda id_estado, filtra por estado
    - Si no se manda nada, devuelve todos los empleados
  */
  let where = [];
  let values = [];
  let idx = 1;

  if (id_hospital) {
    where.push(`u.id_hospital = $${idx++}`);
    values.push(id_hospital);
  } else if (id_municipio) {
    where.push(`u.id_municipio = $${idx++}`);
    values.push(id_municipio);
  } else if (id_estado) {
    where.push(`u.id_estado = $${idx++}`);
    values.push(id_estado);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        u.correo_electronico,
        u.telefono,
        e.id_estado,
        e.nombre_estado AS estado,
        m.id_municipio,
        m.nombre_municipio AS municipio,
        h.id_hospital,
        h.nombre_hospital AS hospital,
        g.nombre_grupo,
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
      LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
      LEFT JOIN groups g ON u.id_group = g.id_group
      WHERE r.role_name = 'empleado' ${whereClause ? 'AND ' + where.join(' AND ') : ''}
      ORDER BY u.id_user`
      , values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener empleados por ubicación:", error);
    res.status(500).json({ error: "Error al obtener empleados por ubicación" });
  }
});

// Obtener el hospital asignado al hospitaladmin autenticado
router.get("/hospital-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    const result = await pool.query(
      `SELECT h.*, e.nombre_estado, m.nombre_municipio
       FROM user_roles ur
       JOIN hospitals h ON ur.id_hospital = h.id_hospital
       LEFT JOIN estados e ON h.estado_id = e.id_estado
       LEFT JOIN municipios m ON h.id_municipio = m.id_municipio
       WHERE ur.id_user = $1 AND ur.id_hospital IS NOT NULL
       LIMIT 1`,
      [id_user]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No se encontró hospital asignado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener hospital asignado:", error);
    res.status(500).json({ error: "Error al consultar hospital asignado" });
  }
});

// Obtener grupos por hospital
router.get("/grupos-by-hospital/:id_hospital", async (req, res) => {
  const { id_hospital } = req.params;
  try {
    const result = await pool.query(
      `SELECT g.id_group, g.nombre_grupo
       FROM groups g
       WHERE g.id_hospital = $1`,
      [id_hospital]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener grupos por hospital:", error);
    res.status(500).json({ error: "Error al consultar grupos" });
  }
});

// Obtener datos de monitoreo del hospital (ajusta la consulta según tu modelo)
router.get("/monitoreo-by-hospital/:id_hospital", async (req, res) => {
  const { id_hospital } = req.params;
  try {
    // Ejemplo: ajusta la consulta a tu modelo real de monitoreo
    const result = await pool.query(
      `SELECT * FROM monitoreo WHERE id_hospital = $1`,
      [id_hospital]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener monitoreo por hospital:", error);
    res.status(500).json({ error: "Error al consultar monitoreo" });
  }
});

// Obtener estadísticas del hospital: total empleados y grupos
router.get("/stats-by-hospital/:id_hospital", async (req, res) => {
  const { id_hospital } = req.params;
  try {
    // Total empleados
    const empleadosResult = await pool.query(
      `SELECT COUNT(*) AS total_empleados FROM user_roles ur JOIN roles r ON ur.id_role = r.id_role WHERE ur.id_hospital = $1 AND r.role_name = 'empleado'`,
      [id_hospital]
    );
    // Total grupos
    const gruposResult = await pool.query(
      `SELECT COUNT(*) AS total_grupos FROM groups WHERE id_hospital = $1`,
      [id_hospital]
    );
    res.json({
      total_empleados: parseInt(empleadosResult.rows[0].total_empleados, 10),
      total_grupos: parseInt(gruposResult.rows[0].total_grupos, 10)
    });
  } catch (error) {
    console.error("❌ Error al obtener stats del hospital:", error);
    res.status(500).json({ error: "Error al consultar estadísticas del hospital" });
  }
});

export default router;
