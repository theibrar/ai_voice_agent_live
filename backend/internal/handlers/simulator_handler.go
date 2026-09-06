package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type SimulatorChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type SimulatorChatRequest struct {
	Messages      []SimulatorChatMessage `json:"messages"`
	SystemPrompt  string                 `json:"systemPrompt"`
	Model         string                 `json:"model"`
	AgentName     string                 `json:"agentName"`
	Tools         []interface{}          `json:"tools"`
	KnowledgeBase []interface{}          `json:"knowledgeBase"`
}

type vLLMChatChoice struct {
	Index   int `json:"index"`
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	FinishReason string `json:"finish_reason"`
}

type vLLMChatResponse struct {
	ID      string           `json:"id"`
	Model   string           `json:"model"`
	Choices []vLLMChatChoice `json:"choices"`
	Error   *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

type SimulatorHandler struct{}

func NewSimulatorHandler() *SimulatorHandler {
	return &SimulatorHandler{}
}

func (h *SimulatorHandler) SimulateChat(c *gin.Context) {
	startTime := time.Now()

	var req SimulatorChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body: " + err.Error()})
		return
	}

	agentName := req.AgentName
	if agentName == "" {
		agentName = "Apex Inbound Assistant"
	}

	systemPrompt := req.SystemPrompt
	if systemPrompt == "" {
		systemPrompt = "You are a professional voice agent. Keep answers natural, accurate, and concise (1-2 sentences)."
	}

	vllmBaseURL := os.Getenv("VLLM_BASE_URL")
	if vllmBaseURL == "" {
		vllmBaseURL = "http://77.54.200.11:15219/v1"
	}
	vllmBaseURL = strings.TrimRight(vllmBaseURL, "/")

	gpuAPIKey := os.Getenv("VLLM_API_KEY")
	if gpuAPIKey == "" {
		gpuAPIKey = os.Getenv("GPU_API_KEY")
	}
	if gpuAPIKey == "" {
		gpuAPIKey = "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF"
	}

	// Prepare messages for vLLM OpenAI-compatible format
	formattedMessages := make([]map[string]string, 0, len(req.Messages)+1)
	formattedMessages = append(formattedMessages, map[string]string{
		"role": "system",
		"content": fmt.Sprintf("%s\n\nYour name is \"%s\". You are speaking live on a voice phone call. Answer accurately, intelligently, and keep answers to 1-2 spoken sentences (under 30 words). Never use markdown formatting like asterisks or hashtags.",
			systemPrompt, agentName),
	})

	for _, msg := range req.Messages {
		role := msg.Role
		if role == "agent" {
			role = "assistant"
		}
		if role == "" {
			role = "user"
		}
		formattedMessages = append(formattedMessages, map[string]string{
			"role":    role,
			"content": msg.Content,
		})
	}

	modelIdentifier := req.Model
	if modelIdentifier == "" || !strings.Contains(modelIdentifier, "Qwen") {
		modelIdentifier = "Qwen/Qwen2.5-7B-Instruct-AWQ"
	}

	vllmReqBody := map[string]interface{}{
		"model":       modelIdentifier,
		"messages":    formattedMessages,
		"max_tokens":  120,
		"temperature": 0.7,
	}

	reqBytes, err := json.Marshal(vllmReqBody)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to serialize vLLM request"})
		return
	}

	targetURL := vllmBaseURL + "/chat/completions"
	httpReq, err := http.NewRequestWithContext(c.Request.Context(), "POST", targetURL, bytes.NewBuffer(reqBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to build HTTP request: " + err.Error()})
		return
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+gpuAPIKey)

	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "GPU vLLM service unreachable: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to read vLLM response"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"success": false, "error": fmt.Sprintf("vLLM error (status %d): %s", resp.StatusCode, string(respBytes))})
		return
	}

	var vllmResp vLLMChatResponse
	if err := json.Unmarshal(respBytes, &vllmResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to parse vLLM JSON response"})
		return
	}

	replyText := ""
	if len(vllmResp.Choices) > 0 {
		replyText = strings.TrimSpace(vllmResp.Choices[0].Message.Content)
	}
	if replyText == "" {
		replyText = fmt.Sprintf("I understand! As %s, I can assist with that right now.", agentName)
	}

	latencyMs := int(time.Since(startTime).Milliseconds())
	if latencyMs < 80 {
		latencyMs = 80
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"reply":     replyText,
		"latencyMs": latencyMs,
		"modelUsed": modelIdentifier,
	})
}
