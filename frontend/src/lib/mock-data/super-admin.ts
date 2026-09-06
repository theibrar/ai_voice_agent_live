export interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  role: "Master Super Admin" | "Billing Admin" | "Infrastructure Lead" | "Support Engineer";
  permissions: string[];
  twoFactorEnabled: boolean;
  lastActive: string;
  avatar: string;
  status: "active" | "suspended";
}

export interface TenantAdminOrg {
  id: string;
  orgName: string;
  primaryAdminName: string;
  primaryAdminEmail: string;
  password?: string;
  planId: string;
  planName: string;
  billingCycle: "monthly" | "6_months" | "yearly" | "pay_as_you_go";
  creditsBalance: number;
  creditRatePerMinute: number;
  maxConcurrency: number;
  activeCallsNow: number;
  totalMinutesUsedThisMonth: number;
  assignedSipCarrier: string;
  assignedEmailGateway: string;
  assignedSmsGateway: string;
  allowedLLMs: string[];
  allowedTTS: string[];
  allowedSTT: string[];
  status: "active" | "trial" | "suspended";
  joinedDate: string;
  monthlySpend: number;
}

export interface PlatformPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  sixMonthsPrice: number;
  yearlyPrice: number;
  payAsYouGoRatePerMinute: number;
  creditMultiplier: number;
  includedMinutes: number;
  maxConcurrency: number;
  features: string[];
  allowedEnginesCount: number;
  isPopular?: boolean;
  status: "active" | "archived";
}

export interface GatewayConfig {
  id: string;
  name: string;
  type: "email" | "sms";
  provider: "amazon_ses" | "sendgrid" | "postmark" | "smtp_custom" | "twilio" | "telnyx" | "sinch" | "plivo";
  status: "active" | "standby" | "disabled";
  isDefault: boolean;
  endpointOrHost: string;
  port?: number;
  authIdOrApiKey: string;
  fromEmailOrPhone: string;
  monthlySentCount: number;
  deliverySuccessRate: number;
  latencyMs: number;
}

export interface SipCarrierNetwork {
  id: string;
  name: string;
  carrier: "telnyx" | "twilio" | "bandwidth" | "thinq" | "custom_sbc" | string;
  status: "online" | "degraded" | "offline";
  sipServer: string;
  port: number;
  transport: "UDP" | "TCP" | "TLS" | string;
  codecPriority: string[];
  maxChannels: number;
  allocatedChannels: number;
  ratePerMinuteWholesale: number;
  popRegions: string[];
  isDefaultCarrier: boolean;
  apiKey?: string;
  fqdnOrIp?: string;
  sipPort?: number;
  isDefault?: boolean;
  activeCallsCount?: number;
  authUsername?: string;
  authPassword?: string;
  region?: string;
  connectionId?: string;
  latencyMs?: number;
  costPerMinute?: number;
}

export interface VoiceAiEngine {
  id: string;
  name: string;
  provider: string;
  category: "llm" | "tts" | "stt";
  modelIdentifier: string;
  latencyAvgMs: number;
  costPerUnit: string;
  status: "active" | "beta" | "deprecated";
  isGlobalDefault: boolean;
  tierRequirement: "all" | "growth_plus" | "enterprise_only";
  supportedLanguagesCount: number;
  description: string;
  isCustom?: boolean;
  baseUrl?: string;
  apiKey?: string;
}

export interface GlobalCallSession {
  id: string;
  tenantId: string;
  tenantName: string;
  callerName: string;
  callerNumber: string;
  agentName: string;
  carrier: string;
  llmModel: string;
  ttsVoice: string;
  sttEngine: string;
  startedAt: string;
  durationSeconds: number;
  status: "in_progress" | "completed" | "failed" | "terminated";
  jitterMs: number;
  packetLossPercent: number;
  costEstimate: number;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical" | "success";
  targetTenants: string; // "all", "enterprise", "growth", "starter", or "tenant-{id}"
  targetTenantName?: string;
  publishedAt: string;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  ipAddress: string;
  severity: "info" | "warning" | "critical";
}

