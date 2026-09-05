package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AgentsHandler struct {
	db *pgxpool.Pool
}

func NewAgentsHandler(db *pgxpool.Pool) *AgentsHandler {
	h := &AgentsHandler{db: db}
	h.ensureSchemaAndSeed()
	return h
}

func (h *AgentsHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS agents (
		id VARCHAR(100) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		avatar VARCHAR(255) DEFAULT 'solar-advisor',
		color VARCHAR(50) DEFAULT '#3157D5',
		status VARCHAR(50) DEFAULT 'active',
		voice JSONB DEFAULT '{}'::jsonb,
		llm_model VARCHAR(255) DEFAULT 'Qwen/Qwen2.5-7B-Instruct-AWQ',
		language VARCHAR(100) DEFAULT 'English (US)',
		greeting TEXT,
		system_prompt TEXT,
		response_style VARCHAR(50) DEFAULT 'conversational',
		interruption_sensitivity DECIMAL(4,2) DEFAULT 0.75,
		silence_timeout_seconds INT DEFAULT 5,
		max_call_duration_minutes INT DEFAULT 15,
		knowledge_base_ids JSONB DEFAULT '[]'::jsonb,
		tools JSONB DEFAULT '[]'::jsonb,
		assigned_phone_number VARCHAR(100),
		assigned_phone_number_id VARCHAR(100),
		transfer_rules JSONB DEFAULT '{}'::jsonb,
		call_ending_rules JSONB DEFAULT '{}'::jsonb,
		metrics JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, createTableQuery)
	_, _ = h.db.Exec(ctx, "ALTER TABLE agents ADD COLUMN IF NOT EXISTS assigned_phone_number VARCHAR(100);")
	_, _ = h.db.Exec(ctx, "ALTER TABLE agents ADD COLUMN IF NOT EXISTS assigned_phone_number_id VARCHAR(100);")
	_, _ = h.db.Exec(ctx, "ALTER TABLE agents ADD COLUMN IF NOT EXISTS human_realism JSONB DEFAULT '{\"enableMicroBreaths\": true, \"enableBackchanneling\": true, \"enableAdaptiveEmotion\": true, \"maxWordsPerTurn\": 25, \"fillerFrequency\": \"medium\"}'::jsonb;")

	// Check if agents table is empty, if so seed defaults
	var count int
	_ = h.db.QueryRow(ctx, "SELECT COUNT(*) FROM agents").Scan(&count)
	if count == 0 {
		seedQuery := `
		INSERT INTO agents (id, name, description, avatar, color, status, voice, llm_model, language, greeting, system_prompt, response_style, interruption_sensitivity, silence_timeout_seconds, max_call_duration_minutes, knowledge_base_ids, tools, transfer_rules, call_ending_rules, metrics, created_at, updated_at)
		VALUES 
		('agent-solar-1', 'Marcus (Solar Advisor)', 'Specialized in commercial & residential solar qualification, financing options, and calendar booking.', '/avatars/marcus.png', '#3157D5', 'active',
		 '{"provider": "Kokoro-82M", "voiceId": "am_adam", "voiceName": "Adam (US Male • Deep & Engaging)", "gender": "male", "accent": "American (US)", "speed": 1.0, "pitch": 1.0, "stability": 0.75, "similarity": 0.85}'::jsonb,
		 'Qwen/Qwen2.5-7B-Instruct-AWQ', 'English (US)', 'Hello, this is Marcus with Apex Solar Solutions. How are you today?', 'You are Marcus, an empathetic and professional solar consultant. Your goal is to qualify homeowners and schedule consultation demos.',
		 'conversational', 0.70, 4, 15, '["kb-solar-faq", "kb-pricing-2026"]'::jsonb,
		 '[{"id": "tool-cal", "name": "Google Calendar Booking", "description": "Books meeting slots dynamically", "enabled": true, "type": "calendar"}, {"id": "tool-crm", "name": "HubSpot Deal Push", "description": "Pushes contact and qualification score", "enabled": true, "type": "crm"}]'::jsonb,
		 '{"enabled": true, "destinationNumber": "+1 (800) 555-0199", "triggerPhrase": "transfer to human specialist", "department": "Senior Engineering"}'::jsonb,
		 '{"goodbyePhrase": "Thank you for your time. Have a wonderful day!", "hangupOnSilence": true, "afterHoursBehavior": "voicemail"}'::jsonb,
		 '{"totalCalls": 0, "avgDurationSeconds": 0, "successRate": 0, "sentimentScore": 0, "connectedCalls": 0}'::jsonb,
		 NOW(), NOW()),
		('agent-sdr-2', 'Rachel (Enterprise SDR)', 'Inbound and outbound B2B pipeline development, discovery qualifications, and meeting confirmations.', '/avatars/rachel.png', '#6366F1', 'active',
		 '{"provider": "Kokoro-82M", "voiceId": "af_bella", "voiceName": "Bella (US Female • Warm & Professional)", "gender": "female", "accent": "American (US)", "speed": 1.0, "pitch": 1.0, "stability": 0.8, "similarity": 0.9}'::jsonb,
		 'Qwen/Qwen2.5-7B-Instruct-AWQ', 'English (US)', 'Hi there, this is Rachel from Apex Enterprise. Reaching out regarding your AI telephony inquiry.', 'You are Rachel, a sharp and engaging enterprise sales representative.',
		 'professional', 0.65, 3, 20, '["kb-enterprise-case-studies"]'::jsonb,
		 '[{"id": "tool-email", "name": "Send Demo Dossier", "description": "Dispatches PDF overview to lead email", "enabled": true, "type": "sms"}]'::jsonb,
		 '{"enabled": true, "destinationNumber": "+1 (800) 555-0188", "triggerPhrase": "speak with account executive", "department": "Enterprise Sales"}'::jsonb,
		 '{"goodbyePhrase": "I''ll send over the meeting brief now. Have a great day!", "hangupOnSilence": true, "afterHoursBehavior": "transfer"}'::jsonb,
		 '{"totalCalls": 0, "avgDurationSeconds": 0, "successRate": 0, "sentimentScore": 0, "connectedCalls": 0}'::jsonb,
		 NOW(), NOW()),
		('agent-cs-3', 'Elena (Customer Care)', 'Tier-1 customer support, billing questions, appointments rescheduling, and FAQs.', '/avatars/elena.png', '#10B981', 'active',
		 '{"provider": "Kokoro-82M", "voiceId": "bf_emma", "voiceName": "Emma (UK Female • Conversational & Direct)", "gender": "female", "accent": "British (UK)", "speed": 1.0, "pitch": 1.0, "stability": 0.85, "similarity": 0.9}'::jsonb,
		 'Qwen/Qwen2.5-7B-Instruct-AWQ', 'English (UK)', 'Thank you for calling Customer Care. My name is Elena. How may I assist you today?', 'You are Elena, a calm, patient, and knowledgeable customer service representative.',
		 'empathetic', 0.80, 5, 10, '["kb-solar-faq", "kb-returns-policy"]'::jsonb,
		 '[{"id": "tool-lookup", "name": "Account Record Lookup", "description": "Retrieves subscriber profile", "enabled": true, "type": "crm"}]'::jsonb,
		 '{"enabled": true, "destinationNumber": "+1 (800) 555-0155", "triggerPhrase": "speak with billing supervisor", "department": "Billing & Claims"}'::jsonb,
		 '{"goodbyePhrase": "Thank you for contacting customer care. Take care!", "hangupOnSilence": true, "afterHoursBehavior": "voicemail"}'::jsonb,
		 '{"totalCalls": 0, "avgDurationSeconds": 0, "successRate": 0, "sentimentScore": 0, "connectedCalls": 0}'::jsonb,
		 NOW(), NOW())
		ON CONFLICT (id) DO NOTHING;`
		_, _ = h.db.Exec(ctx, seedQuery)
	}

	// Clean up any old dummy stats from the database table
	cleanQuery := `
		UPDATE agents 
		SET metrics = '{"totalCalls": 0, "avgDurationSeconds": 0, "successRate": 0, "sentimentScore": 0, "connectedCalls": 0}'::jsonb
		WHERE metrics IS NULL 
		   OR metrics::text LIKE '%2150%' 
		   OR metrics::text LIKE '%1420%' 
		   OR metrics::text LIKE '%980%';`
	_, _ = h.db.Exec(ctx, cleanQuery)
}

