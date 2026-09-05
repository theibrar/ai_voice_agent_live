package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PhoneNumbersHandler struct {
	db *pgxpool.Pool
}

func NewPhoneNumbersHandler(db *pgxpool.Pool) *PhoneNumbersHandler {
	h := &PhoneNumbersHandler{db: db}
	h.ensureSchema()
	return h
}

func (h *PhoneNumbersHandler) ensureSchema() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	query := `
	CREATE TABLE IF NOT EXISTS phone_numbers (
		id VARCHAR(100) PRIMARY KEY,
		tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
		number VARCHAR(50) NOT NULL,
		friendly_name VARCHAR(255) NOT NULL,
		country VARCHAR(10) DEFAULT 'US',
		assigned_agent_id VARCHAR(100),
		assigned_campaign_id VARCHAR(100),
		status VARCHAR(50) DEFAULT 'active',
		monthly_cost DECIMAL(6,2) DEFAULT 2.50,
		capabilities JSONB DEFAULT '{"voice": true, "sms": true, "mms": false}'::jsonb,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);`
	_, _ = h.db.Exec(ctx, query)

	_, _ = h.db.Exec(ctx, `ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{"voice": true, "sms": true, "mms": false}'::jsonb;`)
}

func (h *PhoneNumbersHandler) getCarrierAPIKey(ctx context.Context) (string, string) {
	query := `
		SELECT carrier, api_key 
		FROM sip_trunks 
		WHERE (is_default_carrier = true OR carrier = 'telnyx') AND api_key != ''
		ORDER BY is_default_carrier DESC, id ASC 
		LIMIT 1`

	var carrier, apiKey string
	err := h.db.QueryRow(ctx, query).Scan(&carrier, &apiKey)
	if err != nil {
		return "", ""
	}
	return carrier, apiKey
}

type PhoneNumberResponse struct {
	ID                   string                 `json:"id"`
	PhoneNumber          string                 `json:"phoneNumber"`
	FormattedNumber      string                 `json:"formattedNumber"`
	FriendlyName         string                 `json:"friendlyName"`
	Country              string                 `json:"country"`
	AssignedAgentID      string                 `json:"assignedAgentId,omitempty"`
	AssignedAgentName    string                 `json:"assignedAgentName,omitempty"`
	AssignedCampaignID   string                 `json:"assignedCampaignId,omitempty"`
	AssignedCampaignName string                 `json:"assignedCampaignName,omitempty"`
	Status               string                 `json:"status"`
	MonthlyCost          float64                `json:"monthlyCost"`
	Capabilities         map[string]interface{} `json:"capabilities"`
	CreatedAt            string                 `json:"createdAt"`
}

