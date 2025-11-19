const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();

// ============================================
// COLECCIONES DE FIRESTORE
// ============================================
const messagesRef = db.collection('messages');
const contactsRef = db.collection('contacts');
const webhooksRef = db.collection('webhooks');

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Función para enviar SMS al gateway
async function sendSMSToGateway(phoneNumber, message) {
  const auth = Buffer.from(
    `${process.env.GATEWAY_USERNAME}:${process.env.GATEWAY_PASSWORD}`
  ).toString('base64');

  try {
    const response = await fetch(`${process.env.GATEWAY_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        textMessage: { text: message },
        phoneNumbers: [phoneNumber]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error enviando SMS:', error);
    throw error;
  }
}

// ============================================
// ENDPOINTS DE MENSAJES
// ============================================

// Enviar SMS
app.post('/api/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'phoneNumber y message son requeridos' 
      });
    }

    // Enviar al gateway
    const result = await sendSMSToGateway(phoneNumber, message);
    
    // Guardar en Firestore
    const messageDoc = await messagesRef.add({
      phoneNumber: phoneNumber,
      message: message,
      status: 'sent',
      type: 'sent',
      gatewayMessageId: result.id || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      data: {
        id: messageDoc.id,
        gatewayResponse: result
      }
    });

  } catch (error) {
    console.error('Error en /api/send-sms:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener historial de mensajes
app.get('/api/messages', async (req, res) => {
  try {
    const type = req.query.type || 'all';
    const limit = parseInt(req.query.limit) || 50;
    
    let query = messagesRef.orderBy('createdAt', 'desc').limit(limit);
    
    if (type !== 'all') {
      query = messagesRef
        .where('type', '==', type)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }
    
    const snapshot = await query.get();
    const messages = [];
    
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().timestamp || doc.data().createdAt?.toDate()?.toISOString()
      });
    });
    
    res.json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    console.error('Error en /api/messages:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    // Contar mensajes enviados
    const sentSnapshot = await messagesRef
      .where('type', '==', 'sent')
      .count()
      .get();
    
    // Contar mensajes recibidos
    const receivedSnapshot = await messagesRef
      .where('type', '==', 'received')
      .count()
      .get();
    
    // Contar mensajes de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySnapshot = await messagesRef
      .where('type', '==', 'sent')
      .where('createdAt', '>=', today)
      .count()
      .get();
    
    // Contar contactos
    const contactsSnapshot = await contactsRef.count().get();
    
    const stats = {
      total_sent: sentSnapshot.data().count,
      total_received: receivedSnapshot.data().count,
      today_sent: todaySnapshot.data().count,
      total_contacts: contactsSnapshot.data().count
    };
    
    console.log('Estadísticas calculadas:', stats);
    res.json({ success: true, data: stats });
    
  } catch (error) {
    console.error('Error en /api/stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// ENDPOINTS DE CONTACTOS
// ============================================

// Obtener todos los contactos
app.get('/api/contacts', async (req, res) => {
  try {
    const snapshot = await contactsRef.orderBy('name').get();
    const contacts = [];
    
    snapshot.forEach(doc => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error en /api/contacts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Agregar contacto
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    
    if (!name || !phoneNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'name y phoneNumber son requeridos' 
      });
    }

    // Verificar si ya existe
    const existingSnapshot = await contactsRef
      .where('phoneNumber', '==', phoneNumber)
      .get();
    
    if (!existingSnapshot.empty) {
      return res.status(400).json({ 
        success: false, 
        error: 'Este número ya existe en contactos' 
      });
    }

    // Agregar contacto
    const contactDoc = await contactsRef.add({
      name: name,
      phoneNumber: phoneNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      data: { 
        id: contactDoc.id, 
        name, 
        phoneNumber 
      }
    });
  } catch (error) {
    console.error('Error en /api/contacts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Eliminar contacto
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await contactsRef.doc(id).delete();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error en /api/contacts/:id:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// WEBHOOK PARA RECIBIR SMS
// ============================================

app.post('/api/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook recibido:', JSON.stringify(req.body, null, 2));
    
    const { event, payload } = req.body;
    
    // Guardar webhook completo
    await webhooksRef.add({
      event: event,
      payload: payload,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      timestamp: new Date().toISOString()
    });
    
    // Si es un SMS recibido, guardarlo en mensajes
    if (event === 'sms:received' && payload) {
      await messagesRef.add({
        phoneNumber: payload.phoneNumber,
        message: payload.message,
        status: 'received',
        type: 'received',
        gatewayMessageId: payload.messageId,
        receivedAt: payload.receivedAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ SMS guardado de: ${payload.phoneNumber}`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// ENDPOINT DE SALUD
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    firebase: 'connected'
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 SERVIDOR SMS INICIADO             ║
╠════════════════════════════════════════╣
║   📡 URL: http://localhost:${PORT}     ║
║   🔥 Firebase: Conectado               ║
║   📱 Gateway: ${process.env.GATEWAY_URL}
╚════════════════════════════════════════╝
  `);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n👋 Servidor cerrado correctamente');
  process.exit(0);
});