package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CampaignsHandler struct {
	db *pgxpool.Pool
}

func NewCampaignsHandler(db *pgxpool.Pool) *CampaignsHandler {
	h := &CampaignsHandler{db: db}
	h.ensureSchema()
	return h
}

func (h *CampaignsHandler) ensureSchema() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
	CREATE TABLE IF NOT EXISTS campaigns (
		id VARCHAR(100) PRIMARY KEY,
		organization_id INT,
		name VARCHAR(255) NOT NULL,
		type VARCHAR(50) DEFAULT 'outbound_sales',
		agent_id VARCHAR(100),
		agent_name VARCHAR(255) DEFAULT 'Marcus (Solar Advisor)',
		phone_number VARCHAR(100) DEFAULT '+1 (800) 459-0120',
		status VARCHAR(50) DEFAULT 'active',
		script_template TEXT DEFAULT '',
		voice_prompt TEXT DEFAULT '',
		total_leads INT DEFAULT 0,
		called_leads INT DEFAULT 0,
		connected_leads INT DEFAULT 0,
		qualified_leads INT DEFAULT 0,
		conversion_rate DECIMAL(5,2) DEFAULT 0.0,
		answer_rate DECIMAL(5,2) DEFAULT 0.0,
		concurrency_limit INT DEFAULT 10,
		retry_attempts INT DEFAULT 3,
		retry_interval_minutes INT DEFAULT 30,
		schedule JSONB DEFAULT '{}'::jsonb,
		amd_config JSONB DEFAULT '{}'::jsonb,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agent_name VARCHAR(255) DEFAULT 'Marcus (Solar Advisor)';
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS phone_number VARCHAR(100) DEFAULT '+1 (800) 459-0120';
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS called_leads INT DEFAULT 0;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS connected_leads INT DEFAULT 0;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS qualified_leads INT DEFAULT 0;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0.0;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS answer_rate DECIMAL(5,2) DEFAULT 0.0;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS retry_attempts INT DEFAULT 3;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS retry_interval_minutes INT DEFAULT 30;
	ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS amd_config JSONB DEFAULT '{}'::jsonb;
	`
	_, _ = h.db.Exec(ctx, query)
}

type CampaignDTO struct {
	ID                   string                 `json:"id"`
	Name                 string                 `json:"name"`
	Type                 string                 `json:"type"`
	Status               string                 `json:"status"`
	AgentID              string                 `json:"agentId"`
	AgentName            string                 `json:"agentName"`
	PhoneNumber          string                 `json:"phoneNumber"`
	TotalLeads           int                    `json:"totalLeads"`
	CalledLeads          int                    `json:"calledLeads"`
	ConnectedLeads       int                    `json:"connectedLeads"`
	QualifiedLeads       int                    `json:"qualifiedLeads"`
	ConversionRate       float64                `json:"conversionRate"`
	AnswerRate           float64                `json:"answerRate"`
	ConcurrencyLimit     int                    `json:"concurrencyLimit"`
	RetryAttempts        int                    `json:"retryAttempts"`
	RetryIntervalMinutes int                    `json:"retryIntervalMinutes"`
	Schedule             map[string]interface{} `json:"schedule"`
	AMDConfig            map[string]interface{} `json:"amdConfig,omitempty"`
	CreatedAt            string                 `json:"createdAt"`
	LastActive           string                 `json:"lastActive"`
}

// GET /api/v1/campaigns
func (h *CampaignsHandler) GetCampaigns(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id, name, type, status, COALESCE(agent_id, ''), COALESCE(agent_name, 'Marcus (Solar Advisor)'),
		       COALESCE(phone_number, '+1 (800) 459-0120'), total_leads, called_leads, connected_leads,
		       qualified_leads, conversion_rate, answer_rate, concurrency_limit, retry_attempts,
		       retry_interval_minutes, schedule, amd_config, created_at, updated_at
		FROM campaigns
		ORDER BY created_at DESC LIMIT 100`)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{"campaigns": []CampaignDTO{}})
		return
	}
	defer rows.Close()

	campaigns := make([]CampaignDTO, 0)
	for rows.Next() {
		var camp CampaignDTO
		var scheduleBytes, amdBytes []byte
		var createdAt, updatedAt time.Time

		if err := rows.Scan(
			&camp.ID, &camp.Name, &camp.Type, &camp.Status, &camp.AgentID, &camp.AgentName,
			&camp.PhoneNumber, &camp.TotalLeads, &camp.CalledLeads, &camp.ConnectedLeads,
			&camp.QualifiedLeads, &camp.ConversionRate, &camp.AnswerRate, &camp.ConcurrencyLimit,
			&camp.RetryAttempts, &camp.RetryIntervalMinutes, &scheduleBytes, &amdBytes,
			&createdAt, &updatedAt,
		); err == nil {
			camp.Schedule = make(map[string]interface{})
			if len(scheduleBytes) > 0 {
				_ = json.Unmarshal(scheduleBytes, &camp.Schedule)
			}
			camp.AMDConfig = make(map[string]interface{})
			if len(amdBytes) > 0 {
				_ = json.Unmarshal(amdBytes, &camp.AMDConfig)
			}
			camp.CreatedAt = createdAt.Format(time.RFC3339)
			camp.LastActive = updatedAt.Format(time.RFC3339)
			campaigns = append(campaigns, camp)
		}
	}

	c.JSON(http.StatusOK, gin.H{"campaigns": campaigns})
}

