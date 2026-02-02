// serwis mqtt dla komunikacji z urzadzeniami
const mqtt = require('mqtt');
const equipmentDao = require('../dao/equipmentDao');
const readingsDao = require('../dao/readingsDao');
const { emitEquipmentUpdate, emitAlert } = require('./socketService');
const { sendTelemetry, sendActivity } = require('../routes/stream');

// lazy load zeby uniknac circular dependency
let alertsService = null;
function getAlertsService() {
  if (!alertsService) {
    alertsService = require('./alertsService');
  }
  return alertsService;
}

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
let client = null;

function initMqtt() {
  client = mqtt.connect(BROKER_URL, {
    clientId: `sigma-backend-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000
  });

  client.on('connect', () => {
    console.log('mqtt polaczono z brokerem');

    // subskrybuj tematy
    client.subscribe('smartgym/equipment/+/telemetry');
    client.subscribe('smartgym/equipment/+/status');
    client.subscribe('smartgym/alerts');
  });

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(topic, data);
    } catch (err) {
      console.log('mqtt blad parsowania:', err.message);
    }
  });

  client.on('error', (err) => {
    console.log('mqtt blad:', err.message);
  });

  client.on('offline', () => {
    console.log('mqtt offline');
  });

  return client;
}

// obsluga wiadomosci
function handleMessage(topic, data) {
  const parts = topic.split('/');

  // telemetria sprzetu
  if (parts[2] && parts[3] === 'telemetry') {
    const equipmentId = parts[2];
    handleTelemetry(equipmentId, data);
  }

  // status sprzetu online/offline
  if (parts[2] && parts[3] === 'status') {
    const equipmentId = parts[2];
    handleStatus(equipmentId, data);
  }

  // alerty
  if (topic === 'smartgym/alerts') {
    handleAlert(data);
  }
}

// obsluga telemetrii
function handleTelemetry(equipmentId, data) {
  // zapisz do bazy
  readingsDao.create({
    equipment_id: equipmentId,
    temperature: data.temperature,
    vibration: data.vibration,
    usage_count: data.usage_count
  });

  // zaktualizuj last_seen
  const equipment = equipmentDao.getById(equipmentId);
  if (equipment) {
    equipmentDao.update(equipmentId, {
      last_seen: new Date().toISOString()
    });

    // wyslij do klientow sse
    sendTelemetry(equipmentId, data);

    // wyslij do ws w strefie
    emitEquipmentUpdate(equipment.zone, {
      ...equipment,
      telemetry: data
    });

    // sprawdz progi alertow
    getAlertsService().checkTelemetry(equipmentId, data);
  }

  console.log(`mqtt telemetria sprzetu ${equipmentId}:`, data);
}

// obsluga statusu
function handleStatus(equipmentId, data) {
  const equipment = equipmentDao.getById(equipmentId);
  if (!equipment) return;

  const status = data.status || 'offline';
  const now = new Date().toISOString();

  equipmentDao.update(equipmentId, {
    status: status,
    last_seen: now
  });

  // powiadom przez ws
  emitEquipmentUpdate(equipment.zone, {
    ...equipment,
    status: status
  });

  // wyslij do activity feed
  sendActivity({
    type: 'status',
    message: `sprzet ${equipment.name} zmienil status na ${status}`,
    timestamp: now
  });

  console.log(`mqtt status sprzetu ${equipmentId}: ${status}`);
}

// obsluga alertow
function handleAlert(data) {
  // wyslij alert przez ws do wszystkich
  emitAlert(data);

  // wyslij do activity feed
  sendActivity({
    type: 'alert',
    message: data.message || 'alert od urzadzenia',
    timestamp: new Date().toISOString()
  });

  console.log('mqtt alert:', data);
}

// wyslij komende do sprzetu
function sendCommand(equipmentId, command) {
  if (client && client.connected) {
    const topic = `smartgym/equipment/${equipmentId}/command`;
    client.publish(topic, JSON.stringify(command));
    console.log(`mqtt wyslano komende do ${equipmentId}:`, command);
    return true;
  }
  return false;
}

// pobierz klienta
function getMqttClient() {
  return client;
}

module.exports = {
  initMqtt,
  sendCommand,
  getMqttClient
};
