# Self-Hosting VDO.Ninja with Docker

Complete guide to deploying your own VDO.Ninja instance using Docker.

## Table of Contents

- [Why Self-Host VDO.Ninja?](#why-self-host-vdoninja)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Why Self-Host VDO.Ninja?

### Benefits
- ✅ **Full control** over your video infrastructure
- ✅ **Custom branding** and UI modifications
- ✅ **Privacy** - keep video metadata on your servers
- ✅ **Compliance** - meet HIPAA, GDPR, or SOC 2 requirements
- ✅ **No third-party dependencies** for uptime
- ✅ **Custom features** - modify the codebase as needed

### Costs
- Server hosting: $10-50/month
- Domain name: $10-20/year
- SSL certificate: Free (Let's Encrypt)
- **Total**: ~$15-60/month

---

## Prerequisites

### Required
- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain name (e.g., `vdo.yourdomain.com`)
- 2GB RAM minimum
- 10GB disk space
- Ubuntu 20.04+ / Debian 11+ (recommended)

### Optional
- Reverse proxy (Nginx/Traefik)
- SSL certificate (Let's Encrypt)

### Check Docker Installation

```bash
# Check Docker version
docker --version
# Should output: Docker version 20.10.x or higher

# Check Docker Compose version
docker compose version
# Should output: Docker Compose version v2.x.x or higher

# Test Docker
docker run hello-world
```

If Docker is not installed:

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

---

## Quick Start

### 1. Clone VDO.Ninja Repository

```bash
# Create directory
mkdir -p ~/vdo-ninja
cd ~/vdo-ninja

# Clone repository
git clone https://github.com/steveseguin/vdo.ninja.git
cd vdo.ninja
```

### 2. Create Docker Configuration

Create `Dockerfile`:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy application files
COPY . .

# Install npm dependencies
RUN npm install

# Expose port
EXPOSE 443

# Start application
CMD ["node", "server.js"]
```

### 3. Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  vdo-ninja:
    build: .
    container_name: vdo-ninja
    restart: unless-stopped
    ports:
      - "443:443"
    environment:
      - NODE_ENV=production
      - PORT=443
    volumes:
      - ./config:/app/config
      - ./certs:/app/certs
    networks:
      - vdo-network

networks:
  vdo-network:
    driver: bridge
```

### 4. Start the Container

```bash
# Build and start
docker compose up -d

# Check logs
docker compose logs -f vdo-ninja

# Check status
docker compose ps
```

### 5. Access VDO.Ninja

Open your browser to:
```
https://localhost:443
```

Or with your domain:
```
https://vdo.yourdomain.com
```

---

## Detailed Setup

### Step 1: Prepare the Server

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
sudo apt-get install -y git curl wget

# Create application user
sudo useradd -m -s /bin/bash vdoninja
sudo usermod -aG docker vdoninja

# Switch to vdoninja user
sudo su - vdoninja
```

### Step 2: Clone and Configure

```bash
# Clone repository
cd ~
git clone https://github.com/steveseguin/vdo.ninja.git
cd vdo.ninja

# Checkout latest stable release
git checkout $(git describe --tags $(git rev-list --tags --max-count=1))
```

### Step 3: Create Configuration Files

Create `config/config.json`:

```json
{
  "port": 443,
  "ssl": true,
  "sslKey": "/app/certs/privkey.pem",
  "sslCert": "/app/certs/fullchain.pem",
  "hostname": "vdo.yourdomain.com",
  "turnServers": [
    {
      "urls": "turn:turn.yourdomain.com:3478",
      "username": "your-username",
      "credential": "your-password"
    }
  ],
  "stunServers": [
    {
      "urls": "stun:stun.l.google.com:19302"
    }
  ]
}
```

### Step 4: Create Advanced Dockerfile

Create `Dockerfile.production`:

```dockerfile
# Multi-stage build for VDO.Ninja
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    tini \
    && addgroup -g 1001 vdoninja \
    && adduser -D -u 1001 -G vdoninja vdoninja

# Copy from builder
COPY --from=builder --chown=vdoninja:vdoninja /app /app

# Switch to non-root user
USER vdoninja

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:443/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port
EXPOSE 443

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "server.js"]
```

### Step 5: Create Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  vdo-ninja:
    build:
      context: .
      dockerfile: Dockerfile.production
    container_name: vdo-ninja
    restart: unless-stopped
    ports:
      - "443:443"
    environment:
      - NODE_ENV=production
      - PORT=443
      - HOSTNAME=vdo.yourdomain.com
    volumes:
      - ./config:/app/config:ro
      - ./certs:/app/certs:ro
      - vdo-data:/app/data
    networks:
      - vdo-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

volumes:
  vdo-data:
    driver: local

networks:
  vdo-network:
    driver: bridge
```

---

## Configuration

### Environment Variables

Create `.env` file:

```bash
# .env
NODE_ENV=production
PORT=443
HOSTNAME=vdo.yourdomain.com

# TURN Server
TURN_URL=turn:turn.yourdomain.com:3478
TURN_USERNAME=your-username
TURN_PASSWORD=your-password

# STUN Server
STUN_URL=stun:stun.l.google.com:19302

# SSL
SSL_KEY=/app/certs/privkey.pem
SSL_CERT=/app/certs/fullchain.pem

# Logging
LOG_LEVEL=info

# Features
ENABLE_RECORDING=false
MAX_ROOM_SIZE=10
```

Update `docker-compose.yml` to use `.env`:

```yaml
services:
  vdo-ninja:
    env_file:
      - .env
    # ... rest of config
```

### Custom Branding

Create `config/custom.css`:

```css
/* Custom branding for VDO.Ninja */

/* Hide default branding */
.branding {
  display: none !important;
}

/* Custom logo */
.logo {
  background-image: url('/assets/your-logo.png') !important;
}

/* Custom colors */
:root {
  --primary-color: #4945ff;
  --secondary-color: #7b79ff;
  --background-color: #ffffff;
  --text-color: #333333;
}

/* Custom button styles */
.button {
  background-color: var(--primary-color) !important;
  border-radius: 8px !important;
}

.button:hover {
  background-color: var(--secondary-color) !important;
}
```

Mount custom files:

```yaml
volumes:
  - ./config/custom.css:/app/public/custom.css:ro
  - ./assets:/app/public/assets:ro
```

---

## SSL/TLS Setup

### Option 1: Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone \
  -d vdo.yourdomain.com \
  --email your@email.com \
  --agree-tos

# Certificates will be in:
# /etc/letsencrypt/live/vdo.yourdomain.com/

# Copy certificates
sudo cp /etc/letsencrypt/live/vdo.yourdomain.com/privkey.pem ~/vdo.ninja/certs/
sudo cp /etc/letsencrypt/live/vdo.yourdomain.com/fullchain.pem ~/vdo.ninja/certs/
sudo chown vdoninja:vdoninja ~/vdo.ninja/certs/*

# Set up auto-renewal
sudo crontab -e
# Add line:
# 0 0 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/vdo.yourdomain.com/*.pem /home/vdoninja/vdo.ninja/certs/ && docker compose -f /home/vdoninja/vdo.ninja/docker-compose.yml restart"
```

### Option 2: Reverse Proxy with Nginx

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name vdo.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vdo.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/vdo.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vdo.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass https://localhost:443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

Docker Compose with Nginx:

```yaml
version: '3.8'

services:
  vdo-ninja:
    # ... vdo-ninja config
    networks:
      - vdo-network

  nginx:
    image: nginx:alpine
    container_name: vdo-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - vdo-network
    depends_on:
      - vdo-ninja
```

---

## Production Deployment

### Complete Production Setup

```bash
# 1. Prepare server
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y docker.io docker-compose-plugin git certbot

# 2. Create deployment directory
sudo mkdir -p /opt/vdo-ninja
cd /opt/vdo-ninja

# 3. Clone repository
sudo git clone https://github.com/steveseguin/vdo.ninja.git .

# 4. Generate SSL certificates
sudo certbot certonly --standalone \
  -d vdo.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive

# 5. Copy certificates
sudo mkdir -p certs
sudo cp /etc/letsencrypt/live/vdo.yourdomain.com/privkey.pem certs/
sudo cp /etc/letsencrypt/live/vdo.yourdomain.com/fullchain.pem certs/

# 6. Create configuration
sudo mkdir -p config
sudo cat > config/config.json <<EOF
{
  "port": 443,
  "ssl": true,
  "sslKey": "/app/certs/privkey.pem",
  "sslCert": "/app/certs/fullchain.pem",
  "hostname": "vdo.yourdomain.com"
}
EOF

# 7. Create environment file
sudo cat > .env <<EOF
NODE_ENV=production
PORT=443
HOSTNAME=vdo.yourdomain.com
EOF

# 8. Build and start
sudo docker compose -f docker-compose.production.yml up -d

# 9. Check logs
sudo docker compose logs -f vdo-ninja

# 10. Test access
curl -k https://vdo.yourdomain.com
```

### Systemd Service

Create `/etc/systemd/system/vdo-ninja.service`:

```ini
[Unit]
Description=VDO.Ninja Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/vdo-ninja
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
ExecReload=/usr/bin/docker compose -f docker-compose.production.yml restart

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable vdo-ninja
sudo systemctl start vdo-ninja
sudo systemctl status vdo-ninja
```

### Monitoring and Logs

```bash
# View logs
docker compose logs -f vdo-ninja

# Check resource usage
docker stats vdo-ninja

# Monitor health
docker inspect --format='{{.State.Health.Status}}' vdo-ninja

# Follow logs with filter
docker compose logs -f vdo-ninja | grep ERROR
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs vdo-ninja

# Common issues:
# 1. Port already in use
sudo netstat -tulpn | grep :443
# Kill process using port or change port in docker-compose.yml

# 2. Permission denied on certificates
sudo chmod 644 certs/*.pem
sudo chown 1001:1001 certs/*.pem

# 3. Missing configuration
ls -la config/config.json
```

### SSL Certificate Errors

```bash
# Verify certificate files exist
ls -la certs/

# Test certificate
openssl x509 -in certs/fullchain.pem -text -noout

# Check certificate expiration
openssl x509 -in certs/fullchain.pem -noout -dates

# Renew certificate
sudo certbot renew --force-renewal
sudo cp /etc/letsencrypt/live/vdo.yourdomain.com/*.pem certs/
docker compose restart vdo-ninja
```

### Cannot Access from Browser

```bash
# 1. Check if container is running
docker compose ps

# 2. Check port binding
docker port vdo-ninja

# 3. Test locally
curl -k https://localhost:443

# 4. Check firewall
sudo ufw status
sudo ufw allow 443/tcp

# 5. Check DNS
nslookup vdo.yourdomain.com

# 6. Test from outside
curl -k https://vdo.yourdomain.com
```

### High CPU/Memory Usage

```bash
# Check resources
docker stats vdo-ninja

# Limit resources in docker-compose.yml:
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G

# Restart with limits
docker compose up -d --force-recreate
```

### WebRTC Connection Fails

```bash
# 1. Check STUN/TURN configuration
docker exec vdo-ninja cat /app/config/config.json

# 2. Test TURN server
# See TURN_SERVER_DOCKER.md

# 3. Check firewall allows UDP
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp

# 4. Verify WebRTC ports in docker-compose.yml
ports:
  - "443:443"
  - "3478:3478/udp"
  - "49152-65535:49152-65535/udp"
```

---

## Updating VDO.Ninja

```bash
# 1. Backup current version
cd /opt/vdo-ninja
docker compose down
sudo tar -czf vdo-ninja-backup-$(date +%Y%m%d).tar.gz .

# 2. Pull latest code
git fetch --tags
git checkout $(git describe --tags $(git rev-list --tags --max-count=1))

# 3. Rebuild container
docker compose build --no-cache

# 4. Start new version
docker compose up -d

# 5. Verify
docker compose logs -f vdo-ninja
curl -k https://vdo.yourdomain.com

# 6. Rollback if needed
# docker compose down
# tar -xzf vdo-ninja-backup-YYYYMMDD.tar.gz
# docker compose up -d
```

---

## Performance Optimization

### Optimize Docker Image

```dockerfile
# Use Alpine for smaller image
FROM node:18-alpine

# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
CMD ["node", "server.js"]
```

### Enable Caching

```yaml
services:
  vdo-ninja:
    # ... other config
    volumes:
      - vdo-cache:/app/.cache

volumes:
  vdo-cache:
```

### Use CDN for Static Assets

Configure Nginx to serve static files:

```nginx
location /static/ {
    alias /app/public/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Security Checklist

- [ ] SSL/TLS enabled and forced
- [ ] Certificates auto-renewal configured
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Docker running as non-root user
- [ ] Environment variables not committed to git
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Security headers configured
- [ ] TURN server with authentication
- [ ] Rate limiting configured
- [ ] Logs monitored for suspicious activity

---

## Next Steps

- **[TURN Server Setup](./TURN_SERVER_DOCKER.md)** - Set up your own TURN server
- **[Complete Self-Hosting Guide](./SELF_HOSTING_GUIDE.md)** - Deploy both together
- **[Configure Plugin](../INSTALLATION.md)** - Point plugin to your instance

---

## Resources

- **VDO.Ninja GitHub**: https://github.com/steveseguin/vdo.ninja
- **VDO.Ninja Docs**: https://docs.vdo.ninja
- **Docker Docs**: https://docs.docker.com
- **Let's Encrypt**: https://letsencrypt.org
