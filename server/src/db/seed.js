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
  }

  // dodaj demo uzytkownikow
  const staff = db.prepare('SELECT id FROM users WHERE username = ?').get('staff');
  if (!staff) {
    const hash = await bcrypt.hash('staff', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('staff', hash, 'staff');
    console.log('utworzono staff');
  }

  const member = db.prepare('SELECT id FROM users WHERE username = ?').get('member');
  if (!member) {
    const hash = await bcrypt.hash('member', 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('member', hash, 'member');
    console.log('utworzono member');
  }

  // dodaj demo sprzet
  const equipmentCount = db.prepare('SELECT COUNT(*) as cnt FROM equipment').get().cnt;
  if (equipmentCount === 0) {
    const equipment = [
      { name: 'Bieznia 1', type: 'cardio', zone: 'cardio' },
      { name: 'Bieznia 2', type: 'cardio', zone: 'cardio' },
      { name: 'Rower stacjonarny 1', type: 'cardio', zone: 'cardio' },
      { name: 'Orbitrek 1', type: 'cardio', zone: 'cardio' },
      { name: 'Wyciskanie lezac', type: 'silowy', zone: 'silownia' },
      { name: 'Suwnica Smitha', type: 'silowy', zone: 'silownia' },
      { name: 'Wyciag gorny', type: 'silowy', zone: 'silownia' },
      { name: 'Prasa do nog', type: 'silowy', zone: 'silownia' },
      { name: 'Hantle 5-30kg', type: 'wolne', zone: 'strefa-wolna' },
      { name: 'Sztanga olimpijska', type: 'wolne', zone: 'strefa-wolna' }
    ];

    const stmt = db.prepare('INSERT INTO equipment (name, type, zone, status) VALUES (?, ?, ?, ?)');
    equipment.forEach(eq => {
      stmt.run(eq.name, eq.type, eq.zone, 'online');
    });
    console.log('dodano demo sprzet');
  }

  console.log('seed zakonczony');
}

module.exports = seed;
