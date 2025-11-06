# Self-Hosting TURN Server with Docker

Complete guide to deploying your own TURN server using Coturn in Docker.

## Table of Contents

- [Why Run Your Own TURN Server?](#why-run-your-own-turn-server)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Why Run Your Own TURN Server?

### What is a TURN Server?

TURN (Traversal Using Relays around NAT) is a protocol that helps establish WebRTC connections when direct P2P connections fail due to:
- Restrictive firewalls
- Symmetric NAT
- Corporate networks
- VPNs

### Connection Success Rates

| Scenario | Success Rate |
|----------|--------------|
| STUN only (no TURN) | 85-92% |
| STUN + TURN | 95-99% |

### Benefits

- ✅ **Better connectivity** - 95-99% connection success
- ✅ **Reliability** - Works behind corporate firewalls
- ✅ **Privacy** - Your infrastructure, your control
- ✅ **Cost-effective** - $10-30/month vs $0.40/GB with Twilio
- ✅ **No rate limits** - Unlimited usage

### Costs

- VPS hosting: $10-30/month (2GB RAM)
- Domain/subdomain: Included
- SSL certificate: Free (Let's Encrypt)
- Bandwidth: Usually included with VPS
- **Total**: ~$10-30/month

---

## Prerequisites

### Required
- Docker Engine 20.10+
- Docker Compose 2.0+
- Domain name (e.g., `turn.yourdomain.com`)
- 2GB RAM minimum
- 20GB disk space
- Ubuntu 20.04+ / Debian 11+ (recommended)
- **Public IP address**

### Ports Required
- **3478** (TCP/UDP) - TURN/STUN
- **5349** (TCP/UDP) - TURNS (TLS)
- **49152-65535** (UDP) - Media relay

### Check Prerequisites

```bash
# Check Docker
docker --version

# Check ports are not in use
sudo netstat -tulpn | grep -E '3478|5349'

# Check public IP
curl ifconfig.me

# Check DNS resolution
nslookup turn.yourdomain.com
```

---

## Quick Start

### 1. Create Directory Structure

```bash
mkdir -p ~/coturn
cd ~/coturn
mkdir -p config certs logs
```

### 2. Create turnserver.conf

Create `config/turnserver.conf`:

```ini
# Coturn TURN server configuration

# Listening ports
listening-port=3478
tls-listening-port=5349

# Listening IPs (use your server's public IP)
listening-ip=0.0.0.0
relay-ip=YOUR_PUBLIC_IP

# External IP (your public IP)
external-ip=YOUR_PUBLIC_IP

# Relay ports range
min-port=49152
max-port=65535

# Enable verbose logging
verbose

# Log file
log-file=/var/log/coturn/turnserver.log

# Realm (your domain)
realm=turn.yourdomain.com

# Authentication
lt-cred-mech
user=username:password

# SSL certificates (for TURNS)
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem

# Security
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

# Optimize for WebRTC
fingerprint
stale-nonce=600

# Denied and allowed peer IPs (optional)
# denied-peer-ip=10.0.0.0-10.255.255.255
# denied-peer-ip=192.168.0.0-192.168.255.255
```

### 3. Create Dockerfile

Create `Dockerfile`:

```dockerfile
FROM ubuntu:22.04

# Install coturn
RUN apt-get update && \
    apt-get install -y coturn && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /var/log/coturn /etc/coturn/certs

# Copy configuration
COPY config/turnserver.conf /etc/coturn/turnserver.conf

# Expose ports
EXPOSE 3478 3478/udp 5349 5349/udp 49152-65535/udp

# Run coturn
CMD ["turnserver", "-c", "/etc/coturn/turnserver.conf", "-v"]
```

### 4. Create Docker Compose File

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  coturn:
    build: .
    container_name: coturn
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./config/turnserver.conf:/etc/coturn/turnserver.conf:ro
      - ./certs:/etc/coturn/certs:ro
      - ./logs:/var/log/coturn
    environment:
      - DETECT_EXTERNAL_IP=yes
      - DETECT_RELAY_IP=yes
```

### 5. Start the Server

```bash
# Replace with your actual values
sed -i 's/YOUR_PUBLIC_IP/1.2.3.4/g' config/turnserver.conf
sed -i 's/username:password/myuser:mypassword/g' config/turnserver.conf

# Build and start
docker compose up -d

# Check logs
docker compose logs -f coturn
```

---

## Detailed Setup

### Step 1: Server Preparation

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker if not already installed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Create coturn user
sudo useradd -m -s /bin/bash coturn
sudo usermod -aG docker coturn

# Switch to coturn user
sudo su - coturn
```

### Step 2: Configure Firewall

```bash
# Allow TURN ports
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 3: Get SSL Certificates

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone \
  -d turn.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/turn.yourdomain.com/privkey.pem ~/coturn/certs/
sudo cp /etc/letsencrypt/live/turn.yourdomain.com/fullchain.pem ~/coturn/certs/
sudo chown -R coturn:coturn ~/coturn/certs/
```

### Step 4: Create Production Configuration

Create `config/turnserver.conf`:

```ini
# TURN server configuration for production

# Listener IPs
listening-ip=0.0.0.0

# Relay IP (server's public IP)
relay-ip=YOUR_PUBLIC_IP

# External IP (for NAT traversal)
external-ip=YOUR_PUBLIC_IP

# Listening ports
listening-port=3478
tls-listening-port=5349

# Relay ports
min-port=49152
max-port=65535

# Realm
realm=turn.yourdomain.com
server-name=turn.yourdomain.com

# Authentication
lt-cred-mech

# Users (username:password)
user=user1:SecurePassword123!
user=user2:AnotherSecurePass456!

# Or use a user database
# userdb=/var/lib/coturn/userdb.conf

# SSL/TLS certificates
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem

# Cipher list for TLS
cipher-list="ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384"

# DH parameters (generate with: openssl dhparam -out dhparam.pem 2048)
# dh-file=/etc/coturn/certs/dhparam.pem

# Logging
log-file=/var/log/coturn/turnserver.log
verbose
simple-log

# Security options
no-cli
no-tlsv1
no-tlsv1_1
no-multicast-peers

# WebRTC optimization
fingerprint
stale-nonce=600

# Deny private IP ranges (optional, for security)
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.0.0.0-192.0.0.255
denied-peer-ip=192.0.2.0-192.0.2.255
denied-peer-ip=192.88.99.0-192.88.99.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=198.18.0.0-198.19.255.255
denied-peer-ip=198.51.100.0-198.51.100.255
denied-peer-ip=203.0.113.0-203.0.113.255
denied-peer-ip=240.0.0.0-255.255.255.255

# Allowed peer IPs (if you want to restrict)
# allowed-peer-ip=YOUR_VDO_NINJA_IP

# Quota and limits
max-bps=1000000
bps-capacity=0
total-quota=100
user-quota=10

# Enable Prometheus metrics (optional)
# prometheus
# prometheus-port=9641
```

### Step 5: Advanced Dockerfile

Create `Dockerfile.production`:

```dockerfile
FROM ubuntu:22.04

# Install coturn and tools
RUN apt-get update && \
    apt-get install -y \
        coturn \
        curl \
        net-tools \
        iptables \
        openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create directories
RUN mkdir -p /var/log/coturn /etc/coturn/certs /var/lib/coturn

# Create coturn user
RUN useradd -r -s /bin/false coturn && \
    chown -R coturn:coturn /var/log/coturn /var/lib/coturn

# Generate DH parameters (for better security)
RUN openssl dhparam -out /etc/coturn/certs/dhparam.pem 2048

# Health check script
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

# Switch to coturn user
USER coturn

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Expose ports
EXPOSE 3478 3478/udp 5349 5349/udp 49152-65535/udp

# Run turnserver
CMD ["turnserver", "-c", "/etc/coturn/turnserver.conf", "-v"]
```

Create `healthcheck.sh`:

```bash
#!/bin/bash
# Health check for coturn

# Check if process is running
if ! pgrep -x turnserver > /dev/null; then
    echo "turnserver process not found"
    exit 1
fi

# Check if port 3478 is listening
if ! netstat -tuln | grep -q ":3478 "; then
    echo "Port 3478 not listening"
    exit 1
fi

echo "Health check passed"
exit 0
```

### Step 6: Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  coturn:
    build:
      context: .
      dockerfile: Dockerfile.production
    container_name: coturn
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./config/turnserver.conf:/etc/coturn/turnserver.conf:ro
      - ./certs:/etc/coturn/certs:ro
      - ./logs:/var/log/coturn
      - coturn-data:/var/lib/coturn
    environment:
      - DETECT_EXTERNAL_IP=yes
      - DETECT_RELAY_IP=yes
      - TURNSERVER_ENABLED=1
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
          cpus: '0.5'
          memory: 512M

  # Optional: Prometheus for monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: coturn-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

volumes:
  coturn-data:
    driver: local
  prometheus-data:
    driver: local
```

---

## Configuration

### Generate Secure Passwords

```bash
# Generate random password
openssl rand -base64 32

# Generate multiple users
for i in {1..5}; do
  user="user$i"
  pass=$(openssl rand -base64 16)
  echo "user=$user:$pass"
done >> config/turnserver.conf
```

### User Database

Create `config/userdb.conf`:

```ini
# User database
# Format: username:password

admin:SecureAdminPassword123!
vdo-ninja:VdoNinjaPassword456!
strapi-plugin:StrapiPluginPass789!
```

Update `turnserver.conf`:

```ini
# Use external user database
userdb=/etc/coturn/userdb.conf
```

Mount in docker-compose:

```yaml
volumes:
  - ./config/userdb.conf:/etc/coturn/userdb.conf:ro
```

### Environment Variables

Create `.env`:

```bash
# .env
PUBLIC_IP=1.2.3.4
REALM=turn.yourdomain.com
TURN_USER=myuser
TURN_PASSWORD=mypassword
MIN_PORT=49152
MAX_PORT=65535
```

Use in `turnserver.conf`:

```ini
external-ip=${PUBLIC_IP}
realm=${REALM}
user=${TURN_USER}:${TURN_PASSWORD}
min-port=${MIN_PORT}
max-port=${MAX_PORT}
```

---

## Production Deployment

### Complete Setup Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "=== Coturn TURN Server Deployment ==="

# Variables
DOMAIN="turn.yourdomain.com"
EMAIL="admin@yourdomain.com"
PUBLIC_IP=$(curl -s ifconfig.me)
TURN_USER="coturn-$(openssl rand -hex 4)"
TURN_PASS=$(openssl rand -base64 32)

echo "Public IP: $PUBLIC_IP"
echo "Domain: $DOMAIN"
echo "User: $TURN_USER"

# Install dependencies
echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin certbot

# Create directory structure
echo "Creating directories..."
mkdir -p ~/coturn/{config,certs,logs}
cd ~/coturn

# Generate SSL certificate
echo "Generating SSL certificate..."
sudo certbot certonly --standalone \
  -d $DOMAIN \
  --email $EMAIL \
  --agree-tos \
  --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem certs/
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem certs/
sudo chown -R $USER:$USER certs/

# Create configuration
echo "Creating configuration..."
cat > config/turnserver.conf <<EOF
listening-ip=0.0.0.0
relay-ip=$PUBLIC_IP
external-ip=$PUBLIC_IP
listening-port=3478
tls-listening-port=5349
min-port=49152
max-port=65535
realm=$DOMAIN
server-name=$DOMAIN
lt-cred-mech
user=$TURN_USER:$TURN_PASS
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem
log-file=/var/log/coturn/turnserver.log
verbose
no-cli
no-tlsv1
no-tlsv1_1
fingerprint
stale-nonce=600
EOF

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp

# Create Docker files
echo "Creating Docker configuration..."
# ... (copy Dockerfile and docker-compose.yml from above)

# Start services
echo "Starting TURN server..."
docker compose -f docker-compose.production.yml up -d

# Wait for startup
sleep 5

# Display credentials
echo ""
echo "=== Deployment Complete! ==="
echo "TURN Server URL: turn:$DOMAIN:3478"
echo "TURNS Server URL: turns:$DOMAIN:5349"
echo "Username: $TURN_USER"
echo "Password: $TURN_PASS"
echo ""
echo "Add these to your VDO.Ninja configuration:"
echo ""
echo "turnServers: [{"
echo "  urls: 'turn:$DOMAIN:3478',"
echo "  username: '$TURN_USER',"
echo "  credential: '$TURN_PASS'"
echo "}]"
echo ""

# Save credentials
cat > credentials.txt <<EOF
TURN Server Configuration
========================
URL: turn:$DOMAIN:3478
TURNS URL: turns:$DOMAIN:5349
Username: $TURN_USER
Password: $TURN_PASS
Public IP: $PUBLIC_IP
EOF

echo "Credentials saved to credentials.txt"
```

Make executable and run:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Systemd Service

Create `/etc/systemd/system/coturn.service`:

```ini
[Unit]
Description=Coturn TURN Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/coturn/coturn
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
ExecReload=/usr/bin/docker compose -f docker-compose.production.yml restart

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable coturn
sudo systemctl start coturn
```

### Auto-Renewal for SSL

Create `/etc/cron.d/coturn-certbot`:

```bash
# Renew SSL certificates for coturn
0 0 * * * root certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/turn.yourdomain.com/*.pem /home/coturn/coturn/certs/ && docker restart coturn"
```

---

## Testing

### Test STUN Functionality

```bash
# Using stunclient (install with: apt-get install stun-client)
stunclient turn.yourdomain.com 3478

# Expected output:
# Binding test: success
# Local address: 192.168.1.100:54321
# Mapped address: YOUR_PUBLIC_IP:54321
```

### Test TURN Functionality

```bash
# Install turnutils
apt-get install coturn-utils

# Test TURN allocation
turnutils_uclient -v -u username -w password \
  turn.yourdomain.com
```

### Online TURN Test

Use online tools:
- https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- https://icetest.info/

Configuration:
```
TURN URI: turn:turn.yourdomain.com:3478
Username: your-username
Credential: your-password
```

### Test with JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <title>TURN Server Test</title>
</head>
<body>
    <h1>Testing TURN Server</h1>
    <button onclick="testTurn()">Test TURN Connection</button>
    <pre id="output"></pre>

    <script>
        async function testTurn() {
            const output = document.getElementById('output');
            output.textContent = 'Testing...';

            const config = {
                iceServers: [
                    {
                        urls: 'turn:turn.yourdomain.com:3478',
                        username: 'your-username',
                        credential: 'your-password'
                    },
                    {
                        urls: 'stun:turn.yourdomain.com:3478'
                    }
                ]
            };

            try {
                const pc = new RTCPeerConnection(config);

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        const candidate = event.candidate;
                        output.textContent += `\nCandidate: ${candidate.type} ${candidate.address}`;

                        if (candidate.type === 'relay') {
                            output.textContent += '\n✅ TURN working!';
                        }
                    }
                };

                // Create data channel to trigger ICE
                pc.createDataChannel('test');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                setTimeout(() => {
                    pc.close();
                    output.textContent += '\n\nTest complete!';
                }, 5000);

            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs coturn

# Common issues:

# 1. Port already in use
sudo netstat -tulpn | grep -E '3478|5349'
# Kill process or change port

# 2. Configuration error
docker exec coturn turnserver -c /etc/coturn/turnserver.conf --check-config

# 3. Permission issues
sudo chown -R 999:999 logs/
```

### Cannot Allocate Ports

```bash
# Check port range
docker exec coturn cat /proc/sys/net/ipv4/ip_local_port_range

# Increase range if needed
echo "49152 65535" | sudo tee /proc/sys/net/ipv4/ip_local_port_range

# Make permanent
echo "net.ipv4.ip_local_port_range = 49152 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### TURN Authentication Fails

```bash
# Check credentials in config
docker exec coturn cat /etc/coturn/turnserver.conf | grep user=

# Test with correct credentials
turnutils_uclient -v -u username -w password turn.yourdomain.com

# Check logs for auth errors
docker compose logs coturn | grep -i auth
```

### SSL Certificate Errors

```bash
# Check certificate files
docker exec coturn ls -la /etc/coturn/certs/

# Test certificate
openssl s_client -connect turn.yourdomain.com:5349

# Verify certificate dates
openssl x509 -in certs/fullchain.pem -noout -dates

# Renew if expired
sudo certbot renew --force-renewal
```

### High CPU/Memory Usage

```bash
# Check resource usage
docker stats coturn

# Check number of allocations
docker exec coturn grep -i "allocation" /var/log/coturn/turnserver.log | wc -l

# Limit connections in config
max-allocate-lifetime=600
total-quota=100
user-quota=10
```

### Firewall Blocking Connections

```bash
# Check firewall status
sudo ufw status verbose

# Check if ports are open externally
nmap -p 3478,5349 turn.yourdomain.com

# Test UDP ports
nc -u -v turn.yourdomain.com 3478

# Check iptables
sudo iptables -L -n | grep -E '3478|5349'
```

---

## Monitoring

### View Logs

```bash
# Real-time logs
docker compose logs -f coturn

# Search for errors
docker compose logs coturn | grep ERROR

# View allocation logs
docker compose logs coturn | grep "new allocation"

# Count active sessions
docker exec coturn grep "session" /var/log/coturn/turnserver.log | tail -100
```

### Prometheus Metrics

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'coturn'
    static_configs:
      - targets: ['localhost:9641']
```

Enable in `turnserver.conf`:

```ini
prometheus
prometheus-port=9641
```

### Grafana Dashboard

Use Prometheus data source with queries:

```promql
# Active allocations
turnserver_allocations_total

# Bandwidth usage
rate(turnserver_traffic_bytes_total[5m])

# Connection success rate
turnserver_allocations_success / turnserver_allocations_total
```

---

## Security Best Practices

- [ ] Use strong, random passwords
- [ ] Enable only TLS 1.2 and 1.3
- [ ] Restrict denied peer IPs
- [ ] Set user quotas
- [ ] Monitor logs for abuse
- [ ] Rotate credentials regularly
- [ ] Keep coturn updated
- [ ] Use firewall rules
- [ ] Enable rate limiting
- [ ] Disable CLI access

---

## Next Steps

- **[VDO.Ninja Docker](./VDO_NINJA_DOCKER.md)** - Set up VDO.Ninja
- **[Complete Self-Hosting Guide](./SELF_HOSTING_GUIDE.md)** - Deploy everything together
- **[Configure Plugin](../INSTALLATION.md)** - Update plugin configuration

---

## Resources

- **Coturn GitHub**: https://github.com/coturn/coturn
- **Coturn Documentation**: https://github.com/coturn/coturn/wiki
- **WebRTC for the Curious**: https://webrtcforthecurious.com/
- **TURN Server Test**: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
