import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/municipios-by-estado/:id_estado", async (req, res) => {
  const { id_estado } = req.params;

  try {

    // 1. Buscar Municipios
    const municipios = await pool.query(
      `SELECT 
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

export default router;
