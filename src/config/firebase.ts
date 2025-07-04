import admin from 'firebase-admin';
import serviceAccount from './firebaseaishopper.json';

// Mapea las propiedades del JSON a la estructura esperada por ServiceAccount
const serviceAccountMapped = {
  projectId: serviceAccount.project_id,
  clientEmail: serviceAccount.client_email,
  privateKey: serviceAccount.private_key, // Asegúrate de que no haya saltos de línea adicionales
};

if (!admin.apps.length) {
  console.log('Intentando cargar serviceAccount:', serviceAccountMapped); // Depuración
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountMapped),
    });
    console.log('Firebase Admin SDK inicializado.');
  } catch (error) {
    console.error('Error al inicializar Firebase Admin SDK:', error);
  }
}

export default admin;