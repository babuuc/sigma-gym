// middleware sprawdza role uzytkownika
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'niezalogowany' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'brak uprawnien' });
    }

    next();
  };
}

module.exports = roleMiddleware;
