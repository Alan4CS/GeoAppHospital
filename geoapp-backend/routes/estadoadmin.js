import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/hospitals-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;

  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );

    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }

    const id_estado = estadoResult.rows[0].id_estado;

    // 2. Buscar hospitales junto con el nombre del estado
    const hospitalsResult = await pool.query(
      `SELECT 
         h.*, 
         e.nombre_estado,
         h.direccion_hospital AS region
       FROM hospitals h
       JOIN estados e ON h.estado_id = e.id_estado
       WHERE h.estado_id = $1`,
      [id_estado]
    );

    res.json(hospitalsResult.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitales por usuario:", error);
    res.status(500).json({ error: "Error al obtener hospitales" });
  }
});

router.get("/hospitals-name-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;

  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );

    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }

    const id_estado = estadoResult.rows[0].id_estado;

    // 2. Buscar hospitales junto con el nombre del estado
    const hospitalsResult = await pool.query(
      `SELECT 
         h.nombre_hospital 
       FROM hospitals h
       JOIN estados e ON h.estado_id = e.id_estado
       WHERE h.estado_id = $1`,
      [id_estado]
    );

    res.json(hospitalsResult.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitales por usuario:", error);
    res.status(500).json({ error: "Error al obtener hospitales" });
  }
});

router.post("/create-hospitaladmin", async (req, res) => {
  const { nombre, ap_paterno, ap_materno, CURP, user, pass, role_name, hospital, id_estado } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Buscar el id_hospital a partir del nombre del hospital
    const hospitalResult = await client.query(
      `SELECT id_hospital FROM hospitals WHERE nombre_hospital = $1`,
      [hospital]
    );
    if (hospitalResult.rowCount === 0) {
      throw new Error("Hospital no encontrado");
    }
    const id_hospital = hospitalResult.rows[0].id_hospital;

    // 2. Insertar en user_data con id_estado proporcionado
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user, id_estado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP, id_estado]
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

    await client.query("COMMIT");
    res.status(201).json({ message: "Administrador de hospital creado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear hospitaladmin:", error);
    res.status(500).json({ error: "Error al crear el administrador de hospital" });
  } finally {
    client.release();
  }
});

// GET /api/superadmin/estadoadmins
router.get("/hospitaladmin", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        e.nombre_estado AS estado,
        h.nombre_hospital AS hospital,
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN hospitals h ON ur.id_hospital = h.id_hospital
      WHERE r.role_name = 'hospitaladmin'
      ORDER BY u.id_user
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener hospitaladmins:", error);
    res.status(500).json({ error: "Error al obtener administradores de hospital" });
  }
});

// Obtener grupos del estado del usuario (ahora también devuelve municipios del estado)
router.get("/groups-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }
    const id_estado = estadoResult.rows[0].id_estado;
    // 2. Buscar grupos de hospitales de ese estado
    const groupsResult = await pool.query(
      `SELECT 
        g.id_group, 
        g.nombre_grupo, 
        g.descripcion_group, 
        h.nombre_hospital, 
        e.nombre_estado, 
        m.id_municipio,
        m.nombre_municipio
      FROM groups g
      JOIN hospitals h ON g.id_hospital = h.id_hospital
      JOIN estados e ON h.estado_id = e.id_estado
      LEFT JOIN municipios m ON h.id_municipio = m.id_municipio
      WHERE h.estado_id = $1
      ORDER BY g.id_group ASC`,
      [id_estado]
    );
    // 3. Traer todos los municipios del estado que tengan al menos un grupo
    const municipiosConGrupoIds = new Set(groupsResult.rows.filter(g => g.id_municipio).map(g => g.id_municipio));
    let municipiosResult = [];
    if (municipiosConGrupoIds.size > 0) {
      const ids = Array.from(municipiosConGrupoIds);
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
      const query = `SELECT id_municipio, nombre_municipio FROM municipios WHERE id_municipio IN (${placeholders}) ORDER BY nombre_municipio ASC`;
      const result = await pool.query(query, ids);
      municipiosResult = result.rows;
    }
    res.json({
      grupos: groupsResult.rows,
      municipios: municipiosResult
    });
  } catch (error) {
    console.error("❌ Error al obtener grupos por usuario:", error);
    res.status(500).json({ error: "Error al obtener grupos" });
  }
});

