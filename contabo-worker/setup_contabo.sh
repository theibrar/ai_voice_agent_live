#!/usr/bin/env bash
# =============================================================================
#  Apex Voice AI — Contabo VPS One-Shot Setup Script
#  Run this ONCE on a fresh Contabo Ubuntu 22.04 server:
#    bash setup_contabo.sh
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]  $*${NC}"; }
success() { echo -e "${GREEN}[OK]    $*${NC}"; }
warn()    { echo -e "${YELLOW}[WARN]  $*${NC}"; }
die()     { echo -e "${RED}[FAIL]  $*${NC}"; exit 1; }

echo -e "${CYAN}"
echo "=============================================================="
echo "  Apex Voice AI  –  Contabo VPS LiveKit Cluster Installer"
echo "  GPU  : 184.144.154.180  (vLLM :56137, Kokoro :56209, STT :56546, VAD :56756)"
echo "  Stack: LiveKit SFU + SIP + Redis + Agent Worker"
echo "=============================================================="
echo -e "${NC}"

# ── 1. System packages ──────────────────────────────────────────────────────
info "1/7  Installing system dependencies..."
apt-get update -y
apt-get install -y --no-install-recommends \
    curl git wget ca-certificates \
    ufw iptables iptables-persistent netfilter-persistent \
    htop jq

# ── 2. Docker & Docker Compose ─────────────────────────────────────────────
info "2/7  Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker "$USER" 2>/dev/null || true
    success "Docker installed."
else
    success "Docker already present: $(docker --version)"
fi

if ! docker compose version &>/dev/null 2>&1; then
    apt-get install -y docker-compose-plugin
fi
success "Docker Compose: $(docker compose version)"

# ── 3. OS kernel tuning for max concurrent WebRTC calls ────────────────────
info "3/7  Tuning kernel network parameters..."
cat >> /etc/sysctl.conf <<'EOF'

# Apex Voice AI — WebRTC / RTP tuning
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.rmem_default = 2097152
net.core.wmem_default = 2097152
net.core.netdev_max_backlog = 65536
net.ipv4.udp_rmem_min = 65536
net.ipv4.udp_wmem_min = 65536
fs.file-max = 500000
EOF
sysctl -p
success "Kernel parameters applied."

# ── 4. Firewall rules ──────────────────────────────────────────────────────
info "4/7  Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# SSH (keep alive!)
ufw allow 22/tcp comment "SSH"

# App platform (Oracle)
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw allow 3000/tcp comment "Frontend"
ufw allow 8080/tcp comment "Go Backend"
ufw allow 5050/tcp comment "pgAdmin"

# LiveKit SFU
ufw allow 7880/tcp comment "LiveKit WS"
ufw allow 7881/tcp comment "LiveKit RTC TCP"

# LiveKit RTP/media UDP port range (LiveKit 50000-59999)
ufw allow 50000:59999/udp comment "LiveKit RTP media"

# SIP UDP/TCP (Telnyx)
ufw allow 5060/udp comment "SIP UDP"
ufw allow 5060/tcp comment "SIP TCP"

# RTP media for SIP (assigned to livekit-sip 20000-29999)
ufw allow 20000:29999/udp comment "SIP RTP media"

ufw --force enable
success "UFW firewall enabled."

# Persist iptables (needed on Contabo/Oracle instances that reset rules on reboot)
iptables -I INPUT 6 -m state --state NEW -p udp --dport 50000:59999 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 6 -m state --state NEW -p udp --dport 20000:29999 -j ACCEPT 2>/dev/null || true
iptables -I INPUT 6 -m state --state NEW -p udp --dport 5060       -j ACCEPT 2>/dev/null || true
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 7880       -j ACCEPT 2>/dev/null || true
netfilter-persistent save 2>/dev/null || true

# ── 5. Test GPU microservice connectivity ─────────────────────────────────
info "5/7  Testing GPU AI service connectivity (184.144.154.180)..."
GPU=184.144.154.180
for check in \
    "vLLM LLM   :56137/v1/models" \
    "Kokoro TTS :56209/health" \
    "STT        :56546/health" \
    "Silero VAD :56756/health"
do
    label=$(echo "$check" | cut -d: -f1)
    endpoint=$(echo "$check" | cut -d: -f2-)
    if curl -sf --max-time 5 "http://${GPU}${endpoint}" -o /dev/null; then
        success "  ${label} OK"
    else
        warn "  ${label} not reachable — GPU server may be warming up"
    fi
done

# ── 6. Build and start LiveKit stack ──────────────────────────────────────
info "6/7  Pulling images and building agent worker..."
docker compose -f docker-compose.contabo.yml pull livekit livekit-sip redis
docker compose -f docker-compose.contabo.yml build agent-worker

info "     Starting all services..."
docker compose -f docker-compose.contabo.yml up -d

# Wait for services to stabilise
sleep 5

# ── 7. Status check ────────────────────────────────────────────────────────
info "7/7  Status check..."
docker compose -f docker-compose.contabo.yml ps

# Verify LiveKit is listening
if curl -sf http://127.0.0.1:7880 -o /dev/null 2>&1 || \
   nc -z 127.0.0.1 7880 2>/dev/null; then
    success "LiveKit SFU is listening on :7880"
else
    warn "LiveKit may still be starting — run: docker logs livekit-server"
fi

echo ""
echo -e "${CYAN}=============================================================="
echo "  All services are running!"
echo ""
echo "  LiveKit SFU     : ws://0.0.0.0:7880"
echo "  LiveKit SIP     : sip:0.0.0.0:5060  (Telnyx inbound ready)"
echo "  Agent Worker    : connected to GPU 184.144.154.180"
echo ""
echo "  Useful commands:"
echo "    docker compose -f docker-compose.contabo.yml logs -f agent-worker"
echo "    docker compose -f docker-compose.contabo.yml ps"
echo "    # Scale to 4 workers for more concurrent calls:"
echo "    docker compose -f docker-compose.contabo.yml up -d --scale agent-worker=4"
echo "==============================================================${NC}"

