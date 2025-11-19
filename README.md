\# 📱 Plataforma SMS Gateway



Sistema completo de gestión y envío de mensajes SMS utilizando un dispositivo Android como gateway. Permite enviar y recibir SMS a través de una interfaz web moderna y una API REST.



!\[Estado](https://img.shields.io/badge/estado-activo-success)

!\[Licencia](https://img.shields.io/badge/licencia-MIT-blue)

!\[Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)



\## ✨ Características



\- 📤 \*\*Envío de SMS\*\* - Envía mensajes de texto desde una interfaz web intuitiva

\- 📥 \*\*Recepción de SMS\*\* - Recibe y gestiona mensajes entrantes mediante webhooks

\- 👥 \*\*Gestión de Contactos\*\* - Guarda y administra tus contactos frecuentes

\- 📊 \*\*Dashboard con Estadísticas\*\* - Visualiza métricas en tiempo real

\- 📋 \*\*Historial Completo\*\* - Accede al registro de mensajes enviados y recibidos

\- 🔒 \*\*Seguro\*\* - Autenticación básica y encriptación end-to-end

\- 🌐 \*\*API REST\*\* - Integra fácilmente con otros sistemas

\- 💾 \*\*Base de Datos SQLite\*\* - Almacenamiento local sin configuración adicional



\## 🖼️ Capturas de Pantalla



\### Dashboard Principal

!\[Dashboard](docs/screenshots/dashboard.png)



\### Envío de Mensajes

!\[Enviar SMS](docs/screenshots/send-sms.png)



\### Gestión de Contactos

!\[Contactos](docs/screenshots/contacts.png)



\## 🏗️ Arquitectura



```

┌─────────────────┐      ┌─────────────────┐      ┌──────────────────┐

│   Frontend      │      │    Backend      │      │  Android Gateway │

│   (HTML/JS)     │◄────►│   (Node.js)     │◄────►│   (APK)          │

│                 │      │                 │      │                  │

│  • Dashboard    │      │  • API REST     │      │  • Enviar SMS    │

│  • Formularios  │      │  • SQLite DB    │      │  • Recibir SMS   │

│  • Historial    │      │  • Webhooks     │      │  • Dual SIM      │

└─────────────────┘      └─────────────────┘      └──────────────────┘

```



\## 🚀 Instalación



\### Requisitos Previos



\#### Software

\- \*\*Node.js\*\* >= 18.0.0 (\[Descargar](https://nodejs.org))

\- \*\*Git\*\* (\[Descargar](https://git-scm.com))

\- \*\*Android\*\* 5.0 o superior



\#### Hardware

\- Dispositivo Android con:

&nbsp; - SIM card activa con plan de SMS

&nbsp; - Conexión WiFi estable

&nbsp; - Batería suficiente (recomendado: conectado a corriente)



\### Paso 1: Clonar el Repositorio



```bash

git clone https://github.com/TU\_USUARIO/sms-platform.git

cd sms-platform

```



\### Paso 2: Instalar Dependencias del Backend



```bash

cd backend

npm install

```



\### Paso 3: Configurar Variables de Entorno



Crea un archivo `.env` en la carpeta `backend` basado en `.env.example`:



```bash

cp .env.example .env

```



Edita el archivo `.env` con tus datos:



```env

\# Configuración del Gateway Android

GATEWAY\_URL=http://192.168.X.XX:8080

GATEWAY\_USERNAME=tu\_username

GATEWAY\_PASSWORD=tu\_password



\# Puerto del servidor

PORT=3000



\# URL pública (para webhooks en producción)

PUBLIC\_URL=http://localhost:3000

```



\### Paso 4: Instalar la App Android Gateway



1\. Descarga la APK desde el \[repositorio oficial](https://github.com/capcom6/android-sms-gateway/releases)

2\. En tu dispositivo Android:

&nbsp;  - Ve a \*\*Ajustes → Seguridad\*\*

&nbsp;  - Activa \*\*"Fuentes desconocidas"\*\*

3\. Instala el archivo `app-release.apk`

4\. Abre la app y concede los permisos necesarios:

&nbsp;  - ✅ SEND\_SMS (obligatorio)

&nbsp;  - ✅ READ\_PHONE\_STATE (opcional, para dual SIM)

&nbsp;  - ✅ RECEIVE\_SMS (opcional, para recibir mensajes)

5\. Activa \*\*"Local Server"\*\* y presiona \*\*"Online"\*\*

6\. Anota la IP, Username y Password que aparecen en pantalla



\### Paso 5: Iniciar el Backend



```bash

cd backend

node server.js

```



Deberías ver:

```

╔════════════════════════════════════════╗

║   🚀 SERVIDOR SMS INICIADO             ║

╠════════════════════════════════════════╣

║   📡 URL: http://localhost:3000        ║

║   📱 Gateway: http://192.168.X.XX:8080 ║

║   ✅ Base de datos inicializada        ║

╚════════════════════════════════════════╝

```



\### Paso 6: Abrir la Interfaz Web



Abre el archivo `frontend/index.html` en tu navegador o usa un servidor local:



```bash

cd frontend

npx serve

```



Luego abre: `http://localhost:3000` (o el puerto indicado)



\## 🧪 Prueba Rápida



\### Enviar tu Primer SMS



1\. Abre la plataforma web

2\. Ve a la pestaña \*\*"📤 Enviar SMS"\*\*

3\. Ingresa un número de teléfono (con código de país, ej: +506XXXXXXXX)

4\. Escribe un mensaje

5\. Clic en \*\*"Enviar SMS"\*\*

6\. ¡Deberías recibir el mensaje en segundos! 🎉



\### Probar con cURL



```bash

curl -X POST http://localhost:3000/api/send-sms \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{

&nbsp;   "phoneNumber": "+506XXXXXXXX",

&nbsp;   "message": "Hola desde la API!"

&nbsp; }'

```



\## 📡 Configurar Webhooks (Recibir SMS)



Para recibir notificaciones de SMS entrantes, necesitas una URL pública.



\### Opción 1: Usar ngrok (para desarrollo)



```bash

\# Instalar ngrok

\# https://ngrok.com/download



\# Exponer el puerto 3000

ngrok http 3000

```



Copia la URL generada (ej: `https://xxxx.ngrok-free.app`)



\### Opción 2: Configurar el Webhook



Registra el webhook en el gateway Android:



```bash

curl -X POST -u USERNAME:PASSWORD \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{

&nbsp;   "id": "webhook-1",

&nbsp;   "url": "https://tu-url-publica.com/api/webhook",

&nbsp;   "event": "sms:received"

&nbsp; }' \\

&nbsp; http://192.168.X.XX:8080/webhooks

```



Reemplaza:

\- `USERNAME:PASSWORD` con las credenciales del gateway

\- `https://tu-url-publica.com` con tu URL de ngrok o servidor

\- `192.168.X.XX` con la IP de tu dispositivo Android



\## 📚 API Documentation



\### Endpoints Principales



\#### Enviar SMS

```http

POST /api/send-sms

Content-Type: application/json



{

&nbsp; "phoneNumber": "+506XXXXXXXX",

&nbsp; "message": "Tu mensaje aquí"

}

```



\*\*Respuesta:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "id": 1,

&nbsp;   "gateway\_response": {...}

&nbsp; }

}

```



\#### Obtener Historial

```http

GET /api/messages?type=sent\&limit=50

```



\*\*Parámetros:\*\*

\- `type`: `sent`, `received`, o `all` (default: `all`)

\- `limit`: Número de mensajes (default: `50`)



\#### Obtener Estadísticas

```http

GET /api/stats

```



\*\*Respuesta:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": {

&nbsp;   "total\_sent": 10,

&nbsp;   "total\_received": 5,

&nbsp;   "today\_sent": 2,

&nbsp;   "total\_contacts": 3

&nbsp; }

}

```



\#### Agregar Contacto

```http

POST /api/contacts

Content-Type: application/json



{

&nbsp; "name": "Juan Pérez",

&nbsp; "phoneNumber": "+506XXXXXXXX"

}

```



\#### Webhook (recibir SMS)

```http

POST /api/webhook

Content-Type: application/json



{

&nbsp; "event": "sms:received",

&nbsp; "payload": {

&nbsp;   "messageId": "msg\_12345",

&nbsp;   "message": "Texto del mensaje",

&nbsp;   "phoneNumber": "+506XXXXXXXX",

&nbsp;   "receivedAt": "2024-01-15T10:30:00Z"

&nbsp; }

}

```



\## 🗂️ Estructura del Proyecto



```

sms-platform/

├── backend/

│   ├── server.js           # Servidor principal Node.js

│   ├── package.json        # Dependencias del backend

│   ├── .env               # Variables de entorno (no subir a git)

│   └── sms-platform.db    # Base de datos SQLite (generada automáticamente)

├── frontend/

│   └── index.html         # Interfaz web completa

├── docs/

│   └── screenshots/       # Capturas de pantalla

├── .env.example           # Plantilla de variables de entorno

├── .gitignore            # Archivos ignorados por Git

├── package.json          # Configuración del proyecto

├── README.md             # Este archivo

└── LICENSE               # Licencia del proyecto

```



\## ⚙️ Configuración Avanzada



\### Cambiar el Puerto del Servidor



Edita `.env`:

```env

PORT=8080

```



\### Usar Base de Datos PostgreSQL (en producción)



Para ambientes de producción, se recomienda usar PostgreSQL en lugar de SQLite:



1\. Instalar dependencia:

```bash

npm install pg

```



2\. Modificar `server.js` para usar PostgreSQL



\### Configurar HTTPS



Para producción, usa un reverse proxy como Nginx con Let's Encrypt:



```nginx

server {

&nbsp;   listen 443 ssl;

&nbsp;   server\_name tu-dominio.com;

&nbsp;   

&nbsp;   ssl\_certificate /path/to/cert.pem;

&nbsp;   ssl\_certificate\_key /path/to/key.pem;

&nbsp;   

&nbsp;   location / {

&nbsp;       proxy\_pass http://localhost:3000;

&nbsp;       proxy\_http\_version 1.1;

&nbsp;       proxy\_set\_header Upgrade $http\_upgrade;

&nbsp;       proxy\_set\_header Connection 'upgrade';

&nbsp;       proxy\_set\_header Host $host;

&nbsp;   }

}

```



\## 🐛 Solución de Problemas



\### El backend no se conecta al gateway



\*\*Problema:\*\* Error de conexión o timeout



\*\*Solución:\*\*

\- Verifica que ambos dispositivos estén en la misma red WiFi

\- Confirma que la IP del gateway sea correcta

\- Asegúrate que la app Android esté "Online" (verde)

\- Revisa el firewall de Windows



\### Las estadísticas aparecen en cero



\*\*Problema:\*\* Los datos no se muestran en el dashboard



\*\*Solución:\*\*

\- Abre `http://localhost:3000/api/stats` en el navegador

\- Si ves datos, recarga el frontend con Ctrl+F5

\- Verifica que el backend esté corriendo

\- Revisa la consola del navegador (F12) en busca de errores



\### No recibo webhooks de SMS entrantes



\*\*Problema:\*\* Los mensajes recibidos no aparecen en la bandeja de entrada



\*\*Solución:\*\*

\- Verifica que el webhook esté registrado correctamente

\- Si usas ngrok, asegúrate que esté corriendo

\- Confirma que la URL del webhook sea accesible desde internet

\- Revisa los logs del backend



\### La app Android se cierra sola



\*\*Problema:\*\* El gateway se detiene automáticamente



\*\*Solución:\*\*

\- Desactiva la optimización de batería para la app:

&nbsp; - Ajustes → Batería → Aplicaciones sin restricciones

&nbsp; - Agrega "SMS Gateway"

\- Mantén el dispositivo conectado a corriente



\## 🔒 Seguridad



\### Recomendaciones



\- ✅ Cambia las credenciales por defecto del gateway

\- ✅ Usa HTTPS en producción

\- ✅ No subas el archivo `.env` a GitHub

\- ✅ Implementa rate limiting para prevenir abusos

\- ✅ Usa autenticación JWT para APIs públicas

\- ✅ Mantén actualizadas las dependencias: `npm audit fix`



\### Variables Sensibles



\*\*NUNCA subas a GitHub:\*\*

\- Archivo `.env` con credenciales

\- Base de datos `\*.db` con mensajes reales

\- Logs con información personal



\## 📊 Limitaciones



\- ⚠️ No recomendado para envío masivo (limitaciones del operador)

\- ⚠️ Requiere dispositivo Android siempre encendido

\- ⚠️ Consume el plan de SMS del dispositivo

\- ⚠️ SQLite no es ideal para alta concurrencia



\## 🚀 Despliegue en Producción



\### Opción 1: Render (Recomendado - Gratis)



1\. Crea cuenta en \[Render](https://render.com)

2\. Conecta tu repositorio de GitHub

3\. Configura las variables de entorno

4\. Despliega con un clic



\### Opción 2: Railway



1\. Instala Railway CLI

2\. `railway login`

3\. `railway init`

4\. `railway up`



\### Opción 3: VPS (DigitalOcean, AWS, etc.)



```bash

\# Instalar Node.js en el servidor

curl -fsSL https://deb.nodesource.com/setup\_18.x | sudo -E bash -

sudo apt-get install -y nodejs



\# Clonar y configurar

git clone https://github.com/TU\_USUARIO/sms-platform.git

cd sms-platform/backend

npm install

npm install -g pm2



\# Iniciar con PM2

pm2 start server.js --name sms-platform

pm2 startup

pm2 save

```



\## 🤝 Contribuir



¡Las contribuciones son bienvenidas! Por favor:



1\. Fork el proyecto

2\. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)

3\. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)

4\. Push a la rama (`git push origin feature/AmazingFeature`)

5\. Abre un Pull Request



\## 📝 Changelog



\### \[1.0.0] - 2024-01-15



\#### Agregado

\- ✨ Interfaz web completa con dashboard

\- ✨ Sistema de envío de SMS

\- ✨ Recepción de SMS mediante webhooks

\- ✨ Gestión de contactos

\- ✨ Historial de mensajes

\- ✨ Estadísticas en tiempo real

\- ✨ API REST completa

\- ✨ Base de datos SQLite



\## 📄 Licencia



Este proyecto está bajo la Licencia MIT. Ver el archivo \[LICENSE](LICENSE) para más detalles.



\## 🙏 Agradecimientos



\- \[Android SMS Gateway](https://github.com/capcom6/android-sms-gateway) - Por la excelente app de gateway

\- \[Express.js](https://expressjs.com/) - Framework web

\- \[Better SQLite3](https://github.com/WiseLibs/better-sqlite3) - Base de datos



\## 📧 Contacto



Tu Nombre - \[@tu\_twitter](https://twitter.com/tu\_twitter) - tu@email.com



Link del Proyecto: \[https://github.com/TU\_USUARIO/sms-platform](https://github.com/TU\_USUARIO/sms-platform)



---



⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!



\*\*Hecho con ❤️ en Costa Rica 🇨🇷\*\*

