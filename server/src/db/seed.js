// seed danych poczatkowych
const bcrypt = require('bcrypt');
const db = require('./index');

async function seed() {
  // sprawdz czy admin istnieje
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!admin) {
    const hash = await bcrypt.hash('admin', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
    console.log('utworzono admina');
  } else {
    console.log('admin juz istnieje');
  }
}

module.exports = seed;
