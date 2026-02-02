# Sigma Gym

System zarzadzania silownia z monitoringiem sprzetu.

## Uruchomienie

```bash
cd server
npm install
npm run dev
```

## Endpointy

- `POST /api/auth/login` - logowanie
- `POST /api/auth/logout` - wylogowanie
- `GET /api/users` - lista uzytkownikow (admin)
- `GET /api/equipment` - lista sprzetu
- `GET /api/equipment/search/:pattern` - szukaj sprzetu

## Domyslny admin

login: `admin`  
haslo: `admin`