type AgentModel struct {
	ID                    string          `json:"id"`
	Name                  string          `json:"name"`
	Description           string          `json:"description"`
	Avatar                string          `json:"avatar"`
	Color                 string          `json:"color"`
	Status                string          `json:"status"`
	Voice                 json.RawMessage `json:"voice"`
	LLMModel              string          `json:"llmModel"`
	Language              string          `json:"language"`
	Greeting              string          `json:"greeting"`
	SystemPrompt          string          `json:"systemPrompt"`
	ResponseStyle         string          `json:"responseStyle"`
	InterruptionSens      float64         `json:"interruptionSensitivity"`
	SilenceTimeoutSec     int             `json:"silenceTimeoutSeconds"`
	MaxCallDurationMin    int             `json:"maxCallDurationMinutes"`
	KnowledgeBaseIDs      json.RawMessage `json:"knowledgeBaseIds"`
	Tools                 json.RawMessage `json:"tools"`
	AssignedPhoneNumber   string          `json:"assignedPhoneNumber"`
	AssignedPhoneNumberID string          `json:"assignedPhoneNumberId"`
	TransferRules         json.RawMessage `json:"transferRules"`
	CallEndingRules       json.RawMessage `json:"callEndingRules"`
	HumanRealism          json.RawMessage `json:"humanRealism"`
	Metrics               json.RawMessage `json:"metrics"`
	CreatedAt             string          `json:"createdAt"`
	LastUpdated           string          `json:"lastUpdated"`
}

