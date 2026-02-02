// crud dla uzytkownikow tylko admin
const express = require('express');
const bcrypt = require('bcrypt');
const usersDao = require('../dao/usersDao');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

const router = express.Router();

// wszystkie endpointy wymagaja zalogowania i roli admin
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// pobierz wszystkich
router.get('/', (req, res) => {
  const users = usersDao.getAll();
  res.json(users);
});

// pobierz jednego
router.get('/:id', (req, res) => {
  const user = usersDao.getById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json(user);
});

// utworz nowego
router.post('/', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'podaj login i haslo' });
  }

  const existing = usersDao.getByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'taki login juz istnieje' });
  }

  const hash = await bcrypt.hash(password, 10);
  const id = usersDao.create({ username, password: hash, role: role || 'member' });

  res.status(201).json({ id, username, role: role || 'member' });
});

// aktualizuj
router.put('/:id', async (req, res) => {
  const { username, password, role } = req.body;
  const data = {};

  if (username) data.username = username;
  if (role) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);

  const updated = usersDao.update(req.params.id, data);
  if (!updated) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  res.json({ message: 'zaktualizowano' });
});

// usun
router.delete('/:id', (req, res) => {
  const deleted = usersDao.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json({ message: 'usunieto' });
});

module.exports = router;
