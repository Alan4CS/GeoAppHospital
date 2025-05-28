import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * POST /api/empleados/login
 */
router.post("/empleados/login", async (req, res) => {
    const { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
    }

    try {
        const credResult = await pool.query(
            `SELECT id_user FROM user_credentials WHERE "user" = $1 AND pass = $2`,
            [user, pass]
        );

        if (credResult.rowCount === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }

        const id_user = credResult.rows[0].id_user;

        const roleResult = await pool.query(
            `SELECT r.role_name 
             FROM user_roles ur
             JOIN roles r ON ur.id_role = r.id_role
             WHERE ur.id_user = $1`,
            [id_user]
        );

        if (roleResult.rowCount === 0) {
            return res.status(404).json({ error: "Rol no asignado al usuario." });
        }

        const role_name = roleResult.rows[0].role_name;

        if (role_name.toLowerCase() !== "empleado") {
            return res.status(403).json({ error: "Acceso restringido solo a empleados." });
        }

        console.log(`✅ Usuario ${id_user} (${role_name}) logueado correctamente`);
        res.status(200).json({ id_user, role: role_name });

    } catch (error) {
        console.error("❌ Error en login de empleados:", error);
        res.status(500).json({
            error: "Error interno en autenticación.",
            details: isDevelopment ? error.message : undefined
        });
    }
});

/**
 * POST /api/ubicaciones
 */
router.post("/ubicaciones", async (req, res) => {
    const { id_user, latitud, longitud, dentro_geocerca, tipo_registro } = req.body;

    if (
        id_user == null ||
        latitud == null ||
        longitud == null ||
        dentro_geocerca == null ||
        tipo_registro == null
    ) {
        return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    try {
        const result = await pool.query(
            `UPDATE registro_ubicaciones
             SET latitud = $2,
                 longitud = $3,
                 fecha_hora = NOW(),
                 dentro_geocerca = $4,
                 tipo_registro = $5
             WHERE id_user = $1`,
            [id_user, latitud, longitud, dentro_geocerca, tipo_registro]
        );

        if (result.rowCount === 0) {
            await pool.query(
                `INSERT INTO registro_ubicaciones 
                 (id_user, latitud, longitud, fecha_hora, dentro_geocerca, tipo_registro) 
                 VALUES ($1, $2, $3, NOW(), $4, $5)`,
                [id_user, latitud, longitud, dentro_geocerca, tipo_registro]
            );
            console.log(`✅ Se insertó una nueva ubicación para el usuario ${id_user}`);
        } else {
            console.log(`✅ Se actualizó la ubicación del usuario ${id_user}`);
        }

        res.status(200).json({ mensaje: "Ubicación actualizada correctamente." });
    } catch (error) {
        console.error("❌ Error al actualizar ubicación:", error);
        res.status(500).json({
            error: "Error interno del servidor.",
            details: isDevelopment ? error.message : undefined
        });
    }
});

export default router;