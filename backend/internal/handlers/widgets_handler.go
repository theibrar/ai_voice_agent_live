package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WidgetsHandler struct {
	db *pgxpool.Pool
}

func NewWidgetsHandler(db *pgxpool.Pool) *WidgetsHandler {
	h := &WidgetsHandler{db: db}
	h.ensureSchema()
	return h
}

func (h *WidgetsHandler) ensureSchema() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
	CREATE TABLE IF NOT EXISTS website_widgets (
		id VARCHAR(100) PRIMARY KEY,
		tenant_id INT,
		name VARCHAR(255) NOT NULL,
		agent_id VARCHAR(100),
		agent_name VARCHAR(255) DEFAULT 'Marcus (Solar Advisor)',
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
	`
	_, _ = h.db.Exec(ctx, query)
}

type WebsiteWidgetDTO struct {
	ID                   string   `json:"id"`
	Name                 string   `json:"name"`
	AgentID              string   `json:"agentId"`
	AgentName            string   `json:"agentName"`
	AllowedDomains       []string `json:"allowedDomains"`
	BusinessHoursEnabled bool     `json:"businessHoursEnabled"`
	PrimaryColor         string   `json:"primaryColor"`
	ButtonLabel          string   `json:"buttonLabel"`
	Position             string   `json:"position"`
	AvatarLabel          string   `json:"avatarLabel"`
	GreetingText         string   `json:"greetingText"`
	Status               string   `json:"status"`
	CreatedAt            string   `json:"createdAt"`
}

// GET /api/v1/widgets
func (h *WidgetsHandler) GetWidgets(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, `
		SELECT id, name, COALESCE(agent_id, ''), COALESCE(agent_name, 'Marcus (Solar Advisor)'),
		       COALESCE(allowed_domains, '{}'), business_hours_enabled, COALESCE(primary_color, '#172033'),
		       COALESCE(button_label, 'VOICE CHAT'), COALESCE(position, 'bottom-right'),
		       COALESCE(avatar_label, 'Agent AI'), COALESCE(greeting_text, ''),
		       COALESCE(status, 'active'), created_at
		FROM website_widgets
		ORDER BY created_at DESC LIMIT 50`)

	if err != nil {
		c.JSON(http.StatusOK, gin.H{"widgets": []WebsiteWidgetDTO{}})
		return
	}
	defer rows.Close()

	widgets := make([]WebsiteWidgetDTO, 0)
	for rows.Next() {
		var w WebsiteWidgetDTO
		var createdAt time.Time
		if err := rows.Scan(
			&w.ID, &w.Name, &w.AgentID, &w.AgentName, &w.AllowedDomains, &w.BusinessHoursEnabled,
			&w.PrimaryColor, &w.ButtonLabel, &w.Position, &w.AvatarLabel, &w.GreetingText,
			&w.Status, &createdAt,
		); err == nil {
			w.CreatedAt = createdAt.Format("2006-01-02")
			widgets = append(widgets, w)
		}
	}

	c.JSON(http.StatusOK, gin.H{"widgets": widgets})
}

// POST /api/v1/widgets
func (h *WidgetsHandler) CreateWidget(c *gin.Context) {
	var payload WebsiteWidgetDTO
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	if payload.ID == "" {
		payload.ID = fmt.Sprintf("widget-%d", time.Now().UnixNano()/1e6)
	}
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.PrimaryColor == "" {
		payload.PrimaryColor = "#172033"
	}
	if payload.ButtonLabel == "" {
		payload.ButtonLabel = "VOICE CHAT"
	}
	if payload.Position == "" {
		payload.Position = "bottom-right"
	}
	if payload.AvatarLabel == "" {
		payload.AvatarLabel = "Agent AI"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.db.Exec(ctx, `
		INSERT INTO website_widgets (
			id, name, agent_id, agent_name, allowed_domains, business_hours_enabled,
			primary_color, button_label, position, avatar_label, greeting_text, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			agent_id = EXCLUDED.agent_id,
			agent_name = EXCLUDED.agent_name,
			allowed_domains = EXCLUDED.allowed_domains,
			business_hours_enabled = EXCLUDED.business_hours_enabled,
			primary_color = EXCLUDED.primary_color,
			button_label = EXCLUDED.button_label,
			position = EXCLUDED.position,
			avatar_label = EXCLUDED.avatar_label,
			greeting_text = EXCLUDED.greeting_text,
			status = EXCLUDED.status
	`, payload.ID, payload.Name, payload.AgentID, payload.AgentName, payload.AllowedDomains,
		payload.BusinessHoursEnabled, payload.PrimaryColor, payload.ButtonLabel, payload.Position,
		payload.AvatarLabel, payload.GreetingText, payload.Status)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save widget to database: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Website widget stored in database successfully",
		"widget":  payload,
	})
}

// DELETE /api/v1/widgets/:id
func (h *WidgetsHandler) DeleteWidget(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.db.Exec(ctx, `DELETE FROM website_widgets WHERE id = $1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete widget: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Website widget deleted successfully from database"})
}