// -------------------------------------------------------------
// Mock Data Initial Seeds
// -------------------------------------------------------------

export const initialSuperAdmins: SuperAdminUser[] = [
  {
    id: "usr-superadmin-1",
    name: "Alexander Vance",
    email: "alexander@apexsuperadmin.io",
    role: "Master Super Admin",
    permissions: ["all_access", "billing_override", "infrastructure_control", "tenant_impersonation"],
    twoFactorEnabled: true,
    lastActive: "Just now",
    avatar: "AV",
    status: "active",
  },
];

export const initialTenantOrgs: TenantAdminOrg[] = [
  {
    id: "tenant-5",
    orgName: "Apex Voice Enterprise",
    primaryAdminName: "Sarah Jenkins",
    primaryAdminEmail: "admin@apexvoice.ai",
    planId: "plan-growth",
    planName: "Growth Tier",
    billingCycle: "monthly",
    creditsBalance: 500.0,
    creditRatePerMinute: 0.08,
    maxConcurrency: 100,
    activeCallsNow: 0,
    totalMinutesUsedThisMonth: 0,
    assignedSipCarrier: "Telnyx Elastic SIP Trunk (GPU Worker)",
    assignedEmailGateway: "Amazon SES Primary",
    assignedSmsGateway: "Twilio 10DLC Pool",
    allowedLLMs: ["Qwen/Qwen2.5-7B-Instruct-AWQ"],
    allowedTTS: ["kokoro-82m"],
    allowedSTT: ["distil-large-v3"],
    status: "active",
    joinedDate: "Aug 27, 2026",
    monthlySpend: 599.0,
  },
  {
    id: "tenant-7",
    orgName: "Ibrar",
    primaryAdminName: "ibrar",
    primaryAdminEmail: "ibrar@gmail.com",
    planId: "plan-growth",
    planName: "Growth Fleet",
    billingCycle: "monthly",
    creditsBalance: 250.0,
    creditRatePerMinute: 0.08,
    maxConcurrency: 40,
    activeCallsNow: 0,
    totalMinutesUsedThisMonth: 0,
    assignedSipCarrier: "Telnyx Elastic SIP Trunk (GPU Worker)",
    assignedEmailGateway: "Amazon SES Primary",
    assignedSmsGateway: "Twilio 10DLC Pool",
    allowedLLMs: ["Qwen/Qwen2.5-7B-Instruct-AWQ"],
    allowedTTS: ["kokoro-82m"],
    allowedSTT: ["distil-large-v3"],
    status: "active",
    joinedDate: "Aug 28, 2026",
    monthlySpend: 599.0,
  },
  {
    id: "tenant-8",
    orgName: "waseem",
    primaryAdminName: "waseem",
    primaryAdminEmail: "waseem@gmail.com",
    password: "Admin@123",
    planId: "plan-growth",
    planName: "Growth Fleet",
    billingCycle: "monthly",
    creditsBalance: 250.0,
    creditRatePerMinute: 0.08,
    maxConcurrency: 40,
    activeCallsNow: 0,
    totalMinutesUsedThisMonth: 0,
    assignedSipCarrier: "Telnyx Elastic SIP Trunk (GPU Worker)",
    assignedEmailGateway: "Amazon SES Primary",
    assignedSmsGateway: "Twilio 10DLC Pool",
    allowedLLMs: ["Qwen/Qwen2.5-7B-Instruct-AWQ"],
    allowedTTS: ["kokoro-82m"],
    allowedSTT: ["distil-large-v3"],
    status: "active",
    joinedDate: "Aug 28, 2026",
    monthlySpend: 599.0,
  },
];

