import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

// GET /api/superadmin/hospitals
router.get("/hospitals", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        h.id_hospital,
        h.nombre_hospital,
        h.direccion_hospital,
        h.coordenadas_hospital,
        h.latitud_hospital,
        h.longitud_hospital,
        h.radio_geo,
        h.tipo_hospital,
        e.nombre_estado AS estado
      FROM hospitals h
      LEFT JOIN estados e ON h.estado_id = e.id_estado
      ORDER BY h.id_hospital
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener hospitales del superadmin:", error);
    res.status(500).json({ error: "Error al consultar hospitales" });
  }
});

router.get("/estados", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        *
      FROM estados
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estados del superadmin:", error);
    res.status(500).json({ error: "Error al consultar hospitales" });
  }
});

router.post("/create-admin", async (req, res) => {
  const { nombre, ap_paterno, ap_materno, RFC, user, pass, role_name } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insertar en user_data
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, "RFC")
       VALUES ($1, $2, $3, $4)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, RFC]
    );
    const newUserId = userDataResult.rows[0].id_user;

    // 2. Insertar en user_credentials
    await client.query(
      `INSERT INTO user_credentials (id_user, "user", pass)
       VALUES ($1, $2, $3)`,
      [newUserId, user, pass]
    );

    // 3. Buscar id_role desde el nombre
    const roleResult = await client.query(
      `SELECT id_role FROM roles WHERE role_name = $1`,
      [role_name]
    );
    if (roleResult.rowCount === 0) throw new Error("Rol no encontrado");

    const roleId = roleResult.rows[0].id_role;

    // 4. Insertar en user_roles con hospital NULL
    await client.query(
      `INSERT INTO user_roles (id_user, id_role, id_hospital)
       VALUES ($1, $2, NULL)`,
      [newUserId, roleId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Administrador creado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear administrador:", error);
    res.status(500).json({ error: "Error al crear el administrador" });
  } finally {
    client.release();
  }
});

// GET /api/superadmin/estadoadmins
router.get("/estadoadmins", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u."RFC",
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      WHERE r.role_name = 'estadoadmin'
      ORDER BY u.id_user
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener estadoadmins:", error);
    res.status(500).json({ error: "Error al obtener administradores de estado" });
  }
});


export default router;
