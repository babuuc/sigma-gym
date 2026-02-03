# Sigma Gym

System zarzadzania silownia z monitoringiem sprzetu IoT.

## Funkcje

- REST API z CRUD dla uzytkownikow, sprzetu, rezerwacji, zgloszenia
- MQTT do telemetrii i komend dla sprzetu
- WebSocket do live updates w strefach
- SSE do streamowania telemetrii i aktywnosci
- Alerty z automatycznymi ticketami i blokowaniem sprzetu

## Wymagania

- Node.js 18+
- Docker (dla MQTT broker)

## Uruchomienie

### 1. Broker MQTT

```bash
docker compose up -d
```

### 2. Backend

```bash
cd server
npm install
npm run dev
```

### 3. Symulator sprzetu (opcjonalnie)

```bash
cd simulators
npm install
cd ..
node simulators/equipment-sim.js 1 5000
```

Argumenty: equipment_id, interval_ms

## Domyslne konta

| login  | haslo  | rola   |
|--------|--------|--------|
| admin  | admin  | admin  |
| staff  | staff  | staff  |
| member | member | member |

## REST API

### Auth

- `POST /api/auth/login` - logowanie (body: username, password)
- `POST /api/auth/logout` - wylogowanie
- `GET /api/auth/me` - aktualny uzytkownik

### Users (admin only)

- `GET /api/users` - lista
- `POST /api/users` - utworz
- `GET /api/users/:id` - pobierz
- `PUT /api/users/:id` - aktualizuj
- `DELETE /api/users/:id` - usun

### Equipment

- `GET /api/equipment` - lista
- `POST /api/equipment` - utworz
- `GET /api/equipment/:id` - pobierz
- `PUT /api/equipment/:id` - aktualizuj
- `DELETE /api/equipment/:id` - usun
- `GET /api/equipment/search/:pattern` - szukaj po nazwie

### Reservations

- `GET /api/reservations` - lista
- `POST /api/reservations` - utworz (sprawdza konflikty)
- `GET /api/reservations/:id` - pobierz
- `PUT /api/reservations/:id` - aktualizuj
- `DELETE /api/reservations/:id` - usun

### Tickets

- `GET /api/tickets` - lista
- `POST /api/tickets` - utworz
- `GET /api/tickets/:id` - pobierz
- `PUT /api/tickets/:id` - aktualizuj
- `DELETE /api/tickets/:id` - usun
- `POST /api/tickets/:id/close` - zamknij

### Readings

- `GET /api/readings/:equipmentId` - odczyty telemetrii
- `GET /api/readings/:equipmentId/latest` - ostatni odczyt

## SSE Streams

- `GET /api/stream/equipment/:id` - stream telemetrii sprzetu
- `GET /api/stream/activity` - stream aktywnosci

## WebSocket

Polaczenie: `ws://localhost:3000` (wymaga cookie z tokenem)

Events:
- `joinZone` - dolacz do strefy
- `leaveZone` - opusc strefe
- `equipmentUpdate` - update sprzetu w strefie
- `alert` - alert systemowy

## MQTT Topics

- `smartgym/equipment/{id}/telemetry` - dane z sensorow
- `smartgym/equipment/{id}/status` - status online/offline
- `smartgym/equipment/{id}/command` - komendy do sprzetu
- `smartgym/alerts` - alerty systemowe

### Komendy

- `{"command": "lock"}` - zablokuj sprzet
- `{"command": "unlock"}` - odblokuj sprzet
- `{"command": "reset"}` - resetuj sprzet

## Alerty

System automatycznie:
- Tworzy ticket high priority gdy temperatura > 35C lub wibracje > 80
- Wysyla komende lock do sprzetu
- Powiadamia przez WS i SSE

## HTTPS (opcjonalnie)

### Generowanie certyfikatow

```bash
cd server
node scripts/generate-certs.js
```

### Uruchomienie z HTTPS

```bash
USE_HTTPS=true npm run dev
```

Serwer bedzie dostepny na https://localhost:3000

## Preferencje UI

API do zapisywania preferencji uzytkownika w cookies:

- `GET /api/preferences` - pobierz preferencje
- `POST /api/preferences/zone` - zapisz ostatnia strefe
- `POST /api/preferences/theme` - zapisz motyw (light/dark)
- `DELETE /api/preferences` - wyczysc

## Strony klienta

- `/` - logowanie
- `/dashboard.html` - dashboard z live updates
- `/equipment.html` - zarzadzanie sprzetem
- `/reservations.html` - rezerwacje
- `/tickets.html` - zgloszenia serwisowe
- `/telemetry.html` - telemetria SSE

## Testowanie z curl

```bash
# logowanie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin\"}"

# pobranie sprzetu
curl -b cookies.txt http://localhost:3000/api/equipment

# wyszukiwanie
curl -b cookies.txt http://localhost:3000/api/equipment/search/rower
```