export const initialPlatformPlans: PlatformPlan[] = [
  {
    id: "plan-starter",
    name: "Starter Voice",
    slug: "starter",
    description: "Designed for single automated workflows and small volume pilot programs.",
    monthlyPrice: 199,
    sixMonthsPrice: 169,
    yearlyPrice: 149,
    payAsYouGoRatePerMinute: 0.12,
    creditMultiplier: 1.0,
    includedMinutes: 1500,
    maxConcurrency: 10,
    features: ["10 Concurrent SIP Lines", "Deepgram Nova-3 STT", "Standard TTS Voices", "Email Support", "Community Webhooks"],
    allowedEnginesCount: 3,
    status: "active",
  },
  {
    id: "plan-growth",
    name: "Growth Fleet",
    slug: "growth",
    description: "Built for scaling outbound campaigns, dynamic funnels, and high-velocity qualifying.",
    monthlyPrice: 599,
    sixMonthsPrice: 499,
    yearlyPrice: 449,
    payAsYouGoRatePerMinute: 0.1,
    creditMultiplier: 1.15,
    includedMinutes: 6000,
    maxConcurrency: 40,
    features: ["40 Concurrent SIP Lines", "Cartesia Sonic (<100ms TTS)", "Kokoro 82M TTS", "Smart AMD 2.0 Tone Drop", "A/B Testing Lab"],
    allowedEnginesCount: 6,
    isPopular: true,
    status: "active",
  },
  {
    id: "plan-scale",
    name: "Scale Operator",
    slug: "scale",
    description: "Enterprise call centers requiring live supervisor intervention and custom CRM integrations.",
    monthlyPrice: 1299,
    sixMonthsPrice: 1099,
    yearlyPrice: 999,
    payAsYouGoRatePerMinute: 0.09,
    creditMultiplier: 1.3,
    includedMinutes: 16000,
    maxConcurrency: 80,
    features: ["80 Concurrent SIP Lines", "Live Supervisor Whisper & Barge-in", "NVIDIA Parakeet STT (75ms)", "Custom SIP Trunk Bring-Your-Own", "Dedicated SLA Support"],
    allowedEnginesCount: 10,
    status: "active",
  },
  {
    id: "plan-enterprise",
    name: "Enterprise Dedicated",
    slug: "enterprise",
    description: "Unlimited scale with dedicated carrier interconnects, custom LLM fine-tuning, and multi-tenant isolation.",
    monthlyPrice: 2999,
    sixMonthsPrice: 2499,
    yearlyPrice: 2199,
    payAsYouGoRatePerMinute: 0.08,
    creditMultiplier: 1.5,
    includedMinutes: 45000,
    maxConcurrency: 500,
    features: ["500+ Concurrent SIP Lines", "Zero-Latency Private SBC Routing", "All LLMs + Custom vLLM Endpoints", "Kokoro-82M & Parakeet TDT", "24/7 Phone Support & Dedicated Architect"],
    allowedEnginesCount: 20,
    status: "active",
  },
  {
    id: "plan-paygo",
    name: "Pay-As-You-Go Metered",
    slug: "pay_as_you_go",
    description: "Pure usage-based billing with no fixed monthly commitment. 1 Credit per minute billed.",
    monthlyPrice: 0,
    sixMonthsPrice: 0,
    yearlyPrice: 0,
    payAsYouGoRatePerMinute: 0.12,
    creditMultiplier: 1.0,
    includedMinutes: 0,
    maxConcurrency: 20,
    features: ["Pay per minute active", "Dynamic auto-recharge", "Standard Carrier Routes", "Webhooks & API Access"],
    allowedEnginesCount: 4,
    status: "active",
  },
];

