package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type RAGSearchRequest struct {
	CampaignID uuid.UUID `json:"campaign_id" binding:"required"`
	Query      string    `json:"query" binding:"required"`
	Embedding  []float32 `json:"embedding" binding:"required"`
}

type RAGSearchResult struct {
	Content  string  `json:"content"`
	Distance float64 `json:"distance,omitempty"`
}

type RAGSearchResponse struct {
	Results []RAGSearchResult `json:"results"`
	Source  string            `json:"source"`
	Latency string            `json:"latency"`
}

type RAGService struct {
	dbPool      *pgxpool.Pool
	redisClient *redis.Client
}

func NewRAGService(dbPool *pgxpool.Pool, redisClient *redis.Client) *RAGService {
	return &RAGService{
		dbPool:      dbPool,
		redisClient: redisClient,
	}
}

func (s *RAGService) HashQuery(campaignID string, query string) string {
	hasher := sha256.New()
	hasher.Write([]byte(campaignID + ":" + strings.ToLower(strings.TrimSpace(query))))
	return "rag:cache:" + hex.EncodeToString(hasher.Sum(nil))
}

func FormatVector(v []float32) string {
	strs := make([]string, len(v))
	for i, f := range v {
		strs[i] = fmt.Sprintf("%f", f)
	}
	return "[" + strings.Join(strs, ",") + "]"
}

func (s *RAGService) Search(ctx context.Context, req RAGSearchRequest) (*RAGSearchResponse, error) {
	startTime := time.Now()
	cacheKey := s.HashQuery(req.CampaignID.String(), req.Query)

	cachedData, err := s.redisClient.Get(ctx, cacheKey).Result()
	if err == nil && cachedData != "" {
		var results []RAGSearchResult
		if err := json.Unmarshal([]byte(cachedData), &results); err == nil {
			latency := time.Since(startTime).String()
			log.Printf("[RAG Cache HIT] Key: %s | Latency: %s", cacheKey, latency)
			return &RAGSearchResponse{
				Results: results,
				Source:  "cache",
				Latency: latency,
			}, nil
		}
	}

	vectorStr := FormatVector(req.Embedding)

	query := `
		SELECT content, embedding <-> $2::vector AS distance
		FROM knowledge_base
		WHERE campaign_id = $1 AND (embedding <-> $2::vector) < 0.8
		ORDER BY distance ASC
		LIMIT 5`

	rows, err := s.dbPool.Query(ctx, query, req.CampaignID, vectorStr)
	if err != nil {
		return nil, fmt.Errorf("vector search query error: %w", err)
	}
	defer rows.Close()

	var results []RAGSearchResult
	for rows.Next() {
		var res RAGSearchResult
		if err := rows.Scan(&res.Content, &res.Distance); err != nil {
			return nil, fmt.Errorf("row scan error: %w", err)
		}
		results = append(results, res)
	}

	if results == nil {
		results = []RAGSearchResult{}
	}

	serialized, err := json.Marshal(results)
	if err == nil {
		s.redisClient.Set(ctx, cacheKey, serialized, 5*time.Minute)
	}

	latency := time.Since(startTime).String()
	return &RAGSearchResponse{
		Results: results,
		Source:  "database",
		Latency: latency,
	}, nil
}
