package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsHandler struct {
	dbPool *pgxpool.Pool
}

func NewAnalyticsHandler(dbPool *pgxpool.Pool) *AnalyticsHandler {
	h := &AnalyticsHandler{dbPool: dbPool}
	h.ensureSchemaAndSeed()
	return h
}

func (h *AnalyticsHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Ensure conversation_funnel_steps table
	funnelTableQuery := `
	CREATE TABLE IF NOT EXISTS conversation_funnel_steps (
		id VARCHAR(100) PRIMARY KEY,
		step_number INT NOT NULL,
		step_name VARCHAR(255) NOT NULL,
		node_type VARCHAR(50) DEFAULT 'greeting',
		visitors_count INT DEFAULT 0,
		completed_count INT DEFAULT 0,
		drop_off_rate_percent DECIMAL(5,2) DEFAULT 0.0,
		drop_off_reason TEXT,
		ai_optimization_tip TEXT,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.dbPool.Exec(ctx, funnelTableQuery)

	// 2. Ensure analytics_overview table
	overviewTableQuery := `
	CREATE TABLE IF NOT EXISTS analytics_overview (
		id VARCHAR(100) PRIMARY KEY,
		time_range VARCHAR(20) DEFAULT '30d',
		conversation_success DECIMAL(5,2) DEFAULT 88.4,
		avg_resolution_cost DECIMAL(6,2) DEFAULT 0.42,
		p50_latency_ms INT DEFAULT 280,
		funnel_retention DECIMAL(5,2) DEFAULT 74.5,
		dialog_runs_analyzed INT DEFAULT 14280,
		hourly_volume JSONB DEFAULT '[]'::jsonb,
		call_outcomes JSONB DEFAULT '[]'::jsonb,
		latency_percentiles JSONB DEFAULT '[]'::jsonb,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.dbPool.Exec(ctx, overviewTableQuery)

	// Seed Funnel Steps if empty
	var funnelCount int
	_ = h.dbPool.QueryRow(ctx, "SELECT COUNT(*) FROM conversation_funnel_steps").Scan(&funnelCount)
	if funnelCount == 0 {
		seedFunnel := `
		INSERT INTO conversation_funnel_steps (id, step_number, step_name, node_type, visitors_count, completed_count, drop_off_rate_percent, drop_off_reason, ai_optimization_tip, created_at, updated_at)
		VALUES 
		('step-1', 1, 'Greeting & Brand Introduction', 'greeting', 14280, 13137, 8.0, 'Long intro greetings cause premature hang-ups.', 'Keep greeting under 12 words. Introduce agent within the first 1.5 seconds.', NOW(), NOW()),
		('step-2', 2, 'Core Intent / Problem Discovery', 'question', 13137, 11560, 12.0, 'Closed yes/no questions cause conversational dead-ends.', 'Use open-ended empathy phrasing: "What has been the biggest challenge for your queue?"', NOW(), NOW()),
		('step-3', 3, 'Call Volume & Tech Stack Qualification', 'collect_info', 11560, 9479, 18.0, 'Asking budget before value proposition spikes friction.', 'State starting pricing ($0.08/min) BEFORE asking for monthly minutes.', NOW(), NOW()),
		('step-4', 4, 'Knowledge Base & Security SLA Match', 'knowledge_lookup', 9479, 8341, 12.0, 'Extended RAG latency on SOC2 compliance queries.', 'Pre-fetch compliance certificate highlights automatically into first response.', NOW(), NOW()),
		('step-5', 5, 'Calendar Demo Proposal & Slot Reservation', 'appointment', 8341, 7173, 14.0, 'Rigid time proposal forces customer rescheduling.', 'Offer flexible morning vs afternoon options rather than a single rigid time slot.', NOW(), NOW()),
		('step-6', 6, 'SMS Confirmation & Graceful Closing', 'end_call', 7173, 6886, 4.0, 'Premature disconnect before Twilio SMS API acknowledgment.', 'Dispatch SMS confirmation payload asynchronously before goodbye phrase.', NOW(), NOW());`
		_, _ = h.dbPool.Exec(ctx, seedFunnel)
	}

	// Seed Analytics Overview if empty
	var overviewCount int
	_ = h.dbPool.QueryRow(ctx, "SELECT COUNT(*) FROM analytics_overview").Scan(&overviewCount)
	if overviewCount == 0 {
		hourlyVolumeJSON := `[
			{"hour": "08:00", "inbound": 140, "outbound": 210, "qualified": 85},
			{"hour": "09:00", "inbound": 320, "outbound": 450, "qualified": 180},
			{"hour": "10:00", "inbound": 580, "outbound": 720, "qualified": 340},
			{"hour": "11:00", "inbound": 640, "outbound": 810, "qualified": 410},
			{"hour": "12:00", "inbound": 480, "outbound": 590, "qualified": 290},
			{"hour": "13:00", "inbound": 510, "outbound": 650, "qualified": 320},
			{"hour": "14:00", "inbound": 690, "outbound": 880, "qualified": 450},
			{"hour": "15:00", "inbound": 620, "outbound": 790, "qualified": 390},
			{"hour": "16:00", "inbound": 440, "outbound": 610, "qualified": 280},
			{"hour": "17:00", "inbound": 290, "outbound": 380, "qualified": 160},
			{"hour": "18:00", "inbound": 150, "outbound": 190, "qualified": 75}
		]`

		outcomesJSON := `[
			{"name": "Goal Completed", "value": 6886},
			{"name": "Transferred to Human", "value": 1840},
			{"name": "Voicemail Left", "value": 3120},
			{"name": "Callback Requested", "value": 1420},
			{"name": "Dropped / No Answer", "value": 1014}
		]`

		latencyJSON := `[
			{"name": "Edge ASR (Deepgram)", "p50": 65, "p90": 95, "p99": 140},
			{"name": "LLM First Token (GPT-4o)", "p50": 115, "p90": 165, "p99": 240},
			{"name": "TTS Audio Chunk (Cartesia)", "p50": 45, "p90": 70, "p99": 110},
			{"name": "SIP Gateway Roundtrip", "p50": 55, "p90": 80, "p99": 115}
		]`

		seedOverview := `
		INSERT INTO analytics_overview (id, time_range, conversation_success, avg_resolution_cost, p50_latency_ms, funnel_retention, dialog_runs_analyzed, hourly_volume, call_outcomes, latency_percentiles, created_at, updated_at)
		VALUES 
		('overview-30d', '30d', 88.4, 0.42, 280, 74.5, 14280, $1::jsonb, $2::jsonb, $3::jsonb, NOW(), NOW()),
		('overview-7d', '7d', 91.2, 0.38, 275, 78.1, 3840, $1::jsonb, $2::jsonb, $3::jsonb, NOW(), NOW()),
		('overview-90d', '90d', 86.8, 0.45, 290, 71.9, 42950, $1::jsonb, $2::jsonb, $3::jsonb, NOW(), NOW());`
		_, _ = h.dbPool.Exec(ctx, seedOverview, hourlyVolumeJSON, outcomesJSON, latencyJSON)
	}
}

type FunnelStepPayload struct {
	ID                 string  `json:"id"`
	StepNumber         int     `json:"stepNumber"`
	StepName           string  `json:"stepName"`
	NodeType           string  `json:"nodeType"`
	VisitorsCount      int     `json:"visitorsCount"`
	CompletedCount     int     `json:"completedCount"`
	DropOffRatePercent float64 `json:"dropOffRatePercent"`
	DropOffReason      string  `json:"dropOffReason"`
	AiOptimizationTip  string  `json:"aiOptimizationTip"`
}

type AnalyticsOverviewPayload struct {
	ID                  string          `json:"id"`
	TimeRange           string          `json:"timeRange"`
	ConversationSuccess float64         `json:"conversationSuccess"`
	AvgResolutionCost   float64         `json:"avgResolutionCost"`
	P50LatencyMs        int             `json:"p50LatencyMs"`
	FunnelRetention     float64         `json:"funnelRetention"`
	DialogRunsAnalyzed  int             `json:"dialogRunsAnalyzed"`
	HourlyVolume        json.RawMessage `json:"hourlyVolume"`
	CallOutcomes        json.RawMessage `json:"callOutcomes"`
	LatencyPercentiles  json.RawMessage `json:"latencyPercentiles"`
}

// GET /api/v1/analytics/overview
func (h *AnalyticsHandler) GetOverview(c *gin.Context) {
	timeRange := c.DefaultQuery("range", "30d")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var o AnalyticsOverviewPayload
	var hourlyRaw, outcomesRaw, latencyRaw []byte

	query := `
		SELECT id, time_range, conversation_success, avg_resolution_cost, p50_latency_ms, funnel_retention, dialog_runs_analyzed, hourly_volume, call_outcomes, latency_percentiles
		FROM analytics_overview
		WHERE time_range = $1
		LIMIT 1
	`
	err := h.dbPool.QueryRow(ctx, query, timeRange).Scan(
		&o.ID, &o.TimeRange, &o.ConversationSuccess, &o.AvgResolutionCost, &o.P50LatencyMs,
		&o.FunnelRetention, &o.DialogRunsAnalyzed, &hourlyRaw, &outcomesRaw, &latencyRaw,
	)

	if err != nil {
		// Fallback to 30d
		err = h.dbPool.QueryRow(ctx, `
			SELECT id, time_range, conversation_success, avg_resolution_cost, p50_latency_ms, funnel_retention, dialog_runs_analyzed, hourly_volume, call_outcomes, latency_percentiles
			FROM analytics_overview
			LIMIT 1
		`).Scan(
			&o.ID, &o.TimeRange, &o.ConversationSuccess, &o.AvgResolutionCost, &o.P50LatencyMs,
			&o.FunnelRetention, &o.DialogRunsAnalyzed, &hourlyRaw, &outcomesRaw, &latencyRaw,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics overview: " + err.Error()})
			return
		}
	}

	o.HourlyVolume = json.RawMessage(hourlyRaw)
	o.CallOutcomes = json.RawMessage(outcomesRaw)
	o.LatencyPercentiles = json.RawMessage(latencyRaw)

	c.JSON(http.StatusOK, gin.H{"overview": o})
}

// GET /api/v1/analytics/funnel
func (h *AnalyticsHandler) GetFunnelSteps(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.dbPool.Query(ctx, `
		SELECT id, step_number, step_name, node_type, visitors_count, completed_count, drop_off_rate_percent, drop_off_reason, ai_optimization_tip
		FROM conversation_funnel_steps
		ORDER BY step_number ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query funnel steps: " + err.Error()})
		return
	}
	defer rows.Close()

	var steps []FunnelStepPayload
	for rows.Next() {
		var s FunnelStepPayload
		if err := rows.Scan(
			&s.ID, &s.StepNumber, &s.StepName, &s.NodeType, &s.VisitorsCount,
			&s.CompletedCount, &s.DropOffRatePercent, &s.DropOffReason, &s.AiOptimizationTip,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan funnel step: " + err.Error()})
			return
		}
		steps = append(steps, s)
	}

	if steps == nil {
		steps = []FunnelStepPayload{}
	}

	c.JSON(http.StatusOK, gin.H{"funnelSteps": steps})
}

// POST /api/v1/analytics/funnel/update-step
func (h *AnalyticsHandler) UpdateFunnelStep(c *gin.Context) {
	var input FunnelStepPayload
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE conversation_funnel_steps SET
			step_name = $2,
			node_type = $3,
			visitors_count = $4,
			completed_count = $5,
			drop_off_rate_percent = $6,
			drop_off_reason = $7,
			ai_optimization_tip = $8,
			updated_at = NOW()
		WHERE id = $1
	`
	_, err := h.dbPool.Exec(ctx, query,
		input.ID, input.StepName, input.NodeType, input.VisitorsCount,
		input.CompletedCount, input.DropOffRatePercent, input.DropOffReason, input.AiOptimizationTip,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update funnel step: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Funnel step updated successfully", "step": input})
}

type DailyCallMetric struct {
	Date           string  `json:"date"`
	TotalCalls     int     `json:"total_calls"`
	Completed      int     `json:"completed_calls"`
	Failed         int     `json:"failed_calls"`
	AvgDurationSec float64 `json:"avg_duration_seconds"`
}

type DailyLeadMetric struct {
	Date            string `json:"date"`
	TotalLeads      int    `json:"total_leads"`
	InterestedLeads int    `json:"interested_leads"`
}

// GET /api/v1/analytics/daily
func (h *AnalyticsHandler) GetDailyAnalytics(c *gin.Context) {
	ctx := c.Request.Context()
	campaignID := c.Query("campaign_id")

	callQuery := `
		SELECT 
			TO_CHAR(DATE(cr.created_at), 'YYYY-MM-DD') AS date,
			COUNT(*) AS total_calls,
			COUNT(*) FILTER (WHERE cr.status = 'completed') AS completed_calls,
			COUNT(*) FILTER (WHERE cr.status = 'failed') AS failed_calls,
			COALESCE(AVG(cr.duration), 0) AS avg_duration
		FROM call_records cr
		LEFT JOIN leads l ON cr.lead_id = l.id
		WHERE ($1 = '' OR l.campaign_id::text = $1)
		GROUP BY DATE(cr.created_at)
		ORDER BY DATE(cr.created_at) DESC
		LIMIT 30`

	rows, err := h.dbPool.Query(ctx, callQuery, campaignID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch call analytics: " + err.Error()})
		return
	}
	defer rows.Close()

	var callMetrics []DailyCallMetric
	for rows.Next() {
		var m DailyCallMetric
		if err := rows.Scan(&m.Date, &m.TotalCalls, &m.Completed, &m.Failed, &m.AvgDurationSec); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Row scan error: " + err.Error()})
			return
		}
		callMetrics = append(callMetrics, m)
	}

	if callMetrics == nil {
		callMetrics = []DailyCallMetric{}
	}

	leadQuery := `
		SELECT 
			TO_CHAR(DATE(created_at), 'YYYY-MM-DD') AS date,
			COUNT(*) AS total_leads,
			COUNT(*) FILTER (WHERE status = 'interested') AS interested_leads
		FROM leads
		WHERE ($1 = '' OR campaign_id::text = $1)
		GROUP BY DATE(created_at)
		ORDER BY DATE(created_at) DESC
		LIMIT 30`

	leadRows, err := h.dbPool.Query(ctx, leadQuery, campaignID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lead analytics: " + err.Error()})
		return
	}
	defer leadRows.Close()

	var leadMetrics []DailyLeadMetric
	for leadRows.Next() {
		var lm DailyLeadMetric
		if err := leadRows.Scan(&lm.Date, &lm.TotalLeads, &lm.InterestedLeads); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Row scan error: " + err.Error()})
			return
		}
		leadMetrics = append(leadMetrics, lm)
	}

	if leadMetrics == nil {
		leadMetrics = []DailyLeadMetric{}
	}

	c.JSON(http.StatusOK, gin.H{
		"call_analytics": callMetrics,
		"lead_analytics": leadMetrics,
	})
}
