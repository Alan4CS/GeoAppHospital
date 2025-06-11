import express from 'express';
import { Resend } from 'resend';

const router = express.Router();
const resend = new Resend('re_9D35u8oU_9Z7Lqxx4Dt1hYD6v67jRbwgH');

router.post('/send-credentials', async (req, res) => {
    try {
        const empleadoData = req.body;
        console.log('Recibida solicitud de envío de email:', empleadoData.correo_electronico);

        if (!empleadoData.correo_electronico) {
            return res.status(400).json({ error: 'El correo electrónico es requerido' });
        }

        const response = await resend.emails.send({
            from: 'GeoApp IMSS <onboarding@resend.dev>',
            to: empleadoData.correo_electronico,
            subject: 'Tus credenciales de acceso - GeoApp IMSS',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bienvenido a GeoApp IMSS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f7f7; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <!-- Encabezado -->                    
                    <tr>
                        <td align="center" style="background-color: #1565C0; padding: 15px; border-radius: 8px 8px 0 0;">
                            <table width="100%" cellspacing="0" cellpadding="0">
                                <tr>                                    
                                    <td align="center">
                                        <img src="https://ci3.googleusercontent.com/meips/ADKq_NYa5RHLgKGoggsV_DoPA42E20mfuVNPPXFImiaeWrEszyAoIjnR3mLsrJLDr1QmHb_2tuh0aXgNSORdHx7SGnRfdngOQ5f6JAIbEVL_yjGCtUWDrSSWq3JNUX9cVs_waMh1JWsg0vMbRhVIxdVnQNnzMiybBaU6dC8Xqe2LRuUBHgOumndB6Ru2=s0-d-e1-ft#https://evcljgg.stripocdn.email/content/guids/CABINET_f3fc38cf551f5b08f70308b6252772b8/images/96671618383886503.png" 
                                             alt="GeoApp IMSS Logo" 
                                             width="100" 
                                             height="100" 
                                             style="display: block; border: 0;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #ffffff;">
                            <table width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <h1 style="margin: 0; color: #333333; font-size: 28px; font-weight: bold; line-height: 1.3;">
                                            Bienvenido(a)<br>${empleadoData.nombre} ${empleadoData.ap_paterno}
                                        </h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <p style="margin: 0; color: #555555; font-size: 16px; line-height: 1.5;">
                                            Se ha creado tu cuenta en GeoApp IMSS.<br>
                                            Aquí están tus credenciales de acceso:
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td align="center">
                                                    <table cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 20px 30px;">
                                                                <p style="margin: 0 0 10px 0; color: #333333; font-size: 16px;">
                                                                    <strong>Usuario:</strong> 
                                                                    <span style="color: #1565C0; font-weight: bold;">${empleadoData.user}</span>
                                                                </p>
                                                                <p style="margin: 0; color: #333333; font-size: 16px;">
                                                                    <strong>Contraseña:</strong> 
                                                                    <span style="color: #1565C0; font-weight: bold;">${empleadoData.pass}</span>
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Pie -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                            <table width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: bold; line-height: 1.4;">
                                            Es importante que modifiques tu contraseña tras el primer acceso al sistema para garantizar la seguridad de tu cuenta.
                                        </p>
                                        <p style="margin: 0; color: #666666; font-size: 14px;">
                                            Este mensaje se ha generado automáticamente. No responder a este correo.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
        });

        console.log('Email enviado exitosamente:', response);
        res.json({ success: true, data: response });
    } catch (error) {
        console.error('Error al enviar email:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
