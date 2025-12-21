---
title: "Deployment Guide"
description: "Deploy TVS to production."
---

## Docker Deployment

The easiest way to deploy TVS is with Docker Compose.

### 1. Clone and Configure

```bash
git clone https://github.com/jasonsutter87/Trustless-Voting-System-tvs-.git
cd TVS

# Create environment file
cp .env.example .env
```

Edit `.env`:
```bash
# Generate secure keys
DB_PASSWORD=$(openssl rand -hex 16)
MASTER_KEY=$(openssl rand -hex 32)

# Enable database
USE_DATABASE=true
NODE_ENV=production
```

### 2. Start Services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL**: Database on port 5432
- **API**: Backend on port 3000
- **Nginx**: Frontend on port 8080

### 3. Verify

```bash
# Check health
curl http://localhost:3000/health

# View logs
docker compose logs -f
```

## URLs

| Service | URL |
|---------|-----|
| Admin Dashboard | http://localhost:8080/admin/ |
| Voter Portal | http://localhost:8080/voter/ |
| API | http://localhost:3000/api |
| Health Check | http://localhost:3000/health |

## Production Checklist

- [ ] Set strong `DB_PASSWORD`
- [ ] Set strong `MASTER_KEY`
- [ ] Configure SSL/TLS certificates
- [ ] Set up reverse proxy (Caddy, Traefik)
- [ ] Enable firewall rules
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Review security guide

## SSL with Caddy

```caddyfile
tvs.yourdomain.edu {
    reverse_proxy localhost:8080

    handle /api/* {
        reverse_proxy localhost:3000
    }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | PostgreSQL connection | local |
| `USE_DATABASE` | Use PostgreSQL | false |
| `MASTER_KEY` | Encryption key | dev key |
| `VEILFORMS_API_URL` | VeilForms API | - |
| `VEILFORMS_API_KEY` | VeilForms key | - |

## Scaling

For high-traffic elections:

1. **Database**: Use managed PostgreSQL (RDS, Cloud SQL)
2. **API**: Run multiple instances behind load balancer
3. **CDN**: Serve static assets from CDN
4. **Caching**: Add Redis for session caching

## Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U tvs tvs > backup.sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U tvs tvs
```
