// crud dla rezerwacji
const express = require('express');
const reservationsDao = require('../dao/reservationsDao');
const equipmentDao = require('../dao/equipmentDao');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

const router = express.Router();

// pobierz wszystko - staff i admin
router.get('/', authMiddleware, roleMiddleware('admin', 'staff'), (req, res) => {
  const reservations = reservationsDao.getAll();
  res.json(reservations);
});

// pobierz jedna - kazdy zalogowany
router.get('/:id', authMiddleware, (req, res) => {
  const reservation = reservationsDao.getById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json(reservation);
});

// utworz - kazdy zalogowany
router.post('/', authMiddleware, (req, res) => {
  const { equipment_id, start_time, end_time } = req.body;

  if (!equipment_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'podaj equipment_id start_time end_time' });
  }

  // sprawdz czy sprzet istnieje
  const eq = equipmentDao.getById(equipment_id);
  if (!eq) {
    return res.status(400).json({ error: 'sprzet nie istnieje' });
  }

  // sprawdz konflikt czasowy
  const conflict = reservationsDao.checkConflict(equipment_id, start_time, end_time);
  if (conflict) {
    return res.status(409).json({ error: 'konflikt rezerwacji' });
  }

  const id = reservationsDao.create({
    user_id: req.user.id,
    equipment_id,
    start_time,
    end_time
  });

  res.status(201).json({ id, user_id: req.user.id, equipment_id, start_time, end_time });
});

// aktualizuj - wlasciciel lub staff/admin
router.put('/:id', authMiddleware, (req, res) => {
  const reservation = reservationsDao.getById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  // sprawdz uprawnienia
  if (reservation.user_id !== req.user.id && !['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ error: 'brak uprawnien' });
  }

  const { equipment_id, start_time, end_time } = req.body;

  // sprawdz konflikt jesli zmiana czasu lub sprzetu
  if (equipment_id || start_time || end_time) {
    const eqId = equipment_id || reservation.equipment_id;
    const start = start_time || reservation.start_time;
    const end = end_time || reservation.end_time;

    const conflict = reservationsDao.checkConflict(eqId, start, end, req.params.id);
    if (conflict) {
      return res.status(409).json({ error: 'konflikt rezerwacji' });
    }
  }

  const updated = reservationsDao.update(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  res.json({ message: 'zaktualizowano' });
});

// usun - wlasciciel lub staff/admin
router.delete('/:id', authMiddleware, (req, res) => {
  const reservation = reservationsDao.getById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  // sprawdz uprawnienia
  if (reservation.user_id !== req.user.id && !['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ error: 'brak uprawnien' });
  }

  const deleted = reservationsDao.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  res.json({ message: 'usunieto' });
});

module.exports = router;
