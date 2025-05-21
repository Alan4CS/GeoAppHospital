import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/grupos-by-hospital", async (req, res) => {
  const { id_hospital } = req.query;

  try {
    const result = await pool.query(
      `SELECT id_group, nombre_grupo 
       FROM groups 
       WHERE id_hospital = $1`,
      [id_hospital]
    );

    res.json(result.rows);
    console.error("Grupos regresados con exito!");
  } catch (error) {
    console.error("❌ Error al obtener grupos por hospital:", error);
    res.status(500).json({ error: "Error al consultar grupos" });
  }
});

router.post("/create-empleado", async (req, res) => {
  const { nombre, ap_paterno, ap_materno, CURP, user, pass, role_name, id_estado, id_municipio, id_hospital, id_grupo } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 2. Insertar en user_data
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user, id_estado, id_municipio, id_hospital, id_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP, id_estado, id_municipio, id_hospital, id_grupo]
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

        // 5. Insertar en user_roles con id_hospital
    await client.query(
      `INSERT INTO group_users (id_group, id_user)
       VALUES ($1, $2)`,
      [id_grupo,newUserId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Empleado creado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear empleado:", error);
    res.status(500).json({ error: "Error al crear el empleado" });
  } finally {
    client.release();
  }
});

export default router;
