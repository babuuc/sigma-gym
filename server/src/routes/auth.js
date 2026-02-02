// endpointy logowania i wylogowania
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersDao = require('../dao/usersDao');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'podaj login i haslo' });
  }

  const user = usersDao.getByUsername(username);

  if (!user) {
    return res.status(401).json({ error: 'zly login lub haslo' });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ error: 'zly login lub haslo' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  res.json({ message: 'zalogowano', user: { id: user.id, username: user.username, role: user.role } });
});

// logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'wylogowano' });
});

// sprawdz kto jest zalogowany
router.get('/me', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'niezalogowany' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ error: 'niepoprawny token' });
  }
});

module.exports = router;
