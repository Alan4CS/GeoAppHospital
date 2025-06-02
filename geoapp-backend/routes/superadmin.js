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

router.post("/create-admin", async (req, res) => {
  const {
    nombre,
    ap_paterno,
    ap_materno,
    CURP,
    user,
    pass,
    role_name,
    estado,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Buscar el id_estado a partir del nombre del estado
    const estadoResult = await client.query(
      `SELECT id_estado FROM estados WHERE nombre_estado = $1`,
      [estado]
    );
    if (estadoResult.rowCount === 0) {
      throw new Error("Estado no encontrado");
    }
    const id_estado = estadoResult.rows[0].id_estado;

    // 2. Insertar en user_data con el id_estado
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

    // 5. Insertar en user_roles
    await client.query(
      `INSERT INTO user_roles (id_user, id_role, id_hospital)
       VALUES ($1, $2, NULL)`,
      [newUserId, roleId]
    );

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Administrador de estado creado con éxito" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear administrador de estado:", error);
    res
      .status(500)
      .json({ error: "Error al crear el administrador de estado" });
  } finally {
    client.release();
  }
});

// GET /api/superadmin/estadoadmins
router.get("/estadoadmins", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        e.nombre_estado AS estado,
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      WHERE r.role_name = 'estadoadmin'
      ORDER BY u.id_user
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener estadoadmins:", error);
    res
      .status(500)
      .json({ error: "Error al obtener administradores de estado" });
  }
});

// GET /api/superadmin/estadoadmins
router.get("/totaladmins", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        e.id_estado,
        e.nombre_estado AS estado,
        m.id_municipio,
        m.nombre_municipio AS municipio,
        h.id_hospital,
        h.nombre_hospital AS hospital,
        r.role_name
      FROM user_data u
      JOIN user_roles ur ON u.id_user = ur.id_user
      JOIN roles r ON ur.id_role = r.id_role
      LEFT JOIN estados e ON u.id_estado = e.id_estado
      LEFT JOIN municipios m ON u.id_municipio = m.id_municipio
      LEFT JOIN hospitals h ON u.id_hospital = h.id_hospital
      ORDER BY u.id_user
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener todos los admins:", error);
    res.status(500).json({ error: "Error al obtener administradores" });
  }
});

