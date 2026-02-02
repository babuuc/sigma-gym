// endpointy odczytu telemetrii
const express = require('express');
const readingsDao = require('../dao/readingsDao');
const equipmentDao = require('../dao/equipmentDao');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// pobierz odczyty dla sprzetu - kazdy zalogowany
router.get('/equipment/:id', authMiddleware, (req, res) => {
  const eq = equipmentDao.getById(req.params.id);
  if (!eq) {
    return res.status(404).json({ error: 'sprzet nie istnieje' });
  }

  const limit = parseInt(req.query.limit) || 100;
  const readings = readingsDao.getByEquipment(req.params.id, limit);
  res.json(readings);
});

// pobierz ostatni odczyt dla sprzetu - kazdy zalogowany
router.get('/equipment/:id/latest', authMiddleware, (req, res) => {
  const eq = equipmentDao.getById(req.params.id);
  if (!eq) {
    return res.status(404).json({ error: 'sprzet nie istnieje' });
  }

  const reading = readingsDao.getLatest(req.params.id);
  if (!reading) {
    return res.status(404).json({ error: 'brak odczytow' });
  }
  res.json(reading);
});

module.exports = router;
