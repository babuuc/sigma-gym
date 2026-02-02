// skrypt do generowania self-signed certyfikatow
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '../certs');

// utworz folder certs
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

// sprawdz czy certyfikaty istnieja
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('certyfikaty juz istnieja');
  process.exit(0);
}

console.log('generowanie self-signed certyfikatow...');

try {
  // generuj klucz i certyfikat openssl
  const cmd = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('certyfikaty wygenerowane w', certsDir);
} catch (err) {
  console.log('blad generowania certyfikatow:', err.message);
  console.log('upewnij sie ze openssl jest zainstalowany');
  process.exit(1);
}
