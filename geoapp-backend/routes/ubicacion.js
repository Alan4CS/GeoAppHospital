import express from 'express';
import { pool } from '../db/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { id_user, latitud, longitud, dentro_geocerca, tipo_registro } = req.body;

  if (
    id_user == null ||
    latitud == null ||
    longitud == null ||
    dentro_geocerca == null ||
    tipo_registro == null
  ) {
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
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

    res.status(200).json({ mensaje: 'Ubicación actualizada correctamente.' });
  } catch (error) {
    console.error('❌ Error al actualizar ubicación:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;