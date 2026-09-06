--
-- PostgreSQL database dump
--

\restrict wISDAGsDNvAdA49hzd773bZDbvxrKdatDpK98O7DB0V81cBXdQ2yuVvOJlWnb7U

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg12+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg12+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.website_widgets DROP CONSTRAINT IF EXISTS website_widgets_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.webhooks DROP CONSTRAINT IF EXISTS webhooks_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.phone_numbers DROP CONSTRAINT IF EXISTS phone_numbers_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.integrations DROP CONSTRAINT IF EXISTS integrations_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.google_drive_files DROP CONSTRAINT IF EXISTS google_drive_files_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.flow_definitions DROP CONSTRAINT IF EXISTS flow_definitions_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS email_logs_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contacts DROP CONSTRAINT IF EXISTS contacts_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaigns DROP CONSTRAINT IF EXISTS campaigns_organization_id_fkey;
ALTER TABLE IF EXISTS ONLY public.call_records DROP CONSTRAINT IF EXISTS call_records_lead_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_lead_id_fkey;
DROP INDEX IF EXISTS public.idx_website_widgets_tenant_id;
DROP INDEX IF EXISTS public.idx_webhooks_tenant_id;
DROP INDEX IF EXISTS public.idx_leads_tenant_id;
DROP INDEX IF EXISTS public.idx_knowledge_base_tenant_id;
DROP INDEX IF EXISTS public.idx_flow_definitions_tenant_id;
DROP INDEX IF EXISTS public.idx_custom_forms_tenant_id;
DROP INDEX IF EXISTS public.idx_contacts_tenant_id;
DROP INDEX IF EXISTS public.idx_campaigns_tenant_id;
DROP INDEX IF EXISTS public.idx_call_records_tenant_id;
DROP INDEX IF EXISTS public.idx_appointments_tenant_id;
DROP INDEX IF EXISTS public.idx_agents_tenant_id;
DROP INDEX IF EXISTS public.idx_ab_experiments_tenant_id;
ALTER TABLE IF EXISTS ONLY public.website_widgets DROP CONSTRAINT IF EXISTS website_widgets_pkey;
ALTER TABLE IF EXISTS ONLY public.webhooks DROP CONSTRAINT IF EXISTS webhooks_pkey;
ALTER TABLE IF EXISTS ONLY public.webhook_logs DROP CONSTRAINT IF EXISTS webhook_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.supervisor_interventions DROP CONSTRAINT IF EXISTS supervisor_interventions_pkey;
ALTER TABLE IF EXISTS ONLY public.sip_trunks DROP CONSTRAINT IF EXISTS sip_trunks_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.server_api_logs DROP CONSTRAINT IF EXISTS server_api_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_plans DROP CONSTRAINT IF EXISTS platform_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.plans DROP CONSTRAINT IF EXISTS plans_pkey;
ALTER TABLE IF EXISTS ONLY public.phone_numbers DROP CONSTRAINT IF EXISTS phone_numbers_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.leads DROP CONSTRAINT IF EXISTS leads_pkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_base DROP CONSTRAINT IF EXISTS knowledge_base_pkey;
ALTER TABLE IF EXISTS ONLY public.integrations DROP CONSTRAINT IF EXISTS integrations_provider_key;
ALTER TABLE IF EXISTS ONLY public.integrations DROP CONSTRAINT IF EXISTS integrations_pkey;
ALTER TABLE IF EXISTS ONLY public.google_sheet_rows DROP CONSTRAINT IF EXISTS google_sheet_rows_pkey;
ALTER TABLE IF EXISTS ONLY public.google_drive_files DROP CONSTRAINT IF EXISTS google_drive_files_pkey;
ALTER TABLE IF EXISTS ONLY public.gateways DROP CONSTRAINT IF EXISTS gateways_pkey;
ALTER TABLE IF EXISTS ONLY public.flow_definitions DROP CONSTRAINT IF EXISTS flow_definitions_pkey;
ALTER TABLE IF EXISTS ONLY public.email_logs DROP CONSTRAINT IF EXISTS email_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.custom_forms DROP CONSTRAINT IF EXISTS custom_forms_pkey;
ALTER TABLE IF EXISTS ONLY public.conversation_funnel_steps DROP CONSTRAINT IF EXISTS conversation_funnel_steps_pkey;
ALTER TABLE IF EXISTS ONLY public.contacts DROP CONSTRAINT IF EXISTS contacts_pkey;
ALTER TABLE IF EXISTS ONLY public.campaigns DROP CONSTRAINT IF EXISTS campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public.call_records DROP CONSTRAINT IF EXISTS call_records_pkey;
ALTER TABLE IF EXISTS ONLY public.call_records DROP CONSTRAINT IF EXISTS call_records_call_id_key;
ALTER TABLE IF EXISTS ONLY public.billing_invoices DROP CONSTRAINT IF EXISTS billing_invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_appointment_id_key;
ALTER TABLE IF EXISTS ONLY public.announcements DROP CONSTRAINT IF EXISTS announcements_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_overview DROP CONSTRAINT IF EXISTS analytics_overview_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_engines DROP CONSTRAINT IF EXISTS ai_engines_pkey;
ALTER TABLE IF EXISTS ONLY public.agents DROP CONSTRAINT IF EXISTS agents_pkey;
ALTER TABLE IF EXISTS ONLY public.ab_experiments DROP CONSTRAINT IF EXISTS ab_experiments_pkey;
ALTER TABLE IF EXISTS public.webhooks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.webhook_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tenants ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supervisor_interventions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sip_trunks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.integrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.google_sheet_rows ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.google_drive_files ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.gateways ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.email_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.call_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.appointments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.announcements ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.website_widgets;
DROP SEQUENCE IF EXISTS public.webhooks_id_seq;
DROP TABLE IF EXISTS public.webhooks;
DROP SEQUENCE IF EXISTS public.webhook_logs_id_seq;
DROP TABLE IF EXISTS public.webhook_logs;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.tenants_id_seq;
DROP TABLE IF EXISTS public.tenants;
DROP SEQUENCE IF EXISTS public.supervisor_interventions_id_seq;
DROP TABLE IF EXISTS public.supervisor_interventions;
DROP SEQUENCE IF EXISTS public.sip_trunks_id_seq;
DROP TABLE IF EXISTS public.sip_trunks;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.server_api_logs;
DROP TABLE IF EXISTS public.platform_plans;
DROP SEQUENCE IF EXISTS public.plans_id_seq;
DROP TABLE IF EXISTS public.plans;
DROP TABLE IF EXISTS public.phone_numbers;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.leads;
DROP TABLE IF EXISTS public.knowledge_base;
DROP SEQUENCE IF EXISTS public.integrations_id_seq;
DROP TABLE IF EXISTS public.integrations;
DROP SEQUENCE IF EXISTS public.google_sheet_rows_id_seq;
DROP TABLE IF EXISTS public.google_sheet_rows;
DROP SEQUENCE IF EXISTS public.google_drive_files_id_seq;
DROP TABLE IF EXISTS public.google_drive_files;
DROP SEQUENCE IF EXISTS public.gateways_id_seq;
DROP TABLE IF EXISTS public.gateways;
DROP TABLE IF EXISTS public.flow_definitions;
DROP SEQUENCE IF EXISTS public.email_logs_id_seq;
DROP TABLE IF EXISTS public.email_logs;
DROP TABLE IF EXISTS public.custom_forms;
DROP TABLE IF EXISTS public.conversation_funnel_steps;
DROP TABLE IF EXISTS public.contacts;
DROP TABLE IF EXISTS public.campaigns;
DROP SEQUENCE IF EXISTS public.call_records_id_seq;
DROP TABLE IF EXISTS public.call_records;
DROP TABLE IF EXISTS public.billing_invoices;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.appointments_id_seq;
DROP TABLE IF EXISTS public.appointments;
DROP SEQUENCE IF EXISTS public.announcements_id_seq;
DROP TABLE IF EXISTS public.announcements;
DROP TABLE IF EXISTS public.analytics_overview;
DROP TABLE IF EXISTS public.ai_engines;
DROP TABLE IF EXISTS public.agents;
DROP TABLE IF EXISTS public.ab_experiments;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ab_experiments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ab_experiments (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'running'::character varying,
    base_agent_id character varying(100) DEFAULT 'agent-1'::character varying,
    traffic_split_percent integer DEFAULT 50,
    variant_a jsonb DEFAULT '{}'::jsonb NOT NULL,
    variant_b jsonb DEFAULT '{}'::jsonb NOT NULL,
    metrics_a jsonb DEFAULT '{}'::jsonb NOT NULL,
    metrics_b jsonb DEFAULT '{}'::jsonb NOT NULL,
    confidence_score numeric(5,2) DEFAULT 94.8,
    conversion_lift_percent numeric(5,2) DEFAULT 18.6,
    winner character varying(50),
    start_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.ab_experiments OWNER TO postgres;

--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    avatar character varying(255) DEFAULT 'solar-advisor'::character varying,
    color character varying(50) DEFAULT '#3157D5'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    voice jsonb DEFAULT '{}'::jsonb,
    llm_model character varying(255) DEFAULT 'GPT-4o Mini (OpenAI)'::character varying,
    language character varying(100) DEFAULT 'English (US)'::character varying,
    greeting text,
    system_prompt text,
    response_style character varying(50) DEFAULT 'conversational'::character varying,
    interruption_sensitivity numeric(4,2) DEFAULT 0.75,
    silence_timeout_seconds integer DEFAULT 5,
    max_call_duration_minutes integer DEFAULT 15,
    knowledge_base_ids jsonb DEFAULT '[]'::jsonb,
    tools jsonb DEFAULT '[]'::jsonb,
    transfer_rules jsonb DEFAULT '{}'::jsonb,
    call_ending_rules jsonb DEFAULT '{}'::jsonb,
    metrics jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    assigned_phone_number character varying(100),
    assigned_phone_number_id character varying(100),
    human_realism jsonb DEFAULT '{"fillerFrequency": "medium", "maxWordsPerTurn": 25, "enableMicroBreaths": true, "enableBackchanneling": true, "enableAdaptiveEmotion": true}'::jsonb,
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: ai_engines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_engines (
    id character varying(100) NOT NULL,
    engine_name character varying(255) NOT NULL,
    provider character varying(100) DEFAULT 'OpenAI-Compatible vLLM'::character varying,
    engine_type character varying(50) DEFAULT 'llm'::character varying,
    model_identifier character varying(255),
    endpoint_url character varying(255),
    api_key character varying(255),
    tier_requirement character varying(50) DEFAULT 'all'::character varying,
    latency_avg_ms integer DEFAULT 110,
    cost_per_unit character varying(100) DEFAULT '$0.40 / 1M tokens'::character varying,
    is_custom boolean DEFAULT false,
    is_global_default boolean DEFAULT false,
    description text,
    total_calls_executed integer DEFAULT 0,
    tokens_processed bigint DEFAULT 0,
    avg_latency_ms integer DEFAULT 110,
    monthly_cost numeric(10,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ai_engines OWNER TO postgres;

--
-- Name: analytics_overview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analytics_overview (
    id character varying(100) NOT NULL,
    time_range character varying(20) DEFAULT '30d'::character varying,
    conversation_success numeric(5,2) DEFAULT 88.4,
    avg_resolution_cost numeric(6,2) DEFAULT 0.42,
    p50_latency_ms integer DEFAULT 280,
    funnel_retention numeric(5,2) DEFAULT 74.5,
    dialog_runs_analyzed integer DEFAULT 14280,
    hourly_volume jsonb DEFAULT '[]'::jsonb,
    call_outcomes jsonb DEFAULT '[]'::jsonb,
    latency_percentiles jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.analytics_overview OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    severity character varying(50) DEFAULT 'info'::character varying,
    target_audience character varying(100) DEFAULT 'all'::character varying,
    target_tenant_name character varying(255) DEFAULT 'All Tenant Orgs'::character varying,
    active boolean DEFAULT true,
    published_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    appointment_id character varying(100) NOT NULL,
    lead_id uuid,
    agent_id character varying(100),
    caller_name character varying(255),
    phone character varying(50),
    email character varying(255),
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    status character varying(50) DEFAULT 'confirmed'::character varying,
    calendar_type character varying(50) DEFAULT 'google'::character varying,
    agent_name character varying(255) DEFAULT 'Marcus (Solar Advisor)'::character varying,
    meeting_link character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    description text,
    ip_address character varying(45) DEFAULT '127.0.0.1'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: billing_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_invoices (
    id character varying(100) NOT NULL,
    tenant_id integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    formatted_amount character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'paid'::character varying,
    transaction_type character varying(50) DEFAULT 'plan_assignment'::character varying,
    receipt_url character varying(255) DEFAULT '#'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.billing_invoices OWNER TO postgres;

--
-- Name: call_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.call_records (
    id integer NOT NULL,
    call_id character varying(100) NOT NULL,
    lead_id uuid,
    status character varying(50) DEFAULT 'completed'::character varying,
    duration integer DEFAULT 0,
    jitter_ms numeric(6,2) DEFAULT 0.0,
    packet_loss numeric(5,2) DEFAULT 0.0,
    cost_per_hour numeric(6,2) DEFAULT 0.0,
    transcript text,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id integer DEFAULT 1,
    llm_model character varying(255) DEFAULT 'Qwen/Qwen2.5-7B-Instruct-AWQ'::character varying,
    tts_model character varying(255) DEFAULT 'Kokoro-82M'::character varying,
    stt_model character varying(255) DEFAULT 'Faster-Whisper distil-large-v3'::character varying
);


ALTER TABLE public.call_records OWNER TO postgres;

--
-- Name: call_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.call_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.call_records_id_seq OWNER TO postgres;

--
-- Name: call_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.call_records_id_seq OWNED BY public.call_records.id;


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id integer,
    name character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'outbound'::character varying,
    agent_id character varying(100),
    phone_number_id character varying(100),
    status character varying(50) DEFAULT 'draft'::character varying,
    script_template text,
    voice_prompt text,
    total_leads integer DEFAULT 0,
    attempted_leads integer DEFAULT 0,
    successful_leads integer DEFAULT 0,
    concurrency_limit integer DEFAULT 5,
    schedule character varying(100) DEFAULT 'weekdays_9_to_5'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    agent_name character varying(255) DEFAULT 'Marcus (Solar Advisor)'::character varying,
    phone_number character varying(100) DEFAULT '+1 (800) 459-0120'::character varying,
    called_leads integer DEFAULT 0,
    connected_leads integer DEFAULT 0,
    qualified_leads integer DEFAULT 0,
    conversion_rate numeric(5,2) DEFAULT 0.0,
    answer_rate numeric(5,2) DEFAULT 0.0,
    retry_attempts integer DEFAULT 3,
    retry_interval_minutes integer DEFAULT 30,
    amd_config jsonb DEFAULT '{}'::jsonb,
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id character varying(100) NOT NULL,
    tenant_id integer,
    name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255),
    company character varying(255) DEFAULT 'Independent'::character varying,
    lead_score integer DEFAULT 75,
    status character varying(50) DEFAULT 'new'::character varying,
    campaign_name character varying(255) DEFAULT 'Inbound Direct'::character varying,
    last_call_outcome character varying(255) DEFAULT 'Not Called Yet'::character varying,
    notes text DEFAULT ''::text,
    tags text[] DEFAULT '{"New Lead"}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: conversation_funnel_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_funnel_steps (
    id character varying(100) NOT NULL,
    step_number integer NOT NULL,
    step_name character varying(255) NOT NULL,
    node_type character varying(50) DEFAULT 'greeting'::character varying,
    visitors_count integer DEFAULT 0,
    completed_count integer DEFAULT 0,
    drop_off_rate_percent numeric(5,2) DEFAULT 0.0,
    drop_off_reason text,
    ai_optimization_tip text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversation_funnel_steps OWNER TO postgres;

--
-- Name: custom_forms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_forms (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    fields_count integer DEFAULT 1,
    responses_count integer DEFAULT 0,
    fields jsonb DEFAULT '[]'::jsonb,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.custom_forms OWNER TO postgres;

--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    tenant_id integer,
    recipient character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    body text,
    gateway_type character varying(50) DEFAULT 'smtp'::character varying,
    status character varying(50) DEFAULT 'delivered'::character varying,
    sent_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_logs_id_seq OWNER TO postgres;

--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: flow_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flow_definitions (
    id character varying(100) NOT NULL,
    tenant_id integer,
    name character varying(255) NOT NULL,
    nodes jsonb DEFAULT '[]'::jsonb,
    edges jsonb DEFAULT '[]'::jsonb,
    assigned_phone_number character varying(100) DEFAULT '+1 (415) 890-2341'::character varying,
    is_active boolean DEFAULT true,
    updated_at timestamp with time zone DEFAULT now(),
    description text DEFAULT ''::text,
    agent_id character varying(100),
    agent_name character varying(255) DEFAULT 'Elena (Customer Care)'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    notes jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.flow_definitions OWNER TO postgres;

--
-- Name: gateways; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gateways (
    id integer NOT NULL,
    gateway_name character varying(100) NOT NULL,
    gateway_type character varying(50) DEFAULT 'smtp'::character varying,
    host character varying(255),
    port integer DEFAULT 587,
    username character varying(255),
    password_hash character varying(255),
    status character varying(50) DEFAULT 'active'::character varying,
    provider character varying(100) DEFAULT 'amazon_ses'::character varying,
    auth_key character varying(255) DEFAULT ''::character varying,
    from_identity character varying(255) DEFAULT 'alerts@apexvoice.ai'::character varying,
    monthly_sent integer DEFAULT 0,
    delivery_rate numeric(5,2) DEFAULT 99.80,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gateways OWNER TO postgres;

--
-- Name: gateways_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gateways_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gateways_id_seq OWNER TO postgres;

--
-- Name: gateways_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gateways_id_seq OWNED BY public.gateways.id;


--
-- Name: google_drive_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.google_drive_files (
    id integer NOT NULL,
    tenant_id integer,
    file_name character varying(255) NOT NULL,
    file_type character varying(50) DEFAULT 'transcript'::character varying,
    drive_url character varying(500) NOT NULL,
    linked_appointment_id character varying(100),
    file_size_kb integer DEFAULT 240,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.google_drive_files OWNER TO postgres;

--
-- Name: google_drive_files_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.google_drive_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.google_drive_files_id_seq OWNER TO postgres;

--
-- Name: google_drive_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.google_drive_files_id_seq OWNED BY public.google_drive_files.id;


--
-- Name: google_sheet_rows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.google_sheet_rows (
    id integer NOT NULL,
    spreadsheet_id character varying(255) DEFAULT ''::character varying NOT NULL,
    spreadsheet_url character varying(500) DEFAULT ''::character varying NOT NULL,
    sheet_tab character varying(100) DEFAULT 'Leads_2026'::character varying NOT NULL,
    caller_name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    agent_name character varying(255) DEFAULT 'Marcus (Solar Advisor)'::character varying,
    outcome character varying(100) DEFAULT 'New Lead'::character varying,
    score integer DEFAULT 85,
    booked_appointment character varying(255) DEFAULT 'Pending Calendar Slot'::character varying,
    qualification_notes text DEFAULT ''::text,
    raw_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    synced_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.google_sheet_rows OWNER TO postgres;

--
-- Name: google_sheet_rows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.google_sheet_rows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.google_sheet_rows_id_seq OWNER TO postgres;

--
-- Name: google_sheet_rows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.google_sheet_rows_id_seq OWNED BY public.google_sheet_rows.id;


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.integrations (
    id integer NOT NULL,
    tenant_id integer,
    provider character varying(100) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    status character varying(50) DEFAULT 'connected'::character varying,
    last_synced_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.integrations OWNER TO postgres;

--
-- Name: integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.integrations_id_seq OWNER TO postgres;

--
-- Name: integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.integrations_id_seq OWNED BY public.integrations.id;


--
-- Name: knowledge_base; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_base (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) DEFAULT 'document'::character varying,
    status character varying(50) DEFAULT 'indexed'::character varying,
    chunk_count integer DEFAULT 0,
    size_kb integer DEFAULT 0,
    last_indexed timestamp with time zone DEFAULT now(),
    assigned_agent_ids jsonb DEFAULT '[]'::jsonb,
    url text,
    content_preview text,
    chunks jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.knowledge_base OWNER TO postgres;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid,
    phone character varying(50) NOT NULL,
    name character varying(255),
    email character varying(255),
    status character varying(50) DEFAULT 'new'::character varying,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id integer DEFAULT 1
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_id_seq OWNER TO postgres;

--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: phone_numbers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phone_numbers (
    id character varying(100) NOT NULL,
    tenant_id integer,
    number character varying(50) NOT NULL,
    friendly_name character varying(255) NOT NULL,
    country character varying(10) DEFAULT 'US'::character varying,
    assigned_agent_id character varying(100),
    assigned_campaign_id character varying(100),
    status character varying(50) DEFAULT 'active'::character varying,
    monthly_cost numeric(6,2) DEFAULT 2.50,
    created_at timestamp with time zone DEFAULT now(),
    capabilities jsonb DEFAULT '{"mms": false, "sms": true, "voice": true}'::jsonb
);


ALTER TABLE public.phone_numbers OWNER TO postgres;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id integer NOT NULL,
    plan_name character varying(100) NOT NULL,
    monthly_price numeric(10,2) DEFAULT 0.00,
    included_minutes integer DEFAULT 0,
    concurrency_limit integer DEFAULT 10
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plans_id_seq OWNER TO postgres;

--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: platform_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_plans (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    description text DEFAULT ''::text,
    monthly_price numeric(10,2) DEFAULT 0.00,
    six_months_price numeric(10,2) DEFAULT 0.00,
    yearly_price numeric(10,2) DEFAULT 0.00,
    pay_as_you_go_rate_per_minute numeric(6,4) DEFAULT 0.10,
    credit_multiplier numeric(4,2) DEFAULT 1.0,
    included_minutes integer DEFAULT 0,
    max_concurrency integer DEFAULT 10,
    features jsonb DEFAULT '[]'::jsonb,
    allowed_engines_count integer DEFAULT 3,
    is_popular boolean DEFAULT false,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.platform_plans OWNER TO postgres;

--
-- Name: server_api_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.server_api_logs (
    id character varying(100) NOT NULL,
    api_id character varying(100) NOT NULL,
    method character varying(10) NOT NULL,
    path character varying(255) NOT NULL,
    status_code integer NOT NULL,
    latency_ms numeric(8,2) NOT NULL,
    client_ip character varying(50) DEFAULT '127.0.0.1'::character varying,
    level character varying(20) DEFAULT 'info'::character varying,
    message text,
    raw_gin_line text,
    request_body text,
    response_body text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.server_api_logs OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(100),
    tenant_id integer,
    session_token character varying(500) NOT NULL,
    ip_address character varying(50) DEFAULT '127.0.0.1'::character varying,
    user_agent text,
    is_revoked boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: sip_trunks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sip_trunks (
    id integer NOT NULL,
    carrier_name character varying(100) NOT NULL,
    active_channels integer DEFAULT 0,
    max_capacity integer DEFAULT 1000,
    rate_per_min numeric(6,4) DEFAULT 0.0035,
    status character varying(50) DEFAULT 'online'::character varying,
    api_key character varying(255) DEFAULT ''::character varying
);


ALTER TABLE public.sip_trunks OWNER TO postgres;

--
-- Name: sip_trunks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sip_trunks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sip_trunks_id_seq OWNER TO postgres;

--
-- Name: sip_trunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sip_trunks_id_seq OWNED BY public.sip_trunks.id;


--
-- Name: supervisor_interventions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supervisor_interventions (
    id integer NOT NULL,
    call_id character varying(100) NOT NULL,
    supervisor_id character varying(100) NOT NULL,
    action_type character varying(50) NOT NULL,
    whisper_text text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.supervisor_interventions OWNER TO postgres;

--
-- Name: supervisor_interventions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supervisor_interventions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supervisor_interventions_id_seq OWNER TO postgres;

--
-- Name: supervisor_interventions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supervisor_interventions_id_seq OWNED BY public.supervisor_interventions.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id integer NOT NULL,
    tenant_name character varying(255) NOT NULL,
    admin_name character varying(255) DEFAULT 'Lead Admin'::character varying,
    admin_email character varying(255) DEFAULT 'admin@apexvoice.io'::character varying,
    status character varying(50) DEFAULT 'production'::character varying,
    mrr numeric(10,2) DEFAULT 0.00,
    credits_balance numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT now(),
    admin_password character varying(255) DEFAULT 'Admin@123'::character varying,
    plan_id character varying(100) DEFAULT 'plan-enterprise'::character varying,
    plan_name character varying(255) DEFAULT 'Enterprise Tier'::character varying,
    billing_cycle character varying(50) DEFAULT 'monthly'::character varying,
    credit_rate_per_minute numeric(6,4) DEFAULT 0.08,
    max_concurrency integer DEFAULT 100,
    active_calls_now integer DEFAULT 0,
    total_minutes_used_this_month integer DEFAULT 0,
    assigned_sip_carrier character varying(255) DEFAULT 'Telnyx Elastic Tier-1'::character varying,
    assigned_email_gateway character varying(255) DEFAULT 'Amazon SES Primary'::character varying,
    assigned_sms_gateway character varying(255) DEFAULT 'Twilio 10DLC Pool'::character varying,
    allowed_llms jsonb DEFAULT '["gpt-4o", "claude-3-5-sonnet", "deepseek-v3"]'::jsonb,
    allowed_tts jsonb DEFAULT '["kokoro-82m", "cartesia-sonic"]'::jsonb,
    allowed_stt jsonb DEFAULT '["deepgram-nova-3"]'::jsonb
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    avatar character varying(255) DEFAULT '/avatars/default.png'::character varying,
    phone character varying(50) DEFAULT '+1 (555) 019-2831'::character varying,
    company character varying(255) DEFAULT 'Apex Voice AI'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    reset_token character varying(255),
    reset_token_expiry timestamp with time zone,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_logs (
    id integer NOT NULL,
    webhook_id integer,
    event_type character varying(100) NOT NULL,
    direction character varying(20) DEFAULT 'inbound'::character varying,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    headers jsonb DEFAULT '{}'::jsonb,
    response_status integer DEFAULT 200,
    response_body text,
    ip_address character varying(45) DEFAULT '127.0.0.1'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.webhook_logs OWNER TO postgres;

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhook_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_logs_id_seq OWNER TO postgres;

--
-- Name: webhook_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhook_logs_id_seq OWNED BY public.webhook_logs.id;


--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhooks (
    id integer NOT NULL,
    tenant_id integer,
    name character varying(255) NOT NULL,
    url character varying(500) NOT NULL,
    events text[] DEFAULT '{call.completed,lead.qualified,appointment.booked}'::text[],
    secret character varying(255) DEFAULT 'whsec_vault_2026_managed'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.webhooks OWNER TO postgres;

--
-- Name: webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhooks_id_seq OWNER TO postgres;

--
-- Name: webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhooks_id_seq OWNED BY public.webhooks.id;


--
-- Name: website_widgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.website_widgets (
    id character varying(100) NOT NULL,
    tenant_id integer,
    name character varying(255) NOT NULL,
    agent_id character varying(100),
    agent_name character varying(255),
    allowed_domains text[] DEFAULT '{}'::text[],
    business_hours_enabled boolean DEFAULT false,
    primary_color character varying(50) DEFAULT '#172033'::character varying,
    button_label character varying(100) DEFAULT 'VOICE CHAT'::character varying,
    "position" character varying(50) DEFAULT 'bottom-right'::character varying,
    avatar_label character varying(100) DEFAULT 'Agent AI'::character varying,
    greeting_text text DEFAULT ''::text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.website_widgets OWNER TO postgres;

--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: call_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_records ALTER COLUMN id SET DEFAULT nextval('public.call_records_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: gateways id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gateways ALTER COLUMN id SET DEFAULT nextval('public.gateways_id_seq'::regclass);


--
-- Name: google_drive_files id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_drive_files ALTER COLUMN id SET DEFAULT nextval('public.google_drive_files_id_seq'::regclass);


--
-- Name: google_sheet_rows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_sheet_rows ALTER COLUMN id SET DEFAULT nextval('public.google_sheet_rows_id_seq'::regclass);


--
-- Name: integrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations ALTER COLUMN id SET DEFAULT nextval('public.integrations_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: sip_trunks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sip_trunks ALTER COLUMN id SET DEFAULT nextval('public.sip_trunks_id_seq'::regclass);


--
-- Name: supervisor_interventions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supervisor_interventions ALTER COLUMN id SET DEFAULT nextval('public.supervisor_interventions_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: webhook_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs ALTER COLUMN id SET DEFAULT nextval('public.webhook_logs_id_seq'::regclass);


--
-- Name: webhooks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks ALTER COLUMN id SET DEFAULT nextval('public.webhooks_id_seq'::regclass);


--
-- Data for Name: ab_experiments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ab_experiments (id, name, status, base_agent_id, traffic_split_percent, variant_a, variant_b, metrics_a, metrics_b, confidence_score, conversion_lift_percent, winner, start_date, created_at, updated_at, tenant_id) FROM stdin;
ab-1	Enterprise Pitch: Rachel (Direct & Fast) vs Marcus (Empathetic Storytelling)	running	agent-1	50	{"name": "Variant A: Direct ROI & Velocity", "greeting": "Hi there! Rachel from Apex. We help call centers automate 60k+ minutes with sub-300ms voice AI. How many calls does your team handle daily?", "provider": "ElevenLabs", "voiceName": "Rachel (US Professional)", "promptPreview": "Directly qualify budget and monthly call volume within 60 seconds. Push for immediate video demo."}	{"name": "Variant B: Empathetic Pain-Point Discovery", "greeting": "Hello, this is Marcus with Apex Voice Systems. I understand managing high call volumes can be exhausting for support agents. What's been the biggest bottleneck for your team lately?", "provider": "Cartesia", "voiceName": "Marcus (Calm & Empathetic)", "promptPreview": "Listen to the customer's IVR pain points first. Build rapport before offering a technical consultation."}	{"answerRate": 68.4, "callsCount": 1240, "avgDurationSec": 185, "conversionRate": 14.2, "sentimentScore": 82}	{"answerRate": 74.8, "callsCount": 1240, "avgDurationSec": 240, "conversionRate": 21.6, "sentimentScore": 93}	98.40	52.10	\N	2026-08-21 16:15:10.999621+00	2026-09-04 16:15:10.999621+00	2026-09-04 16:15:10.999621+00	1
ab-2	Solar Outreach: Bella (High Energy) vs Asteria (Crisp & Technical)	running	agent-3	50	{"name": "Variant A: High Energy Solar Savings", "greeting": "Hey! Bella here with SunPeak Energy. California utility rates just jumped 22%—did you check your roof rebate qualification yet?", "provider": "ElevenLabs", "voiceName": "Bella (Engaging & Clear)", "promptPreview": "Emphasize immediate 30% federal tax credit and SDG&E $350 rate hikes."}	{"name": "Variant B: Engineering & NEM 3.0 Battery Pitch", "greeting": "Hello, Asteria with SunPeak Technical Audits. We are reviewing residential battery storage grid resilience in your zip code.", "provider": "Deepgram", "voiceName": "Asteria (Crisp & Helpful)", "promptPreview": "Provide exact kWh calculations and battery storage backup guarantees."}	{"answerRate": 62.5, "callsCount": 890, "avgDurationSec": 145, "conversionRate": 11.4, "sentimentScore": 79}	{"answerRate": 71.2, "callsCount": 890, "avgDurationSec": 210, "conversionRate": 16.8, "sentimentScore": 88}	96.20	47.30	\N	2026-08-25 16:15:10.999621+00	2026-09-04 16:15:10.999621+00	2026-09-04 16:15:10.999621+00	1
ab-3	Healthcare Intake: Sarah (Warm Clinical) vs David (Direct Triage)	running	agent-2	50	{"name": "Variant A: Warm Clinical Compassion", "greeting": "Good morning, this is Sarah with Apex Health Care. I am here to help you get scheduled with our specialist team today.", "provider": "Cartesia", "voiceName": "Sarah (Empathetic Care)", "promptPreview": "Prioritize patient symptom comfort before scheduling intake triage."}	{"name": "Variant B: Rapid Direct Triage", "greeting": "Hello, David from Clinical Scheduling. Let's verify your insurance ID and book your earliest available appointment slot.", "provider": "ElevenLabs", "voiceName": "David (Authoritative Clinic)", "promptPreview": "Fast insurance verification and primary physician appointment slotting."}	{"answerRate": 81, "callsCount": 620, "avgDurationSec": 195, "conversionRate": 28.4, "sentimentScore": 94}	{"answerRate": 76.5, "callsCount": 620, "avgDurationSec": 160, "conversionRate": 22.1, "sentimentScore": 85}	94.50	28.50	\N	2026-08-28 16:15:10.999621+00	2026-09-04 16:15:10.999621+00	2026-09-04 16:15:10.999621+00	1
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, name, description, avatar, color, status, voice, llm_model, language, greeting, system_prompt, response_style, interruption_sensitivity, silence_timeout_seconds, max_call_duration_minutes, knowledge_base_ids, tools, transfer_rules, call_ending_rules, metrics, created_at, updated_at, assigned_phone_number, assigned_phone_number_id, human_realism, tenant_id) FROM stdin;
agent-sdr-2	Rachel (Enterprise SDR)	Inbound and outbound B2B pipeline development, discovery qualifications, and meeting confirmations.	/avatars/rachel.png	#6366F1	active	{"pitch": 1.0, "speed": 1.0, "accent": "American (US)", "gender": "female", "voiceId": "af_bella", "provider": "Kokoro-82M", "stability": 0.8, "voiceName": "Bella (US Female - Warm and Professional)", "similarity": 0.9}	Qwen/Qwen2.5-7B-Instruct-AWQ	English (US)	Hi there, this is Rachel from Apex Enterprise. Reaching out regarding your AI telephony inquiry.	You are Rachel, a sharp and engaging enterprise sales representative.	professional	0.65	3	20	["kb-enterprise-case-studies"]	[{"id": "tool-email", "name": "Send Demo Dossier", "type": "sms", "enabled": true, "description": "Dispatches PDF overview to lead email"}]	{"enabled": true, "department": "Enterprise Sales", "triggerPhrase": "speak with account executive", "destinationNumber": "+1 (800) 555-0188"}	{"goodbyePhrase": "I'll send over the meeting brief now. Have a great day!", "hangupOnSilence": true, "afterHoursBehavior": "transfer"}	{"totalCalls": 0, "successRate": 0, "connectedCalls": 0, "sentimentScore": 0, "avgDurationSeconds": 0}	2026-09-04 16:15:10.15045+00	2026-09-04 17:45:26.154718+00	\N	\N	{"fillerFrequency": "medium", "maxWordsPerTurn": 25, "enableMicroBreaths": true, "enableBackchanneling": true, "enableAdaptiveEmotion": true}	1
agent-cs-3	Elena (Customer Care)	Tier-1 customer support, billing questions, appointments rescheduling, and FAQs.	/avatars/elena.png	#10B981	active	{"pitch": 1.0, "speed": 1.0, "accent": "British (UK)", "gender": "female", "voiceId": "bf_emma", "provider": "Kokoro-82M", "stability": 0.85, "voiceName": "Emma (UK Female - Conversational and Direct)", "similarity": 0.9}	Qwen/Qwen2.5-7B-Instruct-AWQ	English (US)	Thank you for calling Customer Care. My name is Elena. How may I assist you today?	You are Elena, a calm, patient, and knowledgeable customer service representative.	empathetic	0.80	5	10	["kb-solar-faq", "kb-returns-policy"]	[{"id": "tool-lookup", "name": "Account Record Lookup", "type": "crm", "enabled": true, "description": "Retrieves subscriber profile"}]	{"enabled": true, "department": "Billing & Claims", "triggerPhrase": "speak with billing supervisor", "destinationNumber": "+1 (800) 555-0155"}	{"goodbyePhrase": "Thank you for contacting customer care. Take care!", "hangupOnSilence": true, "afterHoursBehavior": "voicemail"}	{"totalCalls": 0, "successRate": 0, "connectedCalls": 0, "sentimentScore": 0, "avgDurationSeconds": 0}	2026-09-04 16:15:10.15045+00	2026-09-04 16:15:10.15045+00	\N	\N	{"fillerFrequency": "medium", "maxWordsPerTurn": 25, "enableMicroBreaths": true, "enableBackchanneling": true, "enableAdaptiveEmotion": true}	1
agent-solar-1	Marcus (Solar Advisor)	Specialized in commercial & residential solar qualification, financing options, and calendar booking.	/avatars/marcus.png	#3157D5	active	{"pitch": 1.0, "speed": 1.0, "accent": "American (US)", "gender": "male", "voiceId": "am_adam", "provider": "Kokoro-82M", "stability": 0.75, "voiceName": "Adam (US Male - Deep and Engaging)", "similarity": 0.85}	Qwen/Qwen2.5-7B-Instruct-AWQ	English (US)	Hello, this is Marcus with Apex Solar Solutions. How are you today?	You are Marcus, an empathetic and professional solar consultant. Your goal is to qualify homeowners and schedule consultation demos.	conversational	0.70	4	15	["kb-solar-faq", "kb-pricing-2026"]	[{"id": "tool-cal", "name": "Google Calendar Booking", "type": "calendar", "enabled": true, "description": "Books meeting slots dynamically"}, {"id": "tool-crm", "name": "HubSpot Deal Push", "type": "crm", "enabled": true, "description": "Pushes contact and qualification score"}]	{"enabled": true, "department": "Senior Engineering", "triggerPhrase": "transfer to human specialist", "destinationNumber": "+1 (800) 555-0199"}	{"goodbyePhrase": "Thank you for your time. Have a wonderful day!", "hangupOnSilence": true, "afterHoursBehavior": "voicemail"}	{"totalCalls": 0, "successRate": 0, "connectedCalls": 0, "sentimentScore": 0, "avgDurationSeconds": 0}	2026-09-04 16:15:10.15045+00	2026-09-04 17:45:23.887622+00	\N	\N	{"fillerFrequency": "medium", "maxWordsPerTurn": 25, "enableMicroBreaths": true, "enableBackchanneling": true, "enableAdaptiveEmotion": true}	1
\.


--
-- Data for Name: ai_engines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_engines (id, engine_name, provider, engine_type, model_identifier, endpoint_url, api_key, tier_requirement, latency_avg_ms, cost_per_unit, is_custom, is_global_default, description, total_calls_executed, tokens_processed, avg_latency_ms, monthly_cost, status, created_at) FROM stdin;
eng-vllm-qwen	vLLM Neural LLM Engine	vLLM OpenAI-Compatible	llm	Qwen/Qwen2.5-7B-Instruct-AWQ	http://77.54.200.11:15219/v1	IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF	all	110	$0.00 / Self-Hosted GPU	t	t	Self-hosted private GPU cluster running vLLM OpenAI-compatible REST server with Qwen 2.5 7B Instruct AWQ.	0	0	110	0.00	active	2026-09-04 16:15:10.126604+00
eng-kokoro-tts	Kokoro Ultra-Fast Neural TTS	Kokoro-82M ONNX	tts	kokoro-82m	http://77.54.200.11:15137	IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF	all	45	$0.005 / 1K chars	t	t	Ultra-low ~45ms latency ONNX TTS engine with 82M parameters. 24 kHz, 16-bit Mono PCM WAV.	0	0	110	0.00	active	2026-09-04 17:03:43.28246+00
eng-whisper-stt	Faster-Whisper CUDA Streaming Transcriber	Faster-Whisper CUDA	stt	distil-large-v3	http://77.54.200.11:15203	IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF	all	180	$0.003 / min	t	t	Real-time distil-large-v3 model on NVIDIA CUDA (float16) with entity extraction and websocket streaming.	0	0	110	0.00	active	2026-09-04 17:03:43.28246+00
eng-vad-silero	Silero VAD v5 Neural Chunk Monitor	Silero VAD GPU Microservice	stt	silero-vad-v5	http://77.54.200.11:15290	IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF	all	5	$0.00 / Self-Hosted GPU	t	f	Sub-5ms caller interruption / barge-in neural chunk monitor with 16 kHz sample rate, 512 samples per frame (32ms window).	0	0	5	0.00	active	2026-09-04 18:28:43.572952+00
\.


--
-- Data for Name: analytics_overview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics_overview (id, time_range, conversation_success, avg_resolution_cost, p50_latency_ms, funnel_retention, dialog_runs_analyzed, hourly_volume, call_outcomes, latency_percentiles, created_at, updated_at) FROM stdin;
overview-30d	30d	88.40	0.42	280	74.50	14280	[{"hour": "08:00", "inbound": 140, "outbound": 210, "qualified": 85}, {"hour": "09:00", "inbound": 320, "outbound": 450, "qualified": 180}, {"hour": "10:00", "inbound": 580, "outbound": 720, "qualified": 340}, {"hour": "11:00", "inbound": 640, "outbound": 810, "qualified": 410}, {"hour": "12:00", "inbound": 480, "outbound": 590, "qualified": 290}, {"hour": "13:00", "inbound": 510, "outbound": 650, "qualified": 320}, {"hour": "14:00", "inbound": 690, "outbound": 880, "qualified": 450}, {"hour": "15:00", "inbound": 620, "outbound": 790, "qualified": 390}, {"hour": "16:00", "inbound": 440, "outbound": 610, "qualified": 280}, {"hour": "17:00", "inbound": 290, "outbound": 380, "qualified": 160}, {"hour": "18:00", "inbound": 150, "outbound": 190, "qualified": 75}]	[{"name": "Goal Completed", "value": 6886}, {"name": "Transferred to Human", "value": 1840}, {"name": "Voicemail Left", "value": 3120}, {"name": "Callback Requested", "value": 1420}, {"name": "Dropped / No Answer", "value": 1014}]	[{"p50": 65, "p90": 95, "p99": 140, "name": "Edge ASR (Deepgram)"}, {"p50": 115, "p90": 165, "p99": 240, "name": "LLM First Token (GPT-4o)"}, {"p50": 45, "p90": 70, "p99": 110, "name": "TTS Audio Chunk (Cartesia)"}, {"p50": 55, "p90": 80, "p99": 115, "name": "SIP Gateway Roundtrip"}]	2026-09-04 16:15:10.039656+00	2026-09-04 16:15:10.039656+00
overview-7d	7d	91.20	0.38	275	78.10	3840	[{"hour": "08:00", "inbound": 140, "outbound": 210, "qualified": 85}, {"hour": "09:00", "inbound": 320, "outbound": 450, "qualified": 180}, {"hour": "10:00", "inbound": 580, "outbound": 720, "qualified": 340}, {"hour": "11:00", "inbound": 640, "outbound": 810, "qualified": 410}, {"hour": "12:00", "inbound": 480, "outbound": 590, "qualified": 290}, {"hour": "13:00", "inbound": 510, "outbound": 650, "qualified": 320}, {"hour": "14:00", "inbound": 690, "outbound": 880, "qualified": 450}, {"hour": "15:00", "inbound": 620, "outbound": 790, "qualified": 390}, {"hour": "16:00", "inbound": 440, "outbound": 610, "qualified": 280}, {"hour": "17:00", "inbound": 290, "outbound": 380, "qualified": 160}, {"hour": "18:00", "inbound": 150, "outbound": 190, "qualified": 75}]	[{"name": "Goal Completed", "value": 6886}, {"name": "Transferred to Human", "value": 1840}, {"name": "Voicemail Left", "value": 3120}, {"name": "Callback Requested", "value": 1420}, {"name": "Dropped / No Answer", "value": 1014}]	[{"p50": 65, "p90": 95, "p99": 140, "name": "Edge ASR (Deepgram)"}, {"p50": 115, "p90": 165, "p99": 240, "name": "LLM First Token (GPT-4o)"}, {"p50": 45, "p90": 70, "p99": 110, "name": "TTS Audio Chunk (Cartesia)"}, {"p50": 55, "p90": 80, "p99": 115, "name": "SIP Gateway Roundtrip"}]	2026-09-04 16:15:10.039656+00	2026-09-04 16:15:10.039656+00
overview-90d	90d	86.80	0.45	290	71.90	42950	[{"hour": "08:00", "inbound": 140, "outbound": 210, "qualified": 85}, {"hour": "09:00", "inbound": 320, "outbound": 450, "qualified": 180}, {"hour": "10:00", "inbound": 580, "outbound": 720, "qualified": 340}, {"hour": "11:00", "inbound": 640, "outbound": 810, "qualified": 410}, {"hour": "12:00", "inbound": 480, "outbound": 590, "qualified": 290}, {"hour": "13:00", "inbound": 510, "outbound": 650, "qualified": 320}, {"hour": "14:00", "inbound": 690, "outbound": 880, "qualified": 450}, {"hour": "15:00", "inbound": 620, "outbound": 790, "qualified": 390}, {"hour": "16:00", "inbound": 440, "outbound": 610, "qualified": 280}, {"hour": "17:00", "inbound": 290, "outbound": 380, "qualified": 160}, {"hour": "18:00", "inbound": 150, "outbound": 190, "qualified": 75}]	[{"name": "Goal Completed", "value": 6886}, {"name": "Transferred to Human", "value": 1840}, {"name": "Voicemail Left", "value": 3120}, {"name": "Callback Requested", "value": 1420}, {"name": "Dropped / No Answer", "value": 1014}]	[{"p50": 65, "p90": 95, "p99": 140, "name": "Edge ASR (Deepgram)"}, {"p50": 115, "p90": 165, "p99": 240, "name": "LLM First Token (GPT-4o)"}, {"p50": 45, "p90": 70, "p99": 110, "name": "TTS Audio Chunk (Cartesia)"}, {"p50": 55, "p90": 80, "p99": 115, "name": "SIP Gateway Roundtrip"}]	2026-09-04 16:15:10.039656+00	2026-09-04 16:15:10.039656+00
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, message, severity, target_audience, target_tenant_name, active, published_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, appointment_id, lead_id, agent_id, caller_name, phone, email, scheduled_at, duration_minutes, status, calendar_type, agent_name, meeting_link, notes, created_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, event_type, description, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: billing_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_invoices (id, tenant_id, invoice_number, description, amount, formatted_amount, status, transaction_type, receipt_url, created_at) FROM stdin;
inv-1788538757061399606	1	TX-9010	Voice Platform Activation Grant (Growth Fleet)	250.00	+$250.00	paid	initial_grant	#	2026-09-04 16:19:17.062364+00
inv-1788542533366067097	5	TX-9050	Voice Platform Activation Grant (Growth Fleet)	250.00	+$250.00	paid	initial_grant	#	2026-09-04 17:22:13.366768+00
\.


--
-- Data for Name: call_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.call_records (id, call_id, lead_id, status, duration, jitter_ms, packet_loss, cost_per_hour, transcript, created_at, tenant_id, llm_model, tts_model, stt_model) FROM stdin;
1	call-sim-gpu-001	c1111111-2222-3333-4444-555555555551	completed	142	18.40	0.02	0.45	Agent (Marcus): Hello David! Marcus here from Apex Solar. I noticed your company was exploring commercial solar options for your facilities in California.\\nCaller (David): Hi Marcus, yes, we are evaluating a 250 kW rooftop installation for our warehouse.\\nAgent (Marcus): That is right in our sweet spot. Our commercial tier qualifies for a 30% federal ITC credit and accelerated depreciation. Would you be open to reviewing a preliminary layout this Thursday?	2026-09-04 16:57:56.372865+00	1	Qwen/Qwen2.5-7B-Instruct-AWQ	Kokoro-82M	Faster-Whisper distil-large-v3
2	call-sim-gpu-002	c1111111-2222-3333-4444-555555555552	completed	98	12.10	0.01	0.38	Agent (Rachel): Good morning Sarah, this is Rachel from Apex Voice AI. Reaching out regarding your inbound inquiry about our automated SDR dialing infrastructure.\\nCaller (Sarah): Hello Rachel, does your system integrate with our existing SIP trunk on Telnyx?\\nAgent (Rachel): Absolutely. We support native SIP routing directly through our LiveKit carrier gateway with sub-150ms speech-to-speech latency.	2026-09-04 17:27:56.372865+00	1	Qwen/Qwen2.5-7B-Instruct-AWQ	Kokoro-82M	Faster-Whisper distil-large-v3
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaigns (id, organization_id, name, type, agent_id, phone_number_id, status, script_template, voice_prompt, total_leads, attempted_leads, successful_leads, concurrency_limit, schedule, created_at, updated_at, agent_name, phone_number, called_leads, connected_leads, qualified_leads, conversion_rate, answer_rate, retry_attempts, retry_interval_minutes, amd_config, tenant_id) FROM stdin;
a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d	1	California Commercial Solar Q3 Outbound	outbound	agent-solar-1	\N	active	\N	\N	500	0	0	10	weekdays_9_to_5	2026-09-04 17:38:24.035177+00	2026-09-04 17:38:24.035177+00	Marcus (Solar Advisor)	+1 (415) 890-2341	312	245	88	28.20	78.50	3	30	{}	1
b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e	1	Inbound B2B Pipeline Qualification	inbound	agent-sdr-2	\N	active	\N	\N	250	0	0	15	always_on	2026-09-04 17:38:24.035177+00	2026-09-04 17:38:24.035177+00	Rachel (Enterprise SDR)	+1 (415) 639-0491	198	185	92	46.50	93.40	3	30	{}	1
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, tenant_id, name, phone, email, company, lead_score, status, campaign_name, last_call_outcome, notes, tags, created_at, updated_at) FROM stdin;
cont-1	\N	Dr. Jonathan Vance	+1 (555) 432-8899	jonathan.vance@apexhealth.org	Apex Healthcare Systems	95	qualified	Executive Medical Triage	Appointment Booked	[Call Outcome: Appointment Booked] Handled by Elena (Customer Care). Caller requested solutions consultation. Verified contact details and locked Google Calendar slot. High purchasing intent.	{VIP,"High Intent",Medical}	2026-09-04 14:15:11.003243+00	2026-09-04 14:15:11.003243+00
cont-2	\N	Sarah Jenkins	+1 (415) 890-2341	sarah.jenkins@lumina-cloud.io	Lumina Cloud Architecture	88	in_progress	Cloud Solutions Inbound	Knowledge Inquiry / Price Check	[Call Outcome: Knowledge Inquiry / Price Check] Caller inquired about SOC2 Type II compliance and Tier 3 volume discounts. AI provided SOC2 & Tier-1 pricing dossier. Caller showed interest; guided back to conversation flow.	{Enterprise,"SOC2 Check"}	2026-09-04 11:15:11.003243+00	2026-09-04 11:15:11.003243+00
cont-3	\N	Michael Scott	+1 (555) 902-1133	michael.scott@dunder.com	Dunder Mifflin Paper Co	60	no_answer	Outbound Sales Sprint	No Answer / Missed	[Call Outcome: No Answer / Missed] Outbound call attempted by Marcus Vance. No pickup detected after 25s ring. Scheduled for automated Smart-AMD retry in 4 hours.	{Outbound,"Retry Scheduled"}	2026-09-03 16:15:11.003243+00	2026-09-03 16:15:11.003243+00
\.


--
-- Data for Name: conversation_funnel_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation_funnel_steps (id, step_number, step_name, node_type, visitors_count, completed_count, drop_off_rate_percent, drop_off_reason, ai_optimization_tip, created_at, updated_at) FROM stdin;
step-1	1	Greeting & Brand Introduction	greeting	14280	13137	8.00	Long intro greetings cause premature hang-ups.	Keep greeting under 12 words. Introduce agent within the first 1.5 seconds.	2026-09-04 16:15:10.035987+00	2026-09-04 16:15:10.035987+00
step-2	2	Core Intent / Problem Discovery	question	13137	11560	12.00	Closed yes/no questions cause conversational dead-ends.	Use open-ended empathy phrasing: "What has been the biggest challenge for your queue?"	2026-09-04 16:15:10.035987+00	2026-09-04 16:15:10.035987+00
step-3	3	Call Volume & Tech Stack Qualification	collect_info	11560	9479	18.00	Asking budget before value proposition spikes friction.	State starting pricing ($0.08/min) BEFORE asking for monthly minutes.	2026-09-04 16:15:10.035987+00	2026-09-04 16:15:10.035987+00
step-4	4	Knowledge Base & Security SLA Match	knowledge_lookup	9479	8341	12.00	Extended RAG latency on SOC2 compliance queries.	Pre-fetch compliance certificate highlights automatically into first response.	2026-09-04 16:15:10.035987+00	2026-09-04 16:15:10.035987+00
step-5	5	Calendar Demo Proposal & Slot Reservation	appointment	8341	7173	14.00	Rigid time proposal forces customer rescheduling.	Offer flexible morning vs afternoon options rather than a single rigid time slot.	2026-09-04 16:15:10.035987+00	2026-09-04 16:15:10.035987+00
step-6	6	SMS Confirmation & Graceful Closing	end_call	7173	6886	4.00	Premature disconnect before Twilio SMS API acknowledgment.	Dispatch SMS confirmation payload asynchronously before goodbye phrase.	2026-09-04 16:15:10.035987+00	2026-09-04 16:15:10.035987+00
\.


--
-- Data for Name: custom_forms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_forms (id, name, description, fields_count, responses_count, fields, status, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_logs (id, tenant_id, recipient, subject, body, gateway_type, status, sent_at) FROM stdin;
\.


--
-- Data for Name: flow_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flow_definitions (id, tenant_id, name, nodes, edges, assigned_phone_number, is_active, updated_at, description, agent_id, agent_name, status, notes) FROM stdin;
\.


--
-- Data for Name: gateways; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gateways (id, gateway_name, gateway_type, host, port, username, password_hash, status, provider, auth_key, from_identity, monthly_sent, delivery_rate, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: google_drive_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.google_drive_files (id, tenant_id, file_name, file_type, drive_url, linked_appointment_id, file_size_kb, created_at) FROM stdin;
\.


--
-- Data for Name: google_sheet_rows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.google_sheet_rows (id, spreadsheet_id, spreadsheet_url, sheet_tab, caller_name, phone, agent_name, outcome, score, booked_appointment, qualification_notes, raw_data, created_at, synced_at) FROM stdin;
\.


--
-- Data for Name: integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.integrations (id, tenant_id, provider, config, status, last_synced_at) FROM stdin;
\.


--
-- Data for Name: knowledge_base; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_base (id, name, type, status, chunk_count, size_kb, last_indexed, assigned_agent_ids, url, content_preview, chunks, created_at, updated_at, tenant_id) FROM stdin;
kb-enterprise-faq	Apex Enterprise Architecture & Security FAQ 2026.pdf	document	indexed	48	850	2026-09-04 16:15:10.156133+00	["agent-solar-1", "agent-sdr-2", "agent-cs-3"]	\N	SOC2 Type II compliance: Apex Voice Systems undergoes annual third-party audits. All audio frames are processed in-memory with zero persistent audio storage unless HIPAA encrypted recording is explicitly enabled.	[{"id": "chk-1", "text": "SOC2 Type II compliance: Apex Voice Systems undergoes annual third-party audits.", "tokenCount": 35, "similarityScore": 0.96}, {"id": "chk-2", "text": "Edge speech recognition + LLM streaming achieves sub-280ms round-trip latency.", "tokenCount": 42, "similarityScore": 0.92}]	2026-09-04 16:15:10.156133+00	2026-09-04 16:15:10.156133+00	1
kb-pricing-2026	Apex Pricing, Tier Matrix & Volume Discounts.xlsx	document	indexed	32	420	2026-09-04 16:15:10.156133+00	["agent-solar-1", "agent-sdr-2"]	\N	Enterprise volume discount: Accounts processing above 50,000 minutes per month qualify for Tier 3 pricing at $0.08 per minute with dedicated SIP trunking.	[{"id": "chk-3", "text": "Volume discount: Accounts processing above 50,000 minutes qualify for Tier 3.", "tokenCount": 30, "similarityScore": 0.88}]	2026-09-04 16:15:10.156133+00	2026-09-04 16:15:10.156133+00	1
kb-support-returns	Customer Support & Order Return Policies.pdf	faq	indexed	24	310	2026-09-04 16:15:10.156133+00	["agent-cs-3"]	https://apexvoice.ai/docs/returns	Return & refund window: 30 days money-back guarantee on hardware units. Software licenses refundable within 14 days of activation.	[{"id": "chk-4", "text": "30-day money back guarantee on hardware units.", "tokenCount": 25, "similarityScore": 0.94}]	2026-09-04 16:15:10.156133+00	2026-09-04 16:15:10.156133+00	1
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, campaign_id, phone, name, email, status, metadata, created_at, updated_at, tenant_id) FROM stdin;
c1111111-2222-3333-4444-555555555551	a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d	+1 (555) 234-5678	David Miller	david.miller@greentech.org	qualified	{"company": "GreenTech Solutions", "interest": "Solar Commercial Array"}	2026-09-04 17:42:55.55674+00	2026-09-04 17:42:55.55674+00	1
c1111111-2222-3333-4444-555555555552	b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e	+1 (555) 876-5432	Sarah Connor	sconnor@cyberdynesys.com	contacted	{"company": "Cyberdyne Systems", "interest": "Enterprise SDR Integration"}	2026-09-04 17:42:55.55674+00	2026-09-04 17:42:55.55674+00	1
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, email, token_hash, expires_at, is_used, created_at) FROM stdin;
\.


--
-- Data for Name: phone_numbers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phone_numbers (id, tenant_id, number, friendly_name, country, assigned_agent_id, assigned_campaign_id, status, monthly_cost, created_at, capabilities) FROM stdin;
pn-3	1	+1 (800) 555-0199	Enterprise Toll-Free Concierge	US	agent-cs-3	\N	active	4.50	2026-09-04 17:37:46.65354+00	{"mms": false, "sms": true, "voice": true}
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (id, plan_name, monthly_price, included_minutes, concurrency_limit) FROM stdin;
\.


--
-- Data for Name: platform_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_plans (id, name, slug, description, monthly_price, six_months_price, yearly_price, pay_as_you_go_rate_per_minute, credit_multiplier, included_minutes, max_concurrency, features, allowed_engines_count, is_popular, status, created_at, updated_at) FROM stdin;
plan-starter	Starter Voice	starter	Designed for single automated workflows and small volume pilot programs.	199.00	169.00	149.00	0.1200	1.00	1500	10	["10 Concurrent SIP Lines", "Deepgram Nova-3 STT", "Standard TTS Voices", "Email Support", "Community Webhooks"]	3	f	active	2026-09-04 16:15:10.065447+00	2026-09-04 16:15:10.065447+00
plan-growth	Growth Fleet	growth	Built for scaling outbound campaigns, dynamic funnels, and high-velocity qualifying.	599.00	499.00	449.00	0.1000	1.15	6000	40	["40 Concurrent SIP Lines", "Cartesia Sonic (<100ms TTS)", "Kokoro 82M TTS", "Smart AMD 2.0 Tone Drop", "A/B Testing Lab"]	6	t	active	2026-09-04 16:15:10.065447+00	2026-09-04 16:15:10.065447+00
plan-scale	Scale Operator	scale	Enterprise call centers requiring live supervisor intervention and custom CRM integrations.	1299.00	1099.00	999.00	0.0900	1.30	16000	80	["80 Concurrent SIP Lines", "Live Supervisor Whisper & Barge-in", "NVIDIA Parakeet STT (75ms)", "Custom SIP Trunk Bring-Your-Own", "Dedicated SLA Support"]	10	f	active	2026-09-04 16:15:10.065447+00	2026-09-04 16:15:10.065447+00
plan-enterprise	Enterprise Dedicated	enterprise	Unlimited scale with dedicated carrier interconnects, custom LLM fine-tuning, and multi-tenant isolation.	2999.00	2499.00	2199.00	0.0800	1.50	45000	500	["500+ Concurrent SIP Lines", "Zero-Latency Private SBC Routing", "All LLMs + Custom vLLM Endpoints", "Kokoro-82M & Parakeet TDT", "24/7 Dedicated Architect"]	20	f	active	2026-09-04 16:15:10.065447+00	2026-09-04 16:15:10.065447+00
plan-payg	Pay-As-You-Go Metered	pay_as_you_go	Pure usage-based billing with no fixed monthly commitment. 1 Credit per minute billed.	0.00	0.00	0.00	0.1200	1.00	0	20	["Pay per minute active", "Dynamic auto-recharge", "Standard Carrier Routes", "Webhooks & API Access"]	4	f	active	2026-09-04 16:15:10.065447+00	2026-09-04 16:15:10.065447+00
\.


--
-- Data for Name: server_api_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.server_api_logs (id, api_id, method, path, status_code, latency_ms, client_ip, level, message, raw_gin_line, request_body, response_body, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, tenant_id, session_token, ip_address, user_agent, is_revoked, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: sip_trunks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sip_trunks (id, carrier_name, active_channels, max_capacity, rate_per_min, status, api_key) FROM stdin;
\.


--
-- Data for Name: supervisor_interventions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supervisor_interventions (id, call_id, supervisor_id, action_type, whisper_text, created_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, tenant_name, admin_name, admin_email, status, mrr, credits_balance, created_at, admin_password, plan_id, plan_name, billing_cycle, credit_rate_per_minute, max_concurrency, active_calls_now, total_minutes_used_this_month, assigned_sip_carrier, assigned_email_gateway, assigned_sms_gateway, allowed_llms, allowed_tts, allowed_stt) FROM stdin;
1	Apex Voice Enterprise	Sarah Jenkins	admin@apexvoice.ai	active	599.00	500.00	2026-09-04 16:15:10.99536+00	Admin@123	plan-growth	Growth Tier	monthly	0.1000	40	0	0	Telnyx Elastic Tier-1	Amazon SES Primary	Twilio 10DLC Pool	["Qwen/Qwen2.5-7B-Instruct-AWQ"]	["kokoro-82m"]	["distil-large-v3"]
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, avatar, phone, company, status, reset_token, reset_token_expiry, last_login, created_at, updated_at, tenant_id) FROM stdin;
usr-admin-1	Sarah Jenkins	admin@apexvoice.ai	$2a$12$V8JjvgbLPk1IdFC7ApGGzuA3IkCysz8z0F2I.dDDIEz3y4R5Arabm	admin	/avatars/sarah.png	+1 (555) 234-5678	Apex Voice Enterprise	active	\N	\N	2026-09-04 17:50:17.665359+00	2026-09-04 16:15:10.99536+00	2026-09-04 16:15:10.99536+00	1
usr-superadmin-1	Alexander Vance	alexander@apexsuperadmin.io	$2a$12$9s0pIyP9HxrLIAk/PVhcGeuoxCa6C78PsImqL.TiDfWij2QYIMzyK	super_admin	/avatars/alexander.png	+1 (555) 019-9900	Apex Global Master Console	active	\N	\N	2026-09-04 18:31:28.35152+00	2026-09-04 16:15:10.99536+00	2026-09-04 16:15:10.99536+00	0
\.


--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_logs (id, webhook_id, event_type, direction, payload, headers, response_status, response_body, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhooks (id, tenant_id, name, url, events, secret, status, created_at) FROM stdin;
\.


--
-- Data for Name: website_widgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.website_widgets (id, tenant_id, name, agent_id, agent_name, allowed_domains, business_hours_enabled, primary_color, button_label, "position", avatar_label, greeting_text, status, created_at) FROM stdin;
\.


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: call_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.call_records_id_seq', 2, true);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 1, false);


--
-- Name: gateways_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gateways_id_seq', 1, false);


--
-- Name: google_drive_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.google_drive_files_id_seq', 1, false);


--
-- Name: google_sheet_rows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.google_sheet_rows_id_seq', 1, false);


--
-- Name: integrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.integrations_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plans_id_seq', 1, false);


--
-- Name: sip_trunks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sip_trunks_id_seq', 1, false);


--
-- Name: supervisor_interventions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supervisor_interventions_id_seq', 1, false);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenants_id_seq', 1, true);


--
-- Name: webhook_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhook_logs_id_seq', 1, false);


--
-- Name: webhooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhooks_id_seq', 1, false);


--
-- Name: ab_experiments ab_experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ab_experiments
    ADD CONSTRAINT ab_experiments_pkey PRIMARY KEY (id);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: ai_engines ai_engines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_engines
    ADD CONSTRAINT ai_engines_pkey PRIMARY KEY (id);


--
-- Name: analytics_overview analytics_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics_overview
    ADD CONSTRAINT analytics_overview_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_appointment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_id_key UNIQUE (appointment_id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_invoices billing_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_pkey PRIMARY KEY (id);


--
-- Name: call_records call_records_call_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_records
    ADD CONSTRAINT call_records_call_id_key UNIQUE (call_id);


--
-- Name: call_records call_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_records
    ADD CONSTRAINT call_records_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: conversation_funnel_steps conversation_funnel_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_funnel_steps
    ADD CONSTRAINT conversation_funnel_steps_pkey PRIMARY KEY (id);


--
-- Name: custom_forms custom_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_forms
    ADD CONSTRAINT custom_forms_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: flow_definitions flow_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_definitions
    ADD CONSTRAINT flow_definitions_pkey PRIMARY KEY (id);


--
-- Name: gateways gateways_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gateways
    ADD CONSTRAINT gateways_pkey PRIMARY KEY (id);


--
-- Name: google_drive_files google_drive_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_drive_files
    ADD CONSTRAINT google_drive_files_pkey PRIMARY KEY (id);


--
-- Name: google_sheet_rows google_sheet_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_sheet_rows
    ADD CONSTRAINT google_sheet_rows_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_provider_key UNIQUE (provider);


--
-- Name: knowledge_base knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_base
    ADD CONSTRAINT knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: phone_numbers phone_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_numbers
    ADD CONSTRAINT phone_numbers_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: platform_plans platform_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_plans
    ADD CONSTRAINT platform_plans_pkey PRIMARY KEY (id);


--
-- Name: server_api_logs server_api_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.server_api_logs
    ADD CONSTRAINT server_api_logs_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sip_trunks sip_trunks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sip_trunks
    ADD CONSTRAINT sip_trunks_pkey PRIMARY KEY (id);


--
-- Name: supervisor_interventions supervisor_interventions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supervisor_interventions
    ADD CONSTRAINT supervisor_interventions_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: website_widgets website_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.website_widgets
    ADD CONSTRAINT website_widgets_pkey PRIMARY KEY (id);


--
-- Name: idx_ab_experiments_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ab_experiments_tenant_id ON public.ab_experiments USING btree (tenant_id);


--
-- Name: idx_agents_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_tenant_id ON public.agents USING btree (tenant_id);


--
-- Name: idx_appointments_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_tenant_id ON public.appointments USING btree (tenant_id);


--
-- Name: idx_call_records_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_call_records_tenant_id ON public.call_records USING btree (tenant_id);


--
-- Name: idx_campaigns_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaigns_tenant_id ON public.campaigns USING btree (tenant_id);


--
-- Name: idx_contacts_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_tenant_id ON public.contacts USING btree (tenant_id);


--
-- Name: idx_custom_forms_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_forms_tenant_id ON public.custom_forms USING btree (tenant_id);


--
-- Name: idx_flow_definitions_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_flow_definitions_tenant_id ON public.flow_definitions USING btree (tenant_id);


--
-- Name: idx_knowledge_base_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_knowledge_base_tenant_id ON public.knowledge_base USING btree (tenant_id);


--
-- Name: idx_leads_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leads_tenant_id ON public.leads USING btree (tenant_id);


--
-- Name: idx_webhooks_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_webhooks_tenant_id ON public.webhooks USING btree (tenant_id);


--
-- Name: idx_website_widgets_tenant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_website_widgets_tenant_id ON public.website_widgets USING btree (tenant_id);


--
-- Name: appointments appointments_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: call_records call_records_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.call_records
    ADD CONSTRAINT call_records_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: campaigns campaigns_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: contacts contacts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_logs email_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: flow_definitions flow_definitions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flow_definitions
    ADD CONSTRAINT flow_definitions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: google_drive_files google_drive_files_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.google_drive_files
    ADD CONSTRAINT google_drive_files_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: integrations integrations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: phone_numbers phone_numbers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_numbers
    ADD CONSTRAINT phone_numbers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: webhooks webhooks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: website_widgets website_widgets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.website_widgets
    ADD CONSTRAINT website_widgets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wISDAGsDNvAdA49hzd773bZDbvxrKdatDpK98O7DB0V81cBXdQ2yuVvOJlWnb7U

