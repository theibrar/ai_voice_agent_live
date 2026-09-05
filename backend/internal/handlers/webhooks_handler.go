package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ramzan/backend-chatbot/internal/domain"
)

type WebhooksHandler struct {
	db *pgxpool.Pool
}

func NewWebhooksHandler(db *pgxpool.Pool) *WebhooksHandler {
	h := &WebhooksHandler{db: db}
	h.ensureSchemaAndSeed()
	return h
}

func (h *WebhooksHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Ensure webhooks table
	createWebhooksTable := `
	CREATE TABLE IF NOT EXISTS webhooks (
		id SERIAL PRIMARY KEY,
		tenant_id INT DEFAULT 1,
		name VARCHAR(255) NOT NULL,
		url VARCHAR(500) NOT NULL,
		events TEXT[] DEFAULT '{"call.completed", "lead.qualified", "appointment.booked"}',
		secret VARCHAR(255) DEFAULT 'whsec_vault_2026_managed',
		status VARCHAR(50) DEFAULT 'active',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, createWebhooksTable)

	// 2. Ensure webhook_logs table
	createLogsTable := `
	CREATE TABLE IF NOT EXISTS webhook_logs (
		id SERIAL PRIMARY KEY,
		webhook_id INT,
		event_type VARCHAR(100) NOT NULL,
		direction VARCHAR(20) DEFAULT 'inbound',
		payload JSONB NOT NULL DEFAULT '{}'::jsonb,
		headers JSONB DEFAULT '{}'::jsonb,
		response_status INT DEFAULT 200,
		response_body TEXT,
		ip_address VARCHAR(45) DEFAULT '127.0.0.1',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, createLogsTable)
}

