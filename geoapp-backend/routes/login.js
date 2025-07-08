import express from "express";
import { pool } from "../db/index.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware para verificar JWT en cookie
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No autenticado" });
  jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_predeterminada', (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// GET /api/auth/me
router.get("/me", authenticateToken, (req, res) => {
  // Devuelve la info básica del usuario autenticado
  res.json({ id_user: req.user.id_user, role: req.user.role });
});

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

      // Generar JWT
      const token = jwt.sign(
        { id_user, role: role_name },
        process.env.JWT_SECRET || 'clave_secreta_predeterminada',
        { expiresIn: '1d' }
      );

      // Enviar el token como cookie httpOnly
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000 // 1 hora
      });
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Error en login:", error);
      res.status(500).json({ error: "Error en autenticación" });
    }
  });

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ success: true });
});
  

export default router;
