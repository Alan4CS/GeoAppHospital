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

export default router;
