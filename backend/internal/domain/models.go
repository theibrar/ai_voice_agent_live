package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	Status         string    `json:"status"`
	MRR            float64   `json:"mrr"`
	CreditsBalance float64   `json:"credits_balance"`
	CreatedAt      time.Time `json:"created_at"`
}

type User struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID int       `json:"organization_id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	PasswordHash   string    `json:"-"`
	Role           string    `json:"role"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type SIPTrunk struct {
	ID             int     `json:"id"`
	CarrierName    string  `json:"carrier_name"`
	ActiveChannels int     `json:"active_channels"`
	MaxCapacity    int     `json:"max_capacity"`
	RatePerMin     float64 `json:"rate_per_min"`
	Status         string  `json:"status"`
}

type Gateway struct {
	ID          int    `json:"id"`
	GatewayName string `json:"gateway_name"`
	GatewayType string `json:"gateway_type"`
	Host        string `json:"host"`
	Port        int    `json:"port"`
	Username    string `json:"username"`
	Status      string `json:"status"`
}

type AIEngine struct {
	ID                 int     `json:"id"`
	EngineName         string  `json:"engine_name"`
	EngineType         string  `json:"engine_type"`
	EndpointURL        string  `json:"endpoint_url"`
	TotalCallsExecuted int     `json:"total_calls_executed"`
	TokensProcessed    int64   `json:"tokens_processed"`
	AvgLatencyMS       int     `json:"avg_latency_ms"`
	MonthlyCost        float64 `json:"monthly_cost"`
	Status             string  `json:"status"`
}

type Plan struct {
	ID               int     `json:"id"`
	PlanName         string  `json:"plan_name"`
	MonthlyPrice     float64 `json:"monthly_price"`
	IncludedMinutes  int     `json:"included_minutes"`
	ConcurrencyLimit int     `json:"concurrency_limit"`
}

type AuditLog struct {
	ID          int       `json:"id"`
	EventType   string    `json:"event_type"`
	Description string    `json:"description"`
	IPAddress   string    `json:"ip_address"`
	CreatedAt   time.Time `json:"created_at"`
}

type KnowledgeBaseItem struct {
	ID             int       `json:"id"`
	SourceID       string    `json:"source_id"`
	Name           string    `json:"name"`
	SourceType     string    `json:"source_type"`
	Status         string    `json:"status"`
	ChunkCount     int       `json:"chunk_count"`
	SizeKB         int       `json:"size_kb"`
	ContentPreview string    `json:"content_preview"`
	CreatedAt      time.Time `json:"created_at"`
}

type Lead struct {
	ID         interface{}     `json:"id"`
	LeadID     string          `json:"lead_id"`
	CampaignID interface{}     `json:"campaign_id"`
	Name       string          `json:"name"`
	Phone      string          `json:"phone"`
	Email      string          `json:"email"`
	Status     string          `json:"status"`
	Metadata   json.RawMessage `json:"metadata"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type CallRecord struct {
	ID          int       `json:"id"`
	CallID      string    `json:"call_id"`
	LeadID      int       `json:"lead_id"`
	Status      string    `json:"status"`
	Duration    int       `json:"duration"`
	JitterMS    float64   `json:"jitter_ms"`
	PacketLoss  float64   `json:"packet_loss"`
	CostPerHour float64   `json:"cost_per_hour"`
	Transcript  string    `json:"transcript"`
	CreatedAt   time.Time `json:"created_at"`
}

type Appointment struct {
	ID              int       `json:"id"`
	AppointmentID   string    `json:"appointment_id"`
	LeadID          int       `json:"lead_id"`
	AgentID         string    `json:"agent_id"`
	CallerName      string    `json:"caller_name"`
	Phone           string    `json:"phone"`
	Email           string    `json:"email"`
	ScheduledAt     time.Time `json:"scheduled_at"`
	DurationMinutes int       `json:"duration_minutes"`
	Status          string    `json:"status"`
	CalendarType    string    `json:"calendar_type"`
	MeetingLink     string    `json:"meeting_link"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
}

