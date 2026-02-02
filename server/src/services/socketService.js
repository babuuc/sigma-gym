// serwis websocket z socket.io
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  // auth middleware - sprawdz token z ciastka
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.token;

      if (!token) {
        return next(new Error('brak tokena'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('niepoprawny token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('ws polaczono:', socket.user.username);

    // dolacz do strefy
    socket.on('joinZone', (zone) => {
      socket.join(`zone:${zone}`);
      console.log(`${socket.user.username} dolaczyl do strefy ${zone}`);
    });

    // opusc strefe
    socket.on('leaveZone', (zone) => {
      socket.leave(`zone:${zone}`);
      console.log(`${socket.user.username} opuscil strefe ${zone}`);
    });

    socket.on('disconnect', () => {
      console.log('ws rozlaczono:', socket.user.username);
    });
  });

  return io;
}

// wyslij update sprzetu do strefy
function emitEquipmentUpdate(zone, equipment) {
  if (io) {
    io.to(`zone:${zone}`).emit('equipmentUpdate', equipment);
  }
}

// wyslij alert do wszystkich
function emitAlert(alert) {
  if (io) {
    io.emit('alert', alert);
  }
}

// pobierz instancje io
function getIO() {
  return io;
}

module.exports = {
  initSocket,
  emitEquipmentUpdate,
  emitAlert,
  getIO
};
