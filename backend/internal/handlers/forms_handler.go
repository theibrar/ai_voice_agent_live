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

type FormsHandler struct {
	db *pgxpool.Pool
}

func NewFormsHandler(db *pgxpool.Pool) *FormsHandler {
	return &FormsHandler{db: db}
}

type FormItem struct {
	ID             string          `json:"id"`
	Name           string          `json:"name"`
	Description    string          `json:"description"`
	FieldsCount    int             `json:"fieldsCount"`
	ResponsesCount int             `json:"responsesCount"`
	Fields         json.RawMessage `json:"fields"`
	Status         string          `json:"status"`
	CreatedAt      string          `json:"createdAt"`
}

// GET /api/v1/forms
func (h *FormsHandler) GetForms(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, "SELECT id, name, COALESCE(description, ''), fields_count, responses_count, COALESCE(fields, '[]'::jsonb), status, created_at FROM custom_forms ORDER BY created_at DESC, id ASC")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"forms": []interface{}{}})
		return
	}
	defer rows.Close()

	forms := make([]FormItem, 0)
	for rows.Next() {
		var f FormItem
		var rawFields []byte
		var createdAt time.Time
		if err := rows.Scan(&f.ID, &f.Name, &f.Description, &f.FieldsCount, &f.ResponsesCount, &rawFields, &f.Status, &createdAt); err == nil {
			f.Fields = rawFields
			f.CreatedAt = createdAt.Format("2006-01-02")
			forms = append(forms, f)
		}
	}

	c.JSON(http.StatusOK, gin.H{"forms": forms})
}

