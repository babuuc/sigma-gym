// dao dla sprzetu
const db = require('../db');

const equipmentDao = {
  // pobierz wszystko
  getAll() {
    return db.prepare('SELECT * FROM equipment').all();
  },

  // pobierz po id
  getById(id) {
    return db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  },

  // szukaj po nazwie
  search(pattern) {
    return db.prepare('SELECT * FROM equipment WHERE name LIKE ?').all(`%${pattern}%`);
  },

  // utworz nowy
  create(eq) {
    const stmt = db.prepare(
      'INSERT INTO equipment (name, type, zone, status, locked) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(eq.name, eq.type, eq.zone, eq.status || 'online', eq.locked || 0);
    return result.lastInsertRowid;
  },

  // aktualizuj
  update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.zone !== undefined) { fields.push('zone = ?'); values.push(data.zone); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.locked !== undefined) { fields.push('locked = ?'); values.push(data.locked); }
    if (data.last_seen !== undefined) { fields.push('last_seen = ?'); values.push(data.last_seen); }

    if (fields.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  // usun
  delete(id) {
    return db.prepare('DELETE FROM equipment WHERE id = ?').run(id).changes > 0;
  }
};

module.exports = equipmentDao;
