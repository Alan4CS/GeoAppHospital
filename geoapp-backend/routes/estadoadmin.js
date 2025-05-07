import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

// GET /api/superadmin/hospitals-by-user/:id_user
router.get("/hospitals-by-user/:id_user", async (req, res) => {
    const { id_user } = req.params;
  
    try {
      // 1. Buscar el id_estado del usuario
      const estadoResult = await pool.query(
        `SELECT id_estado FROM user_data WHERE id_user = $1`,
        [id_user]
      );
  
      if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
        return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
      }
  
      const id_estado = estadoResult.rows[0].id_estado;
  
      // 2. Buscar hospitales con ese estado_id
      const hospitalsResult = await pool.query(
        `SELECT * FROM hospitals WHERE estado_id = $1`,
        [id_estado]
      );
  
      res.json(hospitalsResult.rows);
    } catch (error) {
      console.error("❌ Error al obtener hospitales por usuario:", error);
      res.status(500).json({ error: "Error al obtener hospitales" });
    }
  });

  export default router;