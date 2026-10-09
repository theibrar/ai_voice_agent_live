package handlers

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SynthesizeRequest struct {
	Text  string  `json:"text"`
	Voice string  `json:"voice"`
	Speed float64 `json:"speed"`
	Gain  float64 `json:"gain"`
	Lang  string  `json:"lang"`
}

type TTSHandler struct {
	db *pgxpool.Pool
}

func NewTTSHandler(db *pgxpool.Pool) *TTSHandler {
	return &TTSHandler{db: db}
}

// Generate valid 100ms silent 16-bit 24kHz mono PCM WAV to prevent client audio decoder crashes
func generateSilentWAV(sampleRate int, durationMs int) []byte {
	numSamples := (sampleRate * durationMs) / 1000
	numBytes := numSamples * 2
	totalSize := 36 + numBytes

	buf := new(bytes.Buffer)
	buf.WriteString("RIFF")
	_ = binary.Write(buf, binary.LittleEndian, uint32(totalSize))
	buf.WriteString("WAVE")
	buf.WriteString("fmt ")
	_ = binary.Write(buf, binary.LittleEndian, uint32(16))
	_ = binary.Write(buf, binary.LittleEndian, uint16(1))                 // PCM format
	_ = binary.Write(buf, binary.LittleEndian, uint16(1))                 // 1 channel (mono)
	_ = binary.Write(buf, binary.LittleEndian, uint32(sampleRate))        // Sample rate
	_ = binary.Write(buf, binary.LittleEndian, uint32(sampleRate*2))      // Byte rate
	_ = binary.Write(buf, binary.LittleEndian, uint16(2))                 // Block align
	_ = binary.Write(buf, binary.LittleEndian, uint16(16))                // Bits per sample
	buf.WriteString("data")
	_ = binary.Write(buf, binary.LittleEndian, uint32(numBytes))
	buf.Write(make([]byte, numBytes)) // Zeroed silence samples

	return buf.Bytes()
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

	gpuHost := os.Getenv("GPU_HOST")
	if gpuHost == "" {
		gpuHost = "77.104.167.149"
	}
	defaultTTSURL := os.Getenv("TTS_URL")
	if defaultTTSURL == "" {
		defaultTTSURL = os.Getenv("TTS_BASE_URL")
	}
	if defaultTTSURL == "" {
		defaultTTSURL = fmt.Sprintf("http://%s:59643", gpuHost)
	}
	defaultGPUKey := os.Getenv("GPU_API_KEY")
	if defaultGPUKey == "" {
		defaultGPUKey = "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF"
	}

	targetTTSURL := defaultTTSURL
	targetAPIKey := defaultGPUKey

	// 1. Check PostgreSQL ai_engines table for active TTS engine set by Super Admin
	ctx := c.Request.Context()
	if h.db != nil {
		var epURL, key string
		err := h.db.QueryRow(ctx, `
			SELECT COALESCE(endpoint_url, ''), COALESCE(api_key, '')
			FROM ai_engines
			WHERE (engine_type = 'tts' OR id = 'eng-kokoro-tts') AND status = 'active'
			ORDER BY is_global_default DESC, created_at DESC LIMIT 1
		`).Scan(&epURL, &key)
		if err == nil {
			if epURL != "" {
				targetTTSURL = epURL
			}
			if key != "" {
				targetAPIKey = key
			}
		}
	}

	targetTTSURL = strings.TrimRight(targetTTSURL, "/")

	// 2. Try OpenAI audio/speech endpoint first
	openAIPayload := map[string]interface{}{
		"model":           "kokoro-82m",
		"input":           req.Text,
		"voice":           req.Voice,
		"speed":           req.Speed,
		"response_format": "wav",
	}
	openAIBytes, _ := json.Marshal(openAIPayload)

	client := &http.Client{Timeout: 10 * time.Second}

	speechURL := targetTTSURL
	if !strings.HasSuffix(speechURL, "/v1/audio/speech") {
		speechURL = targetTTSURL + "/v1/audio/speech"
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", speechURL, bytes.NewBuffer(openAIBytes))
	if err == nil {
		httpReq.Header.Set("Content-Type", "application/json")
		if targetAPIKey != "" {
			httpReq.Header.Set("X-API-Key", targetAPIKey)
			httpReq.Header.Set("Authorization", "Bearer "+targetAPIKey)
		}
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

	// 3. Fallback to /synthesize
	synthURL := targetTTSURL
	if !strings.HasSuffix(synthURL, "/synthesize") {
		synthURL = targetTTSURL + "/synthesize"
	}

	reqBytes, err := json.Marshal(req)
	if err == nil {
		httpReq2, err := http.NewRequestWithContext(ctx, "POST", synthURL, bytes.NewBuffer(reqBytes))
		if err == nil {
			httpReq2.Header.Set("Content-Type", "application/json")
			if targetAPIKey != "" {
				httpReq2.Header.Set("X-API-Key", targetAPIKey)
				httpReq2.Header.Set("Authorization", "Bearer "+targetAPIKey)
			}
			resp2, err2 := client.Do(httpReq2)
			if err2 == nil && resp2.StatusCode == http.StatusOK {
				defer resp2.Body.Close()
				c.Header("Content-Type", "audio/wav")
				c.Header("Cache-Control", "public, max-age=3600")
				c.Status(http.StatusOK)
				_, _ = io.Copy(c.Writer, resp2.Body)
				return
			}
			if resp2 != nil {
				resp2.Body.Close()
			}
		}
	}

	// 4. Zero-Crash Fallback: serve valid silent WAV so client Audio element never crashes
	c.Header("Content-Type", "audio/wav")
	c.Header("X-Audio-Fallback", "true")
	c.Status(http.StatusOK)
	_, _ = c.Writer.Write(generateSilentWAV(24000, 150))
}