export const initialGateways: GatewayConfig[] = [
  {
    id: "gw-1",
    name: "Amazon SES Primary",
    type: "email",
    provider: "amazon_ses",
    status: "active",
    isDefault: true,
    endpointOrHost: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    authIdOrApiKey: "AKIA*************SES",
    fromEmailOrPhone: "notifications@apexvoice.ai",
    monthlySentCount: 384200,
    deliverySuccessRate: 99.8,
    latencyMs: 142,
  },
  {
    id: "gw-2",
    name: "SendGrid Dedicated Relay",
    type: "email",
    provider: "sendgrid",
    status: "active",
    isDefault: false,
    endpointOrHost: "smtp.sendgrid.net",
    port: 587,
    authIdOrApiKey: "SG.********************",
    fromEmailOrPhone: "alerts@apexvoice.ai",
    monthlySentCount: 142000,
    deliverySuccessRate: 99.4,
    latencyMs: 165,
  },
  {
    id: "gw-3",
    name: "Postmark Transactional",
    type: "email",
    provider: "postmark",
    status: "standby",
    isDefault: false,
    endpointOrHost: "smtp.postmarkapp.com",
    port: 587,
    authIdOrApiKey: "pm-sec-****************",
    fromEmailOrPhone: "security@apexvoice.ai",
    monthlySentCount: 28400,
    deliverySuccessRate: 99.9,
    latencyMs: 110,
  },
  {
    id: "gw-4",
    name: "Twilio 10DLC Primary Pool",
    type: "sms",
    provider: "twilio",
    status: "active",
    isDefault: true,
    endpointOrHost: "https://api.twilio.com/2010-04-01",
    authIdOrApiKey: "AC****************************",
    fromEmailOrPhone: "+1 (800) 555-0199",
    monthlySentCount: 94200,
    deliverySuccessRate: 98.9,
    latencyMs: 85,
  },
  {
    id: "gw-5",
    name: "Telnyx SMS Low-Cost Route",
    type: "sms",
    provider: "telnyx",
    status: "active",
    isDefault: false,
    endpointOrHost: "https://api.telnyx.com/v2/messages",
    authIdOrApiKey: "KEY**************************",
    fromEmailOrPhone: "+1 (888) 440-2026",
    monthlySentCount: 65100,
    deliverySuccessRate: 99.2,
    latencyMs: 72,
  },
];

export const initialSipCarriers: SipCarrierNetwork[] = [
  {
    id: "sip-telnyx-gpu-1",
    name: "Telnyx Elastic SIP Trunk (GPU Worker)",
    carrier: "Telnyx Primary",
    status: "online",
    isDefault: true,
    isDefaultCarrier: true,
    sipServer: "77.54.200.11",
    port: 5060,
    transport: "UDP",
    codecPriority: ["OPUS", "G.711u", "G.711a"],
    maxChannels: 100,
    allocatedChannels: 100,
    ratePerMinuteWholesale: 0.007,
    popRegions: ["us-central-1", "global"],
    fqdnOrIp: "77.54.200.11:5060",
    sipPort: 5060,
    activeCallsCount: 0,
    authUsername: "aivoiceebott",
    authPassword: "ai_voicee_bott@78692",
    region: "Global / US Central (GPU 77.54.200.11)",
    connectionId: "3014058183544014724",
    latencyMs: 14,
    costPerMinute: 0.007,
  },
  {
    id: "sip-livekit-gpu-2",
    name: "LiveKit WebRTC Media Server (GPU RTX 4060 Ti)",
    carrier: "LiveKit GPU Cluster",
    status: "online",
    isDefault: false,
    isDefaultCarrier: false,
    sipServer: "77.54.200.11",
    port: 7880,
    transport: "WSS/TCP",
    codecPriority: ["OPUS", "PCM"],
    maxChannels: 500,
    allocatedChannels: 500,
    ratePerMinuteWholesale: 0.0,
    popRegions: ["gpu-worker-1"],
    fqdnOrIp: "77.54.200.11:15044",
    sipPort: 7880,
    activeCallsCount: 0,
    authUsername: "devkey",
    authPassword: "secret",
    region: "77.54.200.11 (RTX 4060 Ti)",
    latencyMs: 8,
    costPerMinute: 0.0,
  },
];

export const initialVoiceEngines: VoiceAiEngine[] = [];

