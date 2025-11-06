# Complete Self-Hosting Guide

Deploy VDO.Ninja and TURN server together for a fully self-hosted video calling solution.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Deployment](#quick-deployment)
- [Detailed Setup](#detailed-setup)
- [Complete Docker Compose](#complete-docker-compose)
- [Configuration](#configuration)
- [Testing](#testing)
- [Maintenance](#maintenance)
- [Cost Analysis](#cost-analysis)

---

## Overview

This guide combines:
1. **VDO.Ninja** - WebRTC video calling platform
2. **Coturn TURN Server** - NAT traversal and relay
3. **Nginx** - Reverse proxy and SSL termination
4. **Strapi Plugin** - Your video chat application

### Why Self-Host Everything?

| Benefit | Description |
|---------|-------------|
| **Full Control** | Own your entire infrastructure |
| **Privacy** | All data stays on your servers |
| **Compliance** | Meet HIPAA, GDPR, SOC 2 requirements |
| **Cost-Effective** | ~$30-60/month vs $100s with SaaS |
| **Customization** | Modify any component |
| **Reliability** | No third-party dependencies |

---

## Architecture

```
                    Internet
                        │
                        ▼
                   ┌─────────┐
                   │  Nginx  │ (SSL Termination)
                   │ Port 80 │
                   │ Port 443│
                   └────┬────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
    │  Strapi │    │VDO.Ninja│   │ Coturn  │
    │  :1337  │    │  :8080  │   │ :3478   │
    └─────────┘    └─────────┘   └────┬────┘
                                       │
                                  ┌────▼────┐
                                  │ WebRTC  │
                                  │ P2P/Relay│
                                  └─────────┘
```

---

## Prerequisites

### Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4GB | 8GB |
| **Disk** | 40GB SSD | 80GB SSD |
| **Bandwidth** | 100 Mbps | 1 Gbps |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Domain Requirements

You'll need 3 subdomains:
- `strapi.yourdomain.com` - Strapi application
- `vdo.yourdomain.com` - VDO.Ninja instance
- `turn.yourdomain.com` - TURN server

### Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| VPS (DigitalOcean/AWS) | $20-40 |
| Domain Name | ~$1 |
| Bandwidth (usually included) | $0 |
| SSL Certificates (Let's Encrypt) | $0 |
| **Total** | **$21-41/month** |

---

## Quick Deployment

### All-in-One Deployment Script

Create `deploy-all.sh`:

```bash
#!/bin/bash
set -e

echo "=== Complete Self-Hosted Video Chat Deployment ==="

# Configuration
read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
read -p "Enter your email: " EMAIL
read -p "Enter Strapi subdomain [strapi]: " STRAPI_SUB
read -p "Enter VDO.Ninja subdomain [vdo]: " VDO_SUB
read -p "Enter TURN subdomain [turn]: " TURN_SUB

STRAPI_SUB=${STRAPI_SUB:-strapi}
VDO_SUB=${VDO_SUB:-vdo}
TURN_SUB=${TURN_SUB:-turn}

STRAPI_DOMAIN="$STRAPI_SUB.$DOMAIN"
VDO_DOMAIN="$VDO_SUB.$DOMAIN"
TURN_DOMAIN="$TURN_SUB.$DOMAIN"

PUBLIC_IP=$(curl -s ifconfig.me)
TURN_USER="turn-$(openssl rand -hex 4)"
TURN_PASS=$(openssl rand -base64 32)

echo ""
echo "Configuration:"
echo "  Public IP: $PUBLIC_IP"
echo "  Strapi: https://$STRAPI_DOMAIN"
echo "  VDO.Ninja: https://$VDO_DOMAIN"
echo "  TURN: turn:$TURN_DOMAIN:3478"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git certbot nginx

# Create directory structure
echo "Creating directory structure..."
sudo mkdir -p /opt/video-chat/{strapi,vdo-ninja,coturn,nginx}
cd /opt/video-chat

# Generate SSL certificates
echo "Generating SSL certificates..."
sudo certbot certonly --standalone \
  -d $STRAPI_DOMAIN \
  -d $VDO_DOMAIN \
  -d $TURN_DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --non-interactive

# Clone repositories
echo "Cloning repositories..."
cd vdo-ninja
git clone https://github.com/steveseguin/vdo.ninja.git .

# Create configurations
echo "Creating configurations..."

# ... (configurations created below)

# Start services
echo "Starting services..."
docker compose up -d

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "URLs:"
echo "  Strapi: https://$STRAPI_DOMAIN"
echo "  VDO.Ninja: https://$VDO_DOMAIN"
echo ""
echo "TURN Server:"
echo "  URL: turn:$TURN_DOMAIN:3478"
echo "  Username: $TURN_USER"
echo "  Password: $TURN_PASS"
echo ""

# Save credentials
cat > /opt/video-chat/credentials.txt <<EOF
Self-Hosted Video Chat Credentials
==================================

Strapi: https://$STRAPI_DOMAIN
VDO.Ninja: https://$VDO_DOMAIN
TURN Server: turn:$TURN_DOMAIN:3478

TURN Credentials:
Username: $TURN_USER
Password: $TURN_PASS

Public IP: $PUBLIC_IP
Generated: $(date)
EOF

echo "Credentials saved to /opt/video-chat/credentials.txt"
```

---

## Detailed Setup

### Step 1: Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Install other tools
sudo apt-get install -y git nginx certbot python3-certbot-nginx

# Configure firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 1337/tcp    # Strapi
sudo ufw allow 3478/tcp    # TURN
sudo ufw allow 3478/udp    # TURN
sudo ufw allow 5349/tcp    # TURNS
sudo ufw allow 5349/udp    # TURNS
sudo ufw allow 49152:65535/udp  # TURN media
sudo ufw enable
```

### Step 2: DNS Configuration

Add DNS records for your domain:

```
# A Records
strapi.yourdomain.com  →  YOUR_SERVER_IP
vdo.yourdomain.com     →  YOUR_SERVER_IP
turn.yourdomain.com    →  YOUR_SERVER_IP
```

Verify DNS:

```bash
nslookup strapi.yourdomain.com
nslookup vdo.yourdomain.com
nslookup turn.yourdomain.com
```

### Step 3: SSL Certificates

```bash
# Stop Nginx if running
sudo systemctl stop nginx

# Generate certificates for all domains
sudo certbot certonly --standalone \
  -d strapi.yourdomain.com \
  -d vdo.yourdomain.com \
  -d turn.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive

# Certificates will be in:
# /etc/letsencrypt/live/strapi.yourdomain.com/
# /etc/letsencrypt/live/vdo.yourdomain.com/
# /etc/letsencrypt/live/turn.yourdomain.com/
```

### Step 4: Create Directory Structure

```bash
sudo mkdir -p /opt/video-chat
cd /opt/video-chat

sudo mkdir -p {strapi,vdo-ninja,coturn,nginx}/{config,certs,logs,data}
```

---

## Complete Docker Compose

Create `/opt/video-chat/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Strapi Application
  strapi:
    image: strapi/strapi:latest
    container_name: strapi
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_CLIENT=postgres
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=strapi
      - DATABASE_USERNAME=strapi
      - DATABASE_PASSWORD=SecurePassword123!
    volumes:
      - ./strapi/data:/srv/app
    networks:
      - video-chat-network
    depends_on:
      - postgres

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=strapi
      - POSTGRES_USER=strapi
      - POSTGRES_PASSWORD=SecurePassword123!
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - video-chat-network

  # VDO.Ninja
  vdo-ninja:
    build:
      context: ./vdo-ninja
      dockerfile: Dockerfile
    container_name: vdo-ninja
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8080
      - HOSTNAME=vdo.yourdomain.com
    volumes:
      - ./vdo-ninja/config:/app/config:ro
      - vdo-data:/app/data
    networks:
      - video-chat-network

  # Coturn TURN Server
  coturn:
    build:
      context: ./coturn
      dockerfile: Dockerfile
    container_name: coturn
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./coturn/config/turnserver.conf:/etc/coturn/turnserver.conf:ro
      - ./coturn/certs:/etc/coturn/certs:ro
      - ./coturn/logs:/var/log/coturn
    environment:
      - DETECT_EXTERNAL_IP=yes

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx/logs:/var/log/nginx
    networks:
      - video-chat-network
    depends_on:
      - strapi
      - vdo-ninja

volumes:
  postgres-data:
  vdo-data:

networks:
  video-chat-network:
    driver: bridge
```

---

## Configuration

### Nginx Configuration

Create `/opt/video-chat/nginx/conf.d/default.conf`:

```nginx
# Strapi
server {
    listen 80;
    server_name strapi.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name strapi.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/strapi.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/strapi.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 100M;

    location / {
        proxy_pass http://strapi:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# VDO.Ninja
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

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Permissions-Policy "camera=*, microphone=*, display-capture=*";

    location / {
        proxy_pass http://vdo-ninja:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### VDO.Ninja Configuration

Create `/opt/video-chat/vdo-ninja/config/config.json`:

```json
{
  "port": 8080,
  "hostname": "vdo.yourdomain.com",
  "turnServers": [
    {
      "urls": "turn:turn.yourdomain.com:3478",
      "username": "your-turn-username",
      "credential": "your-turn-password"
    },
    {
      "urls": "turns:turn.yourdomain.com:5349",
      "username": "your-turn-username",
      "credential": "your-turn-password"
    }
  ],
  "stunServers": [
    {
      "urls": "stun:turn.yourdomain.com:3478"
    },
    {
      "urls": "stun:stun.l.google.com:19302"
    }
  ]
}
```

### Coturn Configuration

Create `/opt/video-chat/coturn/config/turnserver.conf`:

```ini
listening-ip=0.0.0.0
relay-ip=YOUR_PUBLIC_IP
external-ip=YOUR_PUBLIC_IP
listening-port=3478
tls-listening-port=5349
min-port=49152
max-port=65535
realm=turn.yourdomain.com
server-name=turn.yourdomain.com
lt-cred-mech
user=your-username:your-password
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem
log-file=/var/log/coturn/turnserver.log
verbose
no-cli
no-tlsv1
no-tlsv1_1
fingerprint
stale-nonce=600
```

### Strapi Plugin Configuration

Update `/opt/video-chat/strapi/config/plugins.js`:

```javascript
module.exports = {
  'video-chat': {
    enabled: true,
    config: {
      vdoNinja: {
        hostUrl: 'https://vdo.yourdomain.com',
        defaultQuality: 2,
        codec: 'vp9',
      },
      turnServer: {
        enabled: true,
        urls: [
          'turn:turn.yourdomain.com:3478',
          'turns:turn.yourdomain.com:5349'
        ],
        username: 'your-turn-username',
        credential: 'your-turn-password',
      },
    },
  },
};
```

---

## Testing

### 1. Test Individual Services

```bash
# Test Strapi
curl -I https://strapi.yourdomain.com
# Should return 200 OK

# Test VDO.Ninja
curl -I https://vdo.yourdomain.com
# Should return 200 OK

# Test TURN server
turnutils_uclient -v -u username -w password turn.yourdomain.com
# Should show successful allocation
```

### 2. Test Complete Flow

1. **Access Strapi Admin**
   ```
   https://strapi.yourdomain.com/admin
   ```

2. **Navigate to Video Chat Plugin**
   - Click "Video Chat" in sidebar
   - Create a test call
   - Verify VDO.Ninja interface loads

3. **Test TURN Server**
   - Use https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   - Add your TURN server credentials
   - Check for "relay" candidates

### 3. Test Video Call

```bash
# Create a test call via API
curl -X POST https://strapi.yourdomain.com/api/video-chat/calls \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": [2],
    "callType": "one-on-one"
  }'
```

---

## Maintenance

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/video-chat"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup databases
docker exec postgres pg_dump -U strapi strapi > $BACKUP_DIR/strapi_$DATE.sql

# Backup configurations
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/video-chat/*/config

# Backup SSL certificates
cp -r /etc/letsencrypt $BACKUP_DIR/letsencrypt_$DATE

# Delete backups older than 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Update Script

```bash
#!/bin/bash
# update.sh

echo "Updating services..."

cd /opt/video-chat

# Backup first
./backup.sh

# Pull latest VDO.Ninja
cd vdo-ninja
git pull

# Rebuild and restart
cd /opt/video-chat
docker compose build --no-cache
docker compose up -d

# Check health
sleep 10
docker compose ps
```

### Monitoring

Create `/opt/video-chat/monitor.sh`:

```bash
#!/bin/bash
# Monitor service health

check_service() {
    SERVICE=$1
    URL=$2

    if curl -f -s -o /dev/null $URL; then
        echo "✓ $SERVICE is running"
        return 0
    else
        echo "✗ $SERVICE is down!"
        return 1
    fi
}

check_service "Strapi" "https://strapi.yourdomain.com"
check_service "VDO.Ninja" "https://vdo.yourdomain.com"

# Check Docker containers
docker compose ps | grep -q "Up" || echo "✗ Some containers are down!"

# Check TURN server
turnutils_uclient -v -u username -w password turn.yourdomain.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ TURN server is running"
else
    echo "✗ TURN server is down!"
fi
```

Add to crontab:

```bash
# Run every 5 minutes
*/5 * * * * /opt/video-chat/monitor.sh >> /var/log/monitor.log 2>&1
```

---

## Cost Analysis

### Initial Setup
- Domain name: $10-20/year
- VPS setup time: 2-4 hours
- **Total**: $10-20 one-time

### Monthly Costs

| Provider | Specs | Cost |
|----------|-------|------|
| **DigitalOcean** | 4GB RAM, 2 vCPU | $24/mo |
| **Linode** | 4GB RAM, 2 vCPU | $24/mo |
| **AWS Lightsail** | 4GB RAM, 2 vCPU | $40/mo |
| **Vultr** | 4GB RAM, 2 vCPU | $24/mo |
| **Hetzner** | 4GB RAM, 2 vCPU | $9/mo |

**Total Monthly**: $9-40/month

### vs SaaS Alternatives

| Service | Cost |
|---------|------|
| **Self-Hosted** | $20-40/month unlimited |
| Twilio Video | $0.0015/min = $90/mo for 1000 hrs |
| Vonage Video | $0.0008/min = $48/mo for 1000 hrs |
| Daily.co | $0.0008/min = $48/mo for 1000 hrs |

**Savings**: $28-70/month (or more with heavy usage)

---

## Troubleshooting

### All Services Down

```bash
# Check if Docker is running
sudo systemctl status docker

# Check containers
docker compose ps

# Restart all
docker compose restart

# Check logs
docker compose logs
```

### SSL Certificate Issues

```bash
# Renew all certificates
sudo certbot renew --force-renewal

# Copy to services
sudo cp /etc/letsencrypt/live/*/fullchain.pem /opt/video-chat/coturn/certs/
sudo cp /etc/letsencrypt/live/*/privkey.pem /opt/video-chat/coturn/certs/

# Restart services
docker compose restart
```

### High Resource Usage

```bash
# Check resource usage
docker stats

# Scale down if needed
docker compose up -d --scale strapi=1

# Add resource limits to docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

---

## Next Steps

1. **Set up monitoring** - Add Prometheus + Grafana
2. **Configure backups** - Automate daily backups
3. **Add redundancy** - Set up failover server
4. **Optimize performance** - Add Redis caching
5. **Security audit** - Run security scan

---

## Resources

- **VDO.Ninja Docker Guide**: [VDO_NINJA_DOCKER.md](./VDO_NINJA_DOCKER.md)
- **TURN Server Guide**: [TURN_SERVER_DOCKER.md](./TURN_SERVER_DOCKER.md)
- **Plugin Configuration**: [INSTALLATION.md](../INSTALLATION.md)
- **Security Guide**: [SECURITY.md](./SECURITY.md)
