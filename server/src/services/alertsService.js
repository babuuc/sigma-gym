// serwis alertow z progami i auto-ticketami
const ticketsDao = require('../dao/ticketsDao');
const equipmentDao = require('../dao/equipmentDao');
const { sendCommand, getMqttClient } = require('./mqttService');
const { emitAlert } = require('./socketService');
const { sendActivity } = require('../routes/stream');

// progi alertow
const THRESHOLDS = {
  temperature: {
    max: 35,
    message: 'temperatura przekroczona'
  },
  vibration: {
    max: 80,
    message: 'wibracje przekroczone'
  }
};

// sprawdz telemetrie pod katem alertow
function checkTelemetry(equipmentId, data) {
  const equipment = equipmentDao.getById(equipmentId);
  if (!equipment) return;

  // sprawdz temperature
  if (data.temperature && data.temperature > THRESHOLDS.temperature.max) {
    triggerAlert(equipment, 'temperature', data.temperature);
  }

  // sprawdz wibracje
  if (data.vibration && data.vibration > THRESHOLDS.vibration.max) {
    triggerAlert(equipment, 'vibration', data.vibration);
  }
}

// wyzwol alert
function triggerAlert(equipment, type, value) {
  const threshold = THRESHOLDS[type];
  const now = new Date().toISOString();

  console.log(`alert: ${type} = ${value} dla sprzetu ${equipment.name}`);

  // sprawdz czy nie ma otwartego ticketa
  const openTicket = ticketsDao.getOpenByEquipment(equipment.id);

  if (!openTicket) {
    // utworz nowy ticket high priority
    const ticketId = ticketsDao.create({
      equipment_id: equipment.id,
      title: `${threshold.message} - ${equipment.name}`,
      description: `${type}: ${value.toFixed(2)}, prog: ${threshold.max}`,
      priority: 'high',
      status: 'open'
    });
    console.log(`utworzono ticket high #${ticketId}`);

    // wyslij do activity feed
    sendActivity({
      type: 'ticket',
      message: `utworzono ticket serwisowy: ${threshold.message}`,
      timestamp: now
    });
  }

  // wyslij komende lock do sprzetu
  sendCommand(equipment.id, { command: 'lock' });

  // zaktualizuj status w bazie
  equipmentDao.update(equipment.id, {
    locked: 1,
    status: 'locked'
  });

  // publikuj alert mqtt
  const client = getMqttClient();
  if (client && client.connected) {
    client.publish('smartgym/alerts', JSON.stringify({
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      type: type,
      value: value,
      threshold: threshold.max,
      message: threshold.message,
      timestamp: now
    }));
  }

  // wyslij alert przez ws
  emitAlert({
    equipment_id: equipment.id,
    equipment_name: equipment.name,
    type: type,
    value: value,
    message: threshold.message,
    timestamp: now
  });

  // wyslij do activity feed
  sendActivity({
    type: 'alert',
    message: `${threshold.message} na ${equipment.name}: ${value.toFixed(2)}`,
    timestamp: now
  });
}

module.exports = {
  checkTelemetry,
  THRESHOLDS
};
