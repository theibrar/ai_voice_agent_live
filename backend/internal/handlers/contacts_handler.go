package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ContactsHandler struct {
	db *pgxpool.Pool
}

func NewContactsHandler(db *pgxpool.Pool) *ContactsHandler {
	h := &ContactsHandler{db: db}
	h.ensureSchemaAndSeed()
	return h
}

func (h *ContactsHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS contacts (
		id VARCHAR(100) PRIMARY KEY,
		tenant_id INT,
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
	);`
	_, _ = h.db.Exec(ctx, createTableQuery)

	// Check if contacts table has records, if not seed realistic initial leads
	var count int
	_ = h.db.QueryRow(ctx, "SELECT COUNT(*) FROM contacts").Scan(&count)
	if count == 0 {
		seedQuery := `
		INSERT INTO contacts (id, name, phone, email, company, lead_score, status, campaign_name, last_call_outcome, notes, tags, created_at, updated_at)
		VALUES 
		('cont-1', 'Dr. Jonathan Vance', '+1 (555) 432-8899', 'jonathan.vance@apexhealth.org', 'Apex Healthcare Systems', 95, 'qualified', 'Executive Medical Triage', 'Appointment Booked',
		 '[Call Outcome: Appointment Booked] Handled by Elena (Customer Care). Caller requested solutions consultation. Verified contact details and locked Google Calendar slot. High purchasing intent.',
		 '{"VIP", "High Intent", "Medical"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
		('cont-2', 'Sarah Jenkins', '+1 (415) 890-2341', 'sarah.jenkins@lumina-cloud.io', 'Lumina Cloud Architecture', 88, 'in_progress', 'Cloud Solutions Inbound', 'Knowledge Inquiry / Price Check',
		 '[Call Outcome: Knowledge Inquiry / Price Check] Caller inquired about SOC2 Type II compliance and Tier 3 volume discounts. AI provided SOC2 & Tier-1 pricing dossier. Caller showed interest; guided back to conversation flow.',
		 '{"Enterprise", "SOC2 Check"}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
		('cont-3', 'Michael Scott', '+1 (555) 902-1133', 'michael.scott@dunder.com', 'Dunder Mifflin Paper Co', 60, 'no_answer', 'Outbound Sales Sprint', 'No Answer / Missed',
		 '[Call Outcome: No Answer / Missed] Outbound call attempted by Marcus Vance. No pickup detected after 25s ring. Scheduled for automated Smart-AMD retry in 4 hours.',
		 '{"Outbound", "Retry Scheduled"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');`
		_, _ = h.db.Exec(ctx, seedQuery)
	}
}

type ContactDTO struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Phone           string   `json:"phone"`
	Email           string   `json:"email"`
	Company         string   `json:"company"`
	LeadScore       int      `json:"leadScore"`
	Status          string   `json:"status"`
	CampaignName    string   `json:"campaignName"`
	LastCallOutcome string   `json:"lastCallOutcome"`
	Notes           string   `json:"notes"`
	Tags            []string `json:"tags"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
}

// GET /api/v1/contacts
func (h *ContactsHandler) GetContacts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, name, phone, COALESCE(email, ''), COALESCE(company, 'Independent'), lead_score, COALESCE(status, 'new'), COALESCE(campaign_name, 'Inbound Direct'), COALESCE(last_call_outcome, 'Not Called Yet'), COALESCE(notes, ''), COALESCE(tags, ARRAY[]::TEXT[]), created_at, updated_at
		FROM contacts 
		WHERE tenant_id = $1 OR tenant_id IS NULL
		ORDER BY updated_at DESC LIMIT 100`, tenantID)

	contacts := make([]ContactDTO, 0)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var ct ContactDTO
			var createdAt, updatedAt time.Time
			if err := rows.Scan(&ct.ID, &ct.Name, &ct.Phone, &ct.Email, &ct.Company, &ct.LeadScore, &ct.Status, &ct.CampaignName, &ct.LastCallOutcome, &ct.Notes, &ct.Tags, &createdAt, &updatedAt); err == nil {
				ct.CreatedAt = createdAt.Format(time.RFC3339)
				ct.UpdatedAt = updatedAt.Format(time.RFC3339)
				contacts = append(contacts, ct)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"contacts": contacts,
		"total":    len(contacts),
	})
}

// POST /api/v1/contacts
func (h *ContactsHandler) CreateOrUpdateContact(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	var req struct {
		ID              string   `json:"id"`
		Name            string   `json:"name" binding:"required"`
		Phone           string   `json:"phone" binding:"required"`
		Email           string   `json:"email"`
		Company         string   `json:"company"`
		LeadScore       int      `json:"leadScore"`
		Status          string   `json:"status"`
		CampaignName    string   `json:"campaignName"`
		LastCallOutcome string   `json:"lastCallOutcome"`
		Notes           string   `json:"notes"`
		Tags            []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("cont-%d", time.Now().UnixNano()/1000000)
	}
	if req.Company == "" {
		req.Company = "Independent"
	}
	if req.LeadScore == 0 {
		req.LeadScore = 75
	}
	if req.Status == "" {
		req.Status = "new"
	}
	if req.CampaignName == "" {
		req.CampaignName = "Inbound Direct"
	}
	if req.LastCallOutcome == "" {
		req.LastCallOutcome = "Lead Logged in CRM"
	}
	if req.Email == "" {
		req.Email = fmt.Sprintf("%s@example.com", strings.ToLower(strings.ReplaceAll(req.Name, " ", ".")))
	}
	if len(req.Tags) == 0 {
		req.Tags = []string{"New Lead"}
	}

	query := `
		INSERT INTO contacts (id, name, phone, email, company, lead_score, status, campaign_name, last_call_outcome, notes, tags, tenant_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			phone = EXCLUDED.phone,
			email = EXCLUDED.email,
			company = EXCLUDED.company,
			lead_score = EXCLUDED.lead_score,
			status = EXCLUDED.status,
			campaign_name = EXCLUDED.campaign_name,
			last_call_outcome = EXCLUDED.last_call_outcome,
			notes = EXCLUDED.notes,
			tags = EXCLUDED.tags,
			tenant_id = EXCLUDED.tenant_id,
			updated_at = NOW()`

	_, err := h.db.Exec(ctx, query, req.ID, req.Name, req.Phone, req.Email, req.Company, req.LeadScore, req.Status, req.CampaignName, req.LastCallOutcome, req.Notes, req.Tags, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save contact: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Contact saved to CRM ledger",
		"contact": req,
	})
}

// PUT /api/v1/contacts/:id/notes
func (h *ContactsHandler) UpdateNotes(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Contact ID is required"})
		return
	}

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	var req struct {
		Notes           string `json:"notes" binding:"required"`
		LastCallOutcome string `json:"lastCallOutcome"`
		Status          string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE contacts 
		SET notes = $1,
			last_call_outcome = CASE WHEN $2 <> '' THEN $2 ELSE last_call_outcome END,
			status = CASE WHEN $3 <> '' THEN $3 ELSE status END,
			updated_at = NOW()
		WHERE id = $4 AND (tenant_id = $5 OR tenant_id IS NULL)`

	res, err := h.db.Exec(ctx, query, req.Notes, req.LastCallOutcome, req.Status, id, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update contact notes: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found or unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contact notes updated successfully", "id": id})
}

// DELETE /api/v1/contacts/:id
func (h *ContactsHandler) DeleteContact(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Contact ID is required"})
		return
	}

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	res, err := h.db.Exec(ctx, "DELETE FROM contacts WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)", id, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete contact: " + err.Error()})
		return
	}

	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Contact not found or unauthorized"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contact deleted from CRM", "id": id})
}
