import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { user, pass } = req.body;
  
    try {
      // 1. Buscar en user_credentials
      const credResult = await pool.query(
        `SELECT id_user FROM user_credentials WHERE "user" = $1 AND pass = $2`,
        [user, pass]
      );

      if (credResult.rowCount === 0) {
        
        // 🔴 Usuario o contraseña incorrectos
        return res.status(200).json({ mensaje: "Usuario no existe" });
      }
  
      const id_user = credResult.rows[0].id_user;
  
      // 2. Obtener rol del usuario
      const roleResult = await pool.query(
        `SELECT r.role_name 
         FROM user_roles ur
         JOIN roles r ON ur.id_role = r.id_role
         WHERE ur.id_user = $1`,
        [id_user]
      );
  
      if (roleResult.rowCount === 0) {
        return res.status(404).json({ error: "Rol no asignado" });
      }
  
      const role_name = roleResult.rows[0].role_name;
  
      res.json({ id_user, role: role_name });
    } catch (error) {
      console.error("❌ Error en login:", error);
      res.status(500).json({ error: "Error en autenticación" });
    }
  });
  

export default router;
