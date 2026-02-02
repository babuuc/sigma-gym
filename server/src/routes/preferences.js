// routes dla preferencji ui zapisywanych w cookie
const express = require('express');

const router = express.Router();

// pobierz preferencje z cookie
router.get('/', (req, res) => {
  const prefs = {
    lastZone: req.cookies.lastZone || null,
    theme: req.cookies.theme || 'light'
  };
  res.json(prefs);
});

// zapisz ostatnia strefe
router.post('/zone', (req, res) => {
  const { zone } = req.body;
  if (!zone) {
    return res.status(400).json({ error: 'brak strefy' });
  }

  res.cookie('lastZone', zone, {
    httpOnly: false,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dni
  });

  res.json({ message: 'zapisano', zone });
});

// zapisz motyw
router.post('/theme', (req, res) => {
  const { theme } = req.body;
  if (!theme || !['light', 'dark'].includes(theme)) {
    return res.status(400).json({ error: 'niepoprawny motyw' });
  }

  res.cookie('theme', theme, {
    httpOnly: false,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  res.json({ message: 'zapisano', theme });
});

// wyczysc preferencje
router.delete('/', (req, res) => {
  res.clearCookie('lastZone');
  res.clearCookie('theme');
  res.json({ message: 'wyczyszczono preferencje' });
});

module.exports = router;
