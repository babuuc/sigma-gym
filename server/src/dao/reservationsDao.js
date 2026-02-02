// dao dla rezerwacji
const db = require('../db');

const reservationsDao = {
  // pobierz wszystko
  getAll() {
    return db.prepare('SELECT * FROM reservations').all();
  },

  // pobierz po id
  getById(id) {
    return db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
  },

  // sprawdz konflikt czasowy
  checkConflict(equipmentId, startTime, endTime, excludeId = null) {
    let query = `
      SELECT * FROM reservations 
      WHERE equipment_id = ? 
      AND NOT (end_time <= ? OR start_time >= ?)
    `;
    const params = [equipmentId, startTime, endTime];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    return db.prepare(query).get(...params);
  },

  // utworz nowa
  create(res) {
    const stmt = db.prepare(
      'INSERT INTO reservations (user_id, equipment_id, start_time, end_time) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(res.user_id, res.equipment_id, res.start_time, res.end_time);
    return result.lastInsertRowid;
  },

  // aktualizuj
  update(id, data) {
    const fields = [];
    const values = [];

    if (data.user_id !== undefined) { fields.push('user_id = ?'); values.push(data.user_id); }
    if (data.equipment_id !== undefined) { fields.push('equipment_id = ?'); values.push(data.equipment_id); }
    if (data.start_time !== undefined) { fields.push('start_time = ?'); values.push(data.start_time); }
    if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }

    if (fields.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  // usun
  delete(id) {
    return db.prepare('DELETE FROM reservations WHERE id = ?').run(id).changes > 0;
  }
};

module.exports = reservationsDao;
