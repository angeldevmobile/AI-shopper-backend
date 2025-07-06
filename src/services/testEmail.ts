import { sendEmail } from './otpService';

async function testEmail() {
  try {
    await sendEmail('marquavius040@vaseity.com', '123456');
    console.log('Correo enviado con éxito');
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
}

testEmail();