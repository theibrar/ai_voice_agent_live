export type AgentStatus = "active" | "paused" | "draft";

export interface VoiceConfig {
  provider: "ElevenLabs" | "Cartesia" | "Deepgram" | "PlayHT" | "OpenAI" | "Kokoro Neural" | "Parakeet";
  voiceId: string;
  voiceName: string;
  gender: "female" | "male" | "neutral";
  accent: string;
  speed: number;
  pitch: number;
  stability: number;
  similarity: number;
  sampleAudioUrl?: string;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: "function" | "webhook" | "calendar" | "crm" | "sms";
  parameters?: Record<string, any>;
}

export interface HumanRealismConfig {
  enableMicroBreaths: boolean;
  enableBackchanneling: boolean;
  enableAdaptiveEmotion: boolean;
  maxWordsPerTurn: number; // e.g. 20-30 words
  fillerFrequency: "low" | "medium" | "high";
  voiceBlend?: {
    enabled: boolean;
    secondaryVoiceId: string;
    blendRatio: number; // 0.0 to 1.0 (e.g. 0.3 for 30% secondary)
  };
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
  description: string;
  avatar: string;
  color: string;
  status: AgentStatus;
  voice: VoiceConfig;
  llmModel?: string;
  language: string;
  greeting: string;
  systemPrompt: string;
  responseStyle: "concise" | "conversational" | "empathetic" | "professional";
  interruptionSensitivity: number; // 0 to 1
  silenceTimeoutSeconds: number;
  maxCallDurationMinutes: number;
  knowledgeBaseIds: string[];
  tools: AgentTool[];
  humanRealism?: HumanRealismConfig;
  assignedPhoneNumber?: string;
  assignedPhoneNumberId?: string;
  transferRules: {
    enabled: boolean;
    destinationNumber?: string;
    triggerPhrase?: string;
    department?: string;
  };
  callEndingRules: {
    goodbyePhrase: string;
    hangupOnSilence: boolean;
    afterHoursBehavior: "voicemail" | "transfer" | "hangup";
  };
  metrics: {
    totalCalls: number;
    avgDurationSeconds: number;
    successRate: number; // 0 - 100
    sentimentScore: number; // 0 - 100
    connectedCalls: number;
  };
  lastUpdated: string;
}

export type CallDirection = "inbound" | "outbound";
export type CallStatus = "live" | "ringing" | "on_hold" | "transferred" | "completed";
export type CallSentiment = "positive" | "neutral" | "negative";
export type QualificationStatus = "qualified" | "unqualified" | "follow_up" | "pending";

export interface TranscriptMessage {
  id: string;
  speaker: "agent" | "user" | "system" | "supervisor";
  text: string;
  timestamp: string;
  isPartial?: boolean;
  latencyMs?: number;
  toolCall?: {
    name: string;
    status: "executing" | "completed" | "failed";
    resultSummary?: string;
  };
  supervisorWhisper?: boolean;
}

export interface CallEvent {
  id: string;
  timestamp: string;
  type: "call_started" | "speech_detected" | "tool_invoked" | "kb_queried" | "sentiment_shift" | "transferred" | "call_ended" | "supervisor_whisper" | "supervisor_takeover" | string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  data?: Record<string, any>;
}

export interface Call {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  callerName: string;
  callerNumber: string;
  contactName?: string;
  contactPhone?: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  campaignId?: string;
  campaignName?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  duration?: number;
  sentiment: CallSentiment;
  sentimentScore: number; // 0-100
  qualificationScore: number; // 0-100
  qualificationStatus: QualificationStatus;
  recordingUrl?: string;
  audioLevel?: number; // 0-100 for live animation
  transcript: TranscriptMessage[];
  events: CallEvent[];
  toolsUsed: string[];
  knowledgeContexts: {
    sourceId: string;
    sourceName: string;
    query: string;
    matchScore: number;
  }[];
  tags: string[];
  summary?: string;
  cost?: number;
  supervisorIntervened?: boolean;
}

export type CampaignStatus = "active" | "paused" | "draft" | "completed";
export type CampaignType = "outbound_sales" | "inbound_support" | "appointment_reminder" | "lead_qualification" | "survey" | string;

export interface VoicemailDropConfig {
  enabled: boolean;
  beepDetectionHz: number;
  detectionTimeoutMs: number;
  script: string;
  audioFileUrl?: string;
  postDropAction: "hangup" | "log_crm";
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  customTypeTitle?: string;
  customTypeObjective?: string;
  campaignObjective?: string;
  status: CampaignStatus;
  agentId: string;
  agentName: string;
  phoneNumber: string;
  totalLeads: number;
  calledLeads: number;
  connectedLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  answerRate: number;
  concurrencyLimit: number;
  retryAttempts: number;
  retryIntervalMinutes: number;
  schedule: {
    timezone: string;
    days: string[];
    startTime: string;
    endTime: string;
  };
  amdConfig?: VoicemailDropConfig;
  createdAt: string;
  lastActive: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  leadScore: number; // 0-100
  status: "new" | "contacted" | "qualified" | "appointment_set" | "unqualified" | "do_not_call";
  campaignId?: string;
  campaignName?: string;
  lastCallDate?: string;
  lastCallOutcome?: string;
  tags: string[];
  notes: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  agentId: string;
  agentName: string;
  title: string;
  scheduledTime: string;
  scheduledAt?: string;
  durationMinutes: number;
  status: "confirmed" | "pending" | "rescheduled" | "cancelled" | "completed" | "scheduled";
  calendarType: "google" | "outlook" | "calendly";
  meetingLink?: string;
  notes?: string;
  createdAt: string;
}