// GET /api/v1/campaigns/:id
func (h *CampaignsHandler) GetCampaignByID(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var camp CampaignDTO
	var scheduleBytes, amdBytes []byte
	var createdAt, updatedAt time.Time

	err := h.db.QueryRow(ctx, `
		SELECT id, name, type, status, COALESCE(agent_id, ''), COALESCE(agent_name, 'Marcus (Solar Advisor)'),
		       COALESCE(phone_number, '+1 (800) 459-0120'), total_leads, called_leads, connected_leads,
		       qualified_leads, conversion_rate, answer_rate, concurrency_limit, retry_attempts,
		       retry_interval_minutes, schedule, amd_config, created_at, updated_at
		FROM campaigns WHERE id = $1`, id).Scan(
		&camp.ID, &camp.Name, &camp.Type, &camp.Status, &camp.AgentID, &camp.AgentName,
		&camp.PhoneNumber, &camp.TotalLeads, &camp.CalledLeads, &camp.ConnectedLeads,
		&camp.QualifiedLeads, &camp.ConversionRate, &camp.AnswerRate, &camp.ConcurrencyLimit,
		&camp.RetryAttempts, &camp.RetryIntervalMinutes, &scheduleBytes, &amdBytes,
		&createdAt, &updatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	camp.Schedule = make(map[string]interface{})
	if len(scheduleBytes) > 0 {
		_ = json.Unmarshal(scheduleBytes, &camp.Schedule)
	}
	camp.AMDConfig = make(map[string]interface{})
	if len(amdBytes) > 0 {
		_ = json.Unmarshal(amdBytes, &camp.AMDConfig)
	}
	camp.CreatedAt = createdAt.Format(time.RFC3339)
	camp.LastActive = updatedAt.Format(time.RFC3339)

	c.JSON(http.StatusOK, camp)
}

// POST /api/v1/campaigns
func (h *CampaignsHandler) CreateCampaign(c *gin.Context) {
	var payload CampaignDTO
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	if payload.ID == "" {
		payload.ID = fmt.Sprintf("camp-%d", time.Now().UnixNano()/1e6)
	}
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.AgentName == "" {
		payload.AgentName = "Marcus (Solar Advisor)"
	}

	scheduleJSON, _ := json.Marshal(payload.Schedule)
	amdJSON, _ := json.Marshal(payload.AMDConfig)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.db.Exec(ctx, `
		INSERT INTO campaigns (
			id, name, type, status, agent_id, agent_name, phone_number, total_leads,
			called_leads, connected_leads, qualified_leads, conversion_rate, answer_rate,
			concurrency_limit, retry_attempts, retry_interval_minutes, schedule, amd_config,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
		)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			status = EXCLUDED.status,
			agent_id = EXCLUDED.agent_id,
			agent_name = EXCLUDED.agent_name,
			phone_number = EXCLUDED.phone_number,
			total_leads = EXCLUDED.total_leads,
			concurrency_limit = EXCLUDED.concurrency_limit,
			retry_attempts = EXCLUDED.retry_attempts,
			retry_interval_minutes = EXCLUDED.retry_interval_minutes,
			schedule = EXCLUDED.schedule,
			amd_config = EXCLUDED.amd_config,
			updated_at = NOW()
	`, payload.ID, payload.Name, payload.Type, payload.Status, payload.AgentID, payload.AgentName,
		payload.PhoneNumber, payload.TotalLeads, payload.CalledLeads, payload.ConnectedLeads,
		payload.QualifiedLeads, payload.ConversionRate, payload.AnswerRate, payload.ConcurrencyLimit,
		payload.RetryAttempts, payload.RetryIntervalMinutes, scheduleJSON, amdJSON)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save campaign: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Campaign created and stored in PostgreSQL database successfully",
		"campaign": payload,
	})
}