// GET /api/v1/agents
func (h *AgentsHandler) GetAgents(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, name, description, avatar, color, status, voice, llm_model, language, greeting, system_prompt, response_style, interruption_sensitivity, silence_timeout_seconds, max_call_duration_minutes, knowledge_base_ids, tools, COALESCE(assigned_phone_number, ''), COALESCE(assigned_phone_number_id, ''), transfer_rules, call_ending_rules, COALESCE(human_realism, '{}'::jsonb), metrics, created_at, updated_at
		FROM agents
		WHERE tenant_id = $1
		ORDER BY created_at ASC`, tenantID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch agents from database: " + err.Error()})
		return
	}
	defer rows.Close()

	agents := make([]AgentModel, 0)
	for rows.Next() {
		var a AgentModel
		var voiceB, kbB, toolsB, transferB, endingB, hrB, metricsB []byte
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&a.ID, &a.Name, &a.Description, &a.Avatar, &a.Color, &a.Status,
			&voiceB, &a.LLMModel, &a.Language, &a.Greeting, &a.SystemPrompt,
			&a.ResponseStyle, &a.InterruptionSens, &a.SilenceTimeoutSec, &a.MaxCallDurationMin,
			&kbB, &toolsB, &a.AssignedPhoneNumber, &a.AssignedPhoneNumberID,
			&transferB, &endingB, &hrB, &metricsB,
			&createdAt, &updatedAt,
		)
		if err == nil {
			a.Voice = json.RawMessage(voiceB)
			a.KnowledgeBaseIDs = json.RawMessage(kbB)
			a.Tools = json.RawMessage(toolsB)
			a.TransferRules = json.RawMessage(transferB)
			a.CallEndingRules = json.RawMessage(endingB)
			a.HumanRealism = json.RawMessage(hrB)
			a.Metrics = json.RawMessage(metricsB)
			a.CreatedAt = createdAt.Format(time.RFC3339)
			a.LastUpdated = updatedAt.Format("2006-01-02 15:04")
			agents = append(agents, a)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"agents": agents,
		"total":  len(agents),
	})
}

// GET /api/v1/agents/:id
func (h *AgentsHandler) GetAgentByID(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	id := c.Param("id")
	var a AgentModel
	var voiceB, kbB, toolsB, transferB, endingB, hrB, metricsB []byte
	var createdAt, updatedAt time.Time

	err := h.db.QueryRow(ctx, `
		SELECT id, name, description, avatar, color, status, voice, llm_model, language, greeting, system_prompt, response_style, interruption_sensitivity, silence_timeout_seconds, max_call_duration_minutes, knowledge_base_ids, tools, COALESCE(assigned_phone_number, ''), COALESCE(assigned_phone_number_id, ''), transfer_rules, call_ending_rules, COALESCE(human_realism, '{}'::jsonb), metrics, created_at, updated_at
		FROM agents 
		WHERE id = $1 AND tenant_id = $2`, id, tenantID).Scan(
		&a.ID, &a.Name, &a.Description, &a.Avatar, &a.Color, &a.Status,
		&voiceB, &a.LLMModel, &a.Language, &a.Greeting, &a.SystemPrompt,
		&a.ResponseStyle, &a.InterruptionSens, &a.SilenceTimeoutSec, &a.MaxCallDurationMin,
		&kbB, &toolsB, &a.AssignedPhoneNumber, &a.AssignedPhoneNumberID,
		&transferB, &endingB, &hrB, &metricsB,
		&createdAt, &updatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent not found or does not belong to this tenant organization"})
		return
	}

	a.Voice = json.RawMessage(voiceB)
	a.KnowledgeBaseIDs = json.RawMessage(kbB)
	a.Tools = json.RawMessage(toolsB)
	a.TransferRules = json.RawMessage(transferB)
	a.CallEndingRules = json.RawMessage(endingB)
	a.HumanRealism = json.RawMessage(hrB)
	a.Metrics = json.RawMessage(metricsB)
	a.CreatedAt = createdAt.Format(time.RFC3339)
	a.LastUpdated = updatedAt.Format("2006-01-02 15:04")

	c.JSON(http.StatusOK, gin.H{"agent": a})
}

// POST /api/v1/agents
func (h *AgentsHandler) CreateAgent(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	var req AgentModel
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("agent-%d", time.Now().UnixNano()/1000000)
	}
	if req.Status == "" {
		req.Status = "active"
	}
	if req.Color == "" {
		req.Color = "#3157D5"
	}
	if req.Language == "" {
		req.Language = "English (US)"
	}
	if req.LLMModel == "" {
		req.LLMModel = "Qwen/Qwen2.5-7B-Instruct-AWQ"
	}
	if len(req.Voice) == 0 {
		req.Voice = json.RawMessage(`{"provider": "Kokoro-82M", "voiceId": "af_bella", "voiceName": "Bella (US Female • Warm & Professional)", "speed": 1.0, "stability": 0.8}`)
	}
	if len(req.KnowledgeBaseIDs) == 0 {
		req.KnowledgeBaseIDs = json.RawMessage(`[]`)
	}
	if len(req.Tools) == 0 {
		req.Tools = json.RawMessage(`[]`)
	}
	if len(req.TransferRules) == 0 {
		req.TransferRules = json.RawMessage(`{"enabled": false}`)
	}
	if len(req.CallEndingRules) == 0 {
		req.CallEndingRules = json.RawMessage(`{"goodbyePhrase": "Thank you for your time. Have a wonderful day!", "hangupOnSilence": true}`)
	}
	if len(req.HumanRealism) == 0 {
		req.HumanRealism = json.RawMessage(`{"enableMicroBreaths": true, "enableBackchanneling": true, "enableAdaptiveEmotion": true, "maxWordsPerTurn": 25, "fillerFrequency": "medium"}`)
	}
	if len(req.Metrics) == 0 {
		req.Metrics = json.RawMessage(`{"totalCalls": 0, "avgDurationSeconds": 0, "successRate": 100, "sentimentScore": 100, "connectedCalls": 0}`)
	}

	query := `
		INSERT INTO agents (id, name, description, avatar, color, status, voice, llm_model, language, greeting, system_prompt, response_style, interruption_sensitivity, silence_timeout_seconds, max_call_duration_minutes, knowledge_base_ids, tools, assigned_phone_number, assigned_phone_number_id, transfer_rules, call_ending_rules, human_realism, metrics, tenant_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			avatar = EXCLUDED.avatar,
			color = EXCLUDED.color,
			status = EXCLUDED.status,
			voice = EXCLUDED.voice,
			llm_model = EXCLUDED.llm_model,
			language = EXCLUDED.language,
			greeting = EXCLUDED.greeting,
			system_prompt = EXCLUDED.system_prompt,
			response_style = EXCLUDED.response_style,
			interruption_sensitivity = EXCLUDED.interruption_sensitivity,
			silence_timeout_seconds = EXCLUDED.silence_timeout_seconds,
			max_call_duration_minutes = EXCLUDED.max_call_duration_minutes,
			knowledge_base_ids = EXCLUDED.knowledge_base_ids,
			tools = EXCLUDED.tools,
			assigned_phone_number = EXCLUDED.assigned_phone_number,
			assigned_phone_number_id = EXCLUDED.assigned_phone_number_id,
			transfer_rules = EXCLUDED.transfer_rules,
			call_ending_rules = EXCLUDED.call_ending_rules,
			human_realism = EXCLUDED.human_realism,
			tenant_id = EXCLUDED.tenant_id,
			updated_at = NOW()`

	_, err := h.db.Exec(ctx, query,
		req.ID, req.Name, req.Description, req.Avatar, req.Color, req.Status,
		req.Voice, req.LLMModel, req.Language, req.Greeting, req.SystemPrompt,
		req.ResponseStyle, req.InterruptionSens, req.SilenceTimeoutSec, req.MaxCallDurationMin,
		req.KnowledgeBaseIDs, req.Tools, req.AssignedPhoneNumber, req.AssignedPhoneNumberID,
		req.TransferRules, req.CallEndingRules, req.HumanRealism, req.Metrics,
		tenantID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create agent in database: " + err.Error()})
		return
	}

	// Synchronize Phone Numbers Table
	if req.AssignedPhoneNumberID != "" {
		_, _ = h.db.Exec(ctx, "UPDATE phone_numbers SET assigned_agent_id = $1, assigned_agent_name = $2, updated_at = NOW() WHERE id = $3 AND tenant_id = $4", req.ID, req.Name, req.AssignedPhoneNumberID, tenantID)
		_, _ = h.db.Exec(ctx, "UPDATE phone_numbers SET assigned_agent_id = NULL, assigned_agent_name = NULL, updated_at = NOW() WHERE assigned_agent_id = $1 AND id != $2 AND tenant_id = $3", req.ID, req.AssignedPhoneNumberID, tenantID)
	}

	req.CreatedAt = time.Now().Format(time.RFC3339)
	req.LastUpdated = time.Now().Format("2006-01-02 15:04")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Agent saved to database successfully",
		"agent":   req,
	})
}

// PUT /api/v1/agents/:id
func (h *AgentsHandler) UpdateAgent(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	id := c.Param("id")
	var req AgentModel
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `
		UPDATE agents SET
			name = $1, description = $2, avatar = $3, color = $4, status = $5,
			voice = $6, llm_model = $7, language = $8, greeting = $9, system_prompt = $10,
			response_style = $11, interruption_sensitivity = $12, silence_timeout_seconds = $13,
			max_call_duration_minutes = $14, knowledge_base_ids = $15, tools = $16,
			assigned_phone_number = $17, assigned_phone_number_id = $18,
			transfer_rules = $19, call_ending_rules = $20, human_realism = $21, updated_at = NOW()
		WHERE id = $22 AND tenant_id = $23`

	res, err := h.db.Exec(ctx, query,
		req.Name, req.Description, req.Avatar, req.Color, req.Status,
		req.Voice, req.LLMModel, req.Language, req.Greeting, req.SystemPrompt,
		req.ResponseStyle, req.InterruptionSens, req.SilenceTimeoutSec,
		req.MaxCallDurationMin, req.KnowledgeBaseIDs, req.Tools,
		req.AssignedPhoneNumber, req.AssignedPhoneNumberID,
		req.TransferRules, req.CallEndingRules, req.HumanRealism, id, tenantID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update agent in database: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent not found or does not belong to this tenant"})
		return
	}

	// Synchronize Phone Numbers Table
	if req.AssignedPhoneNumberID != "" {
		_, _ = h.db.Exec(ctx, "UPDATE phone_numbers SET assigned_agent_id = $1, assigned_agent_name = $2, updated_at = NOW() WHERE id = $3 AND tenant_id = $4", id, req.Name, req.AssignedPhoneNumberID, tenantID)
		_, _ = h.db.Exec(ctx, "UPDATE phone_numbers SET assigned_agent_id = NULL, assigned_agent_name = NULL, updated_at = NOW() WHERE assigned_agent_id = $1 AND id != $2 AND tenant_id = $3", id, req.AssignedPhoneNumberID, tenantID)
	} else {
		_, _ = h.db.Exec(ctx, "UPDATE phone_numbers SET assigned_agent_id = NULL, assigned_agent_name = NULL, updated_at = NOW() WHERE assigned_agent_id = $1 AND tenant_id = $2", id, tenantID)
	}

	req.ID = id
	req.LastUpdated = time.Now().Format("2006-01-02 15:04")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Agent updated in database successfully",
		"agent":   req,
	})
}

// PATCH /api/v1/agents/:id/status
func (h *AgentsHandler) ToggleAgentStatus(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`
	res, err := h.db.Exec(ctx, query, req.Status, id, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update agent status in database: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent not found or unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Agent status updated in database",
		"id":      id,
		"status":  req.Status,
	})
}

// DELETE /api/v1/agents/:id
func (h *AgentsHandler) DeleteAgent(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	id := c.Param("id")


	// Unassign phone numbers and website widgets pointing to this agent
	_, _ = h.db.Exec(ctx, `UPDATE phone_numbers SET assigned_agent_id = NULL, assigned_agent_name = NULL WHERE assigned_agent_id = $1 AND tenant_id = $2`, id, tenantID)
	_, _ = h.db.Exec(ctx, `UPDATE website_widgets SET assigned_agent_id = NULL WHERE assigned_agent_id = $1 AND tenant_id = $2`, id, tenantID)


	query := `DELETE FROM agents WHERE id = $1 AND tenant_id = $2`
	res, err := h.db.Exec(ctx, query, id, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete agent from database: " + err.Error()})
		return
	}


	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agent not found or unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Agent deleted from database",
		"id":      id,
	})
}
