// symulator sprzetu gym publikujacy telemetrie mqtt
const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
const EQUIPMENT_ID = process.argv[2] || '1';
const INTERVAL = parseInt(process.argv[3]) || 5000;

console.log(`symulator sprzetu ${EQUIPMENT_ID}, interwał ${INTERVAL}ms`);

// polaczenie z last will
const client = mqtt.connect(BROKER_URL, {
  clientId: `simulator-${EQUIPMENT_ID}-${Date.now()}`,
  clean: true,
  will: {
    topic: `smartgym/equipment/${EQUIPMENT_ID}/status`,
    payload: JSON.stringify({ status: 'offline' }),
    qos: 1,
    retain: false
  }
});

client.on('connect', () => {
  console.log('polaczono z brokerem mqtt');

  // wyslij status online
  publishStatus('online');

  // subskrybuj komendy
  client.subscribe(`smartgym/equipment/${EQUIPMENT_ID}/command`);

  // zacznij wysylac telemetrie
  setInterval(publishTelemetry, INTERVAL);
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log('otrzymano komende:', data);
    handleCommand(data);
  } catch (err) {
    console.log('blad parsowania komendy');
  }
});

client.on('error', (err) => {
  console.log('blad mqtt:', err.message);
});

// publikuj telemetrie
function publishTelemetry() {
  // symuluj losowe dane
  const telemetry = {
    temperature: 20 + Math.random() * 15,
    vibration: Math.random() * 100,
    usage_count: Math.floor(Math.random() * 1000)
  };

  const topic = `smartgym/equipment/${EQUIPMENT_ID}/telemetry`;
  client.publish(topic, JSON.stringify(telemetry));
  console.log('telemetria:', telemetry);
}

// publikuj status
function publishStatus(status) {
  const topic = `smartgym/equipment/${EQUIPMENT_ID}/status`;
  client.publish(topic, JSON.stringify({ status }));
  console.log('status:', status);
}

// obsluga komend
function handleCommand(data) {
  switch (data.command) {
    case 'lock':
      console.log('sprzet zablokowany');
      publishStatus('locked');
      break;
    case 'unlock':
      console.log('sprzet odblokowany');
      publishStatus('online');
      break;
    case 'reset':
      console.log('sprzet zresetowany');
      publishStatus('online');
      break;
    default:
      console.log('nieznana komenda:', data.command);
  }
}

// graceful shutdown
process.on('SIGINT', () => {
  console.log('zamykanie symulatora...');
  publishStatus('offline');
  setTimeout(() => {
    client.end();
    process.exit(0);
  }, 500);
});

console.log('uruchamianie symulatora...');
