// crud dla zgloszenia serwisowe
const express = require('express');
const ticketsDao = require('../dao/ticketsDao');
const equipmentDao = require('../dao/equipmentDao');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

const router = express.Router();

// pobierz wszystko - kazdy zalogowany
router.get('/', authMiddleware, (req, res) => {
  const tickets = ticketsDao.getAll();
  res.json(tickets);
});

// pobierz jeden - kazdy zalogowany
router.get('/:id', authMiddleware, (req, res) => {
  const ticket = ticketsDao.getById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json(ticket);
});

// utworz - kazdy zalogowany
router.post('/', authMiddleware, (req, res) => {
  const { equipment_id, title, description, priority } = req.body;

  if (!equipment_id || !title) {
    return res.status(400).json({ error: 'podaj equipment_id i title' });
  }

  // sprawdz czy sprzet istnieje
  const eq = equipmentDao.getById(equipment_id);
  if (!eq) {
    return res.status(400).json({ error: 'sprzet nie istnieje' });
  }

  const id = ticketsDao.create({
    equipment_id,
    title,
    description,
    priority
  });

  res.status(201).json({ id, equipment_id, title, description, priority, status: 'open' });
});

// aktualizuj - staff i admin
router.put('/:id', authMiddleware, roleMiddleware('admin', 'staff'), (req, res) => {
  const updated = ticketsDao.update(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json({ message: 'zaktualizowano' });
});

// zamknij ticket - staff i admin
router.post('/:id/close', authMiddleware, roleMiddleware('admin', 'staff'), (req, res) => {
  const ticket = ticketsDao.getById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  if (ticket.status === 'closed') {
    return res.status(400).json({ error: 'ticket juz zamkniety' });
  }

  const closed = ticketsDao.close(req.params.id);
  if (!closed) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }

  res.json({ message: 'zamknieto ticket' });
});

// usun - tylko admin
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const deleted = ticketsDao.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'nie znaleziono' });
  }
  res.json({ message: 'usunieto' });
});

module.exports = router;
