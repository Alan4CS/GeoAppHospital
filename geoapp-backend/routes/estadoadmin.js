import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/hospitals-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;

  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );

    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }

    const id_estado = estadoResult.rows[0].id_estado;

    // 2. Buscar hospitales junto con el nombre del estado
    const hospitalsResult = await pool.query(
      `SELECT 
         h.*, 
         e.nombre_estado 
       FROM hospitals h
       JOIN estados e ON h.estado_id = e.id_estado
       WHERE h.estado_id = $1`,
      [id_estado]
    );

    res.json(hospitalsResult.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitales por usuario:", error);
    res.status(500).json({ error: "Error al obtener hospitales" });
  }
});

router.get("/hospitals-name-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;

  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );

    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }

    const id_estado = estadoResult.rows[0].id_estado;

    // 2. Buscar hospitales junto con el nombre del estado
    const hospitalsResult = await pool.query(
      `SELECT 
         h.nombre_hospital 
       FROM hospitals h
       JOIN estados e ON h.estado_id = e.id_estado
       WHERE h.estado_id = $1`,
      [id_estado]
    );

    res.json(hospitalsResult.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitales por usuario:", error);
    res.status(500).json({ error: "Error al obtener hospitales" });
  }
});

router.post("/create-hospitaladmin", async (req, res) => {
  const { nombre, ap_paterno, ap_materno, CURP, user, pass, role_name, hospital, id_estado } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Buscar el id_hospital a partir del nombre del hospital
    const hospitalResult = await client.query(
      `SELECT id_hospital FROM hospitals WHERE nombre_hospital = $1`,
      [hospital]
    );
    if (hospitalResult.rowCount === 0) {
      throw new Error("Hospital no encontrado");
    }
    const id_hospital = hospitalResult.rows[0].id_hospital;

    // 2. Insertar en user_data con id_estado proporcionado
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user, id_estado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP, id_estado]
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
    console.error("❌ Error al crear hospitaladmin:", error);
    res.status(500).json({ error: "Error al crear el administrador de hospital" });
  } finally {
    client.release();
  }
});

// GET /api/superadmin/estadoadmins
router.get("/hospitaladmin", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        e.nombre_estado AS estado,
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      WHERE r.role_name = 'hospitaladmin'
      ORDER BY u.id_user
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener estadoadmins:", error);
    res.status(500).json({ error: "Error al obtener administradores de estado" });
  }
});



export default router;