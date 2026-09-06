-- =============================================================
-- Chatbot & Voice AI Platform - Complete Database Schema (PostgreSQL 16)
-- Location: d:\Chatbot\database\schema.sql
-- =============================================================

-- 1. Multi-Tenant Organizations & Admin Accounts
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) DEFAULT 'Lead Admin',
    admin_email VARCHAR(255) DEFAULT 'admin@apexvoice.io',
    status VARCHAR(50) DEFAULT 'production', -- production, trial, suspended
    mrr DECIMAL(10,2) DEFAULT 0.00,
    credits_balance DECIMAL(10,2) DEFAULT 0.00, -- Voice Credits per admin/tenant (defaults to $0.00)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1b. User, Admin & Super Admin Accounts
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',             -- 'user', 'admin', 'super_admin'
    avatar VARCHAR(255) DEFAULT '/avatars/default.png',
    phone VARCHAR(50) DEFAULT '+1 (555) 019-2831',
    company VARCHAR(255) DEFAULT 'Apex Voice AI',
    status VARCHAR(50) DEFAULT 'active',         -- 'active', 'suspended', 'pending'
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SIP & Carrier Trunks
CREATE TABLE IF NOT EXISTS sip_trunks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'online',
    sip_server VARCHAR(255) NOT NULL,
    port INT DEFAULT 5060,
    transport VARCHAR(50) DEFAULT 'TLS',
    codec_priority JSONB DEFAULT '["Opus", "G.711u", "G.711a"]'::jsonb,
    max_channels INT DEFAULT 1000,
    allocated_channels INT DEFAULT 0,
    rate_per_minute_wholesale DECIMAL(6,4) DEFAULT 0.0035,
    pop_regions JSONB DEFAULT '["US-East", "US-West", "EU", "AP"]'::jsonb,
    is_default_carrier BOOLEAN DEFAULT false,
    api_key VARCHAR(255) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Email & SMS Gateways (SMTP / SES / Twilio)
CREATE TABLE IF NOT EXISTS gateways (
    id SERIAL PRIMARY KEY,
    gateway_name VARCHAR(100) NOT NULL,
    gateway_type VARCHAR(50) DEFAULT 'smtp', -- smtp, ses, twilio
    host VARCHAR(255),
    port INT DEFAULT 587,
    username VARCHAR(255),
    password_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active'
);

-- 4. Voice AI Engines & Models (LLM, STT, TTS)
CREATE TABLE IF NOT EXISTS ai_engines (
    id VARCHAR(100) PRIMARY KEY,
    engine_name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) DEFAULT 'OpenAI-Compatible vLLM',
    engine_type VARCHAR(50) DEFAULT 'llm', -- llm, stt, tts
    model_identifier VARCHAR(255),
    endpoint_url VARCHAR(255),
    api_key VARCHAR(255),
    tier_requirement VARCHAR(50) DEFAULT 'all',
    latency_avg_ms INT DEFAULT 110,
    cost_per_unit VARCHAR(100) DEFAULT '$0.40 / 1M tokens',
    is_custom BOOLEAN DEFAULT false,
    is_global_default BOOLEAN DEFAULT false,
    description TEXT,
    total_calls_executed INT DEFAULT 0,
    tokens_processed BIGINT DEFAULT 0,
    avg_latency_ms INT DEFAULT 110,
    monthly_cost DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Platform Monetization & Enterprise Plans
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    included_minutes INT DEFAULT 0,
    concurrency_limit INT DEFAULT 10
);

