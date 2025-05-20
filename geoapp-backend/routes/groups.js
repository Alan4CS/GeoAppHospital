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

export default router;
