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

export default router;