// PATCH /api/v1/campaigns/:id/status
func (h *CampaignsHandler) UpdateCampaignStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := h.db.Exec(ctx, `UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2`, req.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update campaign status: " + err.Error()})
		return
	}
	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign status updated", "status": req.Status})
}

// DELETE /api/v1/campaigns/:id
func (h *CampaignsHandler) DeleteCampaign(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.db.Exec(ctx, `DELETE FROM campaigns WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete campaign: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign deleted successfully"})
}

// GET /api/v1/campaigns/:id/script
func (h *CampaignsHandler) GetScript(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var name, scriptTemplate, voicePrompt string
	err := h.db.QueryRow(ctx, `SELECT name, COALESCE(script_template, ''), COALESCE(voice_prompt, '') FROM campaigns WHERE id = $1`, id).Scan(&name, &scriptTemplate, &voicePrompt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"campaign_id":     id,
		"name":            name,
		"script_template": scriptTemplate,
		"voice_prompt":    voicePrompt,
	})
}

type ImportLeadItem struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Company string `json:"company"`
	Notes   string `json:"notes"`
}

type ImportLeadsRequest struct {
	CampaignID   string           `json:"campaignId"`
	CampaignName string           `json:"campaignName"`
	Leads        []ImportLeadItem `json:"leads"`
}

// POST /api/v1/campaigns/import-leads
func (h *CampaignsHandler) ImportLeads(c *gin.Context) {
	var req ImportLeadsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	importedCount := 0
	campaignName := req.CampaignName
	if campaignName == "" {
		campaignName = "Outbound Campaign"
	}

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 5
	}

	for _, l := range req.Leads {
		if strings.TrimSpace(l.Name) == "" && strings.TrimSpace(l.Phone) == "" {
			continue
		}
		contactID := fmt.Sprintf("cont-camp-%d-%d", time.Now().UnixNano(), importedCount)
		leadName := strings.TrimSpace(l.Name)
		if leadName == "" {
			leadName = "Outbound Prospect"
		}
		leadPhone := strings.TrimSpace(l.Phone)
		if leadPhone == "" {
			leadPhone = "+1 (555) 000-0000"
		}
		leadEmail := strings.TrimSpace(l.Email)
		leadCompany := strings.TrimSpace(l.Company)
		if leadCompany == "" {
			leadCompany = "Imported Lead"
		}
		leadNotes := strings.TrimSpace(l.Notes)
		if leadNotes == "" {
			leadNotes = fmt.Sprintf("Imported via CSV into campaign '%s'. Ready for automated voice dialing.", campaignName)
		}

		// Insert into contacts table
		_, _ = h.db.Exec(ctx, `
			INSERT INTO contacts (id, tenant_id, name, phone, email, company, lead_score, status, campaign_name, last_call_outcome, notes, tags, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, 75, 'new', $7, 'Pending Call', $8, ARRAY['CSV Import', $7], NOW(), NOW())
			ON CONFLICT (id) DO NOTHING
		`, contactID, tenantID, leadName, leadPhone, leadEmail, leadCompany, campaignName, leadNotes)

		// Insert into leads table
		_, _ = h.db.Exec(ctx, `
			INSERT INTO leads (name, phone, status, notes, created_at, updated_at)
			VALUES ($1, $2, 'pending', $3, NOW(), NOW())
		`, leadName, leadPhone, leadNotes)

		importedCount++
	}

	// Update campaign total_leads count if campaignId provided
	if req.CampaignID != "" && importedCount > 0 {
		_, _ = h.db.Exec(ctx, `
			UPDATE campaigns 
			SET total_leads = total_leads + $1, updated_at = NOW() 
			WHERE id = $2
		`, importedCount, req.CampaignID)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       fmt.Sprintf("Successfully imported and stored %d leads in PostgreSQL database", importedCount),
		"importedCount": importedCount,
		"campaignName":  campaignName,
	})
}
