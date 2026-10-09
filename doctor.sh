#!/usr/bin/env bash
# =============================================================================
#  Apex Voice AI — Master Diagnostic, Crash Analyzer & Error Report Generator
# =============================================================================
#  Usage:
#    bash doctor.sh              Run full diagnostics and generate error_report.txt
#    bash doctor.sh report       Display the generated error_report.txt
#    bash doctor.sh gpu          Deep test GPU microservices (LLM, TTS, STT, VAD)
#    bash doctor.sh logs worker  Tail live logs for LiveKit Agent Worker
#    bash doctor.sh logs sip     Tail live logs for LiveKit SIP Gateway
#    bash doctor.sh logs backend Tail live logs for Go CRM Backend
#    bash doctor.sh logs all     Tail all project container logs
#    bash doctor.sh restart      Restart agent-worker with updated .env
# =============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Find and load .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE=""

if [ -f "$SCRIPT_DIR/.env" ]; then
    ENV_FILE="$SCRIPT_DIR/.env"
elif [ -f "$SCRIPT_DIR/../.env" ]; then
    ENV_FILE="$SCRIPT_DIR/../.env"
fi

if [ -n "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$')
    set +a
fi

# Fallback defaults if not set in .env
GPU_HOST="${GPU_HOST:-77.104.167.149}"
GPU_API_KEY="${GPU_API_KEY:-IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF}"
LLM_URL="${LLM_URL:-http://$GPU_HOST:59982/v1}"
LLM_MODEL="${LLM_MODEL:-Qwen/Qwen2.5-7B-Instruct-AWQ}"
STT_URL="${STT_URL:-http://$GPU_HOST:59805}"
TTS_URL="${TTS_URL:-http://$GPU_HOST:59643}"
VAD_URL="${VAD_URL:-http://$GPU_HOST:59929}"
PROSODY_URL="${PROSODY_URL:-http://$GPU_HOST:59835}"
LIVEKIT_URL="${LIVEKIT_URL:-ws://127.0.0.1:7880}"

# Target error report file
REPORT_FILE="${SCRIPT_DIR}/error_report.txt"
LOGS_DIR="${SCRIPT_DIR}/logs"
mkdir -p "$LOGS_DIR"

# Global tracking arrays for report generation
MODEL_FAILURES=()
CONTAINER_FAILURES=()
NETWORK_WARNINGS=()

# Helper print functions
header() {
    echo -e "\n${BOLD}${CYAN}===================================================================${NC}"
    echo -e "${BOLD}${CYAN}  $*${NC}"
    echo -e "${BOLD}${CYAN}===================================================================${NC}"
}

subheading() {
    echo -e "\n${BOLD}${BLUE}── $* ──${NC}"
}

pass() {
    echo -e "  [${GREEN} PASS ${NC}] $*"
}

fail() {
    echo -e "  [${RED} FAIL ${NC}] $*"
}

warn() {
    echo -e "  [${YELLOW} WARN ${NC}] $*"
}

info() {
    echo -e "  [${CYAN} INFO ${NC}] $*"
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. SHOW CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
show_config() {
    subheading "Active Environment Configuration"
    if [ -n "$ENV_FILE" ]; then
        info "Loaded config from: ${BOLD}$ENV_FILE${NC}"
    else
        warn "No .env found. Using default fallback configuration."
    fi

    KEY_LEN=${#GPU_API_KEY}
    if [ "$KEY_LEN" -gt 12 ]; then
        MASKED_KEY="${GPU_API_KEY:0:8}...${GPU_API_KEY: -4}"
    else
        MASKED_KEY="***"
    fi

    echo -e "  GPU Host    : ${BOLD}${GPU_HOST}${NC}"
    echo -e "  GPU API Key : ${BOLD}${MASKED_KEY}${NC}"
    echo -e "  LLM Engine  : ${LLM_URL} (Model: ${LLM_MODEL})"
    echo -e "  STT Engine  : ${STT_URL}"
    echo -e "  TTS Engine  : ${TTS_URL}"
    echo -e "  VAD Engine  : ${VAD_URL}"
    echo -e "  LiveKit SFU : ${LIVEKIT_URL}"
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. GPU MICROSERVICES CONNECTIVITY & MODEL CULPRIT ISOLATION
# ─────────────────────────────────────────────────────────────────────────────
test_gpu_services() {
    subheading "GPU Microservices Health & Model Isolation Tests"

    # --- A. vLLM LLM ---
    echo -n "  Testing LLM Model '${LLM_MODEL}' (${LLM_URL}/models)... "
    local t0 http_code elapsed
    t0=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    
    local resp_llm
    resp_llm=$(curl -s -w "\n%{http_code}" --max-time 6 -H "Authorization: Bearer $GPU_API_KEY" "${LLM_URL}/models" 2>&1 || true)
    http_code=$(echo "$resp_llm" | tail -n1)
    local body_llm
    body_llm=$(echo "$resp_llm" | head -n -1)
    
    local t1
    t1=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    elapsed=$(( t1 - t0 ))
    [ "$elapsed" -lt 0 ] && elapsed=0

    if [ "$http_code" = "200" ]; then
        echo -e "\r  [${GREEN} PASS ${NC}] LLM OK (${elapsed}ms) — Model '${LLM_MODEL}' online"
    else
        echo -e "\r  [${RED} FAIL ${NC}] LLM Model Failed! (HTTP: ${http_code:-Timeout/Unreachable})"
        warn "        Endpoint: ${LLM_URL}/models"
        warn "        Raw response: ${body_llm:0:200}"
        MODEL_FAILURES+=("[CRITICAL MODEL FAILURE] LLM: '${LLM_MODEL}' (URL: ${LLM_URL}) | HTTP ${http_code:-Connection Failed} | Reason: vLLM server is unreachable, crashed, or GPU_API_KEY rejected.")
    fi

    # --- B. Kokoro TTS ---
    echo -n "  Testing TTS Model 'Kokoro-82M ONNX' (${TTS_URL})... "
    t0=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    local resp_tts
    resp_tts=$(curl -s -w "\n%{http_code}" --max-time 6 "${TTS_URL}/health" 2>&1 || true)
    http_code=$(echo "$resp_tts" | tail -n1)

    if [ "$http_code" != "200" ]; then
        resp_tts=$(curl -s -w "\n%{http_code}" --max-time 6 "${TTS_URL}/docs" 2>&1 || true)
        http_code=$(echo "$resp_tts" | tail -n1)
    fi

    t1=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    elapsed=$(( t1 - t0 ))
    [ "$elapsed" -lt 0 ] && elapsed=0

    if [ "$http_code" = "200" ] || [ "$http_code" = "307" ]; then
        echo -e "\r  [${GREEN} PASS ${NC}] TTS OK (${elapsed}ms) — Model 'Kokoro-82M' ready for voice synthesis"
    else
        echo -e "\r  [${RED} FAIL ${NC}] TTS Model Failed! (HTTP: ${http_code:-Timeout/Unreachable})"
        warn "        Endpoint: ${TTS_URL}"
        MODEL_FAILURES+=("[CRITICAL MODEL FAILURE] TTS: 'Kokoro-82M' (URL: ${TTS_URL}) | HTTP ${http_code:-Connection Failed} | Reason: Kokoro TTS container offline or port 59643 blocked.")
    fi

    # --- C. Parakeet STT ---
    echo -n "  Testing STT Model 'Parakeet-TDT 0.6B' (${STT_URL})... "
    t0=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    local resp_stt
    resp_stt=$(curl -s -w "\n%{http_code}" --max-time 6 "${STT_URL}/health" 2>&1 || true)
    http_code=$(echo "$resp_stt" | tail -n1)

    if [ "$http_code" != "200" ]; then
        resp_stt=$(curl -s -w "\n%{http_code}" --max-time 6 "${STT_URL}/docs" 2>&1 || true)
        http_code=$(echo "$resp_stt" | tail -n1)
    fi

    t1=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    elapsed=$(( t1 - t0 ))
    [ "$elapsed" -lt 0 ] && elapsed=0

    if [ "$http_code" = "200" ] || [ "$http_code" = "307" ]; then
        echo -e "\r  [${GREEN} PASS ${NC}] STT OK (${elapsed}ms) — Model 'Parakeet-TDT' ready for audio input"
    else
        echo -e "\r  [${RED} FAIL ${NC}] STT Model Failed! (HTTP: ${http_code:-Timeout/Unreachable})"
        warn "        Endpoint: ${STT_URL}"
        MODEL_FAILURES+=("[CRITICAL MODEL FAILURE] STT: 'Parakeet-TDT 0.6B' (URL: ${STT_URL}) | HTTP ${http_code:-Connection Failed} | Reason: STT transcriber offline or port 59805 blocked.")
    fi

    # --- D. Silero VAD ---
    echo -n "  Testing VAD Model 'Silero VAD v5' (${VAD_URL})... "
    t0=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    local resp_vad
    resp_vad=$(curl -s -w "\n%{http_code}" --max-time 6 "${VAD_URL}/health" 2>&1 || true)
    http_code=$(echo "$resp_vad" | tail -n1)

    t1=$(date +%s%3N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo 0)
    elapsed=$(( t1 - t0 ))
    [ "$elapsed" -lt 0 ] && elapsed=0

    if [ "$http_code" = "200" ]; then
        echo -e "\r  [${GREEN} PASS ${NC}] VAD OK (${elapsed}ms) — Model 'Silero VAD v5' active"
    else
        echo -e "\r  [${YELLOW} WARN ${NC}] VAD Model Warning (HTTP: ${http_code:-Timeout})"
        warn "        Agent worker will use built-in low-latency energy VAD fallback."
        NETWORK_WARNINGS+=("[DEGRADED VAD] Silero VAD v5 on ${VAD_URL} is non-responsive. Agent falls back to internal energy VAD.")
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. DOCKER CONTAINERS STATUS & CRASH DETECTION
# ─────────────────────────────────────────────────────────────────────────────
check_docker_containers() {
    subheading "Docker Containers Status & Crash Inspector"

    if ! command -v docker &>/dev/null; then
        fail "Docker CLI is not found on this system!"
        CONTAINER_FAILURES+=("[DOCKER ERROR] Docker CLI not installed or daemon stopped.")
        return
    fi

    local containers=(
        "chatbot-backend:Go CRM Backend & Call API"
        "chatbot-frontend:Next.js Dashboard & Simulator"
        "chatbot-postgres:PostgreSQL + pgvector Database"
        "chatbot-redis:Redis State & Room Cache"
        "livekit-server:LiveKit SFU Media Server"
        "livekit-sip:LiveKit SIP Telephony Gateway"
        "livekit-agent-worker:AI Voice Agent Worker"
    )

    printf "  %-24s %-12s %-15s %-25s\n" "CONTAINER" "STATUS" "RESTARTS" "ROLE"
    echo "  -------------------------------------------------------------------------------"

    for entry in "${containers[@]}"; do
        local cname="${entry%%:*}"
        local cdesc="${entry#*:}"

        local status restarts
        status=$(docker inspect --format '{{.State.Status}}' "$cname" 2>/dev/null || echo "not_found")
        restarts=$(docker inspect --format '{{.RestartCount}}' "$cname" 2>/dev/null || echo "0")

        if [ "$status" = "running" ]; then
            if [ "$restarts" -gt 0 ]; then
                printf "  ${YELLOW}%-24s %-12s restarts: %-5s %-25s${NC}\n" "$cname" "running" "$restarts" "$cdesc"
                warn "Container '$cname' has crashed and restarted $restarts time(s)!"
                CONTAINER_FAILURES+=("[CONTAINER WARNING] '$cname' has restarted $restarts time(s). Check crash logs.")
            else
                printf "  ${GREEN}%-24s %-12s restarts: 0     %-25s${NC}\n" "$cname" "running" "$cdesc"
            fi
        elif [ "$status" = "restarting" ]; then
            printf "  ${RED}%-24s %-12s restarts: %-5s %-25s${NC}\n" "$cname" "CRASH-LOOP" "$restarts" "$cdesc"
            CONTAINER_FAILURES+=("[CRITICAL CONTAINER CRASH] '$cname' is stuck in a crash loop (RestartCount: $restarts).")
        elif [ "$status" = "exited" ]; then
            local exit_code
            exit_code=$(docker inspect --format '{{.State.ExitCode}}' "$cname" 2>/dev/null || echo "1")
            printf "  ${RED}%-24s %-12s exit: %-9s %-25s${NC}\n" "$cname" "EXITED" "$exit_code" "$cdesc"
            CONTAINER_FAILURES+=("[STOPPED CONTAINER] '$cname' is stopped (ExitCode: $exit_code).")
        else
            printf "  ${YELLOW}%-24s %-12s %-15s %-25s${NC}\n" "$cname" "NOT CREATED" "-" "$cdesc"
            CONTAINER_FAILURES+=("[MISSING CONTAINER] '$cname' is not created or deployed.")
        fi
    done
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. LIVEKIT SIP & NETWORKING INSPECTION
# ─────────────────────────────────────────────────────────────────────────────
check_sip_and_ports() {
    subheading "LiveKit SIP Telephony & Network Ports"

    if curl -s -f http://127.0.0.1:7880 -o /dev/null 2>&1 || nc -z 127.0.0.1 7880 2>/dev/null; then
        pass "LiveKit SFU listening on ws://127.0.0.1:7880"
    else
        fail "LiveKit SFU port 7880 is not reachable!"
        NETWORK_WARNINGS+=("[SFU FAILURE] LiveKit SFU port 7880 unreachable. Calls will not route.")
    fi

    local sip_open=false
    if command -v ss &>/dev/null; then
        ss -uln | grep -q ':5060' && sip_open=true
    elif command -v netstat &>/dev/null; then
        netstat -uln | grep -q ':5060' && sip_open=true
    fi

    if [ "$sip_open" = true ]; then
        pass "SIP UDP port 5060 is listening (Ready for Telnyx inbound)"
    else
        warn "SIP UDP port 5060 does not appear to be bound by livekit-sip"
        NETWORK_WARNINGS+=("[SIP WARNING] Port 5060 UDP is not bound. Inbound carrier calls may ring without answer.")
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# 5. GENERATE COMPREHENSIVE TEXT REPORT (error_report.txt)
# ─────────────────────────────────────────────────────────────────────────────
generate_error_report_file() {
    local now
    now=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    cat > "$REPORT_FILE" <<EOF
================================================================================
  APEX VOICE AI - SYSTEM & MODEL ERROR REPORT
  Generated At : $now
  GPU Host     : $GPU_HOST
  Report File  : $REPORT_FILE
================================================================================

--------------------------------------------------------------------------------
1. MODEL CULPRIT ANALYSIS (WHICH MODEL IS CAUSING THE ISSUE?)
--------------------------------------------------------------------------------
EOF

    if [ ${#MODEL_FAILURES[@]} -eq 0 ]; then
        cat >> "$REPORT_FILE" <<EOF
  STATUS: [ALL MODELS HEALTHY]
  - LLM Model : '$LLM_MODEL' is responding OK on $LLM_URL
  - TTS Model : 'Kokoro-82M' is responding OK on $TTS_URL
  - STT Model : 'Parakeet-TDT 0.6B' is responding OK on $STT_URL
EOF
    else
        echo "  STATUS: [CRITICAL MODEL ISSUES DETECTED!]" >> "$REPORT_FILE"
        for failure in "${MODEL_FAILURES[@]}"; do
            echo "  * $failure" >> "$REPORT_FILE"
        done
        cat >> "$REPORT_FILE" <<EOF

  RECOMMENDED FIX FOR MODEL ISSUES:
  1. Check if the GPU server is online and running: ping $GPU_HOST
  2. Verify that vLLM (:59982), Kokoro (:59643), and STT (:59805) containers are running on the GPU server.
  3. Verify that GPU_API_KEY in .env matches the master key on the GPU cluster.
EOF
    fi

    cat >> "$REPORT_FILE" <<EOF

--------------------------------------------------------------------------------
2. DOCKER CONTAINERS HEALTH
--------------------------------------------------------------------------------
EOF

    if [ ${#CONTAINER_FAILURES[@]} -eq 0 ]; then
        echo "  STATUS: All 7 system containers are healthy and running." >> "$REPORT_FILE"
    else
        echo "  STATUS: Container failures or restarts identified:" >> "$REPORT_FILE"
        for cf in "${CONTAINER_FAILURES[@]}"; do
            echo "  * $cf" >> "$REPORT_FILE"
        done
    fi

    if [ ${#NETWORK_WARNINGS[@]} -gt 0 ]; then
        cat >> "$REPORT_FILE" <<EOF

--------------------------------------------------------------------------------
3. NETWORK & TELEPHONY WARNINGS
--------------------------------------------------------------------------------
EOF
        for nw in "${NETWORK_WARNINGS[@]}"; do
            echo "  * $nw" >> "$REPORT_FILE"
        done
    fi

    cat >> "$REPORT_FILE" <<EOF

--------------------------------------------------------------------------------
4. RECENT CRASH & ERROR LOGS FROM LIVEKIT AGENT WORKER
--------------------------------------------------------------------------------
EOF
    if docker ps -a --format '{{.Names}}' | grep -q 'livekit-agent-worker'; then
        docker logs --tail 30 livekit-agent-worker 2>&1 | grep -iE 'error|warn|exception|fail|traceback|503|502' >> "$REPORT_FILE" || \
        docker logs --tail 15 livekit-agent-worker 2>&1 >> "$REPORT_FILE" || true
    else
        echo "  (livekit-agent-worker container not found)" >> "$REPORT_FILE"
    fi

    cat >> "$REPORT_FILE" <<EOF

--------------------------------------------------------------------------------
5. PERSISTENT MODEL ERROR LOG (logs/model_errors.log)
--------------------------------------------------------------------------------
EOF
    local found_model_log=false
    for log_path in "$SCRIPT_DIR/logs/model_errors.log" "$SCRIPT_DIR/contabo-worker/logs/model_errors.log"; do
        if [ -f "$log_path" ]; then
            tail -n 35 "$log_path" >> "$REPORT_FILE"
            found_model_log=true
            break
        fi
    done
    if [ "$found_model_log" = false ]; then
        echo "  No recent runtime model errors logged in logs/model_errors.log." >> "$REPORT_FILE"
    fi

    # Also save a copy inside logs/
    cp "$REPORT_FILE" "$LOGS_DIR/error_report.txt" 2>/dev/null || true

    echo ""
    pass "Text error report saved to: ${BOLD}${REPORT_FILE}${NC}"
    info "You can view it anytime with: ${BOLD}cat ${REPORT_FILE}${NC}"
}

# ─────────────────────────────────────────────────────────────────────────────
# 6. RESTART FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
restart_worker() {
    header "RESTARTING LIVEKIT AGENT WORKER"
    info "Applying newest .env configuration..."
    if [ -f "$SCRIPT_DIR/contabo-worker/docker-compose.contabo.yml" ]; then
        docker compose -f "$SCRIPT_DIR/contabo-worker/docker-compose.contabo.yml" restart agent-worker
    else
        docker restart livekit-agent-worker 2>/dev/null || true
    fi
    sleep 3
    pass "livekit-agent-worker restarted successfully!"
    info "Recent startup logs:"
    docker logs --tail 20 livekit-agent-worker
}

# ─────────────────────────────────────────────────────────────────────────────
# 7. LOG TAIL HANDLERS
# ─────────────────────────────────────────────────────────────────────────────
tail_logs() {
    local target="$1"
    case "$target" in
        worker|agent|livekit-agent-worker)
            info "Following live logs for livekit-agent-worker (Ctrl+C to exit)..."
            docker logs -f --tail 50 livekit-agent-worker
            ;;
        sip|livekit-sip)
            info "Following live logs for livekit-sip (Ctrl+C to exit)..."
            docker logs -f --tail 50 livekit-sip
            ;;
        server|livekit|livekit-server)
            info "Following live logs for livekit-server (Ctrl+C to exit)..."
            docker logs -f --tail 50 livekit-server
            ;;
        backend|crm|chatbot-backend)
            info "Following live logs for chatbot-backend (Ctrl+C to exit)..."
            docker logs -f --tail 50 chatbot-backend
            ;;
        frontend|ui|chatbot-frontend)
            info "Following live logs for chatbot-frontend (Ctrl+C to exit)..."
            docker logs -f --tail 50 chatbot-frontend
            ;;
        all)
            info "Following live logs across all containers (Ctrl+C to exit)..."
            docker compose logs -f --tail 20
            ;;
        *)
            warn "Unknown log target: '$target'"
            echo "Available targets: worker, sip, server, backend, frontend, all"
            exit 1
            ;;
    esac
}

# ─────────────────────────────────────────────────────────────────────────────
# CLI ROUTER
# ─────────────────────────────────────────────────────────────────────────────
CMD="${1:-doctor}"

case "$CMD" in
    doctor|check|status)
        header "APEX VOICE AI — SYSTEM HEALTH & CRASH DOCTOR"
        show_config
        test_gpu_services
        check_docker_containers
        check_sip_and_ports
        generate_error_report_file
        echo ""
        header "DIAGNOSTIC SUMMARY & QUICK COMMANDS"
        echo -e "  View text error report:   ${BOLD}cat error_report.txt${NC}"
        echo -e "  To view live agent logs:  ${BOLD}bash doctor.sh logs worker${NC}"
        echo -e "  To view live SIP logs:    ${BOLD}bash doctor.sh logs sip${NC}"
        echo -e "  To view live backend logs:${BOLD}bash doctor.sh logs backend${NC}"
        echo -e "  To reload after .env edit:${BOLD}bash doctor.sh restart${NC}"
        echo ""
        ;;
    report|errors)
        if [ ! -f "$REPORT_FILE" ]; then
            "$0" doctor
        else
            cat "$REPORT_FILE"
        fi
        ;;
    gpu)
        header "APEX VOICE AI — GPU MICROSERVICES TEST"
        show_config
        test_gpu_services
        generate_error_report_file
        ;;
    restart)
        restart_worker
        ;;
    logs|log)
        TARGET="${2:-worker}"
        tail_logs "$TARGET"
        ;;
    *)
        echo "Usage: bash doctor.sh [doctor|report|gpu|restart|logs <service>]"
        exit 1
        ;;
esac