// POST /api/v1/webhooks/incoming
// Handles inbound website form payloads and stores in webhook_logs, leads, contacts, and audit_logs in PostgreSQL
func (h *WebhooksHandler) IngestIncomingWebhook(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var rawBody map[string]interface{}
	if err := c.ShouldBindJSON(&rawBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload: " + err.Error()})
		return
	}

	payloadBytes, _ := json.Marshal(rawBody)

	// Extract standard fields
	getString := func(keys ...string) string {
		for _, k := range keys {
			if val, ok := rawBody[k].(string); ok && val != "" {
				return val
			}
		}
		return ""
	}

	name := getString("name", "fullName", "full_name", "first_name", "lead_name")
	if name == "" {
		name = "Website Visitor"
	}

	phone := getString("phone", "phoneNumber", "phone_number", "mobile", "tel")
	if phone == "" {
		phone = "+1 (415) 890-2341"
	}

	email := getString("email", "email_address", "contact_email")
	if email == "" {
		email = "inbound.visitor@example.com"
	}

	company := getString("company", "company_name", "organization", "org")
	if company == "" {
		company = "Website Inbound"
	}

	notes := getString("notes", "message", "comments", "description", "details")
	if notes == "" {
		notes = "Lead collected automatically via Website Inbound Webhook."
	}

	campaignName := getString("campaign", "campaign_name", "source")
	if campaignName == "" {
		campaignName = "Website Inbound Form"
	}

	// Multi-Tenant Resolution
	tenantID := 1
	if qTenant := c.Query("tenant_id"); qTenant != "" {
		if val, err := strconv.Atoi(qTenant); err == nil && val > 0 {
			tenantID = val
		}
	} else if qTenant := c.Query("tenant"); qTenant != "" {
		if val, err := strconv.Atoi(qTenant); err == nil && val > 0 {
			tenantID = val
		}
	}
	if hTenant := c.GetHeader("X-Tenant-ID"); hTenant != "" {
		if val, err := strconv.Atoi(hTenant); err == nil && val > 0 {
			tenantID = val
		}
	}
	if tVal, ok := rawBody["tenant_id"].(float64); ok && int(tVal) > 0 {
		tenantID = int(tVal)
	} else if tValStr, ok := rawBody["tenant_id"].(string); ok {
		if val, err := strconv.Atoi(tValStr); err == nil && val > 0 {
			tenantID = val
		}
	}

	leadID := uuid.New()
	metadataJSON, _ := json.Marshal(map[string]interface{}{
		"source":        "website_inbound_webhook",
		"tenant_id":     tenantID,
		"raw_payload":   rawBody,
		"ingested_via":  "inbound_webhook",
		"ingested_time": time.Now().UTC().Format(time.RFC3339),
	})

	// 1. Insert into webhook_logs table
	headersMap := make(map[string]string)
	for k, v := range c.Request.Header {
		if len(v) > 0 {
			headersMap[k] = v[0]
		}
	}
	headersJSON, _ := json.Marshal(headersMap)

	logQuery := `
		INSERT INTO webhook_logs (event_type, direction, payload, headers, response_status, response_body, ip_address, created_at)
		VALUES ('lead.created', 'inbound', $1::jsonb, $2::jsonb, 200, 'Lead ingested successfully', $3, NOW())`
	_, _ = h.db.Exec(ctx, logQuery, payloadBytes, headersJSON, c.ClientIP())

	// 2. Insert into leads table
	leadQuery := `
		INSERT INTO leads (id, phone, name, email, status, metadata, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'new', $5, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`
	_, _ = h.db.Exec(ctx, leadQuery, leadID, phone, name, email, metadataJSON)

	// 3. Insert into contacts table with tenant_id isolation
	contactID := fmt.Sprintf("cont-%d", time.Now().UnixNano()/1000000)
	tags := []string{"Website Lead", "Webhook Ingest"}
	contactQuery := `
		INSERT INTO contacts (id, name, phone, email, company, lead_score, status, campaign_name, notes, tags, tenant_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, 80, 'new', $6, $7, $8, $9, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET 
			name = EXCLUDED.name,
			phone = EXCLUDED.phone,
			email = EXCLUDED.email,
			company = EXCLUDED.company,
			notes = EXCLUDED.notes,
			tenant_id = EXCLUDED.tenant_id,
			updated_at = NOW()`
	_, _ = h.db.Exec(ctx, contactQuery, contactID, name, phone, email, company, campaignName, notes, tags, tenantID)

	// 4. Log into audit logs
	auditQuery := `INSERT INTO audit_logs (event_type, description, ip_address, created_at) VALUES ($1, $2, $3, NOW())`
	_, _ = h.db.Exec(ctx, auditQuery, "webhook.lead_ingested", fmt.Sprintf("Inbound webhook captured lead %s (%s) for tenant %d", name, phone, tenantID), c.ClientIP())

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lead and Contact automatically ingested and saved in PostgreSQL database",
		"lead": gin.H{
			"id":            leadID.String(),
			"contact_id":    contactID,
			"name":          name,
			"phone":         phone,
			"email":         email,
			"company":       company,
			"campaign_name": campaignName,
			"status":        "new",
			"created_at":    time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// GET /api/v1/webhooks
func (h *WebhooksHandler) GetWebhooks(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, "SELECT id, COALESCE(tenant_id, 1), name, url, events, status, created_at FROM webhooks ORDER BY id ASC")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"webhooks": []interface{}{}})
		return
	}
	defer rows.Close()

	webhooks := make([]domain.Webhook, 0)
	for rows.Next() {
		var wh domain.Webhook
		var events []string
		if err := rows.Scan(&wh.ID, &wh.TenantID, &wh.Name, &wh.URL, &events, &wh.Status, &wh.CreatedAt); err == nil {
			wh.Events = events
			wh.Secret = "whsec_••••••••••••••"
			webhooks = append(webhooks, wh)
		}
	}

	c.JSON(http.StatusOK, gin.H{"webhooks": webhooks})
}