export const initialGlobalCalls: GlobalCallSession[] = [
  {
    id: "call-glob-101",
    tenantId: "tenant-1",
    tenantName: "Apex Financial AI",
    callerName: "Jonathan Vance",
    callerNumber: "+1 (415) 890-2341",
    agentName: "Marcus (Solar Advisor)",
    carrier: "Telnyx Elastic Tier-1",
    llmModel: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    ttsVoice: "Kokoro-82M (am_adam)",
    sttEngine: "Faster-Whisper distil-large-v3",
    startedAt: "14:22:10",
    durationSeconds: 142,
    status: "in_progress",
    jitterMs: 4,
    packetLossPercent: 0.01,
    costEstimate: 0.0,
  },
  {
    id: "call-glob-102",
    tenantId: "tenant-2",
    tenantName: "MedCare Health Network",
    callerName: "Sarah Jenkins",
    callerNumber: "+1 (512) 349-8821",
    agentName: "Rachel (Enterprise SDR)",
    carrier: "Telnyx Elastic SIP Trunk (GPU Worker)",
    llmModel: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    ttsVoice: "Kokoro-82M (af_bella)",
    sttEngine: "Faster-Whisper distil-large-v3",
    startedAt: "14:20:05",
    durationSeconds: 265,
    status: "in_progress",
    jitterMs: 6,
    packetLossPercent: 0.02,
    costEstimate: 0.0,
  },
  {
    id: "call-glob-103",
    tenantId: "tenant-3",
    tenantName: "SunPeak Growth Outbound",
    callerName: "David Miller",
    callerNumber: "+1 (305) 772-9104",
    agentName: "Marcus (Solar Advisor)",
    carrier: "Telnyx Elastic SIP Trunk (GPU Worker)",
    llmModel: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    ttsVoice: "Kokoro-82M (am_adam)",
    sttEngine: "Faster-Whisper distil-large-v3",
    startedAt: "14:18:40",
    durationSeconds: 340,
    status: "completed",
    jitterMs: 8,
    packetLossPercent: 0.04,
    costEstimate: 0.0,
  },
  {
    id: "call-glob-104",
    tenantId: "tenant-1",
    tenantName: "Apex Financial AI",
    callerName: "Elena Rostova",
    callerNumber: "+1 (206) 554-1980",
    agentName: "Elena (Customer Care)",
    carrier: "Telnyx Elastic SIP Trunk (GPU Worker)",
    llmModel: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    ttsVoice: "Kokoro-82M (bf_emma)",
    sttEngine: "Faster-Whisper distil-large-v3",
    startedAt: "14:15:12",
    durationSeconds: 520,
    status: "completed",
    jitterMs: 3,
    packetLossPercent: 0.0,
    costEstimate: 0.0,
  },
];

export const initialAnnouncements: SystemAnnouncement[] = [];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "aud-1",
    timestamp: "2026-06-17 15:12:04",
    actorName: "Alexander Mercer",
    actorRole: "Master Super Admin",
    action: "Assigned Plan 'Enterprise Dedicated' to tenant 'Apex Financial AI'",
    target: "Apex Financial AI (tenant-1)",
    ipAddress: "192.88.99.12",
    severity: "info",
  },
  {
    id: "aud-2",
    timestamp: "2026-06-17 14:40:19",
    actorName: "Dr. Evelyn Zhao",
    actorRole: "Infrastructure Lead",
    action: "Configured Primary SIP Trunk 'Telnyx Elastic Tier-1' to TLS 5060",
    target: "SipCarrier (sip-1)",
    ipAddress: "192.88.99.45",
    severity: "warning",
  },
  {
    id: "aud-3",
    timestamp: "2026-06-17 13:05:52",
    actorName: "Marcus Sterling",
    actorRole: "Billing Admin",
    action: "Allocated 5,000 Promotional Credits ($400 value) to MedCare Health",
    target: "MedCare Health Network (tenant-2)",
    ipAddress: "192.88.99.88",
    severity: "info",
  },
  {
    id: "aud-4",
    timestamp: "2026-06-17 11:22:15",
    actorName: "Alexander Mercer",
    actorRole: "Master Super Admin",
    action: "Created New Super Admin User 'Sarah Lin' with role Support Engineer",
    target: "SuperAdminUser (sa-4)",
    ipAddress: "192.88.99.12",
    severity: "info",
  },
  {
    id: "aud-5",
    timestamp: "2026-06-17 09:14:30",
    actorName: "Dr. Evelyn Zhao",
    actorRole: "Infrastructure Lead",
    action: "Enabled Models 'Kokoro 82M' and 'NVIDIA Parakeet TDT' for Global Fleet",
    target: "VoiceAiEngine",
    ipAddress: "192.88.99.45",
    severity: "info",
  },
];
