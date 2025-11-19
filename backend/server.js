const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Inicializar base de datos
const db = new Database('sms-platform.db');

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    type TEXT DEFAULT 'sent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    gateway_message_id TEXT
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    payload TEXT NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

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
    
    // Guardar en base de datos
    const stmt = db.prepare(`
      INSERT INTO messages (phone_number, message, status, type, gateway_message_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      phoneNumber, 
      message, 
      'sent', 
      'sent',
      result.id || null
    );

    res.json({ 
      success: true, 
      data: {
        id: info.lastInsertRowid,
        gateway_response: result
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

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total_sent: 0,
      total_received: 0,
      today_sent: 0,
      total_contacts: 0
    };
    
    // Contar mensajes enviados
    try {
      const sentResult = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE type = 'sent'`).get();
      stats.total_sent = sentResult ? sentResult.count : 0;
    } catch (e) {
      console.error('Error contando enviados:', e.message);
    }
    
    // Contar mensajes recibidos
    try {
      const receivedResult = db.prepare(`SELECT COUNT(*) as count FROM messages WHERE type = 'received'`).get();
      stats.total_received = receivedResult ? receivedResult.count : 0;
    } catch (e) {
      console.error('Error contando recibidos:', e.message);
    }
    
    // Contar mensajes de hoy
    try {
      const todayResult = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE type = 'sent' AND DATE(created_at) = DATE('now')
      `).get();
      stats.today_sent = todayResult ? todayResult.count : 0;
    } catch (e) {
      console.error('Error contando hoy:', e.message);
    }
    
    // Contar contactos
    try {
      const contactsResult = db.prepare(`SELECT COUNT(*) as count FROM contacts`).get();
      stats.total_contacts = contactsResult ? contactsResult.count : 0;
    } catch (e) {
      console.error('Error contando contactos:', e.message);
    }
    
    console.log('Estadísticas calculadas:', stats);
    res.json({ success: true, data: stats });
    
  } catch (error) {
    console.error('Error general en /api/stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener estadísticas
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total_sent: db.prepare('SELECT COUNT(*) as count FROM messages WHERE type = "sent"').get().count,
      total_received: db.prepare('SELECT COUNT(*) as count FROM messages WHERE type = "received"').get().count,
      today_sent: db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE type = "sent" AND DATE(created_at) = DATE('now')
      `).get().count,
      total_contacts: db.prepare('SELECT COUNT(*) as count FROM contacts').get().count
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
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
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY name').all();
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Agregar contacto
app.post('/api/contacts', (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    
    if (!name || !phoneNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'name y phoneNumber son requeridos' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO contacts (name, phone_number)
      VALUES (?, ?)
    `);
    
    const info = stmt.run(name, phoneNumber);
    
    res.json({ 
      success: true, 
      data: { id: info.lastInsertRowid, name, phoneNumber }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      res.status(400).json({ 
        success: false, 
        error: 'Este número ya existe en contactos' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// Eliminar contacto
app.delete('/api/contacts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Contacto no encontrado' 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// WEBHOOK PARA RECIBIR SMS
// ============================================

app.post('/api/webhook', (req, res) => {
  try {
    console.log('📩 Webhook recibido:', JSON.stringify(req.body, null, 2));
    
    const { event, payload } = req.body;
    
    // Guardar webhook completo
    const webhookStmt = db.prepare(`
      INSERT INTO webhooks (event, payload)
      VALUES (?, ?)
    `);
    webhookStmt.run(event, JSON.stringify(payload));
    
    // Si es un SMS recibido, guardarlo en mensajes
    if (event === 'sms:received' && payload) {
      const messageStmt = db.prepare(`
        INSERT INTO messages (phone_number, message, status, type, gateway_message_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      messageStmt.run(
        payload.phoneNumber,
        payload.message,
        'received',
        'received',
        payload.messageId
      );
      
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
    timestamp: new Date().toISOString()
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
║   📱 Gateway: ${process.env.GATEWAY_URL}
║   ✅ Base de datos inicializada        ║
╚════════════════════════════════════════╝
  `);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  db.close();
  console.log('\n👋 Servidor cerrado correctamente');
  process.exit(0);
});