// Obtener empleados del estado del usuario (ahora también devuelve municipios del estado)
router.get("/employees-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }
    const id_estado = estadoResult.rows[0].id_estado;
    // 2. Buscar empleados de hospitales de ese estado
    const empleadosResult = await pool.query(
      `SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        u.correo_electronico,
        u.telefono,
        e.id_estado,
        e.nombre_estado AS estado,
        m.id_municipio,
        m.nombre_municipio AS municipio,
        h.id_hospital,
        h.nombre_hospital AS hospital,
        g.nombre_grupo,
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
      LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
      LEFT JOIN groups g ON u.id_group = g.id_group
      WHERE r.role_name = 'empleado' AND u.id_estado = $1
      ORDER BY u.id_user ASC`,
      [id_estado]
    );
    // 3. Traer todos los municipios del estado que tengan al menos un empleado
    const municipiosConEmpleadoIds = new Set(empleadosResult.rows.filter(e => e.id_municipio).map(e => e.id_municipio));
    let municipiosResult = [];
    if (municipiosConEmpleadoIds.size > 0) {
      const ids = Array.from(municipiosConEmpleadoIds);
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
      const query = `SELECT id_municipio, nombre_municipio FROM municipios WHERE id_municipio IN (${placeholders}) ORDER BY nombre_municipio ASC`;
      const result = await pool.query(query, ids);
      municipiosResult = result.rows;
    }
    res.json({
      empleados: empleadosResult.rows,
      municipios: municipiosResult
    });
  } catch (error) {
    console.error("❌ Error al obtener empleados por usuario:", error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// Endpoint para obtener solo los totales de hospitales, grupos y empleados por usuario (estadoadmin)
router.get("/stats-by-user/:id_user", async (req, res) => {
  const { id_user } = req.params;
  try {
    // 1. Obtener el id_estado del usuario
    const estadoResult = await pool.query(
      `SELECT id_estado FROM user_data WHERE id_user = $1`,
      [id_user]
    );
    if (estadoResult.rowCount === 0 || !estadoResult.rows[0].id_estado) {
      return res.status(404).json({ error: "Usuario no encontrado o sin estado asignado" });
    }
    const id_estado = estadoResult.rows[0].id_estado;

    // 2. Contar hospitales
    const hospitalesResult = await pool.query(
      `SELECT COUNT(*) AS total_hospitales FROM hospitals WHERE estado_id = $1`,
      [id_estado]
    );
    const total_hospitales = Number(hospitalesResult.rows[0].total_hospitales);

    // 3. Contar grupos
    const gruposResult = await pool.query(
      `SELECT COUNT(*) AS total_grupos
       FROM groups g
       JOIN hospitals h ON g.id_hospital = h.id_hospital
       WHERE h.estado_id = $1`,
      [id_estado]
    );
    const total_grupos = Number(gruposResult.rows[0].total_grupos);

    // 4. Contar empleados
    const empleadosResult = await pool.query(
      `SELECT COUNT(*) AS total_empleados
       FROM user_data u
       JOIN user_roles ur ON u.id_user = ur.id_user
       JOIN roles r ON ur.id_role = r.id_role
       WHERE r.role_name = 'empleado' AND u.id_estado = $1`,
      [id_estado]
    );
    const total_empleados = Number(empleadosResult.rows[0].total_empleados);

    res.json({
      total_hospitales,
      total_grupos,
      total_empleados
    });
  } catch (error) {
    console.error("❌ Error al obtener stats por usuario:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;