require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const migrate = require('./db/migrate');
const seed = require('./db/seed');
const { initSocket } = require('./services/socketService');
const { initMqtt } = require('./services/mqttService');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const equipmentRoutes = require('./routes/equipment');
const reservationsRoutes = require('./routes/reservations');
const ticketsRoutes = require('./routes/tickets');
const readingsRoutes = require('./routes/readings');
const { router: streamRoutes } = require('./routes/stream');
const preferencesRoutes = require('./routes/preferences');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// utworz serwer http lub https
let server;
if (USE_HTTPS) {
  const certsDir = path.join(__dirname, '../certs');
  const keyPath = path.join(certsDir, 'server.key');
  const certPath = path.join(certsDir, 'server.cert');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    server = https.createServer(options, app);
    logger.info('HTTPS mode enabled');
  } else {
    logger.warn('certyfikaty nie znalezione, uzywam HTTP');
    server = http.createServer(app);
  }
} else {
  server = http.createServer(app);
}

// uruchom migracje i seed
migrate();
seed();

// inicjalizuj socket.io
initSocket(server);

// middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// static files
app.use(express.static(path.join(__dirname, '../../client')));

// health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/preferences', preferencesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// error handler
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // inicjalizuj mqtt
  initMqtt();
});
