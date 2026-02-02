// dao dla uzytkownikow
const db = require('../db');

const usersDao = {
  // pobierz wszystkich
  getAll() {
    return db.prepare('SELECT id, username, role, created_at FROM users').all();
  },

  // pobierz po id
  getById(id) {
    return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
  },

  // pobierz po nazwie z haslem
  getByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  // utworz nowego
  create(user) {
    const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
    const result = stmt.run(user.username, user.password, user.role || 'member');
    return result.lastInsertRowid;
  },

  // aktualizuj
  update(id, data) {
    const fields = [];
    const values = [];
    
    if (data.username) {
      fields.push('username = ?');
      values.push(data.username);
    }
    if (data.password) {
      fields.push('password = ?');
      values.push(data.password);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values).changes > 0;
  },

  // usun
  delete(id) {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id).changes > 0;
  }
};

module.exports = usersDao;
