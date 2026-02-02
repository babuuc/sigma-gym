// endpointy sse dla telemetrii i aktywnosci
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// aktywne polaczenia sse
const telemetryClients = new Map();
const activityClients = new Set();

// middleware sprawdza auth z query param
function sseAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'brak tokena' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'niepoprawny token' });
  }
}

// stream telemetrii dla sprzetu
router.get('/equipment/:id', sseAuth, (req, res) => {
  const equipmentId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // dodaj klienta
  if (!telemetryClients.has(equipmentId)) {
    telemetryClients.set(equipmentId, new Set());
  }
  telemetryClients.get(equipmentId).add(res);

  console.log(`sse telemetry polaczono dla sprzetu ${equipmentId}`);

  // heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    telemetryClients.get(equipmentId)?.delete(res);
    console.log(`sse telemetry rozlaczono dla sprzetu ${equipmentId}`);
  });
});

// stream aktywnosci ogolnej
router.get('/activity', sseAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  activityClients.add(res);
  console.log('sse activity polaczono');

  // heartbeat
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    activityClients.delete(res);
    console.log('sse activity rozlaczono');
  });
});

// wyslij telemetrie do klientow sledzacych sprzet
function sendTelemetry(equipmentId, data) {
  const clients = telemetryClients.get(String(equipmentId));
  if (clients) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => client.write(msg));
  }
}

// wyslij aktywnosc do wszystkich
function sendActivity(activity) {
  const msg = `data: ${JSON.stringify(activity)}\n\n`;
  activityClients.forEach(client => client.write(msg));
}

module.exports = {
  router,
  sendTelemetry,
  sendActivity
};
