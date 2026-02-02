// dao dla odczytow telemetrii
const db = require('../db');

const readingsDao = {
  // pobierz wszystko dla sprzetu
  getByEquipment(equipmentId, limit = 100) {
    return db.prepare(
      'SELECT * FROM readings WHERE equipment_id = ? ORDER BY recorded_at DESC LIMIT ?'
    ).all(equipmentId, limit);
  },

  // pobierz ostatni odczyt dla sprzetu
  getLatest(equipmentId) {
    return db.prepare(
      'SELECT * FROM readings WHERE equipment_id = ? ORDER BY recorded_at DESC LIMIT 1'
    ).get(equipmentId);
  },

  // zapisz nowy odczyt
  create(reading) {
    const stmt = db.prepare(
      'INSERT INTO readings (equipment_id, temperature, vibration, usage_count) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(
      reading.equipment_id,
      reading.temperature || null,
      reading.vibration || null,
      reading.usage_count || null
    );
    return result.lastInsertRowid;
  }
};

module.exports = readingsDao;