export type KnowledgeSourceType = "document" | "url" | "text" | "faq";
export type KnowledgeSourceStatus = "indexed" | "processing" | "error";

export interface KnowledgeChunk {
  id: string;
  text: string;
  tokenCount: number;
  similarityScore?: number;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  chunkCount: number;
  lastIndexed: string;
  assignedAgentIds: string[];
  sizeKb?: number;
  url?: string;
  contentPreview: string;
  chunks?: KnowledgeChunk[];
}

export interface PhoneNumber {
  id: string;
  number: string;
  formattedNumber: string;
  country: string;
  friendlyName: string;
  status: "active" | "inactive" | "released";
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedCampaignId?: string;
  assignedCampaignName?: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
  monthlyCost: number;
  renewDate: string;
}

export interface IncomingConnection {
  id: string;
  name: string;
  provider: "Twilio BYOC" | "Telnyx SIP" | "Vonage SIP" | "WebRTC Endpoint" | "Asterisk PBX";
  sipUri: string;
  status: "connected" | "warning" | "offline";
  activeChannels: number;
  maxChannels: number;
  routedAgentId?: string;
  routedAgentName?: string;
  latencyMs: number;
  lastPing: string;
}

export interface Template {
  id: string;
  title: string;
  category: "Sales" | "Healthcare" | "Support" | "Real Estate" | "Finance" | "Hospitality";
  description: string;
  icon: string;
  color: string;
  suggestedVoice: string;
  estimatedSetupMinutes: number;
  defaultGreeting: string;
  samplePrompt: string;
  includedTools: string[];
  popularityScore: number;
}

export interface DashboardKPI {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  period: string;
  icon: string;
  sparkline: number[];
}

export interface ActivityTimelineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "call" | "campaign" | "agent" | "kb" | "appointment" | "billing";
  badgeText: string;
  badgeVariant: "success" | "warning" | "danger" | "info" | "neutral";
}

export type FlowNodeType =
  | "greeting"
  | "message"
  | "question"
  | "collect_info"
  | "form"
  | "knowledge_lookup"
  | "condition"
  | "appointment"
  | "transfer"
  | "send_sms"
  | "send_email"
  | "email"
  | "webhook"
  | "note"
  | "end_call";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  title?: string;
  label?: string;
  description?: string;
  position: { x: number; y: number };
  data?: {
    prompt?: string;
    question?: string;
    variable?: string;
    variableName?: string;
    transferTo?: string;
    webhookUrl?: string;
    branches?: { id: string; label: string; condition: string }[];
    toolName?: string;
    endpointUrl?: string;
    destination?: string;
    tags?: string[];
    emailSubject?: string;
    emailRecipient?: string;
    emailTemplate?: string;
    emailGateway?: "smtp" | "ses" | "sendgrid";
    assignedPhoneNumber?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface GoogleDriveFile {
  id: number | string;
  fileName: string;
  fileType: "transcript" | "audio" | "brief" | "spreadsheet";
  driveUrl: string;
  appointmentId?: string;
  fileSizeKb?: number;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string | number;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: "active" | "inactive" | "testing";
  createdAt?: string;
}

export interface InboundWebhookPayload {
  name?: string;
  full_name?: string;
  phone?: string;
  phone_number?: string;
  email?: string;
  company?: string;
  notes?: string;
  message?: string;
  source?: string;
  campaign?: string;
  metadata?: Record<string, any>;
}


/* Feature 4: A/B Testing Experiment Types */
export interface ABTestExperiment {
  id: string;
  name: string;
  status: "running" | "paused" | "completed";
  baseAgentId: string;
  trafficSplitPercent: number; // e.g. 50 (50/50)
  variantA: {
    name: string;
    voiceName: string;
    provider: string;
    promptPreview: string;
    greeting: string;
  };
  variantB: {
    name: string;
    voiceName: string;
    provider: string;
    promptPreview: string;
    greeting: string;
  };
  metricsA: {
    callsCount: number;
    answerRate: number;
    conversionRate: number;
    avgDurationSec: number;
    sentimentScore: number;
  };
  metricsB: {
    callsCount: number;
    answerRate: number;
    conversionRate: number;
    avgDurationSec: number;
    sentimentScore: number;
  };
  confidenceScore: number; // e.g. 98.4%
  conversionLiftPercent?: number;
  winner?: "variantA" | "variantB";
  startDate: string;
}

/* Feature 7: Conversation Funnel Drop-off Types */
export interface ConversationFunnelStep {
  id: string;
  stepNumber: number;
  stepName: string;
  nodeType: FlowNodeType;
  visitorsCount: number;
  completedCount: number;
  dropOffRatePercent: number;
  dropOffReason: string;
  aiOptimizationTip: string;
}