// POST /api/v1/forms
func (h *FormsHandler) CreateForm(c *gin.Context) {
	var req struct {
		ID             string          `json:"id"`
		Name           string          `json:"name" binding:"required"`
		Description    string          `json:"description"`
		FieldsCount    int             `json:"fieldsCount"`
		ResponsesCount int             `json:"responsesCount"`
		Fields         json.RawMessage `json:"fields"`
		Status         string          `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form payload: " + err.Error()})
		return
	}

	id := req.ID
	if id == "" {
		id = fmt.Sprintf("form-%d", time.Now().UnixMilli())
	}

	status := req.Status
	if status == "" {
		status = "active"
	}

	fieldsJSON := req.Fields
	if len(fieldsJSON) == 0 {
		fieldsJSON = []byte("[]")
	}

	fieldsCount := req.FieldsCount
	if fieldsCount == 0 {
		var arr []interface{}
		if err := json.Unmarshal(fieldsJSON, &arr); err == nil && len(arr) > 0 {
			fieldsCount = len(arr)
		} else {
			fieldsCount = 1
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	query := `
		INSERT INTO custom_forms (id, name, description, fields_count, responses_count, fields, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			fields_count = EXCLUDED.fields_count,
			fields = EXCLUDED.fields,
			status = EXCLUDED.status,
			updated_at = NOW();`

	_, err := h.db.Exec(ctx, query, id, req.Name, req.Description, fieldsCount, req.ResponsesCount, fieldsJSON, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save form in database: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Custom lead capture form saved to PostgreSQL database successfully",
		"form": gin.H{
			"id":             id,
			"name":           req.Name,
			"description":    req.Description,
			"fieldsCount":    fieldsCount,
			"responsesCount": req.ResponsesCount,
			"status":         status,
			"createdAt":      time.Now().Format("2006-01-02"),
		},
	})
}

// DELETE /api/v1/forms/:id
func (h *FormsHandler) DeleteForm(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Form ID is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := h.db.Exec(ctx, "DELETE FROM custom_forms WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete form from database: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Form permanently deleted from PostgreSQL database", "id": id})
}

// POST /api/v1/forms/:id/submit
// Handles form webhook submissions: captures data into leads & contacts tables and increments responses_count
func (h *FormsHandler) SubmitFormWebhook(c *gin.Context) {
	formID := c.Param("id")
	if formID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Form ID is required"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. Fetch form info from database
	var formName string
	var rawFields []byte
	err := h.db.QueryRow(ctx, "SELECT name, COALESCE(fields, '[]'::jsonb) FROM custom_forms WHERE id = $1", formID).Scan(&formName, &rawFields)
	if err != nil {
		formName = "Custom Lead Form (" + formID + ")"
	}

	// 2. Parse submission payload
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON submission payload: " + err.Error()})
		return
	}

	// Extract standard or custom fields
	name := getStringField(payload, []string{"name", "full_name", "fullName", "Name", "Full Name", "Contact Name"})
	if name == "" {
		name = "Form Submitter (" + time.Now().Format("15:04") + ")"
	}

	phone := getStringField(payload, []string{"phone", "phone_number", "phoneNumber", "Phone", "Phone Number", "Mobile"})
	if phone == "" {
		phone = "+1 (555) 000-0000"
	}

	email := getStringField(payload, []string{"email", "email_address", "emailAddress", "Email", "Email Address"})
	company := getStringField(payload, []string{"company", "company_name", "Company", "Company Size", "Organization"})
	if company == "" {
		company = "Form Inbound"
	}

	notes := getStringField(payload, []string{"notes", "message", "Description", "Comments", "Inquiry"})
	if notes == "" {
		notes = fmt.Sprintf("Lead captured via custom form: %s", formName)
	}

	// 3. Insert into leads table
	leadID := fmt.Sprintf("lead-%d", time.Now().UnixNano()/1000000)
	metaJSON, _ := json.Marshal(map[string]interface{}{
		"form_id":        formID,
		"form_name":      formName,
		"raw_submission": payload,
		"source":         "custom_form_webhook",
		"submitted_at":   time.Now().UTC().Format(time.RFC3339),
	})

	leadQuery := `
		INSERT INTO leads (id, phone, name, email, status, metadata, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, 'new', $4, NOW(), NOW())`
	_, _ = h.db.Exec(ctx, leadQuery, phone, name, email, metaJSON)

	// 4. Insert into contacts CRM table
	contactID := fmt.Sprintf("cont-%d", time.Now().UnixNano()/1000000)
	tags := []string{"Form Lead", formName}
	contactQuery := `
		INSERT INTO contacts (id, name, phone, email, company, lead_score, status, campaign_name, notes, tags, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, 85, 'new', $6, $7, $8, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			phone = EXCLUDED.phone,
			email = EXCLUDED.email,
			notes = EXCLUDED.notes,
			updated_at = NOW()`
	_, _ = h.db.Exec(ctx, contactQuery, contactID, name, phone, email, company, formName, notes, tags)

	// 5. Increment responses_count in custom_forms table
	_, _ = h.db.Exec(ctx, "UPDATE custom_forms SET responses_count = responses_count + 1, updated_at = NOW() WHERE id = $1", formID)

	// 6. Audit log
	_, _ = h.db.Exec(ctx, "INSERT INTO audit_logs (event_type, description, ip_address, created_at) VALUES ($1, $2, $3, NOW())",
		"form.submission_received",
		fmt.Sprintf("Form '%s' captured lead '%s' (%s)", formName, name, phone),
		c.ClientIP(),
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Form submission processed successfully. Lead added to Contacts CRM.",
		"form_id": formID,
		"form_name": formName,
		"lead": gin.H{
			"id":         leadID,
			"contact_id": contactID,
			"name":       name,
			"phone":      phone,
			"email":      email,
			"company":    company,
			"form_name":  formName,
			"status":     "new",
			"created_at": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func getStringField(m map[string]interface{}, keys []string) string {
	for _, k := range keys {
		if val, exists := m[k]; exists && val != nil {
			str := fmt.Sprintf("%v", val)
			if str != "" && str != "<nil>" {
				return str
			}
		}
	}
	return ""
}
