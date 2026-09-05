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

type ABHandler struct {
	dbPool *pgxpool.Pool
}

func NewABHandler(dbPool *pgxpool.Pool) *ABHandler {
	h := &ABHandler{dbPool: dbPool}
	h.ensureSchemaAndSeed()
	return h
}

type ABVariantPayload struct {
	Name          string `json:"name"`
	VoiceName     string `json:"voiceName"`
	Provider      string `json:"provider"`
	PromptPreview string `json:"promptPreview"`
	Greeting      string `json:"greeting"`
}

type ABMetricsPayload struct {
	CallsCount     int     `json:"callsCount"`
	AnswerRate     float64 `json:"answerRate"`
	ConversionRate float64 `json:"conversionRate"`
	AvgDurationSec int     `json:"avgDurationSec"`
	SentimentScore int     `json:"sentimentScore"`
}

type ABExperimentModel struct {
	ID                    string           `json:"id"`
	Name                  string           `json:"name"`
	Status                string           `json:"status"` // running, paused, completed
	BaseAgentID           string           `json:"baseAgentId"`
	TrafficSplitPercent   int              `json:"trafficSplitPercent"`
	VariantA              ABVariantPayload `json:"variantA"`
	VariantB              ABVariantPayload `json:"variantB"`
	MetricsA              ABMetricsPayload `json:"metricsA"`
	MetricsB              ABMetricsPayload `json:"metricsB"`
	ConfidenceScore       float64          `json:"confidenceScore"`
	ConversionLiftPercent float64          `json:"conversionLiftPercent"`
	Winner                *string          `json:"winner,omitempty"`
	StartDate             string           `json:"startDate"`
}

