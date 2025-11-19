const admin = require('firebase-admin');

// Inicializar Firebase Admin
// En producción, usa variables de entorno
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'sms-platform' // Reemplaza con tu ID de proyecto
});

const db = admin.firestore();

module.exports = { admin, db };