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

type KnowledgeHandler struct {
	db *pgxpool.Pool
}

func NewKnowledgeHandler(db *pgxpool.Pool) *KnowledgeHandler {
	h := &KnowledgeHandler{db: db}
	h.ensureSchemaAndSeed()
	return h
}

func (h *KnowledgeHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	createTableQuery := `
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
	);`
	_, _ = h.db.Exec(ctx, createTableQuery)

	// Check if table is empty, if so seed default enterprise sources
	var count int
	_ = h.db.QueryRow(ctx, "SELECT COUNT(*) FROM knowledge_base").Scan(&count)
	if count == 0 {
		seedQuery := `
		INSERT INTO knowledge_base (id, name, type, status, chunk_count, size_kb, last_indexed, assigned_agent_ids, url, content_preview, chunks, created_at, updated_at)
		VALUES 
		('kb-enterprise-faq', 'Apex Enterprise Architecture & Security FAQ 2026.pdf', 'document', 'indexed', 48, 850, NOW(),
		 '["agent-solar-1", "agent-sdr-2", "agent-cs-3"]'::jsonb, NULL,
		 'SOC2 Type II compliance: Apex Voice Systems undergoes annual third-party audits. All audio frames are processed in-memory with zero persistent audio storage unless HIPAA encrypted recording is explicitly enabled.',
		 '[{"id": "chk-1", "text": "SOC2 Type II compliance: Apex Voice Systems undergoes annual third-party audits.", "tokenCount": 35, "similarityScore": 0.96}, {"id": "chk-2", "text": "Edge speech recognition + LLM streaming achieves sub-280ms round-trip latency.", "tokenCount": 42, "similarityScore": 0.92}]'::jsonb,
		 NOW(), NOW()),
		('kb-pricing-2026', 'Apex Pricing, Tier Matrix & Volume Discounts.xlsx', 'document', 'indexed', 32, 420, NOW(),
		 '["agent-solar-1", "agent-sdr-2"]'::jsonb, NULL,
		 'Enterprise volume discount: Accounts processing above 50,000 minutes per month qualify for Tier 3 pricing at $0.08 per minute with dedicated SIP trunking.',
		 '[{"id": "chk-3", "text": "Volume discount: Accounts processing above 50,000 minutes qualify for Tier 3.", "tokenCount": 30, "similarityScore": 0.88}]'::jsonb,
		 NOW(), NOW()),
		('kb-support-returns', 'Customer Support & Order Return Policies.pdf', 'faq', 'indexed', 24, 310, NOW(),
		 '["agent-cs-3"]'::jsonb, 'https://apexvoice.ai/docs/returns',
		 'Return & refund window: 30 days money-back guarantee on hardware units. Software licenses refundable within 14 days of activation.',
		 '[{"id": "chk-4", "text": "30-day money back guarantee on hardware units.", "tokenCount": 25, "similarityScore": 0.94}]'::jsonb,
		 NOW(), NOW());`
		_, _ = h.db.Exec(ctx, seedQuery)
	}
}

type KnowledgeSourcePayload struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	Type             string          `json:"type"`
	Status           string          `json:"status"`
	ChunkCount       int             `json:"chunkCount"`
	SizeKB           int             `json:"sizeKb"`
	LastIndexed      time.Time       `json:"lastIndexed"`
	AssignedAgentIDs json.RawMessage `json:"assignedAgentIds"`
	URL              *string         `json:"url,omitempty"`
	ContentPreview   string          `json:"contentPreview"`
	Chunks           json.RawMessage `json:"chunks"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

// GET /api/v1/knowledge
func (h *KnowledgeHandler) ListKnowledgeSources(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, name, type, status, chunk_count, size_kb, last_indexed, assigned_agent_ids, url, content_preview, chunks, created_at, updated_at
		FROM knowledge_base
		WHERE tenant_id = $1 OR tenant_id IS NULL OR tenant_id = 0
		ORDER BY created_at DESC
	`, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query knowledge sources: " + err.Error()})
		return
	}
	defer rows.Close()

	var sources []KnowledgeSourcePayload
	for rows.Next() {
		var s KnowledgeSourcePayload
		var assignedRaw, chunksRaw []byte
		var urlVal *string

		if err := rows.Scan(
			&s.ID, &s.Name, &s.Type, &s.Status, &s.ChunkCount, &s.SizeKB, &s.LastIndexed,
			&assignedRaw, &urlVal, &s.ContentPreview, &chunksRaw, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan knowledge source row: " + err.Error()})
			return
		}

		s.URL = urlVal
		if len(assignedRaw) > 0 {
			s.AssignedAgentIDs = json.RawMessage(assignedRaw)
		} else {
			s.AssignedAgentIDs = json.RawMessage("[]")
		}

		if len(chunksRaw) > 0 {
			s.Chunks = json.RawMessage(chunksRaw)
		} else {
			s.Chunks = json.RawMessage("[]")
		}

		sources = append(sources, s)
	}

	if sources == nil {
		sources = []KnowledgeSourcePayload{}
	}

	c.JSON(http.StatusOK, gin.H{"knowledgeSources": sources})
}

