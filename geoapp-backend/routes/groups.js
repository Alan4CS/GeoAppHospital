import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/get-groups", async (req, res) => {

  try {
    const result = await pool.query(
        `SELECT 
        g.id_group, 
        g.nombre_grupo, 
        g.descripcion_group, 
        h.nombre_hospital, 
        s.nombre_estado, 
        m.nombre_municipio
        FROM groups g
        JOIN hospitals h ON g.id_hospital = h.id_hospital
        JOIN estados s ON h.estado_id = s.id_estado
        LEFT JOIN municipios m ON h.id_municipio = m.id_municipio
        ORDER BY g.id_group ASC
        ` 
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener grupos:", error);
    res.status(500).json({ error: "Error al consultar hospitales" });
  }
});

router.post("/create-groups", async (req, res) => {
  const { nombre_grupo, id_hospital, descripcion_grupo } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 2. Insertar en user_data
    await client.query(
      `INSERT INTO groups (nombre_grupo, id_hospital, descripcion_group)
       VALUES ($1, $2, $3)`,
      [nombre_grupo, id_hospital, descripcion_grupo]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Grupo creado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear el grupo:", error);
    res.status(500).json({ error: "Error al crear el grupo para el hospital" });
  } finally {
    client.release();
  }
});

router.put("/update-groups", async (req, res) => {
  const { id_group, nombre_grupo, id_hospital, descripcion_grupo } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE groups
       SET nombre_grupo = $2,
           id_hospital = $3,
           descripcion_group = $4
       WHERE id_group = $1`,
      [id_group, nombre_grupo, id_hospital, descripcion_grupo]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Grupo actualizado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al actualizar el grupo:", error);
    res.status(500).json({ error: "Error al actualizar el grupo para el hospital" });
  } finally {
    client.release();
  }
});

router.post("/delete-groups/:id_group", async (req, res) => {
  const { id_group } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️ Eliminar relaciones en group_users
    await client.query(
      `DELETE FROM group_users WHERE id_group = $1`,
      [id_group]
    );

    // 2️ Poner en NULL los usuarios que tienen este id_group
    await client.query(
      `UPDATE user_data
       SET id_group = NULL
       WHERE id_group = $1`,
      [id_group]
    );

    // 3️ Eliminar el grupo
    await client.query(
      `DELETE FROM groups WHERE id_group = $1`,
      [id_group]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Grupo eliminado y usuarios actualizados con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al eliminar el grupo:", error);
    res.status(500).json({ error: "Error al eliminar el grupo para el hospital" });
  } finally {
    client.release();
  }
});


export default router;
