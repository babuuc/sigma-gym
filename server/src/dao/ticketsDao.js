// dao dla zgloszenia serwisowe
const db = require('../db');

const ticketsDao = {
  // pobierz wszystko
  getAll() {
    return db.prepare('SELECT * FROM tickets').all();
  },

  // pobierz po id
  getById(id) {
    return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  },

  // pobierz otwarte dla sprzetu
  getOpenByEquipment(equipmentId) {
    return db.prepare(
      'SELECT * FROM tickets WHERE equipment_id = ? AND status = ?'
    ).get(equipmentId, 'open');
  },

  // utworz nowy
  create(ticket) {
    const stmt = db.prepare(
      'INSERT INTO tickets (equipment_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      ticket.equipment_id,
      ticket.title,
      ticket.description || null,
      ticket.priority || 'normal',
      ticket.status || 'open'
    );
    return result.lastInsertRowid;
  },

  // aktualizuj
  update(id, data) {
    const fields = [];
    const values = [];

    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.closed_at !== undefined) { fields.push('closed_at = ?'); values.push(data.closed_at); }

    if (fields.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  // zamknij ticket
  close(id) {
    const stmt = db.prepare(
      'UPDATE tickets SET status = ?, closed_at = ? WHERE id = ?'
    );
    return stmt.run('closed', new Date().toISOString(), id).changes > 0;
  },

  // usun
  delete(id) {
    return db.prepare('DELETE FROM tickets WHERE id = ?').run(id).changes > 0;
  }
};

module.exports = ticketsDao;
