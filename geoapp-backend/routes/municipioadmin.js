import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

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
       WHERE m.id_estado = $1`,
      [id_estado]
    );

    res.json(municipios.rows);
  } catch (error) {
    console.error("❌ Error al obtener los municipios por estado:", error);
    res.status(500).json({ error: "Error al obtener municipios" });
  }
});

router.get("/municipios-by-estado-hospital/:id_estado", async (req, res) => {
  const { id_estado } = req.params;

  try {
    // 1. Buscar Municipios
    const municipios = await pool.query(
      `SELECT DISTINCT
         m.id_municipio,
         m.nombre_municipio
       FROM municipios m
       JOIN hospitals h ON m.id_municipio = h.id_municipio
       WHERE m.id_estado = $1`,
      [id_estado]
    );

    res.json(municipios.rows);
  } catch (error) {
    console.error("❌ Error al obtener los municipios por estado:", error);
    res.status(500).json({ error: "Error al obtener municipios" });
  }
});

router.post("/create-municipioadmin", async (req, res) => {
  const {
    nombre,
    ap_paterno,
    ap_materno,
    CURP,
    user,
    pass,
    role_name,
    id_estado,
    id_municipio,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 2. Insertar en user_data
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user, id_estado, id_municipio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP, id_estado, id_municipio]
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
       VALUES ($1, $2, NULL)`,
      [newUserId, roleId]
    );

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Administrador de municipio creado con éxito" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear municipioadmin:", error);
    res
      .status(500)
      .json({ error: "Error al crear el administrador de municipio" });
  } finally {
    client.release();
  }
});

// Obtener hospitales del municipio del municipioadmin
router.get("/hospitals-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el municipio del admin
    const userResult = await pool.query(
      `SELECT id_municipio FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const id_municipio = userResult.rows[0].id_municipio;

    // 2. Obtener hospitales de ese municipio
    const hospitalsResult = await pool.query(
      `SELECT h.*, e.nombre_estado, m.nombre_municipio
       FROM hospitals h
       LEFT JOIN estados e ON h.estado_id = e.id_estado
       LEFT JOIN municipios m ON h.id_municipio = m.id_municipio
       WHERE h.id_municipio = $1`,
      [id_municipio]
    );
    res.json(hospitalsResult.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitales por municipioadmin:", error);
    res.status(500).json({ error: "Error al obtener hospitales" });
  }
});

// Endpoint de estadísticas para municipioadmin
router.get("/stats-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el municipio del admin
    const userResult = await pool.query(
      `SELECT id_municipio FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const id_municipio = userResult.rows[0].id_municipio;

    // 2. Total hospitales en el municipio
    const hospitalesResult = await pool.query(
      `SELECT COUNT(*) AS total_hospitales FROM hospitals WHERE id_municipio = $1`,
      [id_municipio]
    );
    const total_hospitales = parseInt(hospitalesResult.rows[0].total_hospitales, 10);

    // 3. Total grupos en hospitales del municipio
    const gruposResult = await pool.query(
      `SELECT COUNT(*) AS total_grupos FROM groups g
       JOIN hospitals h ON g.id_hospital = h.id_hospital
       WHERE h.id_municipio = $1`,
      [id_municipio]
    );
    const total_grupos = parseInt(gruposResult.rows[0].total_grupos, 10);

    // 4. Total empleados en hospitales del municipio
    const empleadosResult = await pool.query(
      `SELECT COUNT(*) AS total_empleados FROM user_data u
       JOIN user_roles ur ON u.id_user = ur.id_user
       JOIN roles r ON ur.id_role = r.id_role
       WHERE r.role_name = 'empleado' AND u.id_municipio = $1`,
      [id_municipio]
    );
    const total_empleados = parseInt(empleadosResult.rows[0].total_empleados, 10);

    res.json({ total_hospitales, total_grupos, total_empleados });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas de municipioadmin:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// Obtener empleados del municipio del municipioadmin
router.get("/empleados-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el municipio del admin
    const userResult = await pool.query(
      `SELECT id_municipio FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (userResult.rowCount === 0 || !userResult.rows[0].id_municipio) {
      return res.status(404).json({ error: "Usuario no encontrado o sin municipio asignado" });
    }
    const id_municipio = userResult.rows[0].id_municipio;
    // 2. Buscar empleados de hospitales de ese municipio
    const empleadosResult = await pool.query(
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
      WHERE r.role_name = 'empleado' AND u.id_municipio = $1
      ORDER BY u.id_user ASC`,
      [id_municipio]
    );
    // 3. Traer el municipio si hay empleados
    let municipiosResult = [];
    if (empleadosResult.rows.length > 0) {
      municipiosResult = [
        {
          id_municipio: id_municipio,
          nombre_municipio: empleadosResult.rows[0].municipio
        }
      ];
    }
    res.json({
      empleados: empleadosResult.rows,
      municipios: municipiosResult
    });
  } catch (error) {
    console.error("❌ Error al obtener empleados por municipioadmin:", error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// Obtener grupos del municipio del municipioadmin
router.get("/grupos-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el municipio del admin
    const userResult = await pool.query(
      `SELECT id_municipio FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const id_municipio = userResult.rows[0].id_municipio;

    // 2. Obtener grupos de hospitales de ese municipio con toda la info relevante
    const gruposResult = await pool.query(
      `SELECT g.id_group, g.nombre_grupo, g.descripcion_group, h.nombre_hospital, e.nombre_estado, m.id_municipio, m.nombre_municipio
       FROM groups g
       JOIN hospitals h ON g.id_hospital = h.id_hospital
       JOIN estados e ON h.estado_id = e.id_estado
       JOIN municipios m ON h.id_municipio = m.id_municipio
       WHERE h.id_municipio = $1`,
      [id_municipio]
    );
    res.json(gruposResult.rows);
  } catch (error) {
    console.error("❌ Error al obtener grupos por municipioadmin:", error);
    res.status(500).json({ error: "Error al obtener grupos" });
  }
});

export default router;
