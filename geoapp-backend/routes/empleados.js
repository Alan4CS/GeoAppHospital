import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/grupos-by-hospital", async (req, res) => {
  const { id_hospital } = req.query;

  try {
    const result = await pool.query(
      `SELECT id_group, nombre_grupo 
       FROM groups 
       WHERE id_hospital = $1`,
      [id_hospital]
    );

    res.json(result.rows);
    console.error("Grupos regresados con exito!");
  } catch (error) {
    console.error("❌ Error al obtener grupos por hospital:", error);
    res.status(500).json({ error: "Error al consultar grupos" });
  }
});

router.post("/create-empleado", async (req, res) => {
  const { nombre, ap_paterno, ap_materno, CURP, user, pass, role_name, id_estado, id_municipio, id_hospital, id_grupo } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 2. Insertar en user_data
    const userDataResult = await client.query(
      `INSERT INTO user_data (nombre, ap_paterno, ap_materno, curp_user, id_estado, id_municipio, id_hospital, id_group)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_user`,
      [nombre, ap_paterno, ap_materno, CURP, id_estado, id_municipio, id_hospital, id_grupo]
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

        // 5. Insertar en user_roles con id_hospital
    await client.query(
      `INSERT INTO group_users (id_group, id_user)
       VALUES ($1, $2)`,
      [id_grupo,newUserId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Empleado creado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear empleado:", error);
    res.status(500).json({ error: "Error al crear el empleado" });
  } finally {
    client.release();
  }
});

router.get("/get-empleados", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        u.curp_user,
        e.nombre_estado AS estado,
        m.nombre_municipio AS municipio,
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
      WHERE r.role_name = 'empleado'
      ORDER BY u.id_user
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener todos los admins:", error);
    res.status(500).json({ error: "Error al obtener administradores" });
  }
});

router.get("/get-empleados-by-groups", async (req, res) => {
  try {
    const gruposResult = await pool.query(`
      SELECT 
        g.id_group,
        g.nombre_grupo,
        g.descripcion_group,
        e.nombre_estado,
        m.nombre_municipio,
        h.nombre_hospital
      FROM groups g
      JOIN hospitals h ON g.id_hospital = h.id_hospital
      LEFT JOIN estados e ON h.estado_id = e.id_estado
      LEFT JOIN municipios m ON h.id_municipio = m.id_municipio
    `);

    const grupos = gruposResult.rows;

    const gruposConEmpleados = await Promise.all(
      grupos.map(async (grupo) => {
        const empleadosResult = await pool.query(`
          SELECT 
            u.nombre,
            u.ap_paterno,
            u.ap_materno,
            u.curp_user
          FROM group_users gu
          JOIN user_data u ON gu.id_user = u.id_user
          WHERE gu.id_group = $1
        `, [grupo.id_group]);

        return {
          grupo: {
            id_group: grupo.id_group,
            nombre_grupo: grupo.nombre_grupo,
            descripcion: grupo.descripcion_group,
            estado: grupo.nombre_estado,
            municipio: grupo.nombre_municipio,
            hospital: grupo.nombre_hospital,
          },
          empleados: empleadosResult.rows
        };
      })
    );

    res.json(gruposConEmpleados);
  } catch (error) {
    console.error("❌ Error al obtener empleados por grupo:", error);
    res.status(500).json({ error: "Error al obtener empleados por grupo" });
  }
});

router.get("/monitoreo", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (r.id_user)
        r.id_user,
        u.nombre,
        u.ap_paterno,
        u.ap_materno,
        r.latitud,
        r.longitud,
        r.fecha_hora,
        r.dentro_geocerca,
        r.tipo_registro
      FROM registro_ubicaciones r
      JOIN user_data u ON r.id_user = u.id_user
      ORDER BY r.id_user, r.fecha_hora DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener datos de monitoreo:", error);
    res.status(500).json({ error: "Error al obtener datos de monitoreo" });
  }
});

router.post("/update-employee", async (req, res) => {
  const { id_user, nombre, ap_paterno, ap_materno, curp_user, id_estado, id_municipio, id_hospital, id_group } = req.body;

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
      [id_user, nombre, ap_paterno, ap_materno, curp_user, id_estado, id_municipio, id_hospital, id_group]
    );

    await client.query(
      `UPDATE group_users
      SET id_group = $2
      WHERE id_user = $1`,
      [id_user, id_group]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Empleado actualizado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al actualizar el empleado:", error);
    res.status(500).json({ error: "Error al actualizar el empleado para el hospital" });
  } finally {
    client.release();
  }
});


router.post("/delete-employee/:id_user", async (req, res) => {
  const { id_user } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️ Eliminar relaciones en group_users
    await client.query(
      `DELETE FROM group_users WHERE id_user = $1`,
      [id_user]
    );

    await client.query(
      `DELETE FROM user_credentials WHERE id_user = $1`,
      [id_user]
    );

    await client.query(
      `DELETE FROM user_roles WHERE id_user = $1`,
      [id_user]
    );

    await client.query(
      `DELETE FROM user_data WHERE id_user = $1`,
      [id_user]
    );

    await client.query("COMMIT");
    res.status(200).json({ message: "Empleado eliminado con éxito" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al eliminar el empleado:", error);
    res.status(500).json({ error: "Error al eliminar el empleado para el hospital" });
  } finally {
    client.release();
  }
});


export default router;