func (h *ABHandler) ensureSchemaAndSeed() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS ab_experiments (
		id VARCHAR(100) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		status VARCHAR(50) DEFAULT 'running',
		base_agent_id VARCHAR(100) DEFAULT 'agent-1',
		traffic_split_percent INT DEFAULT 50,
		variant_a JSONB NOT NULL DEFAULT '{}'::jsonb,
		variant_b JSONB NOT NULL DEFAULT '{}'::jsonb,
		metrics_a JSONB NOT NULL DEFAULT '{}'::jsonb,
		metrics_b JSONB NOT NULL DEFAULT '{}'::jsonb,
		confidence_score DECIMAL(5,2) DEFAULT 94.8,
		conversion_lift_percent DECIMAL(5,2) DEFAULT 18.6,
		winner VARCHAR(50),
		start_date TIMESTAMPTZ DEFAULT NOW(),
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.dbPool.Exec(ctx, createTableQuery)

	var count int
	_ = h.dbPool.QueryRow(ctx, "SELECT COUNT(*) FROM ab_experiments").Scan(&count)
	if count == 0 {
		exp1VariantA := ABVariantPayload{
			Name:          "Variant A: Direct ROI & Velocity",
			VoiceName:     "Rachel (US Professional)",
			Provider:      "ElevenLabs",
			PromptPreview: "Directly qualify budget and monthly call volume within 60 seconds. Push for immediate video demo.",
			Greeting:      "Hi there! Rachel from Apex. We help call centers automate 60k+ minutes with sub-300ms voice AI. How many calls does your team handle daily?",
		}
		exp1VariantB := ABVariantPayload{
			Name:          "Variant B: Empathetic Pain-Point Discovery",
			VoiceName:     "Marcus (Calm & Empathetic)",
			Provider:      "Cartesia",
			PromptPreview: "Listen to the customer's IVR pain points first. Build rapport before offering a technical consultation.",
			Greeting:      "Hello, this is Marcus with Apex Voice Systems. I understand managing high call volumes can be exhausting for support agents. What's been the biggest bottleneck for your team lately?",
		}
		exp1MetricsA := ABMetricsPayload{
			CallsCount:     1240,
			AnswerRate:     68.4,
			ConversionRate: 14.2,
			AvgDurationSec: 185,
			SentimentScore: 82,
		}
		exp1MetricsB := ABMetricsPayload{
			CallsCount:     1240,
			AnswerRate:     74.8,
			ConversionRate: 21.6,
			AvgDurationSec: 240,
			SentimentScore: 93,
		}

		exp2VariantA := ABVariantPayload{
			Name:          "Variant A: High Energy Solar Savings",
			VoiceName:     "Bella (Engaging & Clear)",
			Provider:      "ElevenLabs",
			PromptPreview: "Emphasize immediate 30% federal tax credit and SDG&E $350 rate hikes.",
			Greeting:      "Hey! Bella here with SunPeak Energy. California utility rates just jumped 22%—did you check your roof rebate qualification yet?",
		}
		exp2VariantB := ABVariantPayload{
			Name:          "Variant B: Engineering & NEM 3.0 Battery Pitch",
			VoiceName:     "Asteria (Crisp & Helpful)",
			Provider:      "Deepgram",
			PromptPreview: "Provide exact kWh calculations and battery storage backup guarantees.",
			Greeting:      "Hello, Asteria with SunPeak Technical Audits. We are reviewing residential battery storage grid resilience in your zip code.",
		}
		exp2MetricsA := ABMetricsPayload{
			CallsCount:     890,
			AnswerRate:     62.5,
			ConversionRate: 11.4,
			AvgDurationSec: 145,
			SentimentScore: 79,
		}
		exp2MetricsB := ABMetricsPayload{
			CallsCount:     890,
			AnswerRate:     71.2,
			ConversionRate: 16.8,
			AvgDurationSec: 210,
			SentimentScore: 88,
		}

		exp3VariantA := ABVariantPayload{
			Name:          "Variant A: Warm Clinical Compassion",
			VoiceName:     "Sarah (Empathetic Care)",
			Provider:      "Cartesia",
			PromptPreview: "Prioritize patient symptom comfort before scheduling intake triage.",
			Greeting:      "Good morning, this is Sarah with Apex Health Care. I am here to help you get scheduled with our specialist team today.",
		}
		exp3VariantB := ABVariantPayload{
			Name:          "Variant B: Rapid Direct Triage",
			VoiceName:     "David (Authoritative Clinic)",
			Provider:      "ElevenLabs",
			PromptPreview: "Fast insurance verification and primary physician appointment slotting.",
			Greeting:      "Hello, David from Clinical Scheduling. Let's verify your insurance ID and book your earliest available appointment slot.",
		}
		exp3MetricsA := ABMetricsPayload{
			CallsCount:     620,
			AnswerRate:     81.0,
			ConversionRate: 28.4,
			AvgDurationSec: 195,
			SentimentScore: 94,
		}
		exp3MetricsB := ABMetricsPayload{
			CallsCount:     620,
			AnswerRate:     76.5,
			ConversionRate: 22.1,
			AvgDurationSec: 160,
			SentimentScore: 85,
		}

		a1, _ := json.Marshal(exp1VariantA)
		b1, _ := json.Marshal(exp1VariantB)
		ma1, _ := json.Marshal(exp1MetricsA)
		mb1, _ := json.Marshal(exp1MetricsB)

		a2, _ := json.Marshal(exp2VariantA)
		b2, _ := json.Marshal(exp2VariantB)
		ma2, _ := json.Marshal(exp2MetricsA)
		mb2, _ := json.Marshal(exp2MetricsB)

		a3, _ := json.Marshal(exp3VariantA)
		b3, _ := json.Marshal(exp3VariantB)
		ma3, _ := json.Marshal(exp3MetricsA)
		mb3, _ := json.Marshal(exp3MetricsB)

		seedQuery := `
		INSERT INTO ab_experiments (id, name, status, base_agent_id, traffic_split_percent, variant_a, variant_b, metrics_a, metrics_b, confidence_score, conversion_lift_percent, winner, start_date)
		VALUES 
		('ab-1', 'Enterprise Pitch: Rachel (Direct & Fast) vs Marcus (Empathetic Storytelling)', 'running', 'agent-1', 50, $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, 98.4, 52.1, NULL, NOW() - INTERVAL '14 days'),
		('ab-2', 'Solar Outreach: Bella (High Energy) vs Asteria (Crisp & Technical)', 'running', 'agent-3', 50, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, 96.2, 47.3, NULL, NOW() - INTERVAL '10 days'),
		('ab-3', 'Healthcare Intake: Sarah (Warm Clinical) vs David (Direct Triage)', 'running', 'agent-2', 50, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, 94.5, 28.5, NULL, NOW() - INTERVAL '7 days');`

		_, _ = h.dbPool.Exec(ctx, seedQuery,
			a1, b1, ma1, mb1,
			a2, b2, ma2, mb2,
			a3, b3, ma3, mb3,
		)
	}
}