router.put("/update-admins", async (req, res) => {
  const {
    id_user,
    nombre,
    ap_paterno,
    ap_materno,
    curp_user,
    id_estado,
    id_municipio,
    id_hospital,
    id_group,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE user_data
       SET nombre = $2,
           ap_paterno = $3,
           ap_materno = $4,
           curp_user = $5,
           id_estado = $6,
           id_municipio = $7,
           id_hospital = $8,
           id_group = $9
       WHERE id_user = $1`,
      [
        id_user,
        nombre,
        ap_paterno,
        ap_materno,
        curp_user,
        id_estado,
        id_municipio,
        id_hospital,
        id_group,
      ]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Admin actualizado con éxito" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al actualizar el admin:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar el admin para el hospital" });
  } finally {
    client.release();
  }
});

router.post("/delete-admin/:id_user", async (req, res) => {
  const { id_user } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Eliminar en user_credentials
    await client.query(`DELETE FROM user_credentials WHERE id_user = $1`, [
      id_user,
    ]);

    // Eliminar en user_roles
    await client.query(`DELETE FROM user_roles WHERE id_user = $1`, [id_user]);

    //  Finalmente eliminar en user_data
    await client.query(`DELETE FROM user_data WHERE id_user = $1`, [id_user]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Admin eliminado con éxito" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al admin el empleado:", error);
    res.status(500).json({ error: "Error al eliminar el admin " });
  } finally {
    client.release();
  }
});

router.post("/create-superadmin", async (req, res) => {
  const {
    nombre,
    ap_paterno,
    ap_materno,
    CURP,
    user,
    pass,
    role_name,
    id_user_creador,
  } = req.body;

  // Validar que solo el superadmin principal pueda crear otros superadmins
  if (id_user_creador !== 1) {
    return res
      .status(403)
      .json({ error: "No autorizado para crear superadministradores" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insertar en user_data sin id_estado
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user)
       VALUES ($1, $2, $3, $4)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP]
    );
    const newUserId = userDataResult.rows[0].id_user;

    // 2. Insertar en user_credentials
    await client.query(
      `INSERT INTO user_credentials (id_user, "user", pass)
       VALUES ($1, $2, $3)`,
      [newUserId, user, pass]
    );

    // 3. Obtener id_role para superadmin
    const roleResult = await client.query(
      `SELECT id_role FROM roles WHERE role_name = $1`,
      [role_name]
    );
    if (roleResult.rowCount === 0) throw new Error("Rol no encontrado");

    const roleId = roleResult.rows[0].id_role;

    // 4. Insertar en user_roles
    await client.query(
      `INSERT INTO user_roles (id_user, id_role)
       VALUES ($1, $2)`,
      [newUserId, roleId]
    );

    // 5. Insertar en superadmin_hospital con valores null
    await client.query(
      `INSERT INTO superadmin_hospital (id_user, id_estado, id_municipio, id_hospital)
       VALUES ($1, NULL, NULL, NULL)`,
      [newUserId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Super Administrador creado con éxito" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear super administrador:", error);
    res.status(500).json({ error: "Error al crear el super administrador" });
  } finally {
    client.release();
  }
});

router.put("/superadmin-hospital", async (req, res) => {
  const { id_user, id_hospital, id_estado, id_municipio } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updateResult = await client.query(
      `UPDATE superadmin_hospital
       SET id_hospital = $1,
           id_estado = $2,
           id_municipio = $3
       WHERE id_user = $4`,
      [
        id_hospital || null,
        id_estado || null,
        id_municipio || null,
        id_user,
      ]
    );

    if (updateResult.rowCount === 0) {
      throw new Error("Registro no encontrado para actualizar");
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Información actualizada exitosamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al actualizar superadmin_hospital:", error);
    res.status(500).json({ error: "Error al actualizar información" });
  } finally {
    client.release();
  }
});

router.get("/superadmin-hospital-work", async (req, res) => {
  
  try {
    
    const result = await pool.query(`
      SELECT
          sh.id_user,
          u.nombre,
          u.ap_paterno,
          u.ap_materno,
          sh.id_estado,
          e.nombre_estado,
          sh.id_municipio,
          m.nombre_municipio,
          sh.id_hospital,
          h.nombre_hospital
        FROM superadmin_hospital sh
        JOIN user_data u ON sh.id_user = u.id_user
        LEFT JOIN estados e ON sh.id_estado = e.id_estado
        LEFT JOIN municipios m ON sh.id_municipio = m.id_municipio
        LEFT JOIN hospitals h ON sh.id_hospital = h.id_hospital
       `
    );
    res.json(result.rows);
  } catch (error) {
      console.error("Error al obtener los superadmin_hospitals:", error);
      res.status(500).json({ error: "Error al consultar los superadmin_hospitals" });
    }
});

router.get("/superadmin-hospital-ubi/:id_user", async (req, res) => {

  const { id_user } = req.params;
  
  try {
    
    const result = await pool.query(`
      SELECT
          sh.id_user,
          sh.id_estado,
          e.nombre_estado,
          sh.id_municipio,
          m.nombre_municipio,
          sh.id_hospital,
          h.nombre_hospital
        FROM superadmin_hospital sh
        LEFT JOIN estados e ON sh.id_estado = e.id_estado
        LEFT JOIN municipios m ON sh.id_municipio = m.id_municipio
        LEFT JOIN hospitals h ON sh.id_hospital = h.id_hospital
        WHERE sh.id_user = $1
       `,[id_user]
    );
    res.json(result.rows);
  } catch (error) {
      console.error("Error al obtener estado,municipio,hospital de los superadmin_hospitals:", error);
      res.status(500).json({ error: "Error al obtener estado,municipio,hospital los superadmin_hospitals" });
    }
});

export default router;
