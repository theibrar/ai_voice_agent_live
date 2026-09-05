package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ramzan/backend-chatbot/internal/services"
)

type RAGHandler struct {
	ragService *services.RAGService
}

func NewRAGHandler(ragService *services.RAGService) *RAGHandler {
	return &RAGHandler{ragService: ragService}
}

func (h *RAGHandler) Search(c *gin.Context) {
	var req services.RAGSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	resp, err := h.ragService.Search(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "RAG Search failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
