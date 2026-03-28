# BloodLink Backend

## Prerequisites
- Docker
- Docker Compose

## Starting the stack

```bash
docker-compose up -d
```

## Services & ports
| Service    | Port | Notes                                   |
|------------|------|-----------------------------------------|
| Keycloak   | 8080 | Identity provider / auth server         |
| API        | 8082 | BloodLink REST API (Express + Node 20)  |
| PostgreSQL | 5432 | Databases: `bloodlink` (app), `keycloak`|

## Admin UI
- URL: `http://YOUR_VPS_IP:8080`
- Credentials: `admin` / `Admin1234!`

## Test user
- Email: `test@bloodlink.com`
- Password: `Test1234!`

## Notes
- Replace `YOUR_VPS_IP` in `constants/config.ts` and `.env.example` with the actual public IP of your server.
- On first boot Keycloak will import the realm from `keycloak/realm.json` automatically.
- The database schema and seed data are applied from `backend/init.sql` on first container start.
