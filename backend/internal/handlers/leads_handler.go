package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ramzan/backend-chatbot/internal/repository"
)

type LeadsHandler struct {
	repo repository.LeadRepository
}

func NewLeadsHandler(repo repository.LeadRepository) *LeadsHandler {
	return &LeadsHandler{repo: repo}
}

type UpdateLeadStatusRequest struct {
	LeadID uuid.UUID `json:"lead_id" binding:"required"`
	Status string    `json:"status" binding:"required"`
}

// POST /api/v1/leads/update (LLM tool-call)
func (h *LeadsHandler) UpdateStatus(c *gin.Context) {
	var req UpdateLeadStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	err := h.repo.UpdateLeadStatus(c.Request.Context(), req.LeadID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lead status updated successfully",
		"lead_id": req.LeadID,
		"status":  req.Status,
	})
}
