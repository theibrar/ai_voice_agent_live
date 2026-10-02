package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

type SynthesizeRequest struct {
	Text  string  `json:"text"`
	Voice string  `json:"voice"`
	Speed float64 `json:"speed"`
	Gain  float64 `json:"gain"`
	Lang  string  `json:"lang"`
}

type TTSHandler struct{}

func NewTTSHandler() *TTSHandler {
	return &TTSHandler{}
}

func (h *TTSHandler) SynthesizeSpeech(c *gin.Context) {
	var req SynthesizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text field is required"})
		return
	}

	if req.Voice == "" {
		req.Voice = "af_bella"
	}
	if req.Speed <= 0 {
		req.Speed = 1.0
	}
	if req.Gain <= 0 {
		req.Gain = 1.0
	}
	if req.Lang == "" {
		req.Lang = "en-us"
	}

	ttsBaseURL := os.Getenv("TTS_BASE_URL")
	if ttsBaseURL == "" {
		ttsBaseURL = "http://77.104.167.149:59643"
	}

	gpuAPIKey := os.Getenv("GPU_API_KEY")
	if gpuAPIKey == "" {
		gpuAPIKey = "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF"
	}

	// Try OpenAI audio/speech endpoint first
	openAIPayload := map[string]interface{}{
		"model":           "kokoro-82m",
		"input":           req.Text,
		"voice":           req.Voice,
		"speed":           req.Speed,
		"response_format": "wav",
	}
	openAIBytes, _ := json.Marshal(openAIPayload)

	client := &http.Client{Timeout: 10 * time.Second}
	ctx := c.Request.Context()

	httpReq, err := http.NewRequestWithContext(ctx, "POST", ttsBaseURL+"/v1/audio/speech", bytes.NewBuffer(openAIBytes))
	if err == nil {
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("X-API-Key", gpuAPIKey)
		httpReq.Header.Set("Authorization", "Bearer "+gpuAPIKey)
		resp, err := client.Do(httpReq)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			c.Header("Content-Type", "audio/wav")
			c.Header("Cache-Control", "public, max-age=3600")
			c.Status(http.StatusOK)
			_, _ = io.Copy(c.Writer, resp.Body)
			return
		}
		if resp != nil {
			resp.Body.Close()
		}
	}

	// Fallback to /synthesize
	targetURL := ttsBaseURL + "/synthesize"
	reqBytes, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize request"})
		return
	}

	httpReq2, err := http.NewRequestWithContext(ctx, "POST", targetURL, bytes.NewBuffer(reqBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build HTTP request"})
		return
	}

	httpReq2.Header.Set("Content-Type", "application/json")
	httpReq2.Header.Set("X-API-Key", gpuAPIKey)
	httpReq2.Header.Set("Authorization", "Bearer "+gpuAPIKey)

	resp, err := client.Do(httpReq2)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "GPU TTS service unreachable: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		c.JSON(resp.StatusCode, gin.H{"error": "GPU TTS error: " + string(respBody)})
		return
	}

	c.Header("Content-Type", "audio/wav")
	c.Header("Cache-Control", "public, max-age=3600")
	c.Status(http.StatusOK)

	_, _ = io.Copy(c.Writer, resp.Body)
}