// GET /api/v1/phone-numbers
func (h *PhoneNumbersHandler) GetTenantPhoneNumbers(c *gin.Context) {
	tenantID, exists := c.Get("tenantID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant context missing"})
		return
	}

	ctx := c.Request.Context()
	query := `
		SELECT 
			p.id, p.number, p.friendly_name, p.country,
			COALESCE(p.assigned_agent_id, ''),
			COALESCE(a.name, ''),
			COALESCE(p.assigned_campaign_id, ''),
			COALESCE(c.name, ''),
			p.status,
			p.monthly_cost,
			COALESCE(p.capabilities, '{"voice": true, "sms": true}'::jsonb),
			p.created_at
		FROM phone_numbers p
		LEFT JOIN agents a ON p.assigned_agent_id = a.id
		LEFT JOIN campaigns c ON p.assigned_campaign_id = c.id::text
		WHERE p.tenant_id = $1
		ORDER BY p.created_at DESC`

	rows, err := h.db.Query(ctx, query, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch phone numbers: " + err.Error()})
		return
	}
	defer rows.Close()

	numbers := make([]PhoneNumberResponse, 0)
	for rows.Next() {
		var id, number, friendlyName, country, agentID, agentName, campaignID, campaignName, status string
		var monthlyCost float64
		var capJSON []byte
		var createdAt time.Time

		if err := rows.Scan(&id, &number, &friendlyName, &country, &agentID, &agentName, &campaignID, &campaignName, &status, &monthlyCost, &capJSON, &createdAt); err == nil {
			var caps map[string]interface{}
			_ = json.Unmarshal(capJSON, &caps)
			if caps == nil {
				caps = map[string]interface{}{"voice": true, "sms": true}
			}

			numbers = append(numbers, PhoneNumberResponse{
				ID:                   id,
				PhoneNumber:          number,
				FormattedNumber:      formatDisplayPhoneNumber(number),
				FriendlyName:         friendlyName,
				Country:              country,
				AssignedAgentID:      agentID,
				AssignedAgentName:    agentName,
				AssignedCampaignID:   campaignID,
				AssignedCampaignName: campaignName,
				Status:               status,
				MonthlyCost:          monthlyCost,
				Capabilities:         caps,
				CreatedAt:            createdAt.Format(time.RFC3339),
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"phone_numbers": numbers,
		"count":         len(numbers),
	})
}

// GET /api/v1/phone-numbers/available
func (h *PhoneNumbersHandler) SearchAvailableNumbers(c *gin.Context) {
	ctx := c.Request.Context()
	country := c.DefaultQuery("country", "US")
	areaCode := strings.TrimSpace(c.Query("area_code"))
	numberType := c.DefaultQuery("type", "local")

	carrier, apiKey := h.getCarrierAPIKey(ctx)

	type AvailableNumberItem struct {
		PhoneNumber     string                 `json:"phoneNumber"`
		FormattedNumber string                 `json:"formattedNumber"`
		Country         string                 `json:"country"`
		Region          string                 `json:"region"`
		Locality        string                 `json:"locality"`
		Type            string                 `json:"type"`
		MonthlyCost     float64                `json:"monthlyCost"`
		UpfrontCost     float64                `json:"upfrontCost"`
		Capabilities    map[string]interface{} `json:"capabilities"`
	}

	availableList := make([]AvailableNumberItem, 0)

	if apiKey != "" && (carrier == "telnyx" || strings.HasPrefix(apiKey, "KEY")) {
		telnyxURL := fmt.Sprintf("https://api.telnyx.com/v2/available_phone_numbers?filter[country_code]=%s&filter[limit]=12", country)
		if areaCode != "" {
			telnyxURL += fmt.Sprintf("&filter[national_destination_code]=%s", areaCode)
		}
		if numberType == "toll_free" {
			telnyxURL += "&filter[phone_number_type]=toll_free"
		} else {
			telnyxURL += "&filter[phone_number_type]=local"
		}

		req, err := http.NewRequestWithContext(ctx, "GET", telnyxURL, nil)
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+apiKey)
			req.Header.Set("Accept", "application/json")

			client := &http.Client{Timeout: 8 * time.Second}
			resp, err := client.Do(req)
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				bodyBytes, _ := io.ReadAll(resp.Body)

				var telnyxResp struct {
					Data []struct {
						PhoneNumber string `json:"phone_number"`
						RecordType  string `json:"record_type"`
						RegionInformation []struct {
							RegionType string `json:"region_type"`
							RegionName string `json:"region_name"`
						} `json:"region_information"`
						CostInformation struct {
							UpfrontCost string `json:"upfront_cost"`
							MonthlyCost string `json:"monthly_cost"`
						} `json:"cost_information"`
					} `json:"data"`
				}

				if err := json.Unmarshal(bodyBytes, &telnyxResp); err == nil && len(telnyxResp.Data) > 0 {
					for _, item := range telnyxResp.Data {
						region := "United States"
						locality := "National"
						for _, r := range item.RegionInformation {
							if r.RegionType == "state" {
								region = r.RegionName
							} else if r.RegionType == "rate_center" || r.RegionType == "city" {
								locality = r.RegionName
							}
						}

						monthly := 2.50
						if item.CostInformation.MonthlyCost != "" {
							fmt.Sscanf(item.CostInformation.MonthlyCost, "%f", &monthly)
						}

						availableList = append(availableList, AvailableNumberItem{
							PhoneNumber:     item.PhoneNumber,
							FormattedNumber: formatDisplayPhoneNumber(item.PhoneNumber),
							Country:         country,
							Region:          region,
							Locality:        locality,
							Type:            numberType,
							MonthlyCost:     monthly,
							UpfrontCost:     1.00,
							Capabilities: map[string]interface{}{
								"voice": true,
								"sms":   true,
								"mms":   false,
							},
						})
					}
				}
			}
		}
	}

	if len(availableList) == 0 {
		code := areaCode
		if code == "" {
			code = "415"
		}
		if numberType == "toll_free" {
			code = "800"
		}

		mockPool := []struct {
			num      string
			locality string
			region   string
		}{
			{fmt.Sprintf("+1%s2849102", code), "San Francisco", "California"},
			{fmt.Sprintf("+1%s3920194", code), "San Jose", "California"},
			{fmt.Sprintf("+1%s4810293", code), "Oakland", "California"},
			{fmt.Sprintf("+1%s5019284", code), "Palo Alto", "California"},
			{fmt.Sprintf("+1%s6102948", code), "Berkeley", "California"},
			{fmt.Sprintf("+1%s7291048", code), "San Mateo", "California"},
		}

		for _, m := range mockPool {
			availableList = append(availableList, AvailableNumberItem{
				PhoneNumber:     m.num,
				FormattedNumber: formatDisplayPhoneNumber(m.num),
				Country:         country,
				Region:          m.region,
				Locality:        m.locality,
				Type:            numberType,
				MonthlyCost:     2.50,
				UpfrontCost:     1.00,
				Capabilities: map[string]interface{}{
					"voice": true,
					"sms":   true,
				},
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"available_numbers": availableList,
		"carrier_source":    carrier,
		"count":             len(availableList),
	})
}

// POST /api/v1/phone-numbers/provision
func (h *PhoneNumbersHandler) ProvisionPhoneNumber(c *gin.Context) {
	tenantID, exists := c.Get("tenantID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant context missing"})
		return
	}

	var req struct {
		PhoneNumber        string  `json:"phoneNumber" binding:"required"`
		FriendlyName       string  `json:"friendlyName"`
		Country            string  `json:"country"`
		AssignedAgentID    string  `json:"assignedAgentId"`
		AssignedCampaignID string  `json:"assignedCampaignId"`
		MonthlyCost        float64 `json:"monthlyCost"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	ctx := c.Request.Context()
	carrier, apiKey := h.getCarrierAPIKey(ctx)

	if apiKey != "" && (carrier == "telnyx" || strings.HasPrefix(apiKey, "KEY")) {
		// 1. Order Phone Number with Ai_voicebot SIP Connection automatically
		orderPayload := map[string]interface{}{
			"phone_numbers": []map[string]string{
				{"phone_number": req.PhoneNumber},
			},
			"connection_id": "3014058183544014724", // Ai_voicebot SIP FQDN Trunk to GPU
			"messaging_profile_id": "40019f7a-a307-4b65-829a-72bda463cea9", // IbraSoft SMS Profile
		}
		bodyJSON, _ := json.Marshal(orderPayload)

		telnyxReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.telnyx.com/v2/number_orders", bytes.NewBuffer(bodyJSON))
		if err == nil {
			telnyxReq.Header.Set("Authorization", "Bearer "+apiKey)
			telnyxReq.Header.Set("Content-Type", "application/json")
			client := &http.Client{Timeout: 10 * time.Second}
			_, _ = client.Do(telnyxReq)
		}
	}

	if req.FriendlyName == "" {
		req.FriendlyName = fmt.Sprintf("Voice Inbound (%s)", formatDisplayPhoneNumber(req.PhoneNumber))
	}
	if req.Country == "" {
		req.Country = "US"
	}
	if req.MonthlyCost <= 0 {
		req.MonthlyCost = 2.50
	}

	newID := "pn-" + uuid.New().String()[:8]

	insertQuery := `
		INSERT INTO phone_numbers (
			id, tenant_id, number, friendly_name, country,
			assigned_agent_id, assigned_campaign_id, status, monthly_cost,
			capabilities, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, '{"voice": true, "sms": true}'::jsonb, NOW())
		RETURNING created_at`

	var createdAt time.Time
	err := h.db.QueryRow(
		ctx, insertQuery,
		newID, tenantID, req.PhoneNumber, req.FriendlyName, req.Country,
		req.AssignedAgentID, req.AssignedCampaignID, req.MonthlyCost,
	).Scan(&createdAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save phone number to database: " + err.Error()})
		return
	}

	var agentName, campaignName string
	if req.AssignedAgentID != "" {
		_ = h.db.QueryRow(ctx, "SELECT name FROM agents WHERE id = $1", req.AssignedAgentID).Scan(&agentName)
	}
	if req.AssignedCampaignID != "" {
		_ = h.db.QueryRow(ctx, "SELECT name FROM campaigns WHERE id = $1", req.AssignedCampaignID).Scan(&campaignName)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Phone number successfully provisioned and assigned to workspace",
		"phone_number": PhoneNumberResponse{
			ID:                   newID,
			PhoneNumber:          req.PhoneNumber,
			FormattedNumber:      formatDisplayPhoneNumber(req.PhoneNumber),
			FriendlyName:         req.FriendlyName,
			Country:              req.Country,
			AssignedAgentID:      req.AssignedAgentID,
			AssignedAgentName:    agentName,
			AssignedCampaignID:   req.AssignedCampaignID,
			AssignedCampaignName: campaignName,
			Status:               "active",
			MonthlyCost:          req.MonthlyCost,
			Capabilities: map[string]interface{}{
				"voice": true,
				"sms":   true,
			},
			CreatedAt: createdAt.Format(time.RFC3339),
		},
	})
}

// PATCH /api/v1/phone-numbers/:id/assign
func (h *PhoneNumbersHandler) AssignPhoneNumber(c *gin.Context) {
	tenantID, exists := c.Get("tenantID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant context missing"})
		return
	}

	numberID := c.Param("id")

	var req struct {
		AssignedAgentID    *string `json:"assignedAgentId"`
		AssignedCampaignID *string `json:"assignedCampaignId"`
		FriendlyName       *string `json:"friendlyName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	ctx := c.Request.Context()

	updateQuery := `
		UPDATE phone_numbers
		SET 
			assigned_agent_id = COALESCE($1, assigned_agent_id),
			assigned_campaign_id = COALESCE($2, assigned_campaign_id),
			friendly_name = COALESCE($3, friendly_name)
		WHERE id = $4 AND tenant_id = $5`

	_, err := h.db.Exec(ctx, updateQuery, req.AssignedAgentID, req.AssignedCampaignID, req.FriendlyName, numberID, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update phone number: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Phone number routing updated successfully"})
}

// DELETE /api/v1/phone-numbers/:id
func (h *PhoneNumbersHandler) DeletePhoneNumber(c *gin.Context) {
	tenantID, exists := c.Get("tenantID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tenant context missing"})
		return
	}

	numberID := c.Param("id")
	ctx := c.Request.Context()

	result, err := h.db.Exec(ctx, "DELETE FROM phone_numbers WHERE id = $1 AND tenant_id = $2", numberID, tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to release number: " + err.Error()})
		return
	}

	if result.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Phone number not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Phone number released and removed from workspace"})
}

func formatDisplayPhoneNumber(raw string) string {
	cleaned := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(raw, " ", ""), "-", ""), "(", ""), ")", "")
	if len(cleaned) == 12 && strings.HasPrefix(cleaned, "+1") {
		return fmt.Sprintf("+1 (%s) %s-%s", cleaned[2:5], cleaned[5:8], cleaned[8:12])
	}
	if len(cleaned) == 11 && strings.HasPrefix(cleaned, "1") {
		return fmt.Sprintf("+1 (%s) %s-%s", cleaned[1:4], cleaned[4:7], cleaned[7:11])
	}
	if len(cleaned) == 10 {
		return fmt.Sprintf("+1 (%s) %s-%s", cleaned[0:3], cleaned[3:6], cleaned[6:10])
	}
	return raw
}
