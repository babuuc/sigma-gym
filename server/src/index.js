require('dotenv').config();
const express = require('express');
const http = require('http');
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

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

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
