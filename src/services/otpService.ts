import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Carga las variables de entorno desde el archivo .env

// Función para generar un OTP aleatorio de 4 dígitos
export function generateRandomOTP(): string {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) { // Changed to 4 digits
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

// Función para enviar OTP por correo electrónico
export async function sendEmail(email: string, otp: string): Promise<void> {
  try {
    // Crea un objeto transportador usando el transporte SMTP predeterminado
    let transporter = nodemailer.createTransport({
      service: 'gmail', // O el servicio que uses
      auth: {
        user: 'tuemail@gmail.com', // Cambia por tu correo
        pass: 'tu_contraseña_de_app', // Usa una contraseña de aplicación
      },
    });

    // Define las opciones de correo electrónico
    let mailOptions = {
      from: 'tuemail@gmail.com', // El mismo correo que arriba
      to: email, // lista de destinatarios
      subject: 'Verificación OTP', // Asunto
      text: `Tu OTP es: ${otp}`, // cuerpo de texto plano
      html: `<p>Tu OTP es: <b>${otp}</b></p>`, // cuerpo html
    };

    // Envía el correo electrónico
    let info = await transporter.sendMail(mailOptions);

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error);
    throw error; // Vuelve a lanzar el error para manejarlo en el controlador
  }
}