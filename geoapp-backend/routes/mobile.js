import express from "express";
import { pool } from "../db/index.js";
import jwt from 'jsonwebtoken';

const router = express.Router();

const isDevelopment = process.env.NODE_ENV !== 'production';

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token no proporcionado" });
    
    jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta', (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

/**
 * POST /api/empleados/login
 */
router.post("/empleados/login", async (req, res) => {
    const { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
    }

    try {
        // 1. Verificar credenciales
        const credResult = await pool.query(
            `SELECT id_user FROM user_credentials WHERE "user" = $1 AND pass = $2`,
            [user, pass]
        );

        if (credResult.rowCount === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }

        const id_user = credResult.rows[0].id_user;

        // 2. Obtener información completa del usuario
        const userInfoResult = await pool.query(
            `SELECT 
                u.nombre,
                u.ap_paterno,
                u.ap_materno,
                e.nombre_estado,
                m.nombre_municipio,
                h.nombre_hospital,
                h.direccion_hospital,
                h.tipo_hospital,
                h.radio_geo,
                h.latitud_hospital,
                h.longitud_hospital,
                r.role_name,
                COALESCE(ru.dentro_geocerca, false) as dentro_geocerca,
                ru.latitud,
                ru.longitud,
                ru.fecha_hora as ultima_actualizacion
             FROM user_data u
             JOIN user_roles ur ON u.id_user = ur.id_user
             JOIN roles r ON ur.id_role = r.id_role
             LEFT JOIN estados e ON u.id_estado = e.id_estado
             LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
             LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
             LEFT JOIN registro_ubicaciones ru ON u.id_user = ru.id_user
             WHERE u.id_user = $1`,
            [id_user]
        );

        if (userInfoResult.rowCount === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const userInfo = userInfoResult.rows[0];

        if (userInfo.role_name.toLowerCase() !== "empleado") {
            return res.status(403).json({ error: "Acceso restringido solo a empleados." });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id_user, role: userInfo.role_name },
            process.env.JWT_SECRET || 'tu_clave_secreta',
            { expiresIn: '7d' }
        );

        // Preparar respuesta con toda la información
        const response = {
            id_user,
            nombre: `${userInfo.nombre} ${userInfo.ap_paterno} ${userInfo.ap_materno}`,
            estado: userInfo.nombre_estado,
            municipio: userInfo.nombre_municipio,
            hospital: {
                nombre: userInfo.nombre_hospital,
                direccion: userInfo.direccion_hospital,
                tipo: userInfo.tipo_hospital,
                ubicacion: {
                    latitud: userInfo.latitud_hospital,
                    longitud: userInfo.longitud_hospital
                },
                tiene_geocerca: userInfo.radio_geo !== null,
                geocerca: userInfo.radio_geo ? {
                    radio_geo: userInfo.radio_geo,
                    latitud: userInfo.latitud_hospital,
                    longitud: userInfo.longitud_hospital
                } : null
            },
            ubicacion_actual: userInfo.latitud && userInfo.longitud ? {
                latitud: userInfo.latitud,
                longitud: userInfo.longitud,
                dentro_geocerca: userInfo.dentro_geocerca,
                ultima_actualizacion: userInfo.ultima_actualizacion
            } : null,
            token
        };

        console.log(`✅ Usuario ${id_user} (${userInfo.role_name}) logueado correctamente`);
        res.status(200).json(response);

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
 * Actualiza la ubicación del usuario y verifica si está dentro de la geocerca
 * evento: 0 - salió geocerca, 1 - entró geocerca, 2 - inicio descanso, 3 - terminó descanso
 * fecha_hora: (opcional) Fecha y hora ISO 8601 cuando ocurrió el registro. Si no se proporciona, usa la hora actual del servidor.
 */
router.post("/ubicaciones", authenticateToken, async (req, res) => {
    const { latitud, longitud, tipo_registro, evento, fecha_hora } = req.body;
    const id_user = req.user.id_user;

    if (latitud == null || longitud == null || (tipo_registro !== 0 && tipo_registro !== 1)) {
        return res.status(400).json({ error: "Latitud, longitud y tipo_registro (0 o 1) son obligatorios." });
    }

    // Validar evento si se proporciona
    if (evento != null && ![0, 1, 2, 3, 4, 5].includes(evento)) {
        return res.status(400).json({ error: "El evento debe ser 0 (salió geocerca), 1 (entró geocerca), 2 (inicio descanso), 3 (terminó descanso), 4 (cambio de ubicación) o 5 (otro evento)." });
    }

    // Usar la fecha_hora del cliente si se proporciona, si no usar la actual del servidor
    let fechaHoraRegistro;
    if (fecha_hora) {
        try {
            fechaHoraRegistro = new Date(fecha_hora);
            // Validar que sea una fecha válida
            if (isNaN(fechaHoraRegistro.getTime())) {
                return res.status(400).json({ error: "El formato de fecha_hora no es válido." });
            }
        } catch (error) {
            return res.status(400).json({ error: "El formato de fecha_hora no es válido." });
        }
    } else {
        fechaHoraRegistro = new Date();
    }

    try {
        // Obtener el último registro del usuario para comparar estados
        const ultimoRegistroQuery = await pool.query(
            `SELECT dentro_geocerca, evento 
             FROM registro_ubicaciones 
             WHERE id_user = $1 
             ORDER BY fecha_hora DESC 
             LIMIT 1`,
            [id_user]
        );

        const estadoAnterior = ultimoRegistroQuery.rowCount > 0 ? 
            ultimoRegistroQuery.rows[0] : 
            { dentro_geocerca: false, evento: null };

        const hospitalQuery = await pool.query(
            `SELECT 
                h.radio_geo,
                h.latitud_hospital,
                h.longitud_hospital
             FROM user_data u
             JOIN hospitals h ON u.id_hospital = h.id_hospital
             WHERE u.id_user = $1`,
            [id_user]
        );

        let dentro_geocerca = false;

        if (hospitalQuery.rowCount > 0) {
            const hospital = hospitalQuery.rows[0];

            if (hospital.radio_geo) {
                try {
                    const geocerca = JSON.parse(hospital.radio_geo.replace(/'/g, '"'));

                    if (geocerca.type === 'Circle') {
                        const distancia = calcularDistancia(
                            latitud,
                            longitud,
                            hospital.latitud_hospital,
                            hospital.longitud_hospital
                        );
                        dentro_geocerca = distancia <= geocerca.radius;
                    } else if (geocerca.type === 'Polygon') {
                        dentro_geocerca = puntoEnPoligono(
                            [longitud, latitud],
                            geocerca.coordinates[0]
                        );
                    }                } catch (error) {
                    console.error("Error al procesar la geocerca:", error);
                }
            }
        }

        // Determinar evento automáticamente si no se proporciona
        let eventoFinal = evento;
        if (evento == null && estadoAnterior.dentro_geocerca !== dentro_geocerca) {
            // Solo determinar automáticamente eventos de entrada/salida de geocerca
            eventoFinal = dentro_geocerca ? 1 : 0; // 1 = entró, 0 = salió
        }

        // Insertar siempre un nuevo registro para mantener historial
        await pool.query(
            `INSERT INTO registro_ubicaciones 
             (id_user, latitud, longitud, fecha_hora, dentro_geocerca, tipo_registro, evento)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id_user, latitud, longitud, fechaHoraRegistro, dentro_geocerca, tipo_registro, eventoFinal]
        );
        console.log(`✅ Se insertó nueva ubicación para el usuario ${id_user} con fecha: ${fechaHoraRegistro.toISOString()}`);

        res.status(200).json({
            mensaje: "Ubicación registrada correctamente.",
            dentro_geocerca,
            tipo_registro,
            evento: eventoFinal,
            fecha_hora: fechaHoraRegistro
        });

    } catch (error) {
        console.error("❌ Error al registrar ubicación:", error);
        res.status(500).json({
            error: "Error interno del servidor.",
            details: isDevelopment ? error.message : undefined
        });
    }
});

// Función auxiliar para calcular la distancia entre dos puntos en metros
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // en metros
}

// Función auxiliar para verificar si un punto está dentro de un polígono
function puntoEnPoligono(point, polygon) {
    // Implementación del algoritmo ray-casting
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        
        const intersect = ((yi > point[1]) !== (yj > point[1]))
            && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * POST /api/empleados/cambiar-password
 * Cambia la contraseña si se verifica la identidad (nombre completo + usuario)
 */
router.post("/empleados/cambiar-password", async (req, res) => {
    const { user, nombre, ap_paterno, ap_materno, nueva_contraseña } = req.body;

    if (!user || !nombre || !ap_paterno || !ap_materno || !nueva_contraseña) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    try {
        // Verificar si existe una coincidencia exacta
        const result = await pool.query(
            `SELECT u.id_user 
             FROM user_data u
             JOIN user_credentials uc ON u.id_user = uc.id_user
             WHERE uc.user = $1 AND u.nombre = $2 AND u.ap_paterno = $3 AND u.ap_materno = $4`,
            [user, nombre, ap_paterno, ap_materno]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Datos inválidos para cambiar contraseña." });
        }

        const id_user = result.rows[0].id_user;

        // Actualizar contraseña
        await pool.query(
            `UPDATE user_credentials SET pass = $1 WHERE id_user = $2`,
            [nueva_contraseña, id_user]
        );

        // (Opcional) Invalidar sesiones si se usa almacenamiento de tokens

        console.log(`🔐 Contraseña cambiada para el usuario ${id_user}`);
        res.status(200).json({ 
            mensaje: "Contraseña actualizada correctamente. Vuelve a iniciar sesión.",
            reiniciar_sesion: true
        });

    } catch (error) {
        console.error("❌ Error al cambiar contraseña:", error);
        res.status(500).json({
            error: "Error interno del servidor.",
            details: isDevelopment ? error.message : undefined
        });
    }
});

export default router;