// GET /api/v1/knowledge/:id
func (h *KnowledgeHandler) GetKnowledgeSource(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	var s KnowledgeSourcePayload
	var assignedRaw, chunksRaw []byte
	var urlVal *string

	err := h.db.QueryRow(ctx, `
		SELECT id, name, type, status, chunk_count, size_kb, last_indexed, assigned_agent_ids, url, content_preview, chunks, created_at, updated_at
		FROM knowledge_base
		WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL OR tenant_id = 0)
	`, id, tenantID).Scan(
		&s.ID, &s.Name, &s.Type, &s.Status, &s.ChunkCount, &s.SizeKB, &s.LastIndexed,
		&assignedRaw, &urlVal, &s.ContentPreview, &chunksRaw, &s.CreatedAt, &s.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Knowledge source not found or unauthorized"})
		return
	}

	s.URL = urlVal
	if len(assignedRaw) > 0 {
		s.AssignedAgentIDs = json.RawMessage(assignedRaw)
	} else {
		s.AssignedAgentIDs = json.RawMessage("[]")
	}

	if len(chunksRaw) > 0 {
		s.Chunks = json.RawMessage(chunksRaw)
	} else {
		s.Chunks = json.RawMessage("[]")
	}

	c.JSON(http.StatusOK, gin.H{"knowledgeSource": s})
}

// POST /api/v1/knowledge
func (h *KnowledgeHandler) CreateKnowledgeSource(c *gin.Context) {
	var input KnowledgeSourcePayload
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	if input.ID == "" {
		input.ID = fmt.Sprintf("kb-%d", time.Now().UnixNano())
	}
	if input.Type == "" {
		input.Type = "document"
	}
	if input.Status == "" {
		input.Status = "indexed"
	}
	if input.LastIndexed.IsZero() {
		input.LastIndexed = time.Now()
	}
	if len(input.AssignedAgentIDs) == 0 {
		input.AssignedAgentIDs = json.RawMessage("[]")
	}
	if len(input.Chunks) == 0 {
		input.Chunks = json.RawMessage("[]")
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO knowledge_base (id, name, type, status, chunk_count, size_kb, last_indexed, assigned_agent_ids, url, content_preview, chunks, tenant_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			status = EXCLUDED.status,
			chunk_count = EXCLUDED.chunk_count,
			size_kb = EXCLUDED.size_kb,
			last_indexed = EXCLUDED.last_indexed,
			assigned_agent_ids = EXCLUDED.assigned_agent_ids,
			url = EXCLUDED.url,
			content_preview = EXCLUDED.content_preview,
			chunks = EXCLUDED.chunks,
			tenant_id = EXCLUDED.tenant_id,
			updated_at = NOW()
		RETURNING created_at, updated_at;
	`

	err := h.db.QueryRow(ctx, query,
		input.ID, input.Name, input.Type, input.Status, input.ChunkCount, input.SizeKB,
		input.LastIndexed, string(input.AssignedAgentIDs), input.URL, input.ContentPreview, string(input.Chunks), tenantID,
	).Scan(&input.CreatedAt, &input.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save knowledge source: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"knowledgeSource": input})
}

// PUT /api/v1/knowledge/:id
func (h *KnowledgeHandler) UpdateKnowledgeSource(c *gin.Context) {
	id := c.Param("id")
	var input KnowledgeSourcePayload
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE knowledge_base SET
			name = $2,
			type = $3,
			status = $4,
			chunk_count = $5,
			size_kb = $6,
			last_indexed = NOW(),
			assigned_agent_ids = $7,
			url = $8,
			content_preview = $9,
			chunks = $10,
			updated_at = NOW()
		WHERE id = $1 AND (tenant_id = $11 OR tenant_id IS NULL OR tenant_id = 0)
		RETURNING created_at, updated_at;
	`

	err := h.db.QueryRow(ctx, query,
		id, input.Name, input.Type, input.Status, input.ChunkCount, input.SizeKB,
		string(input.AssignedAgentIDs), input.URL, input.ContentPreview, string(input.Chunks), tenantID,
	).Scan(&input.CreatedAt, &input.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Failed to update knowledge source or unauthorized"})
		return
	}

	input.ID = id
	c.JSON(http.StatusOK, gin.H{"knowledgeSource": input})
}

// DELETE /api/v1/knowledge/:id
func (h *KnowledgeHandler) DeleteKnowledgeSource(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	tenantID := c.GetInt("tenantID")
	if tenantID <= 0 {
		tenantID = 1
	}

	_, err := h.db.Exec(ctx, "DELETE FROM knowledge_base WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL OR tenant_id = 0)", id, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete knowledge source: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Knowledge source deleted successfully", "id": id})
}