-- 6. System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Knowledge Base & Grounding RAG Documents
CREATE TABLE IF NOT EXISTS knowledge_base (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'document',
    status VARCHAR(50) DEFAULT 'indexed',
    chunk_count INT DEFAULT 0,
    size_kb INT DEFAULT 0,
    last_indexed TIMESTAMPTZ DEFAULT NOW(),
    assigned_agent_ids JSONB DEFAULT '[]'::jsonb,
    url TEXT,
    content_preview TEXT,
    chunks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Customer Contacts & Outbound Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'new',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Call Records & Telemetry Logs
CREATE TABLE IF NOT EXISTS call_records (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(100) NOT NULL UNIQUE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'completed',
    duration INT DEFAULT 0,
    jitter_ms DECIMAL(6,2) DEFAULT 0.0,
    packet_loss DECIMAL(5,2) DEFAULT 0.0,
    cost_per_hour DECIMAL(6,2) DEFAULT 0.0,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Calendar Bookings & Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    appointment_id VARCHAR(100) NOT NULL UNIQUE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    agent_id VARCHAR(100),
    caller_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 30,
    status VARCHAR(50) DEFAULT 'confirmed',
    calendar_type VARCHAR(50) DEFAULT 'google',
    agent_name VARCHAR(255) DEFAULT 'Marcus (Solar Advisor)',
    meeting_link VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Voice Outreach Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'outbound',
    agent_id VARCHAR(100),
    phone_number_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    script_template TEXT,
    voice_prompt TEXT,
    total_leads INT DEFAULT 0,
    attempted_leads INT DEFAULT 0,
    successful_leads INT DEFAULT 0,
    concurrency_limit INT DEFAULT 5,
    schedule VARCHAR(100) DEFAULT 'weekdays_9_to_5',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Live Supervisor Interventions
CREATE TABLE IF NOT EXISTS supervisor_interventions (
    id SERIAL PRIMARY KEY,
    call_id VARCHAR(100) NOT NULL,
    supervisor_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- whisper, barge_in, takeover
    whisper_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Inbound & Outbound Webhook Subscriptions
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    events TEXT[] DEFAULT '{"call.completed", "lead.qualified", "appointment.booked"}',
    secret VARCHAR(255) DEFAULT 'whsec_vault_2026_managed',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Unified CRM Contacts Ledger
CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255) DEFAULT 'Independent',
    lead_score INT DEFAULT 75,
    status VARCHAR(50) DEFAULT 'new',
    campaign_name VARCHAR(255) DEFAULT 'Inbound Direct',
    last_call_outcome VARCHAR(255) DEFAULT 'Not Called Yet',
    notes TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{"New Lead"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Third-Party Integrations State (Google Drive, Sheets, Zapier, Make, HubSpot, Salesforce)
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL UNIQUE, -- google_drive, google_sheets, zapier, make, hubspot, salesforce
    config JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'connected', -- connected, disconnected, degraded
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Google Drive Synced Documents & Audio Recordings
CREATE TABLE IF NOT EXISTS google_drive_files (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'transcript', -- transcript, audio, brief, spreadsheet
    drive_url VARCHAR(500) NOT NULL,
    linked_appointment_id VARCHAR(100),
    file_size_kb INT DEFAULT 240,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Automated Email Dispatches (Flow Builder & Gateways)
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    gateway_type VARCHAR(50) DEFAULT 'smtp', -- smtp, ses, sendgrid
    status VARCHAR(50) DEFAULT 'delivered',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Visual Flow Builder Conversation Definitions
CREATE TABLE IF NOT EXISTS flow_definitions (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,
    assigned_phone_number VARCHAR(100) DEFAULT '+1 (415) 890-2341',
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Telephony DID Phone Numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    number VARCHAR(50) NOT NULL,
    friendly_name VARCHAR(255) NOT NULL,
    country VARCHAR(10) DEFAULT 'US',
    assigned_agent_id VARCHAR(100),
    assigned_campaign_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    monthly_cost DECIMAL(6,2) DEFAULT 2.50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Voice AI Agents (Prompt, Voice, LLM, Rules & Telemetry)
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    avatar VARCHAR(255) DEFAULT 'solar-advisor',
    color VARCHAR(50) DEFAULT '#3157D5',
    status VARCHAR(50) DEFAULT 'active',
    voice JSONB DEFAULT '{}'::jsonb,
    llm_model VARCHAR(255) DEFAULT 'GPT-4o Mini (OpenAI)',
    language VARCHAR(100) DEFAULT 'English (US)',
    greeting TEXT,
    system_prompt TEXT,
    response_style VARCHAR(50) DEFAULT 'conversational',
    interruption_sensitivity DECIMAL(4,2) DEFAULT 0.75,
    silence_timeout_seconds INT DEFAULT 5,
    max_call_duration_minutes INT DEFAULT 15,
    knowledge_base_ids JSONB DEFAULT '[]'::jsonb,
    tools JSONB DEFAULT '[]'::jsonb,
    transfer_rules JSONB DEFAULT '{}'::jsonb,
    call_ending_rules JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Website Voice Widgets (Live Audio Web Embeds)
CREATE TABLE IF NOT EXISTS website_widgets (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    agent_id VARCHAR(100),
    agent_name VARCHAR(255),
    allowed_domains TEXT[] DEFAULT '{}',
    business_hours_enabled BOOLEAN DEFAULT false,
    primary_color VARCHAR(50) DEFAULT '#172033',
    button_label VARCHAR(100) DEFAULT 'VOICE CHAT',
    position VARCHAR(50) DEFAULT 'bottom-right',
    avatar_label VARCHAR(100) DEFAULT 'Agent AI',
    greeting_text TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Conversation Funnel & Drop-Off Intelligence
CREATE TABLE IF NOT EXISTS conversation_funnel_steps (
    id VARCHAR(100) PRIMARY KEY,
    step_number INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    node_type VARCHAR(50) DEFAULT 'greeting',
    visitors_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    drop_off_rate_percent DECIMAL(5,2) DEFAULT 0.0,
    drop_off_reason TEXT,
    ai_optimization_tip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. Analytics Overview & Intelligence Benchmarks
CREATE TABLE IF NOT EXISTS analytics_overview (
    id VARCHAR(100) PRIMARY KEY,
    time_range VARCHAR(20) DEFAULT '30d',
    conversation_success DECIMAL(5,2) DEFAULT 88.4,
    avg_resolution_cost DECIMAL(6,2) DEFAULT 0.42,
    p50_latency_ms INT DEFAULT 280,
    funnel_retention DECIMAL(5,2) DEFAULT 74.5,
    dialog_runs_analyzed INT DEFAULT 14280,
    hourly_volume JSONB DEFAULT '[]'::jsonb,
    call_outcomes JSONB DEFAULT '[]'::jsonb,
    latency_percentiles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. Prompt & Voice A/B Testing Studio (Champion vs Challenger)
CREATE TABLE IF NOT EXISTS ab_experiments (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'paused', 'completed'
    base_agent_id VARCHAR(100) DEFAULT 'agent-1',
    traffic_split_percent INT DEFAULT 50,
    variant_a JSONB NOT NULL DEFAULT '{}'::jsonb,
    variant_b JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics_a JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics_b JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score DECIMAL(5,2) DEFAULT 94.8,
    conversion_lift_percent DECIMAL(5,2) DEFAULT 18.6,
    winner VARCHAR(50), -- 'variantA', 'variantB', NULL
    start_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. Lead Capture & Custom Survey Forms
CREATE TABLE IF NOT EXISTS custom_forms (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields_count INT DEFAULT 1,
    responses_count INT DEFAULT 0,
    fields JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 26. Inbound & Outbound Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_id INT,
    event_type VARCHAR(100) NOT NULL,
    direction VARCHAR(20) DEFAULT 'inbound', -- 'inbound' or 'outbound'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    headers JSONB DEFAULT '{}'::jsonb,
    response_status INT DEFAULT 200,
    response_body TEXT,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. Synced Google Sheets Rows
CREATE TABLE IF NOT EXISTS google_sheet_rows (
    id SERIAL PRIMARY KEY,
    spreadsheet_id VARCHAR(255) NOT NULL DEFAULT '',
    spreadsheet_url VARCHAR(500) NOT NULL DEFAULT '',
    sheet_tab VARCHAR(100) NOT NULL DEFAULT 'Leads_2026',
    caller_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    agent_name VARCHAR(255) DEFAULT 'Marcus (Solar Advisor)',
    outcome VARCHAR(100) DEFAULT 'New Lead',
    score INT DEFAULT 85,
    booked_appointment VARCHAR(255) DEFAULT 'Pending Calendar Slot',
    qualification_notes TEXT DEFAULT '',
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);
-- Seed 3 Master Live GPU AI Microservices (Purging any obsolete engines)
DELETE FROM ai_engines WHERE id NOT IN ('eng-vllm-qwen', 'eng-kokoro-tts', 'eng-whisper-stt');

INSERT INTO ai_engines (
    id, engine_name, provider, engine_type, model_identifier, endpoint_url,
    api_key, tier_requirement, latency_avg_ms, cost_per_unit, is_custom,
    is_global_default, description, status, created_at
) VALUES 
(
    'eng-vllm-qwen',
    'vLLM Neural LLM Engine',
    'vLLM OpenAI-Compatible',
    'llm',
    'Qwen/Qwen2.5-7B-Instruct-AWQ',
    'http://77.54.200.11:15219/v1',
    'IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF',
    'all',
    110,
    '$0.10 / 1M tokens',
    true,
    true,
    'Self-hosted private GPU cluster running vLLM OpenAI-compatible REST server with Qwen 2.5 7B Instruct AWQ.',
    'active',
    CURRENT_TIMESTAMP
),
(
    'eng-kokoro-tts',
    'Kokoro Ultra-Fast Neural TTS',
    'Kokoro-82M ONNX',
    'tts',
    'kokoro-82m',
    'http://77.54.200.11:15137',
    'IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF',
    'all',
    45,
    '$0.005 / 1K chars',
    true,
    true,
    'Ultra-low ~45ms latency ONNX TTS engine with 82M parameters. 24 kHz, 16-bit Mono PCM WAV.',
    'active',
    CURRENT_TIMESTAMP
),
(
    'eng-whisper-stt',
    'Faster-Whisper CUDA Streaming Transcriber',
    'Faster-Whisper CUDA',
    'stt',
    'distil-large-v3',
    'http://77.54.200.11:15203',
    'IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF',
    'all',
    180,
    '$0.003 / min',
    true,
    true,
    'Real-time distil-large-v3 model on NVIDIA CUDA (float16) with entity extraction and websocket streaming.',
    'active',
    CURRENT_TIMESTAMP
),
(
    'eng-vad-silero',
    'Silero VAD v5 Neural Chunk Monitor',
    'Silero VAD GPU Microservice',
    'stt',
    'silero-vad-v5',
    'http://77.54.200.11:15290',
    'IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF',
    'all',
    5,
    '$0.00 / Self-Hosted GPU',
    true,
    false,
    'Sub-5ms caller interruption / barge-in neural chunk monitor with 16 kHz sample rate, 512 samples per frame (32ms window).',
    'active',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    engine_name = EXCLUDED.engine_name,
    provider = EXCLUDED.provider,
    engine_type = EXCLUDED.engine_type,
    model_identifier = EXCLUDED.model_identifier,
    endpoint_url = EXCLUDED.endpoint_url,
    api_key = EXCLUDED.api_key,
    latency_avg_ms = EXCLUDED.latency_avg_ms,
    description = EXCLUDED.description,
    status = EXCLUDED.status;
