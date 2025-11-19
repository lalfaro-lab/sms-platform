
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); // Asegúrate de que node-fetch esté en package.json

// Inicializar Firebase Admin
admin.initializeApp();

// Crear una app de Express principal
const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Crear un ENRUTADOR específico para la API
const apiRouter = express.Router();

const db = admin.firestore();

// ============================================
// COLECCIONES
// ============================================
const messagesRef = db.collection('messages');
const contactsRef = db.collection('contacts');
const webhooksRef = db.collection('webhooks');

// ============================================
// FUNCIONES AUXILIARES (HIPÓTESIS FINAL: RUTA /message)
// ============================================
async function sendSMSToGateway(phoneNumber, message) {
    const gatewayUrl = functions.config().gateway.url;
    const gatewayUsername = functions.config().gateway.username;
    const gatewayPassword = functions.config().gateway.password;

    const auth = Buffer.from(`${gatewayUsername}:${gatewayPassword}`).toString('base64');
    
    // CORRECCIÓN FINAL: La ruta para el modo local es probablemente /message.
    const requestUrl = `${gatewayUrl}/message`;

    try {
        const response = await fetch(requestUrl, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            // El cuerpo del mensaje se mantiene como en la documentación.
            body: JSON.stringify({
                phoneNumbers: [phoneNumber], 
                message: message
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error enviando SMS al gateway (hipótesis final):', error);
        throw error;
    }
}

// ============================================
// ENDPOINTS (RUTAS)
// ============================================

// Enviar SMS 
apiRouter.post('/send-sms', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        if (!phoneNumber || !message) {
            return res.status(400).json({ success: false, error: 'phoneNumber y message son requeridos' });
        }
        const result = await sendSMSToGateway(phoneNumber, message);
        const messageDoc = await messagesRef.add({ 
            phoneNumber, 
            message, 
            status: 'sent', 
            type: 'sent', 
            gatewayMessageId: (result.messages && result.messages.length > 0) ? result.messages[0].id : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            timestamp: new Date().toISOString()
        });
        res.json({ success: true, data: { id: messageDoc.id, gatewayResponse: result } });
    } catch (error) {
        console.error('Error en /send-sms:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener historial/bandeja de entrada
apiRouter.get('/messages', async (req, res) => {
    try {
        const type = req.query.type || 'sent';
        const limit = parseInt(req.query.limit) || 50;
        const snapshot = await messagesRef.where('type', '==', type).orderBy('createdAt', 'desc').limit(limit).get();
        const messages = [];
        snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Error en /messages:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtener contactos
apiRouter.get('/contacts', async (req, res) => {
    try {
        const snapshot = await contactsRef.orderBy('name').get();
        const contacts = [];
        snapshot.forEach(doc => contacts.push({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: contacts });
    } catch (error) {
        console.error('Error en /contacts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Agregar contacto
apiRouter.post('/contacts', async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        if (!name || !phoneNumber) {
            return res.status(400).json({ success: false, error: 'name y phoneNumber son requeridos' });
        }
        const existingSnapshot = await contactsRef.where('phoneNumber', '==', phoneNumber).get();
        if (!existingSnapshot.empty) {
            return res.status(400).json({ success: false, error: 'Este número ya existe en contactos' });
        }
        const contactDoc = await contactsRef.add({ name, phoneNumber, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        res.json({ success: true, data: { id: contactDoc.id, name, phoneNumber } });
    } catch (error) {
        console.error('Error en /contacts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar contacto
apiRouter.delete('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await contactsRef.doc(id).delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Error en /contacts/:id:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Webhook para SMS entrantes
apiRouter.post('/webhook', async (req, res) => {
    try {
        const { event, payload } = req.body;
        await webhooksRef.add({ event, payload, receivedAt: admin.firestore.FieldValue.serverTimestamp() });
        if (event === 'sms:received' && payload) {
            await messagesRef.add({
                phoneNumber: payload.from, 
                message: payload.message, 
                status: 'received', 
                type: 'received',
                gatewayMessageId: payload.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error en /webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Montar el enrutador de la API en la ruta raíz
app.use('/', apiRouter);

// ============================================
// EXPORTAR LA FUNCIÓN
// ============================================
exports.api = functions.https.onRequest(app);