type Campaign struct {
	ID               interface{} `json:"id"`
	CampaignID       string      `json:"campaign_id"`
	OrganizationID   interface{} `json:"organization_id"`
	Name             string      `json:"name"`
	Type             string      `json:"type"`
	AgentID          string      `json:"agent_id"`
	PhoneNumberID    string      `json:"phone_number_id"`
	Status           string      `json:"status"`
	ScriptTemplate   string      `json:"script_template"`
	VoicePrompt      string      `json:"voice_prompt"`
	TotalLeads       int         `json:"total_leads"`
	AttemptedLeads   int         `json:"attempted_leads"`
	SuccessfulLeads int         `json:"successful_leads"`
	ConcurrencyLimit int         `json:"concurrency_limit"`
	Schedule         string      `json:"schedule"`
	CreatedAt        time.Time   `json:"created_at"`
	UpdatedAt        time.Time   `json:"updated_at"`
}

type SupervisorIntervention struct {
	ID           int       `json:"id"`
	CallID       string    `json:"call_id"`
	SupervisorID string    `json:"supervisor_id"`
	ActionType   string    `json:"action_type"`
	WhisperText  string    `json:"whisper_text"`
	CreatedAt    time.Time `json:"created_at"`
}

type Webhook struct {
	ID        int       `json:"id"`
	TenantID  int       `json:"tenant_id"`
	Name      string    `json:"name"`
	URL       string    `json:"url"`
	Events    []string  `json:"events"`
	Secret    string    `json:"secret"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Contact struct {
	ID              string    `json:"id"`
	TenantID        int       `json:"tenant_id"`
	Name            string    `json:"name"`
	Phone           string    `json:"phone"`
	Email           string    `json:"email"`
	Company         string    `json:"company"`
	LeadScore       int       `json:"lead_score"`
	Status          string    `json:"status"`
	CampaignName    string    `json:"campaign_name"`
	LastCallOutcome string    `json:"last_call_outcome"`
	Notes           string    `json:"notes"`
	Tags            []string  `json:"tags"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type Integration struct {
	ID           int             `json:"id"`
	TenantID     int             `json:"tenant_id"`
	Provider     string          `json:"provider"`
	Config       json.RawMessage `json:"config"`
	Status       string          `json:"status"`
	LastSyncedAt time.Time       `json:"last_synced_at"`
}

type GoogleDriveFile struct {
	ID                  int       `json:"id"`
	TenantID            int       `json:"tenant_id"`
	FileName            string    `json:"file_name"`
	FileType            string    `json:"file_type"`
	DriveURL            string    `json:"drive_url"`
	LinkedAppointmentID string    `json:"linked_appointment_id"`
	FileSizeKB          int       `json:"file_size_kb"`
	CreatedAt           time.Time `json:"created_at"`
}

type EmailLog struct {
	ID          int       `json:"id"`
	TenantID    int       `json:"tenant_id"`
	Recipient   string    `json:"recipient"`
	Subject     string    `json:"subject"`
	Body        string    `json:"body"`
	GatewayType string    `json:"gateway_type"`
	Status      string    `json:"status"`
	SentAt      time.Time `json:"sent_at"`
}

type FlowDefinition struct {
	ID                  string          `json:"id"`
	TenantID            int             `json:"tenant_id"`
	Name                string          `json:"name"`
	Nodes               json.RawMessage `json:"nodes"`
	Edges               json.RawMessage `json:"edges"`
	AssignedPhoneNumber string          `json:"assigned_phone_number"`
	IsActive            bool            `json:"is_active"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

type PhoneNumberItem struct {
	ID                 string    `json:"id"`
	TenantID           int       `json:"tenant_id"`
	Number             string    `json:"number"`
	FriendlyName       string    `json:"friendly_name"`
	Country            string    `json:"country"`
	AssignedAgentID    string    `json:"assigned_agent_id"`
	AssignedCampaignID string    `json:"assigned_campaign_id"`
	Status             string    `json:"status"`
	MonthlyCost        float64   `json:"monthly_cost"`
	CreatedAt          time.Time `json:"created_at"`
}

type InboundWebhookPayload struct {
	Name        string                 `json:"name"`
	FullName    string                 `json:"full_name"`
	Phone       string                 `json:"phone"`
	PhoneNumber string                 `json:"phone_number"`
	Email       string                 `json:"email"`
	Company     string                 `json:"company"`
	Notes       string                 `json:"notes"`
	Message     string                 `json:"message"`
	Source      string                 `json:"source"`
	Campaign    string                 `json:"campaign"`
	Metadata    map[string]interface{} `json:"metadata"`
}

