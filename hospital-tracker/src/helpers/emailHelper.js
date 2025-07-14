const sendCredentialsEmail = async (credentials) => {
  try {
    if (!credentials.correo_electronico) {
      throw new Error('El correo electrónico es requerido');
    }

    console.log('📧 Enviando credenciales por email...');
    const response = await fetch('https://geoapphospital-b0yr.onrender.com/api/email/send-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`Error al enviar email: ${response.statusText}`);
    }

    console.log('✉️ Email enviado exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error en sendCredentialsEmail:', error);
    throw error;
  }
};

export default sendCredentialsEmail;