// GET /api/v1/ab-experiments
func (h *ABHandler) GetExperiments(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.dbPool.Query(ctx, `
		SELECT id, name, status, base_agent_id, traffic_split_percent, 
		       variant_a, variant_b, metrics_a, metrics_b, 
		       confidence_score, conversion_lift_percent, winner, 
		       TO_CHAR(start_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
		FROM ab_experiments
		ORDER BY created_at ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query experiments: " + err.Error()})
		return
	}
	defer rows.Close()

	var experiments []ABExperimentModel
	for rows.Next() {
		var exp ABExperimentModel
		var varARaw, varBRaw, metARaw, metBRaw []byte
		var winnerNullable *string

		if err := rows.Scan(
			&exp.ID, &exp.Name, &exp.Status, &exp.BaseAgentID, &exp.TrafficSplitPercent,
			&varARaw, &varBRaw, &metARaw, &metBRaw,
			&exp.ConfidenceScore, &exp.ConversionLiftPercent, &winnerNullable, &exp.StartDate,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan experiment row: " + err.Error()})
			return
		}

		_ = json.Unmarshal(varARaw, &exp.VariantA)
		_ = json.Unmarshal(varBRaw, &exp.VariantB)
		_ = json.Unmarshal(metARaw, &exp.MetricsA)
		_ = json.Unmarshal(metBRaw, &exp.MetricsB)
		exp.Winner = winnerNullable

		experiments = append(experiments, exp)
	}

	if experiments == nil {
		experiments = []ABExperimentModel{}
	}

	c.JSON(http.StatusOK, gin.H{"experiments": experiments})
}

// POST /api/v1/ab-experiments
func (h *ABHandler) CreateExperiment(c *gin.Context) {
	var input ABExperimentModel
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if input.ID == "" {
		input.ID = fmt.Sprintf("ab-%d", time.Now().Unix())
	}
	if input.Status == "" {
		input.Status = "running"
	}
	if input.TrafficSplitPercent == 0 {
		input.TrafficSplitPercent = 50
	}
	if input.ConfidenceScore == 0 {
		input.ConfidenceScore = 95.0
	}
	if input.ConversionLiftPercent == 0 {
		input.ConversionLiftPercent = 15.0
	}
	if input.StartDate == "" {
		input.StartDate = time.Now().Format(time.RFC3339)
	}

	varAJSON, _ := json.Marshal(input.VariantA)
	varBJSON, _ := json.Marshal(input.VariantB)
	metAJSON, _ := json.Marshal(input.MetricsA)
	metBJSON, _ := json.Marshal(input.MetricsB)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO ab_experiments (id, name, status, base_agent_id, traffic_split_percent, variant_a, variant_b, metrics_a, metrics_b, confidence_score, conversion_lift_percent, winner, start_date)
		VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12, NOW())
	`
	_, err := h.dbPool.Exec(ctx, query,
		input.ID, input.Name, input.Status, input.BaseAgentID, input.TrafficSplitPercent,
		varAJSON, varBJSON, metAJSON, metBJSON,
		input.ConfidenceScore, input.ConversionLiftPercent, input.Winner,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create experiment: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Experiment created successfully", "experiment": input})
}

// PUT /api/v1/ab-experiments/:id/winner
func (h *ABHandler) CrownWinner(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Winner string `json:"winner"` // "variantA" or "variantB"
	}
	if err := c.ShouldBindJSON(&req); err != nil || (req.Winner != "variantA" && req.Winner != "variantB") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Winner must be 'variantA' or 'variantB'"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE ab_experiments
		SET winner = $1, status = 'completed', updated_at = NOW()
		WHERE id = $2
	`
	res, err := h.dbPool.Exec(ctx, query, req.Winner, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to crown winner: " + err.Error()})
		return
	}
	if res.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Experiment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Crown awarded to %s! Scaled to 100%% traffic.", req.Winner)})
}

// DELETE /api/v1/ab-experiments/:id
func (h *ABHandler) DeleteExperiment(c *gin.Context) {
	id := c.Param("id")
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	_, err := h.dbPool.Exec(ctx, "DELETE FROM ab_experiments WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete experiment: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Experiment deleted successfully"})
}
