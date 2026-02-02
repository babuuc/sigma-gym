// crud dla sprzetu
const express = require('express');
const equipmentDao = require('../dao/equipmentDao');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

const router = express.Router();

// pobierz wszystko - kazdy zalogowany
router.get('/', authMiddleware, (req, res) => {
  const equipment = equipmentDao.getAll();
  res.json(equipment);
});

// szukaj po nazwie - kazdy zalogowany
router.get('/search/:pattern', authMiddleware, (req, res) => {
  const results = equipmentDao.search(req.params.pattern);
  res.json(results);
});

// pobierz jeden - kazdy zalogowany
router.get('/:id', authMiddleware, (req, res) => {
  const eq = equipmentDao.getById(req.params.id);
  if (!eq) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json(eq);
});

// utworz - tylko staff i admin
router.post('/', authMiddleware, roleMiddleware('admin', 'staff'), (req, res) => {
  const { name, type, zone } = req.body;

  if (!name || !type || !zone) {
    return res.status(400).json({ error: 'podaj name type zone' });
  }

  const id = equipmentDao.create({ name, type, zone });
  res.status(201).json({ id, name, type, zone });
});

// aktualizuj - tylko staff i admin
router.put('/:id', authMiddleware, roleMiddleware('admin', 'staff'), (req, res) => {
  const updated = equipmentDao.update(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json({ message: 'zaktualizowano' });
});

// usun - tylko admin
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const deleted = equipmentDao.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json({ message: 'usunieto' });
});

module.exports = router;