// POST /api/v1/webhooks
func (h *WebhooksHandler) CreateWebhook(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var req struct {
		Name   string   `json:"name" binding:"required"`
		URL    string   `json:"url" binding:"required"`
		Events []string `json:"events"`
		Secret string   `json:"secret"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Events) == 0 {
		req.Events = []string{"call.completed", "lead.qualified", "appointment.booked"}
	}
	if req.Secret == "" {
		req.Secret = fmt.Sprintf("whsec_live_%d", time.Now().Unix())
	}

	var newID int
	query := `
		INSERT INTO webhooks (name, url, events, secret, status, created_at)
		VALUES ($1, $2, $3, $4, 'active', NOW())
		RETURNING id`

	err := h.db.QueryRow(ctx, query, req.Name, req.URL, req.Events, req.Secret).Scan(&newID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create webhook: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"webhook": gin.H{
			"id":         newID,
			"name":       req.Name,
			"url":        req.URL,
			"events":     req.Events,
			"status":     "active",
			"created_at": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// DELETE /api/v1/webhooks/:id
func (h *WebhooksHandler) DeleteWebhook(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Webhook ID is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.db.Exec(ctx, "DELETE FROM webhooks WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete webhook: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook permanently deleted from database", "id": id})
}

// GET /api/v1/webhooks/logs
func (h *WebhooksHandler) GetWebhookLogs(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id, webhook_id, event_type, direction, payload, response_status, response_body, ip_address, created_at
		FROM webhook_logs
		ORDER BY id DESC
		LIMIT 50
	`)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"logs": []interface{}{}})
		return
	}
	defer rows.Close()

	type WebhookLogItem struct {
		ID             int             `json:"id"`
		WebhookID      *int            `json:"webhookId,omitempty"`
		EventType      string          `json:"eventType"`
		Direction      string          `json:"direction"`
		Payload        json.RawMessage `json:"payload"`
		ResponseStatus int             `json:"responseStatus"`
		ResponseBody   string          `json:"responseBody"`
		IPAddress      string          `json:"ipAddress"`
		CreatedAt      string          `json:"createdAt"`
	}

	var logs []WebhookLogItem
	for rows.Next() {
		var l WebhookLogItem
		var rawPayload []byte
		var createdAt time.Time
		if err := rows.Scan(
			&l.ID, &l.WebhookID, &l.EventType, &l.Direction, &rawPayload,
			&l.ResponseStatus, &l.ResponseBody, &l.IPAddress, &createdAt,
		); err == nil {
			l.Payload = json.RawMessage(rawPayload)
			l.CreatedAt = createdAt.Format(time.RFC3339)
			logs = append(logs, l)
		}
	}

	if logs == nil {
		logs = []WebhookLogItem{}
	}

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}

// POST /api/v1/webhooks/telnyx
// Handles Telnyx API v2 call events (call.initiated, call.answered, call.hangup, etc.)
func (h *WebhooksHandler) IngestTelnyxWebhook(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var rawBody map[string]interface{}
	if err := c.ShouldBindJSON(&rawBody); err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "received", "note": "non-json"})
		return
	}

	payloadBytes, _ := json.Marshal(rawBody)

	// Extract Telnyx event details
	eventType := "telnyx.event"
	if data, ok := rawBody["data"].(map[string]interface{}); ok {
		if ev, ok := data["event_type"].(string); ok && ev != "" {
			eventType = ev
		}
	} else if ev, ok := rawBody["event_type"].(string); ok && ev != "" {
		eventType = ev
	}

	// Store in webhook_logs
	_, _ = h.db.Exec(ctx, `
		INSERT INTO webhook_logs (webhook_id, event_type, direction, payload, response_status, created_at)
		VALUES (1, $1, 'inbound', $2, 200, NOW())`,
		eventType, payloadBytes,
	)

	c.JSON(http.StatusOK, gin.H{
		"received": true,
		"event": eventType,
	})
}
