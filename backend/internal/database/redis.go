package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ramzan/backend-chatbot/internal/config"
	"github.com/redis/go-redis/v9"
)

func NewRedisClient(cfg *config.Config) (*redis.Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		Password: cfg.RedisPassword,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Redis client connected successfully!")
	return rdb, nil
}
