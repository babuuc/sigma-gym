// polaczenie z baza sqlite
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/gym.db');
const db = new Database(dbPath);

// wlacz foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